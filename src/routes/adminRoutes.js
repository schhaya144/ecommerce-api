const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { authenticate, authorize } = require('../middlewares/auth');
const { validate, validateParams } = require('../middlewares/validation');
const { USER_ROLES } = require('../utils/constants');
const {
  orderIdSchema,
  updateStatusSchema
} = require('../validators/orderValidator');

// All admin routes require admin authentication
router.use(authenticate);
router.use(authorize(USER_ROLES.ADMIN));

router.get('/orders', adminController.getAllOrders);
router.patch(
  '/orders/:id/status',
  validateParams(orderIdSchema),
  validate(updateStatusSchema),
  adminController.updateOrderStatus
);

module.exports = router;
