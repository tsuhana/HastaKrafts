import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authAPI } from '../api/axios';
import { useTranslation } from 'react-i18next';
import BrandLogo from '../components/BrandLogo';
import '../styles/Register.css';

const Register = () => {
  const navigate = useNavigate();
  const { t }    = useTranslation();
  const [formData, setFormData] = useState({
    full_name: '', email: '', password: '', confirmPassword: '', phone: '',
  });
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState('');
  const [loading, setLoading]   = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear field error on change
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
    if (apiError) setApiError('');
  };

  const validate = () => {
    const errs = {};
    const { full_name, email, password, confirmPassword, phone } = formData;

    // Full name — letters and spaces only, min 2 real characters
    if (!full_name.trim()) {
      errs.full_name = 'Full name is required';
    } else if (full_name.trim().replace(/\s+/g, '').length < 2) {
      errs.full_name = 'Please enter your full name';
    } else if (!/^[A-Za-z\s\u0900-\u097F'-]+$/.test(full_name.trim())) {
      errs.full_name = 'Full name must contain only letters and spaces';
    }

    // Email
    if (!email.trim()) {
      errs.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      errs.email = 'Please provide a valid email address';
    }

    // Phone — optional but must be valid if provided
    if (phone && !/^[0-9+\-\s]{7,15}$/.test(phone.trim())) {
      errs.phone = 'Please provide a valid phone number';
    }

    // Password
    if (!password) {
      errs.password = 'Password is required';
    } else if (password.length < 6) {
      errs.password = 'Password must be at least 6 characters';
    } else if (!/[A-Za-z]/.test(password)) {
      errs.password = 'Password must contain at least one letter';
    } else if (!/[0-9]/.test(password)) {
      errs.password = 'Password must contain at least one number';
    }

    // Confirm password
    if (!confirmPassword) {
      errs.confirmPassword = 'Please confirm your password';
    } else if (password !== confirmPassword) {
      errs.confirmPassword = 'Passwords do not match';
    }

    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }

    setLoading(true);
    setApiError('');
    try {
      const { confirmPassword, ...submitData } = formData;
      submitData.full_name = submitData.full_name.trim();
      submitData.email     = submitData.email.trim().toLowerCase();

      const response = await authAPI.registerBuyer(submitData);
      if (response.data.success) {
        localStorage.setItem('token', response.data.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.data.user));
        window.dispatchEvent(new Event('userLoggedIn'));
        navigate('/');
      }
    } catch (err) {
      setApiError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignup = () => {
    window.location.href = `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/auth/google`;
  };

  return (
    <div className="auth-page">
      <div className="auth-container register-container">

        {/* Left — Decorative */}
        <div className="auth-decoration">
          <div className="decoration-content">
            <h2>{t('auth.welcome_back')}</h2>
            <p>Enter your personal details to use all of site features</p>
            <Link to="/login" className="decoration-btn">{t('auth.sign_in').toUpperCase()}</Link>
          </div>
        </div>

        {/* Right — Form */}
        <div className="auth-form-section">
          <div className="auth-form-wrapper">
            <div className="auth-header">
              <BrandLogo variant="light" />
              <p className="auth-subtitle">{t('auth.join_today')}</p>
            </div>

            <h2 className="form-title">{t('auth.create_account')}</h2>

            <button onClick={handleGoogleSignup} type="button" className="google-btn">
              <svg className="google-icon" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              {t('auth.google_signup')}
            </button>

            <div className="divider"><span>{t('auth.or_email')}</span></div>

            {apiError && <div className="error-message">{apiError}</div>}

            <form onSubmit={handleSubmit} className="auth-form" noValidate>

              <div className="form-group">
                <label>{t('auth.full_name')}</label>
                <input
                  type="text"
                  name="full_name"
                  value={formData.full_name}
                  onChange={handleChange}
                  placeholder="Enter your full name"
                  autoComplete="name"
                  disabled={loading}
                  className={errors.full_name ? 'input-error' : ''}
                />
                {errors.full_name && <span className="field-error">{errors.full_name}</span>}
              </div>

              <div className="form-group">
                <label>{t('auth.email')}</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Enter your email"
                  autoComplete="email"
                  disabled={loading}
                  className={errors.email ? 'input-error' : ''}
                />
                {errors.email && <span className="field-error">{errors.email}</span>}
              </div>

              <div className="form-group">
                <label>{t('auth.phone')} <span className="optional"></span></label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="9800000000"
                  autoComplete="tel"
                  disabled={loading}
                  className={errors.phone ? 'input-error' : ''}
                />
                {errors.phone && <span className="field-error">{errors.phone}</span>}
              </div>

              <div className="form-group">
                <label>{t('auth.password')}</label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="At least 6 characters with a letter and number"
                  autoComplete="new-password"
                  disabled={loading}
                  className={errors.password ? 'input-error' : ''}
                />
                {errors.password && <span className="field-error">{errors.password}</span>}
              </div>

              <div className="form-group">
                <label>{t('auth.confirm_password')}</label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="Re-enter your password"
                  autoComplete="new-password"
                  disabled={loading}
                  className={errors.confirmPassword ? 'input-error' : ''}
                />
                {errors.confirmPassword && <span className="field-error">{errors.confirmPassword}</span>}
              </div>

              <button type="submit" disabled={loading} className="submit-btn">
                {loading ? t('auth.creating') : t('auth.sign_up').toUpperCase()}
              </button>
            </form>

            <p className="auth-footer">
              {t('auth.have_account')}{' '}
              <Link to="/login">{t('auth.sign_in')}</Link>
            </p>
            <p className="auth-footer">
              {t('auth.want_sell')}{' '}
              <Link to="/register-seller">{t('footer.become_seller')}</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;