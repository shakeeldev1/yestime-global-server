const { body, query } = require('express-validator');

const topupValidator = [
  body('amount').isFloat({ gt: 0 }).withMessage('Amount must be a positive number'),
  body('provider')
    .optional()
    .isIn(['jazzcash', 'easypaisa'])
    .withMessage('Provider must be jazzcash or easypaisa'),
];

const withdrawValidator = [
  body('amount').isFloat({ gt: 0 }).withMessage('Amount must be a positive number'),
  body('method').isIn(['jazzcash', 'easypaisa', 'bank']).withMessage('Method must be jazzcash, easypaisa or bank'),
  body('accountDetails').trim().notEmpty().withMessage('accountDetails is required'),
];

const rejectWithdrawalValidator = [
  body('reason').optional().trim().isLength({ max: 500 }).withMessage('reason must be under 500 characters'),
];

const walletHistoryValidator = [
  query('wallet')
    .optional()
    .isIn(['main', 'lottery', 'company'])
    .withMessage('wallet must be main, lottery or company'),
  query('direction')
    .optional()
    .isIn(['credit', 'debit'])
    .withMessage('direction must be credit or debit'),
  query('type')
    .optional()
    .isIn([
      'topup',
      'activation_fee',
      'shopkeeper_registration_fee',
      'tax_debit',
      'admin_credit',
      'purchase_credit',
      'lottery_win',
      'withdrawal',
      'dealer_commission',
    ])
    .withMessage('type is not a supported wallet transaction type'),
  query('page').optional().isInt({ min: 1 }).withMessage('page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('limit must be between 1 and 100'),
];

module.exports = { topupValidator, withdrawValidator, rejectWithdrawalValidator, walletHistoryValidator };
