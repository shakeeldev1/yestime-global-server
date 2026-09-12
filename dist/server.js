var __getOwnPropNames = Object.getOwnPropertyNames;
var __commonJS = (cb, mod) => function __require() {
  try {
    return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
  } catch (e) {
    throw mod = 0, e;
  }
};

// src/config/env.js
var require_env = __commonJS({
  "src/config/env.js"(exports2, module2) {
    var dotenv = require("dotenv");
    dotenv.config();
    var env2 = {
      NODE_ENV: process.env.NODE_ENV || "development",
      PORT: process.env.PORT || 5e3,
      MONGO_URI: process.env.MONGO_URI,
      CLIENT_URL: process.env.CLIENT_URL || "http://localhost:3000",
      JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET,
      JWT_ACCESS_EXPIRES_IN: process.env.JWT_ACCESS_EXPIRES_IN || "15m",
      JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET,
      JWT_REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN || "7d",
      SMTP_HOST: process.env.SMTP_HOST,
      SMTP_PORT: Number(process.env.SMTP_PORT) || 587,
      SMTP_SECURE: process.env.SMTP_SECURE === "true",
      SMTP_USER: process.env.SMTP_USER,
      SMTP_PASS: process.env.SMTP_PASS,
      MAIL_FROM: process.env.MAIL_FROM || "No Reply <no-reply@example.com>",
      OTP_EXPIRES_IN_MINUTES: Number(process.env.OTP_EXPIRES_IN_MINUTES) || 10,
      ENABLE_DRAW_SCHEDULER: process.env.ENABLE_DRAW_SCHEDULER !== "false",
      // ~1,400 draws/day by default (86400s / 1400 ≈ 62s between draws).
      DRAW_INTERVAL_SECONDS: Number(process.env.DRAW_INTERVAL_SECONDS) || 62
    };
    var requiredKeys = [
      "MONGO_URI",
      "JWT_ACCESS_SECRET",
      "JWT_REFRESH_SECRET",
      "SMTP_HOST",
      "SMTP_USER",
      "SMTP_PASS"
    ];
    for (const key of requiredKeys) {
      if (!env2[key]) {
        throw new Error(`Missing required environment variable: ${key}`);
      }
    }
    module2.exports = env2;
  }
});

// src/utils/ms.js
var require_ms = __commonJS({
  "src/utils/ms.js"(exports2, module2) {
    var UNITS = {
      ms: 1,
      s: 1e3,
      m: 60 * 1e3,
      h: 60 * 60 * 1e3,
      d: 24 * 60 * 60 * 1e3
    };
    var ms = (value) => {
      const match = /^(\d+)(ms|s|m|h|d)$/.exec(String(value).trim());
      if (!match) {
        throw new Error(`Invalid duration string: ${value}`);
      }
      const [, amount, unit] = match;
      return Number(amount) * UNITS[unit];
    };
    module2.exports = ms;
  }
});

// src/utils/asyncHandler.js
var require_asyncHandler = __commonJS({
  "src/utils/asyncHandler.js"(exports2, module2) {
    var asyncHandler = (requestHandler) => (req, res, next) => {
      Promise.resolve(requestHandler(req, res, next)).catch(next);
    };
    module2.exports = asyncHandler;
  }
});

// src/utils/ApiError.js
var require_ApiError = __commonJS({
  "src/utils/ApiError.js"(exports2, module2) {
    var ApiError = class extends Error {
      constructor(statusCode, message = "Something went wrong", errors = []) {
        super(message);
        this.statusCode = statusCode;
        this.errors = errors;
        this.success = false;
        Error.captureStackTrace(this, this.constructor);
      }
    };
    module2.exports = ApiError;
  }
});

// src/utils/ApiResponse.js
var require_ApiResponse = __commonJS({
  "src/utils/ApiResponse.js"(exports2, module2) {
    var ApiResponse = class {
      constructor(statusCode, data = null, message = "Success") {
        this.statusCode = statusCode;
        this.data = data;
        this.message = message;
        this.success = statusCode < 400;
      }
    };
    module2.exports = ApiResponse;
  }
});

// src/models/user.model.js
var require_user_model = __commonJS({
  "src/models/user.model.js"(exports2, module2) {
    var mongoose = require("mongoose");
    var bcrypt = require("bcryptjs");
    var userSchema = new mongoose.Schema(
      {
        name: {
          type: String,
          required: [true, "Name is required"],
          trim: true
        },
        email: {
          type: String,
          required: [true, "Email is required"],
          unique: true,
          lowercase: true,
          trim: true
        },
        password: {
          type: String,
          required: [true, "Password is required"],
          minlength: 6,
          select: false
        },
        role: {
          type: String,
          enum: ["shopper", "shopkeeper", "admin"],
          default: "shopper"
        },
        businessType: {
          type: String,
          enum: ["shop", "property", "car", "bike", null],
          default: null
        },
        shopName: {
          type: String,
          trim: true,
          default: null
        },
        phoneNumber: {
          type: String,
          trim: true,
          default: null
        },
        businessAddress: {
          type: String,
          trim: true,
          default: null
        },
        businessDescription: {
          type: String,
          trim: true,
          default: null
        },
        businessImage: {
          type: String,
          trim: true,
          default: null
        },
        businessCategories: {
          type: [String],
          enum: ["shopping", "wholesale", "petrol_diesel", "motorcycle_scooty", "car", "property", "crop", "self_service_saving"],
          default: []
        },
        shopkeeperRegistrationFee: {
          type: Number,
          default: 0
        },
        shopkeeperRegisteredAt: {
          type: Date,
          default: null
        },
        taxRate: {
          type: Number,
          default: 2.5
        },
        hasActivatedToken: {
          type: Boolean,
          default: false
        },
        isBlocked: {
          type: Boolean,
          default: false
        },
        refreshTokenHash: {
          type: String,
          default: null,
          select: false
        },
        isVerified: {
          type: Boolean,
          default: false
        },
        otpHash: {
          type: String,
          default: null,
          select: false
        },
        otpExpiry: {
          type: Date,
          default: null,
          select: false
        },
        otpPurpose: {
          type: String,
          enum: ["verify-email", "reset-password", null],
          default: null,
          select: false
        }
      },
      { timestamps: true }
    );
    userSchema.pre("save", async function hashPassword(next) {
      if (!this.isModified("password")) return next();
      this.password = await bcrypt.hash(this.password, 10);
      next();
    });
    userSchema.methods.comparePassword = function comparePassword(candidatePassword) {
      return bcrypt.compare(candidatePassword, this.password);
    };
    userSchema.methods.setRefreshToken = async function setRefreshToken(token) {
      this.refreshTokenHash = token ? await bcrypt.hash(token, 10) : null;
    };
    userSchema.methods.compareRefreshToken = function compareRefreshToken(token) {
      if (!this.refreshTokenHash) return Promise.resolve(false);
      return bcrypt.compare(token, this.refreshTokenHash);
    };
    userSchema.methods.clearOtp = function clearOtp() {
      this.otpHash = null;
      this.otpExpiry = null;
      this.otpPurpose = null;
    };
    userSchema.methods.toJSON = function toJSON() {
      const obj = this.toObject();
      delete obj.password;
      delete obj.refreshTokenHash;
      delete obj.otpHash;
      delete obj.otpExpiry;
      delete obj.otpPurpose;
      delete obj.__v;
      return obj;
    };
    module2.exports = mongoose.model("User", userSchema);
  }
});

// src/utils/jwt.js
var require_jwt = __commonJS({
  "src/utils/jwt.js"(exports2, module2) {
    var jwt = require("jsonwebtoken");
    var env2 = require_env();
    var generateAccessToken = (payload) => jwt.sign(payload, env2.JWT_ACCESS_SECRET, { expiresIn: env2.JWT_ACCESS_EXPIRES_IN });
    var generateRefreshToken = (payload) => jwt.sign(payload, env2.JWT_REFRESH_SECRET, { expiresIn: env2.JWT_REFRESH_EXPIRES_IN });
    var verifyAccessToken = (token) => jwt.verify(token, env2.JWT_ACCESS_SECRET);
    var verifyRefreshToken = (token) => jwt.verify(token, env2.JWT_REFRESH_SECRET);
    module2.exports = {
      generateAccessToken,
      generateRefreshToken,
      verifyAccessToken,
      verifyRefreshToken
    };
  }
});

// src/utils/otp.js
var require_otp = __commonJS({
  "src/utils/otp.js"(exports2, module2) {
    var crypto = require("crypto");
    var bcrypt = require("bcryptjs");
    var env2 = require_env();
    var generateOtp = () => crypto.randomInt(1e5, 1e6).toString();
    var hashOtp = (otp) => bcrypt.hash(otp, 10);
    var compareOtp = (otp, otpHash) => {
      if (!otp || !otpHash) return Promise.resolve(false);
      return bcrypt.compare(otp, otpHash);
    };
    var getOtpExpiry = () => new Date(Date.now() + env2.OTP_EXPIRES_IN_MINUTES * 60 * 1e3);
    module2.exports = { generateOtp, hashOtp, compareOtp, getOtpExpiry };
  }
});

// src/utils/mailer.js
var require_mailer = __commonJS({
  "src/utils/mailer.js"(exports2, module2) {
    var nodemailer = require("nodemailer");
    var env2 = require_env();
    var transporter = nodemailer.createTransport({
      host: env2.SMTP_HOST,
      port: env2.SMTP_PORT,
      secure: env2.SMTP_SECURE,
      auth: {
        user: env2.SMTP_USER,
        pass: env2.SMTP_PASS
      }
    });
    var sendMail = async ({ to, subject, html }) => {
      await transporter.sendMail({
        from: env2.MAIL_FROM,
        to,
        subject,
        html
      });
    };
    var otpEmailTemplate = ({ name, otp, purposeText }) => `
  <div style="font-family: Arial, sans-serif; max-width: 480px; margin: auto;">
    <h2>Hi ${name},</h2>
    <p>${purposeText}</p>
    <p style="font-size: 32px; font-weight: bold; letter-spacing: 6px;">${otp}</p>
    <p>This code expires in ${env2.OTP_EXPIRES_IN_MINUTES} minutes. If you did not request this, you can safely ignore this email.</p>
  </div>
`;
    var sendOtpEmail = async ({ to, name, otp, purpose }) => {
      const purposeText = purpose === "reset-password" ? "Use the code below to reset your password." : "Use the code below to verify your email address.";
      const subject = purpose === "reset-password" ? "Your password reset code" : "Verify your email address";
      await sendMail({
        to,
        subject,
        html: otpEmailTemplate({ name, otp, purposeText })
      });
    };
    module2.exports = { sendMail, sendOtpEmail };
  }
});

