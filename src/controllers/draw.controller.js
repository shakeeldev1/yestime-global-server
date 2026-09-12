const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');
const ApiError = require('../utils/ApiError');
const Draw = require('../models/draw.model');
const { runDraws } = require('../services/draw.service');
const scheduler = require('../services/scheduler.service');
const env = require('../config/env');

// POST /api/draws/run (admin only)
const triggerDraws = asyncHandler(async (req, res) => {
  const count = req.body.count || 1;
  const draws = await runDraws(count, { forceWinningNumber: req.body.winningNumber });

  const winners = draws.filter((draw) => draw.winnerToken);

  res
    .status(201)
    .json(new ApiResponse(201, { draws, winnersCount: winners.length }, `${count} draw(s) run`));
});

// GET /api/draws (public draw results, no winner identity exposed)
const listDraws = asyncHandler(async (req, res) => {
  const limit = Math.min(Number(req.query.limit) || 50, 200);

  const draws = await Draw.find()
    .sort({ createdAt: -1 })
    .limit(limit)
    .select('winningNumber rewardLevel rewardAmount createdAt winnerToken')
    .populate({ path: 'winnerToken', select: 'tokenNumber' });

  res.status(200).json(new ApiResponse(200, { draws }, 'Draws fetched successfully'));
});

// GET /api/draws/winners-history (public winners feed)
const publicWinnersHistory = asyncHandler(async (req, res) => {
  const page = Math.max(Number(req.query.page) || 1, 1);
  const limit = Math.min(Math.max(Number(req.query.limit) || 20, 1), 100);
  const filter = { winnerUser: { $ne: null }, winnerToken: { $ne: null } };
  const skip = (page - 1) * limit;

  const [draws, total, rewardSummary] = await Promise.all([
    Draw.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .select('winningNumber winnerToken winnerUser rewardLevel rewardAmount createdAt')
      .populate({ path: 'winnerToken', select: 'tokenNumber' })
      .populate({ path: 'winnerUser', select: 'name shopName' }),
    Draw.countDocuments(filter),
    Draw.aggregate([
      { $match: filter },
      { $group: { _id: null, totalRewardAmount: { $sum: '$rewardAmount' } } },
    ]),
  ]);

  const winners = draws.map((draw) => ({
    id: draw._id,
    winnerName: draw.winnerUser?.shopName || draw.winnerUser?.name || 'Winner',
    winningNumber: draw.winningNumber,
    tokenNumber: draw.winnerToken?.tokenNumber || null,
    rewardLevel: draw.rewardLevel,
    rewardAmount: draw.rewardAmount,
    wonAt: draw.createdAt,
  }));

  res.status(200).json(
    new ApiResponse(
      200,
      {
        winners,
        summary: {
          totalWinners: total,
          totalRewardAmount: rewardSummary[0]?.totalRewardAmount || 0,
        },
        pagination: { page, limit, total, pages: Math.ceil(total / limit) },
      },
      'Public winners history fetched successfully'
    )
  );
});

// GET /api/draws/my-wins
const myWins = asyncHandler(async (req, res) => {
  const page = Math.max(Number(req.query.page) || 1, 1);
  const limit = Math.min(Math.max(Number(req.query.limit) || 20, 1), 100);
  const filter = { winnerUser: req.user._id };
  const skip = (page - 1) * limit;
  const [draws, total] = await Promise.all([
    Draw.find(filter)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate({ path: 'winnerToken', select: 'tokenNumber' }),
    Draw.countDocuments(filter),
  ]);

  res.status(200).json(
    new ApiResponse(
      200,
      { draws, pagination: { page, limit, total, pages: Math.ceil(total / limit) } },
      'Your wins fetched successfully'
    )
  );
});

// GET /api/draws/winners (admin only)
const listWinners = asyncHandler(async (req, res) => {
  const page = Math.max(Number(req.query.page) || 1, 1);
  const limit = Math.min(Math.max(Number(req.query.limit) || 20, 1), 100);
  const filter = { winnerUser: { $ne: null } };
  const skip = (page - 1) * limit;
  const [draws, total] = await Promise.all([
    Draw.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate({ path: 'winnerToken', select: 'tokenNumber' })
      .populate({ path: 'winnerUser', select: 'name email shopName' }),
    Draw.countDocuments(filter),
  ]);

  res.status(200).json(
    new ApiResponse(
      200,
      { draws, pagination: { page, limit, total, pages: Math.ceil(total / limit) } },
      'Winner history fetched successfully'
    )
  );
});

// GET /api/draws/scheduler (admin only)
const schedulerStatus = asyncHandler(async (_req, res) => {
  res.status(200).json(new ApiResponse(200, { scheduler: scheduler.getStatus() }, 'Scheduler status fetched'));
});

// POST /api/draws/scheduler/start (admin only)
const startScheduler = asyncHandler(async (req, res) => {
  const intervalSeconds = req.body.intervalSeconds || env.DRAW_INTERVAL_SECONDS;
  if (intervalSeconds < 5) {
    throw new ApiError(400, 'intervalSeconds must be at least 5');
  }

  const status = scheduler.start(intervalSeconds);
  res.status(200).json(new ApiResponse(200, { scheduler: status }, 'Draw scheduler started'));
});

// POST /api/draws/scheduler/stop (admin only)
const stopScheduler = asyncHandler(async (_req, res) => {
  const status = scheduler.stop();
  res.status(200).json(new ApiResponse(200, { scheduler: status }, 'Draw scheduler stopped'));
});

module.exports = {
  triggerDraws,
  listDraws,
  publicWinnersHistory,
  myWins,
  listWinners,
  schedulerStatus,
  startScheduler,
  stopScheduler,
};
