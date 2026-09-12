const express = require('express');
const { myWallet, getHistory, getUserHistory, topup, companyWallet } = require('../controllers/wallet.controller');
const {
  requestWithdrawal,
  myWithdrawals,
  listWithdrawals,
  completeWithdrawal,
  rejectWithdrawal,
} = require('../controllers/withdrawal.controller');
const {
  topupValidator,
  withdrawValidator,
  rejectWithdrawalValidator,
  walletHistoryValidator,
} = require('../validators/wallet.validator');
const validate = require('../middlewares/validate.middleware');
const { authenticate, authorize } = require('../middlewares/auth.middleware');

const router = express.Router();

router.get('/me', authenticate, myWallet);
router.get('/history', authenticate, walletHistoryValidator, validate, getHistory);
router.get('/history/:userId', authenticate, authorize('admin'), walletHistoryValidator, validate, getUserHistory);
router.post('/topup', authenticate, topupValidator, validate, topup);
router.get('/company', authenticate, authorize('admin'), companyWallet);

router.post('/withdraw', authenticate, withdrawValidator, validate, requestWithdrawal);
router.get('/withdrawals/me', authenticate, myWithdrawals);
router.get('/withdrawals', authenticate, authorize('admin'), listWithdrawals);
router.post('/withdrawals/:id/complete', authenticate, authorize('admin'), completeWithdrawal);
router.post(
  '/withdrawals/:id/reject',
  authenticate,
  authorize('admin'),
  rejectWithdrawalValidator,
  validate,
  rejectWithdrawal
);

module.exports = router;
