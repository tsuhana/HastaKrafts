import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { productAPI } from '../api/axios';
import '../styles/SellerDashboard.css';

const SellerDashboard = () => {
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
  });
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const API_URL = 'http://localhost:5000';

  useEffect(() => {
    fetchSellerData();
  }, []);

  const fetchSellerData = async () => {
    try {
      setLoading(true);
      const response = await productAPI.getSellerProducts();
      
      if (response.data.success) {
        const data = response.data.data;
        setProducts(data.products || []);
        setStats({
          total: data.total || 0,
          pending: data.pending || 0,
          approved: data.approved || 0,
          rejected: data.rejected || 0,
        });
      }
    } catch (err) {
      console.error('Fetch error:', err);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (productId) => {
    if (!window.confirm('Are you sure you want to delete this product?')) {
      return;
    }

    try {
      await productAPI.deleteProduct(productId);
      alert('Product deleted successfully!');
      fetchSellerData(); // Refresh data
    } catch (err) {
      console.error('Delete error:', err);
      alert('Failed to delete product');
    }
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'approved': return 'badge-approved';
      case 'pending': return 'badge-pending';
      case 'rejected': return 'badge-rejected';
      default: return '';
    }
  };

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="spinner"></div>
        <p>Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className="seller-dashboard">
      <div className="dashboard-header">
        <h1>Seller Dashboard</h1>
        <Link to="/seller/add-product" className="btn-primary">
          + Add New Product
        </Link>
      </div>

      {error && <div className="error-message">{error}</div>}

      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card stat-total">
          <div className="stat-icon">📦</div>
          <div className="stat-info">
            <h3>{stats.total}</h3>
            <p>Total Products</p>
          </div>
        </div>

        <div className="stat-card stat-pending">
          <div className="stat-icon">⏳</div>
          <div className="stat-info">
            <h3>{stats.pending}</h3>
            <p>Pending Approval</p>
          </div>
        </div>

        <div className="stat-card stat-approved">
          <div className="stat-icon">✅</div>
          <div className="stat-info">
            <h3>{stats.approved}</h3>
            <p>Approved</p>
          </div>
        </div>

        <div className="stat-card stat-rejected">
          <div className="stat-icon">❌</div>
          <div className="stat-info">
            <h3>{stats.rejected}</h3>
            <p>Rejected</p>
          </div>
        </div>
      </div>

      {/* Products Table */}
      <div className="products-section">
        <h2>My Products</h2>

        {products.length === 0 ? (
          <div className="empty-state">
            <p>No products yet. Start by adding your first product!</p>
            <Link to="/seller/add-product" className="btn-primary">
              Add Product
            </Link>
          </div>
        ) : (
          <div className="products-table-container">
            <table className="products-table">
              <thead>
                <tr>
                  <th>Image</th>
                  <th>Product Name</th>
                  <th>Category</th>
                  <th>Price</th>
                  <th>Stock</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => (
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
                    <td>{product.Category?.name || 'N/A'}</td>
                    <td className="product-price">Rs. {parseFloat(product.price).toLocaleString()}</td>
                    <td>
                      <span className={product.stock > 0 ? 'stock-available' : 'stock-out'}>
                        {product.stock > 0 ? `${product.stock} units` : 'Out of Stock'}
                      </span>
                    </td>
                    <td>
                      <span className={`status-badge ${getStatusBadgeClass(product.status)}`}>
                        {product.status}
                      </span>
                      {product.status === 'rejected' && product.rejection_reason && (
                        <div className="rejection-reason" title={product.rejection_reason}>
                          ⚠️ Reason
                        </div>
                      )}
                    </td>
                    <td className="actions-cell">
                      <Link 
                        to={`/seller/edit-product/${product.product_id}`}
                        className="btn-edit"
                        title="Edit"
                      >
                        ✏️
                      </Link>
                      <button 
                        onClick={() => handleDelete(product.product_id)}
                        className="btn-delete"
                        title="Delete"
                      >
                        🗑️
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default SellerDashboard;