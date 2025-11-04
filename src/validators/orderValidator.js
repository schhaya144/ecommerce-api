const Joi = require('joi');

const orderIdSchema = Joi.object({
  id: Joi.string().hex().length(24).required()
});

const updateStatusSchema = Joi.object({
  status: Joi.string().valid('SHIPPED', 'DELIVERED', 'CANCELLED').required()
});

module.exports = { orderIdSchema, updateStatusSchema };
