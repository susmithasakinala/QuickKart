import React, { useState, useEffect, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { CartContext } from '../context/CartContext';
import { NotificationContext } from '../context/NotificationContext';
import { AuthContext } from '../context/AuthContext';
import { API_URL } from '../config';

const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1531403009284-440f080d1e12?w=600&auto=format&fit=crop';

function Home() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const { addToCart } = useContext(CartContext);
  const { triggerToast } = useContext(NotificationContext);
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  // Quick View State
  const [quickViewProduct, setQuickViewProduct] = useState(null);
  const [recentlyViewed, setRecentlyViewed] = useState([]);

  useEffect(() => {
    if (!localStorage.getItem('token')) {
      navigate('/login-select');
      return;
    }
    if (user && user.role === 'seller') {
      navigate('/seller');
      return;
    }
    if (user && user.role === 'admin') {
      navigate('/admin');
      return;
    }

    fetchProducts();
    
    // Load recently viewed
    const saved = localStorage.getItem('last_viewed_products');
    if (saved) {
      setRecentlyViewed(JSON.parse(saved));
    }
  }, [user, navigate]);

  const fetchProducts = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/products`);
      setProducts(res.data);
    } catch (err) {
      console.error('Error fetching products:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = async (product, e) => {
    if (e) e.preventDefault();
    try {
      await addToCart(product);
      triggerToast('🛒 Product added to cart successfully');
    } catch (err) {
      triggerToast(`❌ Failed to add item: ${err.message}`);
    }
  };

  const handleBuyNow = async (product, e) => {
    if (e) e.preventDefault();
    try {
      await addToCart(product);
      triggerToast('🎉 Order placed successfully');
      navigate('/buyer/orders');
    } catch (err) {
      triggerToast(`❌ Failed to buy: ${err.message}`);
    }
  };

  const handleAddToWishlist = async (product, e) => {
    if (e) e.preventDefault();
    try {
      await axios.post(`${API_URL}/api/wishlist`, { productId: product._id });
      triggerToast('❤️ Added to wishlist');
    } catch (err) {
      console.error(err);
      triggerToast('❌ Error adding to wishlist.');
    }
  };

  const saveToRecentlyViewed = (product) => {
    let list = [...recentlyViewed];
    list = list.filter(p => p._id !== product._id);
    list.unshift(product);
    list = list.slice(0, 8); // keep latest 8 items
    setRecentlyViewed(list);
    localStorage.setItem('last_viewed_products', JSON.stringify(list));
  };

  const SkeletonRow = () => (
    <div className="row flex-nowrap overflow-hidden gap-3 mb-5 px-1">
      {[1, 2, 3, 4].map(idx => (
        <div key={idx} className="col-10 col-sm-6 col-md-4 col-lg-3" style={{ minWidth: '240px' }}>
          <div className="skeleton-card">
            <div className="skeleton-shimmer skeleton-img" />
            <div className="skeleton-shimmer skeleton-text" />
            <div className="skeleton-shimmer skeleton-text" style={{ width: '60%' }} />
            <div className="skeleton-shimmer skeleton-price mt-3" />
          </div>
        </div>
      ))}
    </div>
  );

  // Filters for the 12 sections
  const trendingProducts = [...products].sort((a, b) => b.rating - a.rating).slice(0, 6);
  const bestSellers = [...products].filter(p => p.rating >= 4.6).slice(0, 6);
  const mostAddedToCart = [...products].sort((a, b) => b.price - a.price).slice(0, 6);
  const mostOrdered = [...products].slice(10, 16);
  
  const beautyCollection = [...products].filter(p => p.category === 'Beauty' || p.category === 'Beauty Products').slice(0, 6);
  const fashionCollection = [...products].filter(p => p.category === 'Fashion' || p.category === "Women's Fashion").slice(0, 6);
  const electronicsCollection = [...products].filter(p => p.category === 'Electronics').slice(0, 6);
  const kitchenCollection = [...products].filter(p => p.category === 'Kitchen Decor' || p.category === 'Kitchen').slice(0, 6);
  
  const newArrivals = [...products].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 6);
  const flashSale = [...products].sort((a, b) => b.discount - a.discount).slice(0, 6);
  const recommended = [...products].slice(20, 26);

  const ProductListRow = ({ title, items }) => (
    <div className="mb-5">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h3 className="fw-bold m-0" style={{ fontSize: '22px', color: '#1A1A1A' }}>{title}</h3>
        <Link to="/buyer/catalog" className="text-decoration-none fw-bold" style={{ color: '#FF6B00' }}>View All →</Link>
      </div>
      {items.length === 0 ? (
        <div className="premium-card p-4 text-center text-muted fw-bold">
          No products listed in this section yet.
        </div>
      ) : (
        <div className="row flex-nowrap overflow-auto pb-3 scrollbar-hide px-1" style={{ gap: '16px' }}>
          {items.map(item => (
            <div key={item._id} className="col-10 col-sm-6 col-md-4 col-lg-3" style={{ minWidth: '240px' }}>
              <div className="premium-card h-100 d-flex flex-column position-relative">
                {/* Wishlist Heart Overlay */}
                <button 
                  onClick={(e) => handleAddToWishlist(item, e)}
                  className="position-absolute top-2 end-2 btn btn-sm bg-white rounded-circle shadow-sm border-0"
                  style={{ zIndex: 10, color: '#dc3545', fontSize: '15px' }}
                >
                  ❤️
                </button>

                <Link 
                  to={`/buyer/product/${item._id}`} 
                  onClick={() => saveToRecentlyViewed(item)}
                  className="text-decoration-none"
                >
                  <div className="position-relative" style={{ height: '180px', overflow: 'hidden' }}>
                    <img 
                      src={item.image} 
                      alt={item.name} 
                      className="w-100 h-100" 
                      style={{ objectFit: 'cover', transition: 'transform 0.3s ease' }} 
                      onError={(e) => { e.target.onerror = null; e.target.src = FALLBACK_IMAGE; }}
                    />
                    {item.discount > 0 && (
                      <span className="position-absolute top-2 start-2 badge bg-danger fw-bold rounded-pill" style={{ fontSize: '11px' }}>
                        {item.discount}% OFF
                      </span>
                    )}
                  </div>
                </Link>
                <div className="p-3 d-flex flex-column flex-grow-1 justify-content-between">
                  <div>
                    <span className="text-muted small fw-bold text-uppercase">{item.category}</span>
                    <h5 className="fw-bold mb-1 text-truncate" style={{ fontSize: '15px', color: '#1A1A1A' }}>
                      <Link 
                        to={`/buyer/product/${item._id}`} 
                        onClick={() => saveToRecentlyViewed(item)}
                        className="text-decoration-none text-dark"
                      >
                        {item.name}
                      </Link>
                    </h5>
                    <div className="d-flex align-items-center mb-2">
                      <span className="text-warning me-1">★</span>
                      <span className="fw-bold small text-dark">{item.rating || '4.5'}</span>
                    </div>
                  </div>
                  <div>
                    <div className="d-flex align-items-baseline gap-2 mb-2">
                      <span className="fw-bold fs-5" style={{ color: '#2E7D32' }}>₹{item.price}</span>
                      {item.originalPrice > item.price && (
                        <span className="text-decoration-line-through text-muted small">₹{item.originalPrice}</span>
                      )}
                    </div>
                    <div className="d-flex gap-2">
                      <button onClick={(e) => handleAddToCart(item, e)} className="btn btn-green btn-sm flex-fill py-2 fw-bold">
                        Add to Cart
                      </button>
                      <button 
                        onClick={() => { saveToRecentlyViewed(item); setQuickViewProduct(item); }} 
                        className="btn btn-sm btn-outline-orange fw-bold"
                        title="Quick View"
                      >
                        👁️
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="container py-4">
      {/* Hero Banner */}
      <div className="hero-banner mb-5 p-5">
        <div className="row align-items-center">
          <div className="col-12 col-lg-7">
            <span className="badge bg-warning text-dark px-3 py-2 fw-bold rounded-pill mb-3">GRAND UPGRADE SALE</span>
            <h1 className="display-4 fw-extrabold mb-2" style={{ fontWeight: '800', color: '#1A1A1A' }}>
              Shop Smart, Shop Fast!
            </h1>
            <p className="fs-5 mb-4 opacity-90 text-muted" style={{ fontWeight: '500' }}>
              Explore over 500+ premium Indian products with realistic pricing, instant search suggestions, and real-time shipping tracking.
            </p>
            <Link to="/buyer/catalog" className="btn btn-orange btn-lg px-5 py-3 fs-5 fw-bold">
              Shop 500+ Catalog Items
            </Link>
          </div>
          <div className="col-12 col-lg-5 d-none d-lg-block text-center">
            <span style={{ fontSize: '150px' }} className="animate-spin-slow d-inline-block">🛍️</span>
          </div>
        </div>
      </div>

      {loading ? (
        <>
          <SkeletonRow />
          <SkeletonRow />
          <SkeletonRow />
        </>
      ) : (
        <>
          {/* 12 Sections */}
          <ProductListRow title="🔥 Trending Products" items={trendingProducts} />
          <ProductListRow title="🏆 Best Sellers" items={bestSellers} />
          <ProductListRow title="🛒 Most Added To Cart" items={mostAddedToCart} />
          <ProductListRow title="📈 Most Ordered" items={mostOrdered} />
          
          {/* Recently Viewed */}
          {recentlyViewed.length > 0 && (
            <ProductListRow title="⏳ Recently Viewed" items={recentlyViewed} />
          )}

          <ProductListRow title="💄 Beauty Collection" items={beautyCollection} />
          <ProductListRow title="👕 Fashion Collection" items={fashionCollection} />
          <ProductListRow title="💻 Electronics Collection" items={electronicsCollection} />
          <ProductListRow title="🍳 Kitchen Collection" items={kitchenCollection} />
          <ProductListRow title="🆕 New Arrivals" items={newArrivals} />
          <ProductListRow title="⚡ Flash Sale" items={flashSale} />
          <ProductListRow title="🌟 Recommended For You" items={recommended} />
        </>
      )}

      {/* Product Quick View Modal */}
      {quickViewProduct && (
        <div 
          className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center" 
          style={{ backgroundColor: 'rgba(0,0,0,0.4)', zIndex: 1100 }}
        >
          <div className="premium-card p-4 w-100 m-3 glass-panel" style={{ maxWidth: '700px' }}>
            <div className="d-flex justify-content-between align-items-start mb-3 border-bottom pb-2">
              <h4 className="fw-bold m-0">{quickViewProduct.name}</h4>
              <button 
                onClick={() => setQuickViewProduct(null)} 
                className="btn-close" 
                style={{ cursor: 'pointer' }}
              />
            </div>
            
            <div className="row g-4">
              <div className="col-12 col-sm-5 text-center">
                <img 
                  src={quickViewProduct.image} 
                  alt="" 
                  className="img-fluid rounded" 
                  style={{ maxHeight: '250px', objectFit: 'contain' }} 
                  onError={(e) => { e.target.onerror = null; e.target.src = FALLBACK_IMAGE; }}
                />
              </div>
              <div className="col-12 col-sm-7 d-flex flex-column justify-content-between">
                <div>
                  <span className="badge bg-success mb-2">{quickViewProduct.category}</span>
                  <p className="text-muted small fw-bold m-0">Brand: {quickViewProduct.brand}</p>
                  <div className="d-flex align-items-center mb-3">
                    <span className="text-warning me-1">★</span>
                    <span className="fw-bold small text-dark">{quickViewProduct.rating}</span>
                  </div>
                  
                  <p className="text-muted small mb-3" style={{ maxHeight: '90px', overflowY: 'auto' }}>
                    {quickViewProduct.description}
                  </p>
                </div>

                <div>
                  <div className="d-flex align-items-baseline gap-2 mb-3">
                    <span className="fw-bold fs-4 text-success">₹{quickViewProduct.price}</span>
                    {quickViewProduct.originalPrice > quickViewProduct.price && (
                      <span className="text-decoration-line-through text-muted small">₹{quickViewProduct.originalPrice}</span>
                    )}
                    {quickViewProduct.discount > 0 && (
                      <span className="text-danger small fw-bold">({quickViewProduct.discount}% OFF)</span>
                    )}
                  </div>

                  <div className="d-flex gap-2">
                    <button 
                      onClick={(e) => { handleAddToCart(quickViewProduct, e); setQuickViewProduct(null); }} 
                      className="btn btn-green fw-bold flex-fill py-2.5"
                    >
                      Add To Cart
                    </button>
                    <button 
                      onClick={(e) => { handleBuyNow(quickViewProduct, e); setQuickViewProduct(null); }} 
                      className="btn btn-orange fw-bold flex-fill py-2.5"
                    >
                      Buy Now
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Home;