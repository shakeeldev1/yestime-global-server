const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const User = require('../models/user.model');
const Wallet = require('../models/wallet.model');
const Token = require('../models/token.model');
const Purchase = require('../models/purchase.model');
const Withdrawal = require('../models/withdrawal.model');
const Draw = require('../models/draw.model');
const CompanyWallet = require('../models/companyWallet.model');

const paginate = (query) => {
  const page = Math.max(Number(query.page) || 1, 1);
  const limit = Math.min(Math.max(Number(query.limit) || 20, 1), 100);
  return { page, limit, skip: (page - 1) * limit };
};

// GET /api/admin/users
const listUsers = asyncHandler(async (req, res) => {
  const { role, businessType, isVerified, isBlocked, search } = req.query;
  const { page, limit, skip } = paginate(req.query);

  const filter = {};
  if (role) filter.role = role;
  if (businessType) filter.businessType = businessType;
  if (isVerified !== undefined) filter.isVerified = isVerified === 'true';
  if (isBlocked !== undefined) filter.isBlocked = isBlocked === 'true';
  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
    ];
  }

  const [users, total] = await Promise.all([
    User.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    User.countDocuments(filter),
  ]);

  res.status(200).json(
    new ApiResponse(
      200,
      { users, pagination: { page, limit, total, pages: Math.ceil(total / limit) } },
      'Users fetched successfully'
    )
  );
});

// GET /api/admin/users/:id
const getUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  const [wallet, tokenCount, purchaseCount] = await Promise.all([
    Wallet.findOne({ user: user._id }),
    Token.countDocuments({ owner: user._id }),
    Purchase.find({ $or: [{ shopper: user._id }, { shopkeeper: user._id }] }).countDocuments(),
  ]);

  res.status(200).json(
    new ApiResponse(200, { user, wallet: wallet || null, tokenCount, purchaseCount }, 'User fetched successfully')
  );
});

// POST /api/admin/users
// Lets an admin create an account directly (including other admins), bypassing
// email OTP verification — the account is marked verified immediately.
const createUser = asyncHandler(async (req, res) => {
  const { name, email, password, role, businessType } = req.body;

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new ApiError(409, 'An account with this email already exists');
  }

  const user = await User.create({
    name,
    email,
    password,
    role,
    businessType: role === 'shopkeeper' ? businessType : null,
    isVerified: true,
  });

  res.status(201).json(new ApiResponse(201, { user }, 'User created successfully'));
});

// PATCH /api/admin/users/:id
const updateUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  const { name, role, businessType, taxRate } = req.body;

  if (name !== undefined) user.name = name;
  if (role !== undefined) user.role = role;
  if (taxRate !== undefined) user.taxRate = taxRate;

  if (businessType !== undefined) {
    user.businessType = user.role === 'shopkeeper' ? businessType : null;
  } else if (role !== undefined && role !== 'shopkeeper') {
    user.businessType = null;
  }

  if (user.role === 'shopkeeper' && !user.businessType) {
    throw new ApiError(400, 'businessType is required for shopkeeper accounts');
  }

  await user.save();

  res.status(200).json(new ApiResponse(200, { user }, 'User updated successfully'));
});

// POST /api/admin/users/:id/block
const blockUser = asyncHandler(async (req, res) => {
  if (req.params.id === req.user._id.toString()) {
    throw new ApiError(400, 'You cannot block your own account');
  }

  const user = await User.findByIdAndUpdate(req.params.id, { isBlocked: true }, { new: true });
  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  res.status(200).json(new ApiResponse(200, { user }, 'User blocked successfully'));
});

// POST /api/admin/users/:id/unblock
const unblockUser = asyncHandler(async (req, res) => {
  const user = await User.findByIdAndUpdate(req.params.id, { isBlocked: false }, { new: true });
  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  res.status(200).json(new ApiResponse(200, { user }, 'User unblocked successfully'));
});

// DELETE /api/admin/users/:id
// Only allowed when the account has no financial footprint — otherwise block
// it instead, to avoid orphaning wallet/token/purchase records.
const deleteUser = asyncHandler(async (req, res) => {
  if (req.params.id === req.user._id.toString()) {
    throw new ApiError(400, 'You cannot delete your own account');
  }

  const user = await User.findById(req.params.id);
  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  const [wallet, tokenCount] = await Promise.all([
    Wallet.findOne({ user: user._id }),
    Token.countDocuments({ owner: user._id }),
  ]);

  const hasBalance = wallet && (wallet.mainBalance > 0 || wallet.lotteryBalance > 0);
  if (hasBalance || tokenCount > 0) {
    throw new ApiError(
      400,
      'This user has wallet balance or tokens on record and cannot be deleted — block the account instead'
    );
  }

  await User.findByIdAndDelete(user._id);
  if (wallet) await Wallet.deleteOne({ _id: wallet._id });

  res.status(200).json(new ApiResponse(200, null, 'User deleted successfully'));
});

// GET /api/admin/stats
const getStats = asyncHandler(async (req, res) => {
  const [
    totalUsers,
    totalShoppers,
    totalShopkeepers,
    totalBlocked,
    totalTokens,
    completedTokens,
    purchaseAgg,
    totalDraws,
    totalWins,
    pendingWithdrawals,
    company,
  ] = await Promise.all([
    User.countDocuments(),
    User.countDocuments({ role: 'shopper' }),
    User.countDocuments({ role: 'shopkeeper' }),
    User.countDocuments({ isBlocked: true }),
    Token.countDocuments(),
    Token.countDocuments({ status: 'completed' }),
    Purchase.aggregate([{ $group: { _id: null, count: { $sum: 1 }, totalAmount: { $sum: '$amount' } } }]),
    Draw.countDocuments(),
    Draw.countDocuments({ winnerToken: { $ne: null } }),
    Withdrawal.aggregate([
      { $match: { status: 'pending' } },
      { $group: { _id: null, count: { $sum: 1 }, totalAmount: { $sum: '$amount' } } },
    ]),
    CompanyWallet.getSingleton(),
  ]);

  res.status(200).json(
    new ApiResponse(
      200,
      {
        users: { total: totalUsers, shoppers: totalShoppers, shopkeepers: totalShopkeepers, blocked: totalBlocked },
        tokens: { total: totalTokens, completed: completedTokens },
        purchases: {
          count: purchaseAgg[0]?.count || 0,
          totalAmount: purchaseAgg[0]?.totalAmount || 0,
        },
        draws: { total: totalDraws, winners: totalWins },
        pendingWithdrawals: {
          count: pendingWithdrawals[0]?.count || 0,
          totalAmount: pendingWithdrawals[0]?.totalAmount || 0,
        },
        companyWalletBalance: company.balance,
      },
      'Stats fetched successfully'
    )
  );
});

module.exports = { listUsers, getUser, createUser, updateUser, blockUser, unblockUser, deleteUser, getStats };
