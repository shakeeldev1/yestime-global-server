const { body, query, param } = require('express-validator');

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
  body('city')
    .trim()
    .notEmpty()
    .withMessage('city is required')
    .isLength({ max: 100 })
    .withMessage('city must be at most 100 characters'),
  body('lat')
    .notEmpty()
    .withMessage('lat is required')
    .isFloat({ min: -90, max: 90 })
    .withMessage('lat must be between -90 and 90')
    .toFloat(),
  body('lng')
    .notEmpty()
    .withMessage('lng is required')
    .isFloat({ min: -180, max: 180 })
    .withMessage('lng must be between -180 and 180')
    .toFloat(),
];

const shopkeeperDirectoryValidator = [
  query('category').optional().isIn(SHOPKEEPER_CATEGORIES).withMessage('category is not supported'),
  query('search').optional().trim().isLength({ min: 1, max: 100 }).withMessage('search must be 1 to 100 characters'),
  query('city').optional().trim().isLength({ min: 1, max: 100 }).withMessage('city must be 1 to 100 characters'),
  query('lat').optional().isFloat({ min: -90, max: 90 }).withMessage('lat must be between -90 and 90'),
  query('lng').optional().isFloat({ min: -180, max: 180 }).withMessage('lng must be between -180 and 180'),
  query('radiusKm')
    .optional()
    .isFloat({ min: 0.1, max: 1000 })
    .withMessage('radiusKm must be between 0.1 and 1000'),
  query('page').optional().isInt({ min: 1 }).withMessage('page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('limit must be between 1 and 100'),
];

const shopUpdateValidator = [
  param('shopId').isMongoId().withMessage('shopId must be a valid id'),
  body('shopName').optional().trim().notEmpty().isLength({ max: 120 }).withMessage('shopName must be 1 to 120 characters'),
  body('phoneNumber')
    .optional()
    .trim()
    .isLength({ min: 7, max: 20 })
    .withMessage('phoneNumber must be between 7 and 20 characters'),
  body('address').optional().trim().notEmpty().isLength({ max: 300 }).withMessage('address must be 1 to 300 characters'),
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
  body('categories').optional().isArray({ min: 1 }).withMessage('categories must contain at least one category'),
  body('categories.*')
    .optional()
    .isIn(SHOPKEEPER_CATEGORIES)
    .withMessage(`categories must contain only: ${SHOPKEEPER_CATEGORIES.join(', ')}`),
  body('city').optional().trim().notEmpty().isLength({ max: 100 }).withMessage('city must be 1 to 100 characters'),
  body('lat').optional().isFloat({ min: -90, max: 90 }).withMessage('lat must be between -90 and 90').toFloat(),
  body('lng').optional().isFloat({ min: -180, max: 180 }).withMessage('lng must be between -180 and 180').toFloat(),
];

module.exports = {
  shopkeeperRegistrationValidator,
  shopkeeperDirectoryValidator,
  shopUpdateValidator,
  SHOPKEEPER_CATEGORIES,
};