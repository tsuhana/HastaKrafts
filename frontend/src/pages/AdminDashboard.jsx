import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { adminAPI } from '../api/axios';
import '../styles/AdminDashboard.css';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalSellers: 0,
    pendingSellers: 0,
    totalProducts: 0,
    pendingProducts: 0,
  });
  const [pendingSellers, setPendingSellers] = useState([]);
  const [pendingProducts, setPendingProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  const API_URL = 'http://localhost:5000';

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      const statsRes = await adminAPI.getDashboardStats();
      if (statsRes.data.success) {
        setStats(statsRes.data.data);
      }

      const sellersRes = await adminAPI.getPendingSellers();
      if (sellersRes.data.success) {
        setPendingSellers(sellersRes.data.data);
      }

      const productsRes = await adminAPI.getPendingProducts();
      if (productsRes.data.success) {
        setPendingProducts(productsRes.data.data);
      }

    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveSeller = async (sellerId) => {
    if (!window.confirm('Approve this seller?')) return;

    try {
      const res = await adminAPI.approveSeller(sellerId);
      if (res.data.success) {
        alert('Seller approved successfully!');
        fetchDashboardData();
      }
    } catch (err) {
      console.error('Error approving seller:', err);
      alert('Failed to approve seller');
    }
  };

  const handleRejectSeller = async (sellerId) => {
    const reason = prompt('Enter rejection reason:');
    if (!reason) return;

    try {
      const res = await adminAPI.rejectSeller(sellerId, { reason });
      if (res.data.success) {
        alert('Seller rejected');
        fetchDashboardData();
      }
    } catch (err) {
      console.error('Error rejecting seller:', err);
      alert('Failed to reject seller');
    }
  };

  const handleApproveProduct = async (productId) => {
    if (!window.confirm('Approve this product?')) return;

    try {
      const res = await adminAPI.approveProduct(productId);
      if (res.data.success) {
        alert('Product approved successfully!');
        fetchDashboardData();
      }
    } catch (err) {
      console.error('Error approving product:', err);
      alert('Failed to approve product');
    }
  };

  const handleRejectProduct = async (productId) => {
    const reason = prompt('Enter rejection reason:');
    if (!reason) return;

    try {
      const res = await adminAPI.rejectProduct(productId, { reason });
      if (res.data.success) {
        alert('Product rejected');
        fetchDashboardData();
      }
    } catch (err) {
      console.error('Error rejecting product:', err);
      alert('Failed to reject product');
    }
  };

  if (loading) {
    return (
      <div className="admin-loading">
        <div className="spinner"></div>
        <p>Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className="admin-dashboard-container">
      {/* Sidebar */}
      <aside className="admin-sidebar">
        <div className="sidebar-header">
          <h2>Admin Panel</h2>
        </div>
        
        <nav className="sidebar-nav">
          <button 
            className={`nav-item ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            <span className="nav-icon">📊</span>
            Overview
          </button>
          
          <button 
            className={`nav-item ${activeTab === 'sellers' ? 'active' : ''}`}
            onClick={() => setActiveTab('sellers')}
          >
            <span className="nav-icon">🏪</span>
            Artisan Verification
            {pendingSellers.length > 0 && (
              <span className="badge">{pendingSellers.length}</span>
            )}
          </button>
          
          <button 
            className={`nav-item ${activeTab === 'products' ? 'active' : ''}`}
            onClick={() => setActiveTab('products')}
          >
            <span className="nav-icon">📦</span>
            Product Approvals
            {pendingProducts.length > 0 && (
              <span className="badge">{pendingProducts.length}</span>
            )}
          </button>
          
          <button 
            className={`nav-item ${activeTab === 'users' ? 'active' : ''}`}
            onClick={() => setActiveTab('users')}
          >
            <span className="nav-icon">👥</span>
            Manage Users
          </button>
          
          <button 
            className={`nav-item ${activeTab === 'analytics' ? 'active' : ''}`}
            onClick={() => setActiveTab('analytics')}
          >
            <span className="nav-icon">📈</span>
            Analytics
          </button>
          
          <button 
            className={`nav-item ${activeTab === 'settings' ? 'active' : ''}`}
            onClick={() => setActiveTab('settings')}
          >
            <span className="nav-icon">⚙️</span>
            Settings
          </button>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="admin-main">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="admin-content">
            <h1>Dashboard Overview</h1>
            
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-icon">👥</div>
                <div className="stat-info">
                  <h3>{stats.totalUsers}</h3>
                  <p>Total Users</p>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon">🏪</div>
                <div className="stat-info">
                  <h3>{stats.totalSellers}</h3>
                  <p>Total Sellers</p>
                </div>
              </div>

              <div className="stat-card stat-pending">
                <div className="stat-icon">⏳</div>
                <div className="stat-info">
                  <h3>{stats.pendingSellers}</h3>
                  <p>Pending Sellers</p>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon">📦</div>
                <div className="stat-info">
                  <h3>{stats.totalProducts}</h3>
                  <p>Total Products</p>
                </div>
              </div>

              <div className="stat-card stat-pending">
                <div className="stat-icon">⏱️</div>
                <div className="stat-info">
                  <h3>{stats.pendingProducts}</h3>
                  <p>Pending Products</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Artisan Verification Tab */}
        {activeTab === 'sellers' && (
          <div className="admin-content">
            <h1>Artisan Verification Requests</h1>
            
            {pendingSellers.length === 0 ? (
              <div className="empty-state">
                <p>No pending seller verifications</p>
              </div>
            ) : (
              <div className="verification-grid">
                {pendingSellers.map((seller) => (
                  <div key={seller.seller_id} className="verification-card">
                    <div className="seller-avatar">
                      {seller.User?.full_name?.substring(0, 2).toUpperCase()}
                    </div>
                    <div className="seller-info">
                      <h3>{seller.User?.full_name}</h3>
                      <p className="craft-type">{seller.shop_name}</p>
                      <p className="location">📍 {seller.city}, {seller.address}</p>
                      <p className="experience">Experience: {seller.experience || 'N/A'}</p>
                      <p className="applied">Applied: {new Date(seller.created_at).toLocaleDateString()}</p>
                    </div>
                    <div className="action-buttons">
                      <button 
                        onClick={() => handleApproveSeller(seller.seller_id)}
                        className="btn-approve"
                      >
                        ✓ Approve
                      </button>
                      <button 
                        onClick={() => handleRejectSeller(seller.seller_id)}
                        className="btn-reject"
                      >
                        ✗ Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Products Tab */}
        {activeTab === 'products' && (
          <div className="admin-content">
            <h1>Pending Product Approvals</h1>
            
            {pendingProducts.length === 0 ? (
              <div className="empty-state">
                <p>No pending products</p>
              </div>
            ) : (
              <div className="products-table-container">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Image</th>
                      <th>Product Name</th>
                      <th>Seller</th>
                      <th>Category</th>
                      <th>Price</th>
                      <th>Stock</th>
                      <th>Submitted</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pendingProducts.map((product) => (
                      <tr key={product.product_id}>
                        <td>
                          <div className="product-image-cell">
                            {product.images && product.images.length > 0 ? (
                              <img 
                                src={`${API_URL}${product.images[0]}`} 
                                alt={product.name}
                              />
                            ) : (
                              <div className="no-image">📦</div>
                            )}
                          </div>
                        </td>
                        <td className="product-name">{product.name}</td>
                        <td>{product.Seller?.User?.full_name}</td>
                        <td>{product.Category?.name}</td>
                        <td className="product-price">Rs. {parseFloat(product.price).toLocaleString()}</td>
                        <td>{product.stock}</td>
                        <td>{new Date(product.created_at).toLocaleDateString()}</td>
                        <td className="actions-cell">
                          <button 
                            onClick={() => handleApproveProduct(product.product_id)}
                            className="btn-approve"
                          >
                            ✓
                          </button>
                          <button 
                            onClick={() => handleRejectProduct(product.product_id)}
                            className="btn-reject"
                          >
                            ✗
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Other Tabs (Placeholders) */}
        {activeTab === 'users' && (
          <div className="admin-content">
            <h1>Manage Users</h1>
            <p>Coming soon...</p>
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="admin-content">
            <h1>Analytics</h1>
            <p>Coming soon...</p>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="admin-content">
            <h1>Settings</h1>
            <p>Coming soon...</p>
          </div>
        )}
      </main>
    </div>
  );
};

export default AdminDashboard;