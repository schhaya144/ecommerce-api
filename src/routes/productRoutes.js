const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const { authenticate, authorize } = require('../middlewares/auth');
const { validate, validateParams } = require('../middlewares/validation');
const { USER_ROLES } = require('../utils/constants');
const {
  createProductSchema,
  updateProductSchema,
  productIdSchema
} = require('../validators/productValidator');

// Public route
router.get('/', productController.getProducts);

// Admin only routes
router.post(
  '/',
  authenticate,
  authorize(USER_ROLES.ADMIN),
  validate(createProductSchema),
  productController.createProduct
);

router.put(
  '/:id',
  authenticate,
  authorize(USER_ROLES.ADMIN),
  validateParams(productIdSchema),
  validate(updateProductSchema),
  productController.updateProduct
);

router.delete(
  '/:id',
  authenticate,
  authorize(USER_ROLES.ADMIN),
  validateParams(productIdSchema),
  productController.deleteProduct
);

module.exports = router;
