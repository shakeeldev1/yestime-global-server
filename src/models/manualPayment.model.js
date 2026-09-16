const mongoose = require('mongoose');

const manualPaymentSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0.01,
    },
    provider: {
      type: String,
      enum: ['easypaisa', 'jazzcash'],
      required: true,
    },
    senderName: {
      type: String,
      required: true,
      trim: true,
    },
    transactionReference: {
      type: String,
      required: true,
      trim: true,
    },
    proofPath: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    reviewedAt: {
      type: Date,
      default: null,
    },
    rejectionReason: {
      type: String,
      default: null,
      trim: true,
    },
  },
  { timestamps: true }
);

manualPaymentSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model('ManualPayment', manualPaymentSchema);
