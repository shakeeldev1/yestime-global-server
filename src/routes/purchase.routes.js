const express = require('express');
const {
  recordPurchase,
  recordSelfPurchase,
  myPurchases,
  purchaseHistory,
  purchaseStats,
} = require('../controllers/purchase.controller');
const {
  recordPurchaseValidator,
  recordSelfPurchaseValidator,
  purchaseStatsValidator,
} = require('../validators/purchase.validator');
const validate = require('../middlewares/validate.middleware');
const { authenticate, authorize } = require('../middlewares/auth.middleware');

const router = express.Router();

router.post('/', authenticate, authorize('shopkeeper'), recordPurchaseValidator, validate, recordPurchase);
router.post(
  '/self',
  authenticate,
  authorize('shopper'),
  recordSelfPurchaseValidator,
  validate,
  recordSelfPurchase
);
router.get('/stats', authenticate, purchaseStatsValidator, validate, purchaseStats);
router.get('/history', authenticate, purchaseStatsValidator, validate, purchaseHistory);
router.get('/me', authenticate, myPurchases);

module.exports = router;
