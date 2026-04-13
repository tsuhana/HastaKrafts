import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { userAPI, orderAPI, sellerAPI, pointsAPI } from '../api/axios';
import Icons from '../utils/icons';
import { useToast } from '../context/ToastContext';
import { useTranslation } from 'react-i18next';
import {
  Pagination,
  FilterBar,
  SearchInput,
  DateRangePicker,
  SortSelect,
  filterByDateRange,
} from '../components/SharedComponents';
import '../styles/UserProfile.css';

const API_URL = 'http://localhost:5000';
const ORDERS_PER_PAGE = 5;

const UserProfile = () => {
  const navigate       = useNavigate();
  const toast          = useToast();
  const { t }          = useTranslation();
  const [activeTab, setActiveTab]       = useState('profile');
  const [loading, setLoading]           = useState(true);
  const [saving, setSaving]             = useState(false);
  const [user, setUser]                 = useState(null);
  const [isEditing, setIsEditing]       = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  const [formData, setFormData] = useState({
    full_name: '', email: '', phone: '',
    address: '', city: '', state: '', postal_code: '', landmark: '',
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '', newPassword: '', confirmPassword: '',
  });

  const [errors, setErrors] = useState({});

  const provinces = [
    'Bagmati', 'Gandaki', 'Lumbini', 'Koshi',
    'Madhesh', 'Karnali', 'Sudurpashchim',
  ];

  useEffect(() => { fetchUserProfile(); }, []);

  const fetchUserProfile = async () => {
    try {
      setLoading(true);
      const res = await userAPI.getProfile();
      if (res.data.success) {
        const u = res.data.data;
        setUser(u);
        setFormData({
          full_name:   u.full_name   || '',
          email:       u.email       || '',
          phone:       u.phone       || '',
          address:     u.address     || '',
          city:        u.city        || '',
          state:       u.state       || '',
          postal_code: u.postal_code || '',
          landmark:    u.landmark    || '',
        });
      }
    } catch (err) {
      toast.error('Failed to load profile. Please login again.');
      if (err.response?.status === 401) navigate('/login');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (errors[e.target.name]) setErrors({ ...errors, [e.target.name]: '' });
  };

  const handlePasswordChange = (e) => {
    setPasswordData({ ...passwordData, [e.target.name]: e.target.value });
    if (errors[e.target.name]) setErrors({ ...errors, [e.target.name]: '' });
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowed.includes(file.type)) { toast.error('Please upload JPG, PNG or WEBP'); return; }
    if (file.size > 2 * 1024 * 1024) { toast.error('Image must be under 2MB'); return; }
    setUploadingImage(true);
    try {
      const fd = new FormData();
      fd.append('profile_picture', file);
      const res = await userAPI.uploadAvatar(fd);
      if (res.data.success) { toast.success('Profile picture updated!'); fetchUserProfile(); }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to upload image');
    } finally {
      setUploadingImage(false);
    }
  };

  const validateProfileForm = () => {
    const e = {};
    if (!formData.full_name.trim()) e.full_name = 'Name is required';
    if (!formData.email.trim())     e.email     = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(formData.email)) e.email = 'Email is invalid';
    if (formData.phone && !/^\d{10}$/.test(formData.phone.replace(/\D/g, '')))
      e.phone = 'Phone must be 10 digits';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const validatePasswordForm = () => {
    const e = {};
    if (!passwordData.currentPassword)
      e.currentPassword = 'Current password is required';
    if (!passwordData.newPassword)
      e.newPassword = 'New password is required';
    else if (passwordData.newPassword.length < 6)
      e.newPassword = 'Password must be at least 6 characters';
    else if (!/[A-Za-z]/.test(passwordData.newPassword) || !/[0-9]/.test(passwordData.newPassword))
      e.newPassword = 'Password must contain at least one letter and one number';
    if (passwordData.newPassword !== passwordData.confirmPassword)
      e.confirmPassword = 'Passwords do not match';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    if (!validateProfileForm()) return;
    setSaving(true);
    try {
      const res = await userAPI.updateProfile(formData);
      if (res.data.success) {
        toast.success('Profile updated successfully!');
        setUser(res.data.data);
        setIsEditing(false);
        fetchUserProfile();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (!validatePasswordForm()) return;
    setSaving(true);
    try {
      const res = await userAPI.changePassword({
        current_password: passwordData.currentPassword,
        new_password:     passwordData.newPassword,
      });
      if (res.data.success) {
        toast.success('Password changed successfully!');
        setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
        setActiveTab('profile');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to change password');
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const d = new Date(dateString);
      if (isNaN(d.getTime())) return 'N/A';
      return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    } catch { return 'N/A'; }
  };

  const getProfileImageUrl = () =>
    user?.profile_image ? `${API_URL}${user.profile_image}` : null;

  if (loading) {
    return (
      <div className="profile-loading">
        <div className="spinner" />
        <p>{t('common.loading')}</p>
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

  const isSeller = user.role === 'seller';
  const isBuyer  = user.role === 'buyer';

  return (
    <div className="user-profile-page">
      <div className="profile-container">

        {/* ── Header ── */}
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
                {uploadingImage ? '…' : '📷'}
              </label>
              <input
                type="file" id="avatar-input" accept="image/*"
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
                  {user.role === 'seller' ? t('profile.seller')
                    : user.role === 'admin' ? t('profile.admin')
                    : t('profile.buyer')}
                </span>
                <span className="member-badge">
                  {t('profile.member_since')} {formatDate(user.createdAt || user.created_at)}
                </span>
              </div>
              {isSeller && (
                <Link to="/seller/dashboard" className="btn-goto-dashboard">
                  🏪 Go to Artisan Dashboard →
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* ── Tabs ── */}
        <div className="profile-tabs">
          <button
            className={`tab-btn ${activeTab === 'profile' ? 'active' : ''}`}
            onClick={() => setActiveTab('profile')}
          >
            {isBuyer ? `${t('profile.title')} & ${t('profile.delivery')}` : t('profile.title')}
          </button>
          <button
            className={`tab-btn ${activeTab === 'password' ? 'active' : ''}`}
            onClick={() => setActiveTab('password')}
          >
            {t('profile.change_password')}
          </button>
          {isBuyer && (
            <button
              className={`tab-btn ${activeTab === 'orders' ? 'active' : ''}`}
              onClick={() => setActiveTab('orders')}
            >
              {t('profile.order_history')}
            </button>
          )}
          {/* Points tab */}
          {isBuyer && (
            <button
              className={`tab-btn ${activeTab === 'points' ? 'active' : ''}`}
              onClick={() => setActiveTab('points')}
            >
              <Icons.Gift size={15} style={{ marginRight: 6 }} />Points History
            </button>
          )}
          {isSeller && (
            <button
              className={`tab-btn ${activeTab === 'shop' ? 'active' : ''}`}
              onClick={() => setActiveTab('shop')}
            >
              🏪 Shop Info
            </button>
          )}
        </div>

        <div className="profile-content-card">

          {/* ── Profile Tab ── */}
          {activeTab === 'profile' && (
            <div className="tab-content">
              <div className="content-header">
                <h2>
                  {isBuyer
                    ? `${t('profile.personal_info')} & ${t('profile.delivery_address')}`
                    : t('profile.personal_info')}
                </h2>
                {!isEditing ? (
                  <button onClick={() => setIsEditing(true)} className="btn-edit">
                    {t('profile.edit_profile')}
                  </button>
                ) : (
                  <button
                    onClick={() => { setIsEditing(false); setErrors({}); }}
                    className="btn-cancel-edit"
                  >
                    {t('profile.cancel')}
                  </button>
                )}
              </div>

              {!isEditing ? (
                <div className="profile-view">
                  <div className="section-title">{t('profile.personal_info')}</div>
                  <div className="info-grid">
                    <div className="info-item">
                      <label>{t('auth.full_name')}</label>
                      <p>{user.full_name || t('profile.not_provided')}</p>
                    </div>
                    <div className="info-item">
                      <label>{t('auth.email')}</label>
                      <p>{user.email}</p>
                    </div>
                    <div className="info-item">
                      <label>{t('auth.phone')}</label>
                      <p>{user.phone || t('profile.not_provided')}</p>
                    </div>
                  </div>
                  {isBuyer && (
                    <>
                      <div className="section-title">{t('profile.delivery_address')}</div>
                      <div className="info-grid">
                        <div className="info-item full-width">
                          <label>{t('checkout.address')}</label>
                          <p>{user.address || t('profile.not_provided')}</p>
                        </div>
                        <div className="info-item">
                          <label>{t('checkout.city')}</label>
                          <p>{user.city || t('profile.not_provided')}</p>
                        </div>
                        <div className="info-item">
                          <label>{t('checkout.province')}</label>
                          <p>{user.state || t('profile.not_provided')}</p>
                        </div>
                        <div className="info-item">
                          <label>{t('checkout.postal_code')}</label>
                          <p>{user.postal_code || t('profile.not_provided')}</p>
                        </div>
                        <div className="info-item">
                          <label>{t('checkout.landmark')}</label>
                          <p>{user.landmark || t('profile.not_provided')}</p>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              ) : (
                <form onSubmit={handleUpdateProfile} className="profile-edit-form">
                  <div className="form-section">
                    <h3>{t('profile.personal_info')}</h3>
                    <div className="form-grid">
                      <div className="form-field">
                        <label>{t('auth.full_name')} *</label>
                        <input
                          type="text" name="full_name" value={formData.full_name}
                          onChange={handleChange}
                          className={errors.full_name ? 'error' : ''}
                        />
                        {errors.full_name && <span className="error-msg">{errors.full_name}</span>}
                      </div>
                      <div className="form-field">
                        <label>{t('auth.email')} *</label>
                        <input
                          type="email" name="email" value={formData.email}
                          onChange={handleChange}
                          className={errors.email ? 'error' : ''}
                        />
                        {errors.email && <span className="error-msg">{errors.email}</span>}
                      </div>
                      <div className="form-field">
                        <label>{t('auth.phone')}</label>
                        <input
                          type="tel" name="phone" value={formData.phone}
                          onChange={handleChange}
                          className={errors.phone ? 'error' : ''}
                        />
                        {errors.phone && <span className="error-msg">{errors.phone}</span>}
                      </div>
                    </div>
                  </div>

                  {isBuyer && (
                    <div className="form-section">
                      <h3>{t('profile.delivery_address')}</h3>
                      <div className="form-grid">
                        <div className="form-field full-width">
                          <label>{t('checkout.address')}</label>
                          <input type="text" name="address" value={formData.address} onChange={handleChange} />
                        </div>
                        <div className="form-field">
                          <label>{t('checkout.city')}</label>
                          <input type="text" name="city" value={formData.city} onChange={handleChange} />
                        </div>
                        <div className="form-field">
                          <label>{t('checkout.province')}</label>
                          <select name="state" value={formData.state} onChange={handleChange}>
                            <option value="">Select Province</option>
                            {provinces.map((p) => <option key={p} value={p}>{p}</option>)}
                          </select>
                        </div>
                        <div className="form-field">
                          <label>{t('checkout.postal_code')}</label>
                          <input type="text" name="postal_code" value={formData.postal_code} onChange={handleChange} />
                        </div>
                        <div className="form-field full-width">
                          <label>{t('checkout.landmark')}</label>
                          <input type="text" name="landmark" value={formData.landmark} onChange={handleChange} />
                        </div>
                      </div>
                    </div>
                  )}

                  <button type="submit" disabled={saving} className="btn-save">
                    {saving ? t('profile.saving') : t('profile.save_changes')}
                  </button>
                </form>
              )}
            </div>
          )}

          {/* ── Change Password Tab ── */}
          {activeTab === 'password' && (
            <div className="tab-content">
              <h2>{t('profile.change_password')}</h2>
              <form onSubmit={handleChangePassword} className="password-form">
                <div className="form-field">
                  <label>{t('profile.current_password')} *</label>
                  <input
                    type="password" name="currentPassword"
                    value={passwordData.currentPassword}
                    onChange={handlePasswordChange}
                    className={errors.currentPassword ? 'error' : ''}
                  />
                  {errors.currentPassword && <span className="error-msg">{errors.currentPassword}</span>}
                </div>
                <div className="form-field">
                  <label>{t('profile.new_password')} *</label>
                  <input
                    type="password" name="newPassword"
                    value={passwordData.newPassword}
                    onChange={handlePasswordChange}
                    className={errors.newPassword ? 'error' : ''}
                  />
                  {errors.newPassword && <span className="error-msg">{errors.newPassword}</span>}
                  <span style={{ fontSize: '0.72rem', color: '#9a8268', marginTop: 3, display: 'block' }}>
                    Min 6 characters, must include a letter and a number
                  </span>
                </div>
                <div className="form-field">
                  <label>{t('profile.confirm_password')} *</label>
                  <input
                    type="password" name="confirmPassword"
                    value={passwordData.confirmPassword}
                    onChange={handlePasswordChange}
                    className={errors.confirmPassword ? 'error' : ''}
                  />
                  {errors.confirmPassword && <span className="error-msg">{errors.confirmPassword}</span>}
                </div>
                <button type="submit" disabled={saving} className="btn-save">
                  {saving ? t('profile.changing') : t('profile.change_password')}
                </button>
              </form>
            </div>
          )}

          {/* ── Order History (buyers only) ── */}
          {activeTab === 'orders' && isBuyer && (
            <div className="tab-content">
              <OrderHistory t={t} />
            </div>
          )}

          {/* Points History (buyers only) */}
          {activeTab === 'points' && isBuyer && (
            <div className="tab-content">
              <PointsHistory t={t} />
            </div>
          )}

          {/* ── Shop Info (sellers only) ── */}
          {activeTab === 'shop' && isSeller && (
            <div className="tab-content">
              <SellerShopInfo t={t} navigate={navigate} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ══════════════════════════════════════════════════════════════
// ORDER HISTORY
// ══════════════════════════════════════════════════════════════
const OrderHistory = ({ t }) => {
  const [orders, setOrders]     = useState([]);
  const [loading, setLoading]   = useState(true);
  const [statusFilter, setStatusFilter]   = useState('all');
  const [paymentFilter, setPaymentFilter] = useState('all');
  const [search, setSearch]               = useState('');
  const [dateRange, setDateRange]         = useState({ startDate: '', endDate: '' });
  const [sort, setSort]                   = useState('newest');
  const [page, setPage]                   = useState(1);

  useEffect(() => {
    orderAPI.getMyOrders()
      .then((res) => { if (res.data.success) setOrders(res.data.data || []); })
      .catch((err) => console.error('Orders error:', err))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { setPage(1); }, [statusFilter, paymentFilter, search, dateRange, sort]);

  const statusCounts = useMemo(() => {
    const c = { all: orders.length };
    orders.forEach((o) => { const s = o.order_status; c[s] = (c[s] || 0) + 1; });
    return c;
  }, [orders]);

  const filtered = useMemo(() => {
    let list = [...orders];
    if (statusFilter !== 'all') list = list.filter((o) => o.order_status === statusFilter);
    if (paymentFilter !== 'all') list = list.filter((o) => o.payment_status === paymentFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((o) =>
        (o.order_number || '').toLowerCase().includes(q.replace(/^order\s*#?\s*/i, '').replace('#', '').trim()) ||
        o.items?.some((i) => (i.product_name || '').toLowerCase().includes(q))
      );
    }
    list = filterByDateRange(list, 'created_at', dateRange.startDate, dateRange.endDate);
    list.sort((a, b) => {
      const da = new Date(a.created_at || a.createdAt);
      const db = new Date(b.created_at || b.createdAt);
      if (sort === 'newest')  return db - da;
      if (sort === 'oldest')  return da - db;
      if (sort === 'highest') return parseFloat(b.total) - parseFloat(a.total);
      if (sort === 'lowest')  return parseFloat(a.total) - parseFloat(b.total);
      return 0;
    });
    return list;
  }, [orders, statusFilter, paymentFilter, search, dateRange, sort]);

  const totalPages = Math.ceil(filtered.length / ORDERS_PER_PAGE);
  const paged      = filtered.slice((page - 1) * ORDERS_PER_PAGE, page * ORDERS_PER_PAGE);

  const getStatusColor = (status) => ({
    pending: '#F59E0B', processing: '#3B82F6', shipped: '#8B5CF6',
    delivered: '#10B981', cancelled: '#EF4444',
  }[status] || '#6B7280');

  const clearAll = () => {
    setStatusFilter('all'); setPaymentFilter('all');
    setSearch(''); setDateRange({ startDate: '', endDate: '' });
    setSort('newest'); setPage(1);
  };

  const hasActiveFilters = statusFilter !== 'all' || paymentFilter !== 'all' ||
    search || dateRange.startDate || dateRange.endDate;

  if (loading) return <div className="loading">{t('common.loading')}</div>;
  if (orders.length === 0) {
    return (
      <div className="empty-state">
        <p>{t('orders.no_orders')}</p>
        <button onClick={() => (window.location.href = '/products')} className="btn-primary">
          {t('orders.start_shopping')}
        </button>
      </div>
    );
  }

  return (
    <div className="oh-wrap">
      <div className="oh-header">
        <div>
          <h2 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: '#2C1810' }}>Order History</h2>
          <p style={{ margin: '2px 0 0', fontSize: '0.78rem', color: '#8B6F5E' }}>{filtered.length} of {orders.length} orders</p>
        </div>
        {hasActiveFilters && <button onClick={clearAll} className="oh-clear-btn">✕ Clear filters</button>}
      </div>
      <div className="oh-toolbar">
        <SearchInput value={search} onChange={setSearch} placeholder="Search by order # or product…" theme="seller" style={{ flex: 1, minWidth: 200 }} />
        <SortSelect theme="seller" value={sort} onChange={setSort}
          options={[{ value: 'newest', label: 'Newest first' }, { value: 'oldest', label: 'Oldest first' }, { value: 'highest', label: 'Highest amount' }, { value: 'lowest', label: 'Lowest amount' }]} />
      </div>
      <div style={{ marginBottom: '0.85rem' }}>
        <DateRangePicker theme="seller" startDate={dateRange.startDate} endDate={dateRange.endDate} onChange={setDateRange} label="Date:" />
      </div>
      <div style={{ marginBottom: '0.5rem' }}>
        <FilterBar theme="seller" active={statusFilter} onChange={setStatusFilter}
          filters={[
            { key: 'all', label: 'All', count: statusCounts.all || 0 },
            { key: 'pending', label: 'Pending', count: statusCounts.pending || 0 },
            { key: 'processing', label: 'Processing', count: statusCounts.processing || 0 },
            { key: 'shipped', label: 'Shipped', count: statusCounts.shipped || 0 },
            { key: 'delivered', label: 'Delivered', count: statusCounts.delivered || 0 },
            { key: 'cancelled', label: 'Cancelled', count: statusCounts.cancelled || 0 },
          ]} />
      </div>
      <div style={{ marginBottom: '1rem' }}>
        <FilterBar theme="seller" active={paymentFilter} onChange={setPaymentFilter}
          filters={[{ key: 'all', label: 'All payments' }, { key: 'paid', label: 'Paid' }, { key: 'pending', label: 'Unpaid' }]} />
      </div>
      {paged.length === 0 ? (
        <div className="oh-no-results"><p>No orders match your filters.</p><button onClick={clearAll} className="oh-clear-btn">Clear all filters</button></div>
      ) : (
        <>
          <div className="orders-list">
            {paged.map((order) => (
              <div key={order.order_id} className="order-card">
                <div className="order-header">
                  <div>
                    <h3>Order #{order.order_number}</h3>
                    <p className="order-date">{new Date(order.created_at || order.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                  </div>
                  <div className="order-status-badges">
                    <span className="status-badge" style={{ background: `${getStatusColor(order.order_status)}20`, color: getStatusColor(order.order_status) }}>
                      {order.order_status?.charAt(0).toUpperCase() + order.order_status?.slice(1)}
                    </span>
                    <span className="payment-badge" style={{ background: order.payment_status === 'paid' ? '#10B98120' : '#F59E0B20', color: order.payment_status === 'paid' ? '#10B981' : '#F59E0B' }}>
                      {order.payment_status === 'paid' ? (order.payment_method === 'khalti' ? '✓ Paid (Khalti)' : '✓ Paid (COD)') : '⏳ Unpaid'}
                    </span>
                    <span className="payment-badge" style={{ background: '#EFF6FF', color: '#1D4ED8' }}>{order.payment_method?.toUpperCase()}</span>
                  </div>
                </div>
                <div className="order-items">
                  {order.items?.slice(0, 3).map((item) => (
                    <div key={item.order_item_id} className="order-item-preview">
                      <img src={item.product_image ? `${API_URL}${item.product_image}` : '/placeholder.png'} alt={item.product_name} />
                      <div>
                        <p className="item-name">{item.product_name}</p>
                        <p className="item-qty">Qty: {item.quantity} × Rs. {parseFloat(item.product_price).toLocaleString()}</p>
                      </div>
                    </div>
                  ))}
                  {(order.items?.length || 0) > 3 && <p className="more-items">+{order.items.length - 3} more item(s)</p>}
                </div>
                <div className="oh-delivery-row">
                  <span>📍 {order.delivery_city}{order.delivery_state ? `, ${order.delivery_state}` : ''}</span>
                  {order.delivery_fee > 0 ? <span>Delivery: Rs. {parseFloat(order.delivery_fee).toLocaleString()}</span> : <span style={{ color: '#10B981' }}>Free delivery</span>}
                  {order.points_earned > 0 && <span style={{ color: '#b86e38' }}>🏆 +{order.points_earned} pts earned</span>}
                </div>
                <div className="order-footer">
                  <div className="order-total"><span>Total:</span><span className="amount">Rs. {parseFloat(order.total).toLocaleString()}</span></div>
                  <button onClick={() => (window.location.href = `/order-confirmation/${order.order_id}`)} className="btn-view-order">View Details →</button>
                </div>
              </div>
            ))}
          </div>
          <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} theme="seller" />
          <p style={{ textAlign: 'center', fontSize: '0.72rem', color: '#B09070', marginTop: '0.5rem' }}>
            Showing {(page - 1) * ORDERS_PER_PAGE + 1}–{Math.min(page * ORDERS_PER_PAGE, filtered.length)} of {filtered.length}
          </p>
        </>
      )}
    </div>
  );
};

// ══════════════════════════════════════════════════════════════
// POINTS HISTORY
// ══════════════════════════════════════════════════════════════
const PointsHistory = ({ t }) => {
  const [history, setHistory] = useState([]);
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPoints = async () => {
      try {
        const [balRes, histRes] = await Promise.all([
          pointsAPI.getBalance(),
          pointsAPI.getHistory(),
        ]);
        if (balRes.data.success) setBalance(balRes.data.data.total_points || 0);
        if (histRes.data.success) setHistory(histRes.data.data || []);
      } catch (err) {
        console.error('Points fetch error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchPoints();
  }, []);

  if (loading) return <div className="loading">{t('common.loading')}</div>;

  return (
    <div>
      <h2 style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Icons.Gift size={22} /> Points & Rewards</h2>

      {/* Balance Card */}
      <div style={{
        background: 'linear-gradient(135deg, #b86e38, #d4813f)',
        borderRadius: 16,
        padding: '1.5rem 2rem',
        color: '#fff',
        marginBottom: '1.5rem',
        display: 'flex',
        alignItems: 'center',
        gap: '1rem',
      }}>
        <Icons.Dollar size={40} style={{ color: '#fff', opacity: 0.9 }} />
        <div>
          <div style={{ fontSize: '0.8rem', opacity: 0.85, fontWeight: 600, letterSpacing: '0.05em' }}>
            TOTAL POINTS BALANCE
          </div>
          <div style={{ fontSize: '2.5rem', fontWeight: 800, lineHeight: 1 }}>
            {balance}
          </div>
          <div style={{ fontSize: '0.75rem', opacity: 0.8, marginTop: 4 }}>
            {balance >= 150
              ? <><Icons.CheckCircle size={14} style={{ marginRight: 4, verticalAlign: 'middle' }} />Eligible for free delivery!</>
              : `Need ${150 - balance} more points for free delivery`}
          </div>
        </div>
      </div>

      {/* History Table */}
      <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#2C1810', marginBottom: '1rem' }}>
        Transaction History
      </h3>

      {history.length === 0 ? (
        <div className="empty-state">
          <p>No points transactions yet. Place an order to earn points!</p>
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ background: '#faf7f2', borderBottom: '2px solid #e8e0d5' }}>
                <th style={{ padding: '0.75rem 1rem', textAlign: 'left', color: '#5D4E37', fontWeight: 700 }}>Date</th>
                <th style={{ padding: '0.75rem 1rem', textAlign: 'left', color: '#5D4E37', fontWeight: 700 }}>Description</th>
                <th style={{ padding: '0.75rem 1rem', textAlign: 'left', color: '#5D4E37', fontWeight: 700 }}>Type</th>
                <th style={{ padding: '0.75rem 1rem', textAlign: 'right', color: '#5D4E37', fontWeight: 700 }}>Points</th>
              </tr>
            </thead>
            <tbody>
              {history.map((entry, index) => {
                const isEarned = entry.transaction_type === 'earned' || entry.points > 0;
                return (
                  <tr key={index} style={{ borderBottom: '1px solid #f0ebe5' }}>
                    <td style={{ padding: '0.75rem 1rem', color: '#8B6F5E' }}>
                      {new Date(entry.created_at || entry.createdAt).toLocaleDateString('en-US', {
                        year: 'numeric', month: 'short', day: 'numeric'
                      })}
                    </td>
                    <td style={{ padding: '0.75rem 1rem', color: '#2C1810' }}>
                      {entry.description || entry.reason || 'Points transaction'}
                    </td>
                    <td style={{ padding: '0.75rem 1rem' }}>
                      <span style={{
                        padding: '2px 10px',
                        borderRadius: 999,
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        background: isEarned ? '#D1FAE5' : '#FEE2E2',
                        color: isEarned ? '#065F46' : '#991B1B',
                      }}>
                        {isEarned ? 'Earned' : 'Redeemed'}
                      </span>
                    </td>
                    <td style={{ padding: '0.75rem 1rem', textAlign: 'right', fontWeight: 700,
                      color: isEarned ? '#059669' : '#DC2626', fontSize: '1rem' }}>
                      {isEarned ? '+' : '-'}{Math.abs(entry.points)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

// ══════════════════════════════════════════
// SELLER SHOP INFO
// ══════════════════════════════════════════
const SellerShopInfo = ({ t, navigate }) => {
  const [seller, setSeller]   = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    sellerAPI.getProfile()
      .then((res) => { if (res.data.success) setSeller(res.data.data); })
      .catch((err) => console.error('Seller profile error:', err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading">{t('common.loading')}</div>;
  if (!seller) return <div className="empty-state"><p>Shop info not available.</p></div>;

  return (
    <div className="seller-shop-section">
      <div className="shop-profile-header">
        <div className="shop-logo-wrap">
          {seller.shop_logo ? (
            <img src={`${API_URL}${seller.shop_logo}`} alt={seller.shop_name} className="shop-logo-img" />
          ) : (
            <div className="shop-logo-placeholder">{seller.shop_name?.[0]?.toUpperCase() || 'S'}</div>
          )}
        </div>
        <div className="shop-header-info">
          <h2>{seller.shop_name}</h2>
          <p className="shop-city">📍 {seller.city}</p>
          <span className={`shop-status-badge ${seller.approval_status}`}>
            {seller.approval_status === 'approved' ? '✅ Approved Seller'
              : seller.approval_status === 'pending' ? '⏳ Pending Approval'
              : '❌ Rejected'}
          </span>
        </div>
      </div>
      <div className="info-grid" style={{ marginTop: '1.5rem' }}>
        <div className="info-item full-width"><label>Shop Description</label><p>{seller.shop_description || t('profile.not_provided')}</p></div>
        <div className="info-item"><label>City</label><p>{seller.city || t('profile.not_provided')}</p></div>
        <div className="info-item full-width"><label>Address</label><p>{seller.address || t('profile.not_provided')}</p></div>
        <div className="info-item"><label>Citizenship Number</label><p>{seller.citizenship_number || t('profile.not_provided')}</p></div>
        <div className="info-item"><label>Bank Name</label><p>{seller.bank_name || t('profile.not_provided')}</p></div>
        <div className="info-item"><label>Account Number</label><p>{seller.bank_account_number || t('profile.not_provided')}</p></div>
      </div>
      {seller.rejection_reason && <div className="rejection-notice"><strong>Rejection Reason:</strong> {seller.rejection_reason}</div>}
      <div style={{ marginTop: '1.5rem' }}>
        <button className="btn-save" onClick={() => navigate('/seller/dashboard')}>🏪 Manage Shop in Dashboard →</button>
      </div>
    </div>
  );
};

export default UserProfile;