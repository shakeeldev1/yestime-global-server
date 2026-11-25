const Wallet = require('../models/wallet.model');
const WalletTransaction = require('../models/walletTransaction.model');
const CompanyWallet = require('../models/companyWallet.model');
const ApiError = require('../utils/ApiError');

const getOrCreateWallet = async (userId, { session } = {}) => {
  const query = Wallet.findOne({ user: userId });
  if (session) query.session(session);

  let wallet = await query;
  if (!wallet) {
    wallet = new Wallet({ user: userId });
    await wallet.save(session ? { session } : {});
  }
  return wallet;
};

const BALANCE_FIELD = { main: 'mainBalance', lottery: 'lotteryBalance' };

const creditWallet = async (userId, walletName, amount, type, meta = {}, { session } = {}) => {
  const field = BALANCE_FIELD[walletName];
  const wallet = await getOrCreateWallet(userId, { session });
  wallet[field] += amount;
  await wallet.save(session ? { session } : {});

  await WalletTransaction.create([{
    user: userId,
    wallet: walletName,
    direction: 'credit',
    type,
    amount,
    balanceAfter: wallet[field],
    meta,
  }], session ? { session } : {});

  return wallet;
};

const debitWallet = async (userId, walletName, amount, type, meta = {}, { session } = {}) => {
  const field = BALANCE_FIELD[walletName];
  const wallet = await getOrCreateWallet(userId, { session });
  if (wallet[field] < amount) {
    throw new ApiError(400, `Insufficient ${walletName} wallet balance`);
  }
  wallet[field] -= amount;
  await wallet.save(session ? { session } : {});

  await WalletTransaction.create([{
    user: userId,
    wallet: walletName,
    direction: 'debit',
    type,
    amount,
    balanceAfter: wallet[field],
    meta,
  }], session ? { session } : {});

  return wallet;
};

const creditCompanyWallet = async (triggeredByUserId, amount, type, meta = {}, { session } = {}) => {
  const company = await CompanyWallet.getSingleton({ session });
  company.balance += amount;
  await company.save(session ? { session } : {});

  await WalletTransaction.create([{
    user: triggeredByUserId,
    wallet: 'company',
    direction: 'credit',
    type,
    amount,
    balanceAfter: company.balance,
    meta,
  }], session ? { session } : {});

  return company;
};

module.exports = { getOrCreateWallet, creditWallet, debitWallet, creditCompanyWallet };
