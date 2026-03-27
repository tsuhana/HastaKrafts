import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authAPI } from '../api/axios';
import { useTranslation } from 'react-i18next';
import BrandLogo from '../components/BrandLogo';
import '../styles/Login.css';

const Login = () => {
  const navigate   = useNavigate();
  const { t }      = useTranslation();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (error) setError('');
  };

  // Basic client-side checks before hitting the server
  const validate = () => {
    const { email, password } = formData;
    if (!email.trim())    return 'Email is required';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return 'Please provide a valid email address';
    if (!password)        return 'Password is required';
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    e.stopPropagation(); // ✅ FIXED: prevent any parent handlers firing

    const validationError = validate();
    if (validationError) { setError(validationError); return; }

    setLoading(true);
    setError('');

    try {
      const response = await authAPI.login({
        email:    formData.email.trim().toLowerCase(),
        password: formData.password,
      });

      if (response.data.success) {
        const { token, user } = response.data.data;

        // ✅ FIXED: Set localStorage BEFORE calling navigate
        // so the 401 interceptor in axios.js doesn't fire on
        // the first dashboard API calls (token must exist first)
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
        window.dispatchEvent(new Event('userLoggedIn'));

        const role = user.role;
        // ✅ FIXED: replace:true prevents back-button returning to login
        if (role === 'admin')        navigate('/admin/dashboard', { replace: true });
        else if (role === 'seller')  navigate('/seller/dashboard', { replace: true });
        else                         navigate('/', { replace: true });
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    window.location.href = `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/auth/google`;
  };

  return (
    <div className="auth-page">
      <div className="auth-container">

        {/* Left — Form */}
        <div className="auth-form-section">
          <div className="auth-form-wrapper">
            <div className="auth-header">
              <BrandLogo variant="light" />
              <p className="auth-subtitle">{t('auth.welcome_back')}</p>
            </div>

            <h2 className="form-title">{t('auth.sign_in')}</h2>

            <button onClick={handleGoogleLogin} type="button" className="google-btn">
              <svg className="google-icon" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              {t('auth.google_signin')}
            </button>

            <div className="divider"><span>{t('auth.or_email')}</span></div>

            {error && <div className="error-message">{error}</div>}

            <form onSubmit={handleSubmit} className="auth-form" noValidate>
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
                />
              </div>
              <div className="form-group">
                <label>{t('auth.password')}</label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  disabled={loading}
                />
              </div>
              <div className="form-options">
                <label className="remember-me">
                  <input type="checkbox" />
                  <span>{t('auth.remember_me')}</span>
                </label>
                <Link to="/forgot-password" className="forgot-link">{t('auth.forgot_password')}</Link>
              </div>
              <button type="submit" disabled={loading} className="submit-btn">
                {loading ? t('auth.signing_in') : t('auth.sign_in').toUpperCase()}
              </button>
            </form>

            <p className="auth-footer">
              {t('auth.no_account')}{' '}
              <Link to="/register">{t('auth.sign_up')}</Link>
            </p>
          </div>
        </div>

        {/* Right — Decorative */}
        <div className="auth-decoration">
          <div className="decoration-content">
            <h2>Hello, User!</h2>
            <p>Register with your personal details to use all site features</p>
            <Link to="/register" className="decoration-btn">{t('auth.sign_up').toUpperCase()}</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;