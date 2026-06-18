import React, { useState, useContext, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { NotificationContext } from '../context/NotificationContext';

function Login() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { login, register, user } = useContext(AuthContext);
  const { triggerToast } = useContext(NotificationContext);

  const initialRole = searchParams.get('role') || 'buyer';
  const [role, setRole] = useState(initialRole);
  const [isRegister, setIsRegister] = useState(false);

  // Form Fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [loadingForm, setLoadingForm] = useState(false);

  useEffect(() => {
    // Redirect if already logged in
    if (user) {
      if (user.role === 'admin') navigate('/admin');
      else if (user.role === 'seller') navigate('/seller');
      else navigate('/buyer');
    }
  }, [user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoadingForm(true);

    try {
      if (isRegister) {
        if (password !== confirmPassword) {
          triggerToast('❌ Passwords do not match!');
          setLoadingForm(false);
          return;
        }
        await register(name, email, password, role);
        triggerToast('🎉 Registration Successful! Please login to continue.');
        setIsRegister(false); // Toggle to Login mode
      } else {
        const loggedUser = await login(name, email, password, role);
        triggerToast(`👋 Welcome back, ${loggedUser.name}!`);
      }
    } catch (err) {
      triggerToast(`❌ ${err.message}`);
    } finally {
      setLoadingForm(false);
    }
  };

  const themeClass = role === 'buyer' ? 'green' : 'orange';
  const accentColor = role === 'buyer' ? '#2E7D32' : '#FF6B00';

  return (
    <div className="d-flex align-items-center justify-content-center px-3" style={{ minHeight: '100vh', backgroundColor: '#FFFFFF' }}>
      <div className="premium-card p-4 my-5 w-100" style={{ maxWidth: '450px', border: '1px solid #E5E7EB', borderRadius: '16px', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.05)' }}>
        {/* Toggle between Buyer/Seller */}
        <div className="d-flex justify-content-between mb-4 border-bottom pb-3">
          <button 
            type="button" 
            onClick={() => { setRole('buyer'); }}
            className={`btn btn-sm flex-fill me-2 py-2 fw-bold ${role === 'buyer' ? 'btn-green' : 'btn-light text-dark'}`}
            style={{ borderRadius: '10px' }}
          >
            🛒 Buyer Login
          </button>
          <button 
            type="button" 
            onClick={() => { setRole('seller'); }}
            className={`btn btn-sm flex-fill ms-2 py-2 fw-bold ${role === 'seller' ? 'btn-orange' : 'btn-light text-dark'}`}
            style={{ borderRadius: '10px' }}
          >
            📈 Seller Login
          </button>
        </div>

        <div className="text-center mb-4">
          <h2 className="fw-extrabold m-0 text-dark" style={{ fontSize: '28px' }}>
            {isRegister ? 'Register' : 'Login'}
          </h2>
          <p className="text-muted fw-semibold mt-1">
            {role === 'buyer' ? 'Buyer Workspace' : 'Seller Workspace'}
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Name Field */}
          <div className="mb-3">
            <label className="form-label fw-bold small text-dark">
              {isRegister ? 'Full Name' : 'Name'}
            </label>
            <input 
              type="text" 
              className="form-control" 
              value={name} 
              onChange={(e) => setName(e.target.value)} 
              placeholder={isRegister ? 'Enter full name' : 'Enter your name'} 
              required 
              style={{ borderRadius: '10px' }}
            />
          </div>

          {/* Email */}
          <div className="mb-3">
            <label className="form-label fw-bold small text-dark">Email Address</label>
            <input 
              type="email" 
              className="form-control" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              placeholder="name@example.com" 
              required 
              style={{ borderRadius: '10px' }}
            />
          </div>

          {/* Password */}
          <div className="mb-3">
            <label className="form-label fw-bold small text-dark">Password</label>
            <input 
              type="password" 
              className="form-control" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              placeholder="••••••••" 
              required 
              style={{ borderRadius: '10px' }}
            />
          </div>

          {isRegister && (
            /* Confirm Password */
            <div className="mb-4">
              <label className="form-label fw-bold small text-dark">Confirm Password</label>
              <input 
                type="password" 
                className="form-control" 
                value={confirmPassword} 
                onChange={(e) => setConfirmPassword(e.target.value)} 
                placeholder="••••••••" 
                required 
                style={{ borderRadius: '10px' }}
              />
            </div>
          )}

          {/* Submit Button */}
          <button 
            type="submit" 
            className={`btn w-100 py-3 fs-5 mb-3 fw-bold ${themeClass === 'green' ? 'btn-green' : 'btn-orange'}`}
            disabled={loadingForm}
            style={{ borderRadius: '10px' }}
          >
            {loadingForm ? (
              <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true" />
            ) : (
              isRegister ? 'Register' : 'Login'
            )}
          </button>
        </form>

        {/* Toggle Form Type */}
        <div className="text-center mt-3">
          <p className="m-0 text-muted small fw-bold">
            {isRegister ? 'Already have an account?' : "Don't have an account?"}{' '}
            <span 
              onClick={() => setIsRegister(!isRegister)} 
              className="fw-bold cursor-pointer"
              style={{ color: accentColor, cursor: 'pointer', textDecoration: 'underline' }}
            >
              {isRegister ? 'Login Here' : 'Register Here'}
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Login;