const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const Withdrawal = require('../models/withdrawal.model');
const { debitWallet, creditWallet } = require('../services/wallet.service');
const { notifyAdmin, notifyUser } = require('../utils/mailer');

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

  const pendingSubject = `Withdrawal request received: PKR ${withdrawal.amount}`;
  const pendingHtml = `
    <div style="font-family: Arial, sans-serif; max-width: 620px; margin: auto;">
      <h2>Withdrawal request received</h2>
      <p>Your withdrawal request for <strong>PKR ${withdrawal.amount}</strong> is pending admin review.</p>
      <p>The amount has been reserved from your main wallet until the request is completed or rejected.</p>
    </div>
  `;
  Promise.all([
    notifyAdmin({
      subject: `New withdrawal request: PKR ${withdrawal.amount}`,
      html: `
      <div style="font-family: Arial, sans-serif; max-width: 620px; margin: auto;">
        <h2>New withdrawal request</h2>
        <p>A user submitted a withdrawal request that needs review and manual payout.</p>
        <table cellpadding="8" cellspacing="0" style="border-collapse: collapse;">
          <tr><td><strong>User</strong></td><td>${req.user.name} (${req.user.email})</td></tr>
          <tr><td><strong>Amount</strong></td><td>PKR ${withdrawal.amount}</td></tr>
          <tr><td><strong>Method</strong></td><td>${withdrawal.method}</td></tr>
          <tr><td><strong>Account details</strong></td><td>${withdrawal.accountDetails}</td></tr>
        </table>
        <p>Send the money manually, then mark the request as completed in the admin dashboard.</p>
      </div>
    `,
    }),
    notifyUser({ to: req.user.email, subject: pendingSubject, html: pendingHtml }),
  ]).catch((error) => console.error('Failed to notify withdrawal request parties:', error.message));

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
  const withdrawal = await Withdrawal.findById(id).populate({ path: 'user', select: 'name email' });
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

  const subject = `Withdrawal completed: PKR ${withdrawal.amount}`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 620px; margin: auto;">
      <h2>Withdrawal completed</h2>
      <p>Your withdrawal request for <strong>PKR ${withdrawal.amount}</strong> has been marked as completed.</p>
      <p>The payout was sent through ${withdrawal.method} to ${withdrawal.accountDetails}.</p>
    </div>
  `;
  Promise.all([
    notifyAdmin({ subject, html: `<p>Withdrawal completed by ${req.user.name} for ${withdrawal.user.email}.</p>${html}` }),
    notifyUser({ to: withdrawal.user.email, subject, html }),
  ]).catch((error) => console.error('Failed to notify withdrawal status change:', error.message));

  res.status(200).json(new ApiResponse(200, { withdrawal }, 'Withdrawal marked as completed'));
});

// POST /api/wallet/withdrawals/:id/reject (admin only)
const rejectWithdrawal = asyncHandler(async (req, res) => {
  const withdrawal = await findPendingWithdrawal(req.params.id);

  await creditWallet(withdrawal.user._id, 'main', withdrawal.amount, 'withdrawal', {
    reversalOf: withdrawal._id,
  });

  withdrawal.status = 'rejected';
  withdrawal.processedBy = req.user._id;
  withdrawal.processedAt = new Date();
  withdrawal.rejectionReason = req.body.reason || null;
  await withdrawal.save();

  const subject = `Withdrawal rejected: PKR ${withdrawal.amount}`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 620px; margin: auto;">
      <h2>Withdrawal request rejected</h2>
      <p>Your withdrawal request for <strong>PKR ${withdrawal.amount}</strong> was rejected.</p>
      <p>Reason: ${withdrawal.rejectionReason || 'The payout details could not be verified.'}</p>
      <p>The amount has been refunded to your main wallet.</p>
    </div>
  `;
  Promise.all([
    notifyAdmin({ subject, html: `<p>Withdrawal rejected by ${req.user.name} for ${withdrawal.user.email}.</p>${html}` }),
    notifyUser({ to: withdrawal.user.email, subject, html }),
  ]).catch((error) => console.error('Failed to notify withdrawal status change:', error.message));

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
