const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const orderSchema = new mongoose.Schema({
  customer: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  products: [{
    type: Schema.Types.ObjectId, 
    ref: 'Product', 
    required: true 
  }], 
  deliveryPerson: { type: Schema.Types.ObjectId, ref: 'User' }, 
  deliveryLocation: { type: String, required: true }, 
  transaction: { 
    type: Schema.Types.ObjectId, 
    ref: 'Transaction', 
    required: true 
  },
  deliveryTime: { type: Date, required: false }, 
  deliveryStatus: {
    type: String,
    enum: ['awaiting', 'inProgress', 'delivered'],
    default: 'awaiting'
  },  
  createdAt: { type: Date, default: Date.now }
});

const Order = mongoose.model('Order', orderSchema);
module.exports = Order;
