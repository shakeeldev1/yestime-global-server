const { body, query } = require('express-validator');

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

const purchaseStatsValidator = [
  query('category')
    .optional()
    .isIn([
      'shop',
      'shopping',
      'wholesale',
      'petrol_diesel',
      'motorcycle_scooty',
      'crop',
      'self_service_saving',
      'property',
      'car',
      'bike',
    ])
    .withMessage('category is not a supported purchase category'),
  query('from').optional().isISO8601().withMessage('from must be a valid ISO date'),
  query('to').optional().isISO8601().withMessage('to must be a valid ISO date'),
];

module.exports = { recordPurchaseValidator, recordSelfPurchaseValidator, purchaseStatsValidator };
