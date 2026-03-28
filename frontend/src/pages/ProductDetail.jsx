import React, { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { productAPI, cartAPI } from "../api/axios";
import { useToast } from "../context/ToastContext";
import { useTranslation } from "react-i18next";
import Reviews from "../components/Reviews";
import Icons from "../utils/icons";
import "../styles/ProductDetail.css";

const API_URL = "http://localhost:5000";
const ML_API  = "http://localhost:5001";

const ProductDetail = () => {
  const { id }       = useParams();
  const navigate     = useNavigate();
  const toast        = useToast();
  const { t }        = useTranslation();

  const [product, setProduct]             = useState(null);
  const [loading, setLoading]             = useState(true);
  const [error, setError]                 = useState("");
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity]           = useState(1);
  const [addingToCart, setAddingToCart]   = useState(false);
  const [reviewStats, setReviewStats]     = useState({ totalReviews: 0, averageRating: 0 });

  // You may also like
  const [similarProducts, setSimilarProducts] = useState([]);
  const [similarLoading, setSimilarLoading]   = useState(false);

  const currentUser = JSON.parse(localStorage.getItem("user") || "{}");
  const isLoggedIn  = !!localStorage.getItem("token");
  const isSeller    = currentUser?.role === "seller";
  const isAdmin     = currentUser?.role === "admin";
  const canBuy      = isLoggedIn && !isSeller && !isAdmin;

  useEffect(() => {
    fetchProduct();
  }, [id]);

  const fetchProduct = async () => {
    try {
      setLoading(true);
      const res = await productAPI.getProductById(id);
      setProduct(res.data.data);
      setError("");
      // Fetch similar products after product loads
      fetchSimilarProducts(res.data.data.product_id);
    } catch (err) {
      console.error("Fetch product error:", err);
      setError("Product not found");
    } finally {
      setLoading(false);
    }
  };

  // ── You May Also Like ──────────────────────────────────
  const fetchSimilarProducts = async (productId) => {
    try {
      setSimilarLoading(true);
      // 1. Get similar product IDs from Flask ML API
      const mlRes  = await fetch(`${ML_API}/recommend/similar/${productId}?n=4`);
      const mlData = await mlRes.json();
      const similarIds = mlData.similar_products?.map((r) => r.product_id) || [];

      if (similarIds.length === 0) return;

      // 2. Fetch full product details from Node.js backend
      const results = await Promise.all(
        similarIds.map((sid) => productAPI.getProductById(sid).catch(() => null))
      );
      const full = results
        .filter((r) => r && r.data?.data)
        .map((r) => r.data.data);

      setSimilarProducts(full);
    } catch (err) {
      console.error("Similar products error:", err);
    } finally {
      setSimilarLoading(false);
    }
  };
  // ────────────────────────────────────────────────────────

  const handleStatsChange = (stats) => {
    setReviewStats({
      totalReviews:  stats.totalReviews  || 0,
      averageRating: stats.averageRating || 0,
    });
  };

  const handleQuantityChange = (type) => {
    if (type === "increment" && quantity < product.stock_quantity)
      setQuantity((prev) => prev + 1);
    else if (type === "decrement" && quantity > 1)
      setQuantity((prev) => prev - 1);
  };

  const handleAddToCart = async (productToBuy = null, qty = null) => {
    const targetProduct = productToBuy || product;
    const targetQty     = qty || quantity;

    if (!isLoggedIn) {
      toast.error("Please login to add items to cart");
      navigate("/login");
      return;
    }
    if (!canBuy) {
      toast.error(isAdmin ? "Admins cannot purchase items" : "Sellers cannot purchase items");
      return;
    }
    if (targetQty > targetProduct.stock_quantity) {
      toast.warning(`Only ${targetProduct.stock_quantity} items available`);
      return;
    }
    setAddingToCart(true);
    try {
      const res = await cartAPI.addToCart({ product_id: targetProduct.product_id, quantity: targetQty });
      if (res.data.success) {
        toast.success("Item added to cart!");
        window.dispatchEvent(new Event("cartUpdated"));
        if (!productToBuy) setQuantity(1);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to add item to cart");
    } finally {
      setAddingToCart(false);
    }
  };

  const handleChatWithArtisan = () => {
    if (!isLoggedIn) {
      toast.error("Please login to chat with the artisan");
      navigate("/login");
      return;
    }
    if (!canBuy) {
      toast.error(isAdmin ? "Admins cannot message sellers" : "Sellers cannot message other sellers");
      return;
    }
    if (!product?.seller?.user_id) {
      toast.error("Seller information not available");
      return;
    }
    navigate(`/messages?partner=${product.seller.user_id}`);
  };

  const renderStars = (rating) => (
    <div className="stars">
      {[1, 2, 3, 4, 5].map((star) => (
        <span key={star}>
          {star <= Math.round(rating)
            ? <Icons.StarFilled  size={18} style={{ color: "#E8821A" }} />
            : <Icons.StarOutline size={18} style={{ color: "#C8BFB5" }} />
          }
        </span>
      ))}
    </div>
  );

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>{t("common.loading")}</p>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="error-container">
        <h2>Product Not Found</h2>
        <p>{error}</p>
        <Link to="/products" className="btn-primary">{t("common.back")}</Link>
      </div>
    );
  }

  const discountedPrice =
    product.has_discount && product.discount_percentage > 0
      ? Math.round(product.price * (1 - product.discount_percentage / 100))
      : null;
  const savings = discountedPrice
    ? Math.round(product.price * product.discount_percentage / 100)
    : null;

  return (
    <div className="product-detail-page">
      <div className="product-detail-container">

        {/* Breadcrumb */}
        <nav className="breadcrumb">
          <Link to="/">{t("nav.home")}</Link>
          <span>/</span>
          <Link to="/products">{t("nav.products")}</Link>
          <span>/</span>
          <span>{product.name}</span>
        </nav>

        <div className="product-detail-content">

          {/* ── GALLERY ── */}
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

          {/* ── PRODUCT INFO ── */}
          <div className="product-info-section">
            <h1 className="product-title">{product.name}</h1>

            {/* Seller Card */}
            {product.seller && (
              <div className="seller-info">
                <div className="seller-avatar">
                  {product.seller.shop_logo ? (
                    <img src={`${API_URL}${product.seller.shop_logo}`} alt={product.seller.shop_name} />
                  ) : (
                    <Icons.Shop size={32} />
                  )}
                </div>
                <div className="seller-details">
                  <p className="seller-name">{product.seller.shop_name}</p>
                  {product.seller.city && (
                    <p className="seller-location">{product.seller.city}</p>
                  )}
                  {product.seller.shop_description && (
                    <p className="seller-description">{product.seller.shop_description}</p>
                  )}
                </div>
              </div>
            )}

            {/* Rating */}
            <div className="product-rating">
              {renderStars(reviewStats.averageRating)}
              <span className="rating-text">
                {reviewStats.averageRating > 0 ? reviewStats.averageRating.toFixed(1) : "0.0"}
                {" "}({reviewStats.totalReviews}{" "}
                {reviewStats.totalReviews === 1 ? t("product_detail.review") : t("product_detail.reviews")})
              </span>
            </div>

            {/* Price */}
            <div className="product-price-section">
              {discountedPrice ? (
                <div className="price-with-discount">
                  <div className="discount-badge-large">
                    -{product.discount_percentage}% {t("product_detail.off")}
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
                      {t("product_detail.you_save")} Rs. {savings.toLocaleString()}
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
                {product.stock_quantity > 0 ? (
                  <><span className="stock-dot" />{product.stock_quantity} {t("products.in_stock")}</>
                ) : (
                  t("products.out_of_stock")
                )}
              </div>
            </div>

            {/* Description */}
            <div className="product-description">
              <h3>{t("product_detail.description")}</h3>
              <p>{product.description}</p>
            </div>

            {/* Details */}
            <div className="product-details">
              <h3>{t("product_detail.details")}</h3>
              <ul>
                {product.category && (
                  <li>
                    <strong>{t("product_detail.category")}:</strong>{" "}
                    {product.category.icon} {product.category.name}
                  </li>
                )}
                {product.sku && (
                  <li><strong>{t("product_detail.sku")}:</strong> {product.sku}</li>
                )}
                <li>
                  <strong>{t("product_detail.availability")}:</strong>{" "}
                  {product.stock_quantity > 0 ? t("products.in_stock") : t("products.out_of_stock")}
                </li>
              </ul>
            </div>

            {/* Add to cart */}
            {product.stock_quantity > 0 && canBuy && (
              <div className="product-actions">
                <div className="quantity-selector">
                  <button onClick={() => handleQuantityChange("decrement")} disabled={quantity <= 1}>-</button>
                  <input type="number" value={quantity} readOnly />
                  <button onClick={() => handleQuantityChange("increment")} disabled={quantity >= product.stock_quantity}>+</button>
                </div>
                <button className="btn-add-to-cart" onClick={() => handleAddToCart()} disabled={addingToCart}>
                  {addingToCart ? t("common.loading") : t("products.add_to_cart")}
                </button>
              </div>
            )}

            {/* Chat with artisan */}
            {canBuy && (
              <button className="btn-chat" onClick={handleChatWithArtisan}>
                <Icons.Messages size={18} />
                <span>{t("product_detail.chat_with_artisan")}</span>
              </button>
            )}
          </div>
        </div>

        {/* ── You May Also Like ── */}
        {(similarProducts.length > 0 || similarLoading) && (
          <section style={{ marginTop: '3rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '1.5rem' }}>
              <h2 style={{ margin: 0, fontSize: '1.4rem', fontWeight: '600' }}>
                You May Also Like
              </h2>
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
            </div>

            {similarLoading ? (
              <div className="loading-container" style={{ minHeight: '120px' }}>
                <div className="spinner"></div>
                <p>Finding similar products...</p>
              </div>
            ) : (
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                gap: '1.5rem',
              }}>
                {similarProducts.map((p) => {
                  const discounted = p.has_discount && p.discount_percentage > 0
                    ? Math.round(p.price * (1 - p.discount_percentage / 100))
                    : null;
                  return (
                    <Link
                      key={p.product_id}
                      to={`/products/${p.product_id}`}
                      style={{ textDecoration: 'none', color: 'inherit' }}
                    >
                      <div style={{
                        border: '1px solid var(--border-color, #e5e7eb)',
                        borderRadius: '12px',
                        overflow: 'hidden',
                        transition: 'transform 0.2s, box-shadow 0.2s',
                        background: 'var(--card-bg, white)',
                        cursor: 'pointer',
                      }}
                        onMouseEnter={e => {
                          e.currentTarget.style.transform = 'translateY(-4px)';
                          e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.1)';
                        }}
                        onMouseLeave={e => {
                          e.currentTarget.style.transform = 'translateY(0)';
                          e.currentTarget.style.boxShadow = 'none';
                        }}
                      >
                        {/* Image */}
                        <div style={{ position: 'relative', height: '180px', background: '#f9f5f0' }}>
                          {p.images?.length > 0 ? (
                            <img
                              src={`${API_URL}${p.images[0]}`}
                              alt={p.name}
                              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            />
                          ) : (
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                              <Icons.Package size={40} />
                            </div>
                          )}
                          {p.has_discount && p.discount_percentage > 0 && (
                            <span style={{
                              position: 'absolute', top: '8px', left: '8px',
                              background: '#DC2626', color: 'white',
                              fontSize: '11px', fontWeight: '700',
                              padding: '2px 8px', borderRadius: '20px',
                            }}>
                              -{p.discount_percentage}%
                            </span>
                          )}
                        </div>

                        {/* Info */}
                        <div style={{ padding: '12px' }}>
                          <h4 style={{ margin: '0 0 4px', fontSize: '0.9rem', fontWeight: '600',
                            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {p.name}
                          </h4>
                          {p.seller && (
                            <p style={{ margin: '0 0 8px', fontSize: '0.75rem', color: '#9a8268' }}>
                              {p.seller.shop_name}
                            </p>
                          )}
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            {discounted ? (
                              <>
                                <span style={{ fontSize: '0.8rem', color: '#9a8268', textDecoration: 'line-through' }}>
                                  Rs. {parseFloat(p.price).toLocaleString()}
                                </span>
                                <span style={{ fontSize: '1rem', fontWeight: '700', color: '#DC2626' }}>
                                  Rs. {discounted.toLocaleString()}
                                </span>
                              </>
                            ) : (
                              <span style={{ fontSize: '1rem', fontWeight: '700' }}>
                                Rs. {parseFloat(p.price).toLocaleString()}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </section>
        )}

        {/* Reviews */}
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