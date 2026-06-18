const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const User = require('../models/User');
const Notification = require('../models/Notification');
const auth = require('../middleware/auth');

// GET search suggestions (instant search autocomplete)
router.get('/suggestions', async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || q.trim() === '') return res.json([]);
    const suggestions = await Product.find({
      $or: [
        { name: { $regex: q, $options: 'i' } },
        { category: { $regex: q, $options: 'i' } },
        { brand: { $regex: q, $options: 'i' } }
      ]
    })
      .select('name image price category brand')
      .limit(8);
    res.json(suggestions);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET all products (with advanced filters, search & sorting)
router.get('/', async (req, res) => {
  try {
    const { category, rating, brand, search, minPrice, maxPrice, availability, sort } = req.query;
    let query = {};

    // Search filter
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { category: { $regex: search, $options: 'i' } },
        { brand: { $regex: search, $options: 'i' } }
      ];
    }

    // Category filter
    if (category && category !== 'All') {
      query.category = category;
    }

    // Rating filter (greater than or equal to)
    if (rating) {
      query.rating = { $gte: parseFloat(rating) };
    }

    // Brand filter
    if (brand) {
      query.brand = { $regex: brand, $options: 'i' };
    }

    // Price range filter
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = parseFloat(minPrice);
      if (maxPrice) query.price.$lte = parseFloat(maxPrice);
    }

    // Availability filter
    if (availability === 'in-stock') {
      query.stock = { $gt: 0 };
    } else if (availability === 'out-of-stock') {
      query.stock = { $eq: 0 };
    }

    let productQuery = Product.find(query);

    // Sorting
    if (sort) {
      if (sort === 'price-asc') {
        productQuery = productQuery.sort({ price: 1 });
      } else if (sort === 'price-desc') {
        productQuery = productQuery.sort({ price: -1 });
      } else if (sort === 'newest') {
        productQuery = productQuery.sort({ createdAt: -1 });
      } else if (sort === 'popularity') {
        productQuery = productQuery.sort({ rating: -1 });
      }
    } else {
      productQuery = productQuery.sort({ createdAt: -1 }); // default to newest
    }

    const products = await productQuery;
    res.json(products);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET seller's own products (MUST be before :id to prevent conflict)
router.get('/seller/mine', auth, async (req, res) => {
  try {
    if (req.user.role !== 'seller') {
      return res.status(403).json({ message: 'Only sellers can access their own products catalog' });
    }
    const products = await Product.find({ seller: req.user.userId }).sort({ createdAt: -1 });
    res.json(products);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET single product
router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });
    res.json(product);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ADD product (seller only)
router.post('/', auth, async (req, res) => {
  try {
    if (req.user.role !== 'seller') {
      return res.status(403).json({ message: 'Only sellers can upload products' });
    }

    const sellerUser = await User.findById(req.user.userId);
    if (!sellerUser || !sellerUser.approved) {
      return res.status(403).json({ 
        message: 'Your seller account has not been approved by the admin yet.' 
      });
    }

    const { name, category, price, originalPrice, image, images, description, stock, discount, brand } = req.body;
    
    const product = new Product({
      name,
      category,
      price: parseFloat(price),
      originalPrice: parseFloat(originalPrice || price),
      image: image || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30',
      images: images || [image],
      description,
      stock: parseInt(stock) || 10,
      discount: parseFloat(discount) || 0,
      brand: brand || 'Generic',
      seller: req.user.userId,
      sellerName: req.user.name
    });

    await product.save();

    // Create system notification for seller
    const newNotification = new Notification({
      userId: req.user.userId,
      message: `Successfully uploaded product: ${name}.`,
      role: 'seller'
    });
    await newNotification.save();

    res.status(201).json(product);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// UPDATE product (seller only)
router.put('/:id', auth, async (req, res) => {
  try {
    if (req.user.role !== 'seller') {
      return res.status(403).json({ message: 'Only sellers can edit products' });
    }

    const product = await Product.findOneAndUpdate(
      { _id: req.params.id, seller: req.user.userId },
      req.body,
      { new: true }
    );
    if (!product) return res.status(404).json({ message: 'Product not found or not yours' });

    // Check low stock
    if (product.stock > 0 && product.stock <= 5) {
      const lowStockNotification = new Notification({
        userId: req.user.userId,
        message: `⚠️ Low Stock Warning: "${product.name}" only has ${product.stock} items left.`,
        role: 'seller'
      });
      await lowStockNotification.save();
    }

    res.json(product);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE product (seller or admin)
router.delete('/:id', auth, async (req, res) => {
  try {
    let product;
    if (req.user.role === 'admin') {
      product = await Product.findByIdAndDelete(req.params.id);
    } else if (req.user.role === 'seller') {
      product = await Product.findOneAndDelete({ _id: req.params.id, seller: req.user.userId });
    } else {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    if (!product) return res.status(404).json({ message: 'Product not found' });
    res.json({ message: 'Product deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ADD REVIEW
router.post('/:id/reviews', auth, async (req, res) => {
  try {
    const { rating, comment } = req.body;
    if (!rating || !comment) {
      return res.status(400).json({ message: 'Rating and comment are required' });
    }

    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });

    const review = {
      username: req.user.name,
      rating: parseInt(rating),
      comment,
      date: new Date()
    };

    product.reviews.push(review);

    // Re-calculate average rating
    const totalRating = product.reviews.reduce((sum, rev) => sum + rev.rating, 0);
    product.rating = parseFloat((totalRating / product.reviews.length).toFixed(1));

    await product.save();
    res.status(201).json({ message: 'Review added', product });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;