import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { cartAPI, orderAPI, userAPI, pointsAPI } from '../api/axios';
import { useToast } from '../context/ToastContext';
import '../styles/Checkout.css';

const Checkout = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState(null);
  const [subtotal, setSubtotal] = useState(0);
  const [user, setUser] = useState(null);
  const [placing, setPlacing] = useState(false);
  const [userPoints, setUserPoints] = useState(0);
  const [redeemPoints, setRedeemPoints] = useState(false);

  const [shippingInfo, setShippingInfo] = useState({
    delivery_name: '',
    delivery_phone: '',
    delivery_email: '',
    delivery_address: '',
    delivery_city: '',
    delivery_state: '',
    delivery_postal_code: '',
    delivery_landmark: '',
  });

  const [paymentMethod, setPaymentMethod] = useState('khalti');
  const [errors, setErrors] = useState({});

  const BASE_DELIVERY_FEE = 150;

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Fetch cart
      const cartRes = await cartAPI.getCart();
      if (cartRes.data.success) {
        setCart(cartRes.data.data.cart);
        setSubtotal(cartRes.data.data.subtotal); // ✅ already discounted from backend
      }

      // Fetch user profile
      const userRes = await userAPI.getProfile();
      if (userRes.data.success) {
        const userData = userRes.data.data;
        setUser(userData);
        setShippingInfo({
          delivery_name: userData.full_name || '',
          delivery_phone: userData.phone || '',
          delivery_email: userData.email || '',
          delivery_address: userData.address || '',
          delivery_city: userData.city || '',
          delivery_state: userData.state || '',
          delivery_postal_code: userData.postal_code || '',
          delivery_landmark: userData.landmark || '',
        });
      }

      // Fetch user points
      const pointsRes = await pointsAPI.getBalance();
      if (pointsRes.data.success) {
        setUserPoints(pointsRes.data.data.total_points || 0);
      }
    } catch (err) {
      console.error('Error fetching data:', err);
      toast.error('Failed to load checkout data');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setShippingInfo({
      ...shippingInfo,
      [e.target.name]: e.target.value,
    });
    if (errors[e.target.name]) {
      setErrors({ ...errors, [e.target.name]: '' });
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!shippingInfo.delivery_name.trim()) {
      newErrors.delivery_name = 'Name is required';
    }

    if (!shippingInfo.delivery_phone.trim()) {
      newErrors.delivery_phone = 'Phone is required';
    } else if (!/^\d{10}$/.test(shippingInfo.delivery_phone.replace(/\D/g, ''))) {
      newErrors.delivery_phone = 'Phone must be 10 digits';
    }

    if (!shippingInfo.delivery_address.trim()) {
      newErrors.delivery_address = 'Address is required';
    }

    if (!shippingInfo.delivery_city.trim()) {
      newErrors.delivery_city = 'City is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handlePlaceOrder = async () => {
    if (!validateForm()) {
      toast.warning('Please fill in all required fields');
      return;
    }

    if (!cart || !cart.items || cart.items.length === 0) {
      toast.error('Your cart is empty');
      return;
    }

    setPlacing(true);

    try {
      const orderData = {
        ...shippingInfo,
        payment_method: paymentMethod,
        redeem_points: redeemPoints,
      };

      const res = await orderAPI.createOrder(orderData);

      if (res.data.success) {
        // Trigger points update in navbar
        window.dispatchEvent(new Event('pointsUpdated'));

        if (paymentMethod === 'khalti' && res.data.data.payment_url) {
          window.location.href = res.data.data.payment_url;
        } else {
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
    if (!images || images.length === 0) return null;
    return `http://localhost:5000${images[0]}`;
  };

  // ✅ Helper: get discounted price for a product
  const getDiscountedPrice = (product) => {
    const hasDiscount = product.has_discount === true || product.has_discount === 'true';
    const discountPct = parseInt(product.discount_percentage) || 0;
    if (hasDiscount && discountPct > 0) {
      return Math.round(parseFloat(product.price) * (1 - discountPct / 100));
    }
    return parseFloat(product.price);
  };

  if (loading) {
    return (
      <div className="checkout-loading">
        <div className="spinner"></div>
        <p>Loading checkout...</p>
      </div>
    );
  }

  if (!cart || !cart.items || cart.items.length === 0) {
    return (
      <div className="checkout-empty">
        <h2>Your cart is empty</h2>
        <button onClick={() => navigate('/products')} className="btn-shop">
          Browse Products
        </button>
      </div>
    );
  }

  // Calculate delivery fee based on points redemption
  const deliveryFee = redeemPoints ? 0 : BASE_DELIVERY_FEE;
  const total = subtotal + deliveryFee;
  const pointsToEarn = Math.floor(subtotal / 100);

  return (
    <div className="checkout-page">
      <div className="checkout-container">
        <h1 className="checkout-title">Checkout</h1>

        <div className="checkout-content">
          <div className="checkout-left">

            {/* Shipping Information */}
            <div className="checkout-section">
              <h2>Shipping Information</h2>

              <div className="form-row">
                <div className="form-field">
                  <label>Full Name *</label>
                  <input
                    type="text"
                    name="delivery_name"
                    value={shippingInfo.delivery_name}
                    onChange={handleChange}
                    placeholder="Enter full name"
                    className={errors.delivery_name ? 'error' : ''}
                  />
                  {errors.delivery_name && <span className="error-msg">{errors.delivery_name}</span>}
                </div>

                <div className="form-field">
                  <label>Phone Number *</label>
                  <input
                    type="tel"
                    name="delivery_phone"
                    value={shippingInfo.delivery_phone}
                    onChange={handleChange}
                    placeholder="9812345678"
                    className={errors.delivery_phone ? 'error' : ''}
                  />
                  {errors.delivery_phone && <span className="error-msg">{errors.delivery_phone}</span>}
                </div>
              </div>

              <div className="form-field">
                <label>Email</label>
                <input
                  type="email"
                  name="delivery_email"
                  value={shippingInfo.delivery_email}
                  onChange={handleChange}
                  placeholder="your@email.com"
                />
              </div>

              <div className="form-field">
                <label>Address *</label>
                <textarea
                  name="delivery_address"
                  value={shippingInfo.delivery_address}
                  onChange={handleChange}
                  placeholder="Street address, house number"
                  rows="2"
                  className={errors.delivery_address ? 'error' : ''}
                />
                {errors.delivery_address && <span className="error-msg">{errors.delivery_address}</span>}
              </div>

              <div className="form-row">
                <div className="form-field">
                  <label>City *</label>
                  <input
                    type="text"
                    name="delivery_city"
                    value={shippingInfo.delivery_city}
                    onChange={handleChange}
                    placeholder="Kathmandu"
                    className={errors.delivery_city ? 'error' : ''}
                  />
                  {errors.delivery_city && <span className="error-msg">{errors.delivery_city}</span>}
                </div>

                <div className="form-field">
                  <label>Province</label>
                  <select
                    name="delivery_state"
                    value={shippingInfo.delivery_state}
                    onChange={handleChange}
                  >
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
                  <label>Postal Code</label>
                  <input
                    type="text"
                    name="delivery_postal_code"
                    value={shippingInfo.delivery_postal_code}
                    onChange={handleChange}
                    placeholder="44600"
                  />
                </div>

                <div className="form-field">
                  <label>Landmark</label>
                  <input
                    type="text"
                    name="delivery_landmark"
                    value={shippingInfo.delivery_landmark}
                    onChange={handleChange}
                    placeholder="Near XYZ temple"
                  />
                </div>
              </div>
            </div>

            {/* Payment Method */}
            <div className="checkout-section">
              <h2>Payment Method</h2>

              <div className="payment-methods">
                <label className={`payment-option ${paymentMethod === 'khalti' ? 'selected' : ''}`}>
                  <input
                    type="radio"
                    name="payment_method"
                    value="khalti"
                    checked={paymentMethod === 'khalti'}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                  />
                  <div className="payment-content">
                    <span className="payment-logo">Khalti</span>
                    <span className="payment-label">Digital Wallet</span>
                  </div>
                </label>

                <label className={`payment-option ${paymentMethod === 'cod' ? 'selected' : ''}`}>
                  <input
                    type="radio"
                    name="payment_method"
                    value="cod"
                    checked={paymentMethod === 'cod'}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                  />
                  <div className="payment-content">
                    <span className="payment-logo">COD</span>
                    <span className="payment-label">Cash on Delivery</span>
                  </div>
                </label>
              </div>
            </div>
          </div>

          <div className="checkout-right">
            <div className="order-summary">
              <h2>Order Summary</h2>

              <div className="summary-items">
                {cart.items.map((item) => {
                  //  Calculate discounted price per item for display
                  const hasDiscount = item.product.has_discount === true || item.product.has_discount === 'true';
                  const discountPct = parseInt(item.product.discount_percentage) || 0;
                  const originalPrice = parseFloat(item.product.price);
                  const discountedPrice = getDiscountedPrice(item.product);
                  const isDiscounted = hasDiscount && discountPct > 0;

                  return (
                    <div key={item.cart_item_id} className="summary-item">
                      <div className="summary-item-image">
                        {getImageUrl(item.product.images) ? (
                          <img src={getImageUrl(item.product.images)} alt={item.product.name} />
                        ) : (
                          <div className="no-image">📦</div>
                        )}
                      </div>
                      <div className="summary-item-details">
                        <p className="summary-item-name">{item.product.name}</p>
                        <p className="summary-item-qty">Qty: {item.quantity}</p>
                        {/*  Show discount badge if discounted */}
                        {isDiscounted && (
                          <span className="summary-discount-badge">-{discountPct}% OFF</span>
                        )}
                      </div>
                      <div className="summary-item-price-wrap">
                        {/*  Show strikethrough original price if discounted */}
                        {isDiscounted && (
                          <p className="summary-item-original-price">
                            Rs. {(originalPrice * item.quantity).toLocaleString()}
                          </p>
                        )}
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
                <span>Subtotal</span>
                <span>Rs. {subtotal.toLocaleString()}</span>
              </div>

              {/* POINTS REDEMPTION OPTION */}
              {userPoints >= 150 && (
                <div className="points-redemption-section">
                  <label className="points-checkbox">
                    <input
                      type="checkbox"
                      checked={redeemPoints}
                      onChange={(e) => setRedeemPoints(e.target.checked)}
                    />
                    <div className="points-checkbox-content">
                      <span className="points-icon">💎</span>
                      <div>
                        <strong>Use 150 points for FREE delivery</strong>
                        <p>You have {userPoints} points</p>
                      </div>
                    </div>
                  </label>
                </div>
              )}

              <div className="summary-row">
                <span>Delivery</span>
                <span className={redeemPoints ? 'free-delivery' : ''}>
                  {redeemPoints ? (
                    <>
                      <span className="original-delivery">Rs. {BASE_DELIVERY_FEE}</span>
                      <span className="free-text">FREE 💎</span>
                    </>
                  ) : (
                    `Rs. ${deliveryFee}`
                  )}
                </span>
              </div>

              <div className="summary-divider"></div>

              <div className="summary-total">
                <span>Total</span>
                <span>Rs. {total.toLocaleString()}</span>
              </div>

              {/* POINTS TO EARN */}
              <div className="points-earn-info">
                <span className="points-earn-icon">🎁</span>
                <span>You'll earn {pointsToEarn} points from this order!</span>
              </div>

              <button
                onClick={handlePlaceOrder}
                disabled={placing}
                className="btn-place-order"
              >
                {placing ? 'Processing...' : paymentMethod === 'khalti' ? 'Proceed to Payment' : 'Place Order'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;