const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const Shop = require('../models/shop.model');
const { debitWallet, creditCompanyWallet, getOrCreateWallet } = require('../services/wallet.service');

const SHOPKEEPER_REGISTRATION_FEE = 1500;
const DEFAULT_SEARCH_RADIUS_KM = 50;

const getBusinessType = (category) => {
  if (category === 'property') return 'property';
  if (category === 'car') return 'car';
  if (category === 'motorcycle_scooty') return 'bike';
  return 'shop';
};

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// GET /api/shopkeepers
// Default: no location params -> newest shops first.
// `city` param: exact (case-insensitive) match, shows shops in that city only.
// `lat`+`lng` params: shops near that point (e.g. the shopper's current location),
// nearest first, within `radiusKm` (default 50km).
const listShopkeepers = asyncHandler(async (req, res) => {
  const page = Math.max(Number(req.query.page) || 1, 1);
  const limit = Math.min(Math.max(Number(req.query.limit) || 20, 1), 100);
  const filter = { isVerified: true, isBlocked: false };

  if (req.query.category) filter.businessCategories = req.query.category;

  if (req.query.search) {
    const search = escapeRegex(req.query.search.trim());
    filter.$or = [
      { shopName: { $regex: search, $options: 'i' } },
      { businessAddress: { $regex: search, $options: 'i' } },
      { businessDescription: { $regex: search, $options: 'i' } },
      { city: { $regex: search, $options: 'i' } },
    ];
  }

  if (req.query.city) {
    filter.city = { $regex: `^${escapeRegex(req.query.city.trim())}$`, $options: 'i' };
  }

  const hasCoords = req.query.lat !== undefined && req.query.lng !== undefined;
  const skip = (page - 1) * limit;

  if (!req.query.city && hasCoords) {
    const lat = Number(req.query.lat);
    const lng = Number(req.query.lng);
    const radiusKm = req.query.radiusKm ? Number(req.query.radiusKm) : DEFAULT_SEARCH_RADIUS_KM;

    const [result] = await Shop.aggregate([
      {
        $geoNear: {
          near: { type: 'Point', coordinates: [lng, lat] },
          distanceField: 'distanceMeters',
          maxDistance: radiusKm * 1000,
          spherical: true,
          query: filter,
        },
      },
      {
        $facet: {
          data: [{ $skip: skip }, { $limit: limit }],
          totalCount: [{ $count: 'count' }],
        },
      },
    ]);

    const shops = result?.data || [];
    const total = result?.totalCount?.[0]?.count || 0;

    return res.status(200).json(
      new ApiResponse(
        200,
        { shops, pagination: { page, limit, total, pages: Math.ceil(total / limit) } },
        'Shops fetched successfully'
      )
    );
  }

  const [shops, total] = await Promise.all([
    Shop.find(filter)
      .sort({ createdAt: -1, _id: -1 })
      .skip(skip)
      .limit(limit),
    Shop.countDocuments(filter),
  ]);

  res.status(200).json(
    new ApiResponse(
      200,
      { shops, pagination: { page, limit, total, pages: Math.ceil(total / limit) } },
      'Shops fetched successfully'
    )
  );
});

// GET /api/shopkeepers/mine (authenticated) — the current user's own shops
const myShops = asyncHandler(async (req, res) => {
  const shops = await Shop.find({ owner: req.user._id }).sort({ createdAt: -1 });
  res.status(200).json(new ApiResponse(200, { shops }, 'Your shops fetched successfully'));
});

// POST /api/shopkeepers/register
// A user can register any number of shops; each one costs the flat
// Rs 1500 registration fee, debited from their main wallet.
const registerShopkeeper = asyncHandler(async (req, res) => {
  const user = req.user;

  if (user.role !== 'shopper' && user.role !== 'shopkeeper') {
    throw new ApiError(400, 'Only shopper or shopkeeper accounts can register a shop');
  }

  const { shopName, phoneNumber, address, description, image, categories, city, lat, lng } = req.body;
  const businessType = getBusinessType(categories[0]);

  const wallet = await getOrCreateWallet(user._id);
  if (wallet.mainBalance < SHOPKEEPER_REGISTRATION_FEE) {
    throw new ApiError(400, 'Insufficient main wallet balance for the Rs 1500 shop registration fee');
  }

  await debitWallet(user._id, 'main', SHOPKEEPER_REGISTRATION_FEE, 'shopkeeper_registration_fee', {
    shopName,
    categories,
  });
  await creditCompanyWallet(user._id, SHOPKEEPER_REGISTRATION_FEE, 'shopkeeper_registration_fee', {
    shopName,
    categories,
  });

  const shop = await Shop.create({
    owner: user._id,
    businessType,
    shopName,
    phoneNumber,
    businessAddress: address,
    businessDescription: description || null,
    businessImage: image || null,
    businessCategories: [...new Set(categories)],
    city,
    location: { type: 'Point', coordinates: [lng, lat] },
    registrationFee: SHOPKEEPER_REGISTRATION_FEE,
  });

  // First shop also flips the account into shopkeeper mode and keeps the
  // account-level business fields (used elsewhere for tax/commission and
  // display purposes) in sync with it. Later shops don't touch these —
  // they only add another entry to the directory.
  if (user.role === 'shopper') {
    user.role = 'shopkeeper';
    user.businessType = businessType;
    user.shopName = shopName;
    user.phoneNumber = phoneNumber;
    user.businessAddress = address;
    user.businessDescription = description || null;
    user.businessImage = image || null;
    user.businessCategories = [...new Set(categories)];
    user.shopkeeperRegistrationFee = SHOPKEEPER_REGISTRATION_FEE;
    user.shopkeeperRegisteredAt = new Date();
    await user.save();
  }

  res.status(201).json(
    new ApiResponse(201, { shop, registrationFee: SHOPKEEPER_REGISTRATION_FEE }, 'Shop registered successfully')
  );
});

// PATCH /api/shopkeepers/:shopId (authenticated, owner only)
// Mainly for setting/correcting a shop's city + coordinates after the fact —
// e.g. shops backfilled from legacy accounts start with no location.
const updateShop = asyncHandler(async (req, res) => {
  const shop = await Shop.findById(req.params.shopId);
  if (!shop) {
    throw new ApiError(404, 'Shop not found');
  }
  if (!shop.owner.equals(req.user._id)) {
    throw new ApiError(403, 'You do not own this shop');
  }

  const { shopName, phoneNumber, address, description, image, categories, city, lat, lng } = req.body;

  if (shopName !== undefined) shop.shopName = shopName;
  if (phoneNumber !== undefined) shop.phoneNumber = phoneNumber;
  if (address !== undefined) shop.businessAddress = address;
  if (description !== undefined) shop.businessDescription = description || null;
  if (image !== undefined) shop.businessImage = image || null;
  if (categories !== undefined) {
    shop.businessCategories = [...new Set(categories)];
    shop.businessType = getBusinessType(categories[0]);
  }
  if (city !== undefined) shop.city = city;
  if (lat !== undefined && lng !== undefined) {
    shop.location = { type: 'Point', coordinates: [lng, lat] };
  }

  await shop.save();

  res.status(200).json(new ApiResponse(200, { shop }, 'Shop updated successfully'));
});

module.exports = { registerShopkeeper, listShopkeepers, myShops, updateShop };
