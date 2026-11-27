const express = require('express');
const {
  listUsers,
  getUser,
  createUser,
  updateUser,
  blockUser,
  unblockUser,
  deleteUser,
  restoreUser,
  creditUserWallet,
  getStats,
} = require('../controllers/admin.controller');
const {
  listPayments,
  getPayment,
  approvePayment,
  rejectPayment,
} = require('../controllers/payment.controller');
const { listShops, getShop, approveShop, rejectShop } = require('../controllers/shopAdmin.controller');
const {
  listShopDeletionRequests,
  getShopDeletionRequest,
  approveShopDeletionRequest,
  rejectShopDeletionRequest,
} = require('../controllers/shopDeletion.controller');
const {
  listUsersValidator,
  createUserValidator,
  updateUserValidator,
  creditWalletValidator,
} = require('../validators/admin.validator');
const { rejectPaymentValidator } = require('../validators/wallet.validator');
const { body, param, query } = require('express-validator');
const validate = require('../middlewares/validate.middleware');
const { authenticate, authorize } = require('../middlewares/auth.middleware');
const {
  listStaff,
  createStaff,
  getStaffDetail,
  updateStaff,
  deleteStaff,
  restoreStaff,
  getReferralSettings,
  updateReferralSettings,
  listStaffPayouts,
  processStaffPayout,
} = require('../controllers/adminReferral.controller');
const {
  staffListValidator,
  createStaffValidator,
  updateStaffValidator,
  staffDetailValidator,
  referralSettingsValidator,
  payoutListValidator,
  processPayoutValidator,
} = require('../validators/referral.validator');

const router = express.Router();

router.use(authenticate, authorize('admin'));

router.get('/stats', getStats);

router.get('/referral-settings', getReferralSettings);
router.patch('/referral-settings', referralSettingsValidator, validate, updateReferralSettings);
router.get('/staff', staffListValidator, validate, listStaff);
router.post('/staff', createStaffValidator, validate, createStaff);
router.get('/staff/:staffId', staffDetailValidator, validate, getStaffDetail);
router.patch('/staff/:staffId', updateStaffValidator, validate, updateStaff);
router.delete('/staff/:staffId', staffDetailValidator, validate, deleteStaff);
router.post('/staff/:staffId/restore', [param('staffId').isMongoId().withMessage('staffId must be a valid id')], validate, restoreStaff);
router.get('/staff-payouts', payoutListValidator, validate, listStaffPayouts);
router.get('/staff/:staffId/payouts', payoutListValidator, validate, listStaffPayouts);
router.post('/staff-payouts/:payoutId/process', processPayoutValidator, validate, processStaffPayout);

router.get('/users', listUsersValidator, validate, listUsers);
router.post('/users', createUserValidator, validate, createUser);
router.get('/users/:id', getUser);
router.patch('/users/:id', updateUserValidator, validate, updateUser);
router.post('/users/:id/block', blockUser);
router.post('/users/:id/unblock', unblockUser);
router.delete('/users/:id', [param('id').isMongoId().withMessage('id must be a valid id')], validate, deleteUser);
router.post('/users/:id/restore', [param('id').isMongoId().withMessage('id must be a valid id')], validate, restoreUser);
router.post('/users/:id/wallet-credit', creditWalletValidator, validate, creditUserWallet);
router.get('/payments', listPayments);
router.get('/payments/:id', getPayment);
router.post('/payments/:id/approve', approvePayment);
router.post('/payments/:id/reject', rejectPaymentValidator, validate, rejectPayment);
router.get('/shops', listShops);
router.get('/shops/:id', getShop);
router.post('/shops/:id/approve', approveShop);
router.post(
  '/shops/:id/reject',
  [body('reason').optional({ values: 'null' }).trim().isLength({ max: 500 }).withMessage('reason must be at most 500 characters')],
  validate,
  rejectShop
);
router.get(
  '/shop-deletion-requests',
  [
    query('status').optional().isIn(['pending', 'approved', 'rejected', 'all']).withMessage('Invalid request status'),
    query('search').optional().trim().isLength({ min: 1, max: 100 }).withMessage('search must be 1 to 100 characters'),
    query('page').optional().isInt({ min: 1 }).withMessage('page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('limit must be between 1 and 100'),
  ],
  validate,
  listShopDeletionRequests
);
router.get(
  '/shop-deletion-requests/:requestId',
  [param('requestId').isMongoId().withMessage('requestId must be a valid id')],
  validate,
  getShopDeletionRequest
);
router.post(
  '/shop-deletion-requests/:requestId/approve',
  [param('requestId').isMongoId().withMessage('requestId must be a valid id')],
  validate,
  approveShopDeletionRequest
);
router.post(
  '/shop-deletion-requests/:requestId/reject',
  [
    param('requestId').isMongoId().withMessage('requestId must be a valid id'),
    body('reason').optional({ values: 'null' }).trim().isLength({ max: 500 }).withMessage('reason must be at most 500 characters'),
  ],
  validate,
  rejectShopDeletionRequest
);

module.exports = router;
