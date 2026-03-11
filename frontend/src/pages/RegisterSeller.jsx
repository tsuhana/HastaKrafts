import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useToast } from '../context/ToastContext';
import '../styles/RegisterSeller.css';

const RegisterSeller = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const [formData, setFormData] = useState({
    full_name: '', email: '', password: '', confirmPassword: '', phone: '',
    shop_name: '', shop_description: '', address: '', city: '', citizenship_number: '',
    bank_name: '', bank_account_number: '', bank_account_name: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleNext = (e) => {
    e.preventDefault();

    if (step === 1) {
      if (!formData.full_name || !formData.email || !formData.password || !formData.phone) {
        setError('Please fill all required fields');
        return;
      }
      if (formData.password !== formData.confirmPassword) {
        setError('Passwords do not match');
        return;
      }
      if (formData.password.length < 6) {
        setError('Password must be at least 6 characters');
        return;
      }
    }

    if (step === 2) {
      if (!formData.shop_name || !formData.address || !formData.city || !formData.citizenship_number) {
        setError('Please fill all required fields');
        return;
      }
    }

    setError('');
    setStep(step + 1);
  };

  const handleBack = () => {
    setError('');
    setStep(step - 1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { confirmPassword, ...submitData } = formData;
      const response = await axios.post('http://localhost:5000/api/auth/register/seller', submitData);

      if (response.data.success) {
        toast.success('Seller registration successful! Your account is pending admin approval.');
        navigate('/login');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="seller-register-page">
      <div className="seller-register-container">

        <div className="seller-header">
          <h1 className="seller-logo">हस्त KRAFTS</h1>
          <h2 className="seller-title">Become a Seller</h2>
          <p className="seller-subtitle">Join our marketplace and showcase your handmade crafts</p>
        </div>

        {/* Progress Steps */}
        <div className="progress-steps">
          <div className="progress-bar" data-step={step}>
            <div className={`step ${step >= 1 ? 'active' : ''}`}>
              <div className="step-number">1</div>
              <span className="step-label">Personal Info</span>
            </div>
            <div className={`step-line ${step >= 2 ? 'active' : ''}`}></div>
            <div className={`step ${step >= 2 ? 'active' : ''}`}>
              <div className="step-number">2</div>
              <span className="step-label">Shop Details</span>
            </div>
            <div className={`step-line ${step >= 3 ? 'active' : ''}`}></div>
            <div className={`step ${step >= 3 ? 'active' : ''}`}>
              <div className="step-number">3</div>
              <span className="step-label">Bank Info</span>
            </div>
          </div>
        </div>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={step === 3 ? handleSubmit : handleNext} className="seller-form">

          {/* Step 1: Personal Information */}
          {step === 1 && (
            <div className="form-step">
              <h3 className="step-heading">Personal Information</h3>

              <div className="form-row">
                <div className="form-group">
                  <label>Full Name *</label>
                  <input type="text" name="full_name" value={formData.full_name} onChange={handleChange} placeholder="Enter your full name" required />
                </div>
                <div className="form-group">
                  <label>Email *</label>
                  <input type="email" name="email" value={formData.email} onChange={handleChange} placeholder="Enter your email" required />
                </div>
              </div>

              <div className="form-group">
                <label>Phone Number *</label>
                <input type="tel" name="phone" value={formData.phone} onChange={handleChange} placeholder="9800000000" required pattern="[0-9]{10}" />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Password *</label>
                  <input type="password" name="password" value={formData.password} onChange={handleChange} placeholder="At least 6 characters" required minLength="6" />
                </div>
                <div className="form-group">
                  <label>Confirm Password *</label>
                  <input type="password" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} placeholder="Re-enter password" required />
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Shop Details */}
          {step === 2 && (
            <div className="form-step">
              <h3 className="step-heading">Shop Details</h3>

              <div className="form-group">
                <label>Shop Name *</label>
                <input type="text" name="shop_name" value={formData.shop_name} onChange={handleChange} placeholder="Your shop name" required />
              </div>

              <div className="form-group">
                <label>Shop Description</label>
                <textarea name="shop_description" value={formData.shop_description} onChange={handleChange} placeholder="Tell us about your shop and products..." rows="3" />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>City *</label>
                  <input type="text" name="city" value={formData.city} onChange={handleChange} placeholder="Kathmandu" required />
                </div>
                <div className="form-group">
                  <label>Citizenship Number *</label>
                  <input type="text" name="citizenship_number" value={formData.citizenship_number} onChange={handleChange} placeholder="Enter citizenship number" required />
                </div>
              </div>

              <div className="form-group">
                <label>Full Address *</label>
                <textarea name="address" value={formData.address} onChange={handleChange} placeholder="Street, ward, district" required rows="2" />
              </div>
            </div>
          )}

          {/* Step 3: Bank Details */}
          {step === 3 && (
            <div className="form-step">
              <h3 className="step-heading">Bank Information (Optional)</h3>
              <p className="step-note">You can add bank details later from your dashboard</p>

              <div className="form-group">
                <label>Bank Name</label>
                <input type="text" name="bank_name" value={formData.bank_name} onChange={handleChange} placeholder="e.g., Nepal Bank, Nabil Bank" />
              </div>

              <div className="form-group">
                <label>Account Number</label>
                <input type="text" name="bank_account_number" value={formData.bank_account_number} onChange={handleChange} placeholder="Enter account number" />
              </div>

              <div className="form-group">
                <label>Account Holder Name</label>
                <input type="text" name="bank_account_name" value={formData.bank_account_name} onChange={handleChange} placeholder="Name as per bank account" />
              </div>

              <div className="info-box">
                <strong>Note:</strong> Your application will be reviewed by our admin team.
                You'll receive an email once your seller account is approved.
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="form-navigation">
            {step > 1 && (
              <button type="button" onClick={handleBack} className="back-btn">
                Back
              </button>
            )}
            <button type="submit" disabled={loading} className="next-btn">
              {loading ? 'Submitting...' : step === 3 ? 'Submit Application' : 'Next'}
            </button>
          </div>
        </form>

        <p className="seller-footer">
          Already have an account?{' '}
          <Link to="/login">Sign In</Link>
        </p>
      </div>
    </div>
  );
};

export default RegisterSeller;