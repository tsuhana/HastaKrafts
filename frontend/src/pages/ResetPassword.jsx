import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import API from '../api/axios';
import { useTranslation } from 'react-i18next';
import '../styles/ResetPassword.css';

const ResetPassword = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();
  const resetToken = location.state?.resetToken || '';
  const email = location.state?.email || '';

  const [formData, setFormData] = useState({ newPassword: '', confirmPassword: '' });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (!resetToken) {
      setError('Invalid reset session. Please request a new OTP.');
      setTimeout(() => navigate('/forgot-password'), 3000);
    }
  }, [resetToken, navigate]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.newPassword !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (formData.newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    setLoading(true);
    setError('');
    setMessage('');
    try {
      const response = await API.post('/auth/reset-password', { resetToken, newPassword: formData.newPassword });
      if (response.data.success) {
        setMessage('Password reset successful! Redirecting to login...');
        setTimeout(() => {
          navigate('/login', { state: { message: 'Password reset successful. Please login with your new password.' } });
        }, 2000);
      }
    } catch (err) {
      console.error('Reset password error:', err);
      setError(err.response?.data?.message || 'Failed to reset password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="reset-password-page">
      <div className="reset-password-container">
        <div className="reset-password-header">
          <h1 className="reset-logo">हस्त KRAFTS</h1>
          <p className="reset-subtitle">Create New Password</p>
        </div>

        <div className="reset-content">
          <h2>Reset Password</h2>
          {email && <p>Enter your new password for <strong>{email}</strong></p>}

          {message && <div className="success-message">{message}</div>}
          {error && <div className="error-message">{error}</div>}

          {resetToken && !message && (
            <form onSubmit={handleSubmit} className="reset-form">
              <div className="form-group">
                <label>{t('profile.new_password')}</label>
                <div className="password-input-wrapper">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="newPassword"
                    value={formData.newPassword}
                    onChange={handleChange}
                    placeholder="Enter new password (min 6 characters)"
                    required
                    minLength="6"
                    disabled={loading}
                  />
                  <button type="button" className="toggle-password" onClick={() => setShowPassword(!showPassword)} tabIndex="-1">
                    {showPassword ? '👁️' : '👁️‍🗨️'}
                  </button>
                </div>
              </div>
              <div className="form-group">
                <label>{t('profile.confirm_password')}</label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="Re-enter new password"
                  required
                  disabled={loading}
                />
              </div>
              <button type="submit" disabled={loading} className="submit-btn">
                {loading ? t('common.loading') : 'Reset Password'}
              </button>
            </form>
          )}

          <div className="back-to-login">
            <a href="/login">← {t('common.back')} to Login</a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;