
const express = require('express');
const router = express.Router();
const cartController = require('../controllers/cartController');
const { authenticate, authorize } = require('../middlewares/auth');
const { validate, validateParams } = require('../middlewares/validation');
const { USER_ROLES } = require('../utils/constants');
const {
  addToCartSchema,
  productIdParamSchema
} = require('../validators/cartValidator');

// All cart routes require user authentication
router.use(authenticate);
router.use(authorize(USER_ROLES.USER));

router.get('/', cartController.getCart);
router.post('/items', validate(addToCartSchema), cartController.addToCart);
router.delete(
  '/items/:productId',
  validateParams(productIdParamSchema),
  cartController.removeFromCart
);

module.exports = router;