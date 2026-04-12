import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { auctionAPI, orderAPI, userAPI } from '../api/axios';
import { useToast } from '../context/ToastContext';
import { useTranslation } from 'react-i18next';
import '../styles/Checkout.css';
import '../styles/AuctionCheckout.css';

const API_URL = 'http://localhost:5000';

const AuctionCheckout = () => {
  const { auction_id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const { t } = useTranslation();

  const [loading, setLoading]   = useState(true);
  const [placing, setPlacing]   = useState(false);
  const [auction, setAuction]   = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('khalti');
  const [errors, setErrors]     = useState({});

  const [shippingInfo, setShippingInfo] = useState({
    delivery_name:        '',
    delivery_phone:       '',
    delivery_email:       '',
    delivery_address:     '',
    delivery_city:        '',
    delivery_state:       '',
    delivery_postal_code: '',
    delivery_landmark:    '',
  });

  const currentUser = JSON.parse(
    localStorage.getItem('user') || sessionStorage.getItem('user') || '{}'
  );

  useEffect(() => { fetchData(); }, [auction_id]);

  const fetchData = async () => {
    try {
      setLoading(true);

      const auctionRes = await auctionAPI.getAuctionById(auction_id);
      if (!auctionRes.data.success) {
        toast.error('Auction not found');
        navigate('/auctions');
        return;
      }
      const auctionData = auctionRes.data.data;

      if (auctionData.status !== 'ended') {
        toast.error('This auction has not ended yet');
        navigate(`/auctions/${auction_id}`);
        return;
      }

      if (auctionData.winner_id !== currentUser.user_id) {
        toast.error('Only the auction winner can checkout');
        navigate(`/auctions/${auction_id}`);
        return;
      }

      setAuction(auctionData);

      // Pre-fill user info
      const userRes = await userAPI.getProfile();
      if (userRes.data.success) {
        const u = userRes.data.data;
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
    } catch (err) {
      console.error('AuctionCheckout fetch error:', err);
      toast.error('Failed to load auction details');
      navigate('/auctions');
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
      newErrors.delivery_phone = 'Please provide a valid Nepal phone number';
    if (!shippingInfo.delivery_address.trim()) newErrors.delivery_address = 'Address is required';
    if (!shippingInfo.delivery_city.trim())    newErrors.delivery_city    = 'City is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handlePlaceOrder = async () => {
    if (!validateForm()) { toast.warning('Please fill in all required fields'); return; }

    setPlacing(true);
    try {
      const orderData = {
        ...shippingInfo,
        auction_id:     parseInt(auction_id),
        payment_method: paymentMethod,
      };

      const res = await orderAPI.createAuctionOrder(orderData);

      if (res.data.success) {
        if (paymentMethod === 'khalti' && res.data.data.payment_url) {
          window.location.href = res.data.data.payment_url;
        } else {
          window.dispatchEvent(new Event('pointsUpdated'));
          toast.success('🏆 Auction order placed successfully!');
          navigate(`/order-confirmation/${res.data.data.order_id}`);
        }
      }
    } catch (err) {
      console.error('Auction order error:', err);
      toast.error(err.response?.data?.message || 'Failed to place order');
    } finally {
      setPlacing(false);
    }
  };

  if (loading) {
    return (
      <div className="checkout-loading">
        <div className="spinner"></div>
        <p>{t('common.loading')}</p>
      </div>
    );
  }

  if (!auction) return null;

  const winningBid   = parseFloat(auction.current_bid);
  const deliveryFee  = 150; // 
  const total        = winningBid + deliveryFee;
  const pointsToEarn = Math.floor(winningBid / 100);

  return (
    <div className="checkout-page">
      <div className="checkout-container">
        <h1 className="checkout-title checkout-title--auction">Auction Checkout</h1>

        {/* ── Winner Banner ── */}
        <div className="auction-winner-banner">
          <div className="auction-winner-banner__trophy">🏆</div>
          <div className="auction-winner-banner__text">
            <div className="auction-winner-banner__title">
              Congratulations! You won this auction!
            </div>
            <div className="auction-winner-banner__subtitle">
              {auction.title} — Winning bid: Rs. {winningBid.toLocaleString()}
            </div>
          </div>
        </div>

        <div className="checkout-content">
          <div className="checkout-left">

            {/* ── Shipping Info ── */}
            <div className="checkout-section">
              <h2>{t('checkout.shipping_info')}</h2>
              <div className="form-row">
                <div className="form-field">
                  <label>{t('checkout.full_name')} *</label>
                  <input
                    type="text" name="delivery_name"
                    value={shippingInfo.delivery_name} onChange={handleChange}
                    placeholder="Enter full name"
                    className={errors.delivery_name ? 'error' : ''}
                  />
                  {errors.delivery_name && <span className="error-msg">{errors.delivery_name}</span>}
                </div>
                <div className="form-field">
                  <label>{t('checkout.phone')} *</label>
                  <input
                    type="tel" name="delivery_phone"
                    value={shippingInfo.delivery_phone} onChange={handleChange}
                    placeholder="98XXXXXXXX"
                    className={errors.delivery_phone ? 'error' : ''}
                  />
                  {errors.delivery_phone && <span className="error-msg">{errors.delivery_phone}</span>}
                </div>
              </div>

              <div className="form-field">
                <label>{t('checkout.email')}</label>
                <input
                  type="email" name="delivery_email"
                  value={shippingInfo.delivery_email} onChange={handleChange}
                  placeholder="your@email.com"
                />
              </div>

              <div className="form-field">
                <label>{t('checkout.address')} *</label>
                <textarea
                  name="delivery_address"
                  value={shippingInfo.delivery_address} onChange={handleChange}
                  placeholder="Street address, house number" rows="2"
                  className={errors.delivery_address ? 'error' : ''}
                />
                {errors.delivery_address && <span className="error-msg">{errors.delivery_address}</span>}
              </div>

              <div className="form-row">
                <div className="form-field">
                  <label>{t('checkout.city')} *</label>
                  <input
                    type="text" name="delivery_city"
                    value={shippingInfo.delivery_city} onChange={handleChange}
                    placeholder="Kathmandu"
                    className={errors.delivery_city ? 'error' : ''}
                  />
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
                  <input
                    type="text" name="delivery_postal_code"
                    value={shippingInfo.delivery_postal_code} onChange={handleChange}
                    placeholder="44600"
                  />
                </div>
                <div className="form-field">
                  <label>{t('checkout.landmark')}</label>
                  <input
                    type="text" name="delivery_landmark"
                    value={shippingInfo.delivery_landmark} onChange={handleChange}
                    placeholder="Near XYZ temple"
                  />
                </div>
              </div>
            </div>

            {/* ── Payment Method ── */}
            <div className="checkout-section">
              <h2>{t('checkout.payment_method')}</h2>
              <div className="payment-methods">
                <label className={`payment-option ${paymentMethod === 'khalti' ? 'selected' : ''}`}>
                  <input
                    type="radio" name="payment_method" value="khalti"
                    checked={paymentMethod === 'khalti'}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                  />
                  <div className="payment-content">
                    <span className="payment-logo">Khalti</span>
                    <span className="payment-label">{t('checkout.digital_wallet')}</span>
                  </div>
                </label>
                <label className={`payment-option ${paymentMethod === 'cod' ? 'selected' : ''}`}>
                  <input
                    type="radio" name="payment_method" value="cod"
                    checked={paymentMethod === 'cod'}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                  />
                  <div className="payment-content">
                    <span className="payment-logo">COD</span>
                    <span className="payment-label">{t('checkout.cod')}</span>
                  </div>
                </label>
              </div>
            </div>

          </div>{/* end checkout-left */}

          {/* ── Order Summary ── */}
          <div className="checkout-right">
            <div className="order-summary">
              <h2>{t('checkout.order_summary')}</h2>

              <div className="summary-items">
                <div className="summary-item">
                  <div className="summary-item-image">
                    {auction.images?.[0] ? (
                      <img src={`${API_URL}${auction.images[0]}`} alt={auction.title} />
                    ) : (
                      <div className="auction-no-image">🔨</div>
                    )}
                  </div>
                  <div className="summary-item-details">
                    <p className="summary-item-name">{auction.title}</p>
                    <p className="summary-item-qty">Auction Item × 1</p>
                    <span className="winning-bid-badge">🏆 Winning Bid</span>
                  </div>
                  <div className="summary-item-price-wrap">
                    <p className="summary-item-price">Rs. {winningBid.toLocaleString()}</p>
                  </div>
                </div>
              </div>

              <div className="summary-divider"></div>

              <div className="summary-row">
                <span>Winning Bid</span>
                <span>Rs. {winningBid.toLocaleString()}</span>
              </div>

              {/* ✅ Rs. 150 delivery — same as normal checkout */}
              <div className="summary-row">
                <span>{t('cart.delivery')}</span>
                <span>Rs. {deliveryFee.toLocaleString()}</span>
              </div>

              <div className="summary-divider"></div>

              <div className="summary-total">
                <span>{t('cart.total')}</span>
                <span>Rs. {total.toLocaleString()}</span>
              </div>

              <div className="points-earn-info">
                <span className="points-earn-icon">🎁</span>
                <span>You'll earn <strong>{pointsToEarn}</strong> points from this order!</span>
              </div>

              <button
                onClick={handlePlaceOrder}
                disabled={placing}
                className="btn-place-order"
              >
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

export default AuctionCheckout;