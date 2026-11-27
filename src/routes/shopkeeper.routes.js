const express = require('express');
const {
	registerShopkeeper,
	listShopkeepers,
	myShops,
	updateShop,
} = require('../controllers/shopkeeper.controller');
const { requestShopDeletion } = require('../controllers/shopDeletion.controller');
const {
	shopkeeperRegistrationValidator,
	shopkeeperDirectoryValidator,
	shopUpdateValidator,
	shopDeletionRequestValidator,
} = require('../validators/shopkeeper.validator');
const validate = require('../middlewares/validate.middleware');
const { authenticate } = require('../middlewares/auth.middleware');
const { uploadShopImage } = require('../middlewares/shopImageUpload');

const router = express.Router();

router.get('/', shopkeeperDirectoryValidator, validate, listShopkeepers);
router.get('/mine', authenticate, myShops);
router.post('/register', authenticate, uploadShopImage.single('image'), shopkeeperRegistrationValidator, validate, registerShopkeeper);
router.patch('/:shopId', authenticate, uploadShopImage.single('image'), shopUpdateValidator, validate, updateShop);
router.post('/delete', authenticate, shopDeletionRequestValidator, validate, requestShopDeletion);

module.exports = router;