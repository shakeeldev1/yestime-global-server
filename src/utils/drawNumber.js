const crypto = require('crypto');

/** A random 6-digit draw number. */
const generateDrawNumber = () => crypto.randomInt(0, 1000000).toString().padStart(6, '0');

module.exports = { generateDrawNumber };
