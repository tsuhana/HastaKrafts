import React from 'react';
import { Link } from 'react-router-dom';
import '../styles/BrandLogo.css';

/**
 * BrandLogo component
 * variant="light"  → dark brown text (for white/light backgrounds: Login, Register, etc.)
 * variant="dark"   → white text (for dark/brown backgrounds: NavBar) — default NavBar already handles this
 */
const BrandLogo = ({ variant = 'light', className = '' }) => {
  return (
    <Link to="/" className={`brand-logo brand-logo--${variant} ${className}`}>
      हस्तKrafts
    </Link>
  );
};

export default BrandLogo;