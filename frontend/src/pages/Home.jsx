import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { productAPI, cartAPI, wishlistAPI } from '../api/axios';
import Icons from '../utils/icons';
import BannerCarousel from '../components/BannerCarousel';
import '../styles/Home.css';

const calculateDiscountedPrice = (price, hasDiscount, discountPercentage) => {
  if (!hasDiscount || !discountPercentage) return null;
  return Math.round(price * (1 - discountPercentage / 100));
};

const Home = () => {
  const navigate = useNavigate();
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [trendingProducts, setTrendingProducts] = useState([]);
  const [topCategories, setTopCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [addingToCart, setAddingToCart] = useState({});
  const [wishlistItems, setWishlistItems] = useState(new Set());

  const API_URL = 'http://localhost:5000';
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
  const isLoggedIn = !!localStorage.getItem('token');
  const isBuyer = currentUser?.role === 'buyer';

  useEffect(() => {
    fetchHomeData();
    if (isLoggedIn && isBuyer) fetchWishlist();
  }, []);

  const fetchHomeData = async () => {
    try {
      setLoading(true);

      const [featured, trending, categories] = await Promise.all([
        productAPI.getFeaturedProducts().catch(() => ({ data: { data: [] } })),
        productAPI.getTrendingProducts().catch(() => ({ data: { data: [] } })),
        productAPI.getTopCategories().catch(() => ({ data: { data: [] } }))
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
      const productIds = new Set(res.data.data.map(item => item.product_id));
      setWishlistItems(productIds);
    } catch (err) {
      console.error('Fetch wishlist error:', err);
    }
  };

  const handleAddToCart = async (product) => {
    if (!isLoggedIn) { alert('Please login to add items to cart'); navigate('/login'); return; }
    if (!isBuyer) { alert('Only buyers can add items to cart'); return; }
    if (product.stock_quantity <= 0) { alert('Product is out of stock'); return; }

    setAddingToCart(prev => ({ ...prev, [product.product_id]: true }));
    try {
      await cartAPI.addToCart({ product_id: product.product_id, quantity: 1 });
      alert('Added to cart!');
      window.dispatchEvent(new Event('cartUpdated'));
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to add to cart');
    } finally {
      setAddingToCart(prev => ({ ...prev, [product.product_id]: false }));
    }
  };

  const toggleWishlist = async (e, productId) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isLoggedIn) { alert('Please login to use wishlist'); navigate('/login'); return; }
    if (!isBuyer) { alert('Only buyers can use wishlist'); return; }

    try {
      if (wishlistItems.has(productId)) {
        await wishlistAPI.removeFromWishlist(productId);
        setWishlistItems(prev => { const s = new Set(prev); s.delete(productId); return s; });
      } else {
        await wishlistAPI.addToWishlist({ product_id: productId });
        setWishlistItems(prev => new Set(prev).add(productId));
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update wishlist');
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

            {/* Discount badge on image */}
            {product.has_discount && product.discount_percentage > 0 && (
              <span className="home-discount-badge">
                -{product.discount_percentage}%
              </span>
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
                    <span className="home-original-price">
                      Rs. {parseFloat(product.price).toLocaleString()}
                    </span>
                    <span className="home-discounted-price">
                      Rs. {discountedPrice.toLocaleString()}
                    </span>
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
              'Adding...'
            ) : (
              <><Icons.Cart size={16} /><span>Add to Cart</span></>
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
          <h1 className="hero-title">Discover Authentic Nepali Handicrafts</h1>
          <p className="hero-subtitle">Supporting local artisans, preserving traditional crafts</p>
          <div className="hero-buttons">
            <Link to="/products" className="btn-hero-primary">
              <Icons.Package size={20} /><span>Shop Now</span>
            </Link>
            <Link to="/register-seller" className="btn-hero-secondary">
              <Icons.Shop size={20} /><span>Become a Seller</span>
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
          <h2>Shop by Category</h2>
          <Link to="/products" className="view-all">View All <Icons.ChevronRight size={18} /></Link>
        </div>
        <div className="categories-grid">
          {topCategories.slice(0, 8).map((category) => (
            <Link
              key={category.category_id}
              to={`/products?category=${category.category_id}`}
              className="category-card"
            >
              <h3 className="category-name">{category.name}</h3>
              <p className="category-count">{category.product_count || 0} products</p>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured Products */}
      {featuredProducts.length > 0 && (
        <section className="products-section featured-section">
          <div className="section-header">
            <div>
              <h2><Icons.TrendingUp size={28} style={{ color: '#DC2626' }} /> Featured Products</h2>
              <p>Handpicked by our team</p>
            </div>
            <Link to="/products" className="view-all">View All <Icons.ChevronRight size={18} /></Link>
          </div>
          <div className="products-grid">
            {featuredProducts.map(product => <ProductCard key={product.product_id} product={product} />)}
          </div>
        </section>
      )}

      {/* Trending Products */}
      {trendingProducts.length > 0 && (
        <section className="products-section trending-section">
          <div className="section-header">
            <div>
              <h2><Icons.TrendingUp size={28} style={{ color: '#F59E0B' }} /> Trending Now</h2>
              <p>Most popular this month</p>
            </div>
            <Link to="/products" className="view-all">View All <Icons.ChevronRight size={18} /></Link>
          </div>
          <div className="products-grid">
            {trendingProducts.map(product => <ProductCard key={product.product_id} product={product} />)}
          </div>
        </section>
      )}

      {/* Why Choose Us */}
      <section className="features-section">
        <h2 className="section-title">Why Choose HastaKrafts?</h2>
        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon" style={{ background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)' }}>
              <Icons.CheckCircle size={32} />
            </div>
            <h3>Authentic Products</h3>
            <p>100% genuine handmade crafts from local artisans</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon" style={{ background: 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)' }}>
              <Icons.Truck size={32} />
            </div>
            <h3>Nationwide Delivery</h3>
            <p>Fast and reliable shipping across Nepal</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon" style={{ background: 'linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)' }}>
              <Icons.CheckCircle size={32} />
            </div>
            <h3>Secure Payment</h3>
            <p>Multiple payment options for your convenience</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon" style={{ background: 'linear-gradient(135deg, #EC4899 0%, #DB2777 100%)' }}>
              <Icons.Heart size={32} />
            </div>
            <h3>Support Artisans</h3>
            <p>Directly support local craftspeople and their families</p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;