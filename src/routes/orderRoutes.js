const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { authenticate, authorize } = require('../middlewares/auth');
const { validateParams } = require('../middlewares/validation');
const { USER_ROLES } = require('../utils/constants');
const { orderIdSchema } = require('../validators/orderValidator');

// All order routes require user authentication
router.use(authenticate);
router.use(authorize(USER_ROLES.USER));

router.post('/checkout', orderController.checkout);
router.post(
  '/:id/pay',
  validateParams(orderIdSchema),
  orderController.payOrder
);
router.get('/', orderController.getOrders);
router.get(
  '/:id',
  validateParams(orderIdSchema),
  orderController.getOrderById
);

module.exports = router;