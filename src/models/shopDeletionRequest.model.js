const mongoose = require('mongoose');

const shopDeletionRequestSchema = new mongoose.Schema(
  {
    shopId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    ownerSnapshot: {
      name: { type: String, required: true },
      email: { type: String, required: true },
    },
    shopSnapshot: {
      shopName: { type: String, required: true },
      businessType: { type: String, required: true },
      phoneNumber: { type: String, default: null },
      businessAddress: { type: String, required: true },
      businessDescription: { type: String, default: null },
      businessImage: { type: String, default: null },
      businessCategories: { type: [String], default: [] },
      city: { type: String, default: null },
      commissionRate: { type: Number, default: 2.5 },
    },
    reason: {
      type: String,
      trim: true,
      maxlength: 500,
      default: null,
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
      index: true,
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
    reviewNote: {
      type: String,
      trim: true,
      maxlength: 500,
      default: null,
    },
  },
  { timestamps: true }
);

shopDeletionRequestSchema.index(
  { shopId: 1 },
  { unique: true, partialFilterExpression: { status: 'pending' } }
);
shopDeletionRequestSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model('ShopDeletionRequest', shopDeletionRequestSchema);
