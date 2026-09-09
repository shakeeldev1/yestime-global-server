const { body } = require('express-validator');

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

module.exports = { topupValidator, withdrawValidator, rejectWithdrawalValidator };
