const express = require('express');
const router = express.Router();
const Wishlist = require('../models/Wishlist');
const auth = require('../middleware/auth');

// GET Wishlist
router.get('/', auth, async (req, res) => {
  try {
    let wishlist = await Wishlist.findOne({ userId: req.user.userId }).populate('products');
    if (!wishlist) {
      wishlist = new Wishlist({ userId: req.user.userId, products: [] });
      await wishlist.save();
    }
    res.json(wishlist.products);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// ADD to Wishlist
router.post('/', auth, async (req, res) => {
  try {
    const { productId } = req.body;
    if (!productId) return res.status(400).json({ message: 'Product ID is required' });

    let wishlist = await Wishlist.findOne({ userId: req.user.userId });
    if (!wishlist) {
      wishlist = new Wishlist({ userId: req.user.userId, products: [] });
    }

    if (!wishlist.products.includes(productId)) {
      wishlist.products.push(productId);
      await wishlist.save();
    }

    res.json({ message: 'Added to wishlist', wishlist: wishlist.products });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// REMOVE from Wishlist
router.delete('/:productId', auth, async (req, res) => {
  try {
    const { productId } = req.params;
    let wishlist = await Wishlist.findOne({ userId: req.user.userId });
    if (!wishlist) {
      return res.status(404).json({ message: 'Wishlist not found' });
    }

    wishlist.products = wishlist.products.filter(id => id.toString() !== productId);
    await wishlist.save();
    res.json({ message: 'Removed from wishlist', wishlist: wishlist.products });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;
