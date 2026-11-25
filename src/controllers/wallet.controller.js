const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const User = require('../models/user.model');
const CompanyWallet = require('../models/companyWallet.model');
const WalletTransaction = require('../models/walletTransaction.model');
const mongoose = require('mongoose');
const {
  getOrCreateWallet,
  debitWallet,
  creditWallet,
  creditCompanyWallet,
} = require('../services/wallet.service');
const { createTokenForOwner, contributeToActiveToken } = require('../services/token.service');

const ACTIVATION_FEE = 1000;
const INITIAL_LOTTERY_BONUS = 21000;

// GET /api/wallet/me
const myWallet = asyncHandler(async (req, res) => {
  const wallet = await getOrCreateWallet(req.user._id);
  res.status(200).json(new ApiResponse(200, { wallet }, 'Wallet fetched successfully'));
});

const getHistory = asyncHandler(async (req, res) => {
  if (req.query.wallet === 'company') {
    throw new ApiError(403, 'Company wallet history is available to admins only');
  }

  const { page, limit, skip } = getPagination(req.query);
  const filter = buildHistoryFilter(req.query, req.user._id, false);

  const [transactions, total] = await Promise.all([
    WalletTransaction.find(filter).sort({ createdAt: -1, _id: -1 }).skip(skip).limit(limit),
    WalletTransaction.countDocuments(filter),
  ]);

  res.status(200).json(
    new ApiResponse(
      200,
      { transactions, pagination: { page, limit, total, pages: Math.ceil(total / limit) } },
      'Wallet history fetched successfully'
    )
  );
});

const getUserHistory = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    throw new ApiError(400, 'Invalid user id');
  }

  const user = await User.findById(userId).select('name email role');
  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  const { page, limit, skip } = getPagination(req.query);
  const filter = buildHistoryFilter(req.query, user._id, true);
  const [transactions, total] = await Promise.all([
    WalletTransaction.find(filter).sort({ createdAt: -1, _id: -1 }).skip(skip).limit(limit),
    WalletTransaction.countDocuments(filter),
  ]);

  res.status(200).json(
    new ApiResponse(
      200,
      { user, transactions, pagination: { page, limit, total, pages: Math.ceil(total / limit) } },
      'Wallet history fetched successfully'
    )
  );
});

const getPagination = (query) => {
  const page = Math.max(Number(query.page) || 1, 1);
  const limit = Math.min(Math.max(Number(query.limit) || 20, 1), 100);
  return { page, limit, skip: (page - 1) * limit };
};

const buildHistoryFilter = (query, userId, includeCompany) => {
  const filter = { user: userId };
  if (!includeCompany) filter.wallet = { $in: ['main', 'lottery'] };
  if (query.wallet) filter.wallet = query.wallet;
  if (query.direction) filter.direction = query.direction;
  if (query.type) filter.type = query.type;
  return filter;
};

// POST /api/tokens/activate
// One-time Rs 1,000 payment that issues a shopper's first token and unlocks its first six levels.
const activate = asyncHandler(async (req, res) => {
  if (req.user.role !== 'shopper') {
    throw new ApiError(403, 'Only shopper accounts can activate a token');
  }

  if (req.user.hasActivatedToken) {
    throw new ApiError(400, 'Your account has already activated its first token');
  }

  const session = await mongoose.startSession();
  let activation;

  try {
    await session.withTransaction(async () => {
      const user = await User.findOneAndUpdate(
        { _id: req.user._id, role: 'shopper', hasActivatedToken: { $ne: true } },
        { $set: { hasActivatedToken: true } },
        { new: true, session }
      );
      if (!user) {
        throw new ApiError(400, 'Your account has already activated its first token');
      }

      const wallet = await getOrCreateWallet(user._id, { session });
      if (wallet.mainBalance < ACTIVATION_FEE) {
        throw new ApiError(400, 'Insufficient main wallet balance for the Rs 1,000 activation fee');
      }

      await debitWallet(user._id, 'main', ACTIVATION_FEE, 'activation_fee', {}, { session });
      await creditCompanyWallet(user._id, ACTIVATION_FEE, 'activation_fee', {}, { session });

      await createTokenForOwner(user._id, { generation: 1, pool: 0, session });
      const contribution = await contributeToActiveToken(user._id, INITIAL_LOTTERY_BONUS, { session });
      await creditWallet(
        user._id,
        'lottery',
        INITIAL_LOTTERY_BONUS,
        'activation_bonus',
        {
          tokenNumber: contribution.token.tokenNumber,
          unlockedLevels: contribution.leveledUp,
        },
        { session }
      );

      activation = {
        token: contribution.token,
        bonus: {
          lotteryBalance: INITIAL_LOTTERY_BONUS,
          unlockedLevels: contribution.leveledUp,
        },
      };
    });
  } finally {
    await session.endSession();
  }

  res.status(201).json(new ApiResponse(201, activation, 'Token activated successfully'));
});

// GET /api/wallet/company (admin only)
const companyWallet = asyncHandler(async (_req, res) => {
  const company = await CompanyWallet.getSingleton();
  res.status(200).json(new ApiResponse(200, { company }, 'Company wallet fetched successfully'));
});

module.exports = { myWallet, getHistory, getUserHistory, activate, companyWallet };
