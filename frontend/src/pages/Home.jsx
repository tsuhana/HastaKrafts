import React from 'react';
import { Link } from 'react-router-dom';
import '../styles/Home.css';

const Home = () => {
  // Mock product data - replace with API call later
  const featuredProducts = [
    { id: 1, name: 'Handmade Clay Pot', price: 'Rs. 500', image: '🏺' },
    { id: 2, name: 'Woven Basket', price: 'Rs. 800', image: '🧺' },
    { id: 3, name: 'Wooden Sculpture', price: 'Rs. 1500', image: '🗿' },
    { id: 4, name: 'Traditional Dhaka', price: 'Rs. 1200', image: '🧵' },
    { id: 5, name: 'Handmade Jewelry', price: 'Rs. 600', image: '📿' },
    { id: 6, name: 'Pottery Set', price: 'Rs. 2000', image: '🫖' },
    { id: 7, name: 'Carpet Rug', price: 'Rs. 3500', image: '🪢' },
    { id: 8, name: 'Metal Crafts', price: 'Rs. 900', image: '⚱️' },
  ];

  return (
    <div className="home">
      {/* Hero Section */}
      <section className="hero">
        <div className="hero-content">
          <h1>Discover Authentic Nepali Handicrafts</h1>
          <p>Supporting local artisans, preserving traditional crafts</p>
          <div className="hero-buttons">
            <Link to="/products" className="btn-primary">Shop Now</Link>
            <Link to="/register-seller" className="btn-secondary">Become a Seller</Link>
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="categories">
        <div className="container">
          <h2 className="section-title">Shop by Category</h2>
          <div className="category-grid">
            <div className="category-card">
              <div className="category-icon">🏺</div>
              <h3>Pottery</h3>
            </div>
            <div className="category-card">
              <div className="category-icon">🧺</div>
              <h3>Baskets</h3>
            </div>
            <div className="category-card">
              <div className="category-icon">🧵</div>
              <h3>Textiles</h3>
            </div>
            <div className="category-card">
              <div className="category-icon">📿</div>
              <h3>Jewelry</h3>
            </div>
            <div className="category-card">
              <div className="category-icon">🗿</div>
              <h3>Sculptures</h3>
            </div>
            <div className="category-card">
              <div className="category-icon">⚱️</div>
              <h3>Metal Crafts</h3>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="featured-products">
        <div className="container">
          <h2 className="section-title">Featured Products</h2>
          <div className="product-grid">
            {featuredProducts.map(product => (
              <div key={product.id} className="product-card">
                <div className="product-image">{product.image}</div>
                <div className="product-info">
                  <h3>{product.name}</h3>
                  <p className="product-price">{product.price}</p>
                  <button className="btn-add-cart">Add to Cart</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="why-us">
        <div className="container">
          <h2 className="section-title">Why Choose HastaKrafts?</h2>
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">✅</div>
              <h3>Authentic Products</h3>
              <p>100% genuine handmade crafts from local artisans</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🚚</div>
              <h3>Nationwide Delivery</h3>
              <p>Fast and reliable shipping across Nepal</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">💳</div>
              <h3>Secure Payment</h3>
              <p>Multiple payment options for your convenience</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">❤️</div>
              <h3>Support Artisans</h3>
              <p>Directly support local craftspeople and their families</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;