import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { auctionAPI } from '../api/axios';
import { useTranslation } from 'react-i18next';
import '../styles/Auctions.css';

const ITEMS_PER_PAGE = 9;

const Auctions = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [auctions, setAuctions]   = useState([]);
  const [loading, setLoading]     = useState(true);
  const [filter, setFilter]       = useState('all');
  const [search, setSearch]       = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [page, setPage]           = useState(1);

  useEffect(() => { fetchAuctions(); }, []);

  // Reset to page 1 when filter/search changes
  useEffect(() => { setPage(1); }, [filter, search]);

  const fetchAuctions = async () => {
    try {
      setLoading(true);
      // Fetch all approved auctions; filter client-side for snappier UX
      const res = await auctionAPI.getAllAuctions();
      if (res.data.success) setAuctions(res.data.data);
    } catch (err) {
      console.error('Error fetching auctions:', err);
    } finally {
      setLoading(false);
    }
  };

  // ── Client-side filter + search ──
  const filtered = useMemo(() => {
    let list = [...auctions];
    if (filter !== 'all') list = list.filter((a) => a.status === filter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (a) =>
          (a.title || '').toLowerCase().includes(q) ||
          (a.seller?.shop_name || '').toLowerCase().includes(q) ||
          (a.description || '').toLowerCase().includes(q)
      );
    }
    return list;
  }, [auctions, filter, search]);

  // ── Pagination ──
  const totalPages  = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginated   = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  // Counts for badges
  const counts = useMemo(() => ({
    all:      auctions.length,
    live:     auctions.filter((a) => a.status === 'live').length,
    upcoming: auctions.filter((a) => a.status === 'upcoming').length,
    ended:    auctions.filter((a) => a.status === 'ended').length,
  }), [auctions]);

  const getTimeRemaining = (endTime) => {
    const diff = new Date(endTime) - new Date();
    if (diff <= 0) return t('auctions.ended_label') || 'Ended';
    const days    = Math.floor(diff / 86400000);
    const hours   = Math.floor((diff % 86400000) / 3600000);
    const minutes = Math.floor((diff % 3600000) / 60000);
    if (days > 0)  return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  const getStatusColor = (status) =>
    ({ upcoming: '#3B82F6', live: '#10B981', ended: '#6B7280', cancelled: '#EF4444' }[status] || '#6B7280');

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setSearch(searchInput);
  };

  if (loading) {
    return (
      <div className="auctions-loading">
        <div className="spinner" />
        <p>{t('common.loading') || 'Loading…'}</p>
      </div>
    );
  }

  return (
    <div className="auctions-page">
      <div className="auctions-container">

        {/* Header */}
        <div className="auctions-header">
          <h1>{t('auctions.title') || 'Live Auctions'}</h1>
          <p>{t('auctions.subtitle') || 'Bid on unique handcrafted items'}</p>
        </div>

        {/* Search bar */}
        <form className="auctions-search-form" onSubmit={handleSearchSubmit}>
          <input
            type="text"
            className="auctions-search-input"
            placeholder="Search auctions…"
            value={searchInput}
            onChange={(e) => {
              setSearchInput(e.target.value);
              if (e.target.value === '') setSearch('');
            }}
          />
          <button type="submit" className="auctions-search-btn">Search</button>
        </form>

        {/* Filter tabs */}
        <div className="auctions-filters">
          {[
            { key: 'all',      label: t('auctions.all')      || 'All',      count: counts.all },
            { key: 'live',     label: t('auctions.live')     || 'Live',     count: counts.live },
            { key: 'upcoming', label: t('auctions.upcoming') || 'Upcoming', count: counts.upcoming },
            { key: 'ended',    label: t('auctions.ended')    || 'Ended',    count: counts.ended },
          ].map((f) => (
            <button
              key={f.key}
              className={`filter-btn ${filter === f.key ? 'active' : ''}`}
              onClick={() => setFilter(f.key)}
            >
              {f.key === 'live' && <span className="live-dot" />}
              {f.label}
              <span className="filter-count">{f.count}</span>
            </button>
          ))}
        </div>

        {/* Grid or empty */}
        {paginated.length === 0 ? (
          <div className="auctions-empty">
            <h2>{t('auctions.no_auctions') || 'No auctions found'}</h2>
            <p>
              {search || filter !== 'all'
                ? 'Try a different filter or search term.'
                : t('auctions.check_back') || 'Check back later for new auctions!'}
            </p>
            {(search || filter !== 'all') && (
              <button
                className="filter-btn active"
                style={{ marginTop: 12 }}
                onClick={() => { setFilter('all'); setSearch(''); setSearchInput(''); }}
              >
                Clear filters
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="auctions-grid">
              {paginated.map((auction) => (
                <div
                  key={auction.auction_id}
                  className="auction-card"
                  onClick={() => navigate(`/auctions/${auction.auction_id}`)}
                >
                  <div className="auction-image">
                    {auction.images && auction.images.length > 0 ? (
                      <img
                        src={`http://localhost:5000${auction.images[0]}`}
                        alt={auction.title}
                      />
                    ) : (
                      <div className="no-image">🔨</div>
                    )}
                    <span
                      className="auction-status-badge"
                      style={{ background: getStatusColor(auction.status) }}
                    >
                      {auction.status === 'live' && <span className="live-pulse" />}
                      {auction.status.toUpperCase()}
                    </span>
                  </div>

                  <div className="auction-content">
                    <h3>{auction.title}</h3>
                    <p className="auction-seller">
                      by {auction.seller?.shop_name || 'Artisan'}
                    </p>

                    <div className="auction-info">
                      <div className="auction-price">
                        <span className="label">
                          {parseFloat(auction.current_bid) > 0
                            ? (t('auctions.current_bid') || 'Current Bid')
                            : (t('auctions.starting_bid') || 'Starting Bid')}
                        </span>
                        <span className="amount">
                          Rs.{' '}
                          {(
                            parseFloat(auction.current_bid) ||
                            parseFloat(auction.starting_bid)
                          ).toLocaleString()}
                        </span>
                      </div>
                      <div className="auction-meta">
                        <span className="bids-count">
                          {auction.total_bids} {t('auctions.bids') || 'bids'}
                        </span>
                        <span className="time-remaining">
                          {auction.status === 'live'
                            ? getTimeRemaining(auction.auction_end)
                            : auction.status === 'upcoming'
                            ? `Starts ${getTimeRemaining(auction.auction_start)}`
                            : auction.status === 'ended'
                            ? 'Ended'
                            : ''}
                        </span>
                      </div>
                    </div>

                    <button className="btn-view-auction">
                      {auction.status === 'live'
                        ? (t('auctions.place_bid') || 'Place Bid')
                        : (t('auctions.view_details') || 'View Details')}
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="auctions-pagination">
                <button
                  className="page-btn"
                  disabled={page === 1}
                  onClick={() => setPage((p) => p - 1)}
                >
                  ← Prev
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                  <button
                    key={p}
                    className={`page-btn ${page === p ? 'active' : ''}`}
                    onClick={() => setPage(p)}
                  >
                    {p}
                  </button>
                ))}
                <button
                  className="page-btn"
                  disabled={page === totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next →
                </button>
              </div>
            )}

            <p className="auctions-result-count">
              Showing {(page - 1) * ITEMS_PER_PAGE + 1}–
              {Math.min(page * ITEMS_PER_PAGE, filtered.length)} of {filtered.length} auctions
            </p>
          </>
        )}
      </div>
    </div>
  );
};

export default Auctions;