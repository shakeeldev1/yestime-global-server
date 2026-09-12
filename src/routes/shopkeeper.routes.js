const express = require('express');
const { registerShopkeeper, listShopkeepers } = require('../controllers/shopkeeper.controller');
const {
	shopkeeperRegistrationValidator,
	shopkeeperDirectoryValidator,
} = require('../validators/shopkeeper.validator');
const validate = require('../middlewares/validate.middleware');
const { authenticate } = require('../middlewares/auth.middleware');

const router = express.Router();

router.get('/', shopkeeperDirectoryValidator, validate, listShopkeepers);
router.post('/register', authenticate, shopkeeperRegistrationValidator, validate, registerShopkeeper);

module.exports = router;