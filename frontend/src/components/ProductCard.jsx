import React from 'react';
import { Link } from 'react-router-dom';
import '../styles/ProductCard.css';

const ProductCard = ({ product }) => {
  const API_URL = 'http://localhost:5000';
  
  const getStatusBadge = () => {
    if (!product.status) return null;
    
    const badges = {
      pending: { class: 'badge-pending', text: 'Pending' },
      approved: { class: 'badge-approved', text: 'Live' },
      rejected: { class: 'badge-rejected', text: 'Rejected' },
    };
    
    const badge = badges[product.status];
    return badge ? <span className={`status-badge ${badge.class}`}>{badge.text}</span> : null;
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
              <span>No Image</span>
            </div>
          )}
          {getStatusBadge()}
          {product.is_featured && (
            <span className="featured-badge">Featured</span>
          )}
        </div>

        <div className="product-info">
          <h3 className="product-name">{product.name}</h3>
          
          {product.seller && (
            <p className="product-seller">
              <span className="seller-icon">🏪</span>
              {product.seller.shop_name}
            </p>
          )}

          {product.category && (
            <p className="product-category">
              <span className="category-icon">{product.category.icon}</span>
              {product.category.name}
            </p>
          )}

          <div className="product-footer">
            <div className="product-price">
              <span className="currency">Rs.</span>
              <span className="amount">{parseFloat(product.price).toLocaleString()}</span>
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