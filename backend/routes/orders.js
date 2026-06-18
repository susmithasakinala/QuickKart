const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const Cart = require('../models/Cart');
const Product = require('../models/Product');
const Notification = require('../models/Notification');
const auth = require('../middleware/auth');

// PLACE order
router.post('/', auth, async (req, res) => {
  try {
    const { items, totalAmount, shippingAddress, paymentMethod, couponApplied } = req.body;
    
    if (!items || items.length === 0) {
      return res.status(400).json({ message: 'Cart items cannot be empty' });
    }

    // 1. Create order
    const order = new Order({
      buyer: req.user.userId,
      buyerName: req.user.name,
      items,
      totalAmount,
      shippingAddress,
      paymentMethod,
      couponApplied: couponApplied || '',
      paymentStatus: paymentMethod === 'Cash On Delivery' ? 'Pending' : 'Paid',
      status: 'Order Placed'
    });
    
    await order.save();

    // 2. Reduce stock for each product and notify sellers
    for (const item of items) {
      const product = await Product.findById(item.productId);
      if (product) {
        product.stock = Math.max(0, product.stock - item.quantity);
        await product.save();

        // Notify Seller
        const sellerNotification = new Notification({
          userId: product.seller,
          message: `🛒 New order received! 1x "${product.name}" sold to ${req.user.name}.`,
          role: 'seller'
        });
        await sellerNotification.save();

        // Low stock warning
        if (product.stock > 0 && product.stock <= 5) {
          const lowStockNotification = new Notification({
            userId: product.seller,
            message: `⚠️ Low Stock Alert: "${product.name}" has only ${product.stock} items remaining.`,
            role: 'seller'
          });
          await lowStockNotification.save();
        }
      }
    }

    // 3. Notify Buyer
    const buyerNotification = new Notification({
      userId: req.user.userId,
      message: `🎉 Order placed successfully! Your order ID is ${order._id}.`,
      role: 'buyer'
    });
    await buyerNotification.save();

    // 4. Clear active (purchased) items from Cart, keeping saved-for-later items
    const cart = await Cart.findOne({ userId: req.user.userId });
    if (cart) {
      cart.items = cart.items.filter(i => i.savedForLater === true);
      await cart.save();
    }

    res.status(201).json(order);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET buyer's orders
router.get('/mine', auth, async (req, res) => {
  try {
    const orders = await Order.find({ buyer: req.user.userId }).sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET seller's orders (orders containing seller's products)
router.get('/seller', auth, async (req, res) => {
  try {
    if (req.user.role !== 'seller') {
      return res.status(403).json({ message: 'Only sellers can access seller orders list' });
    }
    const orders = await Order.find({ 'items.seller': req.user.userId }).sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// UPDATE order status (seller or admin)
router.put('/:id/status', auth, async (req, res) => {
  try {
    const { status } = req.body;
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found' });

    order.status = status;
    if (status === 'Delivered') {
      order.paymentStatus = 'Paid';
    }
    await order.save();

    // Notify Buyer about status update
    const buyerNotification = new Notification({
      userId: order.buyer,
      message: `📦 Your order #${order._id} status is now: ${status}.`,
      role: 'buyer'
    });
    await buyerNotification.save();

    // Notify sellers whose products are in this order
    const sellerIds = [...new Set(order.items.map(item => item.seller.toString()))];
    for (const sellerId of sellerIds) {
      const sellerNotification = new Notification({
        userId: sellerId,
        message: `🚚 Order #${order._id} update: status updated to ${status}.`,
        role: 'seller'
      });
      await sellerNotification.save();
    }

    res.json(order);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;