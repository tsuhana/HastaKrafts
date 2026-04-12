import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Icons from '../utils/icons';
import { wishlistAPI } from '../api/axios';
import './ProductCard.css';

const calculateDiscountedPrice = (price, hasDiscount, discountPercentage) => {
  if (!hasDiscount || !discountPercentage) return price;
  return Math.round(price * (1 - discountPercentage / 100));
};

const ProductCard = ({ product, showWishlist = true }) => {
  const navigate = useNavigate();
  const API_URL = 'http://localhost:5000';

  const [inWishlist, setInWishlist] = useState(false);
  const [wishlistLoading, setWishlistLoading] = useState(false);

  const currentUser = JSON.parse(localStorage.getItem('user') || sessionStorage.getItem('user') || '{}');
  const isLoggedIn = !!localStorage.getItem('token') || sessionStorage.getItem('token');
  const isBuyer = currentUser?.role === 'buyer';

  useEffect(() => {
    if (isLoggedIn && isBuyer && showWishlist) {
      checkWishlistStatus();
    }
  }, [product.product_id]);

  const checkWishlistStatus = async () => {
    try {
      const res = await wishlistAPI.checkWishlist(product.product_id);
      setInWishlist(res.data.inWishlist);
    } catch (err) {
      console.error('Check wishlist error:', err);
    }
  };

  const toggleWishlist = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isLoggedIn) {
      alert('Please login to add items to wishlist');
      navigate('/login');
      return;
    }

    if (!isBuyer) {
      alert('Only buyers can use wishlist');
      return;
    }

    setWishlistLoading(true);
    try {
      if (inWishlist) {
        await wishlistAPI.removeFromWishlist(product.product_id);
        setInWishlist(false);
      } else {
        await wishlistAPI.addToWishlist({ product_id: product.product_id });
        setInWishlist(true);
      }
      // ✅ FIX: Notify navbar to update wishlist count
      window.dispatchEvent(new Event('wishlistUpdated'));
    } catch (err) {
      console.error('Wishlist toggle error:', err);
      alert(err.response?.data?.message || 'Failed to update wishlist');
    } finally {
      setWishlistLoading(false);
    }
  };

  return (
    <div className="product-card">
      <Link to={`/products/${product.product_id}`} className="product-card-link">
        <div className="product-image-container">
          {product.images && product.images.length > 0 ? (
            <img
              src={`${API_URL}${product.images[0]}`}
              alt={product.name}
              className="product-image"
            />
          ) : (
            <div className="product-image-placeholder">
              <Icons.Package size={48} />
              <span>No Image</span>
            </div>
          )}

          {product.has_discount && product.discount_percentage > 0 && (
            <span className="discount-badge">
              -{product.discount_percentage}%
            </span>
          )}

          {product.is_featured && (
            <span className="featured-badge">
              Featured
            </span>
          )}

          {isLoggedIn && isBuyer && showWishlist && (
            <button
              className={`wishlist-btn ${inWishlist ? 'active' : ''}`}
              onClick={toggleWishlist}
              disabled={wishlistLoading}
              title={inWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
            >
              {wishlistLoading ? (
                <div className="wishlist-spinner" />
              ) : inWishlist ? (
                <Icons.HeartFilled size={20} />
              ) : (
                <Icons.Heart size={20} />
              )}
            </button>
          )}
        </div>

        <div className="product-info">
          <h3 className="product-name">{product.name}</h3>

          {product.seller && (
            <p className="product-seller">
              <Icons.Shop size={16} />
              {product.seller.shop_name}
            </p>
          )}

          {product.category && (
            <p className="product-category">
              <Icons.Tag size={16} />
              {product.category.name}
            </p>
          )}

          <div className="product-footer">
            <div className="product-price">
              {product.has_discount && product.discount_percentage > 0 ? (
                <>
                  <span className="original-price">
                    Rs. {parseFloat(product.price).toLocaleString()}
                  </span>
                  <span className="discounted-price">
                    Rs. {calculateDiscountedPrice(product.price, product.has_discount, product.discount_percentage).toLocaleString()}
                  </span>
                </>
              ) : (
                <span className="price">
                  <span className="currency">Rs.</span>
                  <span className="amount">{parseFloat(product.price).toLocaleString()}</span>
                </span>
              )}
            </div>

            {product.stock_quantity !== undefined && (
              <div className={`stock-status ${product.stock_quantity > 0 ? 'in-stock' : 'out-of-stock'}`}>
                {product.stock_quantity > 0 ? (
                  <>
                    <span className="stock-dot"></span>
                    In Stock
                  </>
                ) : (
                  'Out of Stock'
                )}
              </div>
            )}
          </div>
        </div>
      </Link>
    </div>
  );
};

export default ProductCard;