const mongoose = require('mongoose');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const Shop = require('../models/shop.model');
const ShopDeletionRequest = require('../models/shopDeletionRequest.model');
const { notifyUser } = require('../utils/mailer');

const paginate = (query) => {
  const page = Math.max(Number(query.page) || 1, 1);
  const limit = Math.min(Math.max(Number(query.limit) || 20, 1), 100);
  return { page, limit, skip: (page - 1) * limit };
};

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const requestShopDeletion = asyncHandler(async (req, res) => {
  const shop = await Shop.findById(req.body.shopId);
  if (!shop) throw new ApiError(404, 'Shop not found');
  if (!shop.owner.equals(req.user._id)) {
    throw new ApiError(403, 'You do not own this shop');
  }

  const existingRequest = await ShopDeletionRequest.findOne({ shopId: shop._id, status: 'pending' });
  if (existingRequest) {
    throw new ApiError(409, 'A deletion request is already pending for this shop');
  }

  let deletionRequest;
  try {
    deletionRequest = await ShopDeletionRequest.create({
      shopId: shop._id,
      owner: req.user._id,
      ownerSnapshot: { name: req.user.name, email: req.user.email },
      shopSnapshot: {
        shopName: shop.shopName,
        businessType: shop.businessType,
        phoneNumber: shop.phoneNumber,
        businessAddress: shop.businessAddress,
        businessDescription: shop.businessDescription,
        businessImage: shop.businessImage,
        businessCategories: shop.businessCategories,
        city: shop.city,
        commissionRate: shop.commissionRate,
      },
      reason: req.body.reason || null,
    });
  } catch (error) {
    if (error.code === 11000) {
      throw new ApiError(409, 'A deletion request is already pending for this shop');
    }
    throw error;
  }

  res.status(201).json(
    new ApiResponse(201, { request: deletionRequest }, 'Shop deletion request submitted successfully')
  );
});

const listShopDeletionRequests = asyncHandler(async (req, res) => {
  const { status, search } = req.query;
  const { page, limit, skip } = paginate(req.query);
  const filter = {};

  if (status && status !== 'all') filter.status = status;
  if (search) {
    const searchRegex = new RegExp(escapeRegex(search.trim()), 'i');
    filter.$or = [
      { 'shopSnapshot.shopName': searchRegex },
      { 'ownerSnapshot.name': searchRegex },
      { 'ownerSnapshot.email': searchRegex },
    ];
  }

  const [requests, total] = await Promise.all([
    ShopDeletionRequest.find(filter)
      .sort({ createdAt: -1, _id: -1 })
      .skip(skip)
      .limit(limit)
      .populate({ path: 'reviewedBy', select: 'name email' }),
    ShopDeletionRequest.countDocuments(filter),
  ]);

  res.status(200).json(
    new ApiResponse(
      200,
      { requests, pagination: { page, limit, total, pages: Math.ceil(total / limit) } },
      'Shop deletion requests fetched successfully'
    )
  );
});

const approveShopDeletionRequest = asyncHandler(async (req, res) => {
  const session = await mongoose.startSession();
  let deletionRequest;

  try {
    await session.withTransaction(async () => {
      deletionRequest = await ShopDeletionRequest.findById(req.params.requestId).session(session);
      if (!deletionRequest) throw new ApiError(404, 'Shop deletion request not found');
      if (deletionRequest.status !== 'pending') {
        throw new ApiError(400, `This request is already ${deletionRequest.status}`);
      }

      const deletedShop = await Shop.findOneAndDelete(
        { _id: deletionRequest.shopId, owner: deletionRequest.owner },
        { session }
      );
      if (!deletedShop) {
        throw new ApiError(409, 'The requested shop no longer exists');
      }

      deletionRequest.status = 'approved';
      deletionRequest.reviewedBy = req.user._id;
      deletionRequest.reviewedAt = new Date();
      deletionRequest.reviewNote = null;
      await deletionRequest.save({ session });
    });
  } finally {
    await session.endSession();
  }

  notifyUser({
    to: deletionRequest.ownerSnapshot.email,
    subject: `Shop deletion approved: ${deletionRequest.shopSnapshot.shopName}`,
    html: `<p>Hi ${deletionRequest.ownerSnapshot.name},</p><p>Your request to delete <strong>${deletionRequest.shopSnapshot.shopName}</strong> was approved. The shop has been removed.</p>`,
  }).catch((error) => console.error('Failed to send shop deletion approval email:', error.message));

  res.status(200).json(
    new ApiResponse(200, { request: deletionRequest }, 'Shop deletion approved and shop removed')
  );
});

const rejectShopDeletionRequest = asyncHandler(async (req, res) => {
  const deletionRequest = await ShopDeletionRequest.findOneAndUpdate(
    { _id: req.params.requestId, status: 'pending' },
    {
      $set: {
        status: 'rejected',
        reviewedBy: req.user._id,
        reviewedAt: new Date(),
        reviewNote: req.body.reason || null,
      },
    },
    { new: true, runValidators: true }
  );

  if (!deletionRequest) {
    const existingRequest = await ShopDeletionRequest.findById(req.params.requestId);
    if (!existingRequest) throw new ApiError(404, 'Shop deletion request not found');
    throw new ApiError(400, `This request is already ${existingRequest.status}`);
  }

  notifyUser({
    to: deletionRequest.ownerSnapshot.email,
    subject: `Shop deletion request declined: ${deletionRequest.shopSnapshot.shopName}`,
    html: `<p>Hi ${deletionRequest.ownerSnapshot.name},</p><p>Your request to delete <strong>${deletionRequest.shopSnapshot.shopName}</strong> was not approved.</p><p><strong>Reason:</strong> ${deletionRequest.reviewNote || 'Please contact support for more information.'}</p>`,
  }).catch((error) => console.error('Failed to send shop deletion rejection email:', error.message));

  res.status(200).json(
    new ApiResponse(200, { request: deletionRequest }, 'Shop deletion request rejected')
  );
});

module.exports = {
  requestShopDeletion,
  listShopDeletionRequests,
  approveShopDeletionRequest,
  rejectShopDeletionRequest,
};
