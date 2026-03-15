import React, { useState } from 'react';
import { contactAPI } from '../api/axios';
import Icons from '../utils/icons';
import { useToast } from '../context/ToastContext';
import { useTranslation } from 'react-i18next';
import '../styles/Contact.css';

const Contact = () => {
  const toast = useToast();
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    name: '', email: '', phone: '', subject: '', message: ''
  });
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await contactAPI.submitMessage(formData);
      if (res.data.success) {
        toast.success(res.data.message);
        setFormData({ name: '', email: '', phone: '', subject: '', message: '' });
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send message. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="contact-page">
      <div className="container">
        <div className="contact-content">
          <div className="contact-main">

            {/* LEFT: info panel */}
            <div className="ct-info-panel">
              <div>
                <h2>We'd love to hear from you.</h2>
                <p>Reach out and we'll get back to you as soon as possible.</p>
                <div className="ct-divider" />
                <div className="ct-info-rows">
                  <div className="ct-info-row">
                    <div className="ct-info-icon"><Icons.Mail size={15} /></div>
                    <span className="ct-info-text">admin.hastakrafts@gmail.com</span>
                  </div>
                  <div className="ct-info-row">
                    <div className="ct-info-icon"><Icons.Phone size={15} /></div>
                    <span className="ct-info-text">+977 9745619477</span>
                  </div>
                  <div className="ct-info-row">
                    <div className="ct-info-icon"><Icons.MapPin size={15} /></div>
                    <span className="ct-info-text">Kathmandu, Nepal</span>
                  </div>
                </div>
              </div>
              <div className="ct-hours">Mon – Fri &nbsp;·&nbsp; 9 AM – 6 PM</div>
            </div>

            {/* RIGHT: form panel */}
            <div className="ct-form-panel">
              <h2>Send a Message</h2>
              <p className="ct-form-subtitle">Fill in the form and we'll get back to you shortly.</p>

              <form onSubmit={handleSubmit} className="contact-form">
                <div className="form-row">
                  <div className="form-group">
                    <label>{t('auth.full_name')} *</label>
                    <input type="text" name="name" value={formData.name} onChange={handleChange} required placeholder="Your Name" />
                  </div>
                  <div className="form-group">
                    <label>{t('auth.email')} *</label>
                    <input type="email" name="email" value={formData.email} onChange={handleChange} required placeholder="you@example.com" />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>{t('auth.phone')}</label>
                    <input type="tel" name="phone" value={formData.phone} onChange={handleChange} placeholder="+977 98XXXXXXXX" />
                  </div>
                  <div className="form-group">
                    <label>Subject *</label>
                    <input type="text" name="subject" value={formData.subject} onChange={handleChange} required placeholder="What's this about?" />
                  </div>
                </div>

                <div className="form-group">
                  <label>Message *</label>
                  <textarea name="message" value={formData.message} onChange={handleChange} required rows={4} placeholder="Tell us more..." />
                </div>

                <button type="submit" className="btn-submit" disabled={submitting}>
                  {submitting
                    ? <><Icons.Loader size={17} className="spinner-icon" /><span>{t('common.loading')}</span></>
                    : <><Icons.Send size={17} /><span>{t('common.submit')}</span></>
                  }
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Contact;