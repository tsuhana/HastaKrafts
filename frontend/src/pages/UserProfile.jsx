import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { userAPI, orderAPI } from '../api/axios';
import '../styles/UserProfile.css';

const UserProfile = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    postal_code: '',
    landmark: '',
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [errors, setErrors] = useState({});

  const provinces = [
    'Bagmati',
    'Gandaki',
    'Lumbini',
    'Koshi',
    'Madhesh',
    'Karnali',
    'Sudurpashchim'
  ];

  useEffect(() => {
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    try {
      setLoading(true);
      const res = await userAPI.getProfile();
      
      if (res.data.success) {
        const userData = res.data.data;
        setUser(userData);
        setFormData({
          full_name: userData.full_name || '',
          email: userData.email || '',
          phone: userData.phone || '',
          address: userData.address || '',
          city: userData.city || '',
          state: userData.state || '',
          postal_code: userData.postal_code || '',
          landmark: userData.landmark || '',
        });
      }
    } catch (err) {
      console.error('Error fetching profile:', err);
      alert('Failed to load profile. Please login again.');
      if (err.response?.status === 401) {
        navigate('/login');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    if (errors[e.target.name]) {
      setErrors({ ...errors, [e.target.name]: '' });
    }
  };

  const handlePasswordChange = (e) => {
    setPasswordData({
      ...passwordData,
      [e.target.name]: e.target.value,
    });
    if (errors[e.target.name]) {
      setErrors({ ...errors, [e.target.name]: '' });
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      alert('Please upload a valid image (JPG, PNG, WEBP)');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      alert('Image size must be less than 2MB');
      return;
    }

    setUploadingImage(true);

    try {
      const formData = new FormData();
      formData.append('profile_picture', file);

      const res = await userAPI.uploadAvatar(formData);

      if (res.data.success) {
        alert('Profile picture updated successfully!');
        fetchUserProfile();
      }
    } catch (err) {
      console.error('Error uploading image:', err);
      alert(err.response?.data?.message || 'Failed to upload image');
    } finally {
      setUploadingImage(false);
    }
  };

  const validateProfileForm = () => {
    const newErrors = {};

    if (!formData.full_name.trim()) {
      newErrors.full_name = 'Name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }

    if (formData.phone && !/^\d{10}$/.test(formData.phone.replace(/\D/g, ''))) {
      newErrors.phone = 'Phone must be 10 digits';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validatePasswordForm = () => {
    const newErrors = {};

    if (!passwordData.currentPassword) {
      newErrors.currentPassword = 'Current password is required';
    }

    if (!passwordData.newPassword) {
      newErrors.newPassword = 'New password is required';
    } else if (passwordData.newPassword.length < 6) {
      newErrors.newPassword = 'Password must be at least 6 characters';
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();

    if (!validateProfileForm()) {
      return;
    }

    setSaving(true);

    try {
      const res = await userAPI.updateProfile(formData);
      if (res.data.success) {
        alert('Profile updated successfully!');
        setUser(res.data.data);
        setIsEditing(false);
        fetchUserProfile();
      }
    } catch (err) {
      console.error('Error updating profile:', err);
      alert(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();

    if (!validatePasswordForm()) {
      return;
    }

    setSaving(true);

    try {
      const res = await userAPI.changePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });

      if (res.data.success) {
        alert('Password changed successfully!');
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: '',
        });
        setActiveTab('profile');
      }
    } catch (err) {
      console.error('Error changing password:', err);
      alert(err.response?.data?.message || 'Failed to change password');
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch {
      return 'N/A';
    }
  };

  const getProfileImageUrl = () => {
    if (user?.profile_image) {
      return `http://localhost:5000${user.profile_image}`;
    }
    return null;
  };

  if (loading) {
    return (
      <div className="profile-loading">
        <div className="spinner"></div>
        <p>Loading profile...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="profile-error">
        <p>Failed to load profile. Please try again.</p>
        <button onClick={fetchUserProfile} className="btn-retry">Retry</button>
      </div>
    );
  }

  return (
    <div className="user-profile-page">
      <div className="profile-container">
        <div className="profile-header-card">
          <div className="profile-avatar-section">
            <div className="avatar-wrapper">
              {getProfileImageUrl() ? (
                <img src={getProfileImageUrl()} alt={user.full_name} className="avatar-image" />
              ) : (
                <div className="avatar-circle">
                  {user.full_name?.substring(0, 2).toUpperCase() || 'U'}
                </div>
              )}
              <label className="avatar-upload-btn" htmlFor="avatar-input">
                {uploadingImage ? '...' : '📷'}
              </label>
              <input
                type="file"
                id="avatar-input"
                accept="image/*"
                onChange={handleImageUpload}
                style={{ display: 'none' }}
                disabled={uploadingImage}
              />
            </div>
            <div className="profile-info">
              <h1>{user.full_name || 'User'}</h1>
              <p className="user-email">{user.email}</p>
              <div className="user-badges">
                <span className={`role-badge role-${user.role}`}>
                  {user.role === 'seller' ? 'Seller' : user.role === 'admin' ? 'Admin' : 'Buyer'}
                </span>
                <span className="member-badge">
                  Member since {formatDate(user.created_at)}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="profile-tabs">
          <button
            className={`tab-btn ${activeTab === 'profile' ? 'active' : ''}`}
            onClick={() => setActiveTab('profile')}
          >
            {user.role === 'buyer' ? 'Profile & Delivery' : 'Profile'}
          </button>
          <button
            className={`tab-btn ${activeTab === 'password' ? 'active' : ''}`}
            onClick={() => setActiveTab('password')}
          >
            Change Password
          </button>
          {user.role !== 'admin' && (
            <button
              className={`tab-btn ${activeTab === 'orders' ? 'active' : ''}`}
              onClick={() => setActiveTab('orders')}
            >
              Order History
            </button>
          )}
        </div>

        <div className="profile-content-card">
          {activeTab === 'profile' && (
            <div className="tab-content">
              <div className="content-header">
                <h2>{user.role === 'buyer' ? 'Profile & Delivery Information' : 'Profile Information'}</h2>
                {!isEditing ? (
                  <button onClick={() => setIsEditing(true)} className="btn-edit">
                    Edit Profile
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      setIsEditing(false);
                      setFormData({
                        full_name: user.full_name || '',
                        email: user.email || '',
                        phone: user.phone || '',
                        address: user.address || '',
                        city: user.city || '',
                        state: user.state || '',
                        postal_code: user.postal_code || '',
                        landmark: user.landmark || '',
                      });
                      setErrors({});
                    }}
                    className="btn-cancel-edit"
                  >
                    Cancel
                  </button>
                )}
              </div>

              {!isEditing ? (
                <div className="profile-view">
                  <div className="section-title">Personal Information</div>
                  <div className="info-grid">
                    <div className="info-item">
                      <label>Full Name</label>
                      <p>{user.full_name || 'Not provided'}</p>
                    </div>
                    <div className="info-item">
                      <label>Email</label>
                      <p>{user.email}</p>
                    </div>
                    <div className="info-item">
                      <label>Phone</label>
                      <p>{user.phone || 'Not provided'}</p>
                    </div>
                  </div>

                  {user.role === 'buyer' && (
                    <>
                      <div className="section-title">Delivery Address</div>
                      <div className="info-grid">
                        <div className="info-item full-width">
                          <label>Street Address</label>
                          <p>{user.address || 'Not provided'}</p>
                        </div>
                        <div className="info-item">
                          <label>City</label>
                          <p>{user.city || 'Not provided'}</p>
                        </div>
                        <div className="info-item">
                          <label>Province</label>
                          <p>{user.state || 'Not provided'}</p>
                        </div>
                        <div className="info-item">
                          <label>Postal Code</label>
                          <p>{user.postal_code || 'Not provided'}</p>
                        </div>
                        <div className="info-item">
                          <label>Landmark</label>
                          <p>{user.landmark || 'Not provided'}</p>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              ) : (
                <form onSubmit={handleUpdateProfile} className="profile-edit-form">
                  <div className="form-section">
                    <h3>Personal Information</h3>
                    <div className="form-grid">
                      <div className="form-field">
                        <label>Full Name *</label>
                        <input
                          type="text"
                          name="full_name"
                          value={formData.full_name}
                          onChange={handleChange}
                          placeholder="Your full name"
                          className={errors.full_name ? 'error' : ''}
                        />
                        {errors.full_name && <span className="error-msg">{errors.full_name}</span>}
                      </div>

                      <div className="form-field">
                        <label>Email *</label>
                        <input
                          type="email"
                          name="email"
                          value={formData.email}
                          onChange={handleChange}
                          placeholder="your@email.com"
                          className={errors.email ? 'error' : ''}
                        />
                        {errors.email && <span className="error-msg">{errors.email}</span>}
                      </div>

                      <div className="form-field">
                        <label>Phone Number {user.role === 'buyer' ? '*' : ''}</label>
                        <input
                          type="tel"
                          name="phone"
                          value={formData.phone}
                          onChange={handleChange}
                          placeholder="9812345678"
                          className={errors.phone ? 'error' : ''}
                        />
                        {errors.phone && <span className="error-msg">{errors.phone}</span>}
                      </div>
                    </div>
                  </div>

                  {user.role === 'buyer' && (
                    <div className="form-section">
                      <h3>Delivery Address</h3>
                      <div className="form-grid">
                        <div className="form-field full-width">
                          <label>Street Address</label>
                          <input
                            type="text"
                            name="address"
                            value={formData.address}
                            onChange={handleChange}
                            placeholder="House/Building, Street, Area"
                            className={errors.address ? 'error' : ''}
                          />
                          {errors.address && <span className="error-msg">{errors.address}</span>}
                        </div>

                        <div className="form-field">
                          <label>City</label>
                          <input
                            type="text"
                            name="city"
                            value={formData.city}
                            onChange={handleChange}
                            placeholder="Kathmandu, Pokhara, etc."
                            className={errors.city ? 'error' : ''}
                          />
                          {errors.city && <span className="error-msg">{errors.city}</span>}
                        </div>

                        <div className="form-field">
                          <label>Province</label>
                          <select
                            name="state"
                            value={formData.state}
                            onChange={handleChange}
                          >
                            <option value="">Select Province</option>
                            {provinces.map((province) => (
                              <option key={province} value={province}>
                                {province}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="form-field">
                          <label>Postal Code</label>
                          <input
                            type="text"
                            name="postal_code"
                            value={formData.postal_code}
                            onChange={handleChange}
                            placeholder="44600"
                          />
                        </div>

                        <div className="form-field full-width">
                          <label>Landmark</label>
                          <input
                            type="text"
                            name="landmark"
                            value={formData.landmark}
                            onChange={handleChange}
                            placeholder="Near XYZ Temple, Opposite ABC Store"
                          />
                          <small>Help delivery person find you easily</small>
                        </div>
                      </div>
                    </div>
                  )}

                  <button type="submit" disabled={saving} className="btn-save">
                    {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                </form>
              )}
            </div>
          )}

          {activeTab === 'password' && (
            <div className="tab-content">
              <h2>Change Password</h2>
              <form onSubmit={handleChangePassword} className="password-form">
                <div className="form-field">
                  <label>Current Password *</label>
                  <input
                    type="password"
                    name="currentPassword"
                    value={passwordData.currentPassword}
                    onChange={handlePasswordChange}
                    className={errors.currentPassword ? 'error' : ''}
                  />
                  {errors.currentPassword && (
                    <span className="error-msg">{errors.currentPassword}</span>
                  )}
                </div>

                <div className="form-field">
                  <label>New Password *</label>
                  <input
                    type="password"
                    name="newPassword"
                    value={passwordData.newPassword}
                    onChange={handlePasswordChange}
                    className={errors.newPassword ? 'error' : ''}
                  />
                  {errors.newPassword && (
                    <span className="error-msg">{errors.newPassword}</span>
                  )}
                </div>

                <div className="form-field">
                  <label>Confirm New Password *</label>
                  <input
                    type="password"
                    name="confirmPassword"
                    value={passwordData.confirmPassword}
                    onChange={handlePasswordChange}
                    className={errors.confirmPassword ? 'error' : ''}
                  />
                  {errors.confirmPassword && (
                    <span className="error-msg">{errors.confirmPassword}</span>
                  )}
                </div>

                <button type="submit" disabled={saving} className="btn-save">
                  {saving ? 'Changing...' : 'Change Password'}
                </button>
              </form>
            </div>
          )}

          {activeTab === 'orders' && (
            <div className="tab-content">
              <OrderHistory />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const OrderHistory = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const res = await orderAPI.getMyOrders();
      if (res.data.success) {
        setOrders(res.data.data);
      }
    } catch (err) {
      console.error('Error fetching orders:', err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: '#F59E0B',
      processing: '#3B82F6',
      shipped: '#8B5CF6',
      delivered: '#10B981',
      cancelled: '#EF4444',
    };
    return colors[status] || '#6B7280';
  };

  if (loading) {
    return <div className="loading">Loading orders...</div>;
  }

  if (orders.length === 0) {
    return (
      <div className="empty-state">
        <p>No orders yet</p>
        <button onClick={() => window.location.href = '/products'} className="btn-primary">
          Start Shopping
        </button>
      </div>
    );
  }

  return (
    <div className="orders-list">
      {orders.map((order) => (
        <div key={order.order_id} className="order-card">
          <div className="order-header">
            <div>
              <h3>Order #{order.order_number}</h3>
              <p className="order-date">
                {new Date(order.created_at).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </p>
            </div>
            <div className="order-status-badges">
              <span 
                className="status-badge" 
                style={{ 
                  background: `${getStatusColor(order.order_status)}20`,
                  color: getStatusColor(order.order_status),
                }}
              >
                {order.order_status}
              </span>
              <span 
                className="payment-badge"
                style={{ 
                  background: order.payment_status === 'paid' ? '#10B98120' : '#F59E0B20',
                  color: order.payment_status === 'paid' ? '#10B981' : '#F59E0B',
                }}
              >
                {order.payment_status}
              </span>
            </div>
          </div>

          <div className="order-items">
            {order.items && order.items.slice(0, 3).map((item) => (
              <div key={item.order_item_id} className="order-item-preview">
                <img 
                  src={item.product_image ? `http://localhost:5000${item.product_image}` : '/placeholder.png'} 
                  alt={item.product_name} 
                />
                <div>
                  <p className="item-name">{item.product_name}</p>
                  <p className="item-qty">Qty: {item.quantity}</p>
                </div>
              </div>
            ))}
            {order.items && order.items.length > 3 && (
              <p className="more-items">+{order.items.length - 3} more items</p>
            )}
          </div>

          <div className="order-footer">
            <div className="order-total">
              <span>Total:</span>
              <span className="amount">Rs. {parseFloat(order.total).toLocaleString()}</span>
            </div>
            <button 
              onClick={() => window.location.href = `/order-confirmation/${order.order_id}`}
              className="btn-view-order"
            >
              View Details
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default UserProfile;