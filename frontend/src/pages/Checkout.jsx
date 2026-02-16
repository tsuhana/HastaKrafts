import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { cartAPI, orderAPI, userAPI } from '../api/axios';
import '../styles/Checkout.css';

const Checkout = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState(null);
  const [subtotal, setSubtotal] = useState(0);
  const [user, setUser] = useState(null);
  const [placing, setPlacing] = useState(false);

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

  const deliveryFee = 150;

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
        setSubtotal(cartRes.data.data.subtotal);
      }

      // Fetch user profile for pre-filling
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
    } catch (err) {
      console.error('Error fetching data:', err);
      alert('Failed to load checkout data');
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
      alert('Please fill in all required fields');
      return;
    }

    if (!cart || !cart.items || cart.items.length === 0) {
      alert('Your cart is empty');
      return;
    }

    setPlacing(true);

    try {
      const orderData = {
        ...shippingInfo,
        payment_method: paymentMethod,
      };

      const res = await orderAPI.createOrder(orderData);

      if (res.data.success) {
        // If Khalti, redirect to payment
        if (paymentMethod === 'khalti' && res.data.data.payment_url) {
          window.location.href = res.data.data.payment_url;
        } else {
          // If COD, go to success page
          alert('✅ Order placed successfully!');
          navigate(`/order-confirmation/${res.data.data.order_id}`);
        }
      }
    } catch (err) {
      console.error('Place order error:', err);
      alert(err.response?.data?.message || 'Failed to place order');
    } finally {
      setPlacing(false);
    }
  };

  const getImageUrl = (images) => {
    if (!images || images.length === 0) return null;
    return `http://localhost:5000${images[0]}`;
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

  const total = subtotal + deliveryFee;

  return (
    <div className="checkout-page">
      <div className="checkout-container">
        <h1 className="checkout-title">Checkout</h1>

        <div className="checkout-content">
          {/* Left Side - Shipping & Payment */}
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

          {/* Right Side - Order Summary */}
          <div className="checkout-right">
            <div className="order-summary">
              <h2>Order Summary</h2>

              <div className="summary-items">
                {cart.items.map((item) => (
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
                    </div>
                    <p className="summary-item-price">
                      Rs. {(item.product.price * item.quantity).toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>

              <div className="summary-divider"></div>

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
                <span>Rs. {total.toLocaleString()}</span>
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