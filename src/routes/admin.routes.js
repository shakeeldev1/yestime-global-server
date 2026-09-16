const express = require('express');
const {
  listUsers,
  getUser,
  createUser,
  updateUser,
  blockUser,
  unblockUser,
  deleteUser,
  creditUserWallet,
  getStats,
} = require('../controllers/admin.controller');
const {
  listPayments,
  approvePayment,
  rejectPayment,
} = require('../controllers/payment.controller');
const {
  listUsersValidator,
  createUserValidator,
  updateUserValidator,
  creditWalletValidator,
} = require('../validators/admin.validator');
const { rejectPaymentValidator } = require('../validators/wallet.validator');
const validate = require('../middlewares/validate.middleware');
const { authenticate, authorize } = require('../middlewares/auth.middleware');

const router = express.Router();

router.use(authenticate, authorize('admin'));

router.get('/stats', getStats);

router.get('/users', listUsersValidator, validate, listUsers);
router.post('/users', createUserValidator, validate, createUser);
router.get('/users/:id', getUser);
router.patch('/users/:id', updateUserValidator, validate, updateUser);
router.post('/users/:id/block', blockUser);
router.post('/users/:id/unblock', unblockUser);
router.delete('/users/:id', deleteUser);
router.post('/users/:id/wallet-credit', creditWalletValidator, validate, creditUserWallet);
router.get('/payments', listPayments);
router.post('/payments/:id/approve', approvePayment);
router.post('/payments/:id/reject', rejectPaymentValidator, validate, rejectPayment);

module.exports = router;
