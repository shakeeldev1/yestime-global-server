const Wallet = require('../models/wallet.model');
const WalletTransaction = require('../models/walletTransaction.model');
const CompanyWallet = require('../models/companyWallet.model');
const ApiError = require('../utils/ApiError');

const getOrCreateWallet = async (userId) => {
  let wallet = await Wallet.findOne({ user: userId });
  if (!wallet) {
    wallet = await Wallet.create({ user: userId });
  }
  return wallet;
};

const BALANCE_FIELD = { main: 'mainBalance', lottery: 'lotteryBalance' };

const creditWallet = async (userId, walletName, amount, type, meta = {}) => {
  const field = BALANCE_FIELD[walletName];
  const wallet = await getOrCreateWallet(userId);
  wallet[field] += amount;
  await wallet.save();

  await WalletTransaction.create({
    user: userId,
    wallet: walletName,
    direction: 'credit',
    type,
    amount,
    balanceAfter: wallet[field],
    meta,
  });

  return wallet;
};

const debitWallet = async (userId, walletName, amount, type, meta = {}) => {
  const field = BALANCE_FIELD[walletName];
  const wallet = await getOrCreateWallet(userId);
  if (wallet[field] < amount) {
    throw new ApiError(400, `Insufficient ${walletName} wallet balance`);
  }
  wallet[field] -= amount;
  await wallet.save();

  await WalletTransaction.create({
    user: userId,
    wallet: walletName,
    direction: 'debit',
    type,
    amount,
    balanceAfter: wallet[field],
    meta,
  });

  return wallet;
};

const creditCompanyWallet = async (triggeredByUserId, amount, type, meta = {}) => {
  const company = await CompanyWallet.getSingleton();
  company.balance += amount;
  await company.save();

  await WalletTransaction.create({
    user: triggeredByUserId,
    wallet: 'company',
    direction: 'credit',
    type,
    amount,
    balanceAfter: company.balance,
    meta,
  });

  return company;
};

module.exports = { getOrCreateWallet, creditWallet, debitWallet, creditCompanyWallet };
