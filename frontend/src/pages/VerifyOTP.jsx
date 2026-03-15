import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import API from '../api/axios';
import { useToast } from '../context/ToastContext';
import { useTranslation } from 'react-i18next';
import '../styles/VerifyOTP.css';

const VerifyOTP = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();
  const { t } = useTranslation();
  const email = location.state?.email || '';

  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  useEffect(() => {
    if (!email) navigate('/forgot-password');
  }, [email, navigate]);

  const handleChange = (index, value) => {
    if (value.length > 1) return;
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    setError('');
    if (value && index < 5) document.getElementById(`otp-${index + 1}`)?.focus();
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      document.getElementById(`otp-${index - 1}`)?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').slice(0, 6);
    const newOtp = pastedData.split('').slice(0, 6);
    while (newOtp.length < 6) newOtp.push('');
    setOtp(newOtp);
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const otpString = otp.join('');
    if (otpString.length !== 6) {
      setError('Please enter all 6 digits');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const response = await API.post('/auth/verify-otp', { email, otp: otpString });
      if (response.data.success) {
        navigate('/reset-password', { state: { resetToken: response.data.data.resetToken, email } });
      }
    } catch (err) {
      console.error('Verify OTP error:', err);
      setError(err.response?.data?.message || 'Invalid or expired OTP');
      setOtp(['', '', '', '', '', '']);
      document.getElementById('otp-0')?.focus();
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    setError('');
    try {
      await API.post('/auth/forgot-password', { email });
      toast.success('New OTP sent to your email!');
      setOtp(['', '', '', '', '', '']);
      document.getElementById('otp-0')?.focus();
    } catch (err) {
      console.error('Resend OTP error:', err);
      setError('Failed to resend OTP. Please try again.');
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="verify-otp-page">
      <div className="verify-otp-container">
        <div className="verify-otp-header">
          <h1 className="verify-logo">हस्त KRAFTS</h1>
          <p className="verify-subtitle">Verify OTP</p>
        </div>

        <div className="verify-content">
          <h2>Enter OTP</h2>
          <p>We have sent a 6-digit code to <strong>{email}</strong></p>

          {error && <div className="error-message">{error}</div>}

          <form onSubmit={handleSubmit} className="otp-form">
            <div className="otp-inputs" onPaste={handlePaste}>
              {otp.map((digit, index) => (
                <input
                  key={index}
                  id={`otp-${index}`}
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]"
                  maxLength="1"
                  value={digit}
                  onChange={(e) => handleChange(index, e.target.value.replace(/[^0-9]/g, ''))}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  className="otp-input"
                  autoFocus={index === 0}
                  disabled={loading}
                />
              ))}
            </div>
            <button type="submit" disabled={loading || otp.join('').length !== 6} className="submit-btn">
              {loading ? t('common.loading') : 'Verify OTP'}
            </button>
          </form>

          <div className="resend-section">
            <p>Did not receive the code?</p>
            <button onClick={handleResend} disabled={resending || loading} className="resend-btn">
              {resending ? t('common.loading') : 'Resend OTP'}
            </button>
          </div>

          <div className="back-to-login">
            <a href="/forgot-password">← {t('common.back')}</a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VerifyOTP;