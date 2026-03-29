import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { cartAPI, pointsAPI, wishlistAPI, messageAPI, notificationAPI } from '../api/axios';
import { useTranslation } from 'react-i18next';
import Icons from '../utils/icons';
import LanguageSwitcher from './LanguageSwitcher';
import './NavBar.css';

const NavBar = () => {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const [isLoggedIn, setIsLoggedIn]         = useState(false);
  const [user, setUser]                     = useState(null);
  const [cartCount, setCartCount]           = useState(0);
  const [wishlistCount, setWishlistCount]   = useState(0);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [userPoints, setUserPoints]         = useState(0);
  const [showDropdown, setShowDropdown]     = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  //  Notification bell state
  const [notifications, setNotifications]         = useState([]);
  const [unreadNotifs, setUnreadNotifs]            = useState(0);
  const [showNotifDropdown, setShowNotifDropdown]  = useState(false);
  const notifRef = useRef(null);

  useEffect(() => {
    checkLoginStatus();
    window.addEventListener('userLoggedIn',    checkLoginStatus);
    window.addEventListener('cartUpdated',     fetchCartCount);
    window.addEventListener('wishlistUpdated', fetchWishlistCount);
    window.addEventListener('pointsUpdated',   fetchPoints);
    window.addEventListener('messagesUpdated', fetchUnreadMessages);
    return () => {
      window.removeEventListener('userLoggedIn',    checkLoginStatus);
      window.removeEventListener('cartUpdated',     fetchCartCount);
      window.removeEventListener('wishlistUpdated', fetchWishlistCount);
      window.removeEventListener('pointsUpdated',   fetchPoints);
      window.removeEventListener('messagesUpdated', fetchUnreadMessages);
    };
  }, []);

  // Close notif dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setShowNotifDropdown(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  //  Real-time socket notification listener
  useEffect(() => {
    if (!isLoggedIn) return;
    const handleNew = (notif) => {
      setNotifications((prev) => [notif, ...prev].slice(0, 50));
      setUnreadNotifs((prev) => prev + 1);
    };
    if (window.__socket) {
      window.__socket.on('new_notification', handleNew);
      return () => window.__socket.off('new_notification', handleNew);
    }
  }, [isLoggedIn]);

  const checkLoginStatus = () => {
    const token    = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    if (token && userData) {
      setIsLoggedIn(true);
      const parsedUser = JSON.parse(userData);
      setUser(parsedUser);
      if (parsedUser.preferred_language) i18n.changeLanguage(parsedUser.preferred_language);
      if (parsedUser.role === 'buyer') { fetchCartCount(); fetchWishlistCount(); fetchPoints(); }
      if (parsedUser.role !== 'admin') fetchUnreadMessages();
      fetchNotifications();
    } else {
      setIsLoggedIn(false);
      setUser(null);
      setCartCount(0); setWishlistCount(0); setUnreadMessages(0); setUserPoints(0);
      setNotifications([]); setUnreadNotifs(0);
    }
  };

  const fetchCartCount = async () => {
    try {
      const res = await cartAPI.getCart();
      const items = res.data?.data?.cart?.items || [];
      setCartCount(items.reduce((sum, item) => sum + (item.quantity || 0), 0));
    } catch { setCartCount(0); }
  };

  const fetchWishlistCount = async () => {
    try {
      const res = await wishlistAPI.getWishlist();
      const items = res.data?.data || [];
      setWishlistCount(Array.isArray(items) ? items.length : 0);
    } catch { setWishlistCount(0); }
  };

  const fetchUnreadMessages = async () => {
    try {
      const res = await messageAPI.getUnreadCount();
      if (res.data?.success) setUnreadMessages(res.data.data?.unread_count || 0);
    } catch { setUnreadMessages(0); }
  };

  const fetchPoints = async () => {
    try {
      const res = await pointsAPI.getBalance();
      if (res.data?.success) setUserPoints(res.data.data?.total_points || 0);
    } catch { setUserPoints(0); }
  };

  //  Fetch notifications from backend
  const fetchNotifications = async () => {
    try {
      const res = await notificationAPI.getAll();
      if (res.data?.success) {
        setNotifications(res.data.data.notifications || []);
        setUnreadNotifs(res.data.data.unreadCount || 0);
      }
    } catch { /* silent */ }
  };

  const handleMarkRead = async (id) => {
    try {
      await notificationAPI.markAsRead(id);
      setNotifications((prev) => prev.map((n) => n.notification_id === id ? { ...n, is_read: true } : n));
      setUnreadNotifs((prev) => Math.max(0, prev - 1));
    } catch { /* silent */ }
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationAPI.markAllRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setUnreadNotifs(0);
    } catch { /* silent */ }
  };

  const handleNotifClick = async (notif) => {
    if (!notif.is_read) await handleMarkRead(notif.notification_id);
    setShowNotifDropdown(false);
    if (notif.link) navigate(notif.link);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setIsLoggedIn(false); setUser(null);
    setCartCount(0); setWishlistCount(0); setUnreadMessages(0); setUserPoints(0);
    setNotifications([]); setUnreadNotifs(0); setShowDropdown(false);
    navigate('/login');
  };

  const getDashboardLink = () => {
    if (!user) return '/';
    if (user.role === 'admin')  return '/admin/dashboard';
    if (user.role === 'seller') return '/seller/dashboard';
    return '/profile';
  };

  const getTimeAgo = (dateStr) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1)  return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24)  return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-logo">
          <span className="logo-text">हस्तKrafts</span>
        </Link>

        <div className="navbar-links">
          <Link to="/"         className="nav-link"><Icons.Home size={18} /><span>{t('nav.home')}</span></Link>
          <Link to="/products" className="nav-link"><Icons.Package size={18} /><span>{t('nav.products')}</span></Link>
          <Link to="/auctions" className="nav-link"><Icons.TrendingUp size={18} /><span>{t('nav.auctions')}</span></Link>
          <Link to="/blog"     className="nav-link"><Icons.Book size={18} /><span>{t('nav.blog')}</span></Link>
          <Link to="/contact"  className="nav-link"><Icons.Mail size={18} /><span>{t('nav.contact')}</span></Link>
        </div>

        <div className="navbar-actions">
          <LanguageSwitcher />

          {isLoggedIn ? (
            <>
              {user?.role === 'buyer' && (
                <>
                  <Link to="/profile" className="nav-icon-btn points-btn" title={`${userPoints} ${t('nav.points')}`}>
                    <Icons.Gift size={22} /><span className="points-badge">{userPoints}</span>
                  </Link>
                  <Link to="/wishlist" className="nav-icon-btn" title={t('nav.wishlist')}>
                    <Icons.Heart size={22} />
                    {wishlistCount > 0 && <span className="cart-badge">{wishlistCount}</span>}
                  </Link>
                  <Link to="/cart" className="nav-icon-btn cart-btn" title={t('nav.cart')}>
                    <Icons.Cart size={22} />
                    {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
                  </Link>
                </>
              )}

              {user?.role !== 'admin' && (
                <Link to="/messages" className="nav-icon-btn" title={t('nav.messages')}>
                  <Icons.Messages size={22} />
                  {unreadMessages > 0 && <span className="cart-badge">{unreadMessages}</span>}
                </Link>
              )}

              {/*  NOTIFICATION BELL */}
              <div className="notif-bell-container" ref={notifRef}>
                <button
                  className="nav-icon-btn notif-bell-btn"
                  onClick={() => {
                    setShowNotifDropdown(!showNotifDropdown);
                    if (!showNotifDropdown) fetchNotifications();
                  }}
                  title="Notifications"
                >
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                    <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
                  </svg>
                  {unreadNotifs > 0 && (
                    <span className="cart-badge notif-badge">{unreadNotifs > 99 ? '99+' : unreadNotifs}</span>
                  )}
                </button>

                {showNotifDropdown && (
                  <div className="notif-dropdown">
                    <div className="notif-dropdown-header">
                      <span className="notif-header-title">Notifications</span>
                      {unreadNotifs > 0 && (
                        <button className="notif-mark-all-btn" onClick={handleMarkAllRead}>
                          Mark all read
                        </button>
                      )}
                    </div>
                    <div className="notif-list">
                      {notifications.length === 0 ? (
                        <div className="notif-empty">No notifications yet</div>
                      ) : (
                        notifications.slice(0, 20).map((notif) => (
                          <div
                            key={notif.notification_id}
                            className={`notif-item${!notif.is_read ? ' notif-unread' : ''}`}
                            onClick={() => handleNotifClick(notif)}
                          >
                            <div className="notif-dot-wrapper">
                              {!notif.is_read && <span className="notif-dot" />}
                            </div>
                            <div className="notif-content">
                              <p className="notif-title">{notif.title}</p>
                              <p className="notif-msg">{notif.message}</p>
                              <p className="notif-time">{getTimeAgo(notif.created_at || notif.createdAt)}</p>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="user-dropdown-container">
                <button className="user-dropdown-btn" onClick={() => setShowDropdown(!showDropdown)} title="Account">
                  <Icons.User size={22} />
                  <span className="user-name">{user?.full_name}</span>
                </button>
                {showDropdown && (
                  <div className="dropdown-menu">
                    <div className="dropdown-header">
                      <p className="dropdown-user-name">{user?.full_name}</p>
                      <p className="dropdown-user-role">{user?.role}</p>
                    </div>
                    <Link to={getDashboardLink()} className="dropdown-item" onClick={() => setShowDropdown(false)}>
                      <Icons.Home size={18} /><span>{t('nav.dashboard')}</span>
                    </Link>
                    <Link to="/profile" className="dropdown-item" onClick={() => setShowDropdown(false)}>
                      <Icons.User size={18} /><span>{t('nav.profile')}</span>
                    </Link>
                    {user?.role === 'seller' && (
                      <Link to="/seller/create-blog" className="dropdown-item" onClick={() => setShowDropdown(false)}>
                        <Icons.Book size={18} /><span>Write Blog Post</span>
                      </Link>
                    )}
                    <button onClick={handleLogout} className="dropdown-item logout-item">
                      <Icons.LogOut size={18} /><span>{t('nav.logout')}</span>
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <Link to="/login"    className="btn-login">{t('nav.login')}</Link>
              <Link to="/register" className="btn-register">{t('nav.register')}</Link>
            </>
          )}

          <button className="mobile-menu-btn" onClick={() => setShowMobileMenu(!showMobileMenu)}>
            {showMobileMenu ? <Icons.CloseCircle size={24} /> : '☰'}
          </button>
        </div>
      </div>

      {showMobileMenu && (
        <div className="mobile-menu">
          <Link to="/"         className="mobile-link" onClick={() => setShowMobileMenu(false)}><Icons.Home size={20} /><span>{t('nav.home')}</span></Link>
          <Link to="/products" className="mobile-link" onClick={() => setShowMobileMenu(false)}><Icons.Package size={20} /><span>{t('nav.products')}</span></Link>
          <Link to="/auctions" className="mobile-link" onClick={() => setShowMobileMenu(false)}><Icons.TrendingUp size={20} /><span>{t('nav.auctions')}</span></Link>
          <Link to="/blog"     className="mobile-link" onClick={() => setShowMobileMenu(false)}><Icons.Book size={20} /><span>{t('nav.blog')}</span></Link>
          <Link to="/contact"  className="mobile-link" onClick={() => setShowMobileMenu(false)}><Icons.Mail size={20} /><span>{t('nav.contact')}</span></Link>

          {isLoggedIn ? (
            <>
              {user?.role === 'buyer' && (
                <>
                  <Link to="/profile"  className="mobile-link" onClick={() => setShowMobileMenu(false)}><Icons.Gift size={20} /><span>{t('nav.points')} ({userPoints})</span></Link>
                  <Link to="/wishlist" className="mobile-link" onClick={() => setShowMobileMenu(false)}><Icons.Heart size={20} /><span>{t('nav.wishlist')}{wishlistCount > 0 ? ` (${wishlistCount})` : ''}</span></Link>
                  <Link to="/cart"     className="mobile-link" onClick={() => setShowMobileMenu(false)}><Icons.Cart size={20} /><span>{t('nav.cart')}{cartCount > 0 ? ` (${cartCount})` : ''}</span></Link>
                </>
              )}
              {user?.role === 'seller' && (
                <Link to="/seller/create-blog" className="mobile-link" onClick={() => setShowMobileMenu(false)}><Icons.Book size={20} /><span>Write Blog Post</span></Link>
              )}
              {user?.role !== 'admin' && (
                <Link to="/messages" className="mobile-link" onClick={() => setShowMobileMenu(false)}>
                  <Icons.Messages size={20} /><span>{t('nav.messages')}{unreadMessages > 0 ? ` (${unreadMessages})` : ''}</span>
                </Link>
              )}
              <Link to="/profile" className="mobile-link" onClick={() => setShowMobileMenu(false)}><Icons.User size={20} /><span>{t('nav.profile')}</span></Link>
              <button onClick={handleLogout} className="mobile-link logout-link"><Icons.LogOut size={20} /><span>{t('nav.logout')}</span></button>
            </>
          ) : (
            <>
              {/* Language switcher in mobile menu for logged-out users */}
              <div className="mobile-link" style={{ paddingTop: '0.5rem', paddingBottom: '0.5rem' }}>
                <LanguageSwitcher />
              </div>
              <Link to="/login"    className="mobile-link" onClick={() => setShowMobileMenu(false)}><Icons.User size={20} /><span>{t('nav.login')}</span></Link>
              <Link to="/register" className="mobile-link" onClick={() => setShowMobileMenu(false)}><Icons.User size={20} /><span>{t('nav.register')}</span></Link>
            </>
          )}
        </div>
      )}
    </nav>
  );
};

export default NavBar;