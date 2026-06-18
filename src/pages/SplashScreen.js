import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function SplashScreen() {
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => {
      navigate('/login-select');
    }, 2000);
    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="d-flex flex-column align-items-center justify-content-center" style={{ height: '100vh', backgroundColor: '#222222', color: '#ffffff' }}>
      <div className="text-center animate-pulse">
        {/* QuickKart Premium Logo */}
        <div className="d-flex align-items-center justify-content-center mb-3">
          <span style={{ fontSize: '70px', marginRight: '10px' }}>🛒</span>
          <h1 className="m-0" style={{ fontSize: '60px', fontWeight: '800', letterSpacing: '-2px' }}>
            <span style={{ color: '#FF6B00' }}>Quick</span>
            <span style={{ color: '#2E7D32' }}>Kart</span>
          </h1>
        </div>
        <p style={{ fontSize: '20px', fontWeight: '600', color: '#cccccc', letterSpacing: '2px', textTransform: 'uppercase' }}>
          Shop Smart, Shop Fast!
        </p>
      </div>

      {/* Loading Spinner */}
      <div className="mt-5">
        <div className="spinner-border" role="status" style={{ width: '3.5rem', height: '3.5rem', color: '#FF6B00', borderWidth: '5px' }}>
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    </div>
  );
}

export default SplashScreen;
