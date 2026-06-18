import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { NotificationContext } from '../context/NotificationContext';
import { RevenueChart, CategoryPieChart } from '../components/DashboardCharts';
import { API_URL } from '../config';

function AdminPanel() {
  const [users, setUsers] = useState([]);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('users');

  const { triggerToast } = useContext(NotificationContext);

  useEffect(() => {
    fetchAdminData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchAdminData = async () => {
    setLoading(true);
    try {
      // 1. Fetch Users
      const usersRes = await axios.get(`${API_URL}/api/admin/users`);
      setUsers(usersRes.data);

      // 2. Fetch Products
      const prodRes = await axios.get(`${API_URL}/api/admin/products`);
      setProducts(prodRes.data);

      // 3. Fetch Orders
      const orderRes = await axios.get(`${API_URL}/api/admin/orders`);
      setOrders(orderRes.data);

      // 4. Fetch Analytics
      const analRes = await axios.get(`${API_URL}/api/admin/analytics`);
      setAnalytics(analRes.data);
    } catch (err) {
      console.error('Error fetching admin workspace data:', err);
      triggerToast('❌ Error loading admin portal data');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleApproveSeller = async (userId) => {
    try {
      const res = await axios.post(`${API_URL}/api/admin/approve-seller/${userId}`);
      triggerToast(`👤 Seller status updated: ${res.data.user.approved ? 'Approved' : 'Suspended'}`);
      
      // Update local state
      setUsers(prev => prev.map(u => u._id === userId ? { ...u, approved: res.data.user.approved } : u));
      fetchAdminData(); // update stats
    } catch (err) {
      console.error(err);
      triggerToast('❌ Seller approval update failed');
    }
  };

  const handleDeleteProduct = async (productId) => {
    if (!window.confirm('Delete this product permanently?')) return;
    try {
      await axios.delete(`${API_URL}/api/admin/products/${productId}`);
      triggerToast('🗑️ Product removed from marketplace.');
      setProducts(prev => prev.filter(p => p._id !== productId));
      fetchAdminData();
    } catch (err) {
      console.error(err);
      triggerToast('❌ Product removal failed');
    }
  };

  const handleUpdateOrderStatus = async (orderId, targetStatus) => {
    try {
      await axios.put(`${API_URL}/api/orders/${orderId}/status`, { status: targetStatus });
      triggerToast(`📦 Order status updated to: ${targetStatus}`);
      setOrders(prev => prev.map(o => o._id === orderId ? { ...o, status: targetStatus } : o));
      fetchAdminData();
    } catch (err) {
      console.error(err);
      triggerToast('❌ Order status update failed');
    }
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '80vh' }}>
        <div className="spinner-border text-danger" role="status" style={{ width: '3rem', height: '3rem' }}>
          <span className="visually-hidden">Loading Admin Portal...</span>
        </div>
      </div>
    );
  }

  // Slicing categories for chart distribution
  const chartCategories = analytics?.categoryDistribution?.map(c => c._id) || [];
  const chartCounts = analytics?.categoryDistribution?.map(c => c.count) || [];

  return (
    <div className="container py-4">
      <h2 className="fw-extrabold mb-4">👑 Administrative Panel</h2>

      {/* Analytics indicators */}
      <div className="row g-3 mb-5">
        {[
          { title: 'Total Users', value: users.length, border: 'border-primary' },
          { title: 'Total Sellers', value: analytics?.sellersCount || 0, border: 'border-warning' },
          { title: 'Total Buyers', value: analytics?.buyersCount || 0, border: 'border-info' },
          { title: 'Marketplace Products', value: products.length, border: 'border-success' },
          { title: 'Total Orders', value: orders.length, border: 'border-secondary' },
          { title: 'Gross Revenue', value: `₹${analytics?.totalRevenue || 0}`, border: 'border-success' }
        ].map((card, idx) => (
          <div key={idx} className="col-6 col-md-4 col-lg-2">
            <div className={`premium-card p-3 border-start border-4 ${card.border}`}>
              <h6 className="text-muted small fw-bold text-uppercase mb-2" style={{ fontSize: '11px' }}>{card.title}</h6>
              <h4 className="fw-extrabold text-dark m-0">{card.value}</h4>
            </div>
          </div>
        ))}
      </div>

      {/* Graphs */}
      <div className="row g-4 mb-5">
        <div className="col-12 col-lg-7">
          <div className="premium-card p-4">
            <h5 className="fw-bold mb-3 border-bottom pb-2">Marketplace Revenue (₹)</h5>
            <RevenueChart 
              labels={['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun']} 
              values={[analytics?.totalRevenue * 0.1, analytics?.totalRevenue * 0.2, analytics?.totalRevenue * 0.4, analytics?.totalRevenue * 0.5, analytics?.totalRevenue * 0.7, analytics?.totalRevenue]} 
            />
          </div>
        </div>
        <div className="col-12 col-lg-5">
          <div className="premium-card p-4">
            <h5 className="fw-bold mb-3 border-bottom pb-2">Category Spread</h5>
            <CategoryPieChart labels={chartCategories} values={chartCounts} />
          </div>
        </div>
      </div>

      {/* Admin navigation tabs */}
      <div className="premium-card p-4">
        <div className="d-flex border-bottom pb-2 mb-4 gap-3">
          <button 
            onClick={() => setActiveTab('users')} 
            className={`btn btn-sm fw-bold ${activeTab === 'users' ? 'btn-green' : 'btn-light text-dark'}`}
          >
            👤 Users List ({users.length})
          </button>
          <button 
            onClick={() => setActiveTab('products')} 
            className={`btn btn-sm fw-bold ${activeTab === 'products' ? 'btn-green' : 'btn-light text-dark'}`}
          >
            📦 Products Catalog ({products.length})
          </button>
          <button 
            onClick={() => setActiveTab('orders')} 
            className={`btn btn-sm fw-bold ${activeTab === 'orders' ? 'btn-green' : 'btn-light text-dark'}`}
          >
            🛒 Orders List ({orders.length})
          </button>
        </div>

        {/* Tab 1: Users */}
        {activeTab === 'users' && (
          <div className="table-responsive">
            <table className="table align-middle">
              <thead>
                <tr>
                  <th className="fw-bold text-dark">Name</th>
                  <th className="fw-bold text-dark">Email</th>
                  <th className="fw-bold text-dark">Phone</th>
                  <th className="fw-bold text-dark">Role</th>
                  <th className="fw-bold text-dark">Status</th>
                  <th className="fw-bold text-dark text-end">Action</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u._id}>
                    <td className="fw-bold">{u.name}</td>
                    <td>{u.email}</td>
                    <td>{u.phone || 'N/A'}</td>
                    <td><span className={`badge bg-light text-dark fw-bold text-uppercase`}>{u.role}</span></td>
                    <td>
                      {u.role === 'seller' ? (
                        <span className={`badge ${u.approved ? 'bg-success' : 'bg-danger'}`}>
                          {u.approved ? 'Approved' : 'Pending Approval'}
                        </span>
                      ) : (
                        <span className="badge bg-success">Active</span>
                      )}
                    </td>
                    <td className="text-end">
                      {u.role === 'seller' && (
                        <button 
                          onClick={() => handleToggleApproveSeller(u._id)} 
                          className={`btn btn-sm fw-bold ${u.approved ? 'btn-outline-danger' : 'btn-outline-success'}`}
                        >
                          {u.approved ? 'Suspend Seller' : 'Approve Seller'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Tab 2: Products */}
        {activeTab === 'products' && (
          <div className="table-responsive">
            <table className="table align-middle">
              <thead>
                <tr>
                  <th className="fw-bold text-dark">Image</th>
                  <th className="fw-bold text-dark">Product Name</th>
                  <th className="fw-bold text-dark">Category</th>
                  <th className="fw-bold text-dark">Price (₹)</th>
                  <th className="fw-bold text-dark">Stock</th>
                  <th className="fw-bold text-dark">Seller Name</th>
                  <th className="fw-bold text-dark text-end">Action</th>
                </tr>
              </thead>
              <tbody>
                {products.map(p => (
                  <tr key={p._id}>
                    <td>
                      <img src={p.image} alt="" style={{ width: '40px', height: '40px', objectFit: 'cover' }} className="rounded" />
                    </td>
                    <td className="fw-bold">{p.name}</td>
                    <td><span className="badge bg-light text-dark fw-bold">{p.category}</span></td>
                    <td className="fw-bold">₹{p.price}</td>
                    <td>{p.stock}</td>
                    <td className="fw-bold text-muted">{p.sellerName}</td>
                    <td className="text-end">
                      <button onClick={() => handleDeleteProduct(p._id)} className="btn btn-sm btn-outline-danger fw-bold">Remove Product</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Tab 3: Orders */}
        {activeTab === 'orders' && (
          <div className="table-responsive">
            <table className="table align-middle">
              <thead>
                <tr>
                  <th className="fw-bold text-dark">Order ID</th>
                  <th className="fw-bold text-dark">Buyer Name</th>
                  <th className="fw-bold text-dark">Amount (₹)</th>
                  <th className="fw-bold text-dark">Status</th>
                  <th className="fw-bold text-dark">Shipping Address</th>
                  <th className="fw-bold text-dark text-end">Update Status</th>
                </tr>
              </thead>
              <tbody>
                {orders.map(o => (
                  <tr key={o._id}>
                    <td className="fw-bold text-muted small">#{o._id.substring(18)}</td>
                    <td className="fw-bold">{o.buyerName}</td>
                    <td className="fw-bold text-success">₹{o.totalAmount}</td>
                    <td>
                      <span className={`badge rounded-pill ${o.status === 'Delivered' ? 'bg-success' : o.status === 'Cancelled' ? 'bg-secondary' : 'bg-warning text-dark'}`}>
                        {o.status}
                      </span>
                    </td>
                    <td className="small text-muted">{o.shippingAddress}</td>
                    <td className="text-end">
                      {o.status !== 'Delivered' && o.status !== 'Cancelled' && (
                        <select 
                          className="form-select form-select-sm w-auto d-inline-block fw-bold"
                          value={o.status}
                          onChange={(e) => handleUpdateOrderStatus(o._id, e.target.value)}
                        >
                          <option value="Order Placed">Order Placed</option>
                          <option value="Confirmed">Confirmed</option>
                          <option value="Packed">Packed</option>
                          <option value="Shipped">Shipped</option>
                          <option value="Out For Delivery">Out For Delivery</option>
                          <option value="Delivered">Delivered</option>
                        </select>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminPanel;
