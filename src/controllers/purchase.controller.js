const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const Token = require('../models/token.model');
const Purchase = require('../models/purchase.model');
const { debitWallet, creditWallet, creditCompanyWallet } = require('../services/wallet.service');
const { contributeToActiveToken, getActiveToken } = require('../services/token.service');
const { DEALER_COMPANY_RATE, DEALER_OWN_RATE, SELF_AUTOMATED_COMPANY_RATE } = require('../utils/commission');

const round2 = (n) => Number(n.toFixed(2));

// Shared by the shopkeeper/dealer flow and the self-automated flow: routes
// `companyAmount` out of `payerId`'s own wallet into the company wallet,
// credits `amount` to the buyer's lottery wallet, and runs the level-unlock
// loop on their active token. Returns the pieces the caller needs to persist.
const applyPurchase = async ({ payerId, buyerId, amount, companyAmount, meta }) => {
  await debitWallet(payerId, 'main', companyAmount, 'tax_debit', meta);
  await creditCompanyWallet(payerId, companyAmount, 'admin_credit', meta);

  await creditWallet(buyerId, 'lottery', amount, 'purchase_credit', meta);
  return contributeToActiveToken(buyerId, amount);
};

// POST /api/purchases (shopkeeper only — covers both `shop` sales and
// property/car/bike deals submitted by a registered dealer)
const recordPurchase = asyncHandler(async (req, res) => {
  const { tokenNumber, amount } = req.body;
  const shopkeeper = req.user;

  if (!shopkeeper.businessType) {
    throw new ApiError(400, 'Your account is missing a business type');
  }

  const token = await Token.findOne({ tokenNumber });
  if (!token) {
    throw new ApiError(404, 'No account found with this token number');
  }
  if (token.status !== 'active') {
    throw new ApiError(400, 'This token is no longer active; ask the buyer for their current token number');
  }

  const isShop = shopkeeper.businessType === 'shop';
  const purchaseCategory = shopkeeper.businessCategories?.[0] || shopkeeper.businessType;
  const taxRate = isShop ? shopkeeper.taxRate : DEALER_COMPANY_RATE;
  const taxAmount = round2(amount * (taxRate / 100));
  const dealerCommissionAmount = isShop ? 0 : round2(amount * (DEALER_OWN_RATE / 100));

  // The shopper already paid the shopkeeper/dealer in full, outside the app
  // (cash, in person) — for a dealer this includes their own commission cut,
  // so only the company's share is ever debited here.
  const { leveledUp, completed, newToken } = await applyPurchase({
    payerId: shopkeeper._id,
    buyerId: token.owner,
    amount,
    companyAmount: taxAmount,
    meta: { tokenNumber, amount, category: purchaseCategory },
  });

  const purchase = await Purchase.create({
    shopper: token.owner,
    shopkeeper: shopkeeper._id,
    channel: isShop ? 'shopkeeper' : 'dealer',
    token: token._id,
    tokenNumber: token.tokenNumber,
    category: purchaseCategory,
    amount,
    taxRate,
    taxAmount,
    dealerCommissionAmount,
    leveledUp,
  });

  res.status(201).json(
    new ApiResponse(
      201,
      { purchase, leveledUp, tokenCompleted: completed, newToken },
      'Purchase recorded successfully'
    )
  );
});

// POST /api/purchases/self (shopper only — the app's "Self Automated" option
// for property/car/bike, used when buying without a registered dealer)
const recordSelfPurchase = asyncHandler(async (req, res) => {
  const { category, amount } = req.body;
  const shopper = req.user;

  const token = await getActiveToken(shopper._id);
  if (!token) {
    throw new ApiError(400, 'You need an active token before recording a purchase — activate one first');
  }

  const taxRate = SELF_AUTOMATED_COMPANY_RATE;
  const taxAmount = round2(amount * (taxRate / 100));

  const { leveledUp, completed, newToken } = await applyPurchase({
    payerId: shopper._id,
    buyerId: shopper._id,
    amount,
    companyAmount: taxAmount,
    meta: { tokenNumber: token.tokenNumber, amount, category },
  });

  const purchase = await Purchase.create({
    shopper: shopper._id,
    shopkeeper: null,
    channel: 'self',
    token: token._id,
    tokenNumber: token.tokenNumber,
    category,
    amount,
    taxRate,
    taxAmount,
    dealerCommissionAmount: 0,
    leveledUp,
  });

  res.status(201).json(
    new ApiResponse(
      201,
      { purchase, leveledUp, tokenCompleted: completed, newToken },
      'Purchase recorded successfully'
    )
  );
});

