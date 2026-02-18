import React, { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { productAPI, cartAPI } from "../api/axios";
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

  const API_URL = "http://localhost:5000";
  const currentUser = JSON.parse(localStorage.getItem("user") || "{}");
  const isLoggedIn = !!localStorage.getItem("token");
  const isSeller = currentUser?.role === "seller";
  const isAdmin = currentUser?.role === "admin";
  const canBuy = isLoggedIn && !isSeller && !isAdmin; // Only buyers can purchase

  useEffect(() => {
    fetchProduct();
  }, [id]);

  const fetchProduct = async () => {
    try {
      setLoading(true);
      const res = await productAPI.getProductById(id);
      setProduct(res.data.data);
      setError("");
    } catch (err) {
      console.error("Fetch product error:", err);
      setError("Product not found");
    } finally {
      setLoading(false);
    }
  };

  const handleQuantityChange = (type) => {
    if (type === "increment" && quantity < product.stock_quantity) {
      setQuantity((prev) => prev + 1);
    } else if (type === "decrement" && quantity > 1) {
      setQuantity((prev) => prev - 1);
    }
  };

  const handleAddToCart = async () => {
    if (!isLoggedIn) {
      alert("Please login to add items to cart");
      navigate("/login");
      return;
    }

    if (!canBuy) {
      alert(isAdmin ? "Admins cannot purchase items" : "Sellers cannot purchase items");
      return;
    }

    if (quantity > product.stock_quantity) {
      alert(`Only ${product.stock_quantity} items available`);
      return;
    }

    setAddingToCart(true);
    try {
      const res = await cartAPI.addToCart({
        product_id: product.product_id,
        quantity: quantity,
      });

      if (res.data.success) {
        alert("Item added to cart!");
        window.dispatchEvent(new Event("cartUpdated"));
        setQuantity(1);
      }
    } catch (err) {
      console.error("Error adding to cart:", err);
      alert(err.response?.data?.message || "Failed to add item to cart");
    } finally {
      setAddingToCart(false);
    }
  };

  const handleBuyNow = async () => {
    if (!isLoggedIn) {
      alert("Please login to purchase");
      navigate("/login");
      return;
    }

    if (!canBuy) {
      alert(isAdmin ? "Admins cannot purchase items" : "Sellers cannot purchase items");
      return;
    }

    await handleAddToCart();
    navigate("/cart");
  };

  // ==================== CHAT WITH ARTISAN ====================
  const handleChatWithArtisan = () => {
    if (!isLoggedIn) {
      alert("Please login to chat with the artisan");
      navigate("/login");
      return;
    }

    if (!canBuy) {
      alert(isAdmin ? "Admins cannot message sellers" : "Sellers cannot message other sellers");
      return;
    }

    if (!product?.seller?.user_id) {
      alert("Seller information not available");
      return;
    }

    // Navigate to messages page with seller pre-selected
    navigate(`/messages?partner=${product.seller.user_id}`);
  };

  // ==================== LOADING & ERROR ====================
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
        <Link to="/products" className="btn-primary">
          Back to Products
        </Link>
      </div>
    );
  }

  // ==================== RENDER ====================
  return (
    <div className="product-detail-page">
      <div className="product-detail-container">

        {/* Breadcrumb */}
        <nav className="breadcrumb">
          <Link to="/">Home</Link>
          <span>/</span>
          <Link to="/products">Products</Link>
          <span>/</span>
          <span>{product.name}</span>
        </nav>

        <div className="product-detail-content">

          {/* ===== IMAGE GALLERY ===== */}
          <div className="product-gallery">
            <div className="main-image">
              {product.images && product.images.length > 0 ? (
                <img
                  src={`${API_URL}${product.images[selectedImage]}`}
                  alt={product.name}
                />
              ) : (
                <div className="no-image">No Image Available</div>
              )}
            </div>

            {product.images && product.images.length > 1 && (
              <div className="image-thumbnails">
                {product.images.map((img, index) => (
                  <button
                    key={index}
                    className={`thumbnail ${
                      index === selectedImage ? "active" : ""
                    }`}
                    onClick={() => setSelectedImage(index)}
                  >
                    <img
                      src={`${API_URL}${img}`}
                      alt={`${product.name} ${index + 1}`}
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* ===== PRODUCT INFO ===== */}
          <div className="product-info-section">
            <h1 className="product-title">{product.name}</h1>

            {/* Seller Info */}
            {product.seller && (
              <div className="seller-info">
                <div className="seller-avatar">
                  {product.seller.shop_logo ? (
                    <img
                      src={`${API_URL}${product.seller.shop_logo}`}
                      alt={product.seller.shop_name}
                    />
                  ) : (
                    <span className="seller-icon">🏪</span>
                  )}
                </div>
                <div>
                  <p className="seller-name">{product.seller.shop_name}</p>
                  <p className="seller-location">{product.seller.city}</p>
                </div>
              </div>
            )}

            {/* Rating */}
            <div className="product-rating">
              <div className="stars">{"⭐".repeat(5)}</div>
              <span className="rating-text">(0 reviews)</span>
            </div>

            {/* Price */}
            <div className="product-price-section">
              <div className="price">
                <span className="currency">Rs.</span>
                <span className="amount">
                  {parseFloat(product.price).toLocaleString()}
                </span>
              </div>

              <div
                className={`stock ${
                  product.stock_quantity > 0 ? "in-stock" : "out-of-stock"
                }`}
              >
                {product.stock_quantity > 0 ? (
                  <>
                    <span className="stock-dot"></span>
                    {product.stock_quantity} in stock
                  </>
                ) : (
                  "Out of Stock"
                )}
              </div>
            </div>

            {/* Description */}
            <div className="product-description">
              <h3>Product Description</h3>
              <p>{product.description}</p>
            </div>

            {/* Details */}
            <div className="product-details">
              <h3>Details</h3>
              <ul>
                {product.category && (
                  <li>
                    <strong>Category:</strong> {product.category.icon}{" "}
                    {product.category.name}
                  </li>
                )}
                {product.sku && (
                  <li>
                    <strong>SKU:</strong> {product.sku}
                  </li>
                )}
                <li>
                  <strong>Availability:</strong>{" "}
                  {product.stock_quantity > 0 ? "In Stock" : "Out of Stock"}
                </li>
              </ul>
            </div>

            {/* Add to Cart & Buy Now — buyers only */}
            {product.stock_quantity > 0 && canBuy && (
              <div className="product-actions">
                <div className="quantity-selector">
                  <button
                    onClick={() => handleQuantityChange("decrement")}
                    disabled={quantity <= 1}
                  >
                    -
                  </button>
                  <input type="number" value={quantity} readOnly />
                  <button
                    onClick={() => handleQuantityChange("increment")}
                    disabled={quantity >= product.stock_quantity}
                  >
                    +
                  </button>
                </div>

                <button
                  className="btn-add-to-cart"
                  onClick={handleAddToCart}
                  disabled={addingToCart}
                >
                  {addingToCart ? "Adding..." : "Add to Cart"}
                </button>

  
              </div>
            )}

            {/* Chat with Artisan — show for buyers only */}
            {canBuy && (
              <button className="btn-chat" onClick={handleChatWithArtisan}>
                 Chat with Artisan
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;