const express = require('express');
const {
	registerShopkeeper,
	listShopkeepers,
	myShops,
	updateShop,
	deleteShop,
} = require('../controllers/shopkeeper.controller');
const {
	shopkeeperRegistrationValidator,
	shopkeeperDirectoryValidator,
	shopUpdateValidator,
	shopDeleteValidator,
} = require('../validators/shopkeeper.validator');
const validate = require('../middlewares/validate.middleware');
const { authenticate } = require('../middlewares/auth.middleware');
const { uploadShopImage } = require('../middlewares/shopImageUpload');

const router = express.Router();

router.get('/', shopkeeperDirectoryValidator, validate, listShopkeepers);
router.get('/mine', authenticate, myShops);
router.post('/register', authenticate, uploadShopImage.single('image'), shopkeeperRegistrationValidator, validate, registerShopkeeper);
router.patch('/:shopId', authenticate, uploadShopImage.single('image'), shopUpdateValidator, validate, updateShop);
router.post('/delete', authenticate, shopDeleteValidator, validate, deleteShop);

module.exports = router;