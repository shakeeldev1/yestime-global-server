const express = require('express');
const {
  listUsers,
  getUser,
  createUser,
  updateUser,
  blockUser,
  unblockUser,
  deleteUser,
  getStats,
} = require('../controllers/admin.controller');
const { listUsersValidator, createUserValidator, updateUserValidator } = require('../validators/admin.validator');
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

module.exports = router;
