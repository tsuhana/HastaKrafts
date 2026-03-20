import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useTranslation } from 'react-i18next';
import BrandLogo from '../components/BrandLogo';
import '../styles/Register.css';

const Register = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    full_name: '', email: '', password: '', confirmPassword: '', phone: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const { confirmPassword, ...submitData } = formData;
      const response = await axios.post('http://localhost:5000/api/auth/register/buyer', submitData);
      if (response.data.success) {
        localStorage.setItem('token', response.data.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.data.user));
        // ✅ Fire event so NavBar updates immediately
        window.dispatchEvent(new Event('userLoggedIn'));
        navigate('/');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignup = () => {
    window.location.href = 'http://localhost:5000/api/auth/google';
  };

  return (
    <div className="auth-page">
      <div className="auth-container register-container">

        {/* Left Side - Decorative */}
        <div className="auth-decoration">
          <div className="decoration-content">
            <h2>{t('auth.welcome_back')}</h2>
            <p>Enter your personal details to use all of site features</p>
            <Link to="/login" className="decoration-btn">{t('auth.sign_in').toUpperCase()}</Link>
          </div>
        </div>

        {/* Right Side - Form */}
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

            {error && <div className="error-message">{error}</div>}

            <form onSubmit={handleSubmit} className="auth-form">
              <div className="form-group">
                <label>{t('auth.full_name')}</label>
                <input type="text" name="full_name" value={formData.full_name} onChange={handleChange} placeholder="Enter your full name" required />
              </div>
              <div className="form-group">
                <label>{t('auth.email')}</label>
                <input type="email" name="email" value={formData.email} onChange={handleChange} placeholder="Enter your email" required />
              </div>
              <div className="form-group">
                <label>{t('auth.phone')}</label>
                <input type="tel" name="phone" value={formData.phone} onChange={handleChange} placeholder="9800000000" pattern="[0-9]{10}" />
              </div>
              <div className="form-group">
                <label>{t('auth.password')}</label>
                <input type="password" name="password" value={formData.password} onChange={handleChange} placeholder="At least 6 characters" required minLength="6" />
              </div>
              <div className="form-group">
                <label>{t('auth.confirm_password')}</label>
                <input type="password" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} placeholder="Re-enter password" required />
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