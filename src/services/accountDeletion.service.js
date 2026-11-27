const ApiError = require('../utils/ApiError');
const Shop = require('../models/shop.model');
const ShopDeletionRequest = require('../models/shopDeletionRequest.model');
const Wallet = require('../models/wallet.model');
const WalletTransaction = require('../models/walletTransaction.model');
const Token = require('../models/token.model');
const Purchase = require('../models/purchase.model');
const Draw = require('../models/draw.model');
const Withdrawal = require('../models/withdrawal.model');
const ManualPayment = require('../models/manualPayment.model');
const ReferralReward = require('../models/referralReward.model');
const StaffWallet = require('../models/staffWallet.model');
const StaffPayoutRequest = require('../models/staffPayoutRequest.model');
const StaffLedgerEntry = require('../models/staffLedgerEntry.model');
const ReferralSettings = require('../models/referralSettings.model');
const User = require('../models/user.model');
const { getCloudinaryPublicId, deleteCloudinaryImages } = require('../lib/cloudinary');

const reconcileReferralLedger = async (memberId, session) => {
  const rewards = await ReferralReward.find({ member: memberId }).select('staff').session(session).lean();
  const ledgerStaffIds = await StaffLedgerEntry.distinct('staff', {
    type: 'commission_earned',
    'meta.member': memberId,
  }).session(session);
  const staffIds = [...new Set([
    ...rewards.map((reward) => String(reward.staff)),
    ...ledgerStaffIds.map(String),
  ])];

  for (const staffId of staffIds) {
    const entries = await StaffLedgerEntry.find({ staff: staffId })
      .sort({ createdAt: 1, _id: 1 })
      .session(session);
    const wallet = await StaffWallet.findOne({ staff: staffId }).session(session);
    const lastEntry = entries[entries.length - 1];
    if (!wallet || (lastEntry && (
      Math.abs(wallet.availableBalance - lastEntry.availableBalanceAfter) > 0.01
      || Math.abs(wallet.reservedBalance - lastEntry.reservedBalanceAfter) > 0.01
      || Math.abs(wallet.paidBalance - lastEntry.paidBalanceAfter) > 0.01
    )) || (!lastEntry && (
      wallet.availableBalance > 0.01 || wallet.reservedBalance > 0.01 || wallet.paidBalance > 0.01
    ))) {
      throw new ApiError(409, 'Referral payout history is inconsistent. Reconcile this staff ledger before permanently deleting the referred account.');
    }

    let availableBalance = 0;
    let reservedBalance = 0;
    let paidBalance = 0;
    const firstEntry = entries[0];
    if (firstEntry) {
      availableBalance = firstEntry.availableBalanceAfter;
      reservedBalance = firstEntry.reservedBalanceAfter;
      paidBalance = firstEntry.paidBalanceAfter;
      if (firstEntry.type === 'commission_earned') availableBalance -= firstEntry.amount;
      if (firstEntry.type === 'payout_requested') {
        availableBalance += firstEntry.amount;
        reservedBalance -= firstEntry.amount;
      }
      if (firstEntry.type === 'payout_rejected') {
        availableBalance -= firstEntry.amount;
        reservedBalance += firstEntry.amount;
      }
      if (firstEntry.type === 'payout_completed') {
        reservedBalance += firstEntry.amount;
        paidBalance -= firstEntry.amount;
      }
    }

    for (const entry of entries) {
      const isDeletedMemberReward = entry.type === 'commission_earned'
        && String(entry.meta?.member || '') === String(memberId);
      if (isDeletedMemberReward) continue;

      if (entry.type === 'commission_earned') {
        availableBalance += entry.amount;
      } else if (entry.type === 'payout_requested') {
        availableBalance -= entry.amount;
        reservedBalance += entry.amount;
      } else if (entry.type === 'payout_rejected') {
        reservedBalance -= entry.amount;
        availableBalance += entry.amount;
      } else if (entry.type === 'payout_completed') {
        reservedBalance -= entry.amount;
        paidBalance += entry.amount;
      }

      if (availableBalance < -0.01 || reservedBalance < -0.01 || paidBalance < -0.01) {
        throw new ApiError(409, 'Removing this member would make staff payout balances inconsistent. Reconcile the staff ledger before deleting the account.');
      }

      entry.availableBalanceAfter = Math.max(0, availableBalance);
      entry.reservedBalanceAfter = Math.max(0, reservedBalance);
      entry.paidBalanceAfter = Math.max(0, paidBalance);
      await entry.save({ session });
    }

    wallet.availableBalance = Math.max(0, availableBalance);
    wallet.reservedBalance = Math.max(0, reservedBalance);
    wallet.paidBalance = Math.max(0, paidBalance);
    await wallet.save({ session });
    await StaffLedgerEntry.deleteMany({
      staff: staffId,
      type: 'commission_earned',
      'meta.member': memberId,
    }, { session });
  }
};

