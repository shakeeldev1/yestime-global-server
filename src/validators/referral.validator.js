const { body, param, query } = require('express-validator');

const ruleFields = (prefix, required = false) => [
  body(`${prefix}.type`)
    .if((value, { req }) => required || req.body[prefix.split('.')[0]] !== undefined)
    .isIn(['fixed', 'percentage'])
    .withMessage(`${prefix}.type must be fixed or percentage`),
  body(`${prefix}.value`)
    .if((value, { req }) => required || req.body[prefix.split('.')[0]] !== undefined)
    .isFloat({ min: 0 })
    .withMessage(`${prefix}.value must be zero or greater`),
  body(`${prefix}.value`)
    .if((value, { req }) => req.body[prefix.split('.')[0]]?.type === 'percentage')
    .isFloat({ max: 100 })
    .withMessage(`${prefix}.value cannot exceed 100 for percentage commissions`),
];

const commissionRulesFields = (container, required = false) => [
  ...ruleFields(`${container}.shopper`, required),
  ...ruleFields(`${container}.shopkeeper`, required),
];

const paginationFields = [
  query('page').optional().isInt({ min: 1 }).withMessage('page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('limit must be between 1 and 100'),
];

const staffListValidator = [
  ...paginationFields,
  query('search').optional().trim().isLength({ min: 1, max: 100 }).withMessage('search must be 1 to 100 characters'),
  query('isBlocked').optional().isIn(['true', 'false']).withMessage('isBlocked must be true or false'),
];

const createStaffValidator = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').trim().isEmail().withMessage('A valid email is required').normalizeEmail(),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
  body('phoneNumber').optional({ values: 'null' }).trim().isLength({ max: 20 }).withMessage('phoneNumber must be at most 20 characters'),
  ...commissionRulesFields('commissionRules'),
];

const updateStaffValidator = [
  param('staffId').isMongoId().withMessage('staffId must be a valid id'),
  body('name').optional().trim().notEmpty().withMessage('Name cannot be empty'),
  body('phoneNumber').optional({ values: 'null' }).trim().isLength({ max: 20 }).withMessage('phoneNumber must be at most 20 characters'),
  body('isBlocked').optional().isBoolean().withMessage('isBlocked must be true or false'),
  body('usesGlobalCommissionRules').optional().isBoolean().withMessage('usesGlobalCommissionRules must be true or false'),
  ...commissionRulesFields('commissionRules'),
];

const staffDetailValidator = [
  param('staffId').isMongoId().withMessage('staffId must be a valid id'),
  ...paginationFields,
  query('referralspage').optional().isInt({ min: 1 }).withMessage('referralsPage must be a positive integer'),
  query('referralslimit').optional().isInt({ min: 1, max: 100 }).withMessage('referralsLimit must be between 1 and 100'),
  query('rewardspage').optional().isInt({ min: 1 }).withMessage('rewardsPage must be a positive integer'),
  query('rewardslimit').optional().isInt({ min: 1, max: 100 }).withMessage('rewardsLimit must be between 1 and 100'),
  query('payoutspage').optional().isInt({ min: 1 }).withMessage('payoutsPage must be a positive integer'),
  query('payoutslimit').optional().isInt({ min: 1, max: 100 }).withMessage('payoutsLimit must be between 1 and 100'),
  query('ledgerpage').optional().isInt({ min: 1 }).withMessage('ledgerPage must be a positive integer'),
  query('ledgerlimit').optional().isInt({ min: 1, max: 100 }).withMessage('ledgerLimit must be between 1 and 100'),
];

const referralSettingsValidator = commissionRulesFields('defaultRules', true);

const payoutListValidator = [
  ...paginationFields,
  query('status').optional().isIn(['pending', 'completed', 'rejected', 'all']).withMessage('Invalid payout status'),
  param('staffId').optional().isMongoId().withMessage('staffId must be a valid id'),
];

const requestPayoutValidator = [
  body('amount').isFloat({ min: 0.01 }).withMessage('amount must be greater than 0'),
  body('method').isIn(['jazzcash', 'easypaisa', 'bank']).withMessage('Invalid payout method'),
  body('accountDetails').trim().isLength({ min: 5, max: 300 }).withMessage('accountDetails must be 5 to 300 characters'),
];

const processPayoutValidator = [
  param('payoutId').isMongoId().withMessage('payoutId must be a valid id'),
  body('action').isIn(['completed', 'rejected']).withMessage('action must be completed or rejected'),
  body('reason').if(body('action').equals('rejected')).trim().isLength({ max: 500 }).withMessage('reason must be at most 500 characters'),
  body('reason').optional({ values: 'null' }).trim().isLength({ max: 500 }).withMessage('reason must be at most 500 characters'),
];

module.exports = {
  staffListValidator,
  createStaffValidator,
  updateStaffValidator,
  staffDetailValidator,
  referralSettingsValidator,
  payoutListValidator,
  requestPayoutValidator,
  processPayoutValidator,
};
