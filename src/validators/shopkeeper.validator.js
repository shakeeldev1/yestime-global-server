const { body, query } = require('express-validator');

const SHOPKEEPER_CATEGORIES = [
  'shopping',
  'wholesale',
  'petrol_diesel',
  'motorcycle_scooty',
  'car',
  'property',
  'crop',
  'self_service_saving',
];

const shopkeeperRegistrationValidator = [
  body('shopName')
    .trim()
    .notEmpty()
    .withMessage('shopName is required')
    .isLength({ max: 120 })
    .withMessage('shopName must be at most 120 characters'),
  body('phoneNumber')
    .trim()
    .notEmpty()
    .withMessage('phoneNumber is required')
    .isLength({ min: 7, max: 20 })
    .withMessage('phoneNumber must be between 7 and 20 characters'),
  body('address')
    .trim()
    .notEmpty()
    .withMessage('address is required')
    .isLength({ max: 300 })
    .withMessage('address must be at most 300 characters'),
  body('description')
    .optional({ values: 'null' })
    .trim()
    .isLength({ max: 1000 })
    .withMessage('description must be at most 1000 characters'),
  body('image')
    .optional({ values: 'null' })
    .trim()
    .isLength({ max: 500 })
    .withMessage('image must be at most 500 characters'),
  body('categories')
    .isArray({ min: 1 })
    .withMessage('categories must contain at least one category'),
  body('categories.*')
    .isIn(SHOPKEEPER_CATEGORIES)
    .withMessage(`categories must contain only: ${SHOPKEEPER_CATEGORIES.join(', ')}`),
];

const shopkeeperDirectoryValidator = [
  query('category').optional().isIn(SHOPKEEPER_CATEGORIES).withMessage('category is not supported'),
  query('search').optional().trim().isLength({ min: 1, max: 100 }).withMessage('search must be 1 to 100 characters'),
  query('page').optional().isInt({ min: 1 }).withMessage('page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('limit must be between 1 and 100'),
];

module.exports = { shopkeeperRegistrationValidator, shopkeeperDirectoryValidator, SHOPKEEPER_CATEGORIES };