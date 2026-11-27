const crypto = require('crypto');
const mongoose = require('mongoose');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const User = require('../models/user.model');
const ReferralReward = require('../models/referralReward.model');
const ReferralSettings = require('../models/referralSettings.model');
const StaffWallet = require('../models/staffWallet.model');
const StaffPayoutRequest = require('../models/staffPayoutRequest.model');
const StaffLedgerEntry = require('../models/staffLedgerEntry.model');
const Shop = require('../models/shop.model');
const { DEFAULT_RULES, getReferralSettings: ensureReferralSettings } = require('../services/referral.service');
const { sendStaffInviteEmail } = require('../utils/mailer');

const paginate = (query, prefix = '') => {
  const page = Math.max(Number(query[`${prefix}page`] || query.page) || 1, 1);
  const limit = Math.min(Math.max(Number(query[`${prefix}limit`] || query.limit) || 20, 1), 100);
  return { page, limit, skip: (page - 1) * limit };
};

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const createReferralCode = async () => {
  let code;
  do {
    code = `YTG${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
  } while (await User.exists({ staffReferralCode: code }));
  return code;
};

const listStaff = asyncHandler(async (req, res) => {
  const { page, limit, skip } = paginate(req.query);
  const filter = { role: 'staff' };
  const searchTerm = String(req.query.search || '').trim();
  if (searchTerm) {
    const searchRegex = new RegExp(escapeRegex(searchTerm), 'i');
    filter.$or = [{ name: searchRegex }, { email: searchRegex }, { staffReferralCode: searchRegex }];
  }
  if (req.query.isBlocked !== undefined) filter.isBlocked = req.query.isBlocked === 'true';
  if (req.query.passwordSetupRequired !== undefined) {
    filter.passwordSetupRequired = req.query.passwordSetupRequired === 'true' ? true : { $ne: true };
  }
  if (req.query.isVerified !== undefined) filter.isVerified = req.query.isVerified === 'true';

  const [staffMembers, total] = await Promise.all([
    User.find(filter)
      .select('name email phoneNumber staffReferralCode staffCommissionRules usesGlobalCommissionRules passwordSetupRequired isVerified isBlocked createdAt')
      .sort({ createdAt: -1, _id: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    User.countDocuments(filter),
  ]);
  const settings = await ensureReferralSettings();
  const ids = staffMembers.map((staff) => staff._id);
  const [wallets, referralCounts, rewardTotals] = await Promise.all([
    StaffWallet.find({ staff: { $in: ids } }).lean(),
    User.aggregate([
      { $match: { referredByStaff: { $in: ids } } },
      { $group: { _id: '$referredByStaff', count: { $sum: 1 } } },
    ]),
    ReferralReward.aggregate([
      { $match: { staff: { $in: ids } } },
      {
        $group: {
          _id: '$staff',
          earnedCommission: { $sum: '$commissionAmount' },
          referralRevenue: { $sum: '$baseAmount' },
        },
      },
    ]),
  ]);
  const walletByStaff = new Map(wallets.map((wallet) => [String(wallet.staff), wallet]));
  const referralsByStaff = new Map(referralCounts.map((item) => [String(item._id), item.count]));
  const totalsByStaff = new Map(rewardTotals.map((item) => [String(item._id), item]));

  res.status(200).json(
    new ApiResponse(
      200,
      {
        staff: staffMembers.map((staff) => ({
          ...staff,
          staffCommissionRules: staff.usesGlobalCommissionRules
            ? settings.defaultRules
            : staff.staffCommissionRules,
          wallet: walletByStaff.get(String(staff._id)) || null,
          referralCount: referralsByStaff.get(String(staff._id)) || 0,
          ...(totalsByStaff.get(String(staff._id)) || { earnedCommission: 0, referralRevenue: 0 }),
        })),
        pagination: { page, limit, total, pages: Math.ceil(total / limit) },
      },
      'Staff members fetched successfully'
    )
  );
});

const createStaff = asyncHandler(async (req, res) => {
  const email = req.body.email.trim().toLowerCase();
  if (await User.exists({ email })) {
    throw new ApiError(409, 'An account with this email already exists');
  }
  const settings = await ensureReferralSettings();
  const setupToken = crypto.randomBytes(32).toString('hex');
  const setupTokenHash = crypto.createHash('sha256').update(setupToken).digest('hex');
  const setupTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);
  const session = await mongoose.startSession();
  let staff;
  try {
    await session.withTransaction(async () => {
      [staff] = await User.create(
        [{
          name: req.body.name,
          email,
          password: crypto.randomBytes(32).toString('hex'),
          phoneNumber: req.body.phoneNumber || null,
          role: 'staff',
          isVerified: true,
          passwordSetupRequired: true,
          passwordSetupTokenHash: setupTokenHash,
          passwordSetupTokenExpiry: setupTokenExpiry,
          staffReferralCode: await createReferralCode(),
          staffCommissionRules: req.body.commissionRules || settings.defaultRules || DEFAULT_RULES,
          usesGlobalCommissionRules: req.body.commissionRules === undefined,
        }],
        { session }
      );
      await StaffWallet.create([{ staff: staff._id }], { session });
    });
  } finally {
    await session.endSession();
  }
  try {
    await sendStaffInviteEmail({ to: staff.email, name: staff.name, token: setupToken });
  } catch {
    throw new ApiError(
      502,
      'Staff account was created, but the password setup email could not be sent. Do not retry account creation; ask the staff member to use the password reset page to request a code.'
    );
  }
  res.status(201).json(
    new ApiResponse(
      201,
      {
        staff: {
          _id: staff._id,
          name: staff.name,
          email: staff.email,
          phoneNumber: staff.phoneNumber,
          role: staff.role,
          staffReferralCode: staff.staffReferralCode,
          staffCommissionRules: staff.staffCommissionRules,
          usesGlobalCommissionRules: staff.usesGlobalCommissionRules,
          passwordSetupRequired: staff.passwordSetupRequired,
          isVerified: staff.isVerified,
          createdAt: staff.createdAt,
        },
      },
      'Staff member created and password setup email sent successfully'
    )
  );
});

const getStaffDetail = asyncHandler(async (req, res) => {
  const staff = await User.findOne({ _id: req.params.staffId, role: 'staff' })
    .select('name email phoneNumber staffReferralCode staffCommissionRules usesGlobalCommissionRules passwordSetupRequired isVerified isBlocked createdAt updatedAt')
    .lean();
  if (!staff) throw new ApiError(404, 'Staff member not found');
  const referralSettings = await ensureReferralSettings();
  const effectiveRules = staff.usesGlobalCommissionRules
    ? referralSettings.defaultRules
    : staff.staffCommissionRules;

  const [
    wallet,
    referralCount,
    memberCounts,
    rewardTotals,
    referrals,
    rewards,
    payouts,
    ledger,
  ] = await Promise.all([
    StaffWallet.findOne({ staff: staff._id }).lean(),
    User.countDocuments({ referredByStaff: staff._id }),
    User.aggregate([
      { $match: { referredByStaff: staff._id } },
      { $group: { _id: '$role', count: { $sum: 1 } } },
    ]),
    ReferralReward.aggregate([
      { $match: { staff: staff._id } },
      {
        $group: {
          _id: null,
          earnedCommission: { $sum: '$commissionAmount' },
          referralRevenue: { $sum: '$baseAmount' },
          rewardedMembers: { $addToSet: '$member' },
        },
      },
    ]),
    paginatedRows(User.find({ referredByStaff: staff._id })
      .select('name email role phoneNumber isVerified isBlocked hasActivatedToken shopkeeperRegistrationFee shopkeeperRegisteredAt createdAt')
      .sort({ createdAt: -1, _id: -1 }), req.query, 'referrals'),
    paginatedRows(ReferralReward.find({ staff: staff._id })
      .populate({ path: 'member', select: 'name email role' })
      .sort({ createdAt: -1, _id: -1 }), req.query, 'rewards'),
    paginatedRows(StaffPayoutRequest.find({ staff: staff._id })
      .populate({ path: 'staff', select: 'name email staffReferralCode' })
      .populate({ path: 'processedBy', select: 'name email' })
      .sort({ createdAt: -1, _id: -1 }), req.query, 'payouts'),
    paginatedRows(StaffLedgerEntry.find({ staff: staff._id })
      .sort({ createdAt: -1, _id: -1 }), req.query, 'ledger'),
  ]);
  const memberIds = referrals.rows.map((member) => member._id);
  const [shops, referralRewards] = await Promise.all([
    Shop.find({ owner: { $in: memberIds } })
      .select('owner shopName businessType approvalStatus registrationFee createdAt')
      .lean(),
    ReferralReward.find({ staff: staff._id, member: { $in: memberIds } }).lean(),
  ]);
  const shopsByOwner = groupById(shops, 'owner');
  const rewardsByMember = groupById(referralRewards, 'member');
  const summary = rewardTotals[0] || {};

  res.status(200).json(
    new ApiResponse(
      200,
      {
        staff: { ...staff, staffCommissionRules: effectiveRules, wallet: wallet || null },
        globalRules: referralSettings.defaultRules,
        summary: {
          referralCount,
          shopperCount: memberCounts.find((item) => item._id === 'shopper')?.count || 0,
          shopkeeperCount: memberCounts.find((item) => item._id === 'shopkeeper')?.count || 0,
          rewardedMembers: summary.rewardedMembers?.length || 0,
          referralRevenue: summary.referralRevenue || 0,
          earnedCommission: summary.earnedCommission || 0,
          availableBalance: wallet?.availableBalance || 0,
          reservedBalance: wallet?.reservedBalance || 0,
          paidBalance: wallet?.paidBalance || 0,
        },
        referrals: {
          items: referrals.rows.map((member) => ({
            ...member,
            shops: shopsByOwner.get(String(member._id)) || [],
            rewards: rewardsByMember.get(String(member._id)) || [],
          })),
          pagination: referrals.pagination,
        },
        rewards,
        payouts,
        ledger,
      },
      'Staff member detail fetched successfully'
    )
  );
});

const paginatedRows = async (query, params, prefix) => {
  const { page, limit, skip } = paginate(params, prefix);
  const [rows, total] = await Promise.all([
    query.skip(skip).limit(limit).lean(),
    query.model.countDocuments(query.getFilter()),
  ]);
  return { rows, pagination: { page, limit, total, pages: Math.ceil(total / limit) } };
};

const groupById = (items, key) => {
  const grouped = new Map();
  for (const item of items) {
    const id = String(item[key]);
    const values = grouped.get(id) || [];
    values.push(item);
    grouped.set(id, values);
  }
  return grouped;
};

const updateStaff = asyncHandler(async (req, res) => {
  const staff = await User.findOne({ _id: req.params.staffId, role: 'staff' });
  if (!staff) throw new ApiError(404, 'Staff member not found');
  if (req.body.name !== undefined) staff.name = req.body.name;
  if (req.body.phoneNumber !== undefined) staff.phoneNumber = req.body.phoneNumber || null;
  if (req.body.isBlocked !== undefined) staff.isBlocked = req.body.isBlocked;
  if (req.body.commissionRules !== undefined) {
    staff.staffCommissionRules = req.body.commissionRules;
    staff.usesGlobalCommissionRules = false;
  }
  if (req.body.usesGlobalCommissionRules !== undefined) {
    staff.usesGlobalCommissionRules = req.body.usesGlobalCommissionRules;
  }
  await staff.save();
  res.status(200).json(new ApiResponse(200, { staff }, 'Staff member updated successfully'));
});

const updateReferralSettings = asyncHandler(async (req, res) => {
  const settings = await ReferralSettings.findOneAndUpdate(
    { key: 'global' },
    {
      $set: {
        defaultRules: req.body.defaultRules,
        updatedBy: req.user._id,
      },
      $setOnInsert: { key: 'global' },
    },
    { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
  );
  res.status(200).json(new ApiResponse(200, { settings }, 'Referral defaults updated successfully'));
});

const getReferralSettings = asyncHandler(async (_req, res) => {
  const settings = await ensureReferralSettings();
  res.status(200).json(new ApiResponse(200, { settings }, 'Referral defaults fetched successfully'));
});

const listStaffPayouts = asyncHandler(async (req, res) => {
  const { page, limit, skip } = paginate(req.query);
  const filter = {};
  if (req.query.status && req.query.status !== 'all') filter.status = req.query.status;
  if (req.params.staffId) filter.staff = req.params.staffId;
  const searchTerm = String(req.query.search || '').trim();
  if (searchTerm) {
    const searchRegex = new RegExp(escapeRegex(searchTerm), 'i');
    const matchingStaff = await User.find({
      role: 'staff',
      $or: [{ name: searchRegex }, { email: searchRegex }, { staffReferralCode: searchRegex }],
    }).distinct('_id');
    filter.$or = [
      { staff: { $in: matchingStaff } },
      { method: searchRegex },
      { accountDetails: searchRegex },
    ];
  }
  const [payouts, total] = await Promise.all([
    StaffPayoutRequest.find(filter)
      .populate({ path: 'staff', select: 'name email staffReferralCode' })
      .populate({ path: 'processedBy', select: 'name email' })
      .sort({ createdAt: -1, _id: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    StaffPayoutRequest.countDocuments(filter),
  ]);
  res.status(200).json(
    new ApiResponse(
      200,
      { payouts, pagination: { page, limit, total, pages: Math.ceil(total / limit) } },
      'Staff payment requests fetched successfully'
    )
  );
});

const processStaffPayout = asyncHandler(async (req, res) => {
  const session = await mongoose.startSession();
  let payout;
  try {
    await session.withTransaction(async () => {
      payout = await StaffPayoutRequest.findOneAndUpdate(
        { _id: req.params.payoutId, status: 'pending' },
        {
          $set: {
            status: req.body.action,
            processedBy: req.user._id,
            processedAt: new Date(),
            rejectionReason: req.body.action === 'rejected' ? req.body.reason || null : null,
          },
        },
        { new: true, session }
      );
      if (!payout) throw new ApiError(404, 'Pending staff payment request not found');

      const walletChanges =
        req.body.action === 'completed'
          ? { $inc: { reservedBalance: -payout.amount, paidBalance: payout.amount } }
          : { $inc: { reservedBalance: -payout.amount, availableBalance: payout.amount } };
      const wallet = await StaffWallet.findOneAndUpdate(
        { staff: payout.staff, reservedBalance: { $gte: payout.amount } },
        walletChanges,
        { new: true, session }
      );
      if (!wallet) throw new ApiError(409, 'Reserved staff balance is inconsistent; payout was not processed');

      await StaffLedgerEntry.create(
        [{
          staff: payout.staff,
          type: req.body.action === 'completed' ? 'payout_completed' : 'payout_rejected',
          amount: payout.amount,
          availableBalanceAfter: wallet.availableBalance,
          reservedBalanceAfter: wallet.reservedBalance,
          paidBalanceAfter: wallet.paidBalance,
          reference: payout._id,
          meta: { reason: payout.rejectionReason },
        }],
        { session }
      );
    });
  } finally {
    await session.endSession();
  }
  await payout.populate([
    { path: 'staff', select: 'name email staffReferralCode' },
    { path: 'processedBy', select: 'name email' },
  ]);
  res.status(200).json(new ApiResponse(200, { payout }, `Staff payment request ${req.body.action}`));
});

module.exports = {
  listStaff,
  createStaff,
  getStaffDetail,
  updateStaff,
  getReferralSettings,
  updateReferralSettings,
  listStaffPayouts,
  processStaffPayout,
};