// src/controllers/auth.controller.js
var require_auth_controller = __commonJS({
  "src/controllers/auth.controller.js"(exports2, module2) {
    var ms = require_ms();
    var asyncHandler = require_asyncHandler();
    var ApiError = require_ApiError();
    var ApiResponse = require_ApiResponse();
    var User = require_user_model();
    var env2 = require_env();
    var { generateAccessToken, generateRefreshToken, verifyRefreshToken } = require_jwt();
    var { generateOtp, hashOtp, compareOtp, getOtpExpiry } = require_otp();
    var { sendOtpEmail } = require_mailer();
    var cookieBaseOptions = {
      httpOnly: true,
      secure: env2.NODE_ENV === "production",
      sameSite: env2.NODE_ENV === "production" ? "none" : "lax"
    };
    var setAuthCookies = (res, accessToken, refreshToken2) => {
      res.cookie("accessToken", accessToken, {
        ...cookieBaseOptions,
        maxAge: ms(env2.JWT_ACCESS_EXPIRES_IN)
      });
      res.cookie("refreshToken", refreshToken2, {
        ...cookieBaseOptions,
        maxAge: ms(env2.JWT_REFRESH_EXPIRES_IN),
        path: "/api/auth/refresh-token"
      });
    };
    var clearAuthCookies = (res) => {
      res.clearCookie("accessToken", cookieBaseOptions);
      res.clearCookie("refreshToken", { ...cookieBaseOptions, path: "/api/auth/refresh-token" });
    };
    var issueTokens = async (user) => {
      const accessToken = generateAccessToken({ sub: user._id.toString(), role: user.role });
      const refreshToken2 = generateRefreshToken({ sub: user._id.toString() });
      await user.setRefreshToken(refreshToken2);
      await user.save({ validateBeforeSave: false });
      return { accessToken, refreshToken: refreshToken2 };
    };
    var issueAndSendOtp = async (user, purpose) => {
      const otp = generateOtp();
      user.otpHash = await hashOtp(otp);
      user.otpExpiry = getOtpExpiry();
      user.otpPurpose = purpose;
      await user.save({ validateBeforeSave: false });
      await sendOtpEmail({ to: user.email, name: user.name, otp, purpose });
    };
    var signup = asyncHandler(async (req, res) => {
      const { name, email, password, role, businessType } = req.body;
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        throw new ApiError(409, "An account with this email already exists");
      }
      const user = await User.create({
        name,
        email,
        password,
        role: role || "shopper",
        businessType: role === "shopkeeper" ? businessType : null
      });
      await issueAndSendOtp(user, "verify-email");
      res.status(201).json(
        new ApiResponse(
          201,
          { email: user.email },
          "Account created. An OTP has been sent to your email to verify your account"
        )
      );
    });
    var verifyEmail = asyncHandler(async (req, res) => {
      const { email, otp } = req.body;
      const user = await User.findOne({ email }).select("+otpHash +otpExpiry +otpPurpose");
      if (!user) {
        throw new ApiError(404, "No account found with this email");
      }
      if (user.isVerified) {
        throw new ApiError(400, "This account is already verified");
      }
      if (user.otpPurpose !== "verify-email" || !user.otpExpiry || user.otpExpiry < /* @__PURE__ */ new Date()) {
        throw new ApiError(400, "OTP is invalid or has expired, please request a new one");
      }
      if (!await compareOtp(otp, user.otpHash)) {
        throw new ApiError(400, "OTP is incorrect");
      }
      user.isVerified = true;
      user.clearOtp();
      const { accessToken, refreshToken: refreshToken2 } = await issueTokens(user);
      setAuthCookies(res, accessToken, refreshToken2);
      res.status(200).json(new ApiResponse(200, { user, accessToken }, "Email verified successfully"));
    });
    var resendOtp = asyncHandler(async (req, res) => {
      const { email } = req.body;
      const user = await User.findOne({ email });
      if (!user) {
        throw new ApiError(404, "No account found with this email");
      }
      if (user.isVerified) {
        throw new ApiError(400, "This account is already verified");
      }
      await issueAndSendOtp(user, "verify-email");
      res.status(200).json(new ApiResponse(200, null, "A new OTP has been sent to your email"));
    });
    var login = asyncHandler(async (req, res) => {
      const { email, password } = req.body;
      const user = await User.findOne({ email }).select("+password");
      if (!user || !await user.comparePassword(password)) {
        throw new ApiError(401, "Invalid email or password");
      }
      if (!user.isVerified) {
        throw new ApiError(403, "Please verify your email before logging in");
      }
      if (user.isBlocked) {
        throw new ApiError(403, "Your account has been blocked");
      }
      const { accessToken, refreshToken: refreshToken2 } = await issueTokens(user);
      setAuthCookies(res, accessToken, refreshToken2);
      res.status(200).json(new ApiResponse(200, { user, accessToken }, "Logged in successfully"));
    });
    var logout = asyncHandler(async (req, res) => {
      await User.findByIdAndUpdate(req.user._id, { refreshTokenHash: null });
      clearAuthCookies(res);
      res.status(200).json(new ApiResponse(200, null, "Logged out successfully"));
    });
    var refreshToken = asyncHandler(async (req, res) => {
      const incomingRefreshToken = req.cookies?.refreshToken || req.body?.refreshToken;
      if (!incomingRefreshToken) {
        throw new ApiError(401, "Refresh token is missing");
      }
      let decoded;
      try {
        decoded = verifyRefreshToken(incomingRefreshToken);
      } catch (error) {
        throw new ApiError(401, "Refresh token is invalid or expired");
      }
      const user = await User.findById(decoded.sub).select("+refreshTokenHash");
      if (!user || !await user.compareRefreshToken(incomingRefreshToken)) {
        throw new ApiError(401, "Refresh token is invalid or has been revoked");
      }
      const { accessToken, refreshToken: newRefreshToken } = await issueTokens(user);
      setAuthCookies(res, accessToken, newRefreshToken);
      res.status(200).json(new ApiResponse(200, { accessToken }, "Access token refreshed successfully"));
    });
    var myProfile = asyncHandler(async (req, res) => {
      res.status(200).json(new ApiResponse(200, { user: req.user }, "Profile fetched successfully"));
    });
    var forgotPassword = asyncHandler(async (req, res) => {
      const { email } = req.body;
      const user = await User.findOne({ email });
      if (user) {
        await issueAndSendOtp(user, "reset-password");
      }
      res.status(200).json(new ApiResponse(200, null, "If an account exists for this email, a password reset OTP has been sent"));
    });
    var resetPassword = asyncHandler(async (req, res) => {
      const { email, otp, newPassword } = req.body;
      const user = await User.findOne({ email }).select("+otpHash +otpExpiry +otpPurpose");
      if (!user) {
        throw new ApiError(404, "No account found with this email");
      }
      if (user.otpPurpose !== "reset-password" || !user.otpExpiry || user.otpExpiry < /* @__PURE__ */ new Date()) {
        throw new ApiError(400, "OTP is invalid or has expired, please request a new one");
      }
      if (!await compareOtp(otp, user.otpHash)) {
        throw new ApiError(400, "OTP is incorrect");
      }
      user.password = newPassword;
      user.clearOtp();
      await user.setRefreshToken(null);
      await user.save();
      res.status(200).json(new ApiResponse(200, null, "Password reset successfully, please log in"));
    });
    module2.exports = {
      signup,
      verifyEmail,
      resendOtp,
      login,
      logout,
      refreshToken,
      myProfile,
      forgotPassword,
      resetPassword
    };
  }
});

// src/validators/auth.validator.js
var require_auth_validator = __commonJS({
  "src/validators/auth.validator.js"(exports2, module2) {
    var { body } = require("express-validator");
    var emailField = body("email").trim().isEmail().withMessage("A valid email is required").normalizeEmail();
    var otpField = body("otp").trim().isLength({ min: 6, max: 6 }).withMessage("OTP must be a 6-digit code").isNumeric().withMessage("OTP must be a 6-digit code");
    var signupValidator = [
      body("name").trim().notEmpty().withMessage("Name is required"),
      emailField,
      body("password").isLength({ min: 6 }).withMessage("Password must be at least 6 characters long"),
      body("role").optional().isIn(["shopper", "shopkeeper"]).withMessage("Role must be shopper or shopkeeper"),
      body("businessType").if(body("role").equals("shopkeeper")).notEmpty().withMessage("businessType is required for shopkeeper accounts").bail().isIn(["shop", "property", "car", "bike"]).withMessage("businessType must be one of shop, property, car, bike")
    ];
    var loginValidator = [
      emailField,
      body("password").notEmpty().withMessage("Password is required")
    ];
    var verifyEmailValidator = [emailField, otpField];
    var resendOtpValidator = [emailField];
    var forgotPasswordValidator = [emailField];
    var resetPasswordValidator = [
      emailField,
      otpField,
      body("newPassword").isLength({ min: 6 }).withMessage("New password must be at least 6 characters long")
    ];
    module2.exports = {
      signupValidator,
      loginValidator,
      verifyEmailValidator,
      resendOtpValidator,
      forgotPasswordValidator,
      resetPasswordValidator
    };
  }
});

// src/middlewares/validate.middleware.js
var require_validate_middleware = __commonJS({
  "src/middlewares/validate.middleware.js"(exports2, module2) {
    var { validationResult } = require("express-validator");
    var ApiError = require_ApiError();
    var validate = (req, res, next) => {
      const errors = validationResult(req);
      if (errors.isEmpty()) return next();
      const formatted = errors.array().map((err) => ({ field: err.path, message: err.msg }));
      next(new ApiError(422, "Validation failed", formatted));
    };
    module2.exports = validate;
  }
});

// src/middlewares/auth.middleware.js
var require_auth_middleware = __commonJS({
  "src/middlewares/auth.middleware.js"(exports2, module2) {
    var asyncHandler = require_asyncHandler();
    var ApiError = require_ApiError();
    var { verifyAccessToken } = require_jwt();
    var User = require_user_model();
    var authenticate = asyncHandler(async (req, _res, next) => {
      const authHeader = req.headers.authorization;
      const token = authHeader && authHeader.startsWith("Bearer ") ? authHeader.split(" ")[1] : req.cookies?.accessToken;
      if (!token) {
        throw new ApiError(401, "Access token is missing");
      }
      let decoded;
      try {
        decoded = verifyAccessToken(token);
      } catch (error) {
        throw new ApiError(401, "Access token is invalid or expired");
      }
      const user = await User.findById(decoded.sub);
      if (!user) {
        throw new ApiError(401, "User belonging to this token no longer exists");
      }
      if (user.isBlocked) {
        throw new ApiError(403, "Your account has been blocked");
      }
      req.user = user;
      next();
    });
    var authorize = (...roles) => (req, _res, next) => {
      if (!roles.includes(req.user.role)) {
        return next(new ApiError(403, "You do not have permission to perform this action"));
      }
      next();
    };
    module2.exports = { authenticate, authorize };
  }
});

