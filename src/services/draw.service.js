const Token = require('../models/token.model');
const Draw = require('../models/draw.model');
const env = require('../config/env');
const { generateTokenNumber } = require('../utils/tokenNumber');
const { creditWallet } = require('./wallet.service');

/**
 * Runs a single draw: picks a random 6-digit number and checks it against
 * every token that has at least level 1 unlocked (active or completed —
 * a completed token stays eligible forever). Token numbers are unique, so
 * at most one token can win a given draw. On a hit, the reward is the
 * token's *current* unlocked level x 1000, credited untaxed to the winner's
 * main wallet.
 *
 * `forceWinningNumber` only takes effect outside production, so deterministic
 * testing/demo draws are possible without ever letting a real deployment's
 * draws be steered.
 */
const runDraw = async ({ forceWinningNumber } = {}) => {
  const winningNumber =
    env.NODE_ENV !== 'production' && forceWinningNumber ? forceWinningNumber : generateTokenNumber();

  const winningToken = await Token.findOne({ tokenNumber: winningNumber, unlockedLevel: { $gte: 1 } });

  if (!winningToken) {
    return Draw.create({ winningNumber, winnerToken: null, winnerUser: null, rewardLevel: 0, rewardAmount: 0 });
  }

  const rewardAmount = winningToken.unlockedLevel * 1000;

  await creditWallet(winningToken.owner, 'main', rewardAmount, 'lottery_win', {
    tokenId: winningToken._id,
    tokenNumber: winningToken.tokenNumber,
    level: winningToken.unlockedLevel,
  });

  return Draw.create({
    winningNumber,
    winnerToken: winningToken._id,
    winnerUser: winningToken.owner,
    rewardLevel: winningToken.unlockedLevel,
    rewardAmount,
  });
};

const runDraws = async (count, { forceWinningNumber } = {}) => {
  const draws = [];
  for (let i = 0; i < count; i += 1) {
    // eslint-disable-next-line no-await-in-loop
    const draw = await runDraw(count === 1 ? { forceWinningNumber } : {});
    draws.push(draw);
  }
  return draws;
};

module.exports = { runDraw, runDraws };
