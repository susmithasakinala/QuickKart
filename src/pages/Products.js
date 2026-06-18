import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { CartContext } from '../context/CartContext';
import { NotificationContext } from '../context/NotificationContext';
import { API_URL } from '../config';

const CATEGORIES_LIST = [
  'All',
  'Fashion',
  'Beauty',
  'Home Decor',
  'Kitchen Decor',
  'Electronics',
  'Watches',
  'Books',
  'Grocery',
  'Sports',
  'Accessories'
];

const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1531403009284-440f080d1e12?w=600&auto=format&fit=crop';

function Products() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Search & Filter States
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [rating, setRating] = useState('');
  const [brand, setBrand] = useState('');
  const [availability, setAvailability] = useState('all');
  const [sort, setSort] = useState('newest');

  const { addToCart } = useContext(CartContext);
  const { triggerToast } = useContext(NotificationContext);

  useEffect(() => {
    fetchProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category, rating, brand, availability, sort]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const params = {};
      if (category !== 'All') params.category = category;
      if (search) params.search = search;
      if (minPrice) params.minPrice = minPrice;
      if (maxPrice) params.maxPrice = maxPrice;
      if (rating) params.rating = rating;
      if (brand) params.brand = brand;
      if (availability !== 'all') params.availability = availability;
      if (sort) params.sort = sort;

      const res = await axios.get(`${API_URL}/api/products`, { params });
      setProducts(res.data);
    } catch (err) {
      console.error('Error loading catalog products:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchProducts();
  };

  const handleAddToCart = async (product) => {
    try {
      await addToCart(product);
      triggerToast(`🛒 Added "${product.name}" to cart!`);
    } catch (err) {
      triggerToast(`❌ Failed to add: ${err.message}`);
    }
  };

  const handleResetFilters = () => {
    setSearch('');
    setCategory('All');
    setMinPrice('');
    setMaxPrice('');
    setRating('');
    setBrand('');
    setAvailability('all');
    setSort('newest');
  };

  return (
    <div className="container py-4">
      <div className="row">
        {/* Sidebar Filters */}
        <div className="col-12 col-md-4 col-lg-3 mb-4">
          <div className="premium-card p-4">
            <div className="d-flex justify-content-between align-items-center mb-3 border-bottom pb-2">
              <h4 className="fw-bold m-0" style={{ fontSize: '18px' }}>Filters</h4>
              <button 
                onClick={handleResetFilters} 
                className="btn btn-sm btn-link text-decoration-none fw-bold p-0" 
                style={{ color: '#FF6B00' }}
              >
                Reset
              </button>
            </div>

            {/* Category Filter */}
            <div className="mb-3">
              <label className="form-label fw-bold small">Category</label>
              <select 
                className="form-select" 
                value={category} 
                onChange={(e) => setCategory(e.target.value)}
              >
                {CATEGORIES_LIST.map((cat, idx) => (
                  <option key={idx} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            {/* Price Range */}
            <div className="mb-3">
              <label className="form-label fw-bold small">Price Range (₹)</label>
              <div className="d-flex gap-2">
                <input 
                  type="number" 
                  className="form-control" 
                  placeholder="Min" 
                  value={minPrice}
                  onChange={(e) => setMinPrice(e.target.value)}
                />
                <input 
                  type="number" 
                  className="form-control" 
                  placeholder="Max" 
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                />
              </div>
              <button onClick={fetchProducts} className="btn btn-green btn-sm mt-2 w-100 fw-bold">Apply Price</button>
            </div>

            {/* Rating Filter */}
            <div className="mb-3">
              <label className="form-label fw-bold small">Minimum Rating</label>
              <select 
                className="form-select" 
                value={rating} 
                onChange={(e) => setRating(e.target.value)}
              >
                <option value="">Any Rating</option>
                <option value="4.5">★ 4.5 & Above</option>
                <option value="4">★ 4.0 & Above</option>
                <option value="3">★ 3.0 & Above</option>
              </select>
            </div>

            {/* Brand Filter */}
            <div className="mb-3">
              <label className="form-label fw-bold small">Brand Name</label>
              <input 
                type="text" 
                className="form-control" 
                placeholder="e.g. Puma, Titan" 
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
              />
            </div>

            {/* Availability */}
            <div className="mb-3">
              <label className="form-label fw-bold small">Availability</label>
              <div className="d-flex flex-column gap-1">
                <label className="small fw-semibold d-flex align-items-center gap-2">
                  <input 
                    type="radio" 
                    name="availability" 
                    checked={availability === 'all'} 
                    onChange={() => setAvailability('all')} 
                  />
                  All Products
                </label>
                <label className="small fw-semibold d-flex align-items-center gap-2">
                  <input 
                    type="radio" 
                    name="availability" 
                    checked={availability === 'in-stock'} 
                    onChange={() => setAvailability('in-stock')} 
                  />
                  In Stock Only
                </label>
                <label className="small fw-semibold d-flex align-items-center gap-2">
                  <input 
                    type="radio" 
                    name="availability" 
                    checked={availability === 'out-of-stock'} 
                    onChange={() => setAvailability('out-of-stock')} 
                  />
                  Out of Stock
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Product Grid */}
        <div className="col-12 col-md-8 col-lg-9">
          {/* Top Bar (Search & Sort) */}
          <div className="premium-card p-3 mb-4 d-flex flex-column flex-md-row gap-3 justify-content-between align-items-center">
            <form onSubmit={handleSearchSubmit} className="d-flex w-100 max-width-md" style={{ maxWidth: '400px' }}>
              <input 
                type="text" 
                className="form-control me-2" 
                placeholder="Search products..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <button type="submit" className="btn btn-green fw-bold">Search</button>
            </form>

            <div className="d-flex align-items-center gap-2 w-100 w-md-auto justify-content-end">
              <label className="fw-bold text-nowrap small m-0">Sort By:</label>
              <select 
                className="form-select w-auto" 
                value={sort} 
                onChange={(e) => setSort(e.target.value)}
              >
                <option value="newest">Newest Arrivals</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
                <option value="popularity">Popularity (Rating)</option>
              </select>
            </div>
          </div>

          {/* Results Grid */}
          {loading ? (
            <div className="d-flex justify-content-center py-5">
              <div className="spinner-border text-success" role="status" style={{ width: '3rem', height: '3rem' }}>
                <span className="visually-hidden">Loading Products...</span>
              </div>
            </div>
          ) : products.length === 0 ? (
            <div className="premium-card p-5 text-center text-muted">
              <h3>No products found match your selection.</h3>
              <p className="mb-0">Try widening your price range, search query or resetting filters.</p>
            </div>
          ) : (
            <div className="row g-4">
              {products.map(product => (
                <div key={product._id} className="col-12 col-sm-6 col-lg-4">
                  <div className="premium-card h-100 d-flex flex-column">
                    <Link to={`/buyer/product/${product._id}`} className="text-decoration-none">
                      <div className="position-relative" style={{ height: '220px', overflow: 'hidden' }}>
                        <img 
                          src={product.image} 
                          alt={product.name} 
                          className="w-100 h-100" 
                          style={{ objectFit: 'cover' }} 
                          onError={(e) => { e.target.onerror = null; e.target.src = FALLBACK_IMAGE; }}
                        />
                        {product.discount > 0 && (
                          <span className="position-absolute top-2 start-2 badge bg-danger fw-bold rounded-pill" style={{ fontSize: '11px' }}>
                            {product.discount}% OFF
                          </span>
                        )}
                        {product.stock === 0 && (
                          <div className="position-absolute top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}>
                            <span className="badge bg-secondary fs-6 p-2.5 fw-bold">Out of Stock</span>
                          </div>
                        )}
                      </div>
                    </Link>

                    <div className="p-3 d-flex flex-column flex-grow-1 justify-content-between">
                      <div>
                        <div className="d-flex justify-content-between align-items-center mb-1">
                          <span className="text-muted small fw-bold text-uppercase">{product.category}</span>
                          <span className="fw-bold text-dark small" style={{ letterSpacing: '0.5px' }}>{product.brand}</span>
                        </div>
                        <h5 className="fw-bold mb-1 text-truncate" style={{ fontSize: '16px' }}>
                          <Link to={`/buyer/product/${product._id}`} className="text-decoration-none text-dark">{product.name}</Link>
                        </h5>
                        <div className="d-flex align-items-center mb-2">
                          <span className="text-warning me-1">★</span>
                          <span className="fw-bold small text-dark">{product.rating || '4.5'}</span>
                        </div>
                      </div>

                      <div>
                        <div className="d-flex align-items-baseline gap-2 mb-3">
                          <span className="fw-bold fs-5 text-success">₹{product.price}</span>
                          {product.originalPrice > product.price && (
                            <span className="text-decoration-line-through text-muted small">₹{product.originalPrice}</span>
                          )}
                        </div>
                        
                        <button 
                          onClick={() => handleAddToCart(product)} 
                          className="btn btn-green w-100 py-2 fw-bold"
                          disabled={product.stock === 0}
                        >
                          {product.stock === 0 ? 'Out Of Stock' : 'Add to Cart'}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Products;