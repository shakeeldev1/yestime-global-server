const { body } = require('express-validator');

const recordPurchaseValidator = [
  body('tokenNumber')
    .trim()
    .isLength({ min: 6, max: 6 })
    .withMessage('Token number must be a 6-digit code')
    .isNumeric()
    .withMessage('Token number must be a 6-digit code'),
  body('amount').isFloat({ gt: 0 }).withMessage('Amount must be a positive number'),
];

const recordSelfPurchaseValidator = [
  body('category')
    .isIn(['property', 'car', 'bike'])
    .withMessage('category must be one of property, car, bike'),
  body('amount').isFloat({ gt: 0 }).withMessage('Amount must be a positive number'),
];

module.exports = { recordPurchaseValidator, recordSelfPurchaseValidator };
