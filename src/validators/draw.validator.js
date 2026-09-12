const { body, query } = require('express-validator');

const triggerDrawsValidator = [
  body('count').optional().isInt({ min: 1, max: 1000 }).withMessage('count must be between 1 and 1000'),
  body('winningNumber')
    .optional()
    .trim()
    .isLength({ min: 6, max: 6 })
    .withMessage('winningNumber must be a 6-digit code')
    .isNumeric()
    .withMessage('winningNumber must be a 6-digit code'),
];

const winnerHistoryValidator = [
  query('page').optional().isInt({ min: 1 }).withMessage('page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('limit must be between 1 and 100'),
];

module.exports = { triggerDrawsValidator, winnerHistoryValidator };
