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

const updateProfileValidator = [
  body('name').optional().trim().notEmpty().withMessage('Name cannot be empty'),
  body('phoneNumber')
    .optional({ values: 'null' })
    .trim()
    .isLength({ min: 7, max: 20 })
    .withMessage('phoneNumber must be between 7 and 20 characters'),
  body('shopName').optional().trim().isLength({ min: 1, max: 120 }).withMessage('shopName must be 1 to 120 characters'),
  body('address').optional().trim().isLength({ min: 1, max: 300 }).withMessage('address must be 1 to 300 characters'),
  body('description').optional({ values: 'null' }).trim().isLength({ max: 1000 }).withMessage('description must be at most 1000 characters'),
  body('image').optional({ values: 'null' }).trim().isLength({ max: 500 }).withMessage('image must be at most 500 characters'),
  body('categories').optional().isArray({ min: 1 }).withMessage('categories must contain at least one category'),
  body('categories.*')
    .optional()
    .isIn(['shopping', 'wholesale', 'petrol_diesel', 'motorcycle_scooty', 'car', 'property', 'crop', 'self_service_saving'])
    .withMessage('categories contains an unsupported category'),
];

const changePasswordValidator = [
  body('currentPassword').notEmpty().withMessage('currentPassword is required'),
  body('newPassword').isLength({ min: 6 }).withMessage('newPassword must be at least 6 characters long'),
];

module.exports = {
  signupValidator,
  loginValidator,
  verifyEmailValidator,
  resendOtpValidator,
  forgotPasswordValidator,
  resetPasswordValidator,
  updateProfileValidator,
  changePasswordValidator,
};
