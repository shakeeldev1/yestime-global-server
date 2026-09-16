const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const ManualPayment = require('../models/manualPayment.model');
const User = require('../models/user.model');
const { creditWallet } = require('../services/wallet.service');
const { uploadImageBuffer } = require('../lib/cloudinary');
const { notifyAdmin, notifyUser } = require('../utils/mailer');

const paymentInstructions = asyncHandler(async (_req, res) => {
  res.status(200).json(
    new ApiResponse(
      200,
      {
        provider: 'easypaisa',
        accountNumber: '03068509086',
        accountName: 'امانت علی',
        note: 'Send the payment, then submit the transaction reference and screenshot for review.',
      },
      'Manual payment instructions fetched successfully'
    )
  );
});

const submitPayment = asyncHandler(async (req, res) => {
  const { amount, provider, senderName, transactionReference } = req.body;
  if (!req.file) {
    throw new ApiError(422, 'Payment screenshot is required');
  }

  const uploadedProof = await uploadImageBuffer(req.file.buffer, {
    public_id: `payment-${req.user._id}-${Date.now()}`,
  });

  const payment = await ManualPayment.create({
    user: req.user._id,
    amount: Number(amount),
    provider,
    senderName,
    transactionReference,
    proofPath: uploadedProof.secure_url,
  });

  const pendingSubject = `Payment request received: PKR ${payment.amount}`;
  const pendingHtml = `
    <div style="font-family: Arial, sans-serif; max-width: 620px; margin: auto;">
      <h2>Payment request received</h2>
      <p>Your payment request for <strong>PKR ${payment.amount}</strong> is pending admin review.</p>
      <p>Transaction reference: ${payment.transactionReference}</p>
    </div>
  `;
  Promise.all([
    notifyAdmin({
      subject: `New wallet payment request: PKR ${payment.amount}`,
      html: `
      <div style="font-family: Arial, sans-serif; max-width: 620px; margin: auto;">
        <h2>New wallet payment request</h2>
        <p>A user submitted a manual payment that needs review.</p>
        <table cellpadding="8" cellspacing="0" style="border-collapse: collapse;">
          <tr><td><strong>User</strong></td><td>${req.user.name} (${req.user.email})</td></tr>
          <tr><td><strong>Amount</strong></td><td>PKR ${payment.amount}</td></tr>
          <tr><td><strong>Provider</strong></td><td>${payment.provider}</td></tr>
          <tr><td><strong>Sender</strong></td><td>${payment.senderName}</td></tr>
          <tr><td><strong>Reference</strong></td><td>${payment.transactionReference}</td></tr>
        </table>
        <p><a href="${payment.proofPath}">Open payment screenshot</a></p>
        <p>Review this request in the admin dashboard before crediting the main wallet.</p>
      </div>
    `,
    }),
    notifyUser({ to: req.user.email, subject: pendingSubject, html: pendingHtml }),
  ]).catch((error) => console.error('Failed to notify payment request parties:', error.message));

  res.status(201).json(new ApiResponse(201, { payment }, 'Payment submitted for admin review'));
});

const myPayments = asyncHandler(async (req, res) => {
  const payments = await ManualPayment.find({ user: req.user._id }).sort({ createdAt: -1 });
  res.status(200).json(new ApiResponse(200, { payments }, 'Payment requests fetched successfully'));
});

const listPayments = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.status) filter.status = req.query.status;

  const payments = await ManualPayment.find(filter)
    .sort({ createdAt: -1 })
    .populate({ path: 'user', select: 'name email' });
  res.status(200).json(new ApiResponse(200, { payments }, 'Payment requests fetched successfully'));
});

const findPendingPayment = async (id) => {
  const payment = await ManualPayment.findById(id).populate({ path: 'user', select: 'name email' });
  if (!payment) throw new ApiError(404, 'Payment request not found');
  if (payment.status !== 'pending') {
    throw new ApiError(400, `This payment request is already ${payment.status}`);
  }
  return payment;
};

const approvePayment = asyncHandler(async (req, res) => {
  const payment = await findPendingPayment(req.params.id);

  await creditWallet(payment.user._id, 'main', payment.amount, 'topup', {
    manualPaymentId: payment._id,
    provider: payment.provider,
    transactionReference: payment.transactionReference,
    reviewedBy: req.user._id,
  });

  payment.status = 'approved';
  payment.reviewedBy = req.user._id;
  payment.reviewedAt = new Date();
  await payment.save();

  const subject = `Payment approved: PKR ${payment.amount}`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 620px; margin: auto;">
      <h2>Payment approved</h2>
      <p>Payment request for <strong>PKR ${payment.amount}</strong> has been approved.</p>
      <p>The amount has been added to your main wallet.</p>
      <p>Transaction reference: ${payment.transactionReference}</p>
    </div>
  `;
  Promise.all([
    notifyAdmin({ subject, html: `<p>Payment approved by ${req.user.name} for ${payment.user.email}.</p>${html}` }),
    notifyUser({ to: payment.user.email, subject, html }),
  ]).catch((error) => console.error('Failed to notify payment status change:', error.message));

  res.status(200).json(new ApiResponse(200, { payment }, 'Payment approved and main wallet credited'));
});

const rejectPayment = asyncHandler(async (req, res) => {
  const payment = await findPendingPayment(req.params.id);

  payment.status = 'rejected';
  payment.reviewedBy = req.user._id;
  payment.reviewedAt = new Date();
  payment.rejectionReason = req.body.reason || null;
  await payment.save();

  const subject = `Payment rejected: PKR ${payment.amount}`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 620px; margin: auto;">
      <h2>Payment request rejected</h2>
      <p>Your payment request for <strong>PKR ${payment.amount}</strong> was rejected.</p>
      <p>Reason: ${payment.rejectionReason || 'The payment could not be verified.'}</p>
      <p>The wallet was not credited.</p>
    </div>
  `;
  Promise.all([
    notifyAdmin({ subject, html: `<p>Payment rejected by ${req.user.name} for ${payment.user.email}.</p>${html}` }),
    notifyUser({ to: payment.user.email, subject, html }),
  ]).catch((error) => console.error('Failed to notify payment status change:', error.message));

  res.status(200).json(new ApiResponse(200, { payment }, 'Payment rejected'));
});

module.exports = {
  paymentInstructions,
  submitPayment,
  myPayments,
  listPayments,
  approvePayment,
  rejectPayment,
};
