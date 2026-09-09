const mongoose = require('mongoose');

const drawSchema = new mongoose.Schema(
  {
    winningNumber: {
      type: String,
      required: true,
    },
    winnerToken: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Token',
      default: null,
    },
    winnerUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    rewardLevel: {
      type: Number,
      default: 0,
    },
    rewardAmount: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Draw', drawSchema);
