const Joi = require('joi');

const createProductSchema = Joi.object({
  name: Joi.string().required().min(2).max(100),
  price: Joi.number().required().min(0),
  description: Joi.string().required().min(10),
  availableStock: Joi.number().required().min(0)
});

const updateProductSchema = Joi.object({
  name: Joi.string().optional().min(2).max(100),
  price: Joi.number().optional().min(0),
  description: Joi.string().optional().min(10),
  availableStock: Joi.number().optional().min(0)
});

const productIdSchema = Joi.object({
  id: Joi.string().hex().length(24).required()
});

module.exports = { 
  createProductSchema, 
  updateProductSchema, 
  productIdSchema 
};