import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { productAPI, orderAPI } from '../api/axios';
import '../styles/SellerDashboard.css';

const SellerDashboard = () => {
  const [stats, setStats] = useState({
    total: 0,
    totalSales: 0,
    ordersThisMonth: 0,
    activeProducts: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
  });
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const API_URL = 'http://localhost:5000';

  useEffect(() => {
    fetchSellerData();
  }, []);

  const fetchSellerData = async () => {
    try {
      setLoading(true);
      
      // Fetch products
      const productRes = await productAPI.getSellerProducts();
      if (productRes.data.success) {
        const data = productRes.data.data;
        setProducts(data.products || []);
        
        const approved = data.products.filter(p => p.status === 'approved').length;
        
        setStats(prev => ({
          ...prev,
          total: data.products?.length || 0,
          activeProducts: approved,
          pending: data.products.filter(p => p.status === 'pending').length,
          approved,
          rejected: data.products.filter(p => p.status === 'rejected').length,
        }));
      }

      // Fetch orders
      const orderRes = await orderAPI.getSellerOrders();
      if (orderRes.data.success) {
        const orderData = orderRes.data.data;
        setOrders(orderData.orders || []);
        
        setStats(prev => ({
          ...prev,
          totalSales: orderData.stats.total_sales || 0,
          ordersThisMonth: orderData.stats.total_orders || 0,
        }));
      }
    } catch (err) {
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      const res = await orderAPI.updateOrderStatus(orderId, { order_status: newStatus });
      if (res.data.success) {
        alert('Order status updated successfully');
        fetchSellerData();
      }
    } catch (err) {
      console.error('Status update error:', err);
      alert('Failed to update status');
    }
  };

  const handleDelete = async (productId) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;

    try {
      await productAPI.deleteProduct(productId);
      alert('Product deleted successfully');
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
      <div style={{ display: 'flex', gap: '1rem' }}>
        <Link to="/seller/add-product" className="btn-add-product">
         + Add Product
        </Link>
        <Link to="/seller/create-auction" className="btn-add-product">
         + Create Auction
        </Link>
        </div>
    </div>    
      <div className="stats-cards-modern">
        <div className="stat-card-modern stat-sales">
          <div className="stat-label">Total Sales</div>
          <div className="stat-value-large">Rs. {stats.totalSales.toLocaleString()}</div>
          <div className="stat-meta">From all orders</div>
        </div>

        <div className="stat-card-modern stat-orders">
          <div className="stat-label">Total Orders</div>
          <div className="stat-value-large">{stats.ordersThisMonth}</div>
          <div className="stat-meta">{orders.filter(o => o.order.order_status === 'pending').length} pending</div>
        </div>

        <div className="stat-card-modern stat-products">
          <div className="stat-label">Active Products</div>
          <div className="stat-value-large">{stats.activeProducts}</div>
          <div className="stat-meta">{stats.pending} pending review</div>
        </div>

        <div className="stat-card-modern stat-auctions">
          <div className="stat-label">Order Items</div>
          <div className="stat-value-large">{orders.length}</div>
          <div className="stat-meta">All time</div>
        </div>
      </div>

      <div className="section-modern">
        <div className="section-header">
          <h2>Recent Orders</h2>
        </div>

        {orders.length === 0 ? (
          <div className="empty-state-modern">
            <p>No orders yet</p>
          </div>
        ) : (
          <div className="orders-list">
            {orders.slice(0, 10).map((orderItem) => (
              <div key={orderItem.order_item_id} className="order-item">
                <div className="order-info">
                  <div className="order-id">#{orderItem.order.order_number}</div>
                  <div className="order-product">
                    {orderItem.product_name} • Customer: {orderItem.order.user.full_name} • Rs. {parseFloat(orderItem.subtotal).toLocaleString()}
                  </div>
                </div>
                <select
                  value={orderItem.order.order_status}
                  onChange={(e) => handleStatusChange(orderItem.order.order_id, e.target.value)}
                  className={`order-status-select status-${orderItem.order.order_status}`}
                >
                  <option value="pending">Pending</option>
                  <option value="processing">Processing</option>
                  <option value="shipped">Shipped</option>
                  <option value="delivered">Delivered</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="section-modern">
        <div className="section-header">
          <h2>Your Products</h2>
          <Link to="/seller/add-product" className="btn-manage">
            Manage Inventory
          </Link>
        </div>

        {products.length === 0 ? (
          <div className="empty-state-modern">
            <p>No products yet. Add your first handicraft</p>
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
                    <div className="no-image-modern">No Image</div>
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
                    Edit
                  </Link>
                  <button onClick={() => handleDelete(product.product_id)} className="btn-icon">
                    Delete
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