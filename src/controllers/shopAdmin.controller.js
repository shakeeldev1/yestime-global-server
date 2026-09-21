const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const Shop = require('../models/shop.model');
const { notifyUser } = require('../utils/mailer');

const paginate = (query) => {
  const page = Math.max(Number(query.page) || 1, 1);
  const limit = Math.min(Math.max(Number(query.limit) || 20, 1), 100);
  return { page, limit, skip: (page - 1) * limit };
};

const listShops = asyncHandler(async (req, res) => {
  const { status, search } = req.query;
  const { page, limit, skip } = paginate(req.query);
  const filter = {};

  if (status) filter.approvalStatus = status;
  if (search) {
    filter.$or = [
      { shopName: { $regex: search, $options: 'i' } },
      { businessAddress: { $regex: search, $options: 'i' } },
      { city: { $regex: search, $options: 'i' } },
    ];
  }

  const [shops, total] = await Promise.all([
    Shop.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate({ path: 'owner', select: 'name email role' })
      .populate({ path: 'reviewedBy', select: 'name email' }),
    Shop.countDocuments(filter),
  ]);

  res.status(200).json(
    new ApiResponse(
      200,
      { shops, pagination: { page, limit, total, pages: Math.ceil(total / limit) } },
      'Shops fetched successfully'
    )
  );
});

const findPendingShop = async (id) => {
  const shop = await Shop.findById(id).populate({ path: 'owner', select: 'name email role' });
  if (!shop) throw new ApiError(404, 'Shop not found');
  if (shop.approvalStatus !== 'pending') {
    throw new ApiError(400, `This shop is already ${shop.approvalStatus}`);
  }
  return shop;
};

const approveShop = asyncHandler(async (req, res) => {
  const shop = await findPendingShop(req.params.id);
  shop.approvalStatus = 'approved';
  shop.isVerified = true;
  shop.reviewedBy = req.user._id;
  shop.reviewedAt = new Date();
  shop.rejectionReason = null;
  await shop.save();

  notifyUser({
    to: shop.owner.email,
    subject: `Shop approved: ${shop.shopName}`,
    html: `<p>Hi ${shop.owner.name},</p><p>Your shop <strong>${shop.shopName}</strong> has been approved and is now visible in the public shop directory.</p>`,
  }).catch((error) => console.error('Failed to send shop approval email:', error.message));

  res.status(200).json(new ApiResponse(200, { shop }, 'Shop approved successfully'));
});

const rejectShop = asyncHandler(async (req, res) => {
  const shop = await findPendingShop(req.params.id);
  shop.approvalStatus = 'rejected';
  shop.isVerified = false;
  shop.reviewedBy = req.user._id;
  shop.reviewedAt = new Date();
  shop.rejectionReason = req.body.reason || null;
  await shop.save();

  notifyUser({
    to: shop.owner.email,
    subject: `Shop review update: ${shop.shopName}`,
    html: `<p>Hi ${shop.owner.name},</p><p>Your shop <strong>${shop.shopName}</strong> was not approved for public listing.</p><p><strong>Reason:</strong> ${shop.rejectionReason || 'The submitted details could not be verified.'}</p><p>You may update the shop details and contact support if you need assistance.</p>`,
  }).catch((error) => console.error('Failed to send shop rejection email:', error.message));

  res.status(200).json(new ApiResponse(200, { shop }, 'Shop rejected successfully'));
});

module.exports = { listShops, approveShop, rejectShop };