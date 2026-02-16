import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { cartAPI } from '../api/axios';
import '../styles/Cart.css';

const Cart = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState(null);
  const [subtotal, setSubtotal] = useState(0);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetchCart();
  }, []);

  const fetchCart = async () => {
    try {
      setLoading(true);
      const res = await cartAPI.getCart();
      if (res.data.success) {
        setCart(res.data.data.cart);
        setSubtotal(res.data.data.subtotal);
      }
    } catch (err) {
      console.error('Error fetching cart:', err);
      if (err.response?.status === 401) {
        navigate('/login');
      }
    } finally {
      setLoading(false);
    }
  };

  const updateQuantity = async (cartItemId, newQuantity) => {
    if (newQuantity < 1) return;
    
    setUpdating(true);
    try {
      const res = await cartAPI.updateCartItem(cartItemId, { quantity: newQuantity });
      if (res.data.success) {
        fetchCart();
      }
    } catch (err) {
      console.error('Error updating quantity:', err);
      alert(err.response?.data?.message || 'Failed to update quantity');
    } finally {
      setUpdating(false);
    }
  };

  const removeItem = async (cartItemId) => {
    if (!window.confirm('Remove this item from cart?')) return;

    setUpdating(true);
    try {
      const res = await cartAPI.removeFromCart(cartItemId);
      if (res.data.success) {
        fetchCart();
      }
    } catch (err) {
      console.error('Error removing item:', err);
      alert('Failed to remove item');
    } finally {
      setUpdating(false);
    }
  };

  const getImageUrl = (images) => {
    if (!images || images.length === 0) return null;
    return `http://localhost:5000${images[0]}`;
  };

  const deliveryFee = 150;
  const total = subtotal + deliveryFee;

  if (loading) {
    return (
      <div className="cart-loading">
        <div className="spinner"></div>
        <p>Loading cart...</p>
      </div>
    );
  }

  if (!cart || !cart.items || cart.items.length === 0) {
    return (
      <div className="cart-empty">
        <div className="empty-cart-icon">🛒</div>
        <h2>Your cart is empty</h2>
        <p>Add some products to get started!</p>
        <button onClick={() => navigate('/products')} className="btn-shop">
          Browse Products
        </button>
      </div>
    );
  }

  return (
    <div className="cart-page">
      <div className="cart-container">
        <div className="cart-content">
          {/* Cart Items */}
          <div className="cart-items-section">
            <div className="cart-header">
              <h1>Shopping Cart</h1>
              <span className="items-count">{cart.items.length} items</span>
            </div>

            <div className="cart-items-list">
              {cart.items.map((item) => (
                <div key={item.cart_item_id} className="cart-item">
                  <div className="item-image">
                    {getImageUrl(item.product.images) ? (
                      <img src={getImageUrl(item.product.images)} alt={item.product.name} />
                    ) : (
                      <div className="no-image">📦</div>
                    )}
                    <div className="item-category">
                      {item.product.seller?.shop_name || 'Product'}
                    </div>
                  </div>

                  <div className="item-details">
                    <h3 className="item-name">{item.product.name}</h3>
                    <p className="item-seller">By {item.product.seller?.shop_name} ✓</p>
                    <p className="item-price">Rs. {item.product.price.toLocaleString()}</p>
                  </div>

                  <div className="item-actions">
                    <div className="quantity-controls">
                      <button
                        onClick={() => updateQuantity(item.cart_item_id, item.quantity - 1)}
                        disabled={updating || item.quantity <= 1}
                        className="qty-btn"
                      >
                        −
                      </button>
                      <input
                        type="number"
                        value={item.quantity}
                        readOnly
                        className="qty-input"
                      />
                      <button
                        onClick={() => updateQuantity(item.cart_item_id, item.quantity + 1)}
                        disabled={updating || item.quantity >= item.product.stock_quantity}
                        className="qty-btn"
                      >
                        +
                      </button>
                    </div>

                    <button
                      onClick={() => removeItem(item.cart_item_id)}
                      disabled={updating}
                      className="btn-remove"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Order Summary */}
          <div className="order-summary-section">
            <div className="order-summary-card">
              <h2>Order Summary</h2>

              <div className="summary-row">
                <span>Subtotal</span>
                <span>Rs. {subtotal.toLocaleString()}</span>
              </div>

              <div className="summary-row">
                <span>Delivery</span>
                <span>Rs. {deliveryFee}</span>
              </div>

              
              <div className="summary-divider"></div>

              <div className="summary-total">
                <span>Total</span>
                <span className="total-amount">Rs. {total.toLocaleString()}</span>
              </div>

              <button
                onClick={() => navigate('/checkout')}
                className="btn-checkout"
                disabled={updating}
              >
                Proceed to Checkout
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;