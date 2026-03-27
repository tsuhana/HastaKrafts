import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authAPI } from '../api/axios';
import { useToast } from '../context/ToastContext';
import { useTranslation } from 'react-i18next';
import BrandLogo from '../components/BrandLogo';
import '../styles/RegisterSeller.css';

const RegisterSeller = () => {
  const navigate = useNavigate();
  const toast    = useToast();
  const { t }    = useTranslation();

  const [formData, setFormData] = useState({
    full_name: '', email: '', password: '', confirmPassword: '', phone: '',
    shop_name: '', shop_description: '', address: '', city: '', citizenship_number: '',
    bank_name: '', bank_account_number: '', bank_account_name: '',
  });
  const [errors, setErrors]   = useState({});
  const [apiError, setApiError] = useState('');
  const [loading, setLoading] = useState(false);
  const [step, setStep]       = useState(1);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
    if (apiError) setApiError('');
  };

  // Step-specific validation
  const validateStep1 = () => {
    const errs = {};
    const { full_name, email, password, confirmPassword, phone } = formData;

    if (!full_name.trim()) {
      errs.full_name = 'Full name is required';
    } else if (full_name.trim().replace(/\s+/g, '').length < 2) {
      errs.full_name = 'Please enter your full name';
    } else if (!/^[A-Za-z\s\u0900-\u097F'-]+$/.test(full_name.trim())) {
      errs.full_name = 'Full name must contain only letters and spaces';
    }

    if (!email.trim()) {
      errs.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      errs.email = 'Please provide a valid email address';
    }

    if (!phone.trim()) {
      errs.phone = 'Phone number is required';
    } else if (!/^[0-9+\-\s]{7,15}$/.test(phone.trim())) {
      errs.phone = 'Please provide a valid phone number';
    }

    if (!password) {
      errs.password = 'Password is required';
    } else if (password.length < 6) {
      errs.password = 'Password must be at least 6 characters';
    } else if (!/[A-Za-z]/.test(password)) {
      errs.password = 'Password must contain at least one letter';
    } else if (!/[0-9]/.test(password)) {
      errs.password = 'Password must contain at least one number';
    }

    if (!confirmPassword) {
      errs.confirmPassword = 'Please confirm your password';
    } else if (password !== confirmPassword) {
      errs.confirmPassword = 'Passwords do not match';
    }

    return errs;
  };

  const validateStep2 = () => {
    const errs = {};
    const { shop_name, address, city, citizenship_number } = formData;

    if (!shop_name.trim()) {
      errs.shop_name = 'Shop name is required';
    } else if (shop_name.trim().length < 2) {
      errs.shop_name = 'Shop name must be at least 2 characters';
    }

    if (!address.trim()) {
      errs.address = 'Address is required';
    } else if (address.trim().length < 5) {
      errs.address = 'Please enter a complete address';
    }

    if (!city.trim()) {
      errs.city = 'City is required';
    } else if (!/^[A-Za-z\s\u0900-\u097F-]+$/.test(city.trim())) {
      errs.city = 'City name must contain only letters';
    }

    if (!citizenship_number.trim()) {
      errs.citizenship_number = 'Citizenship number is required';
    } else if (citizenship_number.trim().length < 5) {
      errs.citizenship_number = 'Please enter a valid citizenship number';
    }

    return errs;
  };

  const handleNext = (e) => {
    e.preventDefault();
    let errs = {};
    if (step === 1) errs = validateStep1();
    if (step === 2) errs = validateStep2();

    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    setErrors({});
    setApiError('');
    setStep(step + 1);
  };

  const handleBack = () => {
    setErrors({});
    setApiError('');
    setStep(step - 1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setApiError('');
    try {
      const { confirmPassword, ...submitData } = formData;
      submitData.full_name = submitData.full_name.trim();
      submitData.email     = submitData.email.trim().toLowerCase();
      submitData.shop_name = submitData.shop_name.trim();
      submitData.city      = submitData.city.trim();
      submitData.address   = submitData.address.trim();

      const response = await authAPI.registerSeller(submitData);
      if (response.data.success) {
        toast.success('Registration successful! Your account is pending admin approval.');
        navigate('/login');
      }
    } catch (err) {
      setApiError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Helper to show field error
  const FieldError = ({ name }) =>
    errors[name] ? <span className="field-error">{errors[name]}</span> : null;

  return (
    <div className="seller-register-page">
      <div className="seller-register-container">

        <div className="seller-header">
          <BrandLogo variant="light" />
          <h2 className="seller-title">{t('footer.become_seller')}</h2>
          <p className="seller-subtitle">Join our marketplace and showcase your handmade crafts</p>
        </div>

        {/* Progress Steps */}
        <div className="progress-steps">
          <div className="progress-bar" data-step={step}>
            {[1, 2, 3].map((s, i) => (
              <React.Fragment key={s}>
                <div className={`step ${step >= s ? 'active' : ''}`}>
                  <div className="step-number">{s}</div>
                  <span className="step-label">
                    {s === 1 ? t('profile.personal_info') : s === 2 ? 'Shop Details' : 'Bank Info'}
                  </span>
                </div>
                {i < 2 && <div className={`step-line ${step > s ? 'active' : ''}`} />}
              </React.Fragment>
            ))}
          </div>
        </div>

        {apiError && <div className="error-message">{apiError}</div>}

        <form onSubmit={step === 3 ? handleSubmit : handleNext} className="seller-form" noValidate>

          {/* ── STEP 1: Personal Info ── */}
          {step === 1 && (
            <div className="form-step">
              <h3 className="step-heading">{t('profile.personal_info')}</h3>

              <div className="form-row">
                <div className="form-group">
                  <label>{t('auth.full_name')} *</label>
                  <input
                    type="text" name="full_name" value={formData.full_name}
                    onChange={handleChange} placeholder="Enter your full name"
                    autoComplete="name" disabled={loading}
                    className={errors.full_name ? 'input-error' : ''}
                  />
                  <FieldError name="full_name" />
                </div>
                <div className="form-group">
                  <label>{t('auth.email')} *</label>
                  <input
                    type="email" name="email" value={formData.email}
                    onChange={handleChange} placeholder="Enter your email"
                    autoComplete="email" disabled={loading}
                    className={errors.email ? 'input-error' : ''}
                  />
                  <FieldError name="email" />
                </div>
              </div>

              <div className="form-group">
                <label>{t('checkout.phone')} *</label>
                <input
                  type="tel" name="phone" value={formData.phone}
                  onChange={handleChange} placeholder="9800000000"
                  autoComplete="tel" disabled={loading}
                  className={errors.phone ? 'input-error' : ''}
                />
                <FieldError name="phone" />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>{t('auth.password')} *</label>
                  <input
                    type="password" name="password" value={formData.password}
                    onChange={handleChange} placeholder="At least 6 characters with a letter and number"
                    autoComplete="new-password" disabled={loading}
                    className={errors.password ? 'input-error' : ''}
                  />
                  <FieldError name="password" />
                </div>
                <div className="form-group">
                  <label>{t('auth.confirm_password')} *</label>
                  <input
                    type="password" name="confirmPassword" value={formData.confirmPassword}
                    onChange={handleChange} placeholder="Re-enter your password"
                    autoComplete="new-password" disabled={loading}
                    className={errors.confirmPassword ? 'input-error' : ''}
                  />
                  <FieldError name="confirmPassword" />
                </div>
              </div>
            </div>
          )}

          {/* ── STEP 2: Shop Details ── */}
          {step === 2 && (
            <div className="form-step">
              <h3 className="step-heading">Shop Details</h3>

              <div className="form-group">
                <label>Shop Name *</label>
                <input
                  type="text" name="shop_name" value={formData.shop_name}
                  onChange={handleChange} placeholder="Your shop name"
                  disabled={loading} className={errors.shop_name ? 'input-error' : ''}
                />
                <FieldError name="shop_name" />
              </div>

              <div className="form-group">
                <label>Shop Description <span className="optional">(optional)</span></label>
                <textarea
                  name="shop_description" value={formData.shop_description}
                  onChange={handleChange} placeholder="Tell us about your shop and products..."
                  rows="3" disabled={loading}
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>{t('checkout.city')} *</label>
                  <input
                    type="text" name="city" value={formData.city}
                    onChange={handleChange} placeholder="Kathmandu"
                    disabled={loading} className={errors.city ? 'input-error' : ''}
                  />
                  <FieldError name="city" />
                </div>
                <div className="form-group">
                  <label>Citizenship Number *</label>
                  <input
                    type="text" name="citizenship_number" value={formData.citizenship_number}
                    onChange={handleChange} placeholder="Enter citizenship number"
                    disabled={loading} className={errors.citizenship_number ? 'input-error' : ''}
                  />
                  <FieldError name="citizenship_number" />
                </div>
              </div>

              <div className="form-group">
                <label>{t('checkout.address')} *</label>
                <textarea
                  name="address" value={formData.address}
                  onChange={handleChange} placeholder="Street, ward, district"
                  rows="2" disabled={loading}
                  className={errors.address ? 'input-error' : ''}
                />
                <FieldError name="address" />
              </div>
            </div>
          )}

          {/* ── STEP 3: Bank Info ── */}
          {step === 3 && (
            <div className="form-step">
              <h3 className="step-heading">Bank Information <span className="optional">(Optional)</span></h3>
              <p className="step-note">You can add bank details later from your dashboard</p>

              <div className="form-group">
                <label>Bank Name</label>
                <input
                  type="text" name="bank_name" value={formData.bank_name}
                  onChange={handleChange} placeholder="e.g., Nepal Bank, Nabil Bank"
                  disabled={loading}
                />
              </div>
              <div className="form-group">
                <label>Account Number</label>
                <input
                  type="text" name="bank_account_number" value={formData.bank_account_number}
                  onChange={handleChange} placeholder="Enter account number"
                  disabled={loading}
                />
              </div>
              <div className="form-group">
                <label>Account Holder Name</label>
                <input
                  type="text" name="bank_account_name" value={formData.bank_account_name}
                  onChange={handleChange} placeholder="Name as per bank account"
                  disabled={loading}
                />
              </div>

              <div className="info-box">
                <strong>Note:</strong> Your application will be reviewed by our admin team.
                You will receive an email once your seller account is approved.
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="form-navigation">
            {step > 1 && (
              <button type="button" onClick={handleBack} className="back-btn" disabled={loading}>
                {t('common.back')}
              </button>
            )}
            <button type="submit" disabled={loading} className="next-btn">
              {loading
                ? t('common.loading')
                : step === 3
                  ? t('common.submit')
                  : t('common.next')}
            </button>
          </div>
        </form>

        <p className="seller-footer">
          {t('auth.have_account')}{' '}
          <Link to="/login">{t('auth.sign_in')}</Link>
        </p>
      </div>
    </div>
  );
};

export default RegisterSeller;