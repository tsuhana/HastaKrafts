import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import { auctionAPI } from '../api/axios';
import { useTranslation } from 'react-i18next';
import '../styles/AuctionDetail.css';

const AuctionDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [auction, setAuction] = useState(null);
  const [loading, setLoading] = useState(true);
  const [bidAmount, setBidAmount] = useState('');
  const [bidLoading, setBidLoading] = useState(false);
  const [bidError, setBidError] = useState('');
  const [bidSuccess, setBidSuccess] = useState('');
  const [timeLeft, setTimeLeft] = useState('');
  const [selectedImage, setSelectedImage] = useState(0);
  const [bidHistory, setBidHistory] = useState([]);
  const socketRef = useRef(null);
  const currentUser = JSON.parse(localStorage.getItem('user') || sessionStorage.getItem('user') || sessionStorage.getItem('user') || '{}');
  const isAdmin = currentUser?.role === 'admin';

  useEffect(() => {
    fetchAuction();
    socketRef.current = io('http://localhost:5000');
    socketRef.current.emit('join_auction', id);

    socketRef.current.on('new_bid', (data) => {
      if (data.auction_id === parseInt(id)) {
        setAuction(prev => prev ? { ...prev, current_bid: data.current_bid, total_bids: data.total_bids } : prev);
        setBidHistory(prev => [{
          bid_id: data.bid_id,
          bid_amount: data.bid_amount,
          user: data.user,
          created_at: new Date().toISOString(),
          is_highest: true,
        }, ...prev.map(b => ({ ...b, is_highest: false }))]);
        const increment = data.minimum_increment || parseFloat(auction?.minimum_increment) || 100;
        setBidAmount(String(Math.ceil(parseFloat(data.current_bid) + increment)));
      }
    });

    socketRef.current.on('auction_ended', (data) => {
      if (data.auction_id === parseInt(id)) {
        setAuction(prev => prev ? { ...prev, status: 'ended', winner: data.winner } : prev);
      }
    });

    return () => {
      socketRef.current?.emit('leave_auction', id);
      socketRef.current?.disconnect();
    };
  }, [id]);

  useEffect(() => {
    if (!auction) return;
    const interval = setInterval(() => setTimeLeft(getTimeRemaining(auction.auction_end)), 1000);
    return () => clearInterval(interval);
  }, [auction]);

  const fetchAuction = async () => {
    try {
      setLoading(true);
      const res = await auctionAPI.getAuctionById(id);
      if (res.data.success) {
        const data = res.data.data;
        setAuction(data);
        const sortedBids = (data.bids || []).sort((a, b) => parseFloat(b.bid_amount) - parseFloat(a.bid_amount));
        setBidHistory(sortedBids);
        const currentBid = parseFloat(data.current_bid) || parseFloat(data.starting_bid);
        const increment = parseFloat(data.minimum_increment) || 100;
        setBidAmount(String(Math.ceil(currentBid + increment)));
      }
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const getTimeRemaining = (endTime) => {
    const diff = new Date(endTime) - new Date();
    if (diff <= 0) return t('auctions.ended_label');
    const d = Math.floor(diff / 86400000);
    const h = Math.floor((diff % 86400000) / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    const s = Math.floor((diff % 60000) / 1000);
    if (d > 0) return `${d}d ${h}h ${m}m`;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const getStatusColor = (status) => ({
    upcoming: '#3B82F6', live: '#10B981', ended: '#6B7280', cancelled: '#EF4444'
  }[status] || '#6B7280');

  const handlePlaceBid = async () => {
    setBidError('');
    setBidSuccess('');
    const amount = parseFloat(bidAmount);
    const currentBid = parseFloat(auction.current_bid) || parseFloat(auction.starting_bid);
    const minIncrement = parseFloat(auction.minimum_increment) || 100;
    if (!amount || isNaN(amount)) { setBidError('Enter a valid bid amount'); return; }
    if (amount < currentBid + minIncrement) {
      setBidError(`Minimum bid is Rs. ${(currentBid + minIncrement).toLocaleString()}`);
      return;
    }
    try {
      setBidLoading(true);
      const res = await auctionAPI.placeBid(id, { bid_amount: amount });
      if (res.data.success) {
        setBidSuccess(`Bid of Rs. ${amount.toLocaleString()} placed!`);
        fetchAuction();
        setTimeout(() => setBidSuccess(''), 3000);
      }
    } catch (err) {
      setBidError(err.response?.data?.message || 'Failed to place bid');
    } finally {
      setBidLoading(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return '—';
      return d.toLocaleDateString('en-NP', {
        year: 'numeric', month: 'short', day: 'numeric',
        hour: '2-digit', minute: '2-digit',
      });
    } catch {
      return '—';
    }
  };

  const getBidTime = (bid) => {
    return bid?.createdAt || bid?.created_at || null;
  };

  const isOwner = auction?.seller?.user_id === currentUser?.user_id;
  const isSeller = currentUser?.role === 'seller';

  if (loading) return (
    <div className="ad-loading"><div className="spinner"></div><p>{t('common.loading')}</p></div>
  );
  if (!auction) return (
    <div className="ad-not-found">
      <h2>Auction not found</h2>
      <button onClick={() => navigate('/auctions')} className="ad-back-btn">{t('common.back')}</button>
    </div>
  );

  const currentBid = parseFloat(auction.current_bid) || parseFloat(auction.starting_bid);
  const minIncrement = parseFloat(auction.minimum_increment) || 100;
  const isLive = auction.status === 'live';
  const isEnded = auction.status === 'ended';
  const images = auction.images || [];
  const canBid = isLive && !isOwner && !isSeller && !isAdmin && currentUser?.user_id;

  // ✅ Check if current user is the winner
  const isWinner = isEnded && auction.winner_id === currentUser?.user_id;

  return (
    <div className="ad-page">
      <div className="ad-container">
        <div className="ad-breadcrumb">
          <button onClick={() => navigate('/auctions')} className="ad-back-link">
            ← {t('nav.auctions')}
          </button>
          <span className="ad-breadcrumb-sep">/</span>
          <span className="ad-breadcrumb-current">{auction.title}</span>
        </div>

        <div className="ad-layout">
          <div className="ad-images-section">
            <div className="ad-main-image">
              {images.length > 0 ? (
                <img src={`http://localhost:5000${images[selectedImage]}`} alt={auction.title} />
              ) : (
                <div className="ad-no-image"><span>No Image</span></div>
              )}
              <span className="ad-status-badge" style={{ background: getStatusColor(auction.status) }}>
                {auction.status.toUpperCase()}
              </span>
            </div>
            {images.length > 1 && (
              <div className="ad-thumbnails">
                {images.map((img, i) => (
                  <div key={i} className={`ad-thumbnail ${selectedImage === i ? 'active' : ''}`} onClick={() => setSelectedImage(i)}>
                    <img src={`http://localhost:5000${img}`} alt={`View ${i + 1}`} />
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="ad-info-section">
            <div className="ad-title-block">
              <h1>{auction.title}</h1>
              <p className="ad-seller">
                By <strong>{auction.seller?.shop_name || 'Seller'}</strong>
                <span className="ad-seller-verified"> ✓</span>
              </p>
            </div>

            {isLive && (
              <div className="ad-timer-block">
                <span className="ad-timer-label">{t('auctions.time_remaining')}</span>
                <span className="ad-timer-value">{timeLeft}</span>
              </div>
            )}

            {isEnded && auction.winner && (
              <div className="ad-winner-block">
                <span className="ad-winner-label">🏆 {t('auctions.winner')}</span>
                <span className="ad-winner-name">{auction.winner.full_name}</span>
              </div>
            )}

            {/* ✅ NEW: Checkout button for winner */}
            {isWinner && (
              <button
                className="ad-bid-btn"
                onClick={() => navigate(`/auction-checkout/${id}`)}
                style={{ marginTop: '1rem' }}
              >
                🏆 Proceed to Checkout
              </button>
            )}

            <div className="ad-stats-grid">
              <div className="ad-stat">
                <span className="ad-stat-label">{t('auctions.current_bid')}</span>
                <span className="ad-stat-value ad-stat-price">Rs. {currentBid.toLocaleString()}</span>
              </div>
              <div className="ad-stat">
                <span className="ad-stat-label">{t('auctions.starting_bid')}</span>
                <span className="ad-stat-value">Rs. {parseFloat(auction.starting_bid).toLocaleString()}</span>
              </div>
              <div className="ad-stat">
                <span className="ad-stat-label">{t('auctions.total_bids')}</span>
                <span className="ad-stat-value">{auction.total_bids}</span>
              </div>
              <div className="ad-stat">
                <span className="ad-stat-label">{t('auctions.min_increment')}</span>
                <span className="ad-stat-value">Rs. {minIncrement.toLocaleString()}</span>
              </div>
            </div>

            {canBid && (
              <div className="ad-bid-section">
                <h3>{t('auctions.place_your_bid')}</h3>
                <p className="ad-bid-hint">
                  {t('auctions.min_bid')}: Rs. {(currentBid + minIncrement).toLocaleString()}
                </p>
                <div className="ad-bid-input-row">
                  <span className="ad-bid-prefix">Rs.</span>
                  <input
                    type="number"
                    className="ad-bid-input"
                    value={bidAmount}
                    onChange={(e) => setBidAmount(e.target.value)}
                    placeholder="Enter amount"
                    min={currentBid + minIncrement}
                  />
                </div>
                {bidError && <p className="ad-bid-error">{bidError}</p>}
                {bidSuccess && <p className="ad-bid-success">{bidSuccess}</p>}
                <button className="ad-bid-btn" onClick={handlePlaceBid} disabled={bidLoading}>
                  {bidLoading ? t('auctions.placing') : t('auctions.place_bid')}
                </button>
              </div>
            )}

            {!canBid && isLive && (
              <div className="ad-cant-bid">
                {!currentUser?.user_id ? (
                  <span>
                    {t('auctions.login_to_bid').split('login')[0]}
                    <button onClick={() => navigate('/login')} style={{ color: '#C17D4A', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 700 }}>
                      {t('nav.login')}
                    </button>
                    {t('auctions.login_to_bid').split('login')[1]}
                  </span>
                ) : isOwner ? t('auctions.own_auction')
                  : isSeller ? t('auctions.seller_no_bid')
                  : isAdmin ? t('auctions.admin_no_bid') : ''}
              </div>
            )}

            <div className="ad-timeline">
              <div className="ad-timeline-item">
                <span className="ad-tl-label">{t('auctions.started')}</span>
                <span className="ad-tl-value">{formatDate(auction.auction_start)}</span>
              </div>
              <div className="ad-timeline-item">
                <span className="ad-tl-label">{t('auctions.ends')}</span>
                <span className="ad-tl-value">{formatDate(auction.auction_end)}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="ad-bottom-section">
          <div className="ad-description-card">
            <h2>{t('auctions.about_item')}</h2>
            <p>{auction.description || 'No description provided.'}</p>
            {auction.seller && (
              <div className="ad-seller-info">
                <h3>{t('auctions.seller_info')}</h3>
                <div className="ad-seller-details">
                  <div>
                    <span className="ad-seller-label">Shop</span>
                    <span className="ad-seller-val">{auction.seller.shop_name}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="ad-bids-card">
            <h2>
              {t('auctions.bid_history')}
              <span className="ad-bids-count-badge">{bidHistory.length}</span>
            </h2>
            {bidHistory.length === 0 ? (
              <div className="ad-no-bids"><p>{t('auctions.no_bids')}</p></div>
            ) : (
              <div className="ad-bids-list">
                {bidHistory.map((bid, i) => (
                  <div key={bid.bid_id} className={`ad-bid-row ${i === 0 ? 'highest' : ''}`}>
                    <div className="ad-bid-user">
                      <div className="ad-bid-avatar">
                        {(bid.user?.full_name || 'U')[0].toUpperCase()}
                      </div>
                      <div>
                        <span className="ad-bid-name">
                          {i === 0 ? '👑 ' : ''}{bid.user?.full_name || 'Anonymous'}
                        </span>
                        <span className="ad-bid-time">{formatDate(getBidTime(bid))}</span>
                      </div>
                    </div>
                    <span className="ad-bid-amount">Rs. {parseFloat(bid.bid_amount).toLocaleString()}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuctionDetail;