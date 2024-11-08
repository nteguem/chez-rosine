const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  basePrice: {
    type: Number,
    min: [0, 'Price must be positive']
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: true
  },
  hasVariation: {
    type: Boolean,
    default: false
  },
  variation: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Variation',
    required: false
  }
}, { timestamps: true });

const Product = mongoose.model('Product', productSchema);
module.exports = Product;
