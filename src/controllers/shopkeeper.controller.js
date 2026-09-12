const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const User = require('../models/user.model');
const { debitWallet, creditCompanyWallet, getOrCreateWallet } = require('../services/wallet.service');

const SHOPKEEPER_REGISTRATION_FEE = 1500;

const getBusinessType = (category) => {
  if (category === 'property') return 'property';
  if (category === 'car') return 'car';
  if (category === 'motorcycle_scooty') return 'bike';
  return 'shop';
};

// GET /api/shopkeepers
const listShopkeepers = asyncHandler(async (req, res) => {
  const page = Math.max(Number(req.query.page) || 1, 1);
  const limit = Math.min(Math.max(Number(req.query.limit) || 20, 1), 100);
  const filter = { role: 'shopkeeper', isVerified: true, isBlocked: false };

  if (req.query.category) filter.businessCategories = req.query.category;

  if (req.query.search) {
    const search = req.query.search.trim();
    filter.$or = [
      { shopName: { $regex: search, $options: 'i' } },
      { businessAddress: { $regex: search, $options: 'i' } },
      { businessDescription: { $regex: search, $options: 'i' } },
    ];
  }

  const skip = (page - 1) * limit;
  const [shopkeepers, total] = await Promise.all([
    User.find(filter)
      .select('shopName phoneNumber businessAddress businessDescription businessImage businessCategories businessType shopkeeperRegisteredAt')
      .sort({ shopkeeperRegisteredAt: -1, _id: -1 })
      .skip(skip)
      .limit(limit),
    User.countDocuments(filter),
  ]);

  res.status(200).json(
    new ApiResponse(
      200,
      { shopkeepers, pagination: { page, limit, total, pages: Math.ceil(total / limit) } },
      'Shopkeepers fetched successfully'
    )
  );
});

// POST /api/shopkeepers/register
const registerShopkeeper = asyncHandler(async (req, res) => {
  const user = req.user;

  if (user.role !== 'shopper') {
    throw new ApiError(400, 'Only shopper accounts can register as a shopkeeper');
  }

  const { shopName, phoneNumber, address, description, image, categories } = req.body;
  const businessType = getBusinessType(categories[0]);

  const wallet = await getOrCreateWallet(user._id);
  if (wallet.mainBalance < SHOPKEEPER_REGISTRATION_FEE) {
    throw new ApiError(400, 'Insufficient main wallet balance for the Rs 1500 shopkeeper registration fee');
  }

  await debitWallet(user._id, 'main', SHOPKEEPER_REGISTRATION_FEE, 'shopkeeper_registration_fee', {
    shopName,
    categories,
  });
  await creditCompanyWallet(user._id, SHOPKEEPER_REGISTRATION_FEE, 'shopkeeper_registration_fee', {
    shopName,
    categories,
  });

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

  res.status(201).json(
    new ApiResponse(
      201,
      { user, registrationFee: SHOPKEEPER_REGISTRATION_FEE },
      'Shopkeeper registered successfully'
    )
  );
});

module.exports = { registerShopkeeper, listShopkeepers };