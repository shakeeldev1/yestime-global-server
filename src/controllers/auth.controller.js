const ms = require('../utils/ms');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const User = require('../models/user.model');
const env = require('../config/env');
const { generateAccessToken, generateRefreshToken, verifyRefreshToken } = require('../utils/jwt');
const { generateOtp, hashOtp, compareOtp, getOtpExpiry } = require('../utils/otp');
const { sendOtpEmail } = require('../utils/mailer');

const cookieBaseOptions = {
  httpOnly: true,
  secure: env.NODE_ENV === 'production',
  sameSite: env.NODE_ENV === 'production' ? 'none' : 'lax',
};

const setAuthCookies = (res, accessToken, refreshToken) => {
  res.cookie('accessToken', accessToken, {
    ...cookieBaseOptions,
    maxAge: ms(env.JWT_ACCESS_EXPIRES_IN),
  });
  res.cookie('refreshToken', refreshToken, {
    ...cookieBaseOptions,
    maxAge: ms(env.JWT_REFRESH_EXPIRES_IN),
    path: '/api/auth/refresh-token',
  });
};

const clearAuthCookies = (res) => {
  res.clearCookie('accessToken', cookieBaseOptions);
  res.clearCookie('refreshToken', { ...cookieBaseOptions, path: '/api/auth/refresh-token' });
};

const issueTokens = async (user) => {
  const accessToken = generateAccessToken({ sub: user._id.toString(), role: user.role });
  const refreshToken = generateRefreshToken({ sub: user._id.toString() });
  await user.setRefreshToken(refreshToken);
  await user.save({ validateBeforeSave: false });
  return { accessToken, refreshToken };
};

const issueAndSendOtp = async (user, purpose) => {
  const otp = generateOtp();
  user.otpHash = await hashOtp(otp);
  user.otpExpiry = getOtpExpiry();
  user.otpPurpose = purpose;
  await user.save({ validateBeforeSave: false });
  await sendOtpEmail({ to: user.email, name: user.name, otp, purpose });
};

// POST /api/auth/signup
const signup = asyncHandler(async (req, res) => {
  const { name, email, password, role, businessType } = req.body;

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new ApiError(409, 'An account with this email already exists');
  }

  const user = await User.create({
    name,
    email,
    password,
    role: role || 'shopper',
    businessType: role === 'shopkeeper' ? businessType : null,
  });
  await issueAndSendOtp(user, 'verify-email');

  res
    .status(201)
    .json(
      new ApiResponse(
        201,
        { email: user.email },
        'Account created. An OTP has been sent to your email to verify your account'
      )
    );
});

// POST /api/auth/verify-email
const verifyEmail = asyncHandler(async (req, res) => {
  const { email, otp } = req.body;

  const user = await User.findOne({ email }).select('+otpHash +otpExpiry +otpPurpose');
  if (!user) {
    throw new ApiError(404, 'No account found with this email');
  }

  if (user.isVerified) {
    throw new ApiError(400, 'This account is already verified');
  }

  if (user.otpPurpose !== 'verify-email' || !user.otpExpiry || user.otpExpiry < new Date()) {
    throw new ApiError(400, 'OTP is invalid or has expired, please request a new one');
  }

  if (!(await compareOtp(otp, user.otpHash))) {
    throw new ApiError(400, 'OTP is incorrect');
  }

  user.isVerified = true;
  user.clearOtp();

  const { accessToken, refreshToken } = await issueTokens(user);
  setAuthCookies(res, accessToken, refreshToken);

  res
    .status(200)
    .json(new ApiResponse(200, { user, accessToken }, 'Email verified successfully'));
});

// POST /api/auth/resend-otp
const resendOtp = asyncHandler(async (req, res) => {
  const { email } = req.body;

  const user = await User.findOne({ email });
  if (!user) {
    throw new ApiError(404, 'No account found with this email');
  }

  if (user.isVerified) {
    throw new ApiError(400, 'This account is already verified');
  }

  await issueAndSendOtp(user, 'verify-email');

  res.status(200).json(new ApiResponse(200, null, 'A new OTP has been sent to your email'));
});

// POST /api/auth/login
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email }).select('+password');
  if (!user || !(await user.comparePassword(password))) {
    throw new ApiError(401, 'Invalid email or password');
  }

  if (!user.isVerified) {
    throw new ApiError(403, 'Please verify your email before logging in');
  }

  if (user.isBlocked) {
    throw new ApiError(403, 'Your account has been blocked');
  }

  const { accessToken, refreshToken } = await issueTokens(user);
  setAuthCookies(res, accessToken, refreshToken);

  res.status(200).json(new ApiResponse(200, { user, accessToken }, 'Logged in successfully'));
});

// POST /api/auth/logout
const logout = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(req.user._id, { refreshTokenHash: null });
  clearAuthCookies(res);
  res.status(200).json(new ApiResponse(200, null, 'Logged out successfully'));
});

// POST /api/auth/refresh-token
const refreshToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken = req.cookies?.refreshToken || req.body?.refreshToken;

  if (!incomingRefreshToken) {
    throw new ApiError(401, 'Refresh token is missing');
  }

  let decoded;
  try {
    decoded = verifyRefreshToken(incomingRefreshToken);
  } catch (error) {
    throw new ApiError(401, 'Refresh token is invalid or expired');
  }

  const user = await User.findById(decoded.sub).select('+refreshTokenHash');
  if (!user || !(await user.compareRefreshToken(incomingRefreshToken))) {
    throw new ApiError(401, 'Refresh token is invalid or has been revoked');
  }

  const { accessToken, refreshToken: newRefreshToken } = await issueTokens(user);
  setAuthCookies(res, accessToken, newRefreshToken);

  res
    .status(200)
    .json(new ApiResponse(200, { accessToken }, 'Access token refreshed successfully'));
});

// GET /api/auth/me
const myProfile = asyncHandler(async (req, res) => {
  res.status(200).json(new ApiResponse(200, { user: req.user }, 'Profile fetched successfully'));
});

// POST /api/auth/forgot-password
const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;

  const user = await User.findOne({ email });
  if (user) {
    await issueAndSendOtp(user, 'reset-password');
  }

  // Always respond the same way so we don't leak which emails are registered.
  res
    .status(200)
    .json(new ApiResponse(200, null, 'If an account exists for this email, a password reset OTP has been sent'));
});

// POST /api/auth/reset-password
const resetPassword = asyncHandler(async (req, res) => {
  const { email, otp, newPassword } = req.body;

  const user = await User.findOne({ email }).select('+otpHash +otpExpiry +otpPurpose');
  if (!user) {
    throw new ApiError(404, 'No account found with this email');
  }

  if (user.otpPurpose !== 'reset-password' || !user.otpExpiry || user.otpExpiry < new Date()) {
    throw new ApiError(400, 'OTP is invalid or has expired, please request a new one');
  }

  if (!(await compareOtp(otp, user.otpHash))) {
    throw new ApiError(400, 'OTP is incorrect');
  }

  user.password = newPassword;
  user.clearOtp();
  await user.setRefreshToken(null); // revoke any existing sessions
  await user.save();

  res.status(200).json(new ApiResponse(200, null, 'Password reset successfully, please log in'));
});

module.exports = {
  signup,
  verifyEmail,
  resendOtp,
  login,
  logout,
  refreshToken,
  myProfile,
  forgotPassword,
  resetPassword,
};
