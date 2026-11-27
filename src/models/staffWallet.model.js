const mongoose = require('mongoose');

const staffWalletSchema = new mongoose.Schema(
  {
    staff: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    availableBalance: {
      type: Number,
      default: 0,
      min: 0,
    },
    reservedBalance: {
      type: Number,
      default: 0,
      min: 0,
    },
    paidBalance: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('StaffWallet', staffWalletSchema);
