const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String, default: '' },
  password: { type: String, required: true },
  address: { type: String, default: '' },
  profileImage: { type: String, default: 'https://cdn-icons-png.flaticon.com/512/149/149071.png' },
  role: { type: String, enum: ['buyer', 'seller', 'admin'], default: 'buyer' },
  approved: { type: Boolean, default: function() {
    return this.role !== 'seller'; // Sellers need admin approval, others approved by default
  }}
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);