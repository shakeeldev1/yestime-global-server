const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const User = require('../models/user.model');
const Shop = require('../models/shop.model');
const ReferralReward = require('../models/referralReward.model');
const StaffWallet = require('../models/staffWallet.model');
const StaffPayoutRequest = require('../models/staffPayoutRequest.model');
const StaffLedgerEntry = require('../models/staffLedgerEntry.model');
const mongoose = require('mongoose');
const { getReferralSettings } = require('../services/referral.service');

const paginate = (query) => {
  const page = Math.max(Number(query.page) || 1, 1);
  const limit = Math.min(Math.max(Number(query.limit) || 20, 1), 100);
  return { page, limit, skip: (page - 1) * limit };
};

const getDashboard = asyncHandler(async (req, res) => {
  const staffId = req.user._id;
  const [wallet, referralCount, rewardTotals, pendingPayouts, settings] = await Promise.all([
    StaffWallet.findOne({ staff: staffId }).lean(),
    User.countDocuments({ referredByStaff: staffId }),
    ReferralReward.aggregate([
      { $match: { staff: staffId } },
      {
        $group: {
          _id: null,
          earnedCommission: { $sum: '$commissionAmount' },
          referralRevenue: { $sum: '$baseAmount' },
          rewardedMembers: { $addToSet: '$member' },
        },
      },
    ]),
    StaffPayoutRequest.aggregate([
      { $match: { staff: staffId, status: 'pending' } },
      { $group: { _id: null, count: { $sum: 1 }, amount: { $sum: '$amount' } } },
    ]),
    getReferralSettings(),
  ]);
  const totals = rewardTotals[0] || {};
  const pending = pendingPayouts[0] || {};

  res.status(200).json(
    new ApiResponse(
      200,
      {
        staff: {
          _id: req.user._id,
          name: req.user.name,
          email: req.user.email,
          phoneNumber: req.user.phoneNumber,
          referralCode: req.user.staffReferralCode,
          commissionRules: req.user.usesGlobalCommissionRules
            ? settings.defaultRules
            : req.user.staffCommissionRules,
          usesGlobalCommissionRules: req.user.usesGlobalCommissionRules,
        },
        summary: {
          referralCount,
          rewardedMembers: totals.rewardedMembers?.length || 0,
          referralRevenue: totals.referralRevenue || 0,
          earnedCommission: totals.earnedCommission || 0,
          availableBalance: wallet?.availableBalance || 0,
          reservedBalance: wallet?.reservedBalance || 0,
          paidBalance: wallet?.paidBalance || 0,
          pendingPayoutCount: pending.count || 0,
          pendingPayoutAmount: pending.amount || 0,
        },
      },
      'Staff dashboard fetched successfully'
    )
  );
});

const listReferrals = asyncHandler(async (req, res) => {
  const { page, limit, skip } = paginate(req.query);
  const filter = { referredByStaff: req.user._id };
  const [members, total] = await Promise.all([
    User.find(filter)
      .select('name email role phoneNumber isVerified hasActivatedToken shopkeeperRegistrationFee shopkeeperRegisteredAt createdAt')
      .sort({ createdAt: -1, _id: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    User.countDocuments(filter),
  ]);
  const memberIds = members.map((member) => member._id);
  const [shops, rewards] = await Promise.all([
    Shop.find({ owner: { $in: memberIds } }).select('owner shopName approvalStatus registrationFee createdAt').lean(),
    ReferralReward.find({ staff: req.user._id, member: { $in: memberIds } })
      .select('member memberType trigger baseAmount commissionType commissionRate commissionAmount createdAt')
      .lean(),
  ]);
  const shopsByOwner = new Map();
  for (const shop of shops) {
    const ownerId = String(shop.owner);
    const ownerShops = shopsByOwner.get(ownerId) || [];
    ownerShops.push(shop);
    shopsByOwner.set(ownerId, ownerShops);
  }
  const rewardsByMember = new Map();
  for (const reward of rewards) {
    const memberId = String(reward.member);
    const memberRewards = rewardsByMember.get(memberId) || [];
    memberRewards.push(reward);
    rewardsByMember.set(memberId, memberRewards);
  }

  res.status(200).json(
    new ApiResponse(
      200,
      {
        referrals: members.map((member) => ({
          ...member,
          shops: shopsByOwner.get(String(member._id)) || [],
          rewards: rewardsByMember.get(String(member._id)) || [],
        })),
        pagination: { page, limit, total, pages: Math.ceil(total / limit) },
      },
      'Referrals fetched successfully'
    )
  );
});

const listPayouts = asyncHandler(async (req, res) => {
  const { page, limit, skip } = paginate(req.query);
  const filter = { staff: req.user._id };
  const [payouts, total] = await Promise.all([
    StaffPayoutRequest.find(filter).sort({ createdAt: -1, _id: -1 }).skip(skip).limit(limit).lean(),
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

const requestPayout = asyncHandler(async (req, res) => {
  const amount = Number(req.body.amount);
  const session = await mongoose.startSession();
  let payout;
  try {
    await session.withTransaction(async () => {
      const wallet = await StaffWallet.findOneAndUpdate(
        { staff: req.user._id, availableBalance: { $gte: amount } },
        {
          $inc: {
            availableBalance: -amount,
            reservedBalance: amount,
          },
        },
        { new: true, session }
      );
      if (!wallet) {
        throw new ApiError(400, 'Requested amount exceeds your available commission balance');
      }

      [payout] = await StaffPayoutRequest.create(
        [{
          staff: req.user._id,
          amount,
          method: req.body.method,
          accountDetails: req.body.accountDetails.trim(),
        }],
        { session }
      );
      await StaffLedgerEntry.create(
        [{
          staff: req.user._id,
          type: 'payout_requested',
          amount,
          availableBalanceAfter: wallet.availableBalance,
          reference: payout._id,
          meta: { method: payout.method, accountDetails: payout.accountDetails },
        }],
        { session }
      );
    });
  } finally {
    await session.endSession();
  }
  res.status(201).json(new ApiResponse(201, { payout }, 'Payment request submitted for admin review'));
});

module.exports = { getDashboard, listReferrals, listPayouts, requestPayout };
