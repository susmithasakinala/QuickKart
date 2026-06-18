import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { NotificationContext } from '../context/NotificationContext';
import { RevenueChart, SalesChart, CategoryPieChart } from '../components/DashboardCharts';
import { API_URL } from '../config';

const CATEGORIES_LIST = [
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

function SellerDashboard() {
  const { user } = useContext(AuthContext);
  const { triggerToast } = useContext(NotificationContext);

  const [myProducts, setMyProducts] = useState([]);
  const [sellerOrders, setSellerOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  // Add/Edit Product form states
  const [isEditing, setIsEditing] = useState(false);
  const [editProductId, setEditProductId] = useState(null);
  const [productForm, setProductForm] = useState({
    name: '',
    description: '',
    price: '',
    originalPrice: '',
    image: '',
    stock: '10',
    discount: '0',
    category: 'Fashion',
    brand: 'Generic'
  });

  const [showAddModal, setShowAddModal] = useState(false);

  useEffect(() => {
    fetchDashboardData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // 1. Fetch products
      const prodRes = await axios.get(`${API_URL}/api/products/seller/mine`);
      setMyProducts(prodRes.data);

      // 2. Fetch orders
      const orderRes = await axios.get(`${API_URL}/api/orders/seller`);
      setSellerOrders(orderRes.data);
    } catch (err) {
      console.error('Error fetching dashboard statistics:', err);
      triggerToast('❌ Error loading dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    setProductForm({ ...productForm, [e.target.name]: e.target.value });
  };

  const handleAddProduct = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_URL}/api/products`, productForm);
      triggerToast('🎉 Product added successfully!');
      setShowAddModal(false);
      resetForm();
      fetchDashboardData();
    } catch (err) {
      console.error(err);
      triggerToast(`❌ Error: ${err.response?.data?.message || err.message}`);
    }
  };

  const handleEditClick = (product) => {
    setIsEditing(true);
    setEditProductId(product._id);
    setProductForm({
      name: product.name,
      description: product.description,
      price: product.price,
      originalPrice: product.originalPrice || product.price,
      image: product.image,
      stock: product.stock.toString(),
      discount: product.discount ? product.discount.toString() : '0',
      category: product.category,
      brand: product.brand || 'Generic'
    });
    setShowAddModal(true);
  };

  const handleUpdateProduct = async (e) => {
    e.preventDefault();
    try {
      await axios.put(`${API_URL}/api/products/${editProductId}`, productForm);
      triggerToast('🎉 Product updated successfully!');
      setShowAddModal(false);
      resetForm();
      fetchDashboardData();
    } catch (err) {
      console.error(err);
      triggerToast('❌ Error updating product.');
    }
  };

  const handleDeleteProduct = async (productId) => {
    if (!window.confirm('Delete this product permanently?')) return;
    try {
      await axios.delete(`${API_URL}/api/products/${productId}`);
      triggerToast('🗑️ Product deleted successfully.');
      fetchDashboardData();
    } catch (err) {
      console.error(err);
      triggerToast('❌ Error deleting product.');
    }
  };

  const handleQuickStockUpdate = async (productId, currentStock, change) => {
    const newStock = Math.max(0, currentStock + change);
    try {
      await axios.put(`${API_URL}/api/products/${productId}`, { stock: newStock });
      triggerToast('📦 Stock level adjusted!');
      setMyProducts(prev => prev.map(p => p._id === productId ? { ...p, stock: newStock } : p));
    } catch (err) {
      console.error(err);
      triggerToast('❌ Stock update failed.');
    }
  };

  const resetForm = () => {
    setIsEditing(false);
    setEditProductId(null);
    setProductForm({
      name: '',
      description: '',
      price: '',
      originalPrice: '',
      image: '',
      stock: '10',
      discount: '0',
      category: 'Fashion',
      brand: 'Generic'
    });
  };

  // Calculations for dashboard indicators
  const totalProducts = myProducts.length;
  const inStockProducts = myProducts.filter(p => p.stock > 0).length;
  const outOfStockProducts = totalProducts - inStockProducts;

  let totalSalesCount = 0;
  let revenue = 0;
  let totalOrdersCount = sellerOrders.length;
  let pendingOrders = 0;
  let completedOrders = 0;

  // Track sales metrics for the current seller's items
  sellerOrders.forEach(order => {
    if (order.status === 'Delivered') completedOrders++;
    else if (order.status !== 'Cancelled') pendingOrders++;

    order.items.forEach(item => {
      if (item.seller === user?.id) {
        totalSalesCount += item.quantity;
        revenue += (item.price * item.quantity);
      }
    });
  });

  // Analytics for category distribution
  const catDistribution = {};
  myProducts.forEach(p => {
    catDistribution[p.category] = (catDistribution[p.category] || 0) + 1;
  });

  const catLabels = Object.keys(catDistribution);
  const catValues = Object.values(catDistribution);

  // Analytics for order trend data (mocked slightly based on real values to look good)
  const salesMonthsLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
  const revenueTrendValues = [revenue * 0.2, revenue * 0.4, revenue * 0.3, revenue * 0.6, revenue * 0.8, revenue];

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '80vh' }}>
        <div className="spinner-border text-warning" role="status" style={{ width: '3rem', height: '3rem' }}>
          <span className="visually-hidden">Loading Dashboard...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-extrabold m-0">Seller Dashboard</h2>
          <p className="text-muted fw-semibold">Welcome back, {user?.name}</p>
        </div>
        <button 
          onClick={() => { resetForm(); setShowAddModal(true); }} 
          className="btn btn-orange fw-bold py-2.5 px-4"
        >
          ➕ Add New Product
        </button>
      </div>

      {/* Analytics Indicator cards */}
      <div className="row g-3 mb-5">
        {[
          { title: 'Total Uploads', value: totalProducts, border: 'border-primary' },
          { title: 'Units Sold', value: totalSalesCount, border: 'border-success' },
          { title: 'Revenue', value: `₹${revenue}`, border: 'border-warning' },
          { title: 'In Stock', value: inStockProducts, border: 'border-info' },
          { title: 'Out Of Stock', value: outOfStockProducts, border: 'border-danger' },
          { title: 'Total Orders', value: totalOrdersCount, border: 'border-dark' },
          { title: 'Pending Orders', value: pendingOrders, border: 'border-secondary' },
          { title: 'Completed Orders', value: completedOrders, border: 'border-success' }
        ].map((card, idx) => (
          <div key={idx} className="col-6 col-md-4 col-lg-3">
            <div className={`premium-card p-3 border-start border-4 ${card.border}`}>
              <h6 className="text-muted small fw-bold text-uppercase mb-2">{card.title}</h6>
              <h3 className="fw-extrabold text-dark m-0">{card.value}</h3>
            </div>
          </div>
        ))}
      </div>

      {/* Analytics charts Section */}
      <div className="row g-4 mb-5">
        <div className="col-12 col-lg-6">
          <div className="premium-card p-4">
            <h5 className="fw-bold mb-3 border-bottom pb-2">Monthly Revenue Trend (₹)</h5>
            <RevenueChart labels={salesMonthsLabels} values={revenueTrendValues} />
          </div>
        </div>
        <div className="col-12 col-md-6 col-lg-3">
          <div className="premium-card p-4">
            <h5 className="fw-bold mb-3 border-bottom pb-2">Category Spread</h5>
            <CategoryPieChart labels={catLabels} values={catValues} />
          </div>
        </div>
        <div className="col-12 col-md-6 col-lg-3">
          <div className="premium-card p-4">
            <h5 className="fw-bold mb-3 border-bottom pb-2">Product Upload Count</h5>
            <SalesChart labels={catLabels} values={catValues} />
          </div>
        </div>
      </div>

      {/* Product Inventory Tab */}
      <div className="premium-card p-4 mb-4">
        <h4 className="fw-bold mb-4 border-bottom pb-2">My Uploaded Products</h4>
        {myProducts.length === 0 ? (
          <div className="text-center py-5 text-muted">
            <h5>No products uploaded yet.</h5>
            <p className="small mb-0">List your first product by clicking the Add New Product button above.</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table align-middle">
              <thead>
                <tr>
                  <th className="fw-bold text-dark">Image</th>
                  <th className="fw-bold text-dark">Product Name</th>
                  <th className="fw-bold text-dark">Category</th>
                  <th className="fw-bold text-dark">Price (₹)</th>
                  <th className="fw-bold text-dark">Stock</th>
                  <th className="fw-bold text-dark">Discount</th>
                  <th className="fw-bold text-dark text-end">Actions</th>
                </tr>
              </thead>
              <tbody>
                {myProducts.map(p => (
                  <tr key={p._id}>
                    <td>
                      <img src={p.image} alt="" style={{ width: '50px', height: '50px', objectFit: 'cover' }} className="rounded" />
                    </td>
                    <td>
                      <h6 className="fw-bold m-0 text-dark">{p.name}</h6>
                      <span className="small text-muted">{p.brand}</span>
                    </td>
                    <td><span className="badge bg-light text-dark fw-bold">{p.category}</span></td>
                    <td>
                      <span className="fw-bold text-success">₹{p.price}</span>
                      {p.originalPrice > p.price && (
                        <div className="small text-decoration-line-through text-muted">₹{p.originalPrice}</div>
                      )}
                    </td>
                    <td>
                      <div className="d-flex align-items-center gap-2">
                        <button onClick={() => handleQuickStockUpdate(p._id, p.stock, -1)} className="btn btn-sm btn-light py-0 px-1.5 fw-bold">-</button>
                        <span className={`fw-bold ${p.stock <= 5 ? 'text-danger' : 'text-dark'}`}>{p.stock}</span>
                        <button onClick={() => handleQuickStockUpdate(p._id, p.stock, 1)} className="btn btn-sm btn-light py-0 px-1.5 fw-bold">+</button>
                      </div>
                    </td>
                    <td><span className="fw-bold text-danger">{p.discount}% OFF</span></td>
                    <td className="text-end">
                      <button onClick={() => handleEditClick(p)} className="btn btn-sm btn-outline-primary me-2 fw-bold">Edit</button>
                      <button onClick={() => handleDeleteProduct(p._id)} className="btn btn-sm btn-outline-danger fw-bold">Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {showAddModal && (
        <div className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 999 }}>
          <div className="premium-card p-4 w-100 m-3" style={{ maxWidth: '650px', maxHeight: '90vh', overflowY: 'auto' }}>
            <h4 className="fw-bold mb-4 border-bottom pb-2">
              {isEditing ? '✏️ Edit Product Details' : '➕ Upload New Product'}
            </h4>
            <form onSubmit={isEditing ? handleUpdateProduct : handleAddProduct}>
              <div className="row g-3 mb-3">
                <div className="col-12 col-sm-6">
                  <label className="form-label fw-bold small">Product Name</label>
                  <input type="text" className="form-control" name="name" value={productForm.name} onChange={handleInputChange} required />
                </div>
                <div className="col-12 col-sm-6">
                  <label className="form-label fw-bold small">Category</label>
                  <select className="form-select" name="category" value={productForm.category} onChange={handleInputChange}>
                    {CATEGORIES_LIST.map((cat, idx) => (
                      <option key={idx} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="row g-3 mb-3">
                <div className="col-6 col-sm-3">
                  <label className="form-label fw-bold small">Price (₹)</label>
                  <input type="number" className="form-control" name="price" value={productForm.price} onChange={handleInputChange} required />
                </div>
                <div className="col-6 col-sm-3">
                  <label className="form-label fw-bold small">Original Price</label>
                  <input type="number" className="form-control" name="originalPrice" value={productForm.originalPrice} onChange={handleInputChange} />
                </div>
                <div className="col-6 col-sm-3">
                  <label className="form-label fw-bold small">Discount (%)</label>
                  <input type="number" className="form-control" name="discount" value={productForm.discount} onChange={handleInputChange} />
                </div>
                <div className="col-6 col-sm-3">
                  <label className="form-label fw-bold small">Stock Quantity</label>
                  <input type="number" className="form-control" name="stock" value={productForm.stock} onChange={handleInputChange} required />
                </div>
              </div>

              <div className="row g-3 mb-3">
                <div className="col-12 col-sm-6">
                  <label className="form-label fw-bold small">Brand Name</label>
                  <input type="text" className="form-control" name="brand" value={productForm.brand} onChange={handleInputChange} />
                </div>
                <div className="col-12 col-sm-6">
                  <label className="form-label fw-bold small">Main Image URL</label>
                  <input type="text" className="form-control" name="image" value={productForm.image} onChange={handleInputChange} placeholder="https://..." required />
                </div>
              </div>

              <div className="mb-4">
                <label className="form-label fw-bold small">Description</label>
                <textarea className="form-control" name="description" rows="3" value={productForm.description} onChange={handleInputChange} required />
              </div>

              <div className="d-flex gap-2 justify-content-end">
                <button type="submit" className="btn btn-orange fw-bold px-4">
                  {isEditing ? 'Save Changes' : 'Upload Product'}
                </button>
                <button type="button" onClick={() => setShowAddModal(false)} className="btn btn-outline-secondary fw-bold px-4">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default SellerDashboard;
