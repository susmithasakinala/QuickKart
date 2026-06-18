import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { CartContext } from '../context/CartContext';
import { NotificationContext } from '../context/NotificationContext';
import { AuthContext } from '../context/AuthContext';
import { API_URL } from '../config';

function Checkout() {
  const { cart, clearCart } = useContext(CartContext);
  const { user } = useContext(AuthContext);
  const { triggerToast } = useContext(NotificationContext);
  const navigate = useNavigate();

  const activeItems = cart?.items?.filter(item => !item.savedForLater) || [];

  // Calculations
  const activeSubtotal = activeItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  const shippingCharge = activeSubtotal > 500 || activeSubtotal === 0 ? 0 : 40;
  const convenienceTax = Math.floor(activeSubtotal * 0.02);
  const totalAmount = activeSubtotal + shippingCharge + convenienceTax;

  // Address
  const [address, setAddress] = useState(user?.address || '');
  const [isEditingAddress, setIsEditingAddress] = useState(false);

  // Payment State
  const [paymentMethod, setPaymentMethod] = useState('UPI');
  const [upiId, setUpiId] = useState('');
  const [cardNum, setCardNum] = useState('');
  const [cardHolder, setCardHolder] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');
  const [netBank, setNetBank] = useState('SBI');

  const [loading, setLoading] = useState(false);

  const handlePlaceOrder = async () => {
    if (!address.trim()) {
      triggerToast('⚠️ Please enter a delivery address');
      return;
    }

    if (paymentMethod === 'UPI' && !upiId.includes('@')) {
      triggerToast('⚠️ Please enter a valid UPI ID (e.g. name@okhdfc)');
      return;
    }

    if ((paymentMethod === 'Credit Card' || paymentMethod === 'Debit Card') && (cardNum.length < 16 || cvv.length < 3)) {
      triggerToast('⚠️ Please verify card details');
      return;
    }

    setLoading(true);
    try {
      const orderData = {
        items: activeItems,
        totalAmount,
        shippingAddress: address,
        paymentMethod,
        couponApplied: ''
      };

      const res = await axios.post(`${API_URL}/api/orders`, orderData);
      triggerToast('🎉 Order placed successfully!');
      
      // Clear cart
      await clearCart();
      
      // Redirect to Confirmation Page
      navigate(`/buyer/orders?orderId=${res.data._id}`);
    } catch (err) {
      console.error(err);
      triggerToast(`❌ Error placing order: ${err.response?.data?.message || err.message}`);
    } finally {
      setLoading(false);
    }
  };

  if (activeItems.length === 0) {
    return (
      <div className="container py-5 text-center">
        <h4 className="fw-bold text-muted">No active items for checkout</h4>
        <button onClick={() => navigate('/buyer')} className="btn btn-green mt-3 fw-bold">Return Home</button>
      </div>
    );
  }

  return (
    <div className="container py-5">
      <h2 className="fw-extrabold mb-4">Secured Checkout</h2>

      <div className="row g-4">
        {/* Address and payment options */}
        <div className="col-12 col-lg-8">
          {/* Shipping address panel */}
          <div className="premium-card p-4 mb-4">
            <h4 className="fw-bold mb-3 border-bottom pb-2">1. Delivery Address</h4>
            {isEditingAddress ? (
              <div>
                <textarea 
                  className="form-control mb-3" 
                  rows="3" 
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Enter full shipping address..."
                />
                <button onClick={() => setIsEditingAddress(false)} className="btn btn-green btn-sm fw-bold">Save Address</button>
              </div>
            ) : (
              <div className="d-flex justify-content-between align-items-center">
                <p className="m-0 fw-semibold text-dark fs-5">{address || 'No shipping address provided.'}</p>
                <button onClick={() => setIsEditingAddress(true)} className="btn btn-sm btn-outline-green fw-bold">Edit</button>
              </div>
            )}
          </div>

          {/* Payment Methods */}
          <div className="premium-card p-4">
            <h4 className="fw-bold mb-4 border-bottom pb-2">2. Select Payment Method</h4>

            <div className="row g-3">
              {[
                { id: 'UPI', name: 'Unified Payments Interface (UPI)', icon: '📱' },
                { id: 'QR Code', name: 'QR Code Payment', icon: '🔲' },
                { id: 'Credit Card', name: 'Credit Card', icon: '💳' },
                { id: 'Debit Card', name: 'Debit Card', icon: '💳' },
                { id: 'Net Banking', name: 'Net Banking', icon: '🏦' },
                { id: 'Wallet', name: 'Digital Wallet (Paytm/PhonePe)', icon: '👛' },
                { id: 'Cash On Delivery', name: 'Cash On Delivery (COD)', icon: '💵' }
              ].map(method => (
                <div key={method.id} className="col-12">
                  <div 
                    onClick={() => setPaymentMethod(method.id)}
                    className="p-3 border rounded d-flex align-items-center justify-content-between"
                    style={{ 
                      cursor: 'pointer',
                      borderColor: paymentMethod === method.id ? '#2E7D32' : '#E2E8F0',
                      borderWidth: paymentMethod === method.id ? '2px' : '1px',
                      backgroundColor: paymentMethod === method.id ? 'rgba(46, 125, 50, 0.03)' : '#ffffff'
                    }}
                  >
                    <div className="d-flex align-items-center gap-3">
                      <span style={{ fontSize: '24px' }}>{method.icon}</span>
                      <span className="fw-bold">{method.name}</span>
                    </div>
                    <input 
                      type="radio" 
                      name="payment_opt" 
                      checked={paymentMethod === method.id} 
                      onChange={() => setPaymentMethod(method.id)} 
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Dynamic payment options body */}
            <div className="mt-4 p-4 border rounded bg-light">
              {paymentMethod === 'UPI' && (
                <div>
                  <h6 className="fw-bold mb-2">Enter UPI Address</h6>
                  <input 
                    type="text" 
                    className="form-control" 
                    placeholder="example@okhdfc" 
                    value={upiId}
                    onChange={(e) => setUpiId(e.target.value)}
                  />
                  <p className="text-muted small mt-2 fw-semibold">Instant verification available. Transaction will be authorized upon clicking Place Order.</p>
                </div>
              )}

              {paymentMethod === 'QR Code' && (
                <div className="text-center">
                  <h6 className="fw-bold mb-2">Scan QR Code to Pay</h6>
                  <div className="d-inline-block p-3 bg-white rounded shadow-sm mb-3">
                    {/* Generates a mock barcode QR */}
                    <img 
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=upi://pay?pa=quickkart@hdfcbank%26pn=QuickKart%26am=${totalAmount}%26cu=INR`} 
                      alt="UPI QR Payment" 
                      style={{ width: '180px', height: '180px' }} 
                    />
                  </div>
                  <p className="fw-bold text-dark m-0">Amount to Scan: ₹{totalAmount}</p>
                  <p className="text-muted small fw-semibold mt-1">Scan using Bhim, Paytm, GPay or PhonePe to process.</p>
                </div>
              )}

              {(paymentMethod === 'Credit Card' || paymentMethod === 'Debit Card') && (
                <div className="row g-3">
                  <div className="col-12">
                    <label className="form-label fw-bold small">Card Holder Name</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      placeholder="Name on card" 
                      value={cardHolder}
                      onChange={(e) => setCardHolder(e.target.value)}
                    />
                  </div>
                  <div className="col-12">
                    <label className="form-label fw-bold small">Card Number</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      placeholder="XXXX XXXX XXXX XXXX" 
                      maxLength="16"
                      value={cardNum}
                      onChange={(e) => setCardNum(e.target.value)}
                    />
                  </div>
                  <div className="col-6">
                    <label className="form-label fw-bold small">Expiry Date</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      placeholder="MM/YY" 
                      maxLength="5"
                      value={expiry}
                      onChange={(e) => setExpiry(e.target.value)}
                    />
                  </div>
                  <div className="col-6">
                    <label className="form-label fw-bold small">CVV</label>
                    <input 
                      type="password" 
                      className="form-control" 
                      placeholder="123" 
                      maxLength="3"
                      value={cvv}
                      onChange={(e) => setCvv(e.target.value)}
                    />
                  </div>
                </div>
              )}

              {paymentMethod === 'Net Banking' && (
                <div>
                  <h6 className="fw-bold mb-2">Select Your Bank</h6>
                  <select 
                    className="form-select" 
                    value={netBank} 
                    onChange={(e) => setNetBank(e.target.value)}
                  >
                    <option value="SBI">State Bank of India (SBI)</option>
                    <option value="HDFC">HDFC Bank</option>
                    <option value="ICICI">ICICI Bank</option>
                    <option value="AXIS">Axis Bank</option>
                    <option value="KOTAK">Kotak Mahindra Bank</option>
                  </select>
                </div>
              )}

              {paymentMethod === 'Wallet' && (
                <div>
                  <h6 className="fw-bold mb-2">Select Digital Wallet</h6>
                  <div className="d-flex gap-3">
                    <button className="btn btn-outline-secondary px-3 py-2 fw-bold flex-fill">Paytm</button>
                    <button className="btn btn-outline-secondary px-3 py-2 fw-bold flex-fill">PhonePe</button>
                    <button className="btn btn-outline-secondary px-3 py-2 fw-bold flex-fill">Amazon Pay</button>
                  </div>
                </div>
              )}

              {paymentMethod === 'Cash On Delivery' && (
                <div>
                  <h6 className="fw-bold text-success mb-2">💸 Cash on Delivery Selected</h6>
                  <p className="m-0 text-muted small fw-semibold">Pay in cash or UPI scan when the package arrives at your delivery location.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Pricing Summary Sidebar */}
        <div className="col-12 col-lg-4">
          <div className="premium-card p-4 position-sticky" style={{ top: '24px' }}>
            <h4 className="fw-bold mb-3 border-bottom pb-2">Order Summary</h4>

            <div className="d-flex flex-column gap-3 mb-4 max-height-md overflow-auto" style={{ maxHeight: '200px' }}>
              {activeItems.map(item => (
                <div key={item.productId} className="d-flex justify-content-between align-items-center gap-2">
                  <div className="d-flex align-items-center gap-2">
                    <img src={item.image} alt="" style={{ width: '40px', height: '40px', objectFit: 'cover' }} className="rounded" />
                    <div>
                      <h6 className="fw-bold text-truncate m-0" style={{ maxWidth: '160px', fontSize: '13px' }}>{item.name}</h6>
                      <span className="text-muted small fw-semibold">Qty: {item.quantity}</span>
                    </div>
                  </div>
                  <span className="fw-bold text-dark text-nowrap">₹{item.price * item.quantity}</span>
                </div>
              ))}
            </div>

            <div className="d-flex justify-content-between mb-2 small fw-bold">
              <span className="text-muted">Items Price</span>
              <span>₹{activeSubtotal}</span>
            </div>
            <div className="d-flex justify-content-between mb-2 small fw-bold">
              <span className="text-muted">Delivery</span>
              <span className={shippingCharge === 0 ? 'text-success' : ''}>
                {shippingCharge === 0 ? 'FREE' : `₹${shippingCharge}`}
              </span>
            </div>
            <div className="d-flex justify-content-between mb-3 small fw-bold border-bottom pb-3">
              <span className="text-muted">Convenience Fee (2%)</span>
              <span>₹{convenienceTax}</span>
            </div>

            <div className="d-flex justify-content-between align-items-center mb-4">
              <h5 className="fw-extrabold m-0">Final Payable</h5>
              <h4 className="fw-extrabold text-success m-0">₹{totalAmount}</h4>
            </div>

            <button 
              onClick={handlePlaceOrder}
              className="btn btn-green w-100 py-3 fs-5 fw-bold"
              disabled={loading}
            >
              {loading ? 'Processing Order...' : '🔒 Place Order'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Checkout;
