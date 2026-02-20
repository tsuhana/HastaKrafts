import React, { useState } from 'react';
import { contactAPI } from '../api/axios';
import Icons from '../utils/icons';
import '../styles/Contact.css';

const faqs = [
  {
    question: "How do I place an order?",
    answer: "Browse our products, click 'Add to Cart', then go to your cart and click 'Checkout'. Fill in your delivery details and choose your payment method. You'll receive an order confirmation via email."
  },
  {
    question: "What payment methods do you accept?",
    answer: "We accept Khalti, eSewa, and Cash on Delivery (COD) for orders within Nepal. Online payments are processed securely through our payment partners."
  },
  {
    question: "How long does delivery take?",
    answer: "Delivery typically takes 3–7 business days within Kathmandu Valley and 5–10 business days for other parts of Nepal. You'll receive tracking info once your order ships."
  },
  {
    question: "Can I return or exchange a product?",
    answer: "Yes! We offer a 7-day return/exchange policy for unused products in original packaging. Contact our support team within 7 days of receiving your order."
  },
  {
    question: "How do I become a seller?",
    answer: "Click 'Become a Seller' on our homepage, fill in your shop details, citizenship info, and bank account. Our admin team reviews applications within 2–3 business days."
  },
  {
    question: "Are the products authentic?",
    answer: "Yes! All products are 100% authentic, handmade by verified local artisans. Each seller goes through our verification process — we only approve genuine handicraft products."
  },
  {
    question: "How do I track my order?",
    answer: "Go to 'My Orders' in your account dashboard. You'll see real-time status: Pending → Processing → Shipped → Delivered, plus email notifications at each step."
  },
  {
    question: "What if I receive a damaged product?",
    answer: "Contact us immediately with photos of the damaged item. We'll arrange a replacement or full refund. For COD orders, please inspect the package before accepting delivery."
  }
];

const Contact = () => {
  const [formData, setFormData] = useState({
    name: '', email: '', phone: '', subject: '', message: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [openFaq, setOpenFaq]       = useState(null);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await contactAPI.submitMessage(formData);
      if (res.data.success) {
        alert(res.data.message);
        setFormData({ name: '', email: '', phone: '', subject: '', message: '' });
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to send message. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const toggleFaq = (i) => setOpenFaq(openFaq === i ? null : i);

  return (
    <div className="contact-page">

      <div className="container">
        <div className="contact-content">

          {/* SPLIT CARD */}
          <div className="contact-main">

            {/* LEFT: dark info panel */}
            <div className="form-section">
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

              <div className="ct-hours">
                Mon – Fri &nbsp;·&nbsp; 9 AM – 6 PM
              </div>
            </div>

            {/* RIGHT: form */}
            <div className="faq-section">
              <h2>Send a Message</h2>
              <p className="faq-subtitle">Fill in the form and we'll get back to you shortly.</p>

              <form onSubmit={handleSubmit} className="contact-form">
                <div className="form-row">
                  <div className="form-group">
                    <label>Full Name *</label>
                    <input type="text" name="name" value={formData.name} onChange={handleChange} required placeholder="Suhana Thapa" />
                  </div>
                  <div className="form-group">
                    <label>Email *</label>
                    <input type="email" name="email" value={formData.email} onChange={handleChange} required placeholder="you@example.com" />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Phone</label>
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
                    ? <><Icons.Loader size={17} className="spinner-icon" /><span>Sending…</span></>
                    : <><Icons.Send size={17} /><span>Send Message</span></>
                  }
                </button>
              </form>
            </div>

          </div>

          {/* FAQ BELOW */}
          <div className="faq-standalone">
            <div className="faq-standalone-header">
              <h2>Frequently Asked <span>Questions</span></h2>
              <p>Quick answers to common questions.</p>
            </div>

            <div className="faq-grid">
              {faqs.map((faq, i) => (
                <div key={i} className={`faq-accordion-item ${openFaq === i ? 'open' : ''}`}>
                  <button className="faq-accordion-btn" onClick={() => toggleFaq(i)}>
                    <span>{faq.question}</span>
                    <span className="faq-toggle-icon">+</span>
                  </button>
                  <div className="faq-accordion-body">
                    <p>{faq.answer}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Contact;