// src/routes/auth.routes.js
var require_auth_routes = __commonJS({
  "src/routes/auth.routes.js"(exports2, module2) {
    var express = require("express");
    var {
      signup,
      verifyEmail,
      resendOtp,
      login,
      logout,
      refreshToken,
      myProfile,
      forgotPassword,
      resetPassword
    } = require_auth_controller();
    var {
      signupValidator,
      loginValidator,
      verifyEmailValidator,
      resendOtpValidator,
      forgotPasswordValidator,
      resetPasswordValidator
    } = require_auth_validator();
    var validate = require_validate_middleware();
    var { authenticate } = require_auth_middleware();
    var router = express.Router();
    router.post("/signup", signupValidator, validate, signup);
    router.post("/verify-email", verifyEmailValidator, validate, verifyEmail);
    router.post("/resend-otp", resendOtpValidator, validate, resendOtp);
    router.post("/login", loginValidator, validate, login);
    router.post("/refresh-token", refreshToken);
    router.post("/forgot-password", forgotPasswordValidator, validate, forgotPassword);
    router.post("/reset-password", resetPasswordValidator, validate, resetPassword);
    router.post("/logout", authenticate, logout);
    router.get("/me", authenticate, myProfile);
    module2.exports = router;
  }
});

// src/models/companyWallet.model.js
var require_companyWallet_model = __commonJS({
  "src/models/companyWallet.model.js"(exports2, module2) {
    var mongoose = require("mongoose");
    var companyWalletSchema = new mongoose.Schema(
      {
        key: {
          type: String,
          default: "company",
          unique: true
        },
        balance: {
          type: Number,
          default: 0,
          min: 0
        }
      },
      { timestamps: true }
    );
    companyWalletSchema.statics.getSingleton = async function getSingleton() {
      return this.findOneAndUpdate(
        { key: "company" },
        { $setOnInsert: { balance: 0 } },
        { upsert: true, new: true }
      );
    };
    module2.exports = mongoose.model("CompanyWallet", companyWalletSchema);
  }
});

// src/models/walletTransaction.model.js
var require_walletTransaction_model = __commonJS({
  "src/models/walletTransaction.model.js"(exports2, module2) {
    var mongoose = require("mongoose");
    var walletTransactionSchema = new mongoose.Schema(
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true
        },
        wallet: {
          type: String,
          enum: ["main", "lottery", "company"],
          required: true
        },
        direction: {
          type: String,
          enum: ["credit", "debit"],
          required: true
        },
        type: {
          type: String,
          enum: [
            "topup",
            "activation_fee",
            "shopkeeper_registration_fee",
            "tax_debit",
            "admin_credit",
            "purchase_credit",
            "lottery_win",
            "withdrawal",
            "dealer_commission"
          ],
          required: true
        },
        amount: {
          type: Number,
          required: true,
          min: 0
        },
        balanceAfter: {
          type: Number,
          required: true
        },
        meta: {
          type: mongoose.Schema.Types.Mixed,
          default: {}
        }
      },
      { timestamps: true }
    );
    module2.exports = mongoose.model("WalletTransaction", walletTransactionSchema);
  }
});

// src/models/wallet.model.js
var require_wallet_model = __commonJS({
  "src/models/wallet.model.js"(exports2, module2) {
    var mongoose = require("mongoose");
    var walletSchema = new mongoose.Schema(
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
          unique: true
        },
        // Real, withdrawable money (lottery winnings for shoppers, top-ups for shopkeepers).
        mainBalance: {
          type: Number,
          default: 0,
          min: 0
        },
        // Non-withdrawable running total of purchase amounts credited toward lottery
        // eligibility. Kept for display/audit; the token itself drives the actual
        // level-unlock mechanic.
        lotteryBalance: {
          type: Number,
          default: 0,
          min: 0
        }
      },
      { timestamps: true }
    );
    module2.exports = mongoose.model("Wallet", walletSchema);
  }
});

// src/services/wallet.service.js
var require_wallet_service = __commonJS({
  "src/services/wallet.service.js"(exports2, module2) {
    var Wallet = require_wallet_model();
    var WalletTransaction = require_walletTransaction_model();
    var CompanyWallet = require_companyWallet_model();
    var ApiError = require_ApiError();
    var getOrCreateWallet = async (userId) => {
      let wallet = await Wallet.findOne({ user: userId });
      if (!wallet) {
        wallet = await Wallet.create({ user: userId });
      }
      return wallet;
    };
    var BALANCE_FIELD = { main: "mainBalance", lottery: "lotteryBalance" };
    var creditWallet = async (userId, walletName, amount, type, meta = {}) => {
      const field = BALANCE_FIELD[walletName];
      const wallet = await getOrCreateWallet(userId);
      wallet[field] += amount;
      await wallet.save();
      await WalletTransaction.create({
        user: userId,
        wallet: walletName,
        direction: "credit",
        type,
        amount,
        balanceAfter: wallet[field],
        meta
      });
      return wallet;
    };
    var debitWallet = async (userId, walletName, amount, type, meta = {}) => {
      const field = BALANCE_FIELD[walletName];
      const wallet = await getOrCreateWallet(userId);
      if (wallet[field] < amount) {
        throw new ApiError(400, `Insufficient ${walletName} wallet balance`);
      }
      wallet[field] -= amount;
      await wallet.save();
      await WalletTransaction.create({
        user: userId,
        wallet: walletName,
        direction: "debit",
        type,
        amount,
        balanceAfter: wallet[field],
        meta
      });
      return wallet;
    };
    var creditCompanyWallet = async (triggeredByUserId, amount, type, meta = {}) => {
      const company = await CompanyWallet.getSingleton();
      company.balance += amount;
      await company.save();
      await WalletTransaction.create({
        user: triggeredByUserId,
        wallet: "company",
        direction: "credit",
        type,
        amount,
        balanceAfter: company.balance,
        meta
      });
      return company;
    };
    module2.exports = { getOrCreateWallet, creditWallet, debitWallet, creditCompanyWallet };
  }
});

// src/models/token.model.js
var require_token_model = __commonJS({
  "src/models/token.model.js"(exports2, module2) {
    var mongoose = require("mongoose");
    var tokenSchema = new mongoose.Schema(
      {
        tokenNumber: {
          type: String,
          required: true,
          unique: true
        },
        owner: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true
        },
        generation: {
          type: Number,
          required: true,
          default: 1
        },
        unlockedLevel: {
          type: Number,
          default: 0,
          min: 0,
          max: 30
        },
        pool: {
          type: Number,
          default: 0,
          min: 0
        },
        status: {
          type: String,
          enum: ["active", "completed"],
          default: "active"
        },
        completedAt: {
          type: Date,
          default: null
        }
      },
      { timestamps: true }
    );
    module2.exports = mongoose.model("Token", tokenSchema);
  }
});

// src/utils/tokenNumber.js
var require_tokenNumber = __commonJS({
  "src/utils/tokenNumber.js"(exports2, module2) {
    var crypto = require("crypto");
    var generateTokenNumber = () => crypto.randomInt(0, 1e6).toString().padStart(6, "0");
    module2.exports = { generateTokenNumber };
  }
});

// src/utils/levels.js
var require_levels = __commonJS({
  "src/utils/levels.js"(exports2, module2) {
    var LEVEL_COUNT = 30;
    var LEVEL_UNIT = 1e3;
    var TOKEN_CAP = LEVEL_UNIT * (LEVEL_COUNT * (LEVEL_COUNT + 1)) / 2;
    var levelThreshold = (level) => level * LEVEL_UNIT;
    var applyPoolContribution = (state, amount) => {
      let { unlockedLevel, pool } = state;
      pool += amount;
      const leveledUp = [];
      while (unlockedLevel < LEVEL_COUNT && pool >= levelThreshold(unlockedLevel + 1)) {
        pool -= levelThreshold(unlockedLevel + 1);
        unlockedLevel += 1;
        leveledUp.push(unlockedLevel);
      }
      return {
        unlockedLevel,
        pool,
        leveledUp,
        completed: unlockedLevel === LEVEL_COUNT
      };
    };
    module2.exports = { LEVEL_COUNT, LEVEL_UNIT, TOKEN_CAP, levelThreshold, applyPoolContribution };
  }
});

// src/services/token.service.js
var require_token_service = __commonJS({
  "src/services/token.service.js"(exports2, module2) {
    var Token = require_token_model();
    var { generateTokenNumber } = require_tokenNumber();
    var { applyPoolContribution } = require_levels();
    var MAX_GENERATION_ATTEMPTS = 10;
    var createTokenForOwner = async (ownerId, { generation = 1, pool = 0 } = {}) => {
      for (let attempt = 0; attempt < MAX_GENERATION_ATTEMPTS; attempt += 1) {
        try {
          return await Token.create({
            tokenNumber: generateTokenNumber(),
            owner: ownerId,
            generation,
            pool
          });
        } catch (error) {
          if (error.code === 11e3 && attempt < MAX_GENERATION_ATTEMPTS - 1) {
            continue;
          }
          throw error;
        }
      }
      throw new Error("Failed to generate a unique token number");
    };
    var getActiveToken = (ownerId) => Token.findOne({ owner: ownerId, status: "active" });
    var contributeToActiveToken = async (ownerId, amount) => {
      const token = await getActiveToken(ownerId);
      if (!token) {
        throw new Error(`User ${ownerId} has no active token to contribute to`);
      }
      const result = applyPoolContribution(
        { unlockedLevel: token.unlockedLevel, pool: token.pool },
        amount
      );
      token.unlockedLevel = result.unlockedLevel;
      if (result.completed) {
        token.pool = 0;
        token.status = "completed";
        token.completedAt = /* @__PURE__ */ new Date();
        await token.save();
        const newToken = await createTokenForOwner(ownerId, {
          generation: token.generation + 1,
          pool: result.pool
        });
        return { token, newToken, leveledUp: result.leveledUp, completed: true };
      }
      token.pool = result.pool;
      await token.save();
      return { token, newToken: null, leveledUp: result.leveledUp, completed: false };
    };
    module2.exports = { createTokenForOwner, getActiveToken, contributeToActiveToken };
  }
});

