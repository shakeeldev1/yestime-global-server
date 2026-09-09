const mongoose = require('mongoose');

const walletSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    // Real, withdrawable money (lottery winnings for shoppers, top-ups for shopkeepers).
    mainBalance: {
      type: Number,
      default: 0,
      min: 0,
    },
    // Non-withdrawable running total of purchase amounts credited toward lottery
    // eligibility. Kept for display/audit; the token itself drives the actual
    // level-unlock mechanic.
    lotteryBalance: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Wallet', walletSchema);
