import React, { useState, useEffect, useContext } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import axios from 'axios';
import { NotificationContext } from '../context/NotificationContext';
import { API_URL } from '../config';

const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1531403009284-440f080d1e12?w=600&auto=format&fit=crop';

const TIMELINE_STEPS = [
  'Order Placed',
  'Confirmed',
  'Packed',
  'Shipped',
  'Out For Delivery',
  'Delivered'
];

function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchParams] = useSearchParams();
  const highlightOrderId = searchParams.get('orderId');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [lastViewed, setLastViewed] = useState([]);

  const { triggerToast } = useContext(NotificationContext);

  useEffect(() => {
    fetchOrders();
    // Load last viewed products from localStorage
    const saved = localStorage.getItem('last_viewed_products');
    if (saved) {
      setLastViewed(JSON.parse(saved));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchOrders = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/orders/mine`);
      setOrders(res.data);
      
      // If orderId is in query, select that order for tracking
      if (highlightOrderId && res.data.length > 0) {
        const found = res.data.find(o => o._id === highlightOrderId);
        if (found) setSelectedOrder(found);
      } else if (res.data.length > 0) {
        setSelectedOrder(res.data[0]); // default to latest
      }
    } catch (err) {
      console.error('Error fetching orders:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelOrder = async (orderId) => {
    if (!window.confirm('Are you sure you want to cancel this order?')) return;

    try {
      // We can update status to a mock "Cancelled" state, or call backend status update.
      await axios.put(`${API_URL}/api/orders/${orderId}/status`, { status: 'Cancelled' });
      triggerToast('🚫 Order cancelled successfully.');
      fetchOrders();
      setSelectedOrder(null);
    } catch (err) {
      console.error(err);
      triggerToast('❌ Error cancelling order.');
    }
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '80vh' }}>
        <div className="spinner-border text-success" role="status" style={{ width: '3rem', height: '3rem' }}>
          <span className="visually-hidden">Loading orders...</span>
        </div>
      </div>
    );
  }

  // Analytics helper variables
  const totalOrders = orders.length;
  const lastOrder = orders[0] || null;
  const activeOrdersCount = orders.filter(o => o.status !== 'Delivered' && o.status !== 'Cancelled').length;

  const getTimelineStepIndex = (status) => {
    return TIMELINE_STEPS.indexOf(status);
  };

  const currentStepIdx = selectedOrder ? getTimelineStepIndex(selectedOrder.status) : -1;

  return (
    <div className="container py-5">
      <h2 className="fw-extrabold mb-4">My Orders</h2>

      {/* Orders Analytics Header cards */}
      <div className="row g-3 mb-5">
        <div className="col-12 col-sm-4">
          <div className="premium-card p-4 analytics-card text-center">
            <h6 className="text-muted small fw-bold text-uppercase mb-2">Total Orders</h6>
            <h2 className="fw-extrabold text-success m-0">{totalOrders}</h2>
          </div>
        </div>
        <div className="col-12 col-sm-4">
          <div className="premium-card p-4 analytics-card orange text-center">
            <h6 className="text-muted small fw-bold text-uppercase mb-2">Active Shipments</h6>
            <h2 className="fw-extrabold text-success m-0">{activeOrdersCount}</h2>
          </div>
        </div>
        <div className="col-12 col-sm-4">
          <div className="premium-card p-4 analytics-card dark text-center">
            <h6 className="text-muted small fw-bold text-uppercase mb-2">Last Order Total</h6>
            <h2 className="fw-extrabold text-success m-0">₹{lastOrder ? lastOrder.totalAmount : 0}</h2>
          </div>
        </div>
      </div>

      <div className="row g-4">
        {/* Left Side: Order History */}
        <div className="col-12 col-lg-5">
          <div className="premium-card p-4">
            <h4 className="fw-bold mb-3 border-bottom pb-2">Order History</h4>
            {orders.length === 0 ? (
              <p className="text-muted small fw-bold py-4 text-center">No orders found.</p>
            ) : (
              <div className="d-flex flex-column gap-3" style={{ maxHeight: '500px', overflowY: 'auto' }}>
                {orders.map(order => (
                  <div 
                    key={order._id}
                    onClick={() => setSelectedOrder(order)}
                    className={`p-3 border rounded cursor-pointer transition-all ${selectedOrder?._id === order._id ? 'border-success bg-light' : 'border-light'}`}
                    style={{ cursor: 'pointer', transition: 'all 0.2s ease' }}
                  >
                    <div className="d-flex justify-content-between align-items-center mb-1">
                      <span className="fw-bold small text-muted">ID: #{order._id.substring(18)}</span>
                      <span className={`badge rounded-pill ${order.status === 'Delivered' ? 'bg-success' : order.status === 'Cancelled' ? 'bg-secondary' : 'bg-warning text-dark'}`}>
                        {order.status}
                      </span>
                    </div>
                    <p className="m-0 fw-bold small text-dark mb-1">
                      Date: {new Date(order.createdAt).toLocaleDateString()}
                    </p>
                    <div className="d-flex justify-content-between align-items-center mt-2">
                      <span className="small text-muted">{order.items.length} items</span>
                      <span className="fw-bold text-success">₹{order.totalAmount}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Tracking details */}
        <div className="col-12 col-lg-7">
          {selectedOrder ? (
            <div className="premium-card p-4">
              <h4 className="fw-bold mb-3 border-bottom pb-2">Track Shipment</h4>
              
              <div className="mb-4">
                <p className="small text-muted fw-bold mb-1">ORDER ID</p>
                <h6 className="fw-bold text-dark">{selectedOrder._id}</h6>
                
                <div className="row mt-3">
                  <div className="col-6">
                    <p className="small text-muted fw-bold mb-1">PAYMENT TYPE</p>
                    <h6 className="fw-bold text-dark">{selectedOrder.paymentMethod}</h6>
                  </div>
                  <div className="col-6">
                    <p className="small text-muted fw-bold mb-1">PAYMENT STATUS</p>
                    <h6 className={`fw-bold ${selectedOrder.paymentStatus === 'Paid' ? 'text-success' : 'text-danger'}`}>
                      {selectedOrder.paymentStatus}
                    </h6>
                  </div>
                </div>
              </div>

              {selectedOrder.status === 'Cancelled' ? (
                <div className="alert alert-secondary text-center p-4 fw-bold">
                  ❌ This order has been cancelled.
                </div>
              ) : (
                /* Order tracking timeline progress bar */
                <div className="my-5">
                  <div className="tracking-timeline">
                    <div 
                      className="timeline-progress-bar" 
                      style={{ width: `${(currentStepIdx / (TIMELINE_STEPS.length - 1)) * 100}%` }}
                    />
                    {TIMELINE_STEPS.map((step, idx) => {
                      const isActiveStep = idx <= currentStepIdx;
                      const isCurrentStep = idx === currentStepIdx;
                      return (
                        <div 
                          key={step} 
                          className={`tracking-step ${isCurrentStep ? 'active' : ''} ${isActiveStep ? 'completed' : ''}`}
                        >
                          <div className="tracking-step-dot" />
                          <span className="tracking-step-title d-none d-sm-block">{step}</span>
                        </div>
                      );
                    })}
                  </div>
                  <div className="text-center mt-3 d-sm-none">
                    <span className="badge bg-green text-white p-2">Status: <b>{selectedOrder.status}</b></span>
                  </div>
                </div>
              )}

              {/* Items Summary list */}
              <div className="mb-4">
                <h5 className="fw-bold mb-3">Shipment Items</h5>
                <div className="d-flex flex-column gap-2 border-bottom pb-3">
                  {selectedOrder.items.map(item => (
                    <div key={item.productId} className="d-flex justify-content-between align-items-center">
                      <div className="d-flex align-items-center gap-3">
                        <img src={item.image} alt="" style={{ width: '40px', height: '40px', objectFit: 'cover' }} className="rounded" onError={(e) => { e.target.onerror = null; e.target.src = FALLBACK_IMAGE; }} />
                        <div>
                          <h6 className="fw-bold m-0" style={{ fontSize: '14px' }}>{item.name}</h6>
                          <span className="text-muted small fw-semibold">Quantity: {item.quantity}</span>
                        </div>
                      </div>
                      <span className="fw-bold">₹{item.price * item.quantity}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <p className="small text-muted fw-bold mb-1">SHIPPING ADDRESS</p>
                  <p className="m-0 small text-dark fw-semibold">{selectedOrder.shippingAddress}</p>
                </div>
                {(selectedOrder.status === 'Order Placed' || selectedOrder.status === 'Confirmed') && (
                  <button 
                    onClick={() => handleCancelOrder(selectedOrder._id)} 
                    className="btn btn-outline-danger fw-bold"
                  >
                    Cancel Order
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="premium-card p-5 text-center text-muted">
              Select an order on the left to track its real-time shipping timeline.
            </div>
          )}
        </div>
      </div>

      {/* Last Viewed Products Carousel */}
      {lastViewed.length > 0 && (
        <div className="mt-5 pt-4">
          <h4 className="fw-bold mb-3">Recently Viewed Products</h4>
          <div className="row g-3">
            {lastViewed.slice(0, 4).map(item => (
              <div key={item._id} className="col-6 col-md-3">
                <div className="premium-card p-3 h-100 d-flex flex-column justify-content-between">
                  <div className="text-center mb-2" style={{ height: '100px', overflow: 'hidden' }}>
                    <img src={item.image} alt="" className="img-fluid rounded" style={{ height: '100px', objectFit: 'contain' }} />
                  </div>
                  <div>
                    <h6 className="fw-bold mb-1 text-truncate" style={{ fontSize: '14px' }}>
                      <Link to={`/buyer/product/${item._id}`} className="text-decoration-none text-dark">{item.name}</Link>
                    </h6>
                    <span className="fw-bold text-success">₹{item.price}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default Orders;
