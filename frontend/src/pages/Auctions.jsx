import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auctionAPI } from '../api/axios';
import { useTranslation } from 'react-i18next';
import '../styles/Auctions.css';

const Auctions = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [auctions, setAuctions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => { fetchAuctions(); }, [filter]);

  const fetchAuctions = async () => {
    try {
      setLoading(true);
      const params = filter !== 'all' ? { status: filter } : {};
      const res = await auctionAPI.getAllAuctions(params);
      if (res.data.success) setAuctions(res.data.data);
    } catch (err) {
      console.error('Error fetching auctions:', err);
    } finally {
      setLoading(false);
    }
  };

  const getTimeRemaining = (endTime) => {
    const end = new Date(endTime);
    const now = new Date();
    const diff = end - now;
    if (diff <= 0) return t('auctions.ended_label');
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  const getStatusColor = (status) => {
    const colors = { upcoming: '#3B82F6', live: '#10B981', ended: '#6B7280', cancelled: '#EF4444' };
    return colors[status] || '#6B7280';
  };

  if (loading) {
    return (
      <div className="auctions-loading">
        <div className="spinner"></div>
        <p>{t('common.loading')}</p>
      </div>
    );
  }

  return (
    <div className="auctions-page">
      <div className="auctions-container">
        <div className="auctions-header">
          <h1>{t('auctions.title')}</h1>
          <p>{t('auctions.subtitle')}</p>
        </div>

        <div className="auctions-filters">
          {['all', 'live', 'upcoming', 'ended'].map((f) => (
            <button
              key={f}
              className={`filter-btn ${filter === f ? 'active' : ''}`}
              onClick={() => setFilter(f)}
            >
              {t(`auctions.${f}`)}
            </button>
          ))}
        </div>

        {auctions.length === 0 ? (
          <div className="auctions-empty">
            <h2>{t('auctions.no_auctions')}</h2>
            <p>{t('auctions.check_back')}</p>
          </div>
        ) : (
          <div className="auctions-grid">
            {auctions.map((auction) => (
              <div
                key={auction.auction_id}
                className="auction-card"
                onClick={() => navigate(`/auctions/${auction.auction_id}`)}
              >
                <div className="auction-image">
                  {auction.images && auction.images.length > 0 ? (
                    <img src={`http://localhost:5000${auction.images[0]}`} alt={auction.title} />
                  ) : (
                    <div className="no-image">No Image</div>
                  )}
                  <span className="auction-status-badge" style={{ background: getStatusColor(auction.status) }}>
                    {auction.status.toUpperCase()}
                  </span>
                </div>

                <div className="auction-content">
                  <h3>{auction.title}</h3>
                  <p className="auction-seller">by {auction.seller?.shop_name || 'Seller'}</p>

                  <div className="auction-info">
                    <div className="auction-price">
                      <span className="label">{t('auctions.current_bid')}</span>
                      <span className="amount">
                        Rs. {(parseFloat(auction.current_bid) || parseFloat(auction.starting_bid)).toLocaleString()}
                      </span>
                    </div>
                    <div className="auction-meta">
                      <span className="bids-count">{auction.total_bids} {t('auctions.bids')}</span>
                      <span className="time-remaining">{getTimeRemaining(auction.auction_end)}</span>
                    </div>
                  </div>

                  <button className="btn-view-auction">
                    {auction.status === 'live' ? t('auctions.place_bid') : t('auctions.view_details')}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Auctions;