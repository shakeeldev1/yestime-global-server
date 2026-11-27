const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const Shop = require('../models/shop.model');
const ShopDeletionRequest = require('../models/shopDeletionRequest.model');
const User = require('../models/user.model');
const { getOrCreateWallet } = require('../services/wallet.service');
const { uploadImageBuffer } = require('../lib/cloudinary');
const { notifyAdmin, notifyUser } = require('../utils/mailer');
const { getCompanyRate } = require('../utils/commission');
const mongoose = require('mongoose');

const MIN_SHOPKEEPER_WALLET_BALANCE = 3000;
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
  const filter = {
    isBlocked: false,
    $or: [{ approvalStatus: 'approved' }, { approvalStatus: { $exists: false }, isVerified: true }],
  };

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
  const [shops, deletionRequests] = await Promise.all([
    Shop.find({ owner: req.user._id }).sort({ createdAt: -1 }).lean(),
    ShopDeletionRequest.find({ owner: req.user._id })
      .sort({ createdAt: -1 })
      .select('shopId status reason createdAt reviewedAt reviewNote')
      .lean(),
  ]);
  const latestRequestByShop = new Map();
  for (const request of deletionRequests) {
    const shopId = String(request.shopId);
    if (!latestRequestByShop.has(shopId)) latestRequestByShop.set(shopId, request);
  }
  const shopsWithCommission = shops.map((shop) => {
    const deletionRequest = latestRequestByShop.get(String(shop._id));
    return {
      ...shop,
      commissionRate: shop.commissionRate ?? getCompanyRate(shop.businessCategories?.[0]),
      deletionRequest: deletionRequest
        ? {
            _id: deletionRequest._id,
            status: deletionRequest.status,
            reason: deletionRequest.reason,
            requestedAt: deletionRequest.createdAt,
            reviewedAt: deletionRequest.reviewedAt,
            reviewNote: deletionRequest.reviewNote,
          }
        : null,
    };
  });
  res.status(200).json(new ApiResponse(200, { shops: shopsWithCommission }, 'Your shops fetched successfully'));
});

// POST /api/shopkeepers/register
// Each shop registration requires Rs 3000 in the main wallet but does not debit it.
const registerShopkeeper = asyncHandler(async (req, res) => {
  const user = req.user;

  if (user.role !== 'shopper' && user.role !== 'shopkeeper') {
    throw new ApiError(400, 'Only shopper or shopkeeper accounts can register a shop');
  }

  const { shopName, phoneNumber, address, description, categories, city, lat, lng } = req.body;
  const businessType = getBusinessType(categories[0]);
  const commissionRate = getCompanyRate(categories[0]);
  let imageUrl = null;

  if (req.file) {
    const uploadedImage = await uploadImageBuffer(req.file.buffer, {
      folder: 'yestime-global/shop-images',
    });
    imageUrl = uploadedImage.secure_url;
  }

  const session = await mongoose.startSession();
  let shop;
  try {
    await session.withTransaction(async () => {
      const isFirstShop = !(await Shop.exists({ owner: user._id }).session(session));
      const wallet = await getOrCreateWallet(user._id, { session });
      if (wallet.mainBalance < MIN_SHOPKEEPER_WALLET_BALANCE) {
        throw new ApiError(400, 'Your main wallet balance must be PKR 3,000 or more to register a shop.');
      }

      [shop] = await Shop.create(
        [{
          owner: user._id,
          businessType,
          shopName,
          phoneNumber,
          businessAddress: address,
          businessDescription: description || null,
          businessImage: imageUrl,
          businessCategories: [...new Set(categories)],
          commissionRate,
          city,
          location: { type: 'Point', coordinates: [lng, lat] },
          registrationFee: 0,
          approvalStatus: 'pending',
          isVerified: false,
        }],
        { session }
      );

      if (isFirstShop) {
        if (user.role === 'shopper') user.role = 'shopkeeper';
        user.businessType = businessType;
        user.shopName = shopName;
        user.phoneNumber = phoneNumber;
        user.businessAddress = address;
        user.businessDescription = description || null;
        user.businessImage = imageUrl;
        user.businessCategories = [...new Set(categories)];
        user.taxRate = commissionRate;
        user.shopkeeperRegistrationFee = 0;
        user.shopkeeperRegisteredAt = new Date();
        await user.save({ session });
      }

    });
  } finally {
    await session.endSession();
  }

  Promise.all([
    notifyAdmin({
      subject: `New shop registration: ${shop.shopName}`,
      html: `<p>A new shop registration is awaiting review.</p><p><strong>Shop:</strong> ${shop.shopName}<br><strong>Owner:</strong> ${user.name} (${user.email})<br><strong>Location:</strong> ${shop.city}</p><p>Review it in the admin dashboard.</p>`,
    }),
    notifyUser({
      to: user.email,
      subject: `Shop registration received: ${shop.shopName}`,
      html: `<p>Hi ${user.name},</p><p>Your shop <strong>${shop.shopName}</strong> has been registered and is pending admin review. We will email you again when a decision is made.</p>`,
    }),
  ]).catch((error) => console.error('Failed to notify shop registration parties:', error.message));

  res.status(201).json(
    new ApiResponse(
      201,
      { shop, registrationFee: 0, minimumWalletBalance: MIN_SHOPKEEPER_WALLET_BALANCE },
      'Shop registered successfully'
    )
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

  const { shopName, phoneNumber, address, description, categories, city, lat, lng } = req.body;

  if (shopName !== undefined) shop.shopName = shopName;
  if (phoneNumber !== undefined) shop.phoneNumber = phoneNumber;
  if (address !== undefined) shop.businessAddress = address;
  if (description !== undefined) shop.businessDescription = description || null;
  if (req.file) {
    const uploadedImage = await uploadImageBuffer(req.file.buffer, {
      folder: 'yestime-global/shop-images',
    });
    shop.businessImage = uploadedImage.secure_url;
  }
  if (categories !== undefined) {
    shop.businessCategories = [...new Set(categories)];
    shop.businessType = getBusinessType(categories[0]);
    shop.commissionRate = getCompanyRate(categories[0]);
  }
  if (city !== undefined) shop.city = city;
  if (lat !== undefined && lng !== undefined) {
    shop.location = { type: 'Point', coordinates: [lng, lat] };
  }

  await shop.save();

  if (categories !== undefined) {
    const primaryShop = await Shop.findOne({ owner: shop.owner })
      .sort({ createdAt: 1, _id: 1 })
      .select('_id')
      .lean();
    if (primaryShop && String(primaryShop._id) === String(shop._id)) {
      await User.updateOne(
        { _id: shop.owner },
        {
          $set: {
            businessType: shop.businessType,
            businessCategories: shop.businessCategories,
            taxRate: shop.commissionRate,
          },
        }
      );
    }
  }

  res.status(200).json(new ApiResponse(200, { shop }, 'Shop updated successfully'));
});

module.exports = { registerShopkeeper, listShopkeepers, myShops, updateShop };
