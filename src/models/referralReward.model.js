const mongoose = require('mongoose');

const referralRewardSchema = new mongoose.Schema(
  {
    staff: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    member: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    memberType: {
      type: String,
      enum: ['shopper', 'shopkeeper'],
      required: true,
    },
    trigger: {
      type: String,
      enum: ['token_activation', 'shop_registration'],
      required: true,
    },
    baseAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    commissionType: {
      type: String,
      enum: ['fixed', 'percentage'],
      required: true,
    },
    commissionRate: {
      type: Number,
      required: true,
      min: 0,
    },
    commissionAmount: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  { timestamps: true }
);

referralRewardSchema.index({ member: 1, memberType: 1 }, { unique: true });
referralRewardSchema.index({ staff: 1, createdAt: -1 });

module.exports = mongoose.model('ReferralReward', referralRewardSchema);