// src/controllers/wallet.controller.js
var require_wallet_controller = __commonJS({
  "src/controllers/wallet.controller.js"(exports2, module2) {
    var asyncHandler = require_asyncHandler();
    var ApiError = require_ApiError();
    var ApiResponse = require_ApiResponse();
    var User = require_user_model();
    var CompanyWallet = require_companyWallet_model();
    var WalletTransaction = require_walletTransaction_model();
    var mongoose = require("mongoose");
    var { getOrCreateWallet, creditWallet, creditCompanyWallet } = require_wallet_service();
    var { createTokenForOwner } = require_token_service();
    var ACTIVATION_FEE = 100;
    var myWallet = asyncHandler(async (req, res) => {
      const wallet = await getOrCreateWallet(req.user._id);
      res.status(200).json(new ApiResponse(200, { wallet }, "Wallet fetched successfully"));
    });
    var getHistory = asyncHandler(async (req, res) => {
      if (req.query.wallet === "company") {
        throw new ApiError(403, "Company wallet history is available to admins only");
      }
      const { page, limit, skip } = getPagination(req.query);
      const filter = buildHistoryFilter(req.query, req.user._id, false);
      const [transactions, total] = await Promise.all([
        WalletTransaction.find(filter).sort({ createdAt: -1, _id: -1 }).skip(skip).limit(limit),
        WalletTransaction.countDocuments(filter)
      ]);
      res.status(200).json(
        new ApiResponse(
          200,
          { transactions, pagination: { page, limit, total, pages: Math.ceil(total / limit) } },
          "Wallet history fetched successfully"
        )
      );
    });
    var getUserHistory = asyncHandler(async (req, res) => {
      const { userId } = req.params;
      if (!mongoose.Types.ObjectId.isValid(userId)) {
        throw new ApiError(400, "Invalid user id");
      }
      const user = await User.findById(userId).select("name email role");
      if (!user) {
        throw new ApiError(404, "User not found");
      }
      const { page, limit, skip } = getPagination(req.query);
      const filter = buildHistoryFilter(req.query, user._id, true);
      const [transactions, total] = await Promise.all([
        WalletTransaction.find(filter).sort({ createdAt: -1, _id: -1 }).skip(skip).limit(limit),
        WalletTransaction.countDocuments(filter)
      ]);
      res.status(200).json(
        new ApiResponse(
          200,
          { user, transactions, pagination: { page, limit, total, pages: Math.ceil(total / limit) } },
          "Wallet history fetched successfully"
        )
      );
    });
    var getPagination = (query) => {
      const page = Math.max(Number(query.page) || 1, 1);
      const limit = Math.min(Math.max(Number(query.limit) || 20, 1), 100);
      return { page, limit, skip: (page - 1) * limit };
    };
    var buildHistoryFilter = (query, userId, includeCompany) => {
      const filter = { user: userId };
      if (!includeCompany) filter.wallet = { $in: ["main", "lottery"] };
      if (query.wallet) filter.wallet = query.wallet;
      if (query.direction) filter.direction = query.direction;
      if (query.type) filter.type = query.type;
      return filter;
    };
    var topup = asyncHandler(async (req, res) => {
      const { amount, provider } = req.body;
      const wallet = await creditWallet(req.user._id, "main", amount, "topup", { provider });
      res.status(200).json(new ApiResponse(200, { wallet }, "Wallet topped up successfully"));
    });
    var activate = asyncHandler(async (req, res) => {
      if (req.user.role !== "shopper") {
        throw new ApiError(403, "Only shopper accounts can activate a token");
      }
      if (req.user.hasActivatedToken) {
        throw new ApiError(400, "Your account already has an active token");
      }
      await creditCompanyWallet(req.user._id, ACTIVATION_FEE, "activation_fee", {});
      const token = await createTokenForOwner(req.user._id, { generation: 1, pool: 0 });
      await User.findByIdAndUpdate(req.user._id, { hasActivatedToken: true });
      res.status(201).json(new ApiResponse(201, { token }, "Token activated successfully"));
    });
    var companyWallet = asyncHandler(async (_req, res) => {
      const company = await CompanyWallet.getSingleton();
      res.status(200).json(new ApiResponse(200, { company }, "Company wallet fetched successfully"));
    });
    module2.exports = { myWallet, getHistory, getUserHistory, topup, activate, companyWallet };
  }
});

// src/models/withdrawal.model.js
var require_withdrawal_model = __commonJS({
  "src/models/withdrawal.model.js"(exports2, module2) {
    var mongoose = require("mongoose");
    var withdrawalSchema = new mongoose.Schema(
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true
        },
        amount: {
          type: Number,
          required: true,
          min: 0
        },
        method: {
          type: String,
          enum: ["jazzcash", "easypaisa", "bank"],
          required: true
        },
        // Phone number (JazzCash/EasyPaisa) or bank account/IBAN, as free text —
        // no payout gateway is wired up yet, so this is only used when an admin
        // processes the payout manually.
        accountDetails: {
          type: String,
          required: true,
          trim: true
        },
        status: {
          type: String,
          enum: ["pending", "completed", "rejected"],
          default: "pending"
        },
        processedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          default: null
        },
        processedAt: {
          type: Date,
          default: null
        },
        rejectionReason: {
          type: String,
          default: null
        }
      },
      { timestamps: true }
    );
    module2.exports = mongoose.model("Withdrawal", withdrawalSchema);
  }
});

// src/controllers/withdrawal.controller.js
var require_withdrawal_controller = __commonJS({
  "src/controllers/withdrawal.controller.js"(exports2, module2) {
    var asyncHandler = require_asyncHandler();
    var ApiError = require_ApiError();
    var ApiResponse = require_ApiResponse();
    var Withdrawal = require_withdrawal_model();
    var { debitWallet, creditWallet } = require_wallet_service();
    var requestWithdrawal = asyncHandler(async (req, res) => {
      const { amount, method, accountDetails } = req.body;
      await debitWallet(req.user._id, "main", amount, "withdrawal", { method, accountDetails });
      const withdrawal = await Withdrawal.create({
        user: req.user._id,
        amount,
        method,
        accountDetails
      });
      res.status(201).json(new ApiResponse(201, { withdrawal }, "Withdrawal request submitted, pending processing"));
    });
    var myWithdrawals = asyncHandler(async (req, res) => {
      const withdrawals = await Withdrawal.find({ user: req.user._id }).sort({ createdAt: -1 });
      res.status(200).json(new ApiResponse(200, { withdrawals }, "Withdrawals fetched successfully"));
    });
    var listWithdrawals = asyncHandler(async (req, res) => {
      const filter = {};
      if (req.query.status) filter.status = req.query.status;
      const withdrawals = await Withdrawal.find(filter).sort({ createdAt: -1 }).populate({ path: "user", select: "name email" });
      res.status(200).json(new ApiResponse(200, { withdrawals }, "Withdrawals fetched successfully"));
    });
    var findPendingWithdrawal = async (id) => {
      const withdrawal = await Withdrawal.findById(id);
      if (!withdrawal) {
        throw new ApiError(404, "Withdrawal request not found");
      }
      if (withdrawal.status !== "pending") {
        throw new ApiError(400, `This withdrawal request is already ${withdrawal.status}`);
      }
      return withdrawal;
    };
    var completeWithdrawal = asyncHandler(async (req, res) => {
      const withdrawal = await findPendingWithdrawal(req.params.id);
      withdrawal.status = "completed";
      withdrawal.processedBy = req.user._id;
      withdrawal.processedAt = /* @__PURE__ */ new Date();
      await withdrawal.save();
      res.status(200).json(new ApiResponse(200, { withdrawal }, "Withdrawal marked as completed"));
    });
    var rejectWithdrawal = asyncHandler(async (req, res) => {
      const withdrawal = await findPendingWithdrawal(req.params.id);
      await creditWallet(withdrawal.user, "main", withdrawal.amount, "withdrawal", {
        reversalOf: withdrawal._id
      });
      withdrawal.status = "rejected";
      withdrawal.processedBy = req.user._id;
      withdrawal.processedAt = /* @__PURE__ */ new Date();
      withdrawal.rejectionReason = req.body.reason || null;
      await withdrawal.save();
      res.status(200).json(new ApiResponse(200, { withdrawal }, "Withdrawal rejected and amount refunded to wallet"));
    });
    module2.exports = {
      requestWithdrawal,
      myWithdrawals,
      listWithdrawals,
      completeWithdrawal,
      rejectWithdrawal
    };
  }
});

// src/validators/wallet.validator.js
var require_wallet_validator = __commonJS({
  "src/validators/wallet.validator.js"(exports2, module2) {
    var { body, query } = require("express-validator");
    var topupValidator = [
      body("amount").isFloat({ gt: 0 }).withMessage("Amount must be a positive number"),
      body("provider").optional().isIn(["jazzcash", "easypaisa"]).withMessage("Provider must be jazzcash or easypaisa")
    ];
    var withdrawValidator = [
      body("amount").isFloat({ gt: 0 }).withMessage("Amount must be a positive number"),
      body("method").isIn(["jazzcash", "easypaisa", "bank"]).withMessage("Method must be jazzcash, easypaisa or bank"),
      body("accountDetails").trim().notEmpty().withMessage("accountDetails is required")
    ];
    var rejectWithdrawalValidator = [
      body("reason").optional().trim().isLength({ max: 500 }).withMessage("reason must be under 500 characters")
    ];
    var walletHistoryValidator = [
      query("wallet").optional().isIn(["main", "lottery", "company"]).withMessage("wallet must be main, lottery or company"),
      query("direction").optional().isIn(["credit", "debit"]).withMessage("direction must be credit or debit"),
      query("type").optional().isIn([
        "topup",
        "activation_fee",
        "shopkeeper_registration_fee",
        "tax_debit",
        "admin_credit",
        "purchase_credit",
        "lottery_win",
        "withdrawal",
        "dealer_commission"
      ]).withMessage("type is not a supported wallet transaction type"),
      query("page").optional().isInt({ min: 1 }).withMessage("page must be a positive integer"),
      query("limit").optional().isInt({ min: 1, max: 100 }).withMessage("limit must be between 1 and 100")
    ];
    module2.exports = { topupValidator, withdrawValidator, rejectWithdrawalValidator, walletHistoryValidator };
  }
});

// src/routes/wallet.routes.js
var require_wallet_routes = __commonJS({
  "src/routes/wallet.routes.js"(exports2, module2) {
    var express = require("express");
    var { myWallet, getHistory, getUserHistory, topup, companyWallet } = require_wallet_controller();
    var {
      requestWithdrawal,
      myWithdrawals,
      listWithdrawals,
      completeWithdrawal,
      rejectWithdrawal
    } = require_withdrawal_controller();
    var {
      topupValidator,
      withdrawValidator,
      rejectWithdrawalValidator,
      walletHistoryValidator
    } = require_wallet_validator();
    var validate = require_validate_middleware();
    var { authenticate, authorize } = require_auth_middleware();
    var router = express.Router();
    router.get("/me", authenticate, myWallet);
    router.get("/history", authenticate, walletHistoryValidator, validate, getHistory);
    router.get("/history/:userId", authenticate, authorize("admin"), walletHistoryValidator, validate, getUserHistory);
    router.post("/topup", authenticate, topupValidator, validate, topup);
    router.get("/company", authenticate, authorize("admin"), companyWallet);
    router.post("/withdraw", authenticate, withdrawValidator, validate, requestWithdrawal);
    router.get("/withdrawals/me", authenticate, myWithdrawals);
    router.get("/withdrawals", authenticate, authorize("admin"), listWithdrawals);
    router.post("/withdrawals/:id/complete", authenticate, authorize("admin"), completeWithdrawal);
    router.post(
      "/withdrawals/:id/reject",
      authenticate,
      authorize("admin"),
      rejectWithdrawalValidator,
      validate,
      rejectWithdrawal
    );
    module2.exports = router;
  }
});

