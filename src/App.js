import React, { useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import './App.css';

import Navbar from './components/Navbar';
import SplashScreen from './pages/SplashScreen';
import LoginSelection from './pages/LoginSelection';
import Login from './pages/Login';
import Home from './pages/Home';
import Products from './pages/Products';
import ProductDetail from './pages/ProductDetail';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import Orders from './pages/Orders';
import Wishlist from './pages/Wishlist';
import Profile from './pages/Profile';
import SellerDashboard from './pages/SellerDashboard';
import AdminPanel from './pages/AdminPanel';

import { AuthContext } from './context/AuthContext';

// Generic Protected Route for any authenticated user
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useContext(AuthContext);
  if (loading) return null;
  if (!user) return <Navigate to="/login-select" />;
  return children;
};

// Protected Route for Buyers
const BuyerRoute = ({ children }) => {
  const { user, loading } = useContext(AuthContext);
  if (loading) return null;
  if (!user || user.role !== 'buyer') return <Navigate to="/login-select" />;
  return children;
};

// Protected Route for Sellers
const SellerRoute = ({ children }) => {
  const { user, loading } = useContext(AuthContext);
  if (loading) return null;
  if (!user || user.role !== 'seller') return <Navigate to="/login-select" />;
  return children;
};

// Protected Route for Admins
const AdminRoute = ({ children }) => {
  const { user, loading } = useContext(AuthContext);
  if (loading) return null;
  if (!user || user.role !== 'admin') return <Navigate to="/login-select" />;
  return children;
};

// App Content wrapper to allow using location hooks
function AppContent() {
  const location = useLocation();
  const hideNavbar = ['/', '/login-select'].includes(location.pathname);

  return (
    <>
      {!hideNavbar && <Navbar />}
      <Routes>
        {/* Public Landing & Splash Pages */}
        <Route path="/" element={<SplashScreen />} />
        <Route path="/login-select" element={<LoginSelection />} />
        <Route path="/login" element={<Login />} />

        {/* Protected Buyer Routes */}
        <Route path="/buyer" element={<BuyerRoute><Home /></BuyerRoute>} />
        <Route path="/buyer/catalog" element={<BuyerRoute><Products /></BuyerRoute>} />
        <Route path="/buyer/product/:id" element={<BuyerRoute><ProductDetail /></BuyerRoute>} />
        <Route path="/buyer/cart" element={<BuyerRoute><Cart /></BuyerRoute>} />
        <Route path="/buyer/checkout" element={<BuyerRoute><Checkout /></BuyerRoute>} />
        <Route path="/buyer/orders" element={<BuyerRoute><Orders /></BuyerRoute>} />
        <Route path="/buyer/wishlist" element={<BuyerRoute><Wishlist /></BuyerRoute>} />
        <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />

        {/* Protected Seller Routes */}
        <Route path="/seller" element={<SellerRoute><SellerDashboard /></SellerRoute>} />

        {/* Protected Admin Routes */}
        <Route path="/admin" element={<AdminRoute><AdminPanel /></AdminRoute>} />

        {/* Fallback Catch All */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </>
  );
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;