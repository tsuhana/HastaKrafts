import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { wishlistAPI, cartAPI } from '../api/axios';
import Icons from '../utils/icons';
import '../styles/Wishlist.css';

const Wishlist = () => {
  const navigate = useNavigate();
  const [wishlist, setWishlist] = useState([]);
  const [loading, setLoading] = useState(true);
  const [removingId, setRemovingId] = useState(null);
  const [addingToCart, setAddingToCart] = useState({});

  const API_URL = 'http://localhost:5000';

  useEffect(() => {
    fetchWishlist();
  }, []);

  const fetchWishlist = async () => {
    try {
      setLoading(true);
      const res = await wishlistAPI.getWishlist();
      setWishlist(res.data.data || []);
    } catch (err) {
      console.error('Fetch wishlist error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (productId) => {
    if (!window.confirm('Remove this item from wishlist?')) return;

    setRemovingId(productId);
    try {
      await wishlistAPI.removeFromWishlist(productId);
      setWishlist(wishlist.filter(item => item.product_id !== productId));
    } catch (err) {
      console.error('Remove from wishlist error:', err);
      alert('Failed to remove item');
    } finally {
      setRemovingId(null);
    }
  };

  const handleAddToCart = async (item) => {
    if (item.product.stock_quantity <= 0) {
      alert('This product is out of stock');
      return;
    }

    setAddingToCart({ ...addingToCart, [item.product_id]: true });
    try {
      await cartAPI.addToCart({
        product_id: item.product_id,
        quantity: 1
      });
      
      alert('Added to cart!');
      window.dispatchEvent(new Event('cartUpdated'));
    } catch (err) {
      console.error('Add to cart error:', err);
      alert(err.response?.data?.message || 'Failed to add to cart');
    } finally {
      setAddingToCart({ ...addingToCart, [item.product_id]: false });
    }
  };

  const handleAddAllToCart = async () => {
    const availableItems = wishlist.filter(
      item => item.product.stock_quantity > 0
    );

    if (availableItems.length === 0) {
      alert('No items available to add to cart');
      return;
    }

    if (!window.confirm(`Add ${availableItems.length} items to cart?`)) return;

    let successCount = 0;
    for (const item of availableItems) {
      try {
        await cartAPI.addToCart({
          product_id: item.product_id,
          quantity: 1
        });
        successCount++;
      } catch (err) {
        console.error('Add to cart error:', err);
      }
    }

    alert(`Added ${successCount} items to cart!`);
    window.dispatchEvent(new Event('cartUpdated'));
  };

  const handleClearWishlist = async () => {
    if (!window.confirm('Clear entire wishlist?')) return;

    try {
      await wishlistAPI.clearWishlist();
      setWishlist([]);
      alert('Wishlist cleared');
    } catch (err) {
      console.error('Clear wishlist error:', err);
      alert('Failed to clear wishlist');
    }
  };

  if (loading) {
    return (
      <div className="wishlist-loading">
        <div className="spinner"></div>
        <p>Loading your wishlist...</p>
      </div>
    );
  }

  if (wishlist.length === 0) {
    return (
      <div className="wishlist-page">
        <div className="wishlist-container">
          <div className="wishlist-empty">
            <div className="empty-icon">
              <Icons.Heart size={80} />
            </div>
            <h2>Your Wishlist is Empty</h2>
            <p>Save items you love for later!</p>
            <button 
              onClick={() => navigate('/products')} 
              className="btn-browse"
            >
              <Icons.Package size={20} />
              <span>Browse Products</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="wishlist-page">
      <div className="wishlist-container">
        
        {/* Header */}
        <div className="wishlist-header">
          <div className="wishlist-title">
            <Icons.Heart size={32} />
            <h1>My Wishlist</h1>
            <span className="wishlist-count">
              {wishlist.length} {wishlist.length === 1 ? 'item' : 'items'}
            </span>
          </div>

          <div className="wishlist-actions">
            <button 
              onClick={handleAddAllToCart}
              className="btn-add-all"
              disabled={wishlist.every(item => item.product.stock_quantity <= 0)}
            >
              <Icons.Cart size={20} />
              <span>Add All to Cart</span>
            </button>
            <button 
              onClick={handleClearWishlist}
              className="btn-clear"
            >
              <Icons.Delete size={20} />
              <span>Clear Wishlist</span>
            </button>
          </div>
        </div>

        {/* Wishlist Grid */}
        <div className="wishlist-grid">
          {wishlist.map((item) => (
            <div key={item.wishlist_id} className="wishlist-card">
              
              {/* Remove Button */}
              <button
                className="btn-remove-item"
                onClick={() => handleRemove(item.product_id)}
                disabled={removingId === item.product_id}
                title="Remove from wishlist"
              >
                {removingId === item.product_id ? (
                  <div className="btn-spinner" />
                ) : (
                  <Icons.Close size={20} />
                )}
              </button>

              {/* Product Image */}
              <div 
                className="wishlist-image"
                onClick={() => navigate(`/products/${item.product_id}`)}
              >
                {item.product.images && item.product.images.length > 0 ? (
                  <img
                    src={`${API_URL}${item.product.images[0]}`}
                    alt={item.product.name}
                  />
                ) : (
                  <div className="no-image">
                    <Icons.Package size={48} />
                  </div>
                )}

                {item.product.stock_quantity <= 0 && (
                  <div className="out-of-stock-overlay">
                    Out of Stock
                  </div>
                )}
              </div>

              {/* Product Info */}
              <div className="wishlist-info">
                <h3 
                  className="wishlist-product-name"
                  onClick={() => navigate(`/products/${item.product_id}`)}
                >
                  {item.product.name}
                </h3>

                {item.product.seller && (
                  <p className="wishlist-seller">
                    <Icons.Shop size={16} />
                    <span>{item.product.seller.shop_name}</span>
                  </p>
                )}

                <div className="wishlist-footer">
                  <div className="wishlist-price">
                    <span className="currency">Rs.</span>
                    <span className="amount">
                      {parseFloat(item.product.price).toLocaleString()}
                    </span>
                  </div>

                  <button
                    className={`btn-add-to-cart ${
                      item.product.stock_quantity <= 0 ? 'disabled' : ''
                    }`}
                    onClick={() => handleAddToCart(item)}
                    disabled={
                      item.product.stock_quantity <= 0 ||
                      addingToCart[item.product_id]
                    }
                  >
                    {addingToCart[item.product_id] ? (
                      <>
                        <div className="btn-spinner" />
                        <span>Adding...</span>
                      </>
                    ) : (
                      <>
                        <Icons.Cart size={18} />
                        <span>Add to Cart</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Wishlist;