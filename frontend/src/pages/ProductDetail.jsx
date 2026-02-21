import React, { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { productAPI, cartAPI } from "../api/axios";
import Reviews from "../components/Reviews";
import Icons from "../utils/icons";
import "../styles/ProductDetail.css";

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [addingToCart, setAddingToCart] = useState(false);
  const [reviewStats, setReviewStats] = useState({ totalReviews: 0, averageRating: 0 });

  const [selectedLanguage, setSelectedLanguage] = useState('en');
  const [translatedDescription, setTranslatedDescription] = useState('');
  const [translating, setTranslating] = useState(false);
  const [supportedLanguages, setSupportedLanguages] = useState({});

  const API_URL = "http://localhost:5000";
  const currentUser = JSON.parse(localStorage.getItem("user") || "{}");
  const isLoggedIn = !!localStorage.getItem("token");
  const isSeller = currentUser?.role === "seller";
  const isAdmin = currentUser?.role === "admin";
  const canBuy = isLoggedIn && !isSeller && !isAdmin;

  useEffect(() => {
    fetchProduct();
    fetchSupportedLanguages();
  }, [id]);

  const fetchProduct = async () => {
    try {
      setLoading(true);
      const res = await productAPI.getProductById(id);
      setProduct(res.data.data);
      setTranslatedDescription(res.data.data.description);
      setError("");
    } catch (err) {
      console.error("Fetch product error:", err);
      setError("Product not found");
    } finally {
      setLoading(false);
    }
  };

  const fetchSupportedLanguages = async () => {
    try {
      const res = await productAPI.getSupportedLanguages();
      setSupportedLanguages(res.data.data || {});
    } catch (err) {
      console.error('Fetch languages error:', err);
    }
  };

  const handleLanguageChange = async (langCode) => {
    if (langCode === 'en') {
      setSelectedLanguage('en');
      setTranslatedDescription(product.description);
      return;
    }

    setSelectedLanguage(langCode);
    setTranslating(true);

    try {
      const res = await productAPI.translateProduct(product.product_id, { language: langCode });
      if (res.data.success) {
        setTranslatedDescription(res.data.data.translated);
      }
    } catch (err) {
      console.error('Translation error:', err);
      alert('Translation failed. Showing original text.');
      setTranslatedDescription(product.description);
    } finally {
      setTranslating(false);
    }
  };

  const handleStatsChange = (stats) => {
    setReviewStats({
      totalReviews: stats.totalReviews || 0,
      averageRating: stats.averageRating || 0,
    });
  };

  const handleQuantityChange = (type) => {
    if (type === "increment" && quantity < product.stock_quantity) {
      setQuantity((prev) => prev + 1);
    } else if (type === "decrement" && quantity > 1) {
      setQuantity((prev) => prev - 1);
    }
  };

  const handleAddToCart = async () => {
    if (!isLoggedIn) { alert("Please login to add items to cart"); navigate("/login"); return; }
    if (!canBuy) { alert(isAdmin ? "Admins cannot purchase items" : "Sellers cannot purchase items"); return; }
    if (quantity > product.stock_quantity) { alert(`Only ${product.stock_quantity} items available`); return; }

    setAddingToCart(true);
    try {
      const res = await cartAPI.addToCart({ product_id: product.product_id, quantity });
      if (res.data.success) {
        alert("Item added to cart!");
        window.dispatchEvent(new Event("cartUpdated"));
        setQuantity(1);
      }
    } catch (err) {
      alert(err.response?.data?.message || "Failed to add item to cart");
    } finally {
      setAddingToCart(false);
    }
  };

  const handleChatWithArtisan = () => {
    if (!isLoggedIn) { alert("Please login to chat with the artisan"); navigate("/login"); return; }
    if (!canBuy) { alert(isAdmin ? "Admins cannot message sellers" : "Sellers cannot message other sellers"); return; }
    if (!product?.seller?.user_id) { alert("Seller information not available"); return; }
    navigate(`/messages?partner=${product.seller.user_id}`);
  };

  const renderStars = (rating) => (
    <div className="stars">
      {[1, 2, 3, 4, 5].map((star) => (
        <span key={star}>
          {star <= Math.round(rating)
            ? <Icons.StarFilled size={18} style={{ color: "#E8821A" }} />
            : <Icons.StarOutline size={18} style={{ color: "#C8BFB5" }} />}
        </span>
      ))}
    </div>
  );

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading product...</p>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="error-container">
        <h2>Product Not Found</h2>
        <p>{error}</p>
        <Link to="/products" className="btn-primary">Back to Products</Link>
      </div>
    );
  }

  const discountedPrice = product.has_discount && product.discount_percentage > 0
    ? Math.round(product.price * (1 - product.discount_percentage / 100))
    : null;

  const savings = discountedPrice
    ? Math.round(product.price * product.discount_percentage / 100)
    : null;

  return (
    <div className="product-detail-page">
      <div className="product-detail-container">
        <nav className="breadcrumb">
          <Link to="/">Home</Link><span>/</span>
          <Link to="/products">Products</Link><span>/</span>
          <span>{product.name}</span>
        </nav>

        <div className="product-detail-content">
          {/* GALLERY */}
          <div className="product-gallery">
            <div className="main-image">
              {product.images?.length > 0 ? (
                <img src={`${API_URL}${product.images[selectedImage]}`} alt={product.name} />
              ) : (
                <div className="no-image">No Image Available</div>
              )}
            </div>
            {product.images?.length > 1 && (
              <div className="image-thumbnails">
                {product.images.map((img, index) => (
                  <button
                    key={index}
                    className={`thumbnail ${index === selectedImage ? "active" : ""}`}
                    onClick={() => setSelectedImage(index)}
                  >
                    <img src={`${API_URL}${img}`} alt={`${product.name} ${index + 1}`} />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* INFO */}
          <div className="product-info-section">
            <h1 className="product-title">{product.name}</h1>

            {product.seller && (
              <div className="seller-info">
                <div className="seller-avatar">
                  {product.seller.shop_logo
                    ? <img src={`${API_URL}${product.seller.shop_logo}`} alt={product.seller.shop_name} />
                    : <Icons.Shop size={32} />}
                </div>
                <div>
                  <p className="seller-name">{product.seller.shop_name}</p>
                  <p className="seller-location">{product.seller.city}</p>
                </div>
              </div>
            )}

            {/* RATING */}
            <div className="product-rating">
              {renderStars(reviewStats.averageRating)}
              <span className="rating-text">
                {reviewStats.averageRating > 0 ? reviewStats.averageRating.toFixed(1) : "0.0"}
                {" "}({reviewStats.totalReviews} {reviewStats.totalReviews === 1 ? "review" : "reviews"})
              </span>
            </div>

            {/* PRICE SECTION */}
            <div className="product-price-section">
              {discountedPrice ? (
                <div className="price-with-discount">
                  <div className="discount-badge-large">
                    -{product.discount_percentage}% OFF
                  </div>
                  <div className="price-display">
                    <span className="original-price-large">
                      Rs. {parseFloat(product.price).toLocaleString()}
                    </span>
                    <div className="discounted-price-large">
                      <span className="currency">Rs.</span>
                      <span className="amount">{discountedPrice.toLocaleString()}</span>
                    </div>
                    <div className="savings-amount">
                      You save Rs. {savings.toLocaleString()}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="price">
                  <span className="currency">Rs.</span>
                  <span className="amount">{parseFloat(product.price).toLocaleString()}</span>
                </div>
              )}

              <div className={`stock ${product.stock_quantity > 0 ? "in-stock" : "out-of-stock"}`}>
                {product.stock_quantity > 0
                  ? <><span className="stock-dot" />{product.stock_quantity} in stock</>
                  : "Out of Stock"}
              </div>
            </div>

            {/* LANGUAGE SELECTOR */}
            <div className="language-selector-section">
              <label className="language-label">Language:</label>
              <select
                value={selectedLanguage}
                onChange={(e) => handleLanguageChange(e.target.value)}
                className="language-dropdown"
                disabled={translating}
              >
                {Object.entries(supportedLanguages).map(([code, { name, flag }]) => (
                  <option key={code} value={code}>
                    {flag} {name}
                  </option>
                ))}
              </select>
              {translating && <span className="translating-indicator">⏳ Translating...</span>}
            </div>

            {/* TRANSLATED DESCRIPTION */}
            <div className="product-description">
              <h3>Product Description</h3>
              {translating ? (
                <div className="translating-box">
                  <div className="spinner-small"></div>
                  <p>Translating to {supportedLanguages[selectedLanguage]?.name}...</p>
                </div>
              ) : (
                <p>{translatedDescription}</p>
              )}
            </div>

            <div className="product-details">
              <h3>Details</h3>
              <ul>
                {product.category && <li><strong>Category:</strong> {product.category.icon} {product.category.name}</li>}
                {product.sku && <li><strong>SKU:</strong> {product.sku}</li>}
                <li><strong>Availability:</strong> {product.stock_quantity > 0 ? "In Stock" : "Out of Stock"}</li>
              </ul>
            </div>

            {product.stock_quantity > 0 && canBuy && (
              <div className="product-actions">
                <div className="quantity-selector">
                  <button onClick={() => handleQuantityChange("decrement")} disabled={quantity <= 1}>-</button>
                  <input type="number" value={quantity} readOnly />
                  <button onClick={() => handleQuantityChange("increment")} disabled={quantity >= product.stock_quantity}>+</button>
                </div>
                <button className="btn-add-to-cart" onClick={handleAddToCart} disabled={addingToCart}>
                  {addingToCart ? "Adding..." : "Add to Cart"}
                </button>
              </div>
            )}

            {canBuy && (
              <button className="btn-chat" onClick={handleChatWithArtisan}>
                <Icons.Messages size={18} />
                <span>Chat with Artisan</span>
              </button>
            )}
          </div>
        </div>

        {/* REVIEWS */}
        <Reviews
          productId={product.product_id}
          currentUser={currentUser}
          isLoggedIn={isLoggedIn}
          canBuy={canBuy}
          onStatsChange={handleStatsChange}
        />
      </div>
    </div>
  );
};

export default ProductDetail;