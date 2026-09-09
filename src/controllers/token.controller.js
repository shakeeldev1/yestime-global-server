const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');
const Token = require('../models/token.model');

// GET /api/tokens/me
const myTokens = asyncHandler(async (req, res) => {
  const tokens = await Token.find({ owner: req.user._id }).sort({ generation: 1 });
  res.status(200).json(new ApiResponse(200, { tokens }, 'Tokens fetched successfully'));
});

module.exports = { myTokens };
