import React, { useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { CartContext } from '../context/CartContext';
import { NotificationContext } from '../context/NotificationContext';

const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1531403009284-440f080d1e12?w=600&auto=format&fit=crop';

function Cart() {
  const { cart, updateQuantity, toggleSaveForLater, removeFromCart } = useContext(CartContext);
  const { triggerToast } = useContext(NotificationContext);
  const navigate = useNavigate();

  const activeItems = cart?.items?.filter(item => !item.savedForLater) || [];
  const savedItems = cart?.items?.filter(item => item.savedForLater) || [];

  // Calculation details
  const activeSubtotal = activeItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  const shippingCharge = activeSubtotal > 500 || activeSubtotal === 0 ? 0 : 40;
  const convenienceTax = Math.floor(activeSubtotal * 0.02); // 2% convenience tax
  const totalAmount = activeSubtotal + shippingCharge + convenienceTax;

  const handleQtyChange = (productId, qty) => {
    if (qty < 1) return;
    updateQuantity(productId, qty);
  };

  const handleCheckout = () => {
    if (activeItems.length === 0) {
      triggerToast('⚠️ Your active cart is empty!');
      return;
    }
    navigate('/buyer/checkout');
  };

  const handleToggleSaveLater = (productId, saveState) => {
    toggleSaveForLater(productId, saveState);
    triggerToast(saveState ? '💾 Item shelved to Save for Later!' : '🛒 Item moved back to Active Cart!');
  };

  const handleRemove = (productId) => {
    removeFromCart(productId);
    triggerToast('🗑️ Item removed from cart.');
  };

  return (
    <div className="container py-5">
      <h2 className="fw-extrabold mb-4">Shopping Cart</h2>

      <div className="row g-4">
        {/* Cart items list */}
        <div className="col-12 col-lg-8">
          <div className="premium-card p-4 mb-4">
            <h4 className="fw-bold mb-3 border-bottom pb-2">Active Items ({activeItems.length})</h4>
            {activeItems.length === 0 ? (
              <div className="text-center py-5 text-muted">
                <span style={{ fontSize: '48px' }}>🛒</span>
                <h5 className="fw-bold mt-3">Your active shopping cart is empty</h5>
                <p className="small mb-4">Explore our catalog and find the best items for you.</p>
                <Link to="/buyer/catalog" className="btn btn-green fw-bold">Shop Catalog</Link>
              </div>
            ) : (
              <div className="d-flex flex-column gap-3">
                {activeItems.map(item => (
                  <div key={item.productId} className="row align-items-center g-3 border-bottom pb-3">
                    <div className="col-3 col-sm-2">
                      <img src={item.image} alt={item.name} className="img-fluid rounded" style={{ height: '70px', objectFit: 'cover' }} onError={(e) => { e.target.onerror = null; e.target.src = FALLBACK_IMAGE; }} />
                    </div>
                    <div className="col-9 col-sm-5">
                      <h6 className="fw-bold mb-1">{item.name}</h6>
                      <p className="text-success fw-bold m-0">₹{item.price}</p>
                    </div>
                    <div className="col-6 col-sm-3 d-flex align-items-center justify-content-start justify-content-sm-center">
                      <button 
                        onClick={() => handleQtyChange(item.productId, item.quantity - 1)}
                        className="btn btn-sm btn-outline-secondary px-2 fw-bold"
                      >
                        -
                      </button>
                      <span className="mx-3 fw-bold">{item.quantity}</span>
                      <button 
                        onClick={() => handleQtyChange(item.productId, item.quantity + 1)}
                        className="btn btn-sm btn-outline-secondary px-2 fw-bold"
                      >
                        +
                      </button>
                    </div>
                    <div className="col-6 col-sm-2 text-end">
                      <button 
                        onClick={() => handleToggleSaveLater(item.productId, true)}
                        className="btn btn-sm btn-link text-decoration-none fw-semibold p-0 block mb-1 text-primary"
                        style={{ fontSize: '13px' }}
                      >
                        Save for Later
                      </button>
                      <button 
                        onClick={() => handleRemove(item.productId)}
                        className="btn btn-sm btn-link text-decoration-none fw-semibold p-0 block text-danger"
                        style={{ fontSize: '13px' }}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Saved for Later Section */}
          <div className="premium-card p-4">
            <h4 className="fw-bold mb-3 border-bottom pb-2">Saved for Later ({savedItems.length})</h4>
            {savedItems.length === 0 ? (
              <p className="text-muted small fw-bold m-0 py-3">No shelved items.</p>
            ) : (
              <div className="d-flex flex-column gap-3">
                {savedItems.map(item => (
                  <div key={item.productId} className="row align-items-center g-3 border-bottom pb-3">
                    <div className="col-3 col-sm-2">
                      <img src={item.image} alt={item.name} className="img-fluid rounded" style={{ height: '70px', objectFit: 'cover' }} onError={(e) => { e.target.onerror = null; e.target.src = FALLBACK_IMAGE; }} />
                    </div>
                    <div className="col-9 col-sm-6">
                      <h6 className="fw-bold mb-1 text-muted">{item.name}</h6>
                      <p className="text-success fw-bold m-0">₹{item.price}</p>
                    </div>
                    <div className="col-12 col-sm-4 text-end">
                      <button 
                        onClick={() => handleToggleSaveLater(item.productId, false)}
                        className="btn btn-sm btn-outline-green me-2 py-1.5 fw-bold"
                      >
                        Move to Cart
                      </button>
                      <button 
                        onClick={() => handleRemove(item.productId)}
                        className="btn btn-sm btn-outline-danger py-1.5 fw-bold"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Pricing Summary Side Card */}
        <div className="col-12 col-lg-4">
          <div className="premium-card p-4">
            <h4 className="fw-bold mb-3 border-bottom pb-2">Price Details</h4>
            
            <div className="d-flex justify-content-between mb-2 small fw-bold">
              <span className="text-muted">Price ({activeItems.length} items)</span>
              <span>₹{activeSubtotal}</span>
            </div>
            <div className="d-flex justify-content-between mb-2 small fw-bold">
              <span className="text-muted">Delivery Charges</span>
              <span className={shippingCharge === 0 ? 'text-success' : ''}>
                {shippingCharge === 0 ? 'FREE' : `₹${shippingCharge}`}
              </span>
            </div>
            <div className="d-flex justify-content-between mb-3 small fw-bold border-bottom pb-3">
              <span className="text-muted">Convenience Tax (2%)</span>
              <span>₹{convenienceTax}</span>
            </div>

            <div className="d-flex justify-content-between align-items-center mb-4">
              <h5 className="fw-extrabold m-0">Total Amount</h5>
              <h4 className="fw-extrabold text-success m-0">₹{totalAmount}</h4>
            </div>

            <button 
              onClick={handleCheckout} 
              className="btn btn-green w-100 py-3 fs-5 fw-bold"
              disabled={activeItems.length === 0}
            >
              🔒 Proceed to Checkout
            </button>
            
            {activeSubtotal > 0 && activeSubtotal < 500 && (
              <p className="text-center text-muted small mt-3 fw-semibold mb-0">
                Add <b>₹{500 - activeSubtotal}</b> more for free shipping!
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Cart;