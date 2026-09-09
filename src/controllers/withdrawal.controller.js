const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const Withdrawal = require('../models/withdrawal.model');
const { debitWallet, creditWallet } = require('../services/wallet.service');

// POST /api/wallet/withdraw
// No real payout gateway is wired up yet — the requested amount is debited
// from the user's main wallet immediately (so it can't be spent/withdrawn
// twice) and the request sits `pending` until an admin actually sends the
// money (bank transfer, JazzCash, EasyPaisa) and marks it complete, or
// rejects it, which refunds the amount back to the wallet.
const requestWithdrawal = asyncHandler(async (req, res) => {
  const { amount, method, accountDetails } = req.body;

  await debitWallet(req.user._id, 'main', amount, 'withdrawal', { method, accountDetails });

  const withdrawal = await Withdrawal.create({
    user: req.user._id,
    amount,
    method,
    accountDetails,
  });

  res
    .status(201)
    .json(new ApiResponse(201, { withdrawal }, 'Withdrawal request submitted, pending processing'));
});

// GET /api/wallet/withdrawals/me
const myWithdrawals = asyncHandler(async (req, res) => {
  const withdrawals = await Withdrawal.find({ user: req.user._id }).sort({ createdAt: -1 });
  res.status(200).json(new ApiResponse(200, { withdrawals }, 'Withdrawals fetched successfully'));
});

// GET /api/wallet/withdrawals (admin only)
const listWithdrawals = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.status) filter.status = req.query.status;

  const withdrawals = await Withdrawal.find(filter)
    .sort({ createdAt: -1 })
    .populate({ path: 'user', select: 'name email' });

  res.status(200).json(new ApiResponse(200, { withdrawals }, 'Withdrawals fetched successfully'));
});

const findPendingWithdrawal = async (id) => {
  const withdrawal = await Withdrawal.findById(id);
  if (!withdrawal) {
    throw new ApiError(404, 'Withdrawal request not found');
  }
  if (withdrawal.status !== 'pending') {
    throw new ApiError(400, `This withdrawal request is already ${withdrawal.status}`);
  }
  return withdrawal;
};

// POST /api/wallet/withdrawals/:id/complete (admin only)
const completeWithdrawal = asyncHandler(async (req, res) => {
  const withdrawal = await findPendingWithdrawal(req.params.id);

  withdrawal.status = 'completed';
  withdrawal.processedBy = req.user._id;
  withdrawal.processedAt = new Date();
  await withdrawal.save();

  res.status(200).json(new ApiResponse(200, { withdrawal }, 'Withdrawal marked as completed'));
});

// POST /api/wallet/withdrawals/:id/reject (admin only)
const rejectWithdrawal = asyncHandler(async (req, res) => {
  const withdrawal = await findPendingWithdrawal(req.params.id);

  await creditWallet(withdrawal.user, 'main', withdrawal.amount, 'withdrawal', {
    reversalOf: withdrawal._id,
  });

  withdrawal.status = 'rejected';
  withdrawal.processedBy = req.user._id;
  withdrawal.processedAt = new Date();
  withdrawal.rejectionReason = req.body.reason || null;
  await withdrawal.save();

  res
    .status(200)
    .json(new ApiResponse(200, { withdrawal }, 'Withdrawal rejected and amount refunded to wallet'));
});

module.exports = {
  requestWithdrawal,
  myWithdrawals,
  listWithdrawals,
  completeWithdrawal,
  rejectWithdrawal,
};
