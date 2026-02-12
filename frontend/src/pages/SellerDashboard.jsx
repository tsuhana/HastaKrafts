import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { productAPI } from '../api/axios';
import '../styles/SellerDashboard.css';

const SellerDashboard = () => {
  const [stats, setStats] = useState({
    total: 0,
    totalSales: 0,
    ordersThisMonth: 0,
    activeProducts: 0,
    activeAuctions: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
  });
  const [products, setProducts] = useState([]);
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);

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
        
        // Calculate stats
        const approved = data.products.filter(p => p.status === 'approved').length;
        
        setStats({
          total: data.products?.length || 0,
          totalSales: 124500, // Mock data - will be real when orders implemented
          ordersThisMonth: 48, // Mock
          activeProducts: approved,
          activeAuctions: 3, // Mock
          pending: data.products.filter(p => p.status === 'pending').length,
          approved,
          rejected: data.products.filter(p => p.status === 'rejected').length,
        });

        // Mock recent orders
        setRecentOrders([
          { id: '#ORD-2024-1245', product: 'Traditional Clay Pot', customer: 'Anita Sharma', amount: 2500, status: 'pending' },
          { id: '#ORD-2024-1244', product: 'Handwoven Basket', customer: 'Rajesh Kumar', amount: 1800, status: 'processing' },
          { id: '#ORD-2024-1243', product: 'Rudraksha Mala', customer: 'Priya Thapa', amount: 3200, status: 'shipped' },
        ]);
      }
    } catch (err) {
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (productId) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;

    try {
      await productAPI.deleteProduct(productId);
      alert('Product deleted successfully!');
      fetchSellerData();
    } catch (err) {
      alert('Failed to delete product');
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
    <div className="artisan-dashboard">
      <div className="dashboard-header-new">
        <h1>Artisan Dashboard</h1>
        <Link to="/seller/add-product" className="btn-add-product">
          + Add New Product
        </Link>
      </div>

      {/* Stats Cards - Figma Style */}
      <div className="stats-cards-modern">
        <div className="stat-card-modern stat-sales">
          <div className="stat-label">Total Sales</div>
          <div className="stat-value-large">Rs. {stats.totalSales.toLocaleString()}</div>
          <div className="stat-meta">↗ 12% from last month</div>
        </div>

        <div className="stat-card-modern stat-orders">
          <div className="stat-label">Orders This Month</div>
          <div className="stat-value-large">{stats.ordersThisMonth}</div>
          <div className="stat-meta">↗ 8 new orders</div>
        </div>

        <div className="stat-card-modern stat-products">
          <div className="stat-label">Active Products</div>
          <div className="stat-value-large">{stats.activeProducts}</div>
          <div className="stat-meta">{stats.pending} pending review</div>
        </div>

        <div className="stat-card-modern stat-auctions">
          <div className="stat-label">Active Auctions</div>
          <div className="stat-value-large">{stats.activeAuctions}</div>
          <div className="stat-meta">Ending in 2-5 hours</div>
        </div>
      </div>

      {/* Recent Orders */}
      <div className="section-modern">
        <div className="section-header">
          <h2>Recent Orders</h2>
          <button className="btn-view-all">View All</button>
        </div>

        <div className="orders-list">
          {recentOrders.map((order) => (
            <div key={order.id} className="order-item">
              <div className="order-info">
                <div className="order-id">{order.id}</div>
                <div className="order-product">{order.product} • Customer: {order.customer} • Rs. {order.amount}</div>
              </div>
              <span className={`order-status status-${order.status}`}>
                {order.status}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Your Products */}
      <div className="section-modern">
        <div className="section-header">
          <h2>Your Products</h2>
          <Link to="/seller/add-product" className="btn-manage">
            Manage Inventory
          </Link>
        </div>

        {products.length === 0 ? (
          <div className="empty-state-modern">
            <p>No products yet. Add your first handicraft!</p>
            <Link to="/seller/add-product" className="btn-add-product">
              Add Product
            </Link>
          </div>
        ) : (
          <div className="products-grid-modern">
            {products.slice(0, 6).map((product) => (
              <div key={product.product_id} className="product-card-modern">
                <div className="product-image-modern">
                  {product.images && product.images.length > 0 ? (
                    <img src={`${API_URL}${product.images[0]}`} alt={product.name} />
                  ) : (
                    <div className="no-image-modern">📦</div>
                  )}
                  <span className={`product-status-badge status-${product.status}`}>
                    {product.status}
                  </span>
                </div>
                <div className="product-details-modern">
                  <h4>{product.name}</h4>
                  <p className="product-price-modern">Rs. {parseFloat(product.price).toLocaleString()}</p>
                  <p className="product-stock-modern">{product.stock_quantity} in stock</p>
                </div>
                <div className="product-actions-modern">
                  <Link to={`/seller/edit-product/${product.product_id}`} className="btn-icon">
                    ✏️
                  </Link>
                  <button onClick={() => handleDelete(product.product_id)} className="btn-icon">
                    🗑️
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SellerDashboard;