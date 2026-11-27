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
      CORS_ORIGINS: (process.env.CORS_ORIGINS || process.env.CLIENT_URL || "http://localhost:3000").split(",").map((origin) => origin.trim()).filter(Boolean),
      JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET,
      JWT_ACCESS_EXPIRES_IN: process.env.JWT_ACCESS_EXPIRES_IN || "15m",
      JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET,
      JWT_REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN || "7d",
      SMTP_HOST: process.env.SMTP_HOST,
      SMTP_PORT: Number(process.env.SMTP_PORT) || 587,
      SMTP_SECURE: process.env.SMTP_SECURE === "true",
      SMTP_USER: process.env.SMTP_USER,
      SMTP_PASS: process.env.SMTP_PASS,
      MAIL_FROM: process.env.MAIL_FROM || process.env.SMTP_USER,
      ADMIN_EMAIL: process.env.ADMIN_EMAIL || "info@yestimeglobal.com",
      CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME,
      CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY,
      CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET,
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
          enum: ["shopper", "shopkeeper", "staff", "admin"],
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
          enum: ["shopping", "wholesale", "petrol_diesel", "motorcycle_scooty", "car", "property", "crop", "self_service_saving", "education", "factory", "foodpoint", "cosmetic", "jewelry", "fruit", "vegetable seller", "other_custom"],
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
        referredByStaff: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          default: null,
          index: true
        },
        staffReferralCode: {
          type: String,
          trim: true,
          uppercase: true,
          unique: true,
          sparse: true
        },
        staffCommissionRules: {
          shopper: {
            type: {
              type: String,
              enum: ["fixed", "percentage"],
              default: "fixed"
            },
            value: {
              type: Number,
              min: 0,
              default: 0
            }
          },
          shopkeeper: {
            type: {
              type: String,
              enum: ["fixed", "percentage"],
              default: "fixed"
            },
            value: {
              type: Number,
              min: 0,
              default: 0
            }
          }
        },
        usesGlobalCommissionRules: {
          type: Boolean,
          default: false
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

// src/models/shop.model.js
var require_shop_model = __commonJS({
  "src/models/shop.model.js"(exports2, module2) {
    var mongoose = require("mongoose");
    var shopSchema = new mongoose.Schema(
      {
        owner: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
          index: true
        },
        businessType: {
          type: String,
          enum: ["shop", "property", "car", "bike"],
          required: true
        },
        shopName: {
          type: String,
          trim: true,
          required: true
        },
        phoneNumber: {
          type: String,
          trim: true,
          default: null
        },
        businessAddress: {
          type: String,
          trim: true,
          required: true
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
          enum: ["shopping", "wholesale", "petrol_diesel", "motorcycle_scooty", "car", "property", "crop", "self_service_saving", "education", "factory", "foodpoint", "cosmetic", "jewelry", "fruit", "vegetable seller", "other_custom"],
          default: []
        },
        commissionRate: {
          type: Number,
          required: true,
          default: 2.5
        },
        // city/location are required on new registrations (enforced by the
        // registration validator) but left unset on shops backfilled from
        // legacy user records that never captured a location — those simply
        // won't surface in city/"near me" searches until the owner sets one.
        city: {
          type: String,
          trim: true,
          default: null,
          index: true
        },
        location: {
          type: {
            type: String,
            enum: ["Point"]
          },
          coordinates: {
            // [longitude, latitude]
            type: [Number]
          }
        },
        registrationFee: {
          type: Number,
          default: 0
        },
        approvalStatus: {
          type: String,
          enum: ["pending", "approved", "rejected"],
          default: "pending",
          index: true
        },
        reviewedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          default: null
        },
        reviewedAt: {
          type: Date,
          default: null
        },
        rejectionReason: {
          type: String,
          trim: true,
          default: null
        },
        isVerified: {
          type: Boolean,
          default: true
        },
        isBlocked: {
          type: Boolean,
          default: false
        }
      },
      { timestamps: true }
    );
    shopSchema.index({ location: "2dsphere" });
    module2.exports = mongoose.model("Shop", shopSchema);
  }
});

