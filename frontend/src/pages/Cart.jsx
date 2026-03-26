import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { cartAPI } from '../api/axios';
import { useToast } from '../context/ToastContext';
import { useTranslation } from 'react-i18next';
import ConfirmModal from '../components/ConfirmModal';
import '../styles/Cart.css';

const calculateDiscountedPrice = (price, hasDiscount, discountPercentage) => {
  if (!hasDiscount || !discountPercentage) return price;
  return Math.round(price * (1 - discountPercentage / 100));
};

const Cart = () => {
  const navigate = useNavigate();
  const toast    = useToast();
  const { t }    = useTranslation();
  const [loading, setLoading]   = useState(true);
  const [cart, setCart]         = useState(null);
  const [updating, setUpdating] = useState(false);
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, cartItemId: null });

  useEffect(() => { fetchCart(); }, []);

  const fetchCart = async () => {
    try {
      setLoading(true);
      const res = await cartAPI.getCart();
      if (res.data.success) {
        setCart(res.data.data.cart);
        //  Always sync navbar badge when cart page loads
        window.dispatchEvent(new Event('cartUpdated'));
      }
    } catch (err) {
      console.error('Error fetching cart:', err);
      if (err.response?.status === 401) navigate('/login');
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
        await fetchCart();
        //  Update navbar badge
        window.dispatchEvent(new Event('cartUpdated'));
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update quantity');
    } finally {
      setUpdating(false);
    }
  };

  const removeItem = (cartItemId) => setConfirmModal({ isOpen: true, cartItemId });

  const handleConfirmRemove = async () => {
    const { cartItemId } = confirmModal;
    setConfirmModal({ isOpen: false, cartItemId: null });
    setUpdating(true);
    try {
      const res = await cartAPI.removeFromCart(cartItemId);
      if (res.data.success) {
        await fetchCart();
        //  Update navbar badge
        window.dispatchEvent(new Event('cartUpdated'));
      }
    } catch {
      toast.error('Failed to remove item');
    } finally {
      setUpdating(false);
    }
  };

  const getImageUrl = (images) => {
    if (!images?.length) return null;
    return `http://localhost:5000${images[0]}`;
  };

  const subtotal = cart?.items?.reduce((sum, item) => {
    const price = calculateDiscountedPrice(item.product.price, item.product.has_discount, item.product.discount_percentage);
    return sum + price * item.quantity;
  }, 0) || 0;

  const deliveryFee = 150;
  const total = subtotal + deliveryFee;

  if (loading) {
    return (
      <div className="cart-loading">
        <div className="spinner"></div>
        <p>{t('common.loading')}</p>
      </div>
    );
  }

  if (!cart?.items?.length) {
    return (
      <div className="cart-empty">
        <div className="empty-cart-icon">🛒</div>
        <h2>{t('cart.empty')}</h2>
        <p>{t('cart.empty_desc')}</p>
        <button onClick={() => navigate('/products')} className="btn-shop">
          {t('cart.browse_products')}
        </button>
      </div>
    );
  }

  return (
    <div className="cart-page">
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title="Remove this item?"
        message="This item will be removed from your cart."
        confirmText={t('cart.remove')}
        cancelText={t('common.cancel')}
        confirmVariant="danger"
        onConfirm={handleConfirmRemove}
        onCancel={() => setConfirmModal({ isOpen: false, cartItemId: null })}
      />

      <div className="cart-container">
        <div className="cart-content">

          <div className="cart-items-section">
            <div className="cart-header">
              <h1>{t('cart.title')}</h1>
              <span className="items-count">
                {cart.items.length} {cart.items.length === 1 ? t('cart.item') : t('cart.items')}
              </span>
            </div>

            <div className="cart-items-list">
              {cart.items.map((item) => {
                const discountedPrice = calculateDiscountedPrice(
                  item.product.price, item.product.has_discount, item.product.discount_percentage
                );
                const hasDiscount = item.product.has_discount && item.product.discount_percentage > 0;

                return (
                  <div key={item.cart_item_id} className="cart-item">
                    <div className="item-image">
                      {getImageUrl(item.product.images)
                        ? <img src={getImageUrl(item.product.images)} alt={item.product.name} />
                        : <div className="no-image">📦</div>}
                      <div className="item-category">{item.product.seller?.shop_name || 'Product'}</div>
                      {hasDiscount && <div className="cart-discount-badge">-{item.product.discount_percentage}%</div>}
                    </div>

                    <div className="item-details">
                      <h3 className="item-name">{item.product.name}</h3>
                      <p className="item-seller">By {item.product.seller?.shop_name} ✓</p>
                      <div className="item-price-section">
                        {hasDiscount ? (
                          <div className="price-with-discount">
                            <span className="original-price-cart">Rs. {parseFloat(item.product.price).toLocaleString()}</span>
                            <span className="discounted-price-cart">Rs. {discountedPrice.toLocaleString()}</span>
                          </div>
                        ) : (
                          <p className="item-price">Rs. {item.product.price.toLocaleString()}</p>
                        )}
                      </div>
                    </div>

                    <div className="item-actions">
                      <div className="quantity-controls">
                        <button onClick={() => updateQuantity(item.cart_item_id, item.quantity - 1)} disabled={updating || item.quantity <= 1} className="qty-btn">−</button>
                        <input type="number" value={item.quantity} readOnly className="qty-input" />
                        <button onClick={() => updateQuantity(item.cart_item_id, item.quantity + 1)} disabled={updating || item.quantity >= item.product.stock_quantity} className="qty-btn">+</button>
                      </div>
                      <div className="item-total">Rs. {(discountedPrice * item.quantity).toLocaleString()}</div>
                      <button onClick={() => removeItem(item.cart_item_id)} disabled={updating} className="btn-remove">
                        {t('cart.remove')}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="order-summary-section">
            <div className="order-summary-card">
              <h2>{t('checkout.order_summary')}</h2>
              <div className="summary-row">
                <span>{t('cart.subtotal')}</span>
                <span>Rs. {subtotal.toLocaleString()}</span>
              </div>
              <div className="summary-row">
                <span>{t('cart.delivery')}</span>
                <span>Rs. {deliveryFee}</span>
              </div>
              <div className="summary-divider"></div>
              <div className="summary-total">
                <span>{t('cart.total')}</span>
                <span className="total-amount">Rs. {total.toLocaleString()}</span>
              </div>
              <button onClick={() => navigate('/checkout')} className="btn-checkout" disabled={updating}>
                {t('cart.checkout')}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;