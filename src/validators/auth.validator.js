const { body } = require('express-validator');

const emailField = body('email').trim().isEmail().withMessage('A valid email is required').normalizeEmail();

const otpField = body('otp')
  .trim()
  .isLength({ min: 6, max: 6 })
  .withMessage('OTP must be a 6-digit code')
  .isNumeric()
  .withMessage('OTP must be a 6-digit code');

const signupValidator = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  emailField,
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
  body('role')
    .optional()
    .isIn(['shopper', 'shopkeeper'])
    .withMessage('Role must be shopper or shopkeeper'),
  body('businessType')
    .if(body('role').equals('shopkeeper'))
    .notEmpty()
    .withMessage('businessType is required for shopkeeper accounts')
    .bail()
    .isIn(['shop', 'property', 'car', 'bike'])
    .withMessage('businessType must be one of shop, property, car, bike'),
];

const loginValidator = [
  emailField,
  body('password').notEmpty().withMessage('Password is required'),
];

const verifyEmailValidator = [emailField, otpField];

const resendOtpValidator = [emailField];

const forgotPasswordValidator = [emailField];

const resetPasswordValidator = [
  emailField,
  otpField,
  body('newPassword')
    .isLength({ min: 6 })
    .withMessage('New password must be at least 6 characters long'),
];

module.exports = {
  signupValidator,
  loginValidator,
  verifyEmailValidator,
  resendOtpValidator,
  forgotPasswordValidator,
  resetPasswordValidator,
};
