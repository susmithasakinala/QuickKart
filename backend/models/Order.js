const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  buyer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  buyerName: { type: String, required: true },
  items: [
    {
      productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
      name: String,
      price: Number,
      quantity: Number,
      image: String,
      seller: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
    }
  ],
  totalAmount: { type: Number, required: true },
  shippingAddress: { type: String, required: true },
  paymentMethod: { type: String, required: true },
  paymentStatus: { type: String, enum: ['Pending', 'Paid'], default: 'Pending' },
  status: { 
    type: String, 
    enum: ['Order Placed', 'Confirmed', 'Packed', 'Shipped', 'Out For Delivery', 'Delivered'], 
    default: 'Order Placed' 
  },
  couponApplied: { type: String, default: '' }
}, { timestamps: true });

module.exports = mongoose.model('Order', orderSchema);