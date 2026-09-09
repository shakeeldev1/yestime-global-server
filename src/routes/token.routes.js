const express = require('express');
const { activate } = require('../controllers/wallet.controller');
const { myTokens } = require('../controllers/token.controller');
const { authenticate } = require('../middlewares/auth.middleware');

const router = express.Router();

router.post('/activate', authenticate, activate);
router.get('/me', authenticate, myTokens);

module.exports = router;
