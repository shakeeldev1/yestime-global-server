const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const env = require('../config/env');

const generateOtp = () => crypto.randomInt(100000, 1000000).toString();

const hashOtp = (otp) => bcrypt.hash(otp, 10);

const compareOtp = (otp, otpHash) => {
  if (!otp || !otpHash) return Promise.resolve(false);
  return bcrypt.compare(otp, otpHash);
};

const getOtpExpiry = () => new Date(Date.now() + env.OTP_EXPIRES_IN_MINUTES * 60 * 1000);

module.exports = { generateOtp, hashOtp, compareOtp, getOtpExpiry };
