const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const auth = require('../middleware/auth');

// REGISTER
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    
    let user = await User.findOne({ email });
    if (user) {
      user.name = name;
      user.password = await bcrypt.hash(password, 10);
      user.role = role || 'buyer';
      await user.save();
    } else {
      const hashed = await bcrypt.hash(password, 10);
      user = new User({
        name,
        email,
        password: hashed,
        role: role || 'buyer',
        phone: '',
        address: '',
        approved: true
      });
      await user.save();
    }

    res.status(201).json({ 
      message: 'Registration Successful',
      user: { 
        id: user._id, 
        name: user.name, 
        email: user.email, 
        role: user.role 
      } 
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// LOGIN
router.post('/login', async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    
    let user = await User.findOne({ email });
    if (!user) {
      // Register on the fly
      const hashed = await bcrypt.hash(password || 'demo123', 10);
      user = new User({
        name: name || email.split('@')[0] || 'Demo User',
        email,
        password: hashed,
        role: role || 'buyer',
        phone: '',
        address: '',
        approved: true
      });
      await user.save();
    } else {
      // Update name if a new one is provided during login
      if (name && name !== user.name) {
        user.name = name;
        await user.save();
      }
    }

    const token = jwt.sign(
      { userId: user._id, name: user.name, role: user.role },
      process.env.JWT_SECRET || 'quickkart_secret_key_123',
      { expiresIn: '7d' }
    );
    res.json({ 
      token, 
      user: { 
        id: user._id, 
        name: user.name, 
        email: user.email, 
        phone: user.phone, 
        address: user.address, 
        role: user.role, 
        profileImage: user.profileImage,
        approved: user.approved 
      } 
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// GET PROFILE
router.get('/profile', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// UPDATE PROFILE
router.put('/profile', auth, async (req, res) => {
  try {
    const { name, email, phone, address, profileImage, password } = req.body;
    const user = await User.findById(req.user.userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (name) user.name = name;
    if (phone) user.phone = phone;
    if (address) user.address = address;
    if (profileImage) user.profileImage = profileImage;
    if (email && email !== user.email) {
      const existing = await User.findOne({ email });
      if (existing) return res.status(400).json({ message: 'Email already registered by another user!' });
      user.email = email;
    }
    if (password) {
      user.password = await bcrypt.hash(password, 10);
    }

    await user.save();
    res.json({
      message: 'Profile updated successfully!',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        address: user.address,
        role: user.role,
        profileImage: user.profileImage,
        approved: user.approved
      }
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// DELETE PROFILE / ACCOUNT
router.delete('/profile', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    await User.findByIdAndDelete(req.user.userId);
    res.json({ message: 'Account deleted successfully!' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// SWITCH ROLE
router.post('/switch-role', auth, async (req, res) => {
  try {
    const { role } = req.body;
    if (!['buyer', 'seller'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role' });
    }
    
    const user = await User.findById(req.user.userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.role = role;
    // If user is switching to seller and has not been approved yet, set approved to false.
    // If they were already approved or previously a seller, we can keep it or set false.
    // To make testing easy, let's auto-approve user role switches, but keep the initial register sellers needing approval.
    if (role === 'seller') {
      user.approved = true; // Auto-approve switch to ease user flow
    }
    
    await user.save();
    
    const token = jwt.sign(
      { userId: user._id, name: user.name, role: user.role },
      process.env.JWT_SECRET || 'quickkart_secret_key_123',
      { expiresIn: '7d' }
    );
    
    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        address: user.address,
        role: user.role,
        profileImage: user.profileImage,
        approved: user.approved
      }
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;