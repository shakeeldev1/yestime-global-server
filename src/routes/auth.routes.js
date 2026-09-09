const express = require('express');
const {
  signup,
  verifyEmail,
  resendOtp,
  login,
  logout,
  refreshToken,
  myProfile,
  forgotPassword,
  resetPassword,
} = require('../controllers/auth.controller');
const {
  signupValidator,
  loginValidator,
  verifyEmailValidator,
  resendOtpValidator,
  forgotPasswordValidator,
  resetPasswordValidator,
} = require('../validators/auth.validator');
const validate = require('../middlewares/validate.middleware');
const { authenticate } = require('../middlewares/auth.middleware');

const router = express.Router();

router.post('/signup', signupValidator, validate, signup);
router.post('/verify-email', verifyEmailValidator, validate, verifyEmail);
router.post('/resend-otp', resendOtpValidator, validate, resendOtp);

router.post('/login', loginValidator, validate, login);
router.post('/refresh-token', refreshToken);

router.post('/forgot-password', forgotPasswordValidator, validate, forgotPassword);
router.post('/reset-password', resetPasswordValidator, validate, resetPassword);

router.post('/logout', authenticate, logout);
router.get('/me', authenticate, myProfile);

module.exports = router;
