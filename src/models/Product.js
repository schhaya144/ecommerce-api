const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Product name is required'],
    trim: true
  },
  price: {
    type: Number,
    required: [true, 'Price is required'],
    min: 0
  },
  description: {
    type: String,
    required: [true, 'Description is required']
  },
  availableStock: {
    type: Number,
    required: [true, 'Stock is required'],
    min: 0,
    default: 0
  },
  reservedStock: {
    type: Number,
    default: 0,
    min: 0
  }
}, {
  timestamps: true
});

// Index for search optimization
productSchema.index({ name: 'text' });

module.exports = mongoose.model('Product', productSchema);