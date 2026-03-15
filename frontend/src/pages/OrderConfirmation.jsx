import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { orderAPI } from '../api/axios';
import { useToast } from '../context/ToastContext';
import { useTranslation } from 'react-i18next';
import '../styles/OrderConfirmation.css';

const OrderConfirmation = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [order, setOrder] = useState(null);

  useEffect(() => { fetchOrder(); }, [id]);

  const fetchOrder = async () => {
    try {
      setLoading(true);
      const res = await orderAPI.getOrderById(id);
      if (res.data.success) setOrder(res.data.data);
    } catch (err) {
      console.error('Error fetching order:', err);
      toast.error('Failed to load order details');
    } finally {
      setLoading(false);
    }
  };

  const getStatusSteps = () => {
    const allSteps = ['pending', 'processing', 'shipped', 'delivered'];
    const currentIndex = allSteps.indexOf(order?.order_status);
    return allSteps.map((step, index) => ({
      label: t(`orders.${step}`),
      status: step,
      completed: index <= currentIndex,
      active: index === currentIndex,
    }));
  };

  if (loading) {
    return (
      <div className="confirmation-loading">
        <div className="spinner"></div>
        <p>{t('common.loading')}</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="confirmation-error">
        <h2>Order not found</h2>
        <button onClick={() => navigate('/products')} className="btn-shop">Continue Shopping</button>
      </div>
    );
  }

  return (
    <div className="order-confirmation-page">
      <div className="confirmation-container">
        <div className="success-icon">✓</div>
        <h1>Order Placed Successfully!</h1>
        <p className="thank-you">Thank you for your order</p>

        {order.order_status !== 'cancelled' && (
          <div className="order-status-timeline">
            <h3>Order Status</h3>
            <div className="timeline-steps">
              {getStatusSteps().map((step, index) => (
                <div key={step.status} className={`timeline-step ${step.completed ? 'completed' : ''} ${step.active ? 'active' : ''}`}>
                  <div className="step-circle">{step.completed ? '✓' : index + 1}</div>
                  <div className="step-label">{step.label}</div>
                  {index < 3 && <div className="step-line"></div>}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="order-details-card">
          {order.points_earned > 0 && (
            <div className="points-earned-card">
              <div className="points-earned-icon">🎉</div>
              <div className="points-earned-content">
                <h3>Congratulations!</h3>
                <p>You earned <strong>{order.points_earned} points</strong> from this order!</p>
                {order.points_redeemed > 0 && (
                  <p className="points-redeemed-text">(You redeemed {order.points_redeemed} points for free delivery)</p>
                )}
              </div>
            </div>
          )}

          <div className="order-header">
            <h2>Order Details</h2>
            <span className="order-number">#{order.order_number}</span>
          </div>

          <div className="order-info-grid">
            <div className="info-item">
              <label>{t('orders.order_date')}</label>
              <p>{new Date(order.createdAt || order.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
            </div>
            <div className="info-item">
              <label>Payment Method</label>
              <p className="payment-badge">{order.payment_method === 'khalti' ? 'Khalti' : 'Cash on Delivery'}</p>
            </div>
            <div className="info-item">
              <label>{t('orders.total')}</label>
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
              {order.items && order.items.map((item) => {
                const isDiscounted = item.discount_percentage > 0;
                const originalTotal = item.original_price ? parseFloat(item.original_price) * item.quantity : null;
                const paidTotal = parseFloat(item.subtotal);
                return (
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
                      <p className="item-qty">{t('common.qty')}: {item.quantity}</p>
                      {isDiscounted && <span className="item-discount-badge">-{item.discount_percentage}% OFF</span>}
                    </div>
                    <div className="item-price-wrap">
                      {isDiscounted && originalTotal && (
                        <p className="item-original-price">Rs. {originalTotal.toLocaleString()}</p>
                      )}
                      <p className={`item-price ${isDiscounted ? 'discounted' : ''}`}>
                        Rs. {paidTotal.toLocaleString()}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="order-summary">
            <div className="summary-row">
              <span>{t('cart.subtotal')}</span>
              <span>Rs. {parseFloat(order.subtotal).toLocaleString()}</span>
            </div>
            <div className="summary-row">
              <span>Delivery Fee</span>
              {parseFloat(order.delivery_fee) === 0 ? (
                <span className="free-delivery-text">{t('checkout.free')} 💎</span>
              ) : (
                <span>Rs. {parseFloat(order.delivery_fee).toLocaleString()}</span>
              )}
            </div>
            <div className="summary-divider"></div>
            <div className="summary-total">
              <span>{t('cart.total')}</span>
              <span>Rs. {parseFloat(order.total).toLocaleString()}</span>
            </div>
          </div>
        </div>

        <div className="action-buttons">
          <button onClick={() => navigate('/products')} className="btn-continue">Continue Shopping</button>
          <button onClick={() => navigate('/profile')} className="btn-view-orders">{t('profile.order_history')}</button>
        </div>
      </div>
    </div>
  );
};

export default OrderConfirmation;