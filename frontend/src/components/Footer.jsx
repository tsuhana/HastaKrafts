import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import './Footer.css';
import logo from '../assets/logoo.png';
import khaltiLogo from '../assets/khalti.png';
import codLogo from '../assets/cod.png';

const Footer = () => {
  const { t } = useTranslation();

  return (
    <footer className="footer">

      {/* Wave */}
      <div className="footer-wave">
        <svg viewBox="0 0 1440 55" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
          <path
            className="wave-back"
            d="M0,20 C180,55 360,0 540,25 C720,50 900,5 1080,28 C1260,50 1380,15 1440,20 L1440,0 L0,0 Z"
          />
          <path
            className="wave-front"
            d="M0,35 C200,10 400,50 600,30 C800,10 1000,45 1200,28 C1320,18 1400,38 1440,35 L1440,0 L0,0 Z"
          />
        </svg>
      </div>

      {/* Main content */}
      <div className="footer-grid">

        {/* Brand */}
        <div className="footer-brand">
          <img src={logo} alt="HastaKrafts" className="footer-logo" />
          <p className="footer-tagline">{t('footer.tagline')}</p>
          <div className="footer-socials">
            <a href="https://www.facebook.com" target="_blank" rel="noopener noreferrer" aria-label="Facebook">
              <i className="fab fa-facebook-f"></i>
            </a>
            <a href="https://www.instagram.com" target="_blank" rel="noopener noreferrer" aria-label="Instagram">
              <i className="fab fa-instagram"></i>
            </a>
            <a href="https://www.youtube.com" target="_blank" rel="noopener noreferrer" aria-label="YouTube">
              <i className="fab fa-youtube"></i>
            </a>
            <a href="https://www.tiktok.com" target="_blank" rel="noopener noreferrer" aria-label="TikTok">
              <i className="fab fa-tiktok"></i>
            </a>
          </div>
        </div>

        {/* Explore */}
        <div className="footer-col">
          <h4>{t('footer.explore')}</h4>
          <ul>
            <li><Link to="/">{t('nav.home')}</Link></li>
            <li><Link to="/products">{t('nav.products')}</Link></li>
            <li><Link to="/auctions">{t('nav.auctions')}</Link></li>
            <li><Link to="/blog">{t('nav.blog')}</Link></li>
          </ul>
        </div>

        {/* For Sellers */}
        <div className="footer-col">
          <h4>{t('footer.for_sellers')}</h4>
          <ul>
            <li><Link to="/register-seller">{t('footer.become_seller')}</Link></li>
            <li><Link to="/seller/dashboard">{t('footer.seller_dashboard')}</Link></li>
            <li><Link to="/help">{t('footer.help_center')}</Link></li>
          </ul>
        </div>

        {/* Contact */}
        <div className="footer-col footer-contact">
          <h4>{t('footer.contact_us')}</h4>
          <p><i className="fas fa-map-marker-alt"></i> Kathmandu, Nepal</p>
          <p><i className="fas fa-phone-alt"></i> +977 97XXXXXXXX</p>
          <a href="mailto:support@hastakrafts.com">
            <i className="fas fa-envelope"></i> support@hastakrafts.com
          </a>
        </div>
      </div>

      {/* Bottom */}
      <div className="footer-bottom">
        <p>© {new Date().getFullYear()} HastaKrafts Nepal. {t('footer.rights')}.</p>
        <div className="footer-payments">
          <div className="pay-badge">
            <img src={khaltiLogo} alt="Khalti" />
          </div>
          <div className="pay-badge">
            <img src={codLogo} alt="Cash on Delivery" />
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;