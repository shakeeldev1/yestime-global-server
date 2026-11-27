const mongoose = require('mongoose');
const User = require('../models/user.model');
const ReferralSettings = require('../models/referralSettings.model');
const ReferralReward = require('../models/referralReward.model');
const StaffWallet = require('../models/staffWallet.model');
const StaffLedgerEntry = require('../models/staffLedgerEntry.model');

const DEFAULT_RULES = {
  shopper: { type: 'fixed', value: 0 },
  shopkeeper: { type: 'fixed', value: 0 },
};

const round2 = (value) => Number(value.toFixed(2));

const getReferralSettings = async ({ session } = {}) => {
  const query = ReferralSettings.findOneAndUpdate(
    { key: 'global' },
    { $setOnInsert: { key: 'global', defaultRules: DEFAULT_RULES } },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
  if (session) query.session(session);
  return query;
};

const calculateCommission = (rule, baseAmount) => {
  const value = Number(rule?.value) || 0;
  if (rule?.type === 'percentage') return round2((baseAmount * value) / 100);
  return round2(value);
};

const createReferralReward = async (
  { memberId, memberType, trigger, baseAmount },
  { session }
) => {
  const member = await User.findById(memberId).select('referredByStaff').session(session);
  if (!member?.referredByStaff) return null;

  const staff = await User.findOne({ _id: member.referredByStaff, role: 'staff' })
    .select('staffCommissionRules usesGlobalCommissionRules')
    .session(session);
  if (!staff) return null;

  const existingReward = await ReferralReward.findOne({ member: memberId, memberType }).session(session);
  if (existingReward) return existingReward;

  const settings = await getReferralSettings({ session });
  const rule = staff.usesGlobalCommissionRules
    ? settings.defaultRules?.[memberType] || DEFAULT_RULES[memberType]
    : staff.staffCommissionRules?.[memberType] || settings.defaultRules?.[memberType] || DEFAULT_RULES[memberType];
  const commissionAmount = calculateCommission(rule, baseAmount);
  const [reward] = await ReferralReward.create(
    [{
      staff: staff._id,
      member: memberId,
      memberType,
      trigger,
      baseAmount: round2(baseAmount),
      commissionType: rule.type,
      commissionRate: Number(rule.value) || 0,
      commissionAmount,
    }],
    { session }
  );

  const wallet = await StaffWallet.findOneAndUpdate(
    { staff: staff._id },
    { $setOnInsert: { staff: staff._id }, $inc: { availableBalance: commissionAmount } },
    { upsert: true, new: true, setDefaultsOnInsert: true, session }
  );

  if (commissionAmount > 0) {
    await StaffLedgerEntry.create(
      [{
        staff: staff._id,
        type: 'commission_earned',
        amount: commissionAmount,
        availableBalanceAfter: wallet.availableBalance,
        reference: reward._id,
        meta: {
          member: memberId,
          memberType,
          trigger,
          baseAmount: reward.baseAmount,
          commissionType: rule.type,
          commissionRate: rule.value,
        },
      }],
      { session }
    );
  }

  return reward;
};

const awardReferralCommission = async (data, options = {}) => {
  if (options.session) return createReferralReward(data, options);

  const session = await mongoose.startSession();
  let reward = null;
  try {
    await session.withTransaction(async () => {
      reward = await createReferralReward(data, { session });
    });
  } catch (error) {
    if (error.code !== 11000) throw error;
    return null;
  } finally {
    await session.endSession();
  }
  return reward;
};

module.exports = { DEFAULT_RULES, calculateCommission, getReferralSettings, awardReferralCommission };
