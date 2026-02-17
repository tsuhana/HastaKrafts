import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { userAPI } from '../api/axios';
import '../styles/NavBar.css';

const NavBar = () => {
  const navigate = useNavigate();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [cartCount, setCartCount] = useState(0);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');
    
    if (token && userStr) {
      setIsLoggedIn(true);
      setUser(JSON.parse(userStr));
      fetchCartCount();
    }

    // Listen for cart updates
    const handleCartUpdate = () => {
      fetchCartCount();
    };

    window.addEventListener('cartUpdated', handleCartUpdate);

    return () => {
      window.removeEventListener('cartUpdated', handleCartUpdate);
    };
  }, []);

  const fetchCartCount = async () => {
    try {
      const res = await userAPI.getCart();
      if (res.data.success) {
        const itemCount = res.data.data.cart.items?.length || 0;
        setCartCount(itemCount);
      }
    } catch (err) {
      console.error('Error fetching cart:', err);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setIsLoggedIn(false);
    setUser(null);
    setCartCount(0);
    navigate('/login');
  };

  const getDashboardLink = () => {
    if (!user) return '/';
    
    switch (user.role) {
      case 'admin':
        return '/admin/dashboard';
      case 'seller':
        return '/seller/dashboard';
      default:
        return '/profile';
    }
  };

  return (
    <nav className="navbar">
      <div className="nav-container">
        <Link to="/" className="nav-logo">
          हस्त KRAFTS
        </Link>

        <ul className="nav-menu">
          <li className="nav-item">
            <Link to="/" className="nav-link">Home</Link>
          </li>
          <li className="nav-item">
            <Link to="/products" className="nav-link">Products</Link>
          </li>
          <li className="nav-item">
            <Link to="/auctions" className="nav-link">Auctions</Link>
          </li>
          <li className="nav-item">
            <Link to="/messages" className="nav-link"> 💬Chat</Link>
          </li>
          
        </ul>

        <div className="nav-actions">
          {isLoggedIn && (
            <Link to="/cart" className="cart-button">
              <span className="cart-icon">🛒</span>
              {cartCount > 0 && (
                <span className="cart-badge">{cartCount}</span>
              )}
            </Link>
          )}

          {isLoggedIn ? (
            <div className="user-menu">
              <button 
                className="user-button"
                onClick={() => setShowDropdown(!showDropdown)}
              >
                <span className="user-name">{user?.full_name}</span>
                <span className="user-role-badge">{user?.role}</span>
              </button>
              
              {showDropdown && (
                <div className="dropdown-menu">
                  <Link to={getDashboardLink()} className="dropdown-item">
                    Dashboard
                  </Link>
                  <Link to="/profile" className="dropdown-item">
                    Profile
                  </Link>
                  {user?.role === 'seller' && (
                    <Link to="/seller/add-product" className="dropdown-item">
                      Add Product
                    </Link>
                  )}
                  <button onClick={handleLogout} className="dropdown-item logout">
                    Logout
                  </button>
                </div>
              )}
            </div>
          ) : (
            <>
              <Link to="/login" className="nav-btn">Login</Link>
              <Link to="/register-seller" className="nav-btn-primary">Become a Seller</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default NavBar;