const deleteAccountData = async (userId, session) => {
  const user = await User.findById(userId).select('businessImage').session(session).lean();
  const shops = await Shop.find({ owner: userId }).select('_id businessImage').session(session).lean();
  const tokens = await Token.find({ owner: userId }).select('_id').session(session).lean();
  const paymentProofs = await ManualPayment.find({ user: userId }).select('proofPath').session(session).lean();
  const deletionRequestImages = await ShopDeletionRequest.find({ owner: userId })
    .select('shopSnapshot.businessImage')
    .session(session)
    .lean();
  const imageUrls = [...new Set([
    user?.businessImage,
    ...shops.map((shop) => shop.businessImage),
    ...paymentProofs.map((payment) => payment.proofPath),
    ...deletionRequestImages.map((request) => request.shopSnapshot?.businessImage),
  ].filter(Boolean))];
  const sharedImageUrls = new Set();
  if (imageUrls.length > 0) {
    const sharedUserImages = await User.distinct('businessImage', {
      _id: { $ne: userId },
      businessImage: { $in: imageUrls },
    }).session(session);
    const sharedShopImages = await Shop.distinct('businessImage', {
      owner: { $ne: userId },
      businessImage: { $in: imageUrls },
    }).session(session);
    const sharedProofs = await ManualPayment.distinct('proofPath', {
      user: { $ne: userId },
      proofPath: { $in: imageUrls },
    }).session(session);
    const sharedDeletionImages = await ShopDeletionRequest.distinct('shopSnapshot.businessImage', {
      owner: { $ne: userId },
      'shopSnapshot.businessImage': { $in: imageUrls },
    }).session(session);
    [...sharedUserImages, ...sharedShopImages, ...sharedProofs, ...sharedDeletionImages]
      .forEach((imageUrl) => sharedImageUrls.add(imageUrl));
  }
  const orphanImageUrls = imageUrls.filter((imageUrl) => !sharedImageUrls.has(imageUrl));
  const shopIds = shops.map((shop) => shop._id);
  const tokenIds = tokens.map((token) => token._id);
  const options = { session };

  await reconcileReferralLedger(userId, session);
  await Purchase.deleteMany({
    $or: [{ shopper: userId }, { shopkeeper: userId }, { token: { $in: tokenIds } }],
  }, options);
  await Draw.deleteMany({
    $or: [{ winnerUser: userId }, { winnerToken: { $in: tokenIds } }],
  }, options);
  await ShopDeletionRequest.deleteMany({
    $or: [{ owner: userId }, { shopId: { $in: shopIds } }],
  }, options);
  await Shop.deleteMany({ owner: userId }, options);
  await Token.deleteMany({ owner: userId }, options);
  await Withdrawal.deleteMany({ user: userId }, options);
  await ManualPayment.deleteMany({ user: userId }, options);
  await WalletTransaction.deleteMany({ user: userId }, options);
  await Wallet.deleteMany({ user: userId }, options);
  await ReferralReward.deleteMany({ $or: [{ staff: userId }, { member: userId }] }, options);
  await StaffPayoutRequest.deleteMany({ staff: userId }, options);
  await StaffLedgerEntry.deleteMany({ staff: userId }, options);
  await StaffWallet.deleteMany({ staff: userId }, options);

  await User.updateMany(
    { referredByStaff: userId },
    { $set: { referredByStaff: null } },
    options
  );
  await User.updateMany(
    { deletedBy: userId },
    { $set: { deletedBy: null } },
    options
  );
  await Shop.updateMany({ reviewedBy: userId }, { $set: { reviewedBy: null } }, options);
  await ShopDeletionRequest.updateMany({ reviewedBy: userId }, { $set: { reviewedBy: null } }, options);
  await Withdrawal.updateMany({ processedBy: userId }, { $set: { processedBy: null } }, options);
  await ManualPayment.updateMany({ reviewedBy: userId }, { $set: { reviewedBy: null } }, options);
  await StaffPayoutRequest.updateMany({ processedBy: userId }, { $set: { processedBy: null } }, options);
  await ReferralSettings.updateMany({ updatedBy: userId }, { $set: { updatedBy: null } }, options);

  return [...new Set(orphanImageUrls.map(getCloudinaryPublicId).filter(Boolean))];
};

module.exports = { deleteAccountData, deleteCloudinaryImages };
