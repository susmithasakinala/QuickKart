import React from 'react';
import { useNavigate } from 'react-router-dom';

function LoginSelection() {
  const navigate = useNavigate();

  const handleSelectRole = (role) => {
    navigate(`/login?role=${role}`);
  };

  return (
    <div className="d-flex flex-column align-items-center justify-content-center px-3" style={{ minHeight: '100vh', backgroundColor: '#F5F7FA' }}>
      <div className="text-center mb-5">
        <div className="d-flex align-items-center justify-content-center mb-2">
          <span style={{ fontSize: '48px', marginRight: '10px' }}>🛒</span>
          <h1 className="m-0" style={{ fontSize: '42px', fontWeight: '800' }}>
            <span style={{ color: '#FF6B00' }}>Quick</span>
            <span style={{ color: '#2E7D32' }}>Kart</span>
          </h1>
        </div>
        <p className="text-muted fs-5 fw-medium">Choose your workspace to continue</p>
      </div>

      <div className="row justify-content-center w-100 max-width-lg gap-4" style={{ maxWidth: '800px' }}>
        {/* Buyer Option Card */}
        <div className="col-12 col-md-5">
          <div 
            onClick={() => handleSelectRole('buyer')}
            className="premium-card p-4 text-center cursor-pointer h-100 d-flex flex-column align-items-center justify-content-center border-2" 
            style={{ cursor: 'pointer', minHeight: '260px' }}
          >
            <div className="rounded-circle d-flex align-items-center justify-content-center mb-4" style={{ width: '80px', height: '80px', backgroundColor: 'rgba(46, 125, 50, 0.1)' }}>
              <span style={{ fontSize: '40px' }}>🛍️</span>
            </div>
            <h3 className="fw-bold mb-2 text-dark">Buyer Portal</h3>
            <p className="text-muted px-2">Shop trending products, latest sales, track orders, and get custom recommendations.</p>
            <button className="btn btn-green mt-3 w-100">Continue as Buyer</button>
          </div>
        </div>

        {/* Seller Option Card */}
        <div className="col-12 col-md-5">
          <div 
            onClick={() => handleSelectRole('seller')}
            className="premium-card p-4 text-center cursor-pointer h-100 d-flex flex-column align-items-center justify-content-center border-2"
            style={{ cursor: 'pointer', minHeight: '260px' }}
          >
            <div className="rounded-circle d-flex align-items-center justify-content-center mb-4" style={{ width: '80px', height: '80px', backgroundColor: 'rgba(255, 107, 0, 0.1)' }}>
              <span style={{ fontSize: '40px' }}>📈</span>
            </div>
            <h3 className="fw-bold mb-2 text-dark">Seller Portal</h3>
            <p className="text-muted px-2">List products, track inventory analytics, analyze monthly revenues, and grow your sales.</p>
            <button className="btn btn-orange mt-3 w-100">Continue as Seller</button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LoginSelection;