// src/utils/commission.js
var require_commission = __commonJS({
  "src/utils/commission.js"(exports2, module2) {
    var DEFAULT_COMPANY_RATE = 2.5;
    var COMPANY_RATES = {
      shop: 2.5,
      shopping: 2.5,
      wholesale: 2.5,
      petrol_diesel: 0.5,
      car: 1,
      motorcycle_scooty: 1,
      property: 1,
      crop: 2.5,
      self_service_saving: 2.5,
      education: 2.5,
      factory: 2.5,
      foodpoint: 2.5,
      cosmetic: 2.5,
      jewelry: 2.5,
      fruit: 2.5,
      "vegetable seller": 2.5,
      other_custom: 2.5
    };
    var getCompanyRate = (category) => COMPANY_RATES[category] ?? DEFAULT_COMPANY_RATE;
    var DEALER_OWN_RATE = 1;
    module2.exports = { getCompanyRate, DEALER_OWN_RATE };
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
      requireTLS: !env2.SMTP_SECURE,
      tls: { minVersion: "TLSv1.2" },
      auth: {
        user: env2.SMTP_USER,
        pass: env2.SMTP_PASS
      }
    });
    var sendMail = async ({ to, subject, html, text }) => {
      await transporter.sendMail({
        from: env2.MAIL_FROM,
        to,
        subject,
        html,
        text
      });
    };
    var escapeHtml = (value) => String(value).replace(/[&<>"']/g, (character) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    })[character]);
    var otpEmailTemplate = ({ name, otp, purposeText, actionUrl, footerText }) => `
  <div style="font-family: Arial, sans-serif; max-width: 480px; margin: auto;">
    <h2>Hi ${escapeHtml(name)},</h2>
    <p>${purposeText}</p>
    <p style="font-size: 32px; font-weight: bold; letter-spacing: 6px;">${otp}</p>
    ${actionUrl ? `<p><a href="${escapeHtml(actionUrl)}">Set your password</a></p>` : ""}
    <p>This code expires in ${env2.OTP_EXPIRES_IN_MINUTES} minutes. ${footerText}</p>
  </div>
`;
    var sendOtpEmail = async ({ to, name, otp, purpose, isStaffInvite = false }) => {
      const purposeText = isStaffInvite ? "An administrator created a staff account for you. Use the code below to set your password." : purpose === "reset-password" ? "Use the code below to reset your password." : "Use the code below to verify your email address.";
      const subject = isStaffInvite ? "Set up your Yes Time Global staff account" : purpose === "reset-password" ? "Your password reset code" : "Verify your email address";
      const actionUrl = purpose === "reset-password" ? `${env2.CLIENT_URL.replace(/\/+$/, "")}/set-password` : null;
      const footerText = isStaffInvite ? "If you were not expecting a staff account, contact your administrator." : "If you did not request this, you can safely ignore this email.";
      await sendMail({
        to,
        subject,
        html: otpEmailTemplate({ name, otp, purposeText, actionUrl, footerText }),
        text: [
          `Hi ${name},`,
          purposeText,
          `Your one-time code is ${otp}.`,
          actionUrl ? `Set your password: ${actionUrl}` : null,
          `This code expires in ${env2.OTP_EXPIRES_IN_MINUTES} minutes.`,
          footerText
        ].filter(Boolean).join("\n\n")
      });
    };
    var notifyAdmin = async ({ subject, html }) => {
      await sendMail({ to: env2.ADMIN_EMAIL, subject, html });
    };
    var notifyUser = async ({ to, subject, html }) => {
      await sendMail({ to, subject, html });
    };
    module2.exports = { sendMail, sendOtpEmail, notifyAdmin, notifyUser };
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
    var Shop = require_shop_model();
    var { getCompanyRate } = require_commission();
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
      const referralCode = req.body.referralCode?.trim().toUpperCase();
      let referringStaff = null;
      if (referralCode) {
        referringStaff = await User.findOne({
          staffReferralCode: referralCode,
          role: "staff",
          isBlocked: false
        }).select("_id");
        if (!referringStaff) {
          throw new ApiError(400, "Referral code is invalid or inactive");
        }
      }
      const user = await User.create({
        name,
        email,
        password,
        role: role || "shopper",
        businessType: role === "shopkeeper" ? businessType : null,
        referredByStaff: referringStaff?._id || null
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
      const primaryShop = await Shop.findOne({ owner: req.user._id }).sort({ createdAt: 1, _id: 1 }).select("commissionRate businessCategories").lean();
      const user = req.user.toObject();
      if (primaryShop) {
        user.taxRate = primaryShop.commissionRate ?? getCompanyRate(primaryShop.businessCategories?.[0]);
      }
      res.status(200).json(new ApiResponse(200, { user }, "Profile fetched successfully"));
    });
    var updateProfile = asyncHandler(async (req, res) => {
      const user = req.user;
      const { name, phoneNumber, shopName, address, description, image, categories } = req.body;
      if (name !== void 0) user.name = name;
      if (phoneNumber !== void 0) user.phoneNumber = phoneNumber || null;
      const businessFields = [shopName, address, description, image, categories].some(
        (value) => value !== void 0
      );
      if (businessFields && user.role !== "shopkeeper") {
        throw new ApiError(403, "Only shopkeeper accounts can update business profile fields");
      }
      if (shopName !== void 0) user.shopName = shopName;
      if (address !== void 0) user.businessAddress = address;
      if (description !== void 0) user.businessDescription = description || null;
      if (image !== void 0) user.businessImage = image || null;
      if (categories !== void 0) user.businessCategories = [...new Set(categories)];
      await user.save();
      res.status(200).json(new ApiResponse(200, { user }, "Profile updated successfully"));
    });
    var changePassword = asyncHandler(async (req, res) => {
      const { currentPassword, newPassword } = req.body;
      const user = await User.findById(req.user._id).select("+password");
      if (!user || !await user.comparePassword(currentPassword)) {
        throw new ApiError(400, "Current password is incorrect");
      }
      if (currentPassword === newPassword) {
        throw new ApiError(400, "New password must be different from the current password");
      }
      user.password = newPassword;
      await user.setRefreshToken(null);
      await user.save();
      clearAuthCookies(res);
      res.status(200).json(new ApiResponse(200, null, "Password changed successfully, please log in again"));
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
      updateProfile,
      changePassword,
      forgotPassword,
      resetPassword
    };
  }
});

// src/validators/shopkeeper.validator.js
var require_shopkeeper_validator = __commonJS({
  "src/validators/shopkeeper.validator.js"(exports2, module2) {
    var { body, query, param } = require("express-validator");
    var SHOPKEEPER_CATEGORIES = [
      "shopping",
      "wholesale",
      "petrol_diesel",
      "motorcycle_scooty",
      "car",
      "property",
      "crop",
      "self_service_saving",
      "education",
      "factory",
      "foodpoint",
      "cosmetic",
      "jewelry",
      "fruit",
      "vegetable seller",
      "other_custom"
    ];
    var shopkeeperRegistrationValidator = [
      body("shopName").trim().notEmpty().withMessage("shopName is required").isLength({ max: 120 }).withMessage("shopName must be at most 120 characters"),
      body("phoneNumber").trim().notEmpty().withMessage("phoneNumber is required").isLength({ min: 7, max: 20 }).withMessage("phoneNumber must be between 7 and 20 characters"),
      body("address").trim().notEmpty().withMessage("address is required").isLength({ max: 300 }).withMessage("address must be at most 300 characters"),
      body("description").optional({ values: "null" }).trim().isLength({ max: 1e3 }).withMessage("description must be at most 1000 characters"),
      body("categories").isArray({ min: 1 }).withMessage("categories must contain at least one category"),
      body("categories.*").isIn(SHOPKEEPER_CATEGORIES).withMessage(`categories must contain only: ${SHOPKEEPER_CATEGORIES.join(", ")}`),
      body("city").trim().notEmpty().withMessage("city is required").isLength({ max: 100 }).withMessage("city must be at most 100 characters"),
      body("lat").notEmpty().withMessage("lat is required").isFloat({ min: -90, max: 90 }).withMessage("lat must be between -90 and 90").toFloat(),
      body("lng").notEmpty().withMessage("lng is required").isFloat({ min: -180, max: 180 }).withMessage("lng must be between -180 and 180").toFloat()
    ];
    var shopkeeperDirectoryValidator = [
      query("category").optional().isIn(SHOPKEEPER_CATEGORIES).withMessage("category is not supported"),
      query("search").optional().trim().isLength({ min: 1, max: 100 }).withMessage("search must be 1 to 100 characters"),
      query("city").optional().trim().isLength({ min: 1, max: 100 }).withMessage("city must be 1 to 100 characters"),
      query("lat").optional().isFloat({ min: -90, max: 90 }).withMessage("lat must be between -90 and 90"),
      query("lng").optional().isFloat({ min: -180, max: 180 }).withMessage("lng must be between -180 and 180"),
      query("radiusKm").optional().isFloat({ min: 0.1, max: 1e3 }).withMessage("radiusKm must be between 0.1 and 1000"),
      query("page").optional().isInt({ min: 1 }).withMessage("page must be a positive integer"),
      query("limit").optional().isInt({ min: 1, max: 100 }).withMessage("limit must be between 1 and 100")
    ];
    var shopUpdateValidator = [
      param("shopId").isMongoId().withMessage("shopId must be a valid id"),
      body("shopName").optional().trim().notEmpty().isLength({ max: 120 }).withMessage("shopName must be 1 to 120 characters"),
      body("phoneNumber").optional().trim().isLength({ min: 7, max: 20 }).withMessage("phoneNumber must be between 7 and 20 characters"),
      body("address").optional().trim().notEmpty().isLength({ max: 300 }).withMessage("address must be 1 to 300 characters"),
      body("description").optional({ values: "null" }).trim().isLength({ max: 1e3 }).withMessage("description must be at most 1000 characters"),
      body("categories").optional().isArray({ min: 1 }).withMessage("categories must contain at least one category"),
      body("categories.*").optional().isIn(SHOPKEEPER_CATEGORIES).withMessage(`categories must contain only: ${SHOPKEEPER_CATEGORIES.join(", ")}`),
      body("city").optional().trim().notEmpty().isLength({ max: 100 }).withMessage("city must be 1 to 100 characters"),
      body("lat").optional().isFloat({ min: -90, max: 90 }).withMessage("lat must be between -90 and 90").toFloat(),
      body("lng").optional().isFloat({ min: -180, max: 180 }).withMessage("lng must be between -180 and 180").toFloat()
    ];
    var shopDeletionRequestValidator = [
      body("shopId").isMongoId().withMessage("shopId must be a valid id"),
      body("reason").optional({ values: "null" }).trim().isLength({ max: 500 }).withMessage("reason must be at most 500 characters")
    ];
    module2.exports = {
      shopkeeperRegistrationValidator,
      shopkeeperDirectoryValidator,
      shopUpdateValidator,
      shopDeletionRequestValidator,
      SHOPKEEPER_CATEGORIES
    };
  }
});

// src/validators/auth.validator.js
var require_auth_validator = __commonJS({
  "src/validators/auth.validator.js"(exports2, module2) {
    var { body } = require("express-validator");
    var { SHOPKEEPER_CATEGORIES } = require_shopkeeper_validator();
    var emailField = body("email").trim().isEmail().withMessage("A valid email is required").normalizeEmail();
    var otpField = body("otp").trim().isLength({ min: 6, max: 6 }).withMessage("OTP must be a 6-digit code").isNumeric().withMessage("OTP must be a 6-digit code");
    var signupValidator = [
      body("name").trim().notEmpty().withMessage("Name is required"),
      emailField,
      body("password").isLength({ min: 6 }).withMessage("Password must be at least 6 characters long"),
      body("referralCode").optional({ values: "falsy" }).trim().isLength({ min: 4, max: 32 }).withMessage("referralCode must be between 4 and 32 characters"),
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
    var updateProfileValidator = [
      body("name").optional().trim().notEmpty().withMessage("Name cannot be empty"),
      body("phoneNumber").optional({ values: "null" }).trim().isLength({ min: 7, max: 20 }).withMessage("phoneNumber must be between 7 and 20 characters"),
      body("shopName").optional().trim().isLength({ min: 1, max: 120 }).withMessage("shopName must be 1 to 120 characters"),
      body("address").optional().trim().isLength({ min: 1, max: 300 }).withMessage("address must be 1 to 300 characters"),
      body("description").optional({ values: "null" }).trim().isLength({ max: 1e3 }).withMessage("description must be at most 1000 characters"),
      body("image").optional({ values: "null" }).trim().isLength({ max: 500 }).withMessage("image must be at most 500 characters"),
      body("categories").optional().isArray({ min: 1 }).withMessage("categories must contain at least one category"),
      body("categories.*").optional().isIn(SHOPKEEPER_CATEGORIES).withMessage("categories contains an unsupported category")
    ];
    var changePasswordValidator = [
      body("currentPassword").notEmpty().withMessage("currentPassword is required"),
      body("newPassword").isLength({ min: 6 }).withMessage("newPassword must be at least 6 characters long")
    ];
    module2.exports = {
      signupValidator,
      loginValidator,
      verifyEmailValidator,
      resendOtpValidator,
      forgotPasswordValidator,
      resetPasswordValidator,
      updateProfileValidator,
      changePasswordValidator
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
      updateProfile,
      changePassword,
      forgotPassword,
      resetPassword
    } = require_auth_controller();
    var {
      signupValidator,
      loginValidator,
      verifyEmailValidator,
      resendOtpValidator,
      forgotPasswordValidator,
      resetPasswordValidator,
      updateProfileValidator,
      changePasswordValidator
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
    router.patch("/me", authenticate, updateProfileValidator, validate, updateProfile);
    router.post("/change-password", authenticate, changePasswordValidator, validate, changePassword);
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
    companyWalletSchema.statics.getSingleton = async function getSingleton({ session } = {}) {
      return this.findOneAndUpdate(
        { key: "company" },
        { $setOnInsert: { balance: 0 } },
        { upsert: true, new: true, ...session ? { session } : {} }
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
            "activation_bonus",
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
    var getOrCreateWallet = async (userId, { session } = {}) => {
      const query = Wallet.findOne({ user: userId });
      if (session) query.session(session);
      let wallet = await query;
      if (!wallet) {
        wallet = new Wallet({ user: userId });
        await wallet.save(session ? { session } : {});
      }
      return wallet;
    };
    var BALANCE_FIELD = { main: "mainBalance", lottery: "lotteryBalance" };
    var creditWallet = async (userId, walletName, amount, type, meta = {}, { session } = {}) => {
      const field = BALANCE_FIELD[walletName];
      const wallet = await getOrCreateWallet(userId, { session });
      wallet[field] += amount;
      await wallet.save(session ? { session } : {});
      await WalletTransaction.create([{
        user: userId,
        wallet: walletName,
        direction: "credit",
        type,
        amount,
        balanceAfter: wallet[field],
        meta
      }], session ? { session } : {});
      return wallet;
    };
    var debitWallet = async (userId, walletName, amount, type, meta = {}, { session } = {}) => {
      const field = BALANCE_FIELD[walletName];
      const wallet = await getOrCreateWallet(userId, { session });
      if (wallet[field] < amount) {
        throw new ApiError(400, `Insufficient ${walletName} wallet balance`);
      }
      wallet[field] -= amount;
      await wallet.save(session ? { session } : {});
      await WalletTransaction.create([{
        user: userId,
        wallet: walletName,
        direction: "debit",
        type,
        amount,
        balanceAfter: wallet[field],
        meta
      }], session ? { session } : {});
      return wallet;
    };
    var creditCompanyWallet = async (triggeredByUserId, amount, type, meta = {}, { session } = {}) => {
      const company = await CompanyWallet.getSingleton({ session });
      company.balance += amount;
      await company.save(session ? { session } : {});
      await WalletTransaction.create([{
        user: triggeredByUserId,
        wallet: "company",
        direction: "credit",
        type,
        amount,
        balanceAfter: company.balance,
        meta
      }], session ? { session } : {});
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

// src/models/tokenNumberSequence.model.js
var require_tokenNumberSequence_model = __commonJS({
  "src/models/tokenNumberSequence.model.js"(exports2, module2) {
    var mongoose = require("mongoose");
    var TOKEN_SEQUENCE_ID = "token_number";
    var MAX_TOKEN_NUMBER = 999999;
    var tokenNumberSequenceSchema = new mongoose.Schema(
      {
        _id: {
          type: String,
          default: TOKEN_SEQUENCE_ID
        },
        value: {
          type: Number,
          required: true,
          default: 0,
          min: 0,
          max: MAX_TOKEN_NUMBER
        }
      },
      { versionKey: false }
    );
    tokenNumberSequenceSchema.statics.ensureInitialized = async function ensureInitialized() {
      try {
        await this.updateOne(
          { _id: TOKEN_SEQUENCE_ID },
          { $setOnInsert: { value: 0 } },
          { upsert: true }
        );
      } catch (error) {
        if (error.code !== 11e3) throw error;
        const sequence = await this.exists({ _id: TOKEN_SEQUENCE_ID });
        if (!sequence) throw error;
      }
    };
    tokenNumberSequenceSchema.statics.increment = function increment(session) {
      return this.findOneAndUpdate(
        { _id: TOKEN_SEQUENCE_ID, value: { $lt: MAX_TOKEN_NUMBER } },
        { $inc: { value: 1 } },
        { new: true, ...session ? { session } : {} }
      );
    };
    module2.exports = mongoose.model("TokenNumberSequence", tokenNumberSequenceSchema);
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
    var TokenNumberSequence2 = require_tokenNumberSequence_model();
    var { applyPoolContribution } = require_levels();
    var ApiError = require_ApiError();
    var createTokenForOwner = async (ownerId, { generation = 1, pool = 0, session } = {}) => {
      while (true) {
        try {
          const sequence = await TokenNumberSequence2.increment(session);
          if (!sequence) {
            throw new ApiError(503, "The six-digit token number sequence is exhausted or unavailable");
          }
          const tokenNumber = String(sequence.value).padStart(6, "0");
          const existingTokenQuery = Token.exists({ tokenNumber });
          if (session) existingTokenQuery.session(session);
          if (await existingTokenQuery) continue;
          const [token] = await Token.create([{
            tokenNumber,
            owner: ownerId,
            generation,
            pool
          }], session ? { session } : {});
          return token;
        } catch (error) {
          if (!session && error.code === 11e3) {
            continue;
          }
          throw error;
        }
      }
    };
    var getActiveToken = (ownerId, { session } = {}) => {
      const query = Token.findOne({ owner: ownerId, status: "active" });
      return session ? query.session(session) : query;
    };
    var contributeToActiveToken = async (ownerId, amount, { session } = {}) => {
      const token = await getActiveToken(ownerId, { session });
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
        await token.save(session ? { session } : {});
        const newToken = await createTokenForOwner(ownerId, {
          generation: token.generation + 1,
          pool: result.pool,
          session
        });
        return { token, newToken, leveledUp: result.leveledUp, completed: true };
      }
      token.pool = result.pool;
      await token.save(session ? { session } : {});
      return { token, newToken: null, leveledUp: result.leveledUp, completed: false };
    };
    module2.exports = { createTokenForOwner, getActiveToken, contributeToActiveToken };
  }
});

// src/models/referralSettings.model.js
var require_referralSettings_model = __commonJS({
  "src/models/referralSettings.model.js"(exports2, module2) {
    var mongoose = require("mongoose");
    var commissionRuleSchema = new mongoose.Schema(
      {
        type: {
          type: String,
          enum: ["fixed", "percentage"],
          default: "fixed",
          required: true
        },
        value: {
          type: Number,
          min: 0,
          default: 0,
          required: true
        }
      },
      { _id: false }
    );
    var referralSettingsSchema = new mongoose.Schema(
      {
        key: {
          type: String,
          default: "global",
          unique: true
        },
        defaultRules: {
          shopper: { type: commissionRuleSchema, default: () => ({}) },
          shopkeeper: { type: commissionRuleSchema, default: () => ({}) }
        },
        updatedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          default: null
        }
      },
      { timestamps: true }
    );
    module2.exports = mongoose.model("ReferralSettings", referralSettingsSchema);
  }
});

// src/models/referralReward.model.js
var require_referralReward_model = __commonJS({
  "src/models/referralReward.model.js"(exports2, module2) {
    var mongoose = require("mongoose");
    var referralRewardSchema = new mongoose.Schema(
      {
        staff: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
          index: true
        },
        member: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true
        },
        memberType: {
          type: String,
          enum: ["shopper", "shopkeeper"],
          required: true
        },
        trigger: {
          type: String,
          enum: ["token_activation", "shop_registration"],
          required: true
        },
        baseAmount: {
          type: Number,
          required: true,
          min: 0
        },
        commissionType: {
          type: String,
          enum: ["fixed", "percentage"],
          required: true
        },
        commissionRate: {
          type: Number,
          required: true,
          min: 0
        },
        commissionAmount: {
          type: Number,
          required: true,
          min: 0
        }
      },
      { timestamps: true }
    );
    referralRewardSchema.index({ member: 1, memberType: 1 }, { unique: true });
    referralRewardSchema.index({ staff: 1, createdAt: -1 });
    module2.exports = mongoose.model("ReferralReward", referralRewardSchema);
  }
});

// src/models/staffWallet.model.js
var require_staffWallet_model = __commonJS({
  "src/models/staffWallet.model.js"(exports2, module2) {
    var mongoose = require("mongoose");
    var staffWalletSchema = new mongoose.Schema(
      {
        staff: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
          unique: true
        },
        availableBalance: {
          type: Number,
          default: 0,
          min: 0
        },
        reservedBalance: {
          type: Number,
          default: 0,
          min: 0
        },
        paidBalance: {
          type: Number,
          default: 0,
          min: 0
        }
      },
      { timestamps: true }
    );
    module2.exports = mongoose.model("StaffWallet", staffWalletSchema);
  }
});

// src/models/staffLedgerEntry.model.js
var require_staffLedgerEntry_model = __commonJS({
  "src/models/staffLedgerEntry.model.js"(exports2, module2) {
    var mongoose = require("mongoose");
    var staffLedgerEntrySchema = new mongoose.Schema(
      {
        staff: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
          index: true
        },
        type: {
          type: String,
          enum: ["commission_earned", "payout_requested", "payout_rejected", "payout_completed"],
          required: true
        },
        amount: {
          type: Number,
          required: true,
          min: 0
        },
        availableBalanceAfter: {
          type: Number,
          required: true,
          min: 0
        },
        reference: {
          type: mongoose.Schema.Types.ObjectId,
          default: null
        },
        meta: {
          type: mongoose.Schema.Types.Mixed,
          default: {}
        }
      },
      { timestamps: true }
    );
    staffLedgerEntrySchema.index({ staff: 1, createdAt: -1 });
    module2.exports = mongoose.model("StaffLedgerEntry", staffLedgerEntrySchema);
  }
});

// src/services/referral.service.js
var require_referral_service = __commonJS({
  "src/services/referral.service.js"(exports2, module2) {
    var mongoose = require("mongoose");
    var User = require_user_model();
    var ReferralSettings = require_referralSettings_model();
    var ReferralReward = require_referralReward_model();
    var StaffWallet = require_staffWallet_model();
    var StaffLedgerEntry = require_staffLedgerEntry_model();
    var DEFAULT_RULES = {
      shopper: { type: "fixed", value: 0 },
      shopkeeper: { type: "fixed", value: 0 }
    };
    var round2 = (value) => Number(value.toFixed(2));
    var getReferralSettings = async ({ session } = {}) => {
      const query = ReferralSettings.findOneAndUpdate(
        { key: "global" },
        { $setOnInsert: { key: "global", defaultRules: DEFAULT_RULES } },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
      if (session) query.session(session);
      return query;
    };
    var calculateCommission = (rule, baseAmount) => {
      const value = Number(rule?.value) || 0;
      if (rule?.type === "percentage") return round2(baseAmount * value / 100);
      return round2(value);
    };
    var createReferralReward = async ({ memberId, memberType, trigger, baseAmount }, { session }) => {
      const member = await User.findById(memberId).select("referredByStaff").session(session);
      if (!member?.referredByStaff) return null;
      const staff = await User.findOne({ _id: member.referredByStaff, role: "staff" }).select("staffCommissionRules usesGlobalCommissionRules").session(session);
      if (!staff) return null;
      const existingReward = await ReferralReward.findOne({ member: memberId, memberType }).session(session);
      if (existingReward) return existingReward;
      const settings = await getReferralSettings({ session });
      const rule = staff.usesGlobalCommissionRules ? settings.defaultRules?.[memberType] || DEFAULT_RULES[memberType] : staff.staffCommissionRules?.[memberType] || settings.defaultRules?.[memberType] || DEFAULT_RULES[memberType];
      const commissionAmount = calculateCommission(rule, baseAmount);
      const [reward] = await ReferralReward.create(
        [{
          staff: staff._id,
          member: memberId,
          memberType,
          trigger,
          baseAmount: round2(baseAmount),
          commissionType: rule.type,
          commissionRate: Number(rule.value) || 0,
          commissionAmount
        }],
        { session }
      );
      const wallet = await StaffWallet.findOneAndUpdate(
        { staff: staff._id },
        { $setOnInsert: { staff: staff._id }, $inc: { availableBalance: commissionAmount } },
        { upsert: true, new: true, setDefaultsOnInsert: true, session }
      );
      if (commissionAmount > 0) {
        await StaffLedgerEntry.create(
          [{
            staff: staff._id,
            type: "commission_earned",
            amount: commissionAmount,
            availableBalanceAfter: wallet.availableBalance,
            reference: reward._id,
            meta: {
              member: memberId,
              memberType,
              trigger,
              baseAmount: reward.baseAmount,
              commissionType: rule.type,
              commissionRate: rule.value
            }
          }],
          { session }
        );
      }
      return reward;
    };
    var awardReferralCommission = async (data, options = {}) => {
      if (options.session) return createReferralReward(data, options);
      const session = await mongoose.startSession();
      let reward = null;
      try {
        await session.withTransaction(async () => {
          reward = await createReferralReward(data, { session });
        });
      } catch (error) {
        if (error.code !== 11e3) throw error;
        return null;
      } finally {
        await session.endSession();
      }
      return reward;
    };
    module2.exports = { DEFAULT_RULES, calculateCommission, getReferralSettings, awardReferralCommission };
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
    var {
      getOrCreateWallet,
      debitWallet,
      creditWallet,
      creditCompanyWallet
    } = require_wallet_service();
    var { createTokenForOwner, contributeToActiveToken } = require_token_service();
    var { awardReferralCommission } = require_referral_service();
    var ACTIVATION_FEE = 1e3;
    var INITIAL_LOTTERY_BONUS = 21e3;
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
    var activate = asyncHandler(async (req, res) => {
      if (req.user.role !== "shopper") {
        throw new ApiError(403, "Only shopper accounts can activate a token");
      }
      if (req.user.hasActivatedToken) {
        throw new ApiError(400, "Your account has already activated its first token");
      }
      const session = await mongoose.startSession();
      let activation;
      try {
        await session.withTransaction(async () => {
          const user = await User.findOneAndUpdate(
            { _id: req.user._id, role: "shopper", hasActivatedToken: { $ne: true } },
            { $set: { hasActivatedToken: true } },
            { new: true, session }
          );
          if (!user) {
            throw new ApiError(400, "Your account has already activated its first token");
          }
          const wallet = await getOrCreateWallet(user._id, { session });
          if (wallet.mainBalance < ACTIVATION_FEE) {
            throw new ApiError(400, "Insufficient main wallet balance for the Rs 1,000 activation fee");
          }
          await debitWallet(user._id, "main", ACTIVATION_FEE, "activation_fee", {}, { session });
          await creditCompanyWallet(user._id, ACTIVATION_FEE, "activation_fee", {}, { session });
          await awardReferralCommission(
            {
              memberId: user._id,
              memberType: "shopper",
              trigger: "token_activation",
              baseAmount: ACTIVATION_FEE
            },
            { session }
          );
          await createTokenForOwner(user._id, { generation: 1, pool: 0, session });
          const contribution = await contributeToActiveToken(user._id, INITIAL_LOTTERY_BONUS, { session });
          await creditWallet(
            user._id,
            "lottery",
            INITIAL_LOTTERY_BONUS,
            "activation_bonus",
            {
              tokenNumber: contribution.token.tokenNumber,
              unlockedLevels: contribution.leveledUp
            },
            { session }
          );
          activation = {
            token: contribution.token,
            bonus: {
              lotteryBalance: INITIAL_LOTTERY_BONUS,
              unlockedLevels: contribution.leveledUp
            }
          };
        });
      } finally {
        await session.endSession();
      }
      res.status(201).json(new ApiResponse(201, activation, "Token activated successfully"));
    });
    var companyWallet = asyncHandler(async (_req, res) => {
      const company = await CompanyWallet.getSingleton();
      res.status(200).json(new ApiResponse(200, { company }, "Company wallet fetched successfully"));
    });
    module2.exports = { myWallet, getHistory, getUserHistory, activate, companyWallet };
  }
});

// src/models/manualPayment.model.js
var require_manualPayment_model = __commonJS({
  "src/models/manualPayment.model.js"(exports2, module2) {
    var mongoose = require("mongoose");
    var manualPaymentSchema = new mongoose.Schema(
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true
        },
        amount: {
          type: Number,
          required: true,
          min: 0.01
        },
        provider: {
          type: String,
          enum: ["easypaisa", "jazzcash"],
          required: true
        },
        senderName: {
          type: String,
          required: true,
          trim: true
        },
        transactionReference: {
          type: String,
          required: true,
          trim: true
        },
        proofPath: {
          type: String,
          required: true
        },
        status: {
          type: String,
          enum: ["pending", "approved", "rejected"],
          default: "pending"
        },
        reviewedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          default: null
        },
        reviewedAt: {
          type: Date,
          default: null
        },
        rejectionReason: {
          type: String,
          default: null,
          trim: true
        }
      },
      { timestamps: true }
    );
    manualPaymentSchema.index({ status: 1, createdAt: -1 });
    module2.exports = mongoose.model("ManualPayment", manualPaymentSchema);
  }
});

// src/lib/cloudinary.js
var require_cloudinary = __commonJS({
  "src/lib/cloudinary.js"(exports2, module2) {
    var { v2: cloudinary } = require("cloudinary");
    var env2 = require_env();
    if (env2.CLOUDINARY_CLOUD_NAME && env2.CLOUDINARY_API_KEY && env2.CLOUDINARY_API_SECRET) {
      cloudinary.config({
        cloud_name: env2.CLOUDINARY_CLOUD_NAME,
        api_key: env2.CLOUDINARY_API_KEY,
        api_secret: env2.CLOUDINARY_API_SECRET
      });
    }
    var uploadImageBuffer = (buffer, options = {}) => {
      if (!env2.CLOUDINARY_CLOUD_NAME || !env2.CLOUDINARY_API_KEY || !env2.CLOUDINARY_API_SECRET) {
        const error = new Error("Cloudinary is not configured");
        error.statusCode = 503;
        throw error;
      }
      return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { folder: "yestime-global/payment-proofs", resource_type: "image", ...options },
          (error, result) => error ? reject(error) : resolve(result)
        );
        stream.end(buffer);
      });
    };
    module2.exports = { uploadImageBuffer };
  }
});

