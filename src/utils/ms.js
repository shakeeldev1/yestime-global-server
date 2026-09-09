const UNITS = {
  ms: 1,
  s: 1000,
  m: 60 * 1000,
  h: 60 * 60 * 1000,
  d: 24 * 60 * 60 * 1000,
};

/**
 * Converts a duration string like "15m", "7d", "1h" (same format used by
 * jsonwebtoken's expiresIn) into milliseconds, for use as a cookie maxAge.
 */
const ms = (value) => {
  const match = /^(\d+)(ms|s|m|h|d)$/.exec(String(value).trim());
  if (!match) {
    throw new Error(`Invalid duration string: ${value}`);
  }
  const [, amount, unit] = match;
  return Number(amount) * UNITS[unit];
};

module.exports = ms;