// src/controllers/token.controller.js
var require_token_controller = __commonJS({
  "src/controllers/token.controller.js"(exports2, module2) {
    var asyncHandler = require_asyncHandler();
    var ApiResponse = require_ApiResponse();
    var Token = require_token_model();
    var myTokens = asyncHandler(async (req, res) => {
      const tokens = await Token.find({ owner: req.user._id }).sort({ generation: 1 });
      res.status(200).json(new ApiResponse(200, { tokens }, "Tokens fetched successfully"));
    });
    module2.exports = { myTokens };
  }
});

// src/routes/token.routes.js
var require_token_routes = __commonJS({
  "src/routes/token.routes.js"(exports2, module2) {
    var express = require("express");
    var { activate } = require_wallet_controller();
    var { myTokens } = require_token_controller();
    var { authenticate } = require_auth_middleware();
    var router = express.Router();
    router.post("/activate", authenticate, activate);
    router.get("/me", authenticate, myTokens);
    module2.exports = router;
  }
});

// src/models/purchase.model.js
var require_purchase_model = __commonJS({
  "src/models/purchase.model.js"(exports2, module2) {
    var mongoose = require("mongoose");
    var purchaseSchema = new mongoose.Schema(
      {
        shopper: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true
        },
        // null for a self-automated purchase (the shopper recorded it themselves,
        // no dealer/shopkeeper involved).
        shopkeeper: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          default: null
        },
        // Who submitted this purchase: a shop's shopkeeper, a registered
        // property/car/bike dealer, or the shopper themselves (self-automated).
        channel: {
          type: String,
          enum: ["shopkeeper", "dealer", "self"],
          required: true
        },
        token: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Token",
          required: true
        },
        tokenNumber: {
          type: String,
          required: true
        },
        category: {
          type: String,
          enum: [
            "shop",
            "shopping",
            "wholesale",
            "petrol_diesel",
            "motorcycle_scooty",
            "crop",
            "self_service_saving",
            "property",
            "car",
            "bike"
          ],
          default: "shop"
        },
        amount: {
          type: Number,
          required: true,
          min: 0
        },
        // Percentage and amount of `amount` routed to the company wallet.
        taxRate: {
          type: Number,
          required: true
        },
        taxAmount: {
          type: Number,
          required: true
        },
        // Informational only for `channel: 'dealer'` — the dealer's own cut,
        // already collected in cash from the buyer; never moved through a wallet.
        dealerCommissionAmount: {
          type: Number,
          default: 0
        },
        leveledUp: {
          type: [Number],
          default: []
        }
      },
      { timestamps: true }
    );
    module2.exports = mongoose.model("Purchase", purchaseSchema);
  }
});

// src/utils/commission.js
var require_commission = __commonJS({
  "src/utils/commission.js"(exports2, module2) {
    var DEALER_COMPANY_RATE = 1;
    var DEALER_OWN_RATE = 1;
    var SELF_AUTOMATED_COMPANY_RATE = 1;
    module2.exports = { DEALER_COMPANY_RATE, DEALER_OWN_RATE, SELF_AUTOMATED_COMPANY_RATE };
  }
});

// src/controllers/purchase.controller.js
var require_purchase_controller = __commonJS({
  "src/controllers/purchase.controller.js"(exports2, module2) {
    var asyncHandler = require_asyncHandler();
    var ApiError = require_ApiError();
    var ApiResponse = require_ApiResponse();
    var Token = require_token_model();
    var Purchase = require_purchase_model();
    var { debitWallet, creditWallet, creditCompanyWallet } = require_wallet_service();
    var { contributeToActiveToken, getActiveToken } = require_token_service();
    var { DEALER_COMPANY_RATE, DEALER_OWN_RATE, SELF_AUTOMATED_COMPANY_RATE } = require_commission();
    var round2 = (n) => Number(n.toFixed(2));
    var applyPurchase = async ({ payerId, buyerId, amount, companyAmount, meta }) => {
      await debitWallet(payerId, "main", companyAmount, "tax_debit", meta);
      await creditCompanyWallet(payerId, companyAmount, "admin_credit", meta);
      await creditWallet(buyerId, "lottery", amount, "purchase_credit", meta);
      return contributeToActiveToken(buyerId, amount);
    };
    var recordPurchase = asyncHandler(async (req, res) => {
      const { tokenNumber, amount } = req.body;
      const shopkeeper = req.user;
      if (!shopkeeper.businessType) {
        throw new ApiError(400, "Your account is missing a business type");
      }
      const token = await Token.findOne({ tokenNumber });
      if (!token) {
        throw new ApiError(404, "No account found with this token number");
      }
      if (token.status !== "active") {
        throw new ApiError(400, "This token is no longer active; ask the buyer for their current token number");
      }
      const isShop = shopkeeper.businessType === "shop";
      const purchaseCategory = shopkeeper.businessCategories?.[0] || shopkeeper.businessType;
      const taxRate = isShop ? shopkeeper.taxRate : DEALER_COMPANY_RATE;
      const taxAmount = round2(amount * (taxRate / 100));
      const dealerCommissionAmount = isShop ? 0 : round2(amount * (DEALER_OWN_RATE / 100));
      const { leveledUp, completed, newToken } = await applyPurchase({
        payerId: shopkeeper._id,
        buyerId: token.owner,
        amount,
        companyAmount: taxAmount,
        meta: { tokenNumber, amount, category: purchaseCategory }
      });
      const purchase = await Purchase.create({
        shopper: token.owner,
        shopkeeper: shopkeeper._id,
        channel: isShop ? "shopkeeper" : "dealer",
        token: token._id,
        tokenNumber: token.tokenNumber,
        category: purchaseCategory,
        amount,
        taxRate,
        taxAmount,
        dealerCommissionAmount,
        leveledUp
      });
      res.status(201).json(
        new ApiResponse(
          201,
          { purchase, leveledUp, tokenCompleted: completed, newToken },
          "Purchase recorded successfully"
        )
      );
    });
    var recordSelfPurchase = asyncHandler(async (req, res) => {
      const { category, amount } = req.body;
      const shopper = req.user;
      const token = await getActiveToken(shopper._id);
      if (!token) {
        throw new ApiError(400, "You need an active token before recording a purchase \u2014 activate one first");
      }
      const taxRate = SELF_AUTOMATED_COMPANY_RATE;
      const taxAmount = round2(amount * (taxRate / 100));
      const { leveledUp, completed, newToken } = await applyPurchase({
        payerId: shopper._id,
        buyerId: shopper._id,
        amount,
        companyAmount: taxAmount,
        meta: { tokenNumber: token.tokenNumber, amount, category }
      });
      const purchase = await Purchase.create({
        shopper: shopper._id,
        shopkeeper: null,
        channel: "self",
        token: token._id,
        tokenNumber: token.tokenNumber,
        category,
        amount,
        taxRate,
        taxAmount,
        dealerCommissionAmount: 0,
        leveledUp
      });
      res.status(201).json(
        new ApiResponse(
          201,
          { purchase, leveledUp, tokenCompleted: completed, newToken },
          "Purchase recorded successfully"
        )
      );
    });
    var myPurchases = asyncHandler(async (req, res) => {
      const filter = req.user.role === "shopkeeper" ? { shopkeeper: req.user._id } : { shopper: req.user._id };
      const purchases = await Purchase.find(filter).sort({ createdAt: -1 });
      res.status(200).json(new ApiResponse(200, { purchases }, "Purchases fetched successfully"));
    });
    var purchaseHistory = asyncHandler(async (req, res) => {
      const filter = req.user.role === "shopkeeper" ? { shopkeeper: req.user._id } : { shopper: req.user._id };
      const page = Math.max(Number(req.query.page) || 1, 1);
      const limit = Math.min(Math.max(Number(req.query.limit) || 20, 1), 100);
      if (req.query.category) filter.category = req.query.category;
      if (req.query.from || req.query.to) {
        filter.createdAt = {};
        if (req.query.from) filter.createdAt.$gte = new Date(req.query.from);
        if (req.query.to) filter.createdAt.$lte = new Date(req.query.to);
      }
      const skip = (page - 1) * limit;
      const [purchases, total] = await Promise.all([
        Purchase.find(filter).sort({ createdAt: -1, _id: -1 }).skip(skip).limit(limit),
        Purchase.countDocuments(filter)
      ]);
      res.status(200).json(
        new ApiResponse(
          200,
          { purchases, pagination: { page, limit, total, pages: Math.ceil(total / limit) } },
          "Purchase history fetched successfully"
        )
      );
    });
    var purchaseStats = asyncHandler(async (req, res) => {
      const filter = req.user.role === "shopkeeper" ? { shopkeeper: req.user._id } : { shopper: req.user._id };
      if (req.query.from || req.query.to) {
        filter.createdAt = {};
        if (req.query.from) filter.createdAt.$gte = new Date(req.query.from);
        if (req.query.to) filter.createdAt.$lte = new Date(req.query.to);
      }
      const [overall, byCategory, byChannel] = await Promise.all([
        Purchase.aggregate([
          { $match: filter },
          {
            $group: {
              _id: null,
              transactionCount: { $sum: 1 },
              totalAmount: { $sum: "$amount" },
              totalTaxAmount: { $sum: "$taxAmount" }
            }
          }
        ]),
        Purchase.aggregate([
          { $match: filter },
          {
            $group: {
              _id: "$category",
              transactionCount: { $sum: 1 },
              totalAmount: { $sum: "$amount" },
              totalTaxAmount: { $sum: "$taxAmount" }
            }
          },
          { $sort: { totalAmount: -1, _id: 1 } }
        ]),
        Purchase.aggregate([
          { $match: filter },
          {
            $group: {
              _id: "$channel",
              transactionCount: { $sum: 1 },
              totalAmount: { $sum: "$amount" }
            }
          },
          { $sort: { totalAmount: -1, _id: 1 } }
        ])
      ]);
      const { transactionCount = 0, totalAmount = 0, totalTaxAmount = 0 } = overall[0] || {};
      res.status(200).json(
        new ApiResponse(
          200,
          {
            totals: { transactionCount, totalAmount, totalTaxAmount },
            byCategory: byCategory.map(({ _id, ...item }) => ({ category: _id, ...item })),
            byChannel: byChannel.map(({ _id, ...item }) => ({ channel: _id, ...item }))
          },
          "Purchase statistics fetched successfully"
        )
      );
    });
    module2.exports = { recordPurchase, recordSelfPurchase, myPurchases, purchaseHistory, purchaseStats };
  }
});

