const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const User = require('../models/user.model');
const CompanyWallet = require('../models/companyWallet.model');
const WalletTransaction = require('../models/walletTransaction.model');
const mongoose = require('mongoose');
const { getOrCreateWallet, creditWallet, creditCompanyWallet } = require('../services/wallet.service');
const { createTokenForOwner } = require('../services/token.service');

const ACTIVATION_FEE = 100;

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

// POST /api/wallet/topup
// NOTE: no real payment gateway is wired up yet (JazzCash/EasyPaisa integration
// is a separate, later piece of work). This stub simulates an already-successful
// payment so the rest of the system (tax deduction, etc.) can be built and tested.
const topup = asyncHandler(async (req, res) => {
  const { amount, provider } = req.body;

  const wallet = await creditWallet(req.user._id, 'main', amount, 'topup', { provider });

  res.status(200).json(new ApiResponse(200, { wallet }, 'Wallet topped up successfully'));
});

// POST /api/tokens/activate
// One-time Rs 100 payment that issues a shopper's first token.
const activate = asyncHandler(async (req, res) => {
  if (req.user.role !== 'shopper') {
    throw new ApiError(403, 'Only shopper accounts can activate a token');
  }

  if (req.user.hasActivatedToken) {
    throw new ApiError(400, 'Your account already has an active token');
  }

  // NOTE: same payment-gateway stub as topup above — treated as instantly paid.
  await creditCompanyWallet(req.user._id, ACTIVATION_FEE, 'activation_fee', {});

  const token = await createTokenForOwner(req.user._id, { generation: 1, pool: 0 });

  await User.findByIdAndUpdate(req.user._id, { hasActivatedToken: true });

  res.status(201).json(new ApiResponse(201, { token }, 'Token activated successfully'));
});

// GET /api/wallet/company (admin only)
const companyWallet = asyncHandler(async (_req, res) => {
  const company = await CompanyWallet.getSingleton();
  res.status(200).json(new ApiResponse(200, { company }, 'Company wallet fetched successfully'));
});

module.exports = { myWallet, getHistory, getUserHistory, topup, activate, companyWallet };
