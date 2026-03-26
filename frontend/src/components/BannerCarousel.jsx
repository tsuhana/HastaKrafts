import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { productAPI } from '../api/axios';
import './BannerCarousel.css';

const BannerCarousel = () => {
  const [banners, setBanners] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  const API_URL = 'http://localhost:5000';

  useEffect(() => {
    fetchBanners();
  }, []);

  useEffect(() => {
    if (!isAutoPlaying || banners.length === 0) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % banners.length);
    }, 5000); // Auto-slide every 5 seconds

    return () => clearInterval(interval);
  }, [isAutoPlaying, banners.length]);

  const fetchBanners = async () => {
    try {
      const res = await productAPI.getActiveBanners();
      setBanners(res.data.data || []);
    } catch (err) {
      console.error('Fetch banners error:', err);
    }
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + banners.length) % banners.length);
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % banners.length);
  };

  const handleDotClick = (index) => {
    setCurrentIndex(index);
  };

  if (banners.length === 0) return null;

  const currentBanner = banners[currentIndex];

  const BannerContent = () => (
    <div className="banner-slide">
      <img 
        src={`${API_URL}${currentBanner.image}`} 
        alt={currentBanner.title}
        className="banner-image"
      />
      {currentBanner.title && (
        <div className="banner-overlay">
          <div className="banner-text">
            <h2>{currentBanner.title}</h2>
            {currentBanner.description && <p>{currentBanner.description}</p>}
          </div>
        </div>
      )}
    </div>
  );

  return (
    <section 
      className="banner-carousel"
      onMouseEnter={() => setIsAutoPlaying(false)}
      onMouseLeave={() => setIsAutoPlaying(true)}
    >
      <div className="carousel-container">
        {/* Banner Slide */}
        {currentBanner.link_url && currentBanner.link_type !== 'none' ? (
          currentBanner.link_type === 'external' ? (
            <a 
              href={currentBanner.link_url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="banner-link"
            >
              <BannerContent />
            </a>
          ) : (
            <Link to={currentBanner.link_url} className="banner-link">
              <BannerContent />
            </Link>
          )
        ) : (
          <BannerContent />
        )}

        {/* Navigation Arrows */}
        {banners.length > 1 && (
          <>
            <button 
              className="carousel-arrow arrow-left" 
              onClick={handlePrev}
              aria-label="Previous banner"
            >
              ‹
            </button>
            <button 
              className="carousel-arrow arrow-right" 
              onClick={handleNext}
              aria-label="Next banner"
            >
              ›
            </button>
          </>
        )}

        {/* Dots Indicator */}
        {banners.length > 1 && (
          <div className="carousel-dots">
            {banners.map((_, index) => (
              <button
                key={index}
                className={`carousel-dot ${index === currentIndex ? 'active' : ''}`}
                onClick={() => handleDotClick(index)}
                aria-label={`Go to banner ${index + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default BannerCarousel;