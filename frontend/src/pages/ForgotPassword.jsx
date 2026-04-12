import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../api/axios';
import '../styles/ForgotPassword.css';

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState(''); // ← ADD
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    try {
      const response = await API.post('/auth/forgot-password', { email });

      if (response.data.success) {
        if (response.data.emailExists) {
          // Registered email → OTP page ma navigate gar
          navigate('/verify-otp', { state: { email } });
        } else {
          // Unregistered email → generic message dekhau, navigate nagara
          setMessage("If that email exists, an OTP has been sent. Please check your inbox.");
        }
      }
    } catch (err) {
      console.error('Forgot password error:', err);
      setError(err.response?.data?.message || 'Failed to send OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="forgot-password-page">
      <div className="forgot-password-container">

        <div className="forgot-password-header">
          <h1 className="forgot-logo">हस्त KRAFTS</h1>
          <p className="forgot-subtitle">Reset Your Password</p>
        </div>

        <div className="forgot-content">
          <h2>Forgot Password?</h2>
          <p>Enter your email address and we will send you an OTP to reset your password.</p>

          {/* Generic info message — unregistered email case */}
          {message && <div className="success-message">{message}</div>}

          {/* Error message */}
          {error && <div className="error-message">{error}</div>}

          <form onSubmit={handleSubmit} className="forgot-form">
            <div className="form-group">
              <label>Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your registered email"
                required
                disabled={loading}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="submit-btn">
              {loading ? 'Sending OTP...' : 'Send OTP'}
            </button>
          </form>

          <div className="back-to-login">
            <a href="/login">← Back to Login</a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;