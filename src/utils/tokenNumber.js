const crypto = require('crypto');

/** A random 6-digit string, e.g. "004821". */
const generateTokenNumber = () => crypto.randomInt(0, 1000000).toString().padStart(6, '0');

module.exports = { generateTokenNumber };
