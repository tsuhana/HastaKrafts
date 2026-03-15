import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { wishlistAPI, cartAPI } from '../api/axios';
import { useToast } from '../context/ToastContext';
import { useTranslation } from 'react-i18next';
import ConfirmModal from '../components/ConfirmModal';
import Icons from '../utils/icons';
import '../styles/Wishlist.css';

const Wishlist = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const { t } = useTranslation();
  const [wishlist, setWishlist] = useState([]);
  const [loading, setLoading] = useState(true);
  const [removingId, setRemovingId] = useState(null);
  const [addingToCart, setAddingToCart] = useState({});

  const [confirmModal, setConfirmModal] = useState({
    isOpen: false, type: null, productId: null, itemCount: 0,
  });

  const API_URL = 'http://localhost:5000';

  useEffect(() => { fetchWishlist(); }, []);

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

  const handleRemove = (productId) => setConfirmModal({ isOpen: true, type: 'remove', productId, itemCount: 0 });

  const handleAddAllToCart = () => {
    const availableItems = wishlist.filter(item => item.product.stock_quantity > 0);
    if (availableItems.length === 0) {
      toast.warning('No items available to add to cart');
      return;
    }
    setConfirmModal({ isOpen: true, type: 'addAll', productId: null, itemCount: availableItems.length });
  };

  const handleClearWishlist = () => setConfirmModal({ isOpen: true, type: 'clear', productId: null, itemCount: 0 });

  const handleConfirmAction = async () => {
    const { type, productId, itemCount } = confirmModal;
    setConfirmModal({ isOpen: false, type: null, productId: null, itemCount: 0 });

    if (type === 'remove') {
      setRemovingId(productId);
      try {
        await wishlistAPI.removeFromWishlist(productId);
        setWishlist(wishlist.filter(item => item.product_id !== productId));
      } catch (err) {
        toast.error('Failed to remove item');
      } finally {
        setRemovingId(null);
      }
    }

    if (type === 'addAll') {
      const availableItems = wishlist.filter(item => item.product.stock_quantity > 0);
      let successCount = 0;
      for (const item of availableItems) {
        try {
          await cartAPI.addToCart({ product_id: item.product_id, quantity: 1 });
          successCount++;
        } catch (err) {
          console.error('Add to cart error:', err);
        }
      }
      toast.success(`Added ${successCount} item${successCount !== 1 ? 's' : ''} to cart!`);
      window.dispatchEvent(new Event('cartUpdated'));
    }

    if (type === 'clear') {
      try {
        await wishlistAPI.clearWishlist();
        setWishlist([]);
        toast.success('Wishlist cleared');
      } catch (err) {
        toast.error('Failed to clear wishlist');
      }
    }
  };

  const handleAddToCart = async (item) => {
    if (item.product.stock_quantity <= 0) {
      toast.error('This product is out of stock');
      return;
    }
    setAddingToCart({ ...addingToCart, [item.product_id]: true });
    try {
      await cartAPI.addToCart({ product_id: item.product_id, quantity: 1 });
      toast.success('Added to cart!');
      window.dispatchEvent(new Event('cartUpdated'));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add to cart');
    } finally {
      setAddingToCart({ ...addingToCart, [item.product_id]: false });
    }
  };

  const confirmConfig = {
    remove: { title: 'Remove from wishlist?', message: 'This item will be removed from your wishlist.', confirmText: t('common.delete'), confirmVariant: 'danger' },
    addAll: { title: `Add ${confirmModal.itemCount} items to cart?`, message: 'All available items will be added to your cart.', confirmText: t('wishlist.add_all'), confirmVariant: 'warning' },
    clear:  { title: 'Clear entire wishlist?', message: 'All items will be removed. This cannot be undone.', confirmText: t('wishlist.clear'), confirmVariant: 'danger' },
  };

  const activeCfg = confirmConfig[confirmModal.type] || {};

  if (loading) {
    return (
      <div className="wishlist-loading">
        <div className="spinner"></div>
        <p>{t('common.loading')}</p>
      </div>
    );
  }

  if (wishlist.length === 0) {
    return (
      <div className="wishlist-page">
        <div className="wishlist-container">
          <div className="wishlist-empty">
            <div className="empty-icon"><Icons.Heart size={80} /></div>
            <h2>{t('wishlist.empty')}</h2>
            <p>{t('wishlist.empty_desc')}</p>
            <button onClick={() => navigate('/products')} className="btn-browse">
              <Icons.Package size={20} />
              <span>{t('cart.browse_products')}</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="wishlist-page">
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title={activeCfg.title}
        message={activeCfg.message}
        confirmText={activeCfg.confirmText}
        cancelText={t('common.cancel')}
        confirmVariant={activeCfg.confirmVariant}
        onConfirm={handleConfirmAction}
        onCancel={() => setConfirmModal({ isOpen: false, type: null, productId: null, itemCount: 0 })}
      />

      <div className="wishlist-container">
        <div className="wishlist-header">
          <div className="wishlist-title">
            <Icons.Heart size={32} />
            <h1>{t('wishlist.title')}</h1>
            <span className="wishlist-count">
              {wishlist.length} {wishlist.length === 1 ? 'item' : 'items'}
            </span>
          </div>
          <div className="wishlist-actions">
            <button onClick={handleAddAllToCart} className="btn-add-all" disabled={wishlist.every(item => item.product.stock_quantity <= 0)}>
              <Icons.Cart size={20} />
              <span>{t('wishlist.add_all')}</span>
            </button>
            <button onClick={handleClearWishlist} className="btn-clear">
              <Icons.Delete size={20} />
              <span>{t('wishlist.clear')}</span>
            </button>
          </div>
        </div>

        <div className="wishlist-grid">
          {wishlist.map((item) => (
            <div key={item.wishlist_id} className="wishlist-card">
              <button className="btn-remove-item" onClick={() => handleRemove(item.product_id)} disabled={removingId === item.product_id} title="Remove from wishlist">
                {removingId === item.product_id ? <div className="btn-spinner" /> : <Icons.Close size={20} />}
              </button>

              <div className="wishlist-image" onClick={() => navigate(`/products/${item.product_id}`)}>
                {item.product.images && item.product.images.length > 0 ? (
                  <img src={`${API_URL}${item.product.images[0]}`} alt={item.product.name} />
                ) : (
                  <div className="no-image"><Icons.Package size={48} /></div>
                )}
                {item.product.stock_quantity <= 0 && (
                  <div className="out-of-stock-overlay">{t('products.out_of_stock')}</div>
                )}
              </div>

              <div className="wishlist-info">
                <h3 className="wishlist-product-name" onClick={() => navigate(`/products/${item.product_id}`)}>
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
                    <span className="currency">{t('common.rs')}</span>
                    <span className="amount">{parseFloat(item.product.price).toLocaleString()}</span>
                  </div>
                  <button
                    className={`btn-add-to-cart ${item.product.stock_quantity <= 0 ? 'disabled' : ''}`}
                    onClick={() => handleAddToCart(item)}
                    disabled={item.product.stock_quantity <= 0 || addingToCart[item.product_id]}
                  >
                    {addingToCart[item.product_id] ? (
                      <><div className="btn-spinner" /><span>Adding...</span></>
                    ) : (
                      <><Icons.Cart size={18} /><span>{t('products.add_to_cart')}</span></>
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