import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { CartContext } from '../context/CartContext';
import { NotificationContext } from '../context/NotificationContext';
import { AuthContext } from '../context/AuthContext';
import { API_URL } from '../config';

const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1531403009284-440f080d1e12?w=600&auto=format&fit=crop';

function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [activeImage, setActiveImage] = useState('');
  const [loading, setLoading] = useState(true);

  // Review Form States
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [reviewLoading, setReviewLoading] = useState(false);

  const { addToCart } = useContext(CartContext);
  const { triggerToast } = useContext(NotificationContext);
  const { user } = useContext(AuthContext);

  const [wishlistPulsing, setWishlistPulsing] = useState(false);

  useEffect(() => {
    fetchProductDetails();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const fetchProductDetails = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/products/${id}`);
      setProduct(res.data);
      setActiveImage(res.data.image);
    } catch (err) {
      console.error('Error fetching product details:', err);
      triggerToast('❌ Product not found!');
      navigate('/buyer');
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = async () => {
    if (!product) return;
    try {
      await addToCart(product);
      triggerToast('🛒 Product added to cart successfully');
    } catch (err) {
      triggerToast(`❌ Failed to add: ${err.message}`);
    }
  };

  const handleBuyNow = async () => {
    if (!product) return;
    try {
      // Direct checkout order creation
      const orderData = {
        items: [{
          productId: product._id,
          name: product.name,
          price: product.price,
          quantity: 1,
          image: product.image,
          seller: product.seller
        }],
        totalAmount: product.price,
        shippingAddress: user?.address || 'H-210, Green Park Extension, New Delhi, Delhi, 110016',
        paymentMethod: 'Cash On Delivery',
        couponApplied: ''
      };

      const res = await axios.post(`${API_URL}/api/orders`, orderData);
      triggerToast('🎉 Order placed successfully');
      navigate(`/buyer/orders?orderId=${res.data._id}`);
    } catch (err) {
      triggerToast(`❌ Buy Now failed: ${err.message}`);
    }
  };

  const handleAddToWishlist = async () => {
    if (!product) return;
    setWishlistPulsing(true);
    try {
      await axios.post(`${API_URL}/api/wishlist`, { productId: product._id });
      triggerToast('❤️ Added to wishlist');
      setTimeout(() => setWishlistPulsing(false), 1000);
    } catch (err) {
      console.error(err);
      triggerToast('❌ Error adding to wishlist.');
      setWishlistPulsing(false);
    }
  };

  const handleAddReview = async (e) => {
    e.preventDefault();
    if (!comment.trim()) return;

    setReviewLoading(true);
    try {
      const res = await axios.post(`${API_URL}/api/products/${id}/reviews`, {
        rating,
        comment
      });
      setProduct(res.data.product);
      setComment('');
      setRating(5);
      triggerToast('⭐ Review submitted successfully!');
    } catch (err) {
      console.error(err);
      triggerToast('❌ Failed to submit review.');
    } finally {
      setReviewLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '80vh' }}>
        <div className="spinner-border text-success" role="status" style={{ width: '3rem', height: '3rem' }}>
          <span className="visually-hidden">Loading details...</span>
        </div>
      </div>
    );
  }

  if (!product) return null;

  const imagesGallery = product.images && product.images.length > 0 ? product.images : [product.image];

  return (
    <div className="container py-5">
      <div className="row g-5">
        {/* Gallery Column (with zoom) */}
        <div className="col-12 col-md-6">
          <div className="premium-card p-3 mb-3 text-center zoom-container" style={{ minHeight: '350px' }}>
            <img 
              src={activeImage} 
              alt={product.name} 
              className="img-fluid rounded-3 zoom-image" 
              style={{ maxHeight: '450px', objectFit: 'contain', width: '100%' }} 
              onError={(e) => { e.target.onerror = null; e.target.src = FALLBACK_IMAGE; }}
            />
          </div>
          {imagesGallery.length > 1 && (
            <div className="d-flex gap-2 justify-content-center overflow-auto py-2">
              {imagesGallery.map((img, idx) => (
                <div 
                  key={idx} 
                  onClick={() => setActiveImage(img)}
                  className={`premium-card p-1 cursor-pointer ${activeImage === img ? 'border-success border-2' : ''}`}
                  style={{ width: '80px', height: '80px', cursor: 'pointer' }}
                >
                  <img src={img} alt="" className="w-100 h-100" style={{ objectFit: 'cover' }} onError={(e) => { e.target.onerror = null; e.target.src = FALLBACK_IMAGE; }} />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Product Details Column */}
        <div className="col-12 col-md-6">
          <span className="badge bg-success mb-2 px-3 py-2 fw-bold rounded-pill text-white">{product.category}</span>
          <h1 className="fw-extrabold mb-1" style={{ fontSize: '32px' }}>{product.name}</h1>
          <p className="text-muted small fw-bold mb-3">Brand: {product.brand || 'Generic'}</p>

          <div className="d-flex align-items-center gap-3 mb-4">
            <div className="d-flex align-items-center bg-warning text-dark px-3 py-1 rounded-pill fw-bold">
              <span className="me-1">★</span> {product.rating}
            </div>
            <span className="text-muted fw-semibold">{product.reviews?.length || 0} customer reviews</span>
          </div>

          <div className="d-flex align-items-baseline gap-3 mb-4 border-bottom pb-3">
            <h2 className="fw-extrabold text-success fs-1 m-0">₹{product.price}</h2>
            {product.originalPrice > product.price && (
              <>
                <span className="text-decoration-line-through text-muted fs-4">₹{product.originalPrice}</span>
                <span className="text-danger fw-bold fs-5">({product.discount}% OFF)</span>
              </>
            )}
          </div>

          <div className="mb-4">
            <h5 className="fw-bold mb-2">Description</h5>
            <p className="text-muted lh-base" style={{ fontWeight: '500' }}>{product.description}</p>
          </div>

          {/* Seller / Stock Info */}
          <div className="premium-card p-3 mb-4 bg-light">
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <p className="m-0 small text-muted fw-bold">SELLER INFO</p>
                <h6 className="m-0 fw-bold text-dark">{product.sellerName}</h6>
              </div>
              <div className="text-end">
                <p className="m-0 small text-muted fw-bold">AVAILABILITY</p>
                <h6 className={`m-0 fw-bold ${product.stock > 0 ? 'text-success' : 'text-danger'}`}>
                  {product.stock > 0 ? `${product.stock} Units In Stock` : 'Out of Stock'}
                </h6>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="d-flex flex-wrap gap-3 mb-5">
            <button 
              onClick={handleAddToCart}
              className="btn btn-green flex-fill py-3 fs-5 fw-bold"
              disabled={product.stock === 0}
            >
              🛒 Add to Cart
            </button>
            <button 
              onClick={handleBuyNow}
              className="btn btn-orange flex-fill py-3 fs-5 fw-bold"
              disabled={product.stock === 0}
            >
              ⚡ Buy Now
            </button>
            <button 
              onClick={handleAddToWishlist}
              className={`btn btn-outline-dark px-4 py-3 fw-bold ${wishlistPulsing ? 'animate-pulse' : ''}`}
            >
              ❤️ Wishlist
            </button>
          </div>

          {/* Review section */}
          <div className="border-top pt-4">
            <h4 className="fw-bold mb-4">Customer Reviews</h4>

            {/* Write a review form */}
            <form onSubmit={handleAddReview} className="premium-card p-4 mb-4">
              <h5 className="fw-bold mb-3" style={{ fontSize: '16px' }}>Add Your Review</h5>
              <div className="row mb-3">
                <div className="col-12 col-sm-6">
                  <label className="form-label fw-bold small">Rating</label>
                  <select 
                    className="form-select" 
                    value={rating} 
                    onChange={(e) => setRating(parseInt(e.target.value))}
                  >
                    <option value="5">★★★★★ (5 Stars)</option>
                    <option value="4">★★★★☆ (4 Stars)</option>
                    <option value="3">★★★☆☆ (3 Stars)</option>
                    <option value="2">★★☆☆☆ (2 Stars)</option>
                    <option value="1">★☆☆☆☆ (1 Star)</option>
                  </select>
                </div>
              </div>
              <div className="mb-3">
                <label className="form-label fw-bold small">Comment</label>
                <textarea 
                  className="form-control" 
                  rows="3" 
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Share your thoughts about this product..."
                  required
                />
              </div>
              <button type="submit" className="btn btn-green fw-bold px-4" disabled={reviewLoading}>
                {reviewLoading ? 'Submitting...' : 'Submit Review'}
              </button>
            </form>

            {/* Reviews list */}
            {product.reviews?.length === 0 ? (
              <p className="text-muted small fw-bold">No reviews for this product yet. Be the first to review!</p>
            ) : (
              <div className="d-flex flex-column gap-3">
                {product.reviews.map((rev, idx) => (
                  <div key={idx} className="premium-card p-3">
                    <div className="d-flex justify-content-between align-items-center mb-1">
                      <h6 className="fw-bold m-0" style={{ fontSize: '15px' }}>{rev.username}</h6>
                      <div className="text-warning" style={{ fontSize: '14px' }}>
                        {'★'.repeat(rev.rating)}{'☆'.repeat(5 - rev.rating)}
                      </div>
                    </div>
                    <p className="text-muted small m-0 mb-1 fw-bold">
                      Reviewed on {new Date(rev.date).toLocaleDateString()}
                    </p>
                    <p className="m-0 text-dark small" style={{ fontWeight: '500' }}>{rev.comment}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProductDetail;