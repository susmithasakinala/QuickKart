import React, { useContext, useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { CartContext } from '../context/CartContext';
import { NotificationContext } from '../context/NotificationContext';
import { API_URL } from '../config';
const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1531403009284-440f080d1e12?w=600&auto=format&fit=crop';

function Navbar() {
  const { user, logout, switchRole } = useContext(AuthContext);
  const { cart } = useContext(CartContext);
  const { notifications, markAsRead, markAllAsRead, clearAllNotifications } = useContext(NotificationContext);
  const navigate = useNavigate();
  const location = useLocation();

  // Search autocomplete states
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const autocompleteRef = useRef(null);

  useEffect(() => {
    // Click outside handler for suggestions box
    function handleClickOutside(event) {
      if (autocompleteRef.current && !autocompleteRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login-select');
  };

  const handleRoleSwitch = async () => {
    if (!user) return;
    const targetRole = user.role === 'buyer' ? 'seller' : 'buyer';
    try {
      await switchRole(targetRole);
      navigate(targetRole === 'buyer' ? '/buyer' : '/seller');
    } catch (err) {
      console.error(err);
    }
  };

  const handleSearchChange = async (e) => {
    const val = e.target.value;
    setSearchQuery(val);
    if (val.trim().length > 1) {
      try {
        const res = await axios.get(`${API_URL}/api/products/suggestions?q=${val}`);
        setSuggestions(res.data);
        setShowSuggestions(true);
      } catch (err) {
        console.error('Error fetching search autocomplete:', err);
      }
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setShowSuggestions(false);
      navigate(`/buyer/catalog?search=${searchQuery}`);
    }
  };

  const handleSuggestionClick = (prodId) => {
    setShowSuggestions(false);
    setSearchQuery('');
    navigate(`/buyer/product/${prodId}`);
  };

  const activeCartCount = cart?.items?.filter(item => !item.savedForLater).reduce((acc, item) => acc + item.quantity, 0) || 0;
  const unreadNotifications = notifications?.filter(n => !n.read).length || 0;

  const isActive = (path) => location.pathname === path ? 'active' : '';

  return (
    <nav className="navbar navbar-expand-lg navbar-light custom-navbar px-4">
      <div className="container-fluid p-0">
        <Link className="navbar-brand d-flex align-items-center" to="/">
          <span style={{ fontSize: '28px', marginRight: '6px' }}>🛒</span>
          <span style={{ color: '#FF6B00', fontWeight: '800' }}>Quick</span>
          <span style={{ color: '#2E7D32', fontWeight: '800' }}>Kart</span>
        </Link>

        {/* Search autocomplete bar (Visible for Buyers) */}
        {user && user.role === 'buyer' && (
          <div ref={autocompleteRef} className="position-relative ms-lg-4 me-lg-auto my-2 my-lg-0 w-100 max-width-md" style={{ maxWidth: '400px' }}>
            <form onSubmit={handleSearchSubmit} className="d-flex">
              <input 
                type="text" 
                className="form-control" 
                placeholder="Search TV, Lipstick, Kurti, Lehenga, Speaker..." 
                value={searchQuery}
                onChange={handleSearchChange}
                onFocus={() => searchQuery.trim().length > 1 && setShowSuggestions(true)}
              />
            </form>
            {showSuggestions && suggestions.length > 0 && (
              <div 
                className="position-absolute top-100 start-0 w-100 mt-1 shadow-lg p-2 border-0 glass-panel"
                style={{ zIndex: 1000, maxH: '300px', overflowY: 'auto' }}
              >
                {suggestions.map(item => (
                  <div 
                    key={item._id}
                    onClick={() => handleSuggestionClick(item._id)}
                    className="p-2 d-flex align-items-center gap-3 cursor-pointer rounded hover-bg-light"
                    style={{ cursor: 'pointer', transition: 'background-color 0.2s' }}
                  >
                    <img src={item.image} alt="" style={{ width: '30px', height: '30px', objectFit: 'cover' }} className="rounded" onError={(e) => { e.target.onerror = null; e.target.src = FALLBACK_IMAGE; }} />
                    <div>
                      <h6 className="m-0 text-dark fw-bold small text-truncate" style={{ maxWidth: '300px' }}>{item.name}</h6>
                      <span className="text-success small fw-bold">₹{item.price}</span>
                      <span className="text-muted small ms-2 fw-semibold">in {item.category}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <button className="navbar-toggler border-0" type="button" data-bs-toggle="collapse" data-bs-target="#navMenu">
          <span className="navbar-toggler-icon"></span>
        </button>

        <div className="collapse navbar-collapse" id="navMenu">
          <ul className="navbar-nav ms-auto align-items-center gap-2 mt-2 mt-lg-0">
            {user ? (
              <>
                {user.role === 'buyer' && (
                  <>
                    <li className="nav-item">
                      <Link className={`nav-link ${isActive('/buyer')}`} to="/buyer">Home</Link>
                    </li>
                    <li className="nav-item">
                      <Link className={`nav-link ${isActive('/buyer/catalog')}`} to="/buyer/catalog">Catalog</Link>
                    </li>
                    <li className="nav-item">
                      <Link className={`nav-link ${isActive('/buyer/wishlist')}`} to="/buyer/wishlist">Wishlist</Link>
                    </li>
                    <li className="nav-item">
                      <Link className={`nav-link ${isActive('/buyer/orders')}`} to="/buyer/orders">Orders</Link>
                    </li>
                    <li className="nav-item">
                      <Link className={`nav-link ${isActive('/buyer/cart')} position-relative`} to="/buyer/cart">
                        🛒 Cart
                        {activeCartCount > 0 && <span className="cart-badge">{activeCartCount}</span>}
                      </Link>
                    </li>
                  </>
                )}

                {user.role === 'seller' && (
                  <>
                    <li className="nav-item">
                      <Link className={`nav-link ${isActive('/seller')}`} to="/seller">Dashboard</Link>
                    </li>
                    <li className="nav-item">
                      <span className="badge bg-warning text-dark px-2.5 py-1.5 fw-bold rounded-pill">
                        Seller Mode
                      </span>
                    </li>
                  </>
                )}

                {user.role === 'admin' && (
                  <>
                    <li className="nav-item">
                      <Link className={`nav-link ${isActive('/admin')}`} to="/admin">Admin Panel</Link>
                    </li>
                  </>
                )}

                {/* Fully Functional Notifications Dropdown */}
                <li className="nav-item dropdown mx-1">
                  {/* eslint-disable-next-line jsx-a11y/anchor-is-valid */}
                  <a className="nav-link dropdown-toggle position-relative" href="#" role="button" data-bs-toggle="dropdown" style={{ textDecoration: 'none' }}>
                    🔔
                    {unreadNotifications > 0 && (
                      <span className="position-absolute top-1 start-100 translate-middle badge rounded-pill bg-danger" style={{ fontSize: '9px' }}>
                        {unreadNotifications}
                      </span>
                    )}
                  </a>
                  <ul className="dropdown-menu dropdown-menu-end p-2 border-0 shadow-lg glass-panel" style={{ width: '300px', maxHeight: '400px', overflowY: 'auto' }}>
                    <div className="d-flex justify-content-between align-items-center dropdown-header fw-bold text-dark border-bottom pb-2 mb-2">
                      <span className="fs-6">Notifications</span>
                      <div className="d-flex gap-2">
                        <button onClick={markAllAsRead} className="btn btn-sm btn-link text-decoration-none fw-bold p-0 text-primary small" style={{ fontSize: '11px' }}>
                          Read All
                        </button>
                        <button onClick={clearAllNotifications} className="btn btn-sm btn-link text-decoration-none fw-bold p-0 text-danger small" style={{ fontSize: '11px' }}>
                          Clear All
                        </button>
                      </div>
                    </div>
                    {notifications.length === 0 ? (
                      <li className="text-center py-4 text-muted small fw-bold">No notifications yet.</li>
                    ) : (
                      notifications.map(n => (
                        <li 
                          key={n._id} 
                          onClick={() => !n.read && markAsRead(n._id)}
                          className={`dropdown-item text-wrap small rounded mb-1 p-2 ${!n.read ? 'bg-light fw-bold border-start border-success border-3' : 'text-muted'}`}
                          style={{ cursor: 'pointer', whiteSpace: 'normal' }}
                        >
                          {n.message}
                          <div className="text-end" style={{ fontSize: '9px', color: '#aaa', marginTop: '4px' }}>
                            {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </li>
                      ))
                    )}
                  </ul>
                </li>

                {/* Switch Role Button */}
                {(user.role === 'buyer' || user.role === 'seller') && (
                  <li className="nav-item">
                    <button onClick={handleRoleSwitch} className="btn btn-sm btn-outline-green px-3 py-1.5 fw-bold text-dark border-success">
                      {user.role === 'buyer' ? '🔄 Seller Account' : '🔄 Buyer Account'}
                    </button>
                  </li>
                )}

                {/* User Dropdown */}
                <li className="nav-item dropdown ms-2">
                  {/* eslint-disable-next-line jsx-a11y/anchor-is-valid */}
                  <a className="nav-link dropdown-toggle d-flex align-items-center gap-2" href="#" role="button" data-bs-toggle="dropdown" style={{ textDecoration: 'none' }}>
                    <img 
                      src={user.profileImage} 
                      alt={user.name} 
                      className="rounded-circle border border-success" 
                      style={{ width: '30px', height: '30px', objectFit: 'cover' }} 
                      onError={(e) => { e.target.onerror = null; e.target.src = 'https://cdn-icons-png.flaticon.com/512/149/149071.png'; }}
                    />
                    <span className="fw-semibold text-dark small">{user.name.split(' ')[0]}</span>
                  </a>
                  <ul className="dropdown-menu dropdown-menu-end border-0 shadow-lg rounded-3">
                    <li><Link className="dropdown-item fw-semibold text-dark" to="/profile">My Profile</Link></li>
                    <li><hr className="dropdown-divider" /></li>
                    <li>
                      <button onClick={handleLogout} className="dropdown-item fw-semibold text-danger">
                        Logout
                      </button>
                    </li>
                  </ul>
                </li>
              </>
            ) : (
              <li className="nav-item">
                <Link className="btn btn-green px-4" to="/login-select">Login</Link>
              </li>
            )}
          </ul>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;