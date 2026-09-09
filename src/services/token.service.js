const Token = require('../models/token.model');
const { generateTokenNumber } = require('../utils/tokenNumber');
const { applyPoolContribution } = require('../utils/levels');

const MAX_GENERATION_ATTEMPTS = 10;

const createTokenForOwner = async (ownerId, { generation = 1, pool = 0 } = {}) => {
  for (let attempt = 0; attempt < MAX_GENERATION_ATTEMPTS; attempt += 1) {
    try {
      // eslint-disable-next-line no-await-in-loop
      return await Token.create({
        tokenNumber: generateTokenNumber(),
        owner: ownerId,
        generation,
        pool,
      });
    } catch (error) {
      if (error.code === 11000 && attempt < MAX_GENERATION_ATTEMPTS - 1) {
        continue; // token number collision, retry with a fresh number
      }
      throw error;
    }
  }
  throw new Error('Failed to generate a unique token number');
};

const getActiveToken = (ownerId) => Token.findOne({ owner: ownerId, status: 'active' });

/**
 * Feeds `amount` into the owner's currently active token, unlocking levels as
 * far as the pool allows. If the token completes all 30 levels, it is closed
 * out and a new token is created for the owner, seeded with any pool overflow.
 */
const contributeToActiveToken = async (ownerId, amount) => {
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
    token.status = 'completed';
    token.completedAt = new Date();
    await token.save();

    const newToken = await createTokenForOwner(ownerId, {
      generation: token.generation + 1,
      pool: result.pool,
    });

    return { token, newToken, leveledUp: result.leveledUp, completed: true };
  }

  token.pool = result.pool;
  await token.save();

  return { token, newToken: null, leveledUp: result.leveledUp, completed: false };
};

module.exports = { createTokenForOwner, getActiveToken, contributeToActiveToken };
