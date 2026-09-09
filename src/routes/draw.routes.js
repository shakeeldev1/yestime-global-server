const express = require('express');
const {
  triggerDraws,
  listDraws,
  myWins,
  schedulerStatus,
  startScheduler,
  stopScheduler,
} = require('../controllers/draw.controller');
const { triggerDrawsValidator } = require('../validators/draw.validator');
const validate = require('../middlewares/validate.middleware');
const { authenticate, authorize } = require('../middlewares/auth.middleware');

const router = express.Router();

router.post('/run', authenticate, authorize('admin'), triggerDrawsValidator, validate, triggerDraws);

router.get('/scheduler', authenticate, authorize('admin'), schedulerStatus);
router.post('/scheduler/start', authenticate, authorize('admin'), startScheduler);
router.post('/scheduler/stop', authenticate, authorize('admin'), stopScheduler);

router.get('/my-wins', authenticate, myWins);
router.get('/', listDraws);

module.exports = router;
