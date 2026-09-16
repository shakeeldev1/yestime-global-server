const { body, query } = require('express-validator');

const listUsersValidator = [
  query('role').optional().isIn(['shopper', 'shopkeeper', 'admin']).withMessage('Invalid role'),
  query('businessType')
    .optional()
    .isIn(['shop', 'property', 'car', 'bike'])
    .withMessage('Invalid businessType'),
  query('isVerified').optional().isIn(['true', 'false']).withMessage('isVerified must be true or false'),
  query('isBlocked').optional().isIn(['true', 'false']).withMessage('isBlocked must be true or false'),
  query('page').optional().isInt({ min: 1 }).withMessage('page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('limit must be between 1 and 100'),
];

const createUserValidator = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').trim().isEmail().withMessage('A valid email is required').normalizeEmail(),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
  body('role').isIn(['shopper', 'shopkeeper', 'admin']).withMessage('Role must be shopper, shopkeeper or admin'),
  body('businessType')
    .if(body('role').equals('shopkeeper'))
    .notEmpty()
    .withMessage('businessType is required for shopkeeper accounts')
    .bail()
    .isIn(['shop', 'property', 'car', 'bike'])
    .withMessage('businessType must be one of shop, property, car, bike'),
];

const updateUserValidator = [
  body('name').optional().trim().notEmpty().withMessage('Name cannot be empty'),
  body('role').optional().isIn(['shopper', 'shopkeeper', 'admin']).withMessage('Invalid role'),
  body('businessType')
    .optional()
    .isIn(['shop', 'property', 'car', 'bike'])
    .withMessage('Invalid businessType'),
  body('taxRate').optional().isFloat({ min: 0, max: 100 }).withMessage('taxRate must be between 0 and 100'),
];

const creditWalletValidator = [
  body('wallet').isIn(['main', 'lottery']).withMessage('wallet must be main or lottery'),
  body('amount').isFloat({ min: 0.01 }).withMessage('amount must be greater than 0'),
  body('note').optional().trim().isLength({ max: 200 }).withMessage('note must be 200 characters or fewer'),
];

module.exports = { listUsersValidator, createUserValidator, updateUserValidator, creditWalletValidator };
