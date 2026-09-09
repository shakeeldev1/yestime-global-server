const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: 6,
      select: false,
    },
    role: {
      type: String,
      enum: ['shopper', 'shopkeeper', 'admin'],
      default: 'shopper',
    },
    businessType: {
      type: String,
      enum: ['shop', 'property', 'car', 'bike', null],
      default: null,
    },
    taxRate: {
      type: Number,
      default: 2.5,
    },
    hasActivatedToken: {
      type: Boolean,
      default: false,
    },
    isBlocked: {
      type: Boolean,
      default: false,
    },
    refreshTokenHash: {
      type: String,
      default: null,
      select: false,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    otpHash: {
      type: String,
      default: null,
      select: false,
    },
    otpExpiry: {
      type: Date,
      default: null,
      select: false,
    },
    otpPurpose: {
      type: String,
      enum: ['verify-email', 'reset-password', null],
      default: null,
      select: false,
    },
  },
  { timestamps: true }
);

userSchema.pre('save', async function hashPassword(next) {
  if (!this.isModified('password')) return next();
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

module.exports = mongoose.model('User', userSchema);
