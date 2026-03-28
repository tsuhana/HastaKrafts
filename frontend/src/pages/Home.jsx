import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { productAPI, cartAPI, wishlistAPI } from '../api/axios';
import { useToast } from '../context/ToastContext';
import { useTranslation } from 'react-i18next';
import Icons from '../utils/icons';
import BannerCarousel from '../components/BannerCarousel';
import '../styles/Home.css';

const ML_API = 'http://localhost:5001';
const API_URL = 'http://localhost:5000';

const calculateDiscountedPrice = (price, hasDiscount, discountPercentage) => {
  if (!hasDiscount || !discountPercentage) return null;
  return Math.round(price * (1 - discountPercentage / 100));
};

const Home = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const { t } = useTranslation();

  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [trendingProducts, setTrendingProducts] = useState([]);
  const [topCategories, setTopCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [addingToCart, setAddingToCart] = useState({});
  const [wishlistItems, setWishlistItems] = useState(new Set());

  // AI Recommendations state
  const [recommendedProducts, setRecommendedProducts] = useState([]);
  const [recLoading, setRecLoading] = useState(false);

  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
  const isLoggedIn = !!localStorage.getItem('token');
  const isBuyer = currentUser?.role === 'buyer';

  useEffect(() => {
    fetchHomeData();
    if (isLoggedIn && isBuyer) {
      fetchWishlist();
      fetchAIRecommendations();
    }
  }, []);

  // ── AI Recommendations ──────────────────────────────────
  const fetchAIRecommendations = async () => {
    try {
      setRecLoading(true);
      const userId = currentUser?.user_id;
      if (!userId) return;

      // 1. Get recommended product IDs from Flask ML API
      const mlRes = await fetch(`${ML_API}/recommend/user/${userId}?n=6`);
      const mlData = await mlRes.json();
      const recProductIds = mlData.recommendations?.map((r) => r.product_id) || [];

      if (recProductIds.length === 0) return;

      // 2. Fetch full product details from Node.js backend
      const productPromises = recProductIds.map((id) =>
        productAPI.getProductById(id).catch(() => null)
      );
      const results = await Promise.all(productPromises);
      const fullProducts = results
        .filter((r) => r && r.data?.data)
        .map((r) => r.data.data);

      setRecommendedProducts(fullProducts);
    } catch (err) {
      console.error('AI recommendation error:', err);
    } finally {
      setRecLoading(false);
    }
  };
  // ────────────────────────────────────────────────────────

  const fetchHomeData = async () => {
    try {
      setLoading(true);
      const [featured, trending, categories] = await Promise.all([
        productAPI.getFeaturedProducts().catch(() => ({ data: { data: [] } })),
        productAPI.getTrendingProducts().catch(() => ({ data: { data: [] } })),
        productAPI.getTopCategories().catch(() => ({ data: { data: [] } })),
      ]);

      setFeaturedProducts(featured.data.data || []);
      setTrendingProducts(trending.data.data || []);
      setTopCategories(categories.data.data.slice(0, 8) || []);

      if (featured.data.data.length === 0) {
        const random = await productAPI.getRandomProducts();
        setFeaturedProducts(random.data.data || []);
      }
      if (trending.data.data.length === 0) {
        const random = await productAPI.getRandomProducts();
        setTrendingProducts(random.data.data || []);
      }
    } catch (err) {
      console.error('Fetch home data error:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchWishlist = async () => {
    try {
      const res = await wishlistAPI.getWishlist();
      const productIds = new Set(res.data.data.map((item) => item.product_id));
      setWishlistItems(productIds);
    } catch (err) {
      console.error('Fetch wishlist error:', err);
    }
  };

  const handleAddToCart = async (product) => {
    if (!isLoggedIn) {
      toast.error('Please login to add items to cart');
      navigate('/login');
      return;
    }
    if (!isBuyer) {
      toast.error('Only buyers can add items to cart');
      return;
    }
    if (product.stock_quantity <= 0) {
      toast.error('Product is out of stock');
      return;
    }
    setAddingToCart((prev) => ({ ...prev, [product.product_id]: true }));
    try {
      await cartAPI.addToCart({ product_id: product.product_id, quantity: 1 });
      toast.success('Added to cart!');
      window.dispatchEvent(new Event('cartUpdated'));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add to cart');
    } finally {
      setAddingToCart((prev) => ({ ...prev, [product.product_id]: false }));
    }
  };

  const toggleWishlist = async (e, productId) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isLoggedIn) {
      toast.error('Please login to use wishlist');
      navigate('/login');
      return;
    }
    if (!isBuyer) {
      toast.error('Only buyers can use wishlist');
      return;
    }
    try {
      if (wishlistItems.has(productId)) {
        await wishlistAPI.removeFromWishlist(productId);
        setWishlistItems((prev) => {
          const s = new Set(prev);
          s.delete(productId);
          return s;
        });
      } else {
        await wishlistAPI.addToWishlist({ product_id: productId });
        setWishlistItems((prev) => new Set(prev).add(productId));
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update wishlist');
    }
  };

  const ProductCard = ({ product }) => {
    const inWishlist = wishlistItems.has(product.product_id);
    const discountedPrice = calculateDiscountedPrice(
      product.price,
      product.has_discount,
      product.discount_percentage
    );

    return (
      <div className="home-product-card">
        <Link to={`/products/${product.product_id}`} className="card-link">
          <div className="card-image">
            {product.images && product.images.length > 0 ? (
              <img src={`${API_URL}${product.images[0]}`} alt={product.name} />
            ) : (
              <div className="no-image"><Icons.Package size={48} /></div>
            )}
            {product.has_discount && product.discount_percentage > 0 && (
              <span className="home-discount-badge">-{product.discount_percentage}%</span>
            )}
            {isLoggedIn && isBuyer && (
              <button
                className={`wishlist-btn-home ${inWishlist ? 'active' : ''}`}
                onClick={(e) => toggleWishlist(e, product.product_id)}
                title={inWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
              >
                {inWishlist ? <Icons.HeartFilled size={18} /> : <Icons.Heart size={18} />}
              </button>
            )}
          </div>
          <div className="card-content">
            <h3 className="card-title">{product.name}</h3>
            {product.seller && (
              <p className="card-seller">
                <Icons.Shop size={14} />
                <span>{product.seller.shop_name}</span>
              </p>
            )}
            <div className="card-footer">
              <div className="card-price">
                {discountedPrice ? (
                  <>
                    <span className="home-original-price">Rs. {parseFloat(product.price).toLocaleString()}</span>
                    <span className="home-discounted-price">Rs. {discountedPrice.toLocaleString()}</span>
                  </>
                ) : (
                  <>
                    <span className="currency">Rs.</span>
                    <span className="amount">{parseFloat(product.price).toLocaleString()}</span>
                  </>
                )}
              </div>
            </div>
          </div>
        </Link>
        {isLoggedIn && isBuyer && (
          <button
            className="btn-add-cart"
            onClick={() => handleAddToCart(product)}
            disabled={addingToCart[product.product_id] || product.stock_quantity <= 0}
          >
            {addingToCart[product.product_id] ? (
              t('common.loading')
            ) : (
              <><Icons.Cart size={16} /><span>{t('products.add_to_cart')}</span></>
            )}
          </button>
        )}
      </div>
    );
  };

  return (
    <div className="home-page">

      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-content">
          <h1 className="hero-title">{t('home.hero_title')}</h1>
          <p className="hero-subtitle">{t('home.hero_subtitle')}</p>
          <div className="hero-buttons">
            <Link to="/products" className="btn-hero-primary">
              <Icons.Package size={20} /><span>{t('home.shop_now')}</span>
            </Link>
            <Link to="/register-seller" className="btn-hero-secondary">
              <Icons.Shop size={20} /><span>{t('home.become_seller')}</span>
            </Link>
          </div>
        </div>
        <div className="hero-decoration">
          <div className="decoration-circle circle-1"></div>
          <div className="decoration-circle circle-2"></div>
          <div className="decoration-circle circle-3"></div>
        </div>
      </section>

      <BannerCarousel />

      {/* Categories Section */}
      <section className="categories-section">
        <div className="section-header">
          <h2>{t('home.shop_by_category')}</h2>
          <Link to="/products" className="view-all">
            {t('home.view_all')} <Icons.ChevronRight size={18} />
          </Link>
        </div>
        <div className="categories-grid">
          {topCategories.slice(0, 8).map((category) => (
            <Link
              key={category.category_id}
              to={`/products?category=${category.category_id}`}
              className="category-card"
            >
              <h3 className="category-name">{category.name}</h3>
              <p className="category-count">{category.product_count || 0} {t('home.products')}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* ── AI: Recommended for You ── */}
      {isLoggedIn && isBuyer && (
        <section className="products-section ai-recommended-section">
          <div className="section-header">
            <div>
              <h2 style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                ✨ Recommended for You
                <span style={{
                  fontSize: '11px',
                  fontWeight: '600',
                  background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                  color: 'white',
                  padding: '3px 10px',
                  borderRadius: '20px',
                  letterSpacing: '0.5px',
                }}>
                  Powered by AI
                </span>
              </h2>
              <p>Personalized picks based on your taste</p>
            </div>
            <Link to="/products" className="view-all">
              {t('home.view_all')} <Icons.ChevronRight size={18} />
            </Link>
          </div>

          {recLoading ? (
            <div className="loading-state">
              <div className="spinner"></div>
              <p>Finding your perfect matches...</p>
            </div>
          ) : recommendedProducts.length > 0 ? (
            <div className="products-grid">
              {recommendedProducts.map((product) => (
                <ProductCard key={product.product_id} product={product} />
              ))}
            </div>
          ) : null}
        </section>
      )}

      {/* Featured Products */}
      {featuredProducts.length > 0 && (
        <section className="products-section featured-section">
          <div className="section-header">
            <div>
              <h2>
                <Icons.TrendingUp size={28} style={{ color: '#DC2626' }} />{' '}
                {t('home.featured_products')}
              </h2>
              <p>{t('home.handpicked')}</p>
            </div>
            <Link to="/products" className="view-all">
              {t('home.view_all')} <Icons.ChevronRight size={18} />
            </Link>
          </div>
          <div className="products-grid">
            {featuredProducts.map((product) => (
              <ProductCard key={product.product_id} product={product} />
            ))}
          </div>
        </section>
      )}

      {/* Trending Products */}
      {trendingProducts.length > 0 && (
        <section className="products-section trending-section">
          <div className="section-header">
            <div>
              <h2>
                <Icons.TrendingUp size={28} style={{ color: '#F59E0B' }} />{' '}
                {t('home.trending_now')}
              </h2>
              <p>{t('home.most_popular')}</p>
            </div>
            <Link to="/products" className="view-all">
              {t('home.view_all')} <Icons.ChevronRight size={18} />
            </Link>
          </div>
          <div className="products-grid">
            {trendingProducts.map((product) => (
              <ProductCard key={product.product_id} product={product} />
            ))}
          </div>
        </section>
      )}

      {/* Why Choose Us */}
      <section className="features-section">
        <h2 className="section-title">{t('home.why_choose')}</h2>
        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon" style={{ background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)' }}>
              <Icons.CheckCircle size={32} />
            </div>
            <h3>{t('home.authentic_products')}</h3>
            <p>{t('home.authentic_desc')}</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon" style={{ background: 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)' }}>
              <Icons.Truck size={32} />
            </div>
            <h3>{t('home.nationwide_delivery')}</h3>
            <p>{t('home.delivery_desc')}</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon" style={{ background: 'linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)' }}>
              <Icons.CheckCircle size={32} />
            </div>
            <h3>{t('home.secure_payment')}</h3>
            <p>{t('home.payment_desc')}</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon" style={{ background: 'linear-gradient(135deg, #EC4899 0%, #DB2777 100%)' }}>
              <Icons.Heart size={32} />
            </div>
            <h3>{t('home.support_artisans')}</h3>
            <p>{t('home.support_desc')}</p>
          </div>
        </div>
      </section>

    </div>
  );
};

export default Home;