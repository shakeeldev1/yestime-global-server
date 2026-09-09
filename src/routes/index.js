const express = require('express');
const authRoutes = require('./auth.routes');
const walletRoutes = require('./wallet.routes');
const tokenRoutes = require('./token.routes');
const purchaseRoutes = require('./purchase.routes');
const drawRoutes = require('./draw.routes');
const adminRoutes = require('./admin.routes');

const router = express.Router();

router.get('/health', (_req, res) => res.status(200).json({ success: true, message: 'OK' }));
router.use('/auth', authRoutes);
router.use('/wallet', walletRoutes);
router.use('/tokens', tokenRoutes);
router.use('/purchases', purchaseRoutes);
router.use('/draws', drawRoutes);
router.use('/admin', adminRoutes);

module.exports = router;
