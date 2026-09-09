const LEVEL_COUNT = 30;
const LEVEL_UNIT = 1000;
const TOKEN_CAP = LEVEL_UNIT * (LEVEL_COUNT * (LEVEL_COUNT + 1)) / 2; // 465,000

const levelThreshold = (level) => level * LEVEL_UNIT;

/**
 * Feeds `amount` into a token's pool and unlocks as many sequential levels as
 * the pool allows (level n requires n * 1000, levels 1..30, summing to 465,000).
 * Mutates the passed-in state and returns which levels were newly unlocked.
 */
const applyPoolContribution = (state, amount) => {
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
    completed: unlockedLevel === LEVEL_COUNT,
  };
};

module.exports = { LEVEL_COUNT, LEVEL_UNIT, TOKEN_CAP, levelThreshold, applyPoolContribution };
