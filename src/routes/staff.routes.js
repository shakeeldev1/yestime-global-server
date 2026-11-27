const express = require('express');
const { getDashboard, listReferrals, listEarnings, listPayouts, requestPayout } = require('../controllers/staff.controller');
const { requestPayoutValidator } = require('../validators/referral.validator');
const validate = require('../middlewares/validate.middleware');
const { authenticate, authorize } = require('../middlewares/auth.middleware');

const router = express.Router();

router.use(authenticate, authorize('staff'));
router.get('/dashboard', getDashboard);
router.get('/referrals', listReferrals);
router.get('/earnings', listEarnings);
router.get('/payouts', listPayouts);
router.post('/payouts', requestPayoutValidator, validate, requestPayout);

module.exports = router;
