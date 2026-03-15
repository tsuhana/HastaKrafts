import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import '../styles/Footer.css';
import logo from '../assets/logoo.png';

const Footer = () => {
  const { t } = useTranslation();

  return (
    <footer className="footer">

      {/* Wave */}
      <div className="footer-wave">
        <svg viewBox="0 0 1440 160" preserveAspectRatio="none">
          <path d="M0,80 C200,20 400,120 720,60 C1040,0 1280,100 1440,50 L1440,160 L0,160Z" className="wave-back" />
          <path d="M0,110 C240,60 480,140 720,90 C960,40 1200,120 1440,80 L1440,160 L0,160Z" className="wave-front" />
        </svg>
      </div>

      {/* Main content */}
      <div className="footer-grid">

        {/* Brand */}
        <div className="footer-brand">
          <img src={logo} alt="HastaKrafts" className="footer-logo" />
          <p className="footer-tagline">{t('footer.tagline')}</p>
          <div className="footer-socials">
            <a href="#" aria-label="Facebook"><i className="fab fa-facebook-f"></i></a>
            <a href="#" aria-label="Instagram"><i className="fab fa-instagram"></i></a>
            <a href="#" aria-label="YouTube"><i className="fab fa-youtube"></i></a>
            <a href="#" aria-label="TikTok"><i className="fab fa-tiktok"></i></a>
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
          <p><i className="fas fa-map-marker-alt"></i>Kathmandu, Nepal</p>
          <p><i className="fas fa-phone-alt"></i>+977 97XXXXXXXX</p>
          <a href="mailto:support@hastakrafts.com">
            <i className="fas fa-envelope"></i>support@hastakrafts.com
          </a>
        </div>
      </div>

      {/* Bottom */}
      <div className="footer-bottom">
        <p>© {new Date().getFullYear()} HastaKrafts Nepal. {t('footer.rights')}.</p>
        <div className="footer-payments">
          <div className="pay-badge"><img src="/khalti.png" alt="Khalti" /></div>
          <div className="pay-badge"><img src="/visa.png" alt="Visa" /></div>
          <div className="pay-badge"><img src="/cod.png" alt="Cash on Delivery" /></div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;