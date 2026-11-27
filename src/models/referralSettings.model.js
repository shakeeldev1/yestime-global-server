const mongoose = require('mongoose');

const commissionRuleSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ['fixed', 'percentage'],
      default: 'fixed',
      required: true,
    },
    value: {
      type: Number,
      min: 0,
      default: 0,
      required: true,
    },
  },
  { _id: false }
);

const referralSettingsSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      default: 'global',
      unique: true,
    },
    defaultRules: {
      shopper: { type: commissionRuleSchema, default: () => ({}) },
      shopkeeper: { type: commissionRuleSchema, default: () => ({}) },
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('ReferralSettings', referralSettingsSchema);
