import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { orderAPI } from '../api/axios';
import '../styles/OrderConfirmation.css';

const OrderConfirmation = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [order, setOrder] = useState(null);

  useEffect(() => {
    fetchOrder();
  }, [id]);

  const fetchOrder = async () => {
    try {
      setLoading(true);
      const res = await orderAPI.getOrderById(id);
      if (res.data.success) {
        setOrder(res.data.data);
      }
    } catch (err) {
      console.error('Error fetching order:', err);
      alert('Failed to load order details');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="confirmation-loading">
        <div className="spinner"></div>
        <p>Loading order details...</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="confirmation-error">
        <h2>Order not found</h2>
        <button onClick={() => navigate('/products')} className="btn-shop">
          Continue Shopping
        </button>
      </div>
    );
  }

  return (
    <div className="order-confirmation-page">
      <div className="confirmation-container">
        <div className="success-icon">✓</div>
        <h1>Order Placed Successfully!</h1>
        <p className="thank-you">Thank you for your order</p>

        <div className="order-details-card">
          <div className="order-header">
            <h2>Order Details</h2>
            <span className="order-number">#{order.order_number}</span>
          </div>

          <div className="order-info-grid">
            <div className="info-item">
              <label>Order Date</label>
              <p>{new Date(order.created_at).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}</p>
            </div>

            <div className="info-item">
              <label>Payment Method</label>
              <p className="payment-badge">
                {order.payment_method === 'khalti' ? 'Khalti' : 'Cash on Delivery'}
              </p>
            </div>

            <div className="info-item">
              <label>Payment Status</label>
              <p className={`status-badge ${order.payment_status}`}>
                {order.payment_status}
              </p>
            </div>

            <div className="info-item">
              <label>Total Amount</label>
              <p className="total-amount">Rs. {parseFloat(order.total).toLocaleString()}</p>
            </div>
          </div>

          <div className="delivery-section">
            <h3>Delivery Information</h3>
            <div className="delivery-info">
              <p><strong>{order.delivery_name}</strong></p>
              <p>{order.delivery_phone}</p>
              <p>{order.delivery_email}</p>
              <p>{order.delivery_address}</p>
              <p>{order.delivery_city}, {order.delivery_state} {order.delivery_postal_code}</p>
              {order.delivery_landmark && <p>Landmark: {order.delivery_landmark}</p>}
            </div>
          </div>

          <div className="items-section">
            <h3>Order Items</h3>
            <div className="order-items-list">
              {order.items && order.items.map((item) => (
                <div key={item.order_item_id} className="order-item">
                  <div className="item-image">
                    {item.product_image ? (
                      <img src={`http://localhost:5000${item.product_image}`} alt={item.product_name} />
                    ) : (
                      <div className="no-image">No Image</div>
                    )}
                  </div>
                  <div className="item-details">
                    <p className="item-name">{item.product_name}</p>
                    <p className="item-qty">Quantity: {item.quantity}</p>
                  </div>
                  <p className="item-price">Rs. {parseFloat(item.subtotal).toLocaleString()}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="order-summary">
            <div className="summary-row">
              <span>Subtotal</span>
              <span>Rs. {parseFloat(order.subtotal).toLocaleString()}</span>
            </div>
            <div className="summary-row">
              <span>Delivery Fee</span>
              <span>Rs. {parseFloat(order.delivery_fee).toLocaleString()}</span>
            </div>
            <div className="summary-divider"></div>
            <div className="summary-total">
              <span>Total</span>
              <span>Rs. {parseFloat(order.total).toLocaleString()}</span>
            </div>
          </div>
        </div>

        <div className="action-buttons">
          <button onClick={() => navigate('/products')} className="btn-continue">
            Continue Shopping
          </button>
          <button onClick={() => navigate('/profile')} className="btn-view-orders">
            View My Orders
          </button>
        </div>
      </div>
    </div>
  );
};

export default OrderConfirmation;