// src/controllers/payment.controller.js
var require_payment_controller = __commonJS({
  "src/controllers/payment.controller.js"(exports2, module2) {
    var asyncHandler = require_asyncHandler();
    var ApiError = require_ApiError();
    var ApiResponse = require_ApiResponse();
    var ManualPayment = require_manualPayment_model();
    var User = require_user_model();
    var { creditWallet } = require_wallet_service();
    var { uploadImageBuffer } = require_cloudinary();
    var { notifyAdmin, notifyUser } = require_mailer();
    var paymentInstructions = asyncHandler(async (_req, res) => {
      res.status(200).json(
        new ApiResponse(
          200,
          {
            provider: "easypaisa",
            accountNumber: "03068509086",
            accountName: "\u0627\u0645\u0627\u0646\u062A \u0639\u0644\u06CC",
            note: "Send the payment, then submit the transaction reference and screenshot for review."
          },
          "Manual payment instructions fetched successfully"
        )
      );
    });
    var submitPayment = asyncHandler(async (req, res) => {
      const { amount, provider, senderName, transactionReference } = req.body;
      if (!req.file) {
        throw new ApiError(422, "Payment screenshot is required");
      }
      const uploadedProof = await uploadImageBuffer(req.file.buffer, {
        public_id: `payment-${req.user._id}-${Date.now()}`
      });
      const payment = await ManualPayment.create({
        user: req.user._id,
        amount: Number(amount),
        provider,
        senderName,
        transactionReference,
        proofPath: uploadedProof.secure_url
      });
      const pendingSubject = `Payment request received: PKR ${payment.amount}`;
      const pendingHtml = `
    <div style="font-family: Arial, sans-serif; max-width: 620px; margin: auto;">
      <h2>Payment request received</h2>
      <p>Your payment request for <strong>PKR ${payment.amount}</strong> is pending admin review.</p>
      <p>Transaction reference: ${payment.transactionReference}</p>
    </div>
  `;
      Promise.all([
        notifyAdmin({
          subject: `New wallet payment request: PKR ${payment.amount}`,
          html: `
      <div style="font-family: Arial, sans-serif; max-width: 620px; margin: auto;">
        <h2>New wallet payment request</h2>
        <p>A user submitted a manual payment that needs review.</p>
        <table cellpadding="8" cellspacing="0" style="border-collapse: collapse;">
          <tr><td><strong>User</strong></td><td>${req.user.name} (${req.user.email})</td></tr>
          <tr><td><strong>Amount</strong></td><td>PKR ${payment.amount}</td></tr>
          <tr><td><strong>Provider</strong></td><td>${payment.provider}</td></tr>
          <tr><td><strong>Sender</strong></td><td>${payment.senderName}</td></tr>
          <tr><td><strong>Reference</strong></td><td>${payment.transactionReference}</td></tr>
        </table>
        <p><a href="${payment.proofPath}">Open payment screenshot</a></p>
        <p>Review this request in the admin dashboard before crediting the main wallet.</p>
      </div>
    `
        }),
        notifyUser({ to: req.user.email, subject: pendingSubject, html: pendingHtml })
      ]).catch((error) => console.error("Failed to notify payment request parties:", error.message));
      res.status(201).json(new ApiResponse(201, { payment }, "Payment submitted for admin review"));
    });
    var myPayments = asyncHandler(async (req, res) => {
      const payments = await ManualPayment.find({ user: req.user._id }).sort({ createdAt: -1 });
      res.status(200).json(new ApiResponse(200, { payments }, "Payment requests fetched successfully"));
    });
    var listPayments = asyncHandler(async (req, res) => {
      const filter = {};
      if (req.query.status) filter.status = req.query.status;
      const payments = await ManualPayment.find(filter).sort({ createdAt: -1 }).populate({ path: "user", select: "name email" });
      res.status(200).json(new ApiResponse(200, { payments }, "Payment requests fetched successfully"));
    });
    var getPayment = asyncHandler(async (req, res) => {
      const payment = await ManualPayment.findById(req.params.id).populate({ path: "user", select: "name email role" }).populate({ path: "reviewedBy", select: "name email" });
      if (!payment) throw new ApiError(404, "Payment request not found");
      res.status(200).json(new ApiResponse(200, { payment }, "Payment request fetched successfully"));
    });
    var findPendingPayment = async (id) => {
      const payment = await ManualPayment.findById(id).populate({ path: "user", select: "name email" });
      if (!payment) throw new ApiError(404, "Payment request not found");
      if (payment.status !== "pending") {
        throw new ApiError(400, `This payment request is already ${payment.status}`);
      }
      return payment;
    };
    var approvePayment = asyncHandler(async (req, res) => {
      const payment = await findPendingPayment(req.params.id);
      await creditWallet(payment.user._id, "main", payment.amount, "topup", {
        manualPaymentId: payment._id,
        provider: payment.provider,
        transactionReference: payment.transactionReference,
        reviewedBy: req.user._id
      });
      payment.status = "approved";
      payment.reviewedBy = req.user._id;
      payment.reviewedAt = /* @__PURE__ */ new Date();
      await payment.save();
      const subject = `Payment approved: PKR ${payment.amount}`;
      const html = `
    <div style="font-family: Arial, sans-serif; max-width: 620px; margin: auto;">
      <h2>Payment approved</h2>
      <p>Payment request for <strong>PKR ${payment.amount}</strong> has been approved.</p>
      <p>The amount has been added to your main wallet.</p>
      <p>Transaction reference: ${payment.transactionReference}</p>
    </div>
  `;
      Promise.all([
        notifyAdmin({ subject, html: `<p>Payment approved by ${req.user.name} for ${payment.user.email}.</p>${html}` }),
        notifyUser({ to: payment.user.email, subject, html })
      ]).catch((error) => console.error("Failed to notify payment status change:", error.message));
      res.status(200).json(new ApiResponse(200, { payment }, "Payment approved and main wallet credited"));
    });
    var rejectPayment = asyncHandler(async (req, res) => {
      const payment = await findPendingPayment(req.params.id);
      payment.status = "rejected";
      payment.reviewedBy = req.user._id;
      payment.reviewedAt = /* @__PURE__ */ new Date();
      payment.rejectionReason = req.body.reason || null;
      await payment.save();
      const subject = `Payment rejected: PKR ${payment.amount}`;
      const html = `
    <div style="font-family: Arial, sans-serif; max-width: 620px; margin: auto;">
      <h2>Payment request rejected</h2>
      <p>Your payment request for <strong>PKR ${payment.amount}</strong> was rejected.</p>
      <p>Reason: ${payment.rejectionReason || "The payment could not be verified."}</p>
      <p>The wallet was not credited.</p>
    </div>
  `;
      Promise.all([
        notifyAdmin({ subject, html: `<p>Payment rejected by ${req.user.name} for ${payment.user.email}.</p>${html}` }),
        notifyUser({ to: payment.user.email, subject, html })
      ]).catch((error) => console.error("Failed to notify payment status change:", error.message));
      res.status(200).json(new ApiResponse(200, { payment }, "Payment rejected"));
    });
    module2.exports = {
      paymentInstructions,
      submitPayment,
      myPayments,
      listPayments,
      getPayment,
      approvePayment,
      rejectPayment
    };
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
    var { notifyAdmin, notifyUser } = require_mailer();
    var requestWithdrawal = asyncHandler(async (req, res) => {
      const { amount, method, accountDetails } = req.body;
      await debitWallet(req.user._id, "main", amount, "withdrawal", { method, accountDetails });
      const withdrawal = await Withdrawal.create({
        user: req.user._id,
        amount,
        method,
        accountDetails
      });
      const pendingSubject = `Withdrawal request received: PKR ${withdrawal.amount}`;
      const pendingHtml = `
    <div style="font-family: Arial, sans-serif; max-width: 620px; margin: auto;">
      <h2>Withdrawal request received</h2>
      <p>Your withdrawal request for <strong>PKR ${withdrawal.amount}</strong> is pending admin review.</p>
      <p>The amount has been reserved from your main wallet until the request is completed or rejected.</p>
    </div>
  `;
      Promise.all([
        notifyAdmin({
          subject: `New withdrawal request: PKR ${withdrawal.amount}`,
          html: `
      <div style="font-family: Arial, sans-serif; max-width: 620px; margin: auto;">
        <h2>New withdrawal request</h2>
        <p>A user submitted a withdrawal request that needs review and manual payout.</p>
        <table cellpadding="8" cellspacing="0" style="border-collapse: collapse;">
          <tr><td><strong>User</strong></td><td>${req.user.name} (${req.user.email})</td></tr>
          <tr><td><strong>Amount</strong></td><td>PKR ${withdrawal.amount}</td></tr>
          <tr><td><strong>Method</strong></td><td>${withdrawal.method}</td></tr>
          <tr><td><strong>Account details</strong></td><td>${withdrawal.accountDetails}</td></tr>
        </table>
        <p>Send the money manually, then mark the request as completed in the admin dashboard.</p>
      </div>
    `
        }),
        notifyUser({ to: req.user.email, subject: pendingSubject, html: pendingHtml })
      ]).catch((error) => console.error("Failed to notify withdrawal request parties:", error.message));
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
    var getWithdrawal = asyncHandler(async (req, res) => {
      const withdrawal = await Withdrawal.findById(req.params.id).populate({ path: "user", select: "name email role" }).populate({ path: "processedBy", select: "name email" });
      if (!withdrawal) {
        throw new ApiError(404, "Withdrawal request not found");
      }
      res.status(200).json(new ApiResponse(200, { withdrawal }, "Withdrawal request fetched successfully"));
    });
    var findPendingWithdrawal = async (id) => {
      const withdrawal = await Withdrawal.findById(id).populate({ path: "user", select: "name email" });
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
      const subject = `Withdrawal completed: PKR ${withdrawal.amount}`;
      const html = `
    <div style="font-family: Arial, sans-serif; max-width: 620px; margin: auto;">
      <h2>Withdrawal completed</h2>
      <p>Your withdrawal request for <strong>PKR ${withdrawal.amount}</strong> has been marked as completed.</p>
      <p>The payout was sent through ${withdrawal.method} to ${withdrawal.accountDetails}.</p>
    </div>
  `;
      Promise.all([
        notifyAdmin({ subject, html: `<p>Withdrawal completed by ${req.user.name} for ${withdrawal.user.email}.</p>${html}` }),
        notifyUser({ to: withdrawal.user.email, subject, html })
      ]).catch((error) => console.error("Failed to notify withdrawal status change:", error.message));
      res.status(200).json(new ApiResponse(200, { withdrawal }, "Withdrawal marked as completed"));
    });
    var rejectWithdrawal = asyncHandler(async (req, res) => {
      const withdrawal = await findPendingWithdrawal(req.params.id);
      await creditWallet(withdrawal.user._id, "main", withdrawal.amount, "withdrawal", {
        reversalOf: withdrawal._id
      });
      withdrawal.status = "rejected";
      withdrawal.processedBy = req.user._id;
      withdrawal.processedAt = /* @__PURE__ */ new Date();
      withdrawal.rejectionReason = req.body.reason || null;
      await withdrawal.save();
      const subject = `Withdrawal rejected: PKR ${withdrawal.amount}`;
      const html = `
    <div style="font-family: Arial, sans-serif; max-width: 620px; margin: auto;">
      <h2>Withdrawal request rejected</h2>
      <p>Your withdrawal request for <strong>PKR ${withdrawal.amount}</strong> was rejected.</p>
      <p>Reason: ${withdrawal.rejectionReason || "The payout details could not be verified."}</p>
      <p>The amount has been refunded to your main wallet.</p>
    </div>
  `;
      Promise.all([
        notifyAdmin({ subject, html: `<p>Withdrawal rejected by ${req.user.name} for ${withdrawal.user.email}.</p>${html}` }),
        notifyUser({ to: withdrawal.user.email, subject, html })
      ]).catch((error) => console.error("Failed to notify withdrawal status change:", error.message));
      res.status(200).json(new ApiResponse(200, { withdrawal }, "Withdrawal rejected and amount refunded to wallet"));
    });
    module2.exports = {
      requestWithdrawal,
      myWithdrawals,
      listWithdrawals,
      getWithdrawal,
      completeWithdrawal,
      rejectWithdrawal
    };
  }
});

// src/validators/wallet.validator.js
var require_wallet_validator = __commonJS({
  "src/validators/wallet.validator.js"(exports2, module2) {
    var { body, query } = require("express-validator");
    var manualPaymentValidator = [
      body("amount").isFloat({ gt: 0 }).withMessage("Amount must be a positive number"),
      body("provider").isIn(["easypaisa", "jazzcash"]).withMessage("Provider must be easypaisa or jazzcash"),
      body("senderName").trim().notEmpty().withMessage("senderName is required"),
      body("transactionReference").trim().notEmpty().withMessage("transactionReference is required")
    ];
    var withdrawValidator = [
      body("amount").isFloat({ gt: 0 }).withMessage("Amount must be a positive number"),
      body("method").isIn(["jazzcash", "easypaisa", "bank"]).withMessage("Method must be jazzcash, easypaisa or bank"),
      body("accountDetails").trim().notEmpty().withMessage("accountDetails is required")
    ];
    var rejectWithdrawalValidator = [
      body("reason").optional().trim().isLength({ max: 500 }).withMessage("reason must be under 500 characters")
    ];
    var rejectPaymentValidator = [
      body("reason").optional().trim().isLength({ max: 500 }).withMessage("reason must be under 500 characters")
    ];
    var walletHistoryValidator = [
      query("wallet").optional().isIn(["main", "lottery", "company"]).withMessage("wallet must be main, lottery or company"),
      query("direction").optional().isIn(["credit", "debit"]).withMessage("direction must be credit or debit"),
      query("type").optional().isIn([
        "topup",
        "activation_fee",
        "activation_bonus",
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
    module2.exports = {
      manualPaymentValidator,
      withdrawValidator,
      rejectWithdrawalValidator,
      rejectPaymentValidator,
      walletHistoryValidator
    };
  }
});

// src/middlewares/paymentUpload.js
var require_paymentUpload = __commonJS({
  "src/middlewares/paymentUpload.js"(exports2, module2) {
    var multer = require("multer");
    var uploadPaymentProof = multer({
      storage: multer.memoryStorage(),
      limits: { fileSize: 5 * 1024 * 1024 },
      fileFilter: (_req, file, callback) => {
        if (!["image/jpeg", "image/png", "image/webp"].includes(file.mimetype)) {
          return callback(new Error("Payment proof must be a JPG, PNG or WEBP image"));
        }
        callback(null, true);
      }
    });
    module2.exports = { uploadPaymentProof };
  }
});

// src/routes/wallet.routes.js
var require_wallet_routes = __commonJS({
  "src/routes/wallet.routes.js"(exports2, module2) {
    var express = require("express");
    var { myWallet, getHistory, getUserHistory, companyWallet } = require_wallet_controller();
    var {
      paymentInstructions,
      submitPayment,
      myPayments
    } = require_payment_controller();
    var {
      requestWithdrawal,
      myWithdrawals,
      listWithdrawals,
      getWithdrawal,
      completeWithdrawal,
      rejectWithdrawal
    } = require_withdrawal_controller();
    var {
      manualPaymentValidator,
      withdrawValidator,
      rejectWithdrawalValidator,
      walletHistoryValidator
    } = require_wallet_validator();
    var validate = require_validate_middleware();
    var { uploadPaymentProof } = require_paymentUpload();
    var { authenticate, authorize } = require_auth_middleware();
    var router = express.Router();
    router.get("/me", authenticate, myWallet);
    router.get("/history", authenticate, walletHistoryValidator, validate, getHistory);
    router.get("/history/:userId", authenticate, authorize("admin"), walletHistoryValidator, validate, getUserHistory);
    router.get("/payment-instructions", authenticate, paymentInstructions);
    router.post("/payments", authenticate, uploadPaymentProof.single("screenshot"), manualPaymentValidator, validate, submitPayment);
    router.get("/payments/me", authenticate, myPayments);
    router.get("/company", authenticate, authorize("admin"), companyWallet);
    router.post("/withdraw", authenticate, withdrawValidator, validate, requestWithdrawal);
    router.get("/withdrawals/me", authenticate, myWithdrawals);
    router.get("/withdrawals", authenticate, authorize("admin"), listWithdrawals);
    router.get("/withdrawals/:id", authenticate, authorize("admin"), getWithdrawal);
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
            "education",
            "factory",
            "foodpoint",
            "cosmetic",
            "jewelry",
            "fruit",
            "vegetable seller",
            "property",
            "car",
            "bike",
            "other_custom"
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

// src/controllers/purchase.controller.js
var require_purchase_controller = __commonJS({
  "src/controllers/purchase.controller.js"(exports2, module2) {
    var asyncHandler = require_asyncHandler();
    var ApiError = require_ApiError();
    var ApiResponse = require_ApiResponse();
    var Token = require_token_model();
    var Purchase = require_purchase_model();
    var Shop = require_shop_model();
    var { debitWallet, creditWallet, creditCompanyWallet } = require_wallet_service();
    var { contributeToActiveToken, getActiveToken } = require_token_service();
    var { getCompanyRate, DEALER_OWN_RATE } = require_commission();
    var round2 = (n) => Number(n.toFixed(2));
    var applyPurchase = async ({ payerId, buyerId, amount, companyAmount, meta }) => {
      await debitWallet(payerId, "main", companyAmount, "tax_debit", meta);
      await creditCompanyWallet(payerId, companyAmount, "admin_credit", meta);
      await creditWallet(buyerId, "lottery", amount, "purchase_credit", meta);
      return contributeToActiveToken(buyerId, amount);
    };
    var recordPurchase = asyncHandler(async (req, res) => {
      const { tokenNumber, amount, category, shopId } = req.body;
      const shopkeeper = req.user;
      let selectedShop = null;
      if (shopId) {
        selectedShop = await Shop.findById(shopId).select("owner businessType businessCategories commissionRate").lean();
        if (!selectedShop) {
          throw new ApiError(404, "Shop not found");
        }
        if (String(selectedShop.owner) !== String(shopkeeper._id)) {
          throw new ApiError(403, "You do not own this shop");
        }
      }
      const purchaseShop = selectedShop || await Shop.findOne({
        owner: shopkeeper._id,
        $or: [{ approvalStatus: "approved" }, { approvalStatus: { $exists: false }, isVerified: true }]
      }).sort({ createdAt: -1, _id: -1 }).select("businessType businessCategories commissionRate").lean();
      if (!shopkeeper.businessType && !purchaseShop) {
        throw new ApiError(400, "Your account is missing a business type");
      }
      const isRegisteredCategory = shopkeeper.businessCategories?.includes(category) || await Shop.exists({ owner: shopkeeper._id, businessCategories: category }) || !shopkeeper.businessCategories?.length && category === shopkeeper.businessType;
      if (!isRegisteredCategory) {
        throw new ApiError(400, "You are not registered for this purchase category");
      }
      const token = await Token.findOne({ tokenNumber });
      if (!token) {
        throw new ApiError(404, "No account found with this token number");
      }
      if (token.status !== "active") {
        throw new ApiError(400, "This token is no longer active; ask the buyer for their current token number");
      }
      const isShop = (purchaseShop?.businessType || shopkeeper.businessType) === "shop";
      const taxRate = purchaseShop ? purchaseShop.commissionRate ?? getCompanyRate(purchaseShop.businessCategories?.[0]) : shopkeeper.taxRate ?? getCompanyRate(category);
      const taxAmount = round2(amount * (taxRate / 100));
      const dealerCommissionAmount = isShop ? 0 : round2(amount * (DEALER_OWN_RATE / 100));
      const { leveledUp, completed, newToken } = await applyPurchase({
        payerId: shopkeeper._id,
        buyerId: token.owner,
        amount,
        companyAmount: taxAmount,
        meta: { tokenNumber, amount, category }
      });
      const purchase = await Purchase.create({
        shopper: token.owner,
        shopkeeper: shopkeeper._id,
        channel: isShop ? "shopkeeper" : "dealer",
        token: token._id,
        tokenNumber: token.tokenNumber,
        category,
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
      const taxRate = getCompanyRate(category);
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
    var { SHOPKEEPER_CATEGORIES } = require_shopkeeper_validator();
    var PURCHASE_CATEGORIES = [...SHOPKEEPER_CATEGORIES, "shop", "bike"];
    var recordPurchaseValidator = [
      body("shopId").optional().isMongoId().withMessage("shopId must be a valid id"),
      body("category").isIn(PURCHASE_CATEGORIES).withMessage(`category must be one of ${PURCHASE_CATEGORIES.join(", ")}`),
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
        "education",
        "factory",
        "foodpoint",
        "cosmetic",
        "jewelry",
        "fruit",
        "vegetable seller",
        "property",
        "car",
        "bike",
        "other_custom"
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

// src/utils/drawNumber.js
var require_drawNumber = __commonJS({
  "src/utils/drawNumber.js"(exports2, module2) {
    var crypto = require("crypto");
    var generateDrawNumber = () => crypto.randomInt(0, 1e6).toString().padStart(6, "0");
    module2.exports = { generateDrawNumber };
  }
});

// src/services/draw.service.js
var require_draw_service = __commonJS({
  "src/services/draw.service.js"(exports2, module2) {
    var Token = require_token_model();
    var Draw = require_draw_model();
    var env2 = require_env();
    var { generateDrawNumber } = require_drawNumber();
    var { creditWallet } = require_wallet_service();
    var runDraw = async ({ forceWinningNumber } = {}) => {
      const winningNumber = env2.NODE_ENV !== "production" && forceWinningNumber ? forceWinningNumber : generateDrawNumber();
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
    var publicWinnersHistory = asyncHandler(async (req, res) => {
      const page = Math.max(Number(req.query.page) || 1, 1);
      const limit = Math.min(Math.max(Number(req.query.limit) || 20, 1), 100);
      const filter = { winnerUser: { $ne: null }, winnerToken: { $ne: null } };
      const skip = (page - 1) * limit;
      const [draws, total, rewardSummary] = await Promise.all([
        Draw.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).select("winningNumber winnerToken winnerUser rewardLevel rewardAmount createdAt").populate({ path: "winnerToken", select: "tokenNumber" }).populate({ path: "winnerUser", select: "name shopName" }),
        Draw.countDocuments(filter),
        Draw.aggregate([
          { $match: filter },
          { $group: { _id: null, totalRewardAmount: { $sum: "$rewardAmount" } } }
        ])
      ]);
      const winners = draws.map((draw) => ({
        id: draw._id,
        winnerName: draw.winnerUser?.shopName || draw.winnerUser?.name || "Winner",
        winningNumber: draw.winningNumber,
        tokenNumber: draw.winnerToken?.tokenNumber || null,
        rewardLevel: draw.rewardLevel,
        rewardAmount: draw.rewardAmount,
        wonAt: draw.createdAt
      }));
      res.status(200).json(
        new ApiResponse(
          200,
          {
            winners,
            summary: {
              totalWinners: total,
              totalRewardAmount: rewardSummary[0]?.totalRewardAmount || 0
            },
            pagination: { page, limit, total, pages: Math.ceil(total / limit) }
          },
          "Public winners history fetched successfully"
        )
      );
    });
    var myWins = asyncHandler(async (req, res) => {
      const page = Math.max(Number(req.query.page) || 1, 1);
      const limit = Math.min(Math.max(Number(req.query.limit) || 20, 1), 100);
      const filter = { winnerUser: req.user._id };
      const skip = (page - 1) * limit;
      const [draws, total] = await Promise.all([
        Draw.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).populate({ path: "winnerToken", select: "tokenNumber" }),
        Draw.countDocuments(filter)
      ]);
      res.status(200).json(
        new ApiResponse(
          200,
          { draws, pagination: { page, limit, total, pages: Math.ceil(total / limit) } },
          "Your wins fetched successfully"
        )
      );
    });
    var listWinners = asyncHandler(async (req, res) => {
      const page = Math.max(Number(req.query.page) || 1, 1);
      const limit = Math.min(Math.max(Number(req.query.limit) || 20, 1), 100);
      const filter = { winnerUser: { $ne: null } };
      const skip = (page - 1) * limit;
      const [draws, total] = await Promise.all([
        Draw.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).populate({ path: "winnerToken", select: "tokenNumber" }).populate({ path: "winnerUser", select: "name email shopName" }),
        Draw.countDocuments(filter)
      ]);
      res.status(200).json(
        new ApiResponse(
          200,
          { draws, pagination: { page, limit, total, pages: Math.ceil(total / limit) } },
          "Winner history fetched successfully"
        )
      );
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
      publicWinnersHistory,
      myWins,
      listWinners,
      schedulerStatus,
      startScheduler,
      stopScheduler
    };
  }
});

// src/validators/draw.validator.js
var require_draw_validator = __commonJS({
  "src/validators/draw.validator.js"(exports2, module2) {
    var { body, query } = require("express-validator");
    var triggerDrawsValidator = [
      body("count").optional().isInt({ min: 1, max: 1e3 }).withMessage("count must be between 1 and 1000"),
      body("winningNumber").optional().trim().isLength({ min: 6, max: 6 }).withMessage("winningNumber must be a 6-digit code").isNumeric().withMessage("winningNumber must be a 6-digit code")
    ];
    var winnerHistoryValidator = [
      query("page").optional().isInt({ min: 1 }).withMessage("page must be a positive integer"),
      query("limit").optional().isInt({ min: 1, max: 100 }).withMessage("limit must be between 1 and 100")
    ];
    module2.exports = { triggerDrawsValidator, winnerHistoryValidator };
  }
});

// src/routes/draw.routes.js
var require_draw_routes = __commonJS({
  "src/routes/draw.routes.js"(exports2, module2) {
    var express = require("express");
    var {
      triggerDraws,
      listDraws,
      publicWinnersHistory,
      myWins,
      listWinners,
      schedulerStatus,
      startScheduler,
      stopScheduler
    } = require_draw_controller();
    var { triggerDrawsValidator, winnerHistoryValidator } = require_draw_validator();
    var validate = require_validate_middleware();
    var { authenticate, authorize } = require_auth_middleware();
    var router = express.Router();
    router.post("/run", authenticate, authorize("admin"), triggerDrawsValidator, validate, triggerDraws);
    router.get("/winners-history", winnerHistoryValidator, validate, publicWinnersHistory);
    router.get("/winners", authenticate, authorize("admin"), winnerHistoryValidator, validate, listWinners);
    router.get("/scheduler", authenticate, authorize("admin"), schedulerStatus);
    router.post("/scheduler/start", authenticate, authorize("admin"), startScheduler);
    router.post("/scheduler/stop", authenticate, authorize("admin"), stopScheduler);
    router.get("/my-wins", authenticate, winnerHistoryValidator, validate, myWins);
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
    var Shop = require_shop_model();
    var Wallet = require_wallet_model();
    var Token = require_token_model();
    var Purchase = require_purchase_model();
    var Withdrawal = require_withdrawal_model();
    var Draw = require_draw_model();
    var CompanyWallet = require_companyWallet_model();
    var { creditWallet } = require_wallet_service();
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
      let listedUsers = users;
      if (role === "shopkeeper" && users.length > 0) {
        const shops = await Shop.find({ owner: { $in: users.map((user) => user._id) } }).select("owner shopName").sort({ createdAt: 1 }).lean();
        const shopsByOwner = /* @__PURE__ */ new Map();
        for (const shop of shops) {
          const ownerId = String(shop.owner);
          const ownerShops = shopsByOwner.get(ownerId) || [];
          ownerShops.push({ _id: shop._id, shopName: shop.shopName });
          shopsByOwner.set(ownerId, ownerShops);
        }
        listedUsers = users.map((user) => ({
          ...user.toObject(),
          shops: shopsByOwner.get(String(user._id)) || []
        }));
      }
      res.status(200).json(
        new ApiResponse(
          200,
          { users: listedUsers, pagination: { page, limit, total, pages: Math.ceil(total / limit) } },
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
      if (user.role === "staff" || req.body.role === "staff") {
        throw new ApiError(400, "Manage referral staff through the staff management dashboard");
      }
      const { name, role, businessType } = req.body;
      if (req.body.taxRate !== void 0) {
        throw new ApiError(400, "Tax rate is determined by the purchase category and cannot be changed per user");
      }
      if (name !== void 0) user.name = name;
      if (role !== void 0) user.role = role;
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
      if (user.role === "staff") {
        throw new ApiError(400, "Staff records are retained for referral and payment history; block the account instead");
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
    var creditUserWallet = asyncHandler(async (req, res) => {
      const user = await User.findById(req.params.id).select("_id name email");
      if (!user) {
        throw new ApiError(404, "User not found");
      }
      const { wallet, note } = req.body;
      const amount = Number(req.body.amount);
      const updatedWallet = await creditWallet(user._id, wallet, amount, "admin_credit", {
        adminId: req.user._id,
        note: note || void 0
      });
      res.status(200).json(
        new ApiResponse(200, { user, wallet: updatedWallet }, "Wallet balance added successfully")
      );
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
    module2.exports = {
      listUsers,
      getUser,
      createUser,
      updateUser,
      blockUser,
      unblockUser,
      deleteUser,
      creditUserWallet,
      getStats
    };
  }
});

// src/controllers/shopAdmin.controller.js
var require_shopAdmin_controller = __commonJS({
  "src/controllers/shopAdmin.controller.js"(exports2, module2) {
    var asyncHandler = require_asyncHandler();
    var ApiError = require_ApiError();
    var ApiResponse = require_ApiResponse();
    var Shop = require_shop_model();
    var { notifyUser } = require_mailer();
    var paginate = (query) => {
      const page = Math.max(Number(query.page) || 1, 1);
      const limit = Math.min(Math.max(Number(query.limit) || 20, 1), 100);
      return { page, limit, skip: (page - 1) * limit };
    };
    var listShops = asyncHandler(async (req, res) => {
      const { status, search, owner } = req.query;
      const { page, limit, skip } = paginate(req.query);
      const filter = {};
      if (status) filter.approvalStatus = status;
      if (owner) filter.owner = owner;
      if (search) {
        filter.$or = [
          { shopName: { $regex: search, $options: "i" } },
          { businessAddress: { $regex: search, $options: "i" } },
          { city: { $regex: search, $options: "i" } }
        ];
      }
      const [shops, total] = await Promise.all([
        Shop.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).populate({ path: "owner", select: "name email role" }).populate({ path: "reviewedBy", select: "name email" }),
        Shop.countDocuments(filter)
      ]);
      res.status(200).json(
        new ApiResponse(
          200,
          { shops, pagination: { page, limit, total, pages: Math.ceil(total / limit) } },
          "Shops fetched successfully"
        )
      );
    });
    var getShop = asyncHandler(async (req, res) => {
      const shop = await Shop.findById(req.params.id).populate({ path: "owner", select: "name email role" }).populate({ path: "reviewedBy", select: "name email" });
      if (!shop) throw new ApiError(404, "Shop not found");
      res.status(200).json(new ApiResponse(200, { shop }, "Shop fetched successfully"));
    });
    var findPendingShop = async (id) => {
      const shop = await Shop.findById(id).populate({ path: "owner", select: "name email role" });
      if (!shop) throw new ApiError(404, "Shop not found");
      if (shop.approvalStatus !== "pending") {
        throw new ApiError(400, `This shop is already ${shop.approvalStatus}`);
      }
      return shop;
    };
    var approveShop = asyncHandler(async (req, res) => {
      const shop = await findPendingShop(req.params.id);
      shop.approvalStatus = "approved";
      shop.isVerified = true;
      shop.reviewedBy = req.user._id;
      shop.reviewedAt = /* @__PURE__ */ new Date();
      shop.rejectionReason = null;
      await shop.save();
      notifyUser({
        to: shop.owner.email,
        subject: `Shop approved: ${shop.shopName}`,
        html: `<p>Hi ${shop.owner.name},</p><p>Your shop <strong>${shop.shopName}</strong> has been approved and is now visible in the public shop directory.</p>`
      }).catch((error) => console.error("Failed to send shop approval email:", error.message));
      res.status(200).json(new ApiResponse(200, { shop }, "Shop approved successfully"));
    });
    var rejectShop = asyncHandler(async (req, res) => {
      const shop = await findPendingShop(req.params.id);
      shop.approvalStatus = "rejected";
      shop.isVerified = false;
      shop.reviewedBy = req.user._id;
      shop.reviewedAt = /* @__PURE__ */ new Date();
      shop.rejectionReason = req.body.reason || null;
      await shop.save();
      notifyUser({
        to: shop.owner.email,
        subject: `Shop review update: ${shop.shopName}`,
        html: `<p>Hi ${shop.owner.name},</p><p>Your shop <strong>${shop.shopName}</strong> was not approved for public listing.</p><p><strong>Reason:</strong> ${shop.rejectionReason || "The submitted details could not be verified."}</p><p>You may update the shop details and contact support if you need assistance.</p>`
      }).catch((error) => console.error("Failed to send shop rejection email:", error.message));
      res.status(200).json(new ApiResponse(200, { shop }, "Shop rejected successfully"));
    });
    module2.exports = { listShops, getShop, approveShop, rejectShop };
  }
});

// src/models/shopDeletionRequest.model.js
var require_shopDeletionRequest_model = __commonJS({
  "src/models/shopDeletionRequest.model.js"(exports2, module2) {
    var mongoose = require("mongoose");
    var shopDeletionRequestSchema = new mongoose.Schema(
      {
        shopId: {
          type: mongoose.Schema.Types.ObjectId,
          required: true
        },
        owner: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
          index: true
        },
        ownerSnapshot: {
          name: { type: String, required: true },
          email: { type: String, required: true }
        },
        shopSnapshot: {
          shopName: { type: String, required: true },
          businessType: { type: String, required: true },
          phoneNumber: { type: String, default: null },
          businessAddress: { type: String, required: true },
          businessDescription: { type: String, default: null },
          businessImage: { type: String, default: null },
          businessCategories: { type: [String], default: [] },
          city: { type: String, default: null },
          commissionRate: { type: Number, default: 2.5 }
        },
        reason: {
          type: String,
          trim: true,
          maxlength: 500,
          default: null
        },
        status: {
          type: String,
          enum: ["pending", "approved", "rejected"],
          default: "pending",
          index: true
        },
        reviewedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          default: null
        },
        reviewedAt: {
          type: Date,
          default: null
        },
        reviewNote: {
          type: String,
          trim: true,
          maxlength: 500,
          default: null
        }
      },
      { timestamps: true }
    );
    shopDeletionRequestSchema.index(
      { shopId: 1 },
      { unique: true, partialFilterExpression: { status: "pending" } }
    );
    shopDeletionRequestSchema.index({ status: 1, createdAt: -1 });
    module2.exports = mongoose.model("ShopDeletionRequest", shopDeletionRequestSchema);
  }
});

// src/controllers/shopDeletion.controller.js
var require_shopDeletion_controller = __commonJS({
  "src/controllers/shopDeletion.controller.js"(exports2, module2) {
    var mongoose = require("mongoose");
    var asyncHandler = require_asyncHandler();
    var ApiError = require_ApiError();
    var ApiResponse = require_ApiResponse();
    var Shop = require_shop_model();
    var ShopDeletionRequest = require_shopDeletionRequest_model();
    var { notifyUser } = require_mailer();
    var paginate = (query) => {
      const page = Math.max(Number(query.page) || 1, 1);
      const limit = Math.min(Math.max(Number(query.limit) || 20, 1), 100);
      return { page, limit, skip: (page - 1) * limit };
    };
    var escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    var requestShopDeletion = asyncHandler(async (req, res) => {
      const shop = await Shop.findById(req.body.shopId);
      if (!shop) throw new ApiError(404, "Shop not found");
      if (!shop.owner.equals(req.user._id)) {
        throw new ApiError(403, "You do not own this shop");
      }
      const existingRequest = await ShopDeletionRequest.findOne({ shopId: shop._id, status: "pending" });
      if (existingRequest) {
        throw new ApiError(409, "A deletion request is already pending for this shop");
      }
      let deletionRequest;
      try {
        deletionRequest = await ShopDeletionRequest.create({
          shopId: shop._id,
          owner: req.user._id,
          ownerSnapshot: { name: req.user.name, email: req.user.email },
          shopSnapshot: {
            shopName: shop.shopName,
            businessType: shop.businessType,
            phoneNumber: shop.phoneNumber,
            businessAddress: shop.businessAddress,
            businessDescription: shop.businessDescription,
            businessImage: shop.businessImage,
            businessCategories: shop.businessCategories,
            city: shop.city,
            commissionRate: shop.commissionRate
          },
          reason: req.body.reason || null
        });
      } catch (error) {
        if (error.code === 11e3) {
          throw new ApiError(409, "A deletion request is already pending for this shop");
        }
        throw error;
      }
      res.status(201).json(
        new ApiResponse(201, { request: deletionRequest }, "Shop deletion request submitted successfully")
      );
    });
    var listShopDeletionRequests = asyncHandler(async (req, res) => {
      const { status, search } = req.query;
      const { page, limit, skip } = paginate(req.query);
      const filter = {};
      if (status && status !== "all") filter.status = status;
      if (search) {
        const searchRegex = new RegExp(escapeRegex(search.trim()), "i");
        filter.$or = [
          { "shopSnapshot.shopName": searchRegex },
          { "ownerSnapshot.name": searchRegex },
          { "ownerSnapshot.email": searchRegex }
        ];
      }
      const [requests, total] = await Promise.all([
        ShopDeletionRequest.find(filter).sort({ createdAt: -1, _id: -1 }).skip(skip).limit(limit).populate({ path: "reviewedBy", select: "name email" }),
        ShopDeletionRequest.countDocuments(filter)
      ]);
      res.status(200).json(
        new ApiResponse(
          200,
          { requests, pagination: { page, limit, total, pages: Math.ceil(total / limit) } },
          "Shop deletion requests fetched successfully"
        )
      );
    });
    var approveShopDeletionRequest = asyncHandler(async (req, res) => {
      const session = await mongoose.startSession();
      let deletionRequest;
      try {
        await session.withTransaction(async () => {
          deletionRequest = await ShopDeletionRequest.findById(req.params.requestId).session(session);
          if (!deletionRequest) throw new ApiError(404, "Shop deletion request not found");
          if (deletionRequest.status !== "pending") {
            throw new ApiError(400, `This request is already ${deletionRequest.status}`);
          }
          const deletedShop = await Shop.findOneAndDelete(
            { _id: deletionRequest.shopId, owner: deletionRequest.owner },
            { session }
          );
          if (!deletedShop) {
            throw new ApiError(409, "The requested shop no longer exists");
          }
          deletionRequest.status = "approved";
          deletionRequest.reviewedBy = req.user._id;
          deletionRequest.reviewedAt = /* @__PURE__ */ new Date();
          deletionRequest.reviewNote = null;
          await deletionRequest.save({ session });
        });
      } finally {
        await session.endSession();
      }
      notifyUser({
        to: deletionRequest.ownerSnapshot.email,
        subject: `Shop deletion approved: ${deletionRequest.shopSnapshot.shopName}`,
        html: `<p>Hi ${deletionRequest.ownerSnapshot.name},</p><p>Your request to delete <strong>${deletionRequest.shopSnapshot.shopName}</strong> was approved. The shop has been removed.</p>`
      }).catch((error) => console.error("Failed to send shop deletion approval email:", error.message));
      res.status(200).json(
        new ApiResponse(200, { request: deletionRequest }, "Shop deletion approved and shop removed")
      );
    });
    var rejectShopDeletionRequest = asyncHandler(async (req, res) => {
      const deletionRequest = await ShopDeletionRequest.findOneAndUpdate(
        { _id: req.params.requestId, status: "pending" },
        {
          $set: {
            status: "rejected",
            reviewedBy: req.user._id,
            reviewedAt: /* @__PURE__ */ new Date(),
            reviewNote: req.body.reason || null
          }
        },
        { new: true, runValidators: true }
      );
      if (!deletionRequest) {
        const existingRequest = await ShopDeletionRequest.findById(req.params.requestId);
        if (!existingRequest) throw new ApiError(404, "Shop deletion request not found");
        throw new ApiError(400, `This request is already ${existingRequest.status}`);
      }
      notifyUser({
        to: deletionRequest.ownerSnapshot.email,
        subject: `Shop deletion request declined: ${deletionRequest.shopSnapshot.shopName}`,
        html: `<p>Hi ${deletionRequest.ownerSnapshot.name},</p><p>Your request to delete <strong>${deletionRequest.shopSnapshot.shopName}</strong> was not approved.</p><p><strong>Reason:</strong> ${deletionRequest.reviewNote || "Please contact support for more information."}</p>`
      }).catch((error) => console.error("Failed to send shop deletion rejection email:", error.message));
      res.status(200).json(
        new ApiResponse(200, { request: deletionRequest }, "Shop deletion request rejected")
      );
    });
    module2.exports = {
      requestShopDeletion,
      listShopDeletionRequests,
      approveShopDeletionRequest,
      rejectShopDeletionRequest
    };
  }
});

// src/validators/admin.validator.js
var require_admin_validator = __commonJS({
  "src/validators/admin.validator.js"(exports2, module2) {
    var { body, query } = require("express-validator");
    var listUsersValidator = [
      query("role").optional().isIn(["shopper", "shopkeeper", "staff", "admin"]).withMessage("Invalid role"),
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
      body("role").optional().isIn(["shopper", "shopkeeper", "staff", "admin"]).withMessage("Invalid role"),
      body("businessType").optional().isIn(["shop", "property", "car", "bike"]).withMessage("Invalid businessType")
    ];
    var creditWalletValidator = [
      body("wallet").isIn(["main", "lottery"]).withMessage("wallet must be main or lottery"),
      body("amount").isFloat({ min: 0.01 }).withMessage("amount must be greater than 0"),
      body("note").optional().trim().isLength({ max: 200 }).withMessage("note must be 200 characters or fewer")
    ];
    module2.exports = { listUsersValidator, createUserValidator, updateUserValidator, creditWalletValidator };
  }
});

// src/models/staffPayoutRequest.model.js
var require_staffPayoutRequest_model = __commonJS({
  "src/models/staffPayoutRequest.model.js"(exports2, module2) {
    var mongoose = require("mongoose");
    var staffPayoutRequestSchema = new mongoose.Schema(
      {
        staff: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
          index: true
        },
        amount: {
          type: Number,
          required: true,
          min: 0.01
        },
        method: {
          type: String,
          enum: ["jazzcash", "easypaisa", "bank"],
          required: true
        },
        accountDetails: {
          type: String,
          required: true,
          trim: true
        },
        status: {
          type: String,
          enum: ["pending", "completed", "rejected"],
          default: "pending",
          index: true
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
          trim: true,
          default: null
        }
      },
      { timestamps: true }
    );
    staffPayoutRequestSchema.index({ createdAt: -1 });
    module2.exports = mongoose.model("StaffPayoutRequest", staffPayoutRequestSchema);
  }
});

// src/controllers/adminReferral.controller.js
var require_adminReferral_controller = __commonJS({
  "src/controllers/adminReferral.controller.js"(exports2, module2) {
    var crypto = require("crypto");
    var mongoose = require("mongoose");
    var asyncHandler = require_asyncHandler();
    var ApiError = require_ApiError();
    var ApiResponse = require_ApiResponse();
    var User = require_user_model();
    var ReferralReward = require_referralReward_model();
    var ReferralSettings = require_referralSettings_model();
    var StaffWallet = require_staffWallet_model();
    var StaffPayoutRequest = require_staffPayoutRequest_model();
    var StaffLedgerEntry = require_staffLedgerEntry_model();
    var Shop = require_shop_model();
    var { DEFAULT_RULES, getReferralSettings: ensureReferralSettings } = require_referral_service();
    var { generateOtp, hashOtp, getOtpExpiry } = require_otp();
    var { sendOtpEmail } = require_mailer();
    var paginate = (query, prefix = "") => {
      const page = Math.max(Number(query[`${prefix}page`] || query.page) || 1, 1);
      const limit = Math.min(Math.max(Number(query[`${prefix}limit`] || query.limit) || 20, 1), 100);
      return { page, limit, skip: (page - 1) * limit };
    };
    var createReferralCode = async () => {
      let code;
      do {
        code = `YTG${crypto.randomBytes(4).toString("hex").toUpperCase()}`;
      } while (await User.exists({ staffReferralCode: code }));
      return code;
    };
    var listStaff = asyncHandler(async (req, res) => {
      const { page, limit, skip } = paginate(req.query);
      const filter = { role: "staff" };
      if (req.query.search) {
        filter.$or = [
          { name: { $regex: req.query.search, $options: "i" } },
          { email: { $regex: req.query.search, $options: "i" } },
          { staffReferralCode: { $regex: req.query.search, $options: "i" } }
        ];
      }
      if (req.query.isBlocked !== void 0) filter.isBlocked = req.query.isBlocked === "true";
      const [staffMembers, total] = await Promise.all([
        User.find(filter).select("name email phoneNumber staffReferralCode staffCommissionRules usesGlobalCommissionRules isVerified isBlocked createdAt").sort({ createdAt: -1, _id: -1 }).skip(skip).limit(limit).lean(),
        User.countDocuments(filter)
      ]);
      const settings = await ensureReferralSettings();
      const ids = staffMembers.map((staff) => staff._id);
      const [wallets, referralCounts, rewardTotals] = await Promise.all([
        StaffWallet.find({ staff: { $in: ids } }).lean(),
        User.aggregate([
          { $match: { referredByStaff: { $in: ids } } },
          { $group: { _id: "$referredByStaff", count: { $sum: 1 } } }
        ]),
        ReferralReward.aggregate([
          { $match: { staff: { $in: ids } } },
          {
            $group: {
              _id: "$staff",
              earnedCommission: { $sum: "$commissionAmount" },
              referralRevenue: { $sum: "$baseAmount" }
            }
          }
        ])
      ]);
      const walletByStaff = new Map(wallets.map((wallet) => [String(wallet.staff), wallet]));
      const referralsByStaff = new Map(referralCounts.map((item) => [String(item._id), item.count]));
      const totalsByStaff = new Map(rewardTotals.map((item) => [String(item._id), item]));
      res.status(200).json(
        new ApiResponse(
          200,
          {
            staff: staffMembers.map((staff) => ({
              ...staff,
              staffCommissionRules: staff.usesGlobalCommissionRules ? settings.defaultRules : staff.staffCommissionRules,
              wallet: walletByStaff.get(String(staff._id)) || null,
              referralCount: referralsByStaff.get(String(staff._id)) || 0,
              ...totalsByStaff.get(String(staff._id)) || { earnedCommission: 0, referralRevenue: 0 }
            })),
            pagination: { page, limit, total, pages: Math.ceil(total / limit) }
          },
          "Staff members fetched successfully"
        )
      );
    });
    var createStaff = asyncHandler(async (req, res) => {
      const email = req.body.email.trim().toLowerCase();
      if (await User.exists({ email })) {
        throw new ApiError(409, "An account with this email already exists");
      }
      const settings = await ensureReferralSettings();
      const setupOtp = generateOtp();
      const setupOtpHash = await hashOtp(setupOtp);
      const session = await mongoose.startSession();
      let staff;
      try {
        await session.withTransaction(async () => {
          [staff] = await User.create(
            [{
              name: req.body.name,
              email,
              password: crypto.randomBytes(32).toString("hex"),
              phoneNumber: req.body.phoneNumber || null,
              role: "staff",
              isVerified: true,
              otpHash: setupOtpHash,
              otpExpiry: getOtpExpiry(),
              otpPurpose: "reset-password",
              staffReferralCode: await createReferralCode(),
              staffCommissionRules: req.body.commissionRules || settings.defaultRules || DEFAULT_RULES,
              usesGlobalCommissionRules: req.body.commissionRules === void 0
            }],
            { session }
          );
          await StaffWallet.create([{ staff: staff._id }], { session });
        });
      } finally {
        await session.endSession();
      }
      try {
        await sendOtpEmail({ to: staff.email, name: staff.name, otp: setupOtp, purpose: "reset-password", isStaffInvite: true });
      } catch {
        throw new ApiError(
          502,
          "Staff account was created, but the password setup email could not be sent. Do not retry account creation; ask the staff member to use the password setup page to request a new code."
        );
      }
      res.status(201).json(
        new ApiResponse(
          201,
          {
            staff: {
              _id: staff._id,
              name: staff.name,
              email: staff.email,
              phoneNumber: staff.phoneNumber,
              role: staff.role,
              staffReferralCode: staff.staffReferralCode,
              staffCommissionRules: staff.staffCommissionRules,
              usesGlobalCommissionRules: staff.usesGlobalCommissionRules,
              isVerified: staff.isVerified,
              createdAt: staff.createdAt
            }
          },
          "Staff member created and password setup email sent successfully"
        )
      );
    });
    var getStaffDetail = asyncHandler(async (req, res) => {
      const staff = await User.findOne({ _id: req.params.staffId, role: "staff" }).select("name email phoneNumber staffReferralCode staffCommissionRules usesGlobalCommissionRules isVerified isBlocked createdAt updatedAt").lean();
      if (!staff) throw new ApiError(404, "Staff member not found");
      const referralSettings = await ensureReferralSettings();
      const effectiveRules = staff.usesGlobalCommissionRules ? referralSettings.defaultRules : staff.staffCommissionRules;
      const [
        wallet,
        referralCount,
        memberCounts,
        rewardTotals,
        referrals,
        rewards,
        payouts,
        ledger
      ] = await Promise.all([
        StaffWallet.findOne({ staff: staff._id }).lean(),
        User.countDocuments({ referredByStaff: staff._id }),
        User.aggregate([
          { $match: { referredByStaff: staff._id } },
          { $group: { _id: "$role", count: { $sum: 1 } } }
        ]),
        ReferralReward.aggregate([
          { $match: { staff: staff._id } },
          {
            $group: {
              _id: null,
              earnedCommission: { $sum: "$commissionAmount" },
              referralRevenue: { $sum: "$baseAmount" },
              rewardedMembers: { $addToSet: "$member" }
            }
          }
        ]),
        paginatedRows(User.find({ referredByStaff: staff._id }).select("name email role phoneNumber isVerified isBlocked hasActivatedToken shopkeeperRegistrationFee shopkeeperRegisteredAt createdAt").sort({ createdAt: -1, _id: -1 }), req.query, "referrals"),
        paginatedRows(ReferralReward.find({ staff: staff._id }).populate({ path: "member", select: "name email role" }).sort({ createdAt: -1, _id: -1 }), req.query, "rewards"),
        paginatedRows(StaffPayoutRequest.find({ staff: staff._id }).populate({ path: "staff", select: "name email staffReferralCode" }).populate({ path: "processedBy", select: "name email" }).sort({ createdAt: -1, _id: -1 }), req.query, "payouts"),
        paginatedRows(StaffLedgerEntry.find({ staff: staff._id }).sort({ createdAt: -1, _id: -1 }), req.query, "ledger")
      ]);
      const memberIds = referrals.rows.map((member) => member._id);
      const [shops, referralRewards] = await Promise.all([
        Shop.find({ owner: { $in: memberIds } }).select("owner shopName businessType approvalStatus registrationFee createdAt").lean(),
        ReferralReward.find({ staff: staff._id, member: { $in: memberIds } }).lean()
      ]);
      const shopsByOwner = groupById(shops, "owner");
      const rewardsByMember = groupById(referralRewards, "member");
      const summary = rewardTotals[0] || {};
      res.status(200).json(
        new ApiResponse(
          200,
          {
            staff: { ...staff, staffCommissionRules: effectiveRules, wallet: wallet || null },
            globalRules: referralSettings.defaultRules,
            summary: {
              referralCount,
              shopperCount: memberCounts.find((item) => item._id === "shopper")?.count || 0,
              shopkeeperCount: memberCounts.find((item) => item._id === "shopkeeper")?.count || 0,
              rewardedMembers: summary.rewardedMembers?.length || 0,
              referralRevenue: summary.referralRevenue || 0,
              earnedCommission: summary.earnedCommission || 0,
              availableBalance: wallet?.availableBalance || 0,
              reservedBalance: wallet?.reservedBalance || 0,
              paidBalance: wallet?.paidBalance || 0
            },
            referrals: {
              items: referrals.rows.map((member) => ({
                ...member,
                shops: shopsByOwner.get(String(member._id)) || [],
                rewards: rewardsByMember.get(String(member._id)) || []
              })),
              pagination: referrals.pagination
            },
            rewards,
            payouts,
            ledger
          },
          "Staff member detail fetched successfully"
        )
      );
    });
    var paginatedRows = async (query, params, prefix) => {
      const { page, limit, skip } = paginate(params, prefix);
      const [rows, total] = await Promise.all([
        query.skip(skip).limit(limit).lean(),
        query.model.countDocuments(query.getFilter())
      ]);
      return { rows, pagination: { page, limit, total, pages: Math.ceil(total / limit) } };
    };
    var groupById = (items, key) => {
      const grouped = /* @__PURE__ */ new Map();
      for (const item of items) {
        const id = String(item[key]);
        const values = grouped.get(id) || [];
        values.push(item);
        grouped.set(id, values);
      }
      return grouped;
    };
    var updateStaff = asyncHandler(async (req, res) => {
      const staff = await User.findOne({ _id: req.params.staffId, role: "staff" });
      if (!staff) throw new ApiError(404, "Staff member not found");
      if (req.body.name !== void 0) staff.name = req.body.name;
      if (req.body.phoneNumber !== void 0) staff.phoneNumber = req.body.phoneNumber || null;
      if (req.body.isBlocked !== void 0) staff.isBlocked = req.body.isBlocked;
      if (req.body.commissionRules !== void 0) {
        staff.staffCommissionRules = req.body.commissionRules;
        staff.usesGlobalCommissionRules = false;
      }
      if (req.body.usesGlobalCommissionRules !== void 0) {
        staff.usesGlobalCommissionRules = req.body.usesGlobalCommissionRules;
      }
      await staff.save();
      res.status(200).json(new ApiResponse(200, { staff }, "Staff member updated successfully"));
    });
    var updateReferralSettings = asyncHandler(async (req, res) => {
      const settings = await ReferralSettings.findOneAndUpdate(
        { key: "global" },
        {
          $set: {
            defaultRules: req.body.defaultRules,
            updatedBy: req.user._id
          },
          $setOnInsert: { key: "global" }
        },
        { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
      );
      res.status(200).json(new ApiResponse(200, { settings }, "Referral defaults updated successfully"));
    });
    var getReferralSettings = asyncHandler(async (_req, res) => {
      const settings = await ensureReferralSettings();
      res.status(200).json(new ApiResponse(200, { settings }, "Referral defaults fetched successfully"));
    });
    var listStaffPayouts = asyncHandler(async (req, res) => {
      const { page, limit, skip } = paginate(req.query);
      const filter = {};
      if (req.query.status && req.query.status !== "all") filter.status = req.query.status;
      if (req.params.staffId) filter.staff = req.params.staffId;
      const [payouts, total] = await Promise.all([
        StaffPayoutRequest.find(filter).populate({ path: "staff", select: "name email staffReferralCode" }).populate({ path: "processedBy", select: "name email" }).sort({ createdAt: -1, _id: -1 }).skip(skip).limit(limit).lean(),
        StaffPayoutRequest.countDocuments(filter)
      ]);
      res.status(200).json(
        new ApiResponse(
          200,
          { payouts, pagination: { page, limit, total, pages: Math.ceil(total / limit) } },
          "Staff payment requests fetched successfully"
        )
      );
    });
    var processStaffPayout = asyncHandler(async (req, res) => {
      const session = await mongoose.startSession();
      let payout;
      try {
        await session.withTransaction(async () => {
          payout = await StaffPayoutRequest.findOneAndUpdate(
            { _id: req.params.payoutId, status: "pending" },
            {
              $set: {
                status: req.body.action,
                processedBy: req.user._id,
                processedAt: /* @__PURE__ */ new Date(),
                rejectionReason: req.body.action === "rejected" ? req.body.reason || null : null
              }
            },
            { new: true, session }
          );
          if (!payout) throw new ApiError(404, "Pending staff payment request not found");
          const walletChanges = req.body.action === "completed" ? { $inc: { reservedBalance: -payout.amount, paidBalance: payout.amount } } : { $inc: { reservedBalance: -payout.amount, availableBalance: payout.amount } };
          const wallet = await StaffWallet.findOneAndUpdate(
            { staff: payout.staff, reservedBalance: { $gte: payout.amount } },
            walletChanges,
            { new: true, session }
          );
          if (!wallet) throw new ApiError(409, "Reserved staff balance is inconsistent; payout was not processed");
          await StaffLedgerEntry.create(
            [{
              staff: payout.staff,
              type: req.body.action === "completed" ? "payout_completed" : "payout_rejected",
              amount: payout.amount,
              availableBalanceAfter: wallet.availableBalance,
              reference: payout._id,
              meta: { reason: payout.rejectionReason }
            }],
            { session }
          );
        });
      } finally {
        await session.endSession();
      }
      await payout.populate([
        { path: "staff", select: "name email staffReferralCode" },
        { path: "processedBy", select: "name email" }
      ]);
      res.status(200).json(new ApiResponse(200, { payout }, `Staff payment request ${req.body.action}`));
    });
    module2.exports = {
      listStaff,
      createStaff,
      getStaffDetail,
      updateStaff,
      getReferralSettings,
      updateReferralSettings,
      listStaffPayouts,
      processStaffPayout
    };
  }
});

// src/validators/referral.validator.js
var require_referral_validator = __commonJS({
  "src/validators/referral.validator.js"(exports2, module2) {
    var { body, param, query } = require("express-validator");
    var ruleFields = (prefix, required = false) => [
      body(`${prefix}.type`).if((value, { req }) => required || req.body[prefix.split(".")[0]] !== void 0).isIn(["fixed", "percentage"]).withMessage(`${prefix}.type must be fixed or percentage`),
      body(`${prefix}.value`).if((value, { req }) => required || req.body[prefix.split(".")[0]] !== void 0).isFloat({ min: 0 }).withMessage(`${prefix}.value must be zero or greater`),
      body(`${prefix}.value`).if((value, { req }) => req.body[prefix.split(".")[0]]?.type === "percentage").isFloat({ max: 100 }).withMessage(`${prefix}.value cannot exceed 100 for percentage commissions`)
    ];
    var commissionRulesFields = (container, required = false) => [
      ...ruleFields(`${container}.shopper`, required),
      ...ruleFields(`${container}.shopkeeper`, required)
    ];
    var paginationFields = [
      query("page").optional().isInt({ min: 1 }).withMessage("page must be a positive integer"),
      query("limit").optional().isInt({ min: 1, max: 100 }).withMessage("limit must be between 1 and 100")
    ];
    var staffListValidator = [
      ...paginationFields,
      query("search").optional().trim().isLength({ min: 1, max: 100 }).withMessage("search must be 1 to 100 characters"),
      query("isBlocked").optional().isIn(["true", "false"]).withMessage("isBlocked must be true or false")
    ];
    var createStaffValidator = [
      body("name").trim().notEmpty().withMessage("Name is required"),
      body("email").trim().isEmail().withMessage("A valid email is required").normalizeEmail(),
      body("phoneNumber").optional({ values: "null" }).trim().isLength({ max: 20 }).withMessage("phoneNumber must be at most 20 characters"),
      ...commissionRulesFields("commissionRules")
    ];
    var updateStaffValidator = [
      param("staffId").isMongoId().withMessage("staffId must be a valid id"),
      body("name").optional().trim().notEmpty().withMessage("Name cannot be empty"),
      body("phoneNumber").optional({ values: "null" }).trim().isLength({ max: 20 }).withMessage("phoneNumber must be at most 20 characters"),
      body("isBlocked").optional().isBoolean().withMessage("isBlocked must be true or false"),
      body("usesGlobalCommissionRules").optional().isBoolean().withMessage("usesGlobalCommissionRules must be true or false"),
      ...commissionRulesFields("commissionRules")
    ];
    var staffDetailValidator = [
      param("staffId").isMongoId().withMessage("staffId must be a valid id"),
      ...paginationFields,
      query("referralspage").optional().isInt({ min: 1 }).withMessage("referralsPage must be a positive integer"),
      query("referralslimit").optional().isInt({ min: 1, max: 100 }).withMessage("referralsLimit must be between 1 and 100"),
      query("rewardspage").optional().isInt({ min: 1 }).withMessage("rewardsPage must be a positive integer"),
      query("rewardslimit").optional().isInt({ min: 1, max: 100 }).withMessage("rewardsLimit must be between 1 and 100"),
      query("payoutspage").optional().isInt({ min: 1 }).withMessage("payoutsPage must be a positive integer"),
      query("payoutslimit").optional().isInt({ min: 1, max: 100 }).withMessage("payoutsLimit must be between 1 and 100"),
      query("ledgerpage").optional().isInt({ min: 1 }).withMessage("ledgerPage must be a positive integer"),
      query("ledgerlimit").optional().isInt({ min: 1, max: 100 }).withMessage("ledgerLimit must be between 1 and 100")
    ];
    var referralSettingsValidator = commissionRulesFields("defaultRules", true);
    var payoutListValidator = [
      ...paginationFields,
      query("status").optional().isIn(["pending", "completed", "rejected", "all"]).withMessage("Invalid payout status"),
      param("staffId").optional().isMongoId().withMessage("staffId must be a valid id")
    ];
    var requestPayoutValidator = [
      body("amount").isFloat({ min: 0.01 }).withMessage("amount must be greater than 0"),
      body("method").isIn(["jazzcash", "easypaisa", "bank"]).withMessage("Invalid payout method"),
      body("accountDetails").trim().isLength({ min: 5, max: 300 }).withMessage("accountDetails must be 5 to 300 characters")
    ];
    var processPayoutValidator = [
      param("payoutId").isMongoId().withMessage("payoutId must be a valid id"),
      body("action").isIn(["completed", "rejected"]).withMessage("action must be completed or rejected"),
      body("reason").if(body("action").equals("rejected")).trim().isLength({ max: 500 }).withMessage("reason must be at most 500 characters"),
      body("reason").optional({ values: "null" }).trim().isLength({ max: 500 }).withMessage("reason must be at most 500 characters")
    ];
    module2.exports = {
      staffListValidator,
      createStaffValidator,
      updateStaffValidator,
      staffDetailValidator,
      referralSettingsValidator,
      payoutListValidator,
      requestPayoutValidator,
      processPayoutValidator
    };
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
      creditUserWallet,
      getStats
    } = require_admin_controller();
    var {
      listPayments,
      getPayment,
      approvePayment,
      rejectPayment
    } = require_payment_controller();
    var { listShops, getShop, approveShop, rejectShop } = require_shopAdmin_controller();
    var {
      listShopDeletionRequests,
      approveShopDeletionRequest,
      rejectShopDeletionRequest
    } = require_shopDeletion_controller();
    var {
      listUsersValidator,
      createUserValidator,
      updateUserValidator,
      creditWalletValidator
    } = require_admin_validator();
    var { rejectPaymentValidator } = require_wallet_validator();
    var { body, param, query } = require("express-validator");
    var validate = require_validate_middleware();
    var { authenticate, authorize } = require_auth_middleware();
    var {
      listStaff,
      createStaff,
      getStaffDetail,
      updateStaff,
      getReferralSettings,
      updateReferralSettings,
      listStaffPayouts,
      processStaffPayout
    } = require_adminReferral_controller();
    var {
      staffListValidator,
      createStaffValidator,
      updateStaffValidator,
      staffDetailValidator,
      referralSettingsValidator,
      payoutListValidator,
      processPayoutValidator
    } = require_referral_validator();
    var router = express.Router();
    router.use(authenticate, authorize("admin"));
    router.get("/stats", getStats);
    router.get("/referral-settings", getReferralSettings);
    router.patch("/referral-settings", referralSettingsValidator, validate, updateReferralSettings);
    router.get("/staff", staffListValidator, validate, listStaff);
    router.post("/staff", createStaffValidator, validate, createStaff);
    router.get("/staff/:staffId", staffDetailValidator, validate, getStaffDetail);
    router.patch("/staff/:staffId", updateStaffValidator, validate, updateStaff);
    router.get("/staff-payouts", payoutListValidator, validate, listStaffPayouts);
    router.get("/staff/:staffId/payouts", payoutListValidator, validate, listStaffPayouts);
    router.post("/staff-payouts/:payoutId/process", processPayoutValidator, validate, processStaffPayout);
    router.get("/users", listUsersValidator, validate, listUsers);
    router.post("/users", createUserValidator, validate, createUser);
    router.get("/users/:id", getUser);
    router.patch("/users/:id", updateUserValidator, validate, updateUser);
    router.post("/users/:id/block", blockUser);
    router.post("/users/:id/unblock", unblockUser);
    router.delete("/users/:id", deleteUser);
    router.post("/users/:id/wallet-credit", creditWalletValidator, validate, creditUserWallet);
    router.get("/payments", listPayments);
    router.get("/payments/:id", getPayment);
    router.post("/payments/:id/approve", approvePayment);
    router.post("/payments/:id/reject", rejectPaymentValidator, validate, rejectPayment);
    router.get("/shops", listShops);
    router.get("/shops/:id", getShop);
    router.post("/shops/:id/approve", approveShop);
    router.post(
      "/shops/:id/reject",
      [body("reason").optional({ values: "null" }).trim().isLength({ max: 500 }).withMessage("reason must be at most 500 characters")],
      validate,
      rejectShop
    );
    router.get(
      "/shop-deletion-requests",
      [
        query("status").optional().isIn(["pending", "approved", "rejected", "all"]).withMessage("Invalid request status"),
        query("search").optional().trim().isLength({ min: 1, max: 100 }).withMessage("search must be 1 to 100 characters"),
        query("page").optional().isInt({ min: 1 }).withMessage("page must be a positive integer"),
        query("limit").optional().isInt({ min: 1, max: 100 }).withMessage("limit must be between 1 and 100")
      ],
      validate,
      listShopDeletionRequests
    );
    router.post(
      "/shop-deletion-requests/:requestId/approve",
      [param("requestId").isMongoId().withMessage("requestId must be a valid id")],
      validate,
      approveShopDeletionRequest
    );
    router.post(
      "/shop-deletion-requests/:requestId/reject",
      [
        param("requestId").isMongoId().withMessage("requestId must be a valid id"),
        body("reason").optional({ values: "null" }).trim().isLength({ max: 500 }).withMessage("reason must be at most 500 characters")
      ],
      validate,
      rejectShopDeletionRequest
    );
    module2.exports = router;
  }
});

// src/controllers/shopkeeper.controller.js
var require_shopkeeper_controller = __commonJS({
  "src/controllers/shopkeeper.controller.js"(exports2, module2) {
    var asyncHandler = require_asyncHandler();
    var ApiError = require_ApiError();
    var ApiResponse = require_ApiResponse();
    var Shop = require_shop_model();
    var ShopDeletionRequest = require_shopDeletionRequest_model();
    var User = require_user_model();
    var { debitWallet, creditCompanyWallet, getOrCreateWallet } = require_wallet_service();
    var { uploadImageBuffer } = require_cloudinary();
    var { notifyAdmin, notifyUser } = require_mailer();
    var { getCompanyRate } = require_commission();
    var mongoose = require("mongoose");
    var { awardReferralCommission } = require_referral_service();
    var SHOPKEEPER_REGISTRATION_FEE = 3e3;
    var DEFAULT_SEARCH_RADIUS_KM = 50;
    var getBusinessType = (category) => {
      if (category === "property") return "property";
      if (category === "car") return "car";
      if (category === "motorcycle_scooty") return "bike";
      return "shop";
    };
    var escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    var listShopkeepers = asyncHandler(async (req, res) => {
      const page = Math.max(Number(req.query.page) || 1, 1);
      const limit = Math.min(Math.max(Number(req.query.limit) || 20, 1), 100);
      const filter = {
        isBlocked: false,
        $or: [{ approvalStatus: "approved" }, { approvalStatus: { $exists: false }, isVerified: true }]
      };
      if (req.query.category) filter.businessCategories = req.query.category;
      if (req.query.search) {
        const search = escapeRegex(req.query.search.trim());
        filter.$or = [
          { shopName: { $regex: search, $options: "i" } },
          { businessAddress: { $regex: search, $options: "i" } },
          { businessDescription: { $regex: search, $options: "i" } },
          { city: { $regex: search, $options: "i" } }
        ];
      }
      if (req.query.city) {
        filter.city = { $regex: `^${escapeRegex(req.query.city.trim())}$`, $options: "i" };
      }
      const hasCoords = req.query.lat !== void 0 && req.query.lng !== void 0;
      const skip = (page - 1) * limit;
      if (!req.query.city && hasCoords) {
        const lat = Number(req.query.lat);
        const lng = Number(req.query.lng);
        const radiusKm = req.query.radiusKm ? Number(req.query.radiusKm) : DEFAULT_SEARCH_RADIUS_KM;
        const [result] = await Shop.aggregate([
          {
            $geoNear: {
              near: { type: "Point", coordinates: [lng, lat] },
              distanceField: "distanceMeters",
              maxDistance: radiusKm * 1e3,
              spherical: true,
              query: filter
            }
          },
          {
            $facet: {
              data: [{ $skip: skip }, { $limit: limit }],
              totalCount: [{ $count: "count" }]
            }
          }
        ]);
        const shops2 = result?.data || [];
        const total2 = result?.totalCount?.[0]?.count || 0;
        return res.status(200).json(
          new ApiResponse(
            200,
            { shops: shops2, pagination: { page, limit, total: total2, pages: Math.ceil(total2 / limit) } },
            "Shops fetched successfully"
          )
        );
      }
      const [shops, total] = await Promise.all([
        Shop.find(filter).sort({ createdAt: -1, _id: -1 }).skip(skip).limit(limit),
        Shop.countDocuments(filter)
      ]);
      res.status(200).json(
        new ApiResponse(
          200,
          { shops, pagination: { page, limit, total, pages: Math.ceil(total / limit) } },
          "Shops fetched successfully"
        )
      );
    });
    var myShops = asyncHandler(async (req, res) => {
      const [shops, deletionRequests] = await Promise.all([
        Shop.find({ owner: req.user._id }).sort({ createdAt: -1 }).lean(),
        ShopDeletionRequest.find({ owner: req.user._id }).sort({ createdAt: -1 }).select("shopId status reason createdAt reviewedAt reviewNote").lean()
      ]);
      const latestRequestByShop = /* @__PURE__ */ new Map();
      for (const request of deletionRequests) {
        const shopId = String(request.shopId);
        if (!latestRequestByShop.has(shopId)) latestRequestByShop.set(shopId, request);
      }
      const shopsWithCommission = shops.map((shop) => {
        const deletionRequest = latestRequestByShop.get(String(shop._id));
        return {
          ...shop,
          commissionRate: shop.commissionRate ?? getCompanyRate(shop.businessCategories?.[0]),
          deletionRequest: deletionRequest ? {
            _id: deletionRequest._id,
            status: deletionRequest.status,
            reason: deletionRequest.reason,
            requestedAt: deletionRequest.createdAt,
            reviewedAt: deletionRequest.reviewedAt,
            reviewNote: deletionRequest.reviewNote
          } : null
        };
      });
      res.status(200).json(new ApiResponse(200, { shops: shopsWithCommission }, "Your shops fetched successfully"));
    });
    var registerShopkeeper = asyncHandler(async (req, res) => {
      const user = req.user;
      if (user.role !== "shopper" && user.role !== "shopkeeper") {
        throw new ApiError(400, "Only shopper or shopkeeper accounts can register a shop");
      }
      const { shopName, phoneNumber, address, description, categories, city, lat, lng } = req.body;
      const businessType = getBusinessType(categories[0]);
      const commissionRate = getCompanyRate(categories[0]);
      let imageUrl = null;
      if (req.file) {
        const uploadedImage = await uploadImageBuffer(req.file.buffer, {
          folder: "yestime-global/shop-images"
        });
        imageUrl = uploadedImage.secure_url;
      }
      const session = await mongoose.startSession();
      let shop;
      try {
        await session.withTransaction(async () => {
          const isFirstShop = !await Shop.exists({ owner: user._id }).session(session);
          const wallet = await getOrCreateWallet(user._id, { session });
          if (wallet.mainBalance < SHOPKEEPER_REGISTRATION_FEE) {
            throw new ApiError(400, "Insufficient main wallet balance for the Rs 3000 shop registration fee");
          }
          await debitWallet(
            user._id,
            "main",
            SHOPKEEPER_REGISTRATION_FEE,
            "shopkeeper_registration_fee",
            { shopName, categories },
            { session }
          );
          await creditCompanyWallet(
            user._id,
            SHOPKEEPER_REGISTRATION_FEE,
            "shopkeeper_registration_fee",
            { shopName, categories },
            { session }
          );
          [shop] = await Shop.create(
            [{
              owner: user._id,
              businessType,
              shopName,
              phoneNumber,
              businessAddress: address,
              businessDescription: description || null,
              businessImage: imageUrl,
              businessCategories: [...new Set(categories)],
              commissionRate,
              city,
              location: { type: "Point", coordinates: [lng, lat] },
              registrationFee: SHOPKEEPER_REGISTRATION_FEE,
              approvalStatus: "pending",
              isVerified: false
            }],
            { session }
          );
          if (isFirstShop) {
            if (user.role === "shopper") user.role = "shopkeeper";
            user.businessType = businessType;
            user.shopName = shopName;
            user.phoneNumber = phoneNumber;
            user.businessAddress = address;
            user.businessDescription = description || null;
            user.businessImage = imageUrl;
            user.businessCategories = [...new Set(categories)];
            user.taxRate = commissionRate;
            user.shopkeeperRegistrationFee = SHOPKEEPER_REGISTRATION_FEE;
            user.shopkeeperRegisteredAt = /* @__PURE__ */ new Date();
            await user.save({ session });
          }
          await awardReferralCommission(
            {
              memberId: user._id,
              memberType: "shopkeeper",
              trigger: "shop_registration",
              baseAmount: SHOPKEEPER_REGISTRATION_FEE
            },
            { session }
          );
        });
      } finally {
        await session.endSession();
      }
      Promise.all([
        notifyAdmin({
          subject: `New shop registration: ${shop.shopName}`,
          html: `<p>A new shop registration is awaiting review.</p><p><strong>Shop:</strong> ${shop.shopName}<br><strong>Owner:</strong> ${user.name} (${user.email})<br><strong>Location:</strong> ${shop.city}</p><p>Review it in the admin dashboard.</p>`
        }),
        notifyUser({
          to: user.email,
          subject: `Shop registration received: ${shop.shopName}`,
          html: `<p>Hi ${user.name},</p><p>Your shop <strong>${shop.shopName}</strong> has been registered and is pending admin review. We will email you again when a decision is made.</p>`
        })
      ]).catch((error) => console.error("Failed to notify shop registration parties:", error.message));
      res.status(201).json(
        new ApiResponse(201, { shop, registrationFee: SHOPKEEPER_REGISTRATION_FEE }, "Shop registered successfully")
      );
    });
    var updateShop = asyncHandler(async (req, res) => {
      const shop = await Shop.findById(req.params.shopId);
      if (!shop) {
        throw new ApiError(404, "Shop not found");
      }
      if (!shop.owner.equals(req.user._id)) {
        throw new ApiError(403, "You do not own this shop");
      }
      const { shopName, phoneNumber, address, description, categories, city, lat, lng } = req.body;
      if (shopName !== void 0) shop.shopName = shopName;
      if (phoneNumber !== void 0) shop.phoneNumber = phoneNumber;
      if (address !== void 0) shop.businessAddress = address;
      if (description !== void 0) shop.businessDescription = description || null;
      if (req.file) {
        const uploadedImage = await uploadImageBuffer(req.file.buffer, {
          folder: "yestime-global/shop-images"
        });
        shop.businessImage = uploadedImage.secure_url;
      }
      if (categories !== void 0) {
        shop.businessCategories = [...new Set(categories)];
        shop.businessType = getBusinessType(categories[0]);
        shop.commissionRate = getCompanyRate(categories[0]);
      }
      if (city !== void 0) shop.city = city;
      if (lat !== void 0 && lng !== void 0) {
        shop.location = { type: "Point", coordinates: [lng, lat] };
      }
      await shop.save();
      if (categories !== void 0) {
        const primaryShop = await Shop.findOne({ owner: shop.owner }).sort({ createdAt: 1, _id: 1 }).select("_id").lean();
        if (primaryShop && String(primaryShop._id) === String(shop._id)) {
          await User.updateOne(
            { _id: shop.owner },
            {
              $set: {
                businessType: shop.businessType,
                businessCategories: shop.businessCategories,
                taxRate: shop.commissionRate
              }
            }
          );
        }
      }
      res.status(200).json(new ApiResponse(200, { shop }, "Shop updated successfully"));
    });
    module2.exports = { registerShopkeeper, listShopkeepers, myShops, updateShop };
  }
});

// src/middlewares/shopImageUpload.js
var require_shopImageUpload = __commonJS({
  "src/middlewares/shopImageUpload.js"(exports2, module2) {
    var multer = require("multer");
    var uploadShopImage = multer({
      storage: multer.memoryStorage(),
      limits: { fileSize: 5 * 1024 * 1024 },
      fileFilter: (_req, file, callback) => {
        if (!["image/jpeg", "image/png", "image/webp"].includes(file.mimetype)) {
          return callback(new Error("Shop image must be a JPG, PNG or WEBP image"));
        }
        callback(null, true);
      }
    });
    module2.exports = { uploadShopImage };
  }
});

// src/routes/shopkeeper.routes.js
var require_shopkeeper_routes = __commonJS({
  "src/routes/shopkeeper.routes.js"(exports2, module2) {
    var express = require("express");
    var {
      registerShopkeeper,
      listShopkeepers,
      myShops,
      updateShop
    } = require_shopkeeper_controller();
    var { requestShopDeletion } = require_shopDeletion_controller();
    var {
      shopkeeperRegistrationValidator,
      shopkeeperDirectoryValidator,
      shopUpdateValidator,
      shopDeletionRequestValidator
    } = require_shopkeeper_validator();
    var validate = require_validate_middleware();
    var { authenticate } = require_auth_middleware();
    var { uploadShopImage } = require_shopImageUpload();
    var router = express.Router();
    router.get("/", shopkeeperDirectoryValidator, validate, listShopkeepers);
    router.get("/mine", authenticate, myShops);
    router.post("/register", authenticate, uploadShopImage.single("image"), shopkeeperRegistrationValidator, validate, registerShopkeeper);
    router.patch("/:shopId", authenticate, uploadShopImage.single("image"), shopUpdateValidator, validate, updateShop);
    router.post("/delete", authenticate, shopDeletionRequestValidator, validate, requestShopDeletion);
    module2.exports = router;
  }
});

// src/controllers/staff.controller.js
var require_staff_controller = __commonJS({
  "src/controllers/staff.controller.js"(exports2, module2) {
    var asyncHandler = require_asyncHandler();
    var ApiError = require_ApiError();
    var ApiResponse = require_ApiResponse();
    var User = require_user_model();
    var Shop = require_shop_model();
    var ReferralReward = require_referralReward_model();
    var StaffWallet = require_staffWallet_model();
    var StaffPayoutRequest = require_staffPayoutRequest_model();
    var StaffLedgerEntry = require_staffLedgerEntry_model();
    var mongoose = require("mongoose");
    var { getReferralSettings } = require_referral_service();
    var paginate = (query) => {
      const page = Math.max(Number(query.page) || 1, 1);
      const limit = Math.min(Math.max(Number(query.limit) || 20, 1), 100);
      return { page, limit, skip: (page - 1) * limit };
    };
    var getDashboard = asyncHandler(async (req, res) => {
      const staffId = req.user._id;
      const [wallet, referralCount, rewardTotals, pendingPayouts, settings] = await Promise.all([
        StaffWallet.findOne({ staff: staffId }).lean(),
        User.countDocuments({ referredByStaff: staffId }),
        ReferralReward.aggregate([
          { $match: { staff: staffId } },
          {
            $group: {
              _id: null,
              earnedCommission: { $sum: "$commissionAmount" },
              referralRevenue: { $sum: "$baseAmount" },
              rewardedMembers: { $addToSet: "$member" }
            }
          }
        ]),
        StaffPayoutRequest.aggregate([
          { $match: { staff: staffId, status: "pending" } },
          { $group: { _id: null, count: { $sum: 1 }, amount: { $sum: "$amount" } } }
        ]),
        getReferralSettings()
      ]);
      const totals = rewardTotals[0] || {};
      const pending = pendingPayouts[0] || {};
      res.status(200).json(
        new ApiResponse(
          200,
          {
            staff: {
              _id: req.user._id,
              name: req.user.name,
              email: req.user.email,
              phoneNumber: req.user.phoneNumber,
              referralCode: req.user.staffReferralCode,
              commissionRules: req.user.usesGlobalCommissionRules ? settings.defaultRules : req.user.staffCommissionRules,
              usesGlobalCommissionRules: req.user.usesGlobalCommissionRules
            },
            summary: {
              referralCount,
              rewardedMembers: totals.rewardedMembers?.length || 0,
              referralRevenue: totals.referralRevenue || 0,
              earnedCommission: totals.earnedCommission || 0,
              availableBalance: wallet?.availableBalance || 0,
              reservedBalance: wallet?.reservedBalance || 0,
              paidBalance: wallet?.paidBalance || 0,
              pendingPayoutCount: pending.count || 0,
              pendingPayoutAmount: pending.amount || 0
            }
          },
          "Staff dashboard fetched successfully"
        )
      );
    });
    var listReferrals = asyncHandler(async (req, res) => {
      const { page, limit, skip } = paginate(req.query);
      const filter = { referredByStaff: req.user._id };
      const [members, total] = await Promise.all([
        User.find(filter).select("name email role phoneNumber isVerified hasActivatedToken shopkeeperRegistrationFee shopkeeperRegisteredAt createdAt").sort({ createdAt: -1, _id: -1 }).skip(skip).limit(limit).lean(),
        User.countDocuments(filter)
      ]);
      const memberIds = members.map((member) => member._id);
      const [shops, rewards] = await Promise.all([
        Shop.find({ owner: { $in: memberIds } }).select("owner shopName approvalStatus registrationFee createdAt").lean(),
        ReferralReward.find({ staff: req.user._id, member: { $in: memberIds } }).select("member memberType trigger baseAmount commissionType commissionRate commissionAmount createdAt").lean()
      ]);
      const shopsByOwner = /* @__PURE__ */ new Map();
      for (const shop of shops) {
        const ownerId = String(shop.owner);
        const ownerShops = shopsByOwner.get(ownerId) || [];
        ownerShops.push(shop);
        shopsByOwner.set(ownerId, ownerShops);
      }
      const rewardsByMember = /* @__PURE__ */ new Map();
      for (const reward of rewards) {
        const memberId = String(reward.member);
        const memberRewards = rewardsByMember.get(memberId) || [];
        memberRewards.push(reward);
        rewardsByMember.set(memberId, memberRewards);
      }
      res.status(200).json(
        new ApiResponse(
          200,
          {
            referrals: members.map((member) => ({
              ...member,
              shops: shopsByOwner.get(String(member._id)) || [],
              rewards: rewardsByMember.get(String(member._id)) || []
            })),
            pagination: { page, limit, total, pages: Math.ceil(total / limit) }
          },
          "Referrals fetched successfully"
        )
      );
    });
    var listPayouts = asyncHandler(async (req, res) => {
      const { page, limit, skip } = paginate(req.query);
      const filter = { staff: req.user._id };
      const [payouts, total] = await Promise.all([
        StaffPayoutRequest.find(filter).sort({ createdAt: -1, _id: -1 }).skip(skip).limit(limit).lean(),
        StaffPayoutRequest.countDocuments(filter)
      ]);
      res.status(200).json(
        new ApiResponse(
          200,
          { payouts, pagination: { page, limit, total, pages: Math.ceil(total / limit) } },
          "Staff payment requests fetched successfully"
        )
      );
    });
    var listEarnings = asyncHandler(async (req, res) => {
      const { page, limit, skip } = paginate(req.query);
      const filter = { staff: req.user._id };
      const [earnings, total, totalsByType] = await Promise.all([
        ReferralReward.find(filter).populate({ path: "member", select: "name email role" }).sort({ createdAt: -1, _id: -1 }).skip(skip).limit(limit).lean(),
        ReferralReward.countDocuments(filter),
        ReferralReward.aggregate([
          { $match: filter },
          {
            $group: {
              _id: "$memberType",
              referralRevenue: { $sum: "$baseAmount" },
              commissionEarned: { $sum: "$commissionAmount" },
              referralCount: { $sum: 1 }
            }
          }
        ])
      ]);
      const summary = totalsByType.reduce(
        (result, entry) => {
          result.referralRevenue += entry.referralRevenue;
          result.commissionEarned += entry.commissionEarned;
          result.rewardCount += entry.referralCount;
          result.byMemberType[entry._id] = {
            referralRevenue: entry.referralRevenue,
            commissionEarned: entry.commissionEarned,
            referralCount: entry.referralCount
          };
          return result;
        },
        { referralRevenue: 0, commissionEarned: 0, rewardCount: 0, byMemberType: {} }
      );
      res.status(200).json(
        new ApiResponse(
          200,
          { earnings, summary, pagination: { page, limit, total, pages: Math.ceil(total / limit) } },
          "Commission history fetched successfully"
        )
      );
    });
    var requestPayout = asyncHandler(async (req, res) => {
      const amount = Number(req.body.amount);
      const session = await mongoose.startSession();
      let payout;
      try {
        await session.withTransaction(async () => {
          const wallet = await StaffWallet.findOneAndUpdate(
            { staff: req.user._id, availableBalance: { $gte: amount } },
            {
              $inc: {
                availableBalance: -amount,
                reservedBalance: amount
              }
            },
            { new: true, session }
          );
          if (!wallet) {
            throw new ApiError(400, "Requested amount exceeds your available commission balance");
          }
          [payout] = await StaffPayoutRequest.create(
            [{
              staff: req.user._id,
              amount,
              method: req.body.method,
              accountDetails: req.body.accountDetails.trim()
            }],
            { session }
          );
          await StaffLedgerEntry.create(
            [{
              staff: req.user._id,
              type: "payout_requested",
              amount,
              availableBalanceAfter: wallet.availableBalance,
              reference: payout._id,
              meta: { method: payout.method, accountDetails: payout.accountDetails }
            }],
            { session }
          );
        });
      } finally {
        await session.endSession();
      }
      res.status(201).json(new ApiResponse(201, { payout }, "Payment request submitted for admin review"));
    });
    module2.exports = { getDashboard, listReferrals, listEarnings, listPayouts, requestPayout };
  }
});

// src/routes/staff.routes.js
var require_staff_routes = __commonJS({
  "src/routes/staff.routes.js"(exports2, module2) {
    var express = require("express");
    var { getDashboard, listReferrals, listEarnings, listPayouts, requestPayout } = require_staff_controller();
    var { requestPayoutValidator } = require_referral_validator();
    var validate = require_validate_middleware();
    var { authenticate, authorize } = require_auth_middleware();
    var router = express.Router();
    router.use(authenticate, authorize("staff"));
    router.get("/dashboard", getDashboard);
    router.get("/referrals", listReferrals);
    router.get("/earnings", listEarnings);
    router.get("/payouts", listPayouts);
    router.post("/payouts", requestPayoutValidator, validate, requestPayout);
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
    var staffRoutes = require_staff_routes();
    var router = express.Router();
    router.get("/health", (_req, res) => res.status(200).json({ success: true, message: "OK" }));
    router.use("/auth", authRoutes);
    router.use("/wallet", walletRoutes);
    router.use("/tokens", tokenRoutes);
    router.use("/purchases", purchaseRoutes);
    router.use("/draws", drawRoutes);
    router.use("/admin", adminRoutes);
    router.use("/shopkeepers", shopkeeperRoutes);
    router.use("/staff", staffRoutes);
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
    var corsOptions = {
      origin: (requestOrigin, callback) => {
        if (!requestOrigin || env2.CORS_ORIGINS.includes(requestOrigin)) {
          return callback(null, true);
        }
        return callback(new Error(`CORS origin not allowed: ${requestOrigin}`));
      },
      credentials: true
    };
    app2.use(helmet());
    app2.use(cors(corsOptions));
    app2.options("*", cors(corsOptions));
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
    var dns = require("dns");
    var env2 = require_env();
    mongoose.set("bufferTimeoutMS", 3e4);
    var connectionPromise = null;
    var isDnsError = (error) => ["ECONNREFUSED", "ENOTFOUND", "EAI_AGAIN", "ESERVFAIL"].includes(error?.code) && /query(Srv|Txt)/.test(error?.syscall || "");
    var connectWithDnsFallback = async () => {
      try {
        return await mongoose.connect(env2.MONGO_URI, { serverSelectionTimeoutMS: 3e4 });
      } catch (error) {
        if (!isDnsError(error)) throw error;
        console.warn("MongoDB SRV lookup failed via system DNS, retrying with public DNS servers...");
        dns.setServers(["8.8.8.8", "1.1.1.1"]);
        return mongoose.connect(env2.MONGO_URI, { serverSelectionTimeoutMS: 3e4 });
      }
    };
    var connectDB2 = () => {
      if (mongoose.connection.readyState === 1) {
        return Promise.resolve(mongoose.connection);
      }
      if (!connectionPromise) {
        connectionPromise = connectWithDnsFallback().then((conn) => {
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
var TokenNumberSequence = require_tokenNumberSequence_model();
var drawScheduler = require_scheduler_service();
var startServer = async () => {
  await connectDB();
  await TokenNumberSequence.ensureInitialized();
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
