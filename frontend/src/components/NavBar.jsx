import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { cartAPI, pointsAPI, wishlistAPI, messageAPI } from '../api/axios';
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

  const checkLoginStatus = () => {
    const token    = localStorage.getItem('token');
    const userData = localStorage.getItem('user');

    if (token && userData) {
      setIsLoggedIn(true);
      const parsedUser = JSON.parse(userData);
      setUser(parsedUser);

      if (parsedUser.preferred_language) {
        i18n.changeLanguage(parsedUser.preferred_language);
      }

      if (parsedUser.role === 'buyer') {
        fetchCartCount();
        fetchWishlistCount();
        fetchPoints();
      }

      //  Admin does not use messages — skip the API call entirely
      if (parsedUser.role !== 'admin') {
        fetchUnreadMessages();
      }
    } else {
      setIsLoggedIn(false);
      setUser(null);
      setCartCount(0);
      setWishlistCount(0);
      setUnreadMessages(0);
      setUserPoints(0);
    }
  };

  const fetchCartCount = async () => {
    try {
      const res   = await cartAPI.getCart();
      const items = res.data?.data?.cart?.items || [];
      setCartCount(items.reduce((sum, item) => sum + (item.quantity || 0), 0));
    } catch {
      setCartCount(0);
    }
  };

  const fetchWishlistCount = async () => {
    try {
      const res   = await wishlistAPI.getWishlist();
      const items = res.data?.data || [];
      setWishlistCount(Array.isArray(items) ? items.length : 0);
    } catch {
      setWishlistCount(0);
    }
  };

  const fetchUnreadMessages = async () => {
    try {
      const res = await messageAPI.getUnreadCount();
      if (res.data?.success) {
        setUnreadMessages(res.data.data?.unread_count || 0);
      }
    } catch {
      setUnreadMessages(0);
    }
  };

  const fetchPoints = async () => {
    try {
      const res = await pointsAPI.getBalance();
      if (res.data?.success) {
        setUserPoints(res.data.data?.total_points || 0);
      }
    } catch {
      setUserPoints(0);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setIsLoggedIn(false);
    setUser(null);
    setCartCount(0);
    setWishlistCount(0);
    setUnreadMessages(0);
    setUserPoints(0);
    setShowDropdown(false);
    navigate('/login');
  };

  const getDashboardLink = () => {
    if (!user) return '/';
    if (user.role === 'admin')  return '/admin/dashboard';
    if (user.role === 'seller') return '/seller/dashboard';
    return '/profile';
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-logo">
          <span className="logo-text">हस्तKrafts</span>
        </Link>

        {/* ── Desktop nav links ── */}
        <div className="navbar-links">
          <Link to="/"         className="nav-link"><Icons.Home size={18} /><span>{t('nav.home')}</span></Link>
          <Link to="/products" className="nav-link"><Icons.Package size={18} /><span>{t('nav.products')}</span></Link>
          <Link to="/auctions" className="nav-link"><Icons.TrendingUp size={18} /><span>{t('nav.auctions')}</span></Link>
          <Link to="/blog"     className="nav-link"><Icons.Book size={18} /><span>{t('nav.blog')}</span></Link>
          <Link to="/contact"  className="nav-link"><Icons.Mail size={18} /><span>{t('nav.contact')}</span></Link>
        </div>

        {/* ── Desktop action icons ── */}
        <div className="navbar-actions">
          <LanguageSwitcher />

          {isLoggedIn ? (
            <>
              {user?.role === 'buyer' && (
                <>
                  {/* Points */}
                  <Link to="/profile" className="nav-icon-btn points-btn" title={`${userPoints} ${t('nav.points')}`}>
                    <Icons.Gift size={22} />
                    <span className="points-badge">{userPoints}</span>
                  </Link>

                  {/* Wishlist */}
                  <Link to="/wishlist" className="nav-icon-btn" title={t('nav.wishlist')}>
                    <Icons.Heart size={22} />
                    {wishlistCount > 0 && (
                      <span className="cart-badge">{wishlistCount}</span>
                    )}
                  </Link>

                  {/* Cart */}
                  <Link to="/cart" className="nav-icon-btn cart-btn" title={t('nav.cart')}>
                    <Icons.Cart size={22} />
                    {cartCount > 0 && (
                      <span className="cart-badge">{cartCount}</span>
                    )}
                  </Link>
                </>
              )}

              {/* ✅ FIX: Messages — buyers and sellers only, NOT admin */}
              {user?.role !== 'admin' && (
                <Link to="/messages" className="nav-icon-btn" title={t('nav.messages')}>
                  <Icons.Messages size={22} />
                  {unreadMessages > 0 && (
                    <span className="cart-badge">{unreadMessages}</span>
                  )}
                </Link>
              )}

              {/* User dropdown */}
              <div className="user-dropdown-container">
                <button
                  className="user-dropdown-btn"
                  onClick={() => setShowDropdown(!showDropdown)}
                  title="Account"
                >
                  <Icons.User size={22} />
                  <span className="user-name">{user?.full_name}</span>
                </button>

                {showDropdown && (
                  <div className="dropdown-menu">
                    <div className="dropdown-header">
                      <p className="dropdown-user-name">{user?.full_name}</p>
                      <p className="dropdown-user-role">{user?.role}</p>
                    </div>

                    <Link
                      to={getDashboardLink()}
                      className="dropdown-item"
                      onClick={() => setShowDropdown(false)}
                    >
                      <Icons.Home size={18} /><span>{t('nav.dashboard')}</span>
                    </Link>

                    <Link
                      to="/profile"
                      className="dropdown-item"
                      onClick={() => setShowDropdown(false)}
                    >
                      <Icons.User size={18} /><span>{t('nav.profile')}</span>
                    </Link>

                    {user?.role === 'seller' && (
                      <Link
                        to="/seller/create-blog"
                        className="dropdown-item"
                        onClick={() => setShowDropdown(false)}
                      >
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

          <button
            className="mobile-menu-btn"
            onClick={() => setShowMobileMenu(!showMobileMenu)}
          >
            {showMobileMenu ? <Icons.CloseCircle size={24} /> : '☰'}
          </button>
        </div>
      </div>

      {/* ── Mobile menu ── */}
      {showMobileMenu && (
        <div className="mobile-menu">
          <Link to="/"         className="mobile-link" onClick={() => setShowMobileMenu(false)}><Icons.Home size={20} /><span>{t('nav.home')}</span></Link>
          <Link to="/products" className="mobile-link" onClick={() => setShowMobileMenu(false)}><Icons.Package size={20} /><span>{t('nav.products')}</span></Link>
          <Link to="/auctions" className="mobile-link" onClick={() => setShowMobileMenu(false)}><Icons.TrendingUp size={20} /><span>{t('nav.auctions')}</span></Link>
          <Link to="/blog"     className="mobile-link" onClick={() => setShowMobileMenu(false)}><Icons.Book size={20} /><span>{t('nav.blog')}</span></Link>
          <Link to="/contact"  className="mobile-link" onClick={() => setShowMobileMenu(false)}><Icons.Mail size={20} /><span>{t('nav.contact')}</span></Link>

          {isLoggedIn && (
            <>
              {user?.role === 'buyer' && (
                <>
                  <Link to="/profile"  className="mobile-link" onClick={() => setShowMobileMenu(false)}>
                    <Icons.Gift size={20} /><span>{t('nav.points')} ({userPoints})</span>
                  </Link>
                  <Link to="/wishlist" className="mobile-link" onClick={() => setShowMobileMenu(false)}>
                    <Icons.Heart size={20} /><span>{t('nav.wishlist')}{wishlistCount > 0 ? ` (${wishlistCount})` : ''}</span>
                  </Link>
                  <Link to="/cart"     className="mobile-link" onClick={() => setShowMobileMenu(false)}>
                    <Icons.Cart size={20} /><span>{t('nav.cart')}{cartCount > 0 ? ` (${cartCount})` : ''}</span>
                  </Link>
                </>
              )}

              {user?.role === 'seller' && (
                <Link to="/seller/create-blog" className="mobile-link" onClick={() => setShowMobileMenu(false)}>
                  <Icons.Book size={20} /><span>Write Blog Post</span>
                </Link>
              )}

              {/*  Messages in mobile — buyers and sellers only, NOT admin */}
              {user?.role !== 'admin' && (
                <Link to="/messages" className="mobile-link" onClick={() => setShowMobileMenu(false)}>
                  <Icons.Messages size={20} />
                  <span>{t('nav.messages')}{unreadMessages > 0 ? ` (${unreadMessages})` : ''}</span>
                </Link>
              )}

              <Link to="/profile" className="mobile-link" onClick={() => setShowMobileMenu(false)}>
                <Icons.User size={20} /><span>{t('nav.profile')}</span>
              </Link>
              <button onClick={handleLogout} className="mobile-link logout-link">
                <Icons.LogOut size={20} /><span>{t('nav.logout')}</span>
              </button>
            </>
          )}
        </div>
      )}
    </nav>
  );
};

export default NavBar;