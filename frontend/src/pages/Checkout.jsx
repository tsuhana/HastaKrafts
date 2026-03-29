import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { cartAPI, orderAPI, userAPI, pointsAPI } from '../api/axios';
import { useToast } from '../context/ToastContext';
import { useTranslation } from 'react-i18next';
import '../styles/Checkout.css';

const Checkout = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const { t } = useTranslation();
  const [loading, setLoading]     = useState(true);
  const [cart, setCart]           = useState(null);
  const [subtotal, setSubtotal]   = useState(0);
  const [user, setUser]           = useState(null);
  const [placing, setPlacing]     = useState(false);
  const [userPoints, setUserPoints] = useState(0);
  const [redeemPoints, setRedeemPoints] = useState(false);

  const [shippingInfo, setShippingInfo] = useState({
    delivery_name: '', delivery_phone: '', delivery_email: '',
    delivery_address: '', delivery_city: '', delivery_state: '',
    delivery_postal_code: '', delivery_landmark: '',
  });

  const [paymentMethod, setPaymentMethod] = useState('khalti');
  const [errors, setErrors] = useState({});
  const BASE_DELIVERY_FEE = 150;

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      setLoading(true);

      const cartRes = await cartAPI.getCart();
      if (cartRes.data.success) {
        setCart(cartRes.data.data.cart);
        setSubtotal(cartRes.data.data.subtotal);
      }

      const userRes = await userAPI.getProfile();
      if (userRes.data.success) {
        const u = userRes.data.data;
        setUser(u);
        setShippingInfo({
          delivery_name:        u.full_name   || '',
          delivery_phone:       u.phone       || '',
          delivery_email:       u.email       || '',
          delivery_address:     u.address     || '',
          delivery_city:        u.city        || '',
          delivery_state:       u.state       || '',
          delivery_postal_code: u.postal_code || '',
          delivery_landmark:    u.landmark    || '',
        });
      }

      const pointsRes = await pointsAPI.getBalance();
      if (pointsRes.data.success) setUserPoints(pointsRes.data.data.total_points || 0);

    } catch (err) {
      console.error('Checkout fetch error:', err);
      toast.error('Failed to load checkout data');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setShippingInfo({ ...shippingInfo, [e.target.name]: e.target.value });
    if (errors[e.target.name]) setErrors({ ...errors, [e.target.name]: '' });
  };

  const validateForm = () => {
    const newErrors = {};
    if (!shippingInfo.delivery_name.trim())    newErrors.delivery_name    = 'Name is required';
    if (!shippingInfo.delivery_phone.trim())   newErrors.delivery_phone   = 'Phone is required';
    else if (!/^(\+977|977)?[9][6-9][0-9]{8}$/.test(shippingInfo.delivery_phone.replace(/\s/g, '')))
                                               newErrors.delivery_phone   = 'Please provide a valid Nepal phone number';
    if (!shippingInfo.delivery_address.trim()) newErrors.delivery_address = 'Address is required';
    if (!shippingInfo.delivery_city.trim())    newErrors.delivery_city    = 'City is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handlePlaceOrder = async () => {
    if (!validateForm()) { toast.warning('Please fill in all required fields'); return; }
    if (!cart?.items?.length) { toast.error('Your cart is empty'); return; }

    setPlacing(true);
    try {
      const orderData = { ...shippingInfo, payment_method: paymentMethod, redeem_points: redeemPoints };
      const res = await orderAPI.createOrder(orderData);

      if (res.data.success) {
        if (paymentMethod === 'khalti' && res.data.data.payment_url) {
          window.location.href = res.data.data.payment_url;
        } else {
          window.dispatchEvent(new Event('cartUpdated'));
          window.dispatchEvent(new Event('pointsUpdated'));
          toast.success('Order placed successfully!');
          navigate(`/order-confirmation/${res.data.data.order_id}`);
        }
      }
    } catch (err) {
      console.error('Place order error:', err);
      toast.error(err.response?.data?.message || 'Failed to place order');
    } finally {
      setPlacing(false);
    }
  };

  const getImageUrl = (images) => {
    if (!images?.length) return null;
    return `http://localhost:5000${images[0]}`;
  };

  const getDiscountedPrice = (product) => {
    const hasDiscount = product.has_discount === true || product.has_discount === 'true';
    const discountPct = parseInt(product.discount_percentage) || 0;
    if (hasDiscount && discountPct > 0) return Math.round(parseFloat(product.price) * (1 - discountPct / 100));
    return parseFloat(product.price);
  };

  if (loading) {
    return (
      <div className="checkout-loading">
        <div className="spinner"></div>
        <p>{t('common.loading')}</p>
      </div>
    );
  }

  if (!cart?.items?.length) {
    return (
      <div className="checkout-empty">
        <h2>{t('cart.empty')}</h2>
        <button onClick={() => navigate('/products')} className="btn-shop">
          {t('cart.browse_products')}
        </button>
      </div>
    );
  }

  const deliveryFee  = redeemPoints ? 0 : BASE_DELIVERY_FEE;
  const total        = subtotal + deliveryFee;
  const pointsToEarn = Math.floor(subtotal / 100);

  return (
    <div className="checkout-page">
      <div className="checkout-container">
        <h1 className="checkout-title">{t('checkout.title')}</h1>

        <div className="checkout-content">
          <div className="checkout-left">

            {/* Shipping Info */}
            <div className="checkout-section">
              <h2>{t('checkout.shipping_info')}</h2>
              <div className="form-row">
                <div className="form-field">
                  <label>{t('checkout.full_name')} *</label>
                  <input type="text" name="delivery_name" value={shippingInfo.delivery_name} onChange={handleChange} placeholder="Enter full name" className={errors.delivery_name ? 'error' : ''} />
                  {errors.delivery_name && <span className="error-msg">{errors.delivery_name}</span>}
                </div>
                <div className="form-field">
                  <label>{t('checkout.phone')} *</label>
                  <input type="tel" name="delivery_phone" value={shippingInfo.delivery_phone} onChange={handleChange} placeholder="98XXXXXXXX" className={errors.delivery_phone ? 'error' : ''} />
                  {errors.delivery_phone && <span className="error-msg">{errors.delivery_phone}</span>}
                </div>
              </div>

              <div className="form-field">
                <label>{t('checkout.email')}</label>
                <input type="email" name="delivery_email" value={shippingInfo.delivery_email} onChange={handleChange} placeholder="your@email.com" />
              </div>

              <div className="form-field">
                <label>{t('checkout.address')} *</label>
                <textarea name="delivery_address" value={shippingInfo.delivery_address} onChange={handleChange} placeholder="Street address, house number" rows="2" className={errors.delivery_address ? 'error' : ''} />
                {errors.delivery_address && <span className="error-msg">{errors.delivery_address}</span>}
              </div>

              <div className="form-row">
                <div className="form-field">
                  <label>{t('checkout.city')} *</label>
                  <input type="text" name="delivery_city" value={shippingInfo.delivery_city} onChange={handleChange} placeholder="Kathmandu" className={errors.delivery_city ? 'error' : ''} />
                  {errors.delivery_city && <span className="error-msg">{errors.delivery_city}</span>}
                </div>
                <div className="form-field">
                  <label>{t('checkout.province')}</label>
                  <select name="delivery_state" value={shippingInfo.delivery_state} onChange={handleChange}>
                    <option value="">Select Province</option>
                    <option value="Bagmati">Bagmati</option>
                    <option value="Gandaki">Gandaki</option>
                    <option value="Lumbini">Lumbini</option>
                    <option value="Koshi">Koshi</option>
                    <option value="Madhesh">Madhesh</option>
                    <option value="Karnali">Karnali</option>
                    <option value="Sudurpashchim">Sudurpashchim</option>
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-field">
                  <label>{t('checkout.postal_code')}</label>
                  <input type="text" name="delivery_postal_code" value={shippingInfo.delivery_postal_code} onChange={handleChange} placeholder="44600" />
                </div>
                <div className="form-field">
                  <label>{t('checkout.landmark')}</label>
                  <input type="text" name="delivery_landmark" value={shippingInfo.delivery_landmark} onChange={handleChange} placeholder="Near XYZ temple" />
                </div>
              </div>
            </div>

            {/* Payment Method */}
            <div className="checkout-section">
              <h2>{t('checkout.payment_method')}</h2>
              <div className="payment-methods">
                <label className={`payment-option ${paymentMethod === 'khalti' ? 'selected' : ''}`}>
                  <input type="radio" name="payment_method" value="khalti" checked={paymentMethod === 'khalti'} onChange={(e) => setPaymentMethod(e.target.value)} />
                  <div className="payment-content">
                    <span className="payment-logo">{t('checkout.khalti')}</span>
                    <span className="payment-label">{t('checkout.digital_wallet')}</span>
                  </div>
                </label>
                <label className={`payment-option ${paymentMethod === 'cod' ? 'selected' : ''}`}>
                  <input type="radio" name="payment_method" value="cod" checked={paymentMethod === 'cod'} onChange={(e) => setPaymentMethod(e.target.value)} />
                  <div className="payment-content">
                    <span className="payment-logo">COD</span>
                    <span className="payment-label">{t('checkout.cod')}</span>
                  </div>
                </label>
              </div>
            </div>
          </div>

          {/* Order Summary */}
          <div className="checkout-right">
            <div className="order-summary">
              <h2>{t('checkout.order_summary')}</h2>

              <div className="summary-items">
                {cart.items.map((item) => {
                  const hasDiscount     = item.product.has_discount === true || item.product.has_discount === 'true';
                  const discountPct     = parseInt(item.product.discount_percentage) || 0;
                  const originalPrice   = parseFloat(item.product.price);
                  const discountedPrice = getDiscountedPrice(item.product);
                  const isDiscounted    = hasDiscount && discountPct > 0;

                  return (
                    <div key={item.cart_item_id} className="summary-item">
                      <div className="summary-item-image">
                        {getImageUrl(item.product.images)
                          ? <img src={getImageUrl(item.product.images)} alt={item.product.name} />
                          : <div className="no-image">📦</div>}
                      </div>
                      <div className="summary-item-details">
                        <p className="summary-item-name">{item.product.name}</p>
                        <p className="summary-item-qty">{t('common.qty')}: {item.quantity}</p>
                        {isDiscounted && <span className="summary-discount-badge">-{discountPct}% OFF</span>}
                      </div>
                      <div className="summary-item-price-wrap">
                        {isDiscounted && <p className="summary-item-original-price">Rs. {(originalPrice * item.quantity).toLocaleString()}</p>}
                        <p className={`summary-item-price ${isDiscounted ? 'discounted' : ''}`}>
                          Rs. {(discountedPrice * item.quantity).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="summary-divider"></div>

              <div className="summary-row">
                <span>{t('cart.subtotal')}</span>
                <span>Rs. {subtotal.toLocaleString()}</span>
              </div>

              {userPoints >= 150 && (
                <div className="points-redemption-section">
                  <label className="points-checkbox">
                    <input type="checkbox" checked={redeemPoints} onChange={(e) => setRedeemPoints(e.target.checked)} />
                    <div className="points-checkbox-content">
                      <span className="points-icon">💎</span>
                      <div>
                        <strong>{t('checkout.use_points')}</strong>
                        <p>{t('checkout.you_have')} {userPoints} {t('checkout.points')}</p>
                      </div>
                    </div>
                  </label>
                </div>
              )}

              <div className="summary-row">
                <span>{t('cart.delivery')}</span>
                <span className={redeemPoints ? 'free-delivery' : ''}>
                  {redeemPoints ? (
                    <><span className="original-delivery">Rs. {BASE_DELIVERY_FEE}</span><span className="free-text">{t('checkout.free')} 💎</span></>
                  ) : `Rs. ${deliveryFee}`}
                </span>
              </div>

              <div className="summary-divider"></div>

              <div className="summary-total">
                <span>{t('cart.total')}</span>
                <span>Rs. {total.toLocaleString()}</span>
              </div>

              <div className="points-earn-info">
                <span className="points-earn-icon">🎁</span>
                <span>{t('checkout.earn_points', { count: pointsToEarn })}</span>
              </div>

              <button onClick={handlePlaceOrder} disabled={placing} className="btn-place-order">
                {placing
                  ? t('common.loading')
                  : paymentMethod === 'khalti'
                    ? t('checkout.proceed_payment')
                    : t('checkout.place_order')}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;