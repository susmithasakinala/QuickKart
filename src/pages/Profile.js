import React, { useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { NotificationContext } from '../context/NotificationContext';

function Profile() {
  const { user, updateProfile, deleteAccount, switchRole, logout } = useContext(AuthContext);
  const { triggerToast } = useContext(NotificationContext);
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [profileImage, setProfileImage] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.name);
      setEmail(user.email || '');
      setPhone(user.phone || '');
      setAddress(user.address || '');
      setProfileImage(user.profileImage || '');
    }
  }, [user]);

  const handleUpdate = async (e) => {
    e.preventDefault();

    if (password && password !== confirmPassword) {
      triggerToast('❌ Passwords do not match!');
      return;
    }

    setLoading(true);
    try {
      const updateData = { name, email, phone, address, profileImage };
      if (password) updateData.password = password;

      await updateProfile(updateData);
      triggerToast('🎉 Profile updated successfully!');
      setIsEditing(false);
      setPassword('');
      setConfirmPassword('');
    } catch (err) {
      console.error(err);
      triggerToast(`❌ Update failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSwitchSeller = async () => {
    try {
      await switchRole('seller');
      triggerToast('📈 Switched to Seller Account!');
      navigate('/seller');
    } catch (err) {
      console.error(err);
      triggerToast('❌ Switch failed.');
    }
  };

  const handleDeleteAccount = async () => {
    if (window.confirm("⚠️ Are you absolutely sure you want to delete your account? This action is permanent and cannot be undone.")) {
      try {
        setLoading(true);
        await deleteAccount();
        triggerToast('🗑️ Account deleted successfully!');
        navigate('/login-select');
      } catch (err) {
        console.error(err);
        triggerToast(`❌ Deletion failed: ${err.message}`);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleLogout = () => {
    logout();
    triggerToast('👋 Logged out successfully.');
    navigate('/login-select');
  };

  if (!user) return null;

  return (
    <div className="container py-5" style={{ maxWidth: '800px' }}>
      <h2 className="fw-extrabold mb-4">My Profile</h2>

      <div className="row g-4">
        {/* User Card */}
        <div className="col-12 col-md-4 text-center">
          <div className="premium-card p-4 d-flex flex-column align-items-center">
            <img 
              src={user.profileImage || 'https://cdn-icons-png.flaticon.com/512/149/149071.png'} 
              alt={user.name} 
              className="rounded-circle border mb-3"
              style={{ width: '130px', height: '130px', objectFit: 'cover' }}
            />
            <h5 className="fw-bold m-0">{user.name}</h5>
            <span className="badge bg-secondary mt-2 px-2.5 py-1 text-uppercase fw-bold">{user.role}</span>

            <div className="mt-4 w-100 d-flex flex-column gap-2">
              <button onClick={() => navigate('/buyer/orders')} className="btn btn-outline-green btn-sm fw-bold w-100">View Orders</button>
              {user.role === 'buyer' && (
                <button onClick={handleSwitchSeller} className="btn btn-outline-orange btn-sm fw-bold w-100">Switch To Seller</button>
              )}
              <button onClick={handleLogout} className="btn btn-outline-secondary btn-sm fw-bold w-100">Logout</button>
              <hr className="my-2" />
              <button onClick={handleDeleteAccount} className="btn btn-danger btn-sm fw-bold w-100" disabled={loading}>
                {loading ? 'Deleting...' : 'Delete Account'}
              </button>
            </div>
          </div>
        </div>

        {/* Edit fields form */}
        <div className="col-12 col-md-8">
          <div className="premium-card p-4">
            <div className="d-flex justify-content-between align-items-center mb-4 border-bottom pb-2">
              <h4 className="fw-bold m-0">Profile Information</h4>
              {!isEditing && (
                <button onClick={() => setIsEditing(true)} className="btn btn-green btn-sm fw-bold">Edit Details</button>
              )}
            </div>

            {isEditing ? (
              <form onSubmit={handleUpdate}>
                <div className="mb-3">
                  <label className="form-label fw-bold small">Full Name</label>
                  <input type="text" className="form-control" value={name} onChange={(e) => setName(e.target.value)} required />
                </div>
                <div className="mb-3">
                  <label className="form-label fw-bold small">Email Address</label>
                  <input type="email" className="form-control" value={email} onChange={(e) => setEmail(e.target.value)} required />
                </div>
                <div className="mb-3">
                  <label className="form-label fw-bold small">Phone Number</label>
                  <input type="tel" className="form-control" value={phone} onChange={(e) => setPhone(e.target.value)} required />
                </div>
                <div className="mb-3">
                  <label className="form-label fw-bold small">Shipping Address</label>
                  <textarea className="form-control" rows="2" value={address} onChange={(e) => setAddress(e.target.value)} required />
                </div>
                <div className="mb-3">
                  <label className="form-label fw-bold small">Profile Image URL</label>
                  <input type="text" className="form-control" value={profileImage} onChange={(e) => setProfileImage(e.target.value)} />
                </div>

                <h5 className="fw-bold mt-4 mb-3 border-top pt-3 small text-uppercase text-muted">Change Password (Optional)</h5>
                <div className="row g-2 mb-4">
                  <div className="col-6">
                    <label className="form-label fw-bold small">New Password</label>
                    <input 
                      type="password" 
                      className="form-control" 
                      placeholder="••••••••" 
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                  </div>
                  <div className="col-6">
                    <label className="form-label fw-bold small">Confirm Password</label>
                    <input 
                      type="password" 
                      className="form-control" 
                      placeholder="••••••••" 
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                    />
                  </div>
                </div>

                <div className="d-flex gap-2">
                  <button type="submit" className="btn btn-green fw-bold px-4" disabled={loading}>
                    {loading ? 'Saving...' : 'Save Changes'}
                  </button>
                  <button type="button" onClick={() => setIsEditing(false)} className="btn btn-outline-secondary fw-bold px-4">
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <div className="d-flex flex-column gap-3">
                <div>
                  <p className="m-0 text-muted small fw-bold">EMAIL ADDRESS</p>
                  <h6 className="m-0 fw-semibold text-dark">{user.email}</h6>
                </div>
                <div>
                  <p className="m-0 text-muted small fw-bold">PHONE NUMBER</p>
                  <h6 className="m-0 fw-semibold text-dark">{user.phone || 'Not provided'}</h6>
                </div>
                <div>
                  <p className="m-0 text-muted small fw-bold">DELIVERY ADDRESS</p>
                  <h6 className="m-0 fw-semibold text-dark">{user.address || 'Not provided'}</h6>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Profile;
