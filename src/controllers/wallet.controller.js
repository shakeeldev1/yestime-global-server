const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const User = require('../models/user.model');
const CompanyWallet = require('../models/companyWallet.model');
const { getOrCreateWallet, creditWallet, creditCompanyWallet } = require('../services/wallet.service');
const { createTokenForOwner } = require('../services/token.service');

const ACTIVATION_FEE = 100;

// GET /api/wallet/me
const myWallet = asyncHandler(async (req, res) => {
  const wallet = await getOrCreateWallet(req.user._id);
  res.status(200).json(new ApiResponse(200, { wallet }, 'Wallet fetched successfully'));
});

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

module.exports = { myWallet, topup, activate, companyWallet };