// GET /api/purchases/me
const myPurchases = asyncHandler(async (req, res) => {
  const filter =
    req.user.role === 'shopkeeper' ? { shopkeeper: req.user._id } : { shopper: req.user._id };

  const purchases = await Purchase.find(filter).sort({ createdAt: -1 });
  res.status(200).json(new ApiResponse(200, { purchases }, 'Purchases fetched successfully'));
});

// GET /api/purchases/history
const purchaseHistory = asyncHandler(async (req, res) => {
  const filter =
    req.user.role === 'shopkeeper' ? { shopkeeper: req.user._id } : { shopper: req.user._id };
  const page = Math.max(Number(req.query.page) || 1, 1);
  const limit = Math.min(Math.max(Number(req.query.limit) || 20, 1), 100);

  if (req.query.category) filter.category = req.query.category;
  if (req.query.from || req.query.to) {
    filter.createdAt = {};
    if (req.query.from) filter.createdAt.$gte = new Date(req.query.from);
    if (req.query.to) filter.createdAt.$lte = new Date(req.query.to);
  }

  const skip = (page - 1) * limit;
  const [purchases, total] = await Promise.all([
    Purchase.find(filter).sort({ createdAt: -1, _id: -1 }).skip(skip).limit(limit),
    Purchase.countDocuments(filter),
  ]);

  res.status(200).json(
    new ApiResponse(
      200,
      { purchases, pagination: { page, limit, total, pages: Math.ceil(total / limit) } },
      'Purchase history fetched successfully'
    )
  );
});

// GET /api/purchases/stats
const purchaseStats = asyncHandler(async (req, res) => {
  const filter =
    req.user.role === 'shopkeeper' ? { shopkeeper: req.user._id } : { shopper: req.user._id };

  if (req.query.from || req.query.to) {
    filter.createdAt = {};
    if (req.query.from) filter.createdAt.$gte = new Date(req.query.from);
    if (req.query.to) filter.createdAt.$lte = new Date(req.query.to);
  }

  const [overall, byCategory, byChannel] = await Promise.all([
    Purchase.aggregate([
      { $match: filter },
      {
        $group: {
          _id: null,
          transactionCount: { $sum: 1 },
          totalAmount: { $sum: '$amount' },
          totalTaxAmount: { $sum: '$taxAmount' },
        },
      },
    ]),
    Purchase.aggregate([
      { $match: filter },
      {
        $group: {
          _id: '$category',
          transactionCount: { $sum: 1 },
          totalAmount: { $sum: '$amount' },
          totalTaxAmount: { $sum: '$taxAmount' },
        },
      },
      { $sort: { totalAmount: -1, _id: 1 } },
    ]),
    Purchase.aggregate([
      { $match: filter },
      {
        $group: {
          _id: '$channel',
          transactionCount: { $sum: 1 },
          totalAmount: { $sum: '$amount' },
        },
      },
      { $sort: { totalAmount: -1, _id: 1 } },
    ]),
  ]);

  const { transactionCount = 0, totalAmount = 0, totalTaxAmount = 0 } = overall[0] || {};
  res.status(200).json(
    new ApiResponse(
      200,
      {
        totals: { transactionCount, totalAmount, totalTaxAmount },
        byCategory: byCategory.map(({ _id, ...item }) => ({ category: _id, ...item })),
        byChannel: byChannel.map(({ _id, ...item }) => ({ channel: _id, ...item })),
      },
      'Purchase statistics fetched successfully'
    )
  );
});

module.exports = { recordPurchase, recordSelfPurchase, myPurchases, purchaseHistory, purchaseStats };
