const Token = require('../models/token.model');
const TokenNumberSequence = require('../models/tokenNumberSequence.model');
const { applyPoolContribution } = require('../utils/levels');
const ApiError = require('../utils/ApiError');

const createTokenForOwner = async (ownerId, { generation = 1, pool = 0, session } = {}) => {
  while (true) {
    try {
      // eslint-disable-next-line no-await-in-loop
      const sequence = await TokenNumberSequence.increment(session);
      if (!sequence) {
        throw new ApiError(503, 'The six-digit token number sequence is exhausted or unavailable');
      }

      const tokenNumber = String(sequence.value).padStart(6, '0');
      const existingTokenQuery = Token.exists({ tokenNumber });
      if (session) existingTokenQuery.session(session);

      // eslint-disable-next-line no-await-in-loop
      if (await existingTokenQuery) continue;

      // eslint-disable-next-line no-await-in-loop
      const [token] = await Token.create([{
        tokenNumber,
        owner: ownerId,
        generation,
        pool,
      }], session ? { session } : {});
      return token;
    } catch (error) {
      if (!session && error.code === 11000) {
        continue;
      }
      throw error;
    }
  }
};

const getActiveToken = (ownerId, { session } = {}) => {
  const query = Token.findOne({ owner: ownerId, status: 'active' });
  return session ? query.session(session) : query;
};

/**
 * Feeds `amount` into the owner's currently active token, unlocking levels as
 * far as the pool allows. If the token completes all 30 levels, it is closed
 * out and a new token is created for the owner, seeded with any pool overflow.
 */
const contributeToActiveToken = async (ownerId, amount, { session } = {}) => {
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
    token.status = 'completed';
    token.completedAt = new Date();
    await token.save(session ? { session } : {});

    const newToken = await createTokenForOwner(ownerId, {
      generation: token.generation + 1,
      pool: result.pool,
      session,
    });

    return { token, newToken, leveledUp: result.leveledUp, completed: true };
  }

  token.pool = result.pool;
  await token.save(session ? { session } : {});

  return { token, newToken: null, leveledUp: result.leveledUp, completed: false };
};

module.exports = { createTokenForOwner, getActiveToken, contributeToActiveToken };
