import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { CartContext } from '../context/CartContext';
import { NotificationContext } from '../context/NotificationContext';
import { API_URL } from '../config';

const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1531403009284-440f080d1e12?w=600&auto=format&fit=crop';

function Wishlist() {
  const [wishlist, setWishlist] = useState([]);
  const [loading, setLoading] = useState(true);
  const { addToCart } = useContext(CartContext);
  const { triggerToast } = useContext(NotificationContext);

  useEffect(() => {
    fetchWishlist();
  }, []);

  const fetchWishlist = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/wishlist`);
      setWishlist(res.data);
    } catch (err) {
      console.error('Error fetching wishlist:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (productId) => {
    try {
      await axios.delete(`${API_URL}/api/wishlist/${productId}`);
      setWishlist(prev => prev.filter(p => p._id !== productId));
      triggerToast('💔 Removed from wishlist.');
    } catch (err) {
      console.error(err);
      triggerToast('❌ Error removing item.');
    }
  };

  const handleAddToCart = async (product) => {
    try {
      await addToCart(product);
      triggerToast(`🛒 Added "${product.name}" to cart!`);
    } catch (err) {
      triggerToast(`❌ Failed to add: ${err.message}`);
    }
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '80vh' }}>
        <div className="spinner-border text-success" role="status" style={{ width: '3rem', height: '3rem' }}>
          <span className="visually-hidden">Loading wishlist...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-5">
      <h2 className="fw-extrabold mb-4">My Wishlist</h2>
      {wishlist.length === 0 ? (
        <div className="premium-card p-5 text-center text-muted">
          <span style={{ fontSize: '64px' }}>❤️</span>
          <h4 className="fw-bold mt-3">Your wishlist is empty</h4>
          <p className="small mb-4">Click the heart icon on any product to save it here.</p>
          <Link to="/buyer/catalog" className="btn btn-green fw-bold">Explore Catalog</Link>
        </div>
      ) : (
        <div className="row g-4">
          {wishlist.map(product => (
            <div key={product._id} className="col-12 col-sm-6 col-md-4 col-lg-3">
              <div className="premium-card h-100 d-flex flex-column">
                <div className="position-relative" style={{ height: '200px', overflow: 'hidden' }}>
                  <img src={product.image} alt={product.name} className="w-100 h-100" style={{ objectFit: 'cover' }} onError={(e) => { e.target.onerror = null; e.target.src = FALLBACK_IMAGE; }} />
                  <button 
                    onClick={() => handleRemove(product._id)}
                    className="position-absolute top-2 end-2 btn btn-sm bg-white rounded-circle shadow-sm"
                    style={{ border: 'none', color: '#dc3545', fontSize: '16px' }}
                  >
                    ✕
                  </button>
                </div>

                <div className="p-3 d-flex flex-column flex-grow-1 justify-content-between">
                  <div>
                    <span className="text-muted small fw-bold text-uppercase">{product.category}</span>
                    <h6 className="fw-bold mb-1 text-truncate">
                      <Link to={`/buyer/product/${product._id}`} className="text-decoration-none text-dark">{product.name}</Link>
                    </h6>
                    <span className="fw-bold text-success fs-5">₹{product.price}</span>
                  </div>

                  <div className="mt-3">
                    <button 
                      onClick={() => handleAddToCart(product)} 
                      className="btn btn-green btn-sm w-100 fw-bold py-2"
                    >
                      Move to Cart
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Wishlist;