// src/validators/purchase.validator.js
var require_purchase_validator = __commonJS({
  "src/validators/purchase.validator.js"(exports2, module2) {
    var { body, query } = require("express-validator");
    var recordPurchaseValidator = [
      body("tokenNumber").trim().isLength({ min: 6, max: 6 }).withMessage("Token number must be a 6-digit code").isNumeric().withMessage("Token number must be a 6-digit code"),
      body("amount").isFloat({ gt: 0 }).withMessage("Amount must be a positive number")
    ];
    var recordSelfPurchaseValidator = [
      body("category").isIn(["property", "car", "bike"]).withMessage("category must be one of property, car, bike"),
      body("amount").isFloat({ gt: 0 }).withMessage("Amount must be a positive number")
    ];
    var purchaseStatsValidator = [
      query("category").optional().isIn([
        "shop",
        "shopping",
        "wholesale",
        "petrol_diesel",
        "motorcycle_scooty",
        "crop",
        "self_service_saving",
        "property",
        "car",
        "bike"
      ]).withMessage("category is not a supported purchase category"),
      query("from").optional().isISO8601().withMessage("from must be a valid ISO date"),
      query("to").optional().isISO8601().withMessage("to must be a valid ISO date")
    ];
    module2.exports = { recordPurchaseValidator, recordSelfPurchaseValidator, purchaseStatsValidator };
  }
});

// src/routes/purchase.routes.js
var require_purchase_routes = __commonJS({
  "src/routes/purchase.routes.js"(exports2, module2) {
    var express = require("express");
    var {
      recordPurchase,
      recordSelfPurchase,
      myPurchases,
      purchaseHistory,
      purchaseStats
    } = require_purchase_controller();
    var {
      recordPurchaseValidator,
      recordSelfPurchaseValidator,
      purchaseStatsValidator
    } = require_purchase_validator();
    var validate = require_validate_middleware();
    var { authenticate, authorize } = require_auth_middleware();
    var router = express.Router();
    router.post("/", authenticate, authorize("shopkeeper"), recordPurchaseValidator, validate, recordPurchase);
    router.post(
      "/self",
      authenticate,
      authorize("shopper"),
      recordSelfPurchaseValidator,
      validate,
      recordSelfPurchase
    );
    router.get("/stats", authenticate, purchaseStatsValidator, validate, purchaseStats);
    router.get("/history", authenticate, purchaseStatsValidator, validate, purchaseHistory);
    router.get("/me", authenticate, myPurchases);
    module2.exports = router;
  }
});

// src/models/draw.model.js
var require_draw_model = __commonJS({
  "src/models/draw.model.js"(exports2, module2) {
    var mongoose = require("mongoose");
    var drawSchema = new mongoose.Schema(
      {
        winningNumber: {
          type: String,
          required: true
        },
        winnerToken: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Token",
          default: null
        },
        winnerUser: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          default: null
        },
        rewardLevel: {
          type: Number,
          default: 0
        },
        rewardAmount: {
          type: Number,
          default: 0
        }
      },
      { timestamps: true }
    );
    module2.exports = mongoose.model("Draw", drawSchema);
  }
});

// src/services/draw.service.js
var require_draw_service = __commonJS({
  "src/services/draw.service.js"(exports2, module2) {
    var Token = require_token_model();
    var Draw = require_draw_model();
    var env2 = require_env();
    var { generateTokenNumber } = require_tokenNumber();
    var { creditWallet } = require_wallet_service();
    var runDraw = async ({ forceWinningNumber } = {}) => {
      const winningNumber = env2.NODE_ENV !== "production" && forceWinningNumber ? forceWinningNumber : generateTokenNumber();
      const winningToken = await Token.findOne({ tokenNumber: winningNumber, unlockedLevel: { $gte: 1 } });
      if (!winningToken) {
        return Draw.create({ winningNumber, winnerToken: null, winnerUser: null, rewardLevel: 0, rewardAmount: 0 });
      }
      const rewardAmount = winningToken.unlockedLevel * 1e3;
      await creditWallet(winningToken.owner, "main", rewardAmount, "lottery_win", {
        tokenId: winningToken._id,
        tokenNumber: winningToken.tokenNumber,
        level: winningToken.unlockedLevel
      });
      return Draw.create({
        winningNumber,
        winnerToken: winningToken._id,
        winnerUser: winningToken.owner,
        rewardLevel: winningToken.unlockedLevel,
        rewardAmount
      });
    };
    var runDraws = async (count, { forceWinningNumber } = {}) => {
      const draws = [];
      for (let i = 0; i < count; i += 1) {
        const draw = await runDraw(count === 1 ? { forceWinningNumber } : {});
        draws.push(draw);
      }
      return draws;
    };
    module2.exports = { runDraw, runDraws };
  }
});

// src/services/scheduler.service.js
var require_scheduler_service = __commonJS({
  "src/services/scheduler.service.js"(exports2, module2) {
    var { runDraw } = require_draw_service();
    var state = {
      timer: null,
      intervalSeconds: null,
      lastRunAt: null,
      lastError: null,
      totalRuns: 0
    };
    var tick = async () => {
      try {
        await runDraw();
        state.lastRunAt = /* @__PURE__ */ new Date();
        state.lastError = null;
        state.totalRuns += 1;
      } catch (error) {
        state.lastError = error.message;
      }
    };
    var start = (intervalSeconds) => {
      if (state.timer) return getStatus();
      state.intervalSeconds = intervalSeconds;
      state.timer = setInterval(tick, intervalSeconds * 1e3);
      state.timer.unref?.();
      return getStatus();
    };
    var stop = () => {
      if (state.timer) {
        clearInterval(state.timer);
        state.timer = null;
      }
      return getStatus();
    };
    var getStatus = () => ({
      enabled: Boolean(state.timer),
      intervalSeconds: state.intervalSeconds,
      lastRunAt: state.lastRunAt,
      lastError: state.lastError,
      totalRuns: state.totalRuns
    });
    module2.exports = { start, stop, getStatus };
  }
});

// src/controllers/draw.controller.js
var require_draw_controller = __commonJS({
  "src/controllers/draw.controller.js"(exports2, module2) {
    var asyncHandler = require_asyncHandler();
    var ApiResponse = require_ApiResponse();
    var ApiError = require_ApiError();
    var Draw = require_draw_model();
    var { runDraws } = require_draw_service();
    var scheduler = require_scheduler_service();
    var env2 = require_env();
    var triggerDraws = asyncHandler(async (req, res) => {
      const count = req.body.count || 1;
      const draws = await runDraws(count, { forceWinningNumber: req.body.winningNumber });
      const winners = draws.filter((draw) => draw.winnerToken);
      res.status(201).json(new ApiResponse(201, { draws, winnersCount: winners.length }, `${count} draw(s) run`));
    });
    var listDraws = asyncHandler(async (req, res) => {
      const limit = Math.min(Number(req.query.limit) || 50, 200);
      const draws = await Draw.find().sort({ createdAt: -1 }).limit(limit).select("winningNumber rewardLevel rewardAmount createdAt winnerToken").populate({ path: "winnerToken", select: "tokenNumber" });
      res.status(200).json(new ApiResponse(200, { draws }, "Draws fetched successfully"));
    });
    var myWins = asyncHandler(async (req, res) => {
      const draws = await Draw.find({ winnerUser: req.user._id }).sort({ createdAt: -1 }).populate({ path: "winnerToken", select: "tokenNumber" });
      res.status(200).json(new ApiResponse(200, { draws }, "Your wins fetched successfully"));
    });
    var schedulerStatus = asyncHandler(async (_req, res) => {
      res.status(200).json(new ApiResponse(200, { scheduler: scheduler.getStatus() }, "Scheduler status fetched"));
    });
    var startScheduler = asyncHandler(async (req, res) => {
      const intervalSeconds = req.body.intervalSeconds || env2.DRAW_INTERVAL_SECONDS;
      if (intervalSeconds < 5) {
        throw new ApiError(400, "intervalSeconds must be at least 5");
      }
      const status = scheduler.start(intervalSeconds);
      res.status(200).json(new ApiResponse(200, { scheduler: status }, "Draw scheduler started"));
    });
    var stopScheduler = asyncHandler(async (_req, res) => {
      const status = scheduler.stop();
      res.status(200).json(new ApiResponse(200, { scheduler: status }, "Draw scheduler stopped"));
    });
    module2.exports = {
      triggerDraws,
      listDraws,
      myWins,
      schedulerStatus,
      startScheduler,
      stopScheduler
    };
  }
});

// src/validators/draw.validator.js
var require_draw_validator = __commonJS({
  "src/validators/draw.validator.js"(exports2, module2) {
    var { body } = require("express-validator");
    var triggerDrawsValidator = [
      body("count").optional().isInt({ min: 1, max: 1e3 }).withMessage("count must be between 1 and 1000"),
      body("winningNumber").optional().trim().isLength({ min: 6, max: 6 }).withMessage("winningNumber must be a 6-digit code").isNumeric().withMessage("winningNumber must be a 6-digit code")
    ];
    module2.exports = { triggerDrawsValidator };
  }
});

// src/routes/draw.routes.js
var require_draw_routes = __commonJS({
  "src/routes/draw.routes.js"(exports2, module2) {
    var express = require("express");
    var {
      triggerDraws,
      listDraws,
      myWins,
      schedulerStatus,
      startScheduler,
      stopScheduler
    } = require_draw_controller();
    var { triggerDrawsValidator } = require_draw_validator();
    var validate = require_validate_middleware();
    var { authenticate, authorize } = require_auth_middleware();
    var router = express.Router();
    router.post("/run", authenticate, authorize("admin"), triggerDrawsValidator, validate, triggerDraws);
    router.get("/scheduler", authenticate, authorize("admin"), schedulerStatus);
    router.post("/scheduler/start", authenticate, authorize("admin"), startScheduler);
    router.post("/scheduler/stop", authenticate, authorize("admin"), stopScheduler);
    router.get("/my-wins", authenticate, myWins);
    router.get("/", listDraws);
    module2.exports = router;
  }
});

