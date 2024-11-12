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
  variation: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Variation',
    required: false
  }
}, { timestamps: true });

const Product = mongoose.model('Product', productSchema);
module.exports = Product;
