const { body } = require('express-validator');

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

module.exports = { triggerDrawsValidator };
