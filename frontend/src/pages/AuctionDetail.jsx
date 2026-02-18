import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import { auctionAPI } from '../api/axios';
import '../styles/AuctionDetail.css';

const AuctionDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
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
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
  const isAdmin = currentUser?.role === 'admin';

  useEffect(() => {
    fetchAuction();
    socketRef.current = io('http://localhost:5000');
    socketRef.current.emit('join_auction', id);

    socketRef.current.on('new_bid', (data) => {
      if (data.auction_id === parseInt(id)) {
        setAuction(prev => prev ? { ...prev, current_bid: data.current_bid, total_bids: data.total_bids } : prev);
        setBidHistory(prev => [{
          bid_id: data.bid_id, bid_amount: data.bid_amount,
          user: data.user, created_at: new Date().toISOString(), is_highest: true
        }, ...prev.map(b => ({ ...b, is_highest: false }))]);
        setBidAmount(String(Math.ceil(parseFloat(data.current_bid) + 100)));
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
        setBidHistory(data.bids || []);
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
    if (diff <= 0) return 'Ended';
    const d = Math.floor(diff / 86400000);
    const h = Math.floor((diff % 86400000) / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    const s = Math.floor((diff % 60000) / 1000);
    if (d > 0) return `${d}d ${h}h ${m}m`;
    return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
  };

  const getStatusColor = (status) => ({upcoming:'#3B82F6',live:'#10B981',ended:'#6B7280',cancelled:'#EF4444'}[status]||'#6B7280');

  const handlePlaceBid = async () => {
    setBidError(''); setBidSuccess('');
    const amount = parseFloat(bidAmount);
    const currentBid = parseFloat(auction.current_bid) || parseFloat(auction.starting_bid);
    const minIncrement = parseFloat(auction.minimum_increment) || 100;
    if (!amount || isNaN(amount)) { setBidError('Enter a valid bid amount'); return; }
    if (amount < currentBid + minIncrement) { setBidError(`Minimum bid is Rs. ${(currentBid + minIncrement).toLocaleString()}`); return; }
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
    if (!dateStr) return 'N/A';
    try { return new Date(dateStr).toLocaleDateString('en-NP', { year:'numeric', month:'short', day:'numeric', hour:'2-digit', minute:'2-digit' }); }
    catch { return 'N/A'; }
  };

  const isOwner = auction?.seller?.user_id === currentUser?.user_id;
  const isSeller = currentUser?.role === 'seller';

  if (loading) return <div className="ad-loading"><div className="spinner"></div><p>Loading auction...</p></div>;
  if (!auction) return <div className="ad-not-found"><h2>Auction not found</h2><button onClick={() => navigate('/auctions')} className="ad-back-btn">Back</button></div>;

  const currentBid = parseFloat(auction.current_bid) || parseFloat(auction.starting_bid);
  const minIncrement = parseFloat(auction.minimum_increment) || 100;
  const isLive = auction.status === 'live';
  const isEnded = auction.status === 'ended';
  const images = auction.images || [];
  const canBid = isLive && !isOwner && !isSeller && !isAdmin && currentUser?.user_id;

  return (
    <div className="ad-page">
      <div className="ad-container">
        <div className="ad-breadcrumb">
          <button onClick={() => navigate('/auctions')} className="ad-back-link">← Live Auctions</button>
          <span className="ad-breadcrumb-sep">/</span>
          <span className="ad-breadcrumb-current">{auction.title}</span>
        </div>

        <div className="ad-layout">
          <div className="ad-images-section">
            <div className="ad-main-image">
              {images.length > 0 ? <img src={`http://localhost:5000${images[selectedImage]}`} alt={auction.title} /> : <div className="ad-no-image"><span>No Image</span></div>}
              <span className="ad-status-badge" style={{ background: getStatusColor(auction.status) }}>{auction.status.toUpperCase()}</span>
            </div>
            {images.length > 1 && (
              <div className="ad-thumbnails">
                {images.map((img, i) => (
                  <div key={i} className={`ad-thumbnail ${selectedImage === i ? 'active' : ''}`} onClick={() => setSelectedImage(i)}>
                    <img src={`http://localhost:5000${img}`} alt={`View ${i+1}`} />
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="ad-info-section">
            <div className="ad-title-block">
              <h1>{auction.title}</h1>
              <p className="ad-seller">By <strong>{auction.seller?.shop_name || 'Seller'}</strong> <span className="ad-seller-verified">✓</span></p>
            </div>

            {isLive && <div className="ad-timer-block"><span className="ad-timer-label">Time Remaining</span><span className="ad-timer-value">{timeLeft}</span></div>}

            {isEnded && auction.winner && (
              <div className="ad-winner-block">
                <span className="ad-winner-label"> Winner</span>
                <span className="ad-winner-name">{auction.winner.full_name}</span>
              </div>
            )}

            <div className="ad-stats-grid">
              <div className="ad-stat"><span className="ad-stat-label">Current Bid</span><span className="ad-stat-value ad-stat-price">Rs. {currentBid.toLocaleString()}</span></div>
              <div className="ad-stat"><span className="ad-stat-label">Starting Bid</span><span className="ad-stat-value">Rs. {parseFloat(auction.starting_bid).toLocaleString()}</span></div>
              <div className="ad-stat"><span className="ad-stat-label">Total Bids</span><span className="ad-stat-value">{auction.total_bids}</span></div>
              <div className="ad-stat"><span className="ad-stat-label">Min Increment</span><span className="ad-stat-value">Rs. {minIncrement.toLocaleString()}</span></div>
            </div>

            {canBid && (
              <div className="ad-bid-section">
                <h3>Place Your Bid</h3>
                <p className="ad-bid-hint">Minimum bid: Rs. {(currentBid + minIncrement).toLocaleString()}</p>
                <div className="ad-bid-input-row">
                  <span className="ad-bid-prefix">Rs.</span>
                  <input type="number" className="ad-bid-input" value={bidAmount} onChange={(e) => setBidAmount(e.target.value)} placeholder="Enter amount" min={currentBid + minIncrement} />
                </div>
                {bidError && <p className="ad-bid-error">{bidError}</p>}
                {bidSuccess && <p className="ad-bid-success">{bidSuccess}</p>}
                <button className="ad-bid-btn" onClick={handlePlaceBid} disabled={bidLoading}>{bidLoading ? 'Placing...' : 'Place Bid'}</button>
              </div>
            )}

            {!canBid && isLive && (
              <div className="ad-cant-bid">
                {!currentUser?.user_id ? (
                  <span>Please <button onClick={() => navigate('/login')} style={{color:'#C17D4A',background:'none',border:'none',cursor:'pointer',fontWeight:700}}>login</button> to bid</span>
                ) : isOwner ? 'You cannot bid on your own auction' : isSeller ? 'Sellers cannot place bids' : isAdmin ? 'Admins cannot place bids' : ''}
              </div>
            )}

            <div className="ad-timeline">
              <div className="ad-timeline-item"><span className="ad-tl-label">Started</span><span className="ad-tl-value">{formatDate(auction.auction_start)}</span></div>
              <div className="ad-timeline-item"><span className="ad-tl-label">Ends</span><span className="ad-tl-value">{formatDate(auction.auction_end)}</span></div>
            </div>
          </div>
        </div>

        <div className="ad-bottom-section">
          <div className="ad-description-card">
            <h2>About this Item</h2>
            <p>{auction.description || 'No description provided.'}</p>
            {auction.seller && (
              <div className="ad-seller-info">
                <h3>Seller Information</h3>
                <div className="ad-seller-details"><div><span className="ad-seller-label">Shop</span><span className="ad-seller-val">{auction.seller.shop_name}</span></div></div>
              </div>
            )}
          </div>

          <div className="ad-bids-card">
            <h2>Bid History <span className="ad-bids-count-badge">{bidHistory.length}</span></h2>
            {bidHistory.length === 0 ? (
              <div className="ad-no-bids"><p>No bids yet. Be the first!</p></div>
            ) : (
              <div className="ad-bids-list">
                {bidHistory.slice(0, 10).map((bid, i) => (
                  <div key={bid.bid_id} className={`ad-bid-row ${i === 0 ? 'highest' : ''}`}>
                    <div className="ad-bid-user">
                      <div className="ad-bid-avatar">{(bid.user?.full_name || 'U')[0].toUpperCase()}</div>
                      <div>
                        <span className="ad-bid-name">{i === 0 ? '👑 ' : ''}{bid.user?.full_name || 'Anonymous'}</span>
                        <span className="ad-bid-time">{formatDate(bid.created_at)}</span>
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