// src/controllers/admin.controller.js
var require_admin_controller = __commonJS({
  "src/controllers/admin.controller.js"(exports2, module2) {
    var asyncHandler = require_asyncHandler();
    var ApiError = require_ApiError();
    var ApiResponse = require_ApiResponse();
    var User = require_user_model();
    var Wallet = require_wallet_model();
    var Token = require_token_model();
    var Purchase = require_purchase_model();
    var Withdrawal = require_withdrawal_model();
    var Draw = require_draw_model();
    var CompanyWallet = require_companyWallet_model();
    var paginate = (query) => {
      const page = Math.max(Number(query.page) || 1, 1);
      const limit = Math.min(Math.max(Number(query.limit) || 20, 1), 100);
      return { page, limit, skip: (page - 1) * limit };
    };
    var listUsers = asyncHandler(async (req, res) => {
      const { role, businessType, isVerified, isBlocked, search } = req.query;
      const { page, limit, skip } = paginate(req.query);
      const filter = {};
      if (role) filter.role = role;
      if (businessType) filter.businessType = businessType;
      if (isVerified !== void 0) filter.isVerified = isVerified === "true";
      if (isBlocked !== void 0) filter.isBlocked = isBlocked === "true";
      if (search) {
        filter.$or = [
          { name: { $regex: search, $options: "i" } },
          { email: { $regex: search, $options: "i" } }
        ];
      }
      const [users, total] = await Promise.all([
        User.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
        User.countDocuments(filter)
      ]);
      res.status(200).json(
        new ApiResponse(
          200,
          { users, pagination: { page, limit, total, pages: Math.ceil(total / limit) } },
          "Users fetched successfully"
        )
      );
    });
    var getUser = asyncHandler(async (req, res) => {
      const user = await User.findById(req.params.id);
      if (!user) {
        throw new ApiError(404, "User not found");
      }
      const [wallet, tokenCount, purchaseCount] = await Promise.all([
        Wallet.findOne({ user: user._id }),
        Token.countDocuments({ owner: user._id }),
        Purchase.find({ $or: [{ shopper: user._id }, { shopkeeper: user._id }] }).countDocuments()
      ]);
      res.status(200).json(
        new ApiResponse(200, { user, wallet: wallet || null, tokenCount, purchaseCount }, "User fetched successfully")
      );
    });
    var createUser = asyncHandler(async (req, res) => {
      const { name, email, password, role, businessType } = req.body;
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        throw new ApiError(409, "An account with this email already exists");
      }
      const user = await User.create({
        name,
        email,
        password,
        role,
        businessType: role === "shopkeeper" ? businessType : null,
        isVerified: true
      });
      res.status(201).json(new ApiResponse(201, { user }, "User created successfully"));
    });
    var updateUser = asyncHandler(async (req, res) => {
      const user = await User.findById(req.params.id);
      if (!user) {
        throw new ApiError(404, "User not found");
      }
      const { name, role, businessType, taxRate } = req.body;
      if (name !== void 0) user.name = name;
      if (role !== void 0) user.role = role;
      if (taxRate !== void 0) user.taxRate = taxRate;
      if (businessType !== void 0) {
        user.businessType = user.role === "shopkeeper" ? businessType : null;
      } else if (role !== void 0 && role !== "shopkeeper") {
        user.businessType = null;
      }
      if (user.role === "shopkeeper" && !user.businessType) {
        throw new ApiError(400, "businessType is required for shopkeeper accounts");
      }
      await user.save();
      res.status(200).json(new ApiResponse(200, { user }, "User updated successfully"));
    });
    var blockUser = asyncHandler(async (req, res) => {
      if (req.params.id === req.user._id.toString()) {
        throw new ApiError(400, "You cannot block your own account");
      }
      const user = await User.findByIdAndUpdate(req.params.id, { isBlocked: true }, { new: true });
      if (!user) {
        throw new ApiError(404, "User not found");
      }
      res.status(200).json(new ApiResponse(200, { user }, "User blocked successfully"));
    });
    var unblockUser = asyncHandler(async (req, res) => {
      const user = await User.findByIdAndUpdate(req.params.id, { isBlocked: false }, { new: true });
      if (!user) {
        throw new ApiError(404, "User not found");
      }
      res.status(200).json(new ApiResponse(200, { user }, "User unblocked successfully"));
    });
    var deleteUser = asyncHandler(async (req, res) => {
      if (req.params.id === req.user._id.toString()) {
        throw new ApiError(400, "You cannot delete your own account");
      }
      const user = await User.findById(req.params.id);
      if (!user) {
        throw new ApiError(404, "User not found");
      }
      const [wallet, tokenCount] = await Promise.all([
        Wallet.findOne({ user: user._id }),
        Token.countDocuments({ owner: user._id })
      ]);
      const hasBalance = wallet && (wallet.mainBalance > 0 || wallet.lotteryBalance > 0);
      if (hasBalance || tokenCount > 0) {
        throw new ApiError(
          400,
          "This user has wallet balance or tokens on record and cannot be deleted \u2014 block the account instead"
        );
      }
      await User.findByIdAndDelete(user._id);
      if (wallet) await Wallet.deleteOne({ _id: wallet._id });
      res.status(200).json(new ApiResponse(200, null, "User deleted successfully"));
    });
    var getStats = asyncHandler(async (req, res) => {
      const [
        totalUsers,
        totalShoppers,
        totalShopkeepers,
        totalBlocked,
        totalTokens,
        completedTokens,
        purchaseAgg,
        totalDraws,
        totalWins,
        pendingWithdrawals,
        company
      ] = await Promise.all([
        User.countDocuments(),
        User.countDocuments({ role: "shopper" }),
        User.countDocuments({ role: "shopkeeper" }),
        User.countDocuments({ isBlocked: true }),
        Token.countDocuments(),
        Token.countDocuments({ status: "completed" }),
        Purchase.aggregate([{ $group: { _id: null, count: { $sum: 1 }, totalAmount: { $sum: "$amount" } } }]),
        Draw.countDocuments(),
        Draw.countDocuments({ winnerToken: { $ne: null } }),
        Withdrawal.aggregate([
          { $match: { status: "pending" } },
          { $group: { _id: null, count: { $sum: 1 }, totalAmount: { $sum: "$amount" } } }
        ]),
        CompanyWallet.getSingleton()
      ]);
      res.status(200).json(
        new ApiResponse(
          200,
          {
            users: { total: totalUsers, shoppers: totalShoppers, shopkeepers: totalShopkeepers, blocked: totalBlocked },
            tokens: { total: totalTokens, completed: completedTokens },
            purchases: {
              count: purchaseAgg[0]?.count || 0,
              totalAmount: purchaseAgg[0]?.totalAmount || 0
            },
            draws: { total: totalDraws, winners: totalWins },
            pendingWithdrawals: {
              count: pendingWithdrawals[0]?.count || 0,
              totalAmount: pendingWithdrawals[0]?.totalAmount || 0
            },
            companyWalletBalance: company.balance
          },
          "Stats fetched successfully"
        )
      );
    });
    module2.exports = { listUsers, getUser, createUser, updateUser, blockUser, unblockUser, deleteUser, getStats };
  }
});

// src/validators/admin.validator.js
var require_admin_validator = __commonJS({
  "src/validators/admin.validator.js"(exports2, module2) {
    var { body, query } = require("express-validator");
    var listUsersValidator = [
      query("role").optional().isIn(["shopper", "shopkeeper", "admin"]).withMessage("Invalid role"),
      query("businessType").optional().isIn(["shop", "property", "car", "bike"]).withMessage("Invalid businessType"),
      query("isVerified").optional().isIn(["true", "false"]).withMessage("isVerified must be true or false"),
      query("isBlocked").optional().isIn(["true", "false"]).withMessage("isBlocked must be true or false"),
      query("page").optional().isInt({ min: 1 }).withMessage("page must be a positive integer"),
      query("limit").optional().isInt({ min: 1, max: 100 }).withMessage("limit must be between 1 and 100")
    ];
    var createUserValidator = [
      body("name").trim().notEmpty().withMessage("Name is required"),
      body("email").trim().isEmail().withMessage("A valid email is required").normalizeEmail(),
      body("password").isLength({ min: 6 }).withMessage("Password must be at least 6 characters long"),
      body("role").isIn(["shopper", "shopkeeper", "admin"]).withMessage("Role must be shopper, shopkeeper or admin"),
      body("businessType").if(body("role").equals("shopkeeper")).notEmpty().withMessage("businessType is required for shopkeeper accounts").bail().isIn(["shop", "property", "car", "bike"]).withMessage("businessType must be one of shop, property, car, bike")
    ];
    var updateUserValidator = [
      body("name").optional().trim().notEmpty().withMessage("Name cannot be empty"),
      body("role").optional().isIn(["shopper", "shopkeeper", "admin"]).withMessage("Invalid role"),
      body("businessType").optional().isIn(["shop", "property", "car", "bike"]).withMessage("Invalid businessType"),
      body("taxRate").optional().isFloat({ min: 0, max: 100 }).withMessage("taxRate must be between 0 and 100")
    ];
    module2.exports = { listUsersValidator, createUserValidator, updateUserValidator };
  }
});

// src/routes/admin.routes.js
var require_admin_routes = __commonJS({
  "src/routes/admin.routes.js"(exports2, module2) {
    var express = require("express");
    var {
      listUsers,
      getUser,
      createUser,
      updateUser,
      blockUser,
      unblockUser,
      deleteUser,
      getStats
    } = require_admin_controller();
    var { listUsersValidator, createUserValidator, updateUserValidator } = require_admin_validator();
    var validate = require_validate_middleware();
    var { authenticate, authorize } = require_auth_middleware();
    var router = express.Router();
    router.use(authenticate, authorize("admin"));
    router.get("/stats", getStats);
    router.get("/users", listUsersValidator, validate, listUsers);
    router.post("/users", createUserValidator, validate, createUser);
    router.get("/users/:id", getUser);
    router.patch("/users/:id", updateUserValidator, validate, updateUser);
    router.post("/users/:id/block", blockUser);
    router.post("/users/:id/unblock", unblockUser);
    router.delete("/users/:id", deleteUser);
    module2.exports = router;
  }
});

// src/controllers/shopkeeper.controller.js
var require_shopkeeper_controller = __commonJS({
  "src/controllers/shopkeeper.controller.js"(exports2, module2) {
    var asyncHandler = require_asyncHandler();
    var ApiError = require_ApiError();
    var ApiResponse = require_ApiResponse();
    var User = require_user_model();
    var { debitWallet, creditCompanyWallet, getOrCreateWallet } = require_wallet_service();
    var SHOPKEEPER_REGISTRATION_FEE = 1500;
    var getBusinessType = (category) => {
      if (category === "property") return "property";
      if (category === "car") return "car";
      if (category === "motorcycle_scooty") return "bike";
      return "shop";
    };
    var listShopkeepers = asyncHandler(async (req, res) => {
      const page = Math.max(Number(req.query.page) || 1, 1);
      const limit = Math.min(Math.max(Number(req.query.limit) || 20, 1), 100);
      const filter = { role: "shopkeeper", isVerified: true, isBlocked: false };
      if (req.query.category) filter.businessCategories = req.query.category;
      if (req.query.search) {
        const search = req.query.search.trim();
        filter.$or = [
          { shopName: { $regex: search, $options: "i" } },
          { businessAddress: { $regex: search, $options: "i" } },
          { businessDescription: { $regex: search, $options: "i" } }
        ];
      }
      const skip = (page - 1) * limit;
      const [shopkeepers, total] = await Promise.all([
        User.find(filter).select("shopName phoneNumber businessAddress businessDescription businessImage businessCategories businessType shopkeeperRegisteredAt").sort({ shopkeeperRegisteredAt: -1, _id: -1 }).skip(skip).limit(limit),
        User.countDocuments(filter)
      ]);
      res.status(200).json(
        new ApiResponse(
          200,
          { shopkeepers, pagination: { page, limit, total, pages: Math.ceil(total / limit) } },
          "Shopkeepers fetched successfully"
        )
      );
    });
    var registerShopkeeper = asyncHandler(async (req, res) => {
      const user = req.user;
      if (user.role !== "shopper") {
        throw new ApiError(400, "Only shopper accounts can register as a shopkeeper");
      }
      const { shopName, phoneNumber, address, description, image, categories } = req.body;
      const businessType = getBusinessType(categories[0]);
      const wallet = await getOrCreateWallet(user._id);
      if (wallet.mainBalance < SHOPKEEPER_REGISTRATION_FEE) {
        throw new ApiError(400, "Insufficient main wallet balance for the Rs 1500 shopkeeper registration fee");
      }
      await debitWallet(user._id, "main", SHOPKEEPER_REGISTRATION_FEE, "shopkeeper_registration_fee", {
        shopName,
        categories
      });
      await creditCompanyWallet(user._id, SHOPKEEPER_REGISTRATION_FEE, "shopkeeper_registration_fee", {
        shopName,
        categories
      });
      user.role = "shopkeeper";
      user.businessType = businessType;
      user.shopName = shopName;
      user.phoneNumber = phoneNumber;
      user.businessAddress = address;
      user.businessDescription = description || null;
      user.businessImage = image || null;
      user.businessCategories = [...new Set(categories)];
      user.shopkeeperRegistrationFee = SHOPKEEPER_REGISTRATION_FEE;
      user.shopkeeperRegisteredAt = /* @__PURE__ */ new Date();
      await user.save();
      res.status(201).json(
        new ApiResponse(
          201,
          { user, registrationFee: SHOPKEEPER_REGISTRATION_FEE },
          "Shopkeeper registered successfully"
        )
      );
    });
    module2.exports = { registerShopkeeper, listShopkeepers };
  }
});

// src/validators/shopkeeper.validator.js
var require_shopkeeper_validator = __commonJS({
  "src/validators/shopkeeper.validator.js"(exports2, module2) {
    var { body, query } = require("express-validator");
    var SHOPKEEPER_CATEGORIES = [
      "shopping",
      "wholesale",
      "petrol_diesel",
      "motorcycle_scooty",
      "car",
      "property",
      "crop",
      "self_service_saving"
    ];
    var shopkeeperRegistrationValidator = [
      body("shopName").trim().notEmpty().withMessage("shopName is required").isLength({ max: 120 }).withMessage("shopName must be at most 120 characters"),
      body("phoneNumber").trim().notEmpty().withMessage("phoneNumber is required").isLength({ min: 7, max: 20 }).withMessage("phoneNumber must be between 7 and 20 characters"),
      body("address").trim().notEmpty().withMessage("address is required").isLength({ max: 300 }).withMessage("address must be at most 300 characters"),
      body("description").optional({ values: "null" }).trim().isLength({ max: 1e3 }).withMessage("description must be at most 1000 characters"),
      body("image").optional({ values: "null" }).trim().isLength({ max: 500 }).withMessage("image must be at most 500 characters"),
      body("categories").isArray({ min: 1 }).withMessage("categories must contain at least one category"),
      body("categories.*").isIn(SHOPKEEPER_CATEGORIES).withMessage(`categories must contain only: ${SHOPKEEPER_CATEGORIES.join(", ")}`)
    ];
    var shopkeeperDirectoryValidator = [
      query("category").optional().isIn(SHOPKEEPER_CATEGORIES).withMessage("category is not supported"),
      query("search").optional().trim().isLength({ min: 1, max: 100 }).withMessage("search must be 1 to 100 characters"),
      query("page").optional().isInt({ min: 1 }).withMessage("page must be a positive integer"),
      query("limit").optional().isInt({ min: 1, max: 100 }).withMessage("limit must be between 1 and 100")
    ];
    module2.exports = { shopkeeperRegistrationValidator, shopkeeperDirectoryValidator, SHOPKEEPER_CATEGORIES };
  }
});

// src/routes/shopkeeper.routes.js
var require_shopkeeper_routes = __commonJS({
  "src/routes/shopkeeper.routes.js"(exports2, module2) {
    var express = require("express");
    var { registerShopkeeper, listShopkeepers } = require_shopkeeper_controller();
    var {
      shopkeeperRegistrationValidator,
      shopkeeperDirectoryValidator
    } = require_shopkeeper_validator();
    var validate = require_validate_middleware();
    var { authenticate } = require_auth_middleware();
    var router = express.Router();
    router.get("/", shopkeeperDirectoryValidator, validate, listShopkeepers);
    router.post("/register", authenticate, shopkeeperRegistrationValidator, validate, registerShopkeeper);
    module2.exports = router;
  }
});

// src/routes/index.js
var require_routes = __commonJS({
  "src/routes/index.js"(exports2, module2) {
    var express = require("express");
    var authRoutes = require_auth_routes();
    var walletRoutes = require_wallet_routes();
    var tokenRoutes = require_token_routes();
    var purchaseRoutes = require_purchase_routes();
    var drawRoutes = require_draw_routes();
    var adminRoutes = require_admin_routes();
    var shopkeeperRoutes = require_shopkeeper_routes();
    var router = express.Router();
    router.get("/health", (_req, res) => res.status(200).json({ success: true, message: "OK" }));
    router.use("/auth", authRoutes);
    router.use("/wallet", walletRoutes);
    router.use("/tokens", tokenRoutes);
    router.use("/purchases", purchaseRoutes);
    router.use("/draws", drawRoutes);
    router.use("/admin", adminRoutes);
    router.use("/shopkeepers", shopkeeperRoutes);
    module2.exports = router;
  }
});

// src/middlewares/error.middleware.js
var require_error_middleware = __commonJS({
  "src/middlewares/error.middleware.js"(exports2, module2) {
    var ApiError = require_ApiError();
    var env2 = require_env();
    var notFound = (req, _res, next) => {
      next(new ApiError(404, `Route not found - ${req.originalUrl}`));
    };
    var errorHandler = (err, _req, res, _next) => {
      let error = err;
      if (!(error instanceof ApiError)) {
        const statusCode = error.statusCode || 500;
        error = new ApiError(statusCode, error.message || "Internal Server Error", error.errors || []);
      }
      if (err.name === "CastError") {
        error = new ApiError(400, `Invalid value for field ${err.path}`);
      }
      if (err.code === 11e3) {
        const field = Object.keys(err.keyValue || {}).join(", ");
        error = new ApiError(409, `${field} already exists`);
      }
      if (err.name === "ValidationError") {
        const messages = Object.values(err.errors).map((val) => val.message);
        error = new ApiError(400, messages.join(", "));
      }
      res.status(error.statusCode).json({
        success: false,
        message: error.message,
        errors: error.errors || [],
        stack: env2.NODE_ENV === "development" ? err.stack : void 0
      });
    };
    module2.exports = { notFound, errorHandler };
  }
});

// src/app.js
var require_app = __commonJS({
  "src/app.js"(exports2, module2) {
    var express = require("express");
    var cors = require("cors");
    var helmet = require("helmet");
    var morgan = require("morgan");
    var cookieParser = require("cookie-parser");
    var env2 = require_env();
    var routes = require_routes();
    var { notFound, errorHandler } = require_error_middleware();
    var app2 = express();
    app2.use(helmet());
    app2.use(
      cors({
        origin: "*",
        credentials: true
      })
    );
    app2.use(express.json());
    app2.use(express.urlencoded({ extended: true }));
    app2.use(cookieParser());
    if (env2.NODE_ENV === "development") {
      app2.use(morgan("dev"));
    }
    app2.get("/", (_req, res) => {
      res.status(200).json({ success: true, message: "YesTime Global server is running" });
    });
    app2.use("/api", routes);
    app2.use(notFound);
    app2.use(errorHandler);
    module2.exports = app2;
  }
});

// src/config/db.js
var require_db = __commonJS({
  "src/config/db.js"(exports2, module2) {
    var mongoose = require("mongoose");
    var env2 = require_env();
    mongoose.set("bufferTimeoutMS", 3e4);
    var connectionPromise = null;
    var connectDB2 = () => {
      if (mongoose.connection.readyState === 1) {
        return Promise.resolve(mongoose.connection);
      }
      if (!connectionPromise) {
        connectionPromise = mongoose.connect(env2.MONGO_URI, { serverSelectionTimeoutMS: 3e4 }).then((conn) => {
          console.log(`MongoDB connected: ${mongoose.connection.host}`);
          return conn;
        }).catch((error) => {
          connectionPromise = null;
          console.error(`MongoDB connection error: ${error.message}`);
          throw error;
        });
      }
      return connectionPromise;
    };
    module2.exports = connectDB2;
  }
});

// src/server.js
var app = require_app();
var connectDB = require_db();
var env = require_env();
var drawScheduler = require_scheduler_service();
var startServer = async () => {
  await connectDB();
  const server = app.listen(env.PORT, () => {
    console.log(`Server running in ${env.NODE_ENV} mode on port ${env.PORT}`);
  });
  if (env.ENABLE_DRAW_SCHEDULER) {
    drawScheduler.start(env.DRAW_INTERVAL_SECONDS);
    console.log(`Draw scheduler running every ${env.DRAW_INTERVAL_SECONDS}s`);
  }
  process.on("unhandledRejection", (err) => {
    console.error(`Unhandled Rejection: ${err.message}`);
    server.close(() => process.exit(1));
  });
  process.on("SIGTERM", () => {
    drawScheduler.stop();
    server.close(() => process.exit(0));
  });
};
startServer().catch((error) => {
  console.error(`Failed to start server: ${error.message}`);
  process.exit(1);
});
