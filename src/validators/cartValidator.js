const Joi = require('joi');

const addToCartSchema = Joi.object({
  productId: Joi.string().hex().length(24).required(),
  quantity: Joi.number().integer().min(1).required()
});

const productIdParamSchema = Joi.object({
  productId: Joi.string().hex().length(24).required()
});

module.exports = { addToCartSchema, productIdParamSchema };

