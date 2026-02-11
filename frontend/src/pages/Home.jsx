import React from 'react';
import { Link } from 'react-router-dom';
import '../styles/Home.css';

const Home = () => {
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
        <div>
          <h1>Discover Authentic Nepali Handicrafts</h1>
          <p>Supporting local artisans, preserving traditional crafts</p>
          <div>
            <Link to="/products">Shop Now</Link>
            <Link to="/register-seller">Become a Seller</Link>
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section>
        <div>
          <h2>Shop by Category</h2>
          <div>
            {[
              { icon: '🏺', name: 'Pottery' },
              { icon: '🧺', name: 'Baskets' },
              { icon: '🧵', name: 'Textiles' },
              { icon: '📿', name: 'Jewelry' },
              { icon: '🗿', name: 'Sculptures' },
              { icon: '⚱️', name: 'Metal Crafts' },
            ].map((cat, idx) => (
              <div key={idx}>
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>{cat.icon}</div>
                <h3 style={{ color: '#2C1810', fontSize: '1.2rem', margin: 0 }}>{cat.name}</h3>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section>
        <div>
          <h2>Featured Products</h2>
          <div>
            {featuredProducts.map(product => (
              <div key={product.id}>
                <div style={{
                  height: '200px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '5rem',
                  background: 'linear-gradient(135deg, #FFF8DC 0%, #FFE6D5 100%)',
                }}>
                  {product.image}
                </div>
                <div style={{ padding: '1.5rem' }}>
                  <h3 style={{ fontSize: '1.2rem', marginBottom: '0.5rem', color: '#2C1810' }}>{product.name}</h3>
                  <p style={{ fontSize: '1.3rem', fontWeight: 'bold', color: '#C17D4A', marginBottom: '1rem' }}>{product.price}</p>
                  <button style={{
                    width: '100%',
                    padding: '0.8rem',
                    background: '#C17D4A',
                    color: '#FFFFFF',
                    border: 'none',
                    borderRadius: '8px',
                    fontWeight: '600',
                    cursor: 'pointer',
                  }}>
                    Add to Cart
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section>
        <div>
          <h2>Why Choose HastaKrafts?</h2>
          <div>
            {[
              { icon: '✅', title: 'Authentic Products', desc: '100% genuine handmade crafts from local artisans' },
              { icon: '🚚', title: 'Nationwide Delivery', desc: 'Fast and reliable shipping across Nepal' },
              { icon: '💳', title: 'Secure Payment', desc: 'Multiple payment options for your convenience' },
              { icon: '❤️', title: 'Support Artisans', desc: 'Directly support local craftspeople and their families' },
            ].map((feature, idx) => (
              <div key={idx}>
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>{feature.icon}</div>
                <h3 style={{ fontSize: '1.3rem', marginBottom: '0.8rem', color: '#2C1810' }}>{feature.title}</h3>
                <p style={{ color: '#5D4E37', lineHeight: '1.6' }}>{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;