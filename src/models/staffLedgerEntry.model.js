const mongoose = require('mongoose');

const staffLedgerEntrySchema = new mongoose.Schema(
  {
    staff: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ['commission_earned', 'payout_requested', 'payout_rejected', 'payout_completed'],
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    availableBalanceAfter: {
      type: Number,
      required: true,
      min: 0,
    },
    reference: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },
    meta: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  { timestamps: true }
);

staffLedgerEntrySchema.index({ staff: 1, createdAt: -1 });

module.exports = mongoose.model('StaffLedgerEntry', staffLedgerEntrySchema);
