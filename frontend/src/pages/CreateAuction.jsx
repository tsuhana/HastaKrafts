import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auctionAPI } from '../api/axios';
import '../styles/CreateAuction.css';

const CreateAuction = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    starting_bid: '',
    minimum_increment: '100',
    auction_start: '',
    auction_end: '',
  });
  const [images, setImages] = useState([]);
  const [previewUrls, setPreviewUrls] = useState([]);
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    if (errors[e.target.name]) {
      setErrors({ ...errors, [e.target.name]: '' });
    }
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    
    if (files.length > 5) {
      alert('Maximum 5 images allowed');
      return;
    }

    setImages(files);

    const urls = files.map(file => URL.createObjectURL(file));
    setPreviewUrls(urls);
  };

  const removeImage = (index) => {
    const newImages = images.filter((_, i) => i !== index);
    const newUrls = previewUrls.filter((_, i) => i !== index);
    setImages(newImages);
    setPreviewUrls(newUrls);
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }

    if (!formData.starting_bid || parseFloat(formData.starting_bid) <= 0) {
      newErrors.starting_bid = 'Starting bid must be greater than 0';
    }

    if (!formData.auction_start) {
      newErrors.auction_start = 'Start date is required';
    }

    if (!formData.auction_end) {
      newErrors.auction_end = 'End date is required';
    }

    if (formData.auction_start && formData.auction_end) {
      const start = new Date(formData.auction_start);
      const end = new Date(formData.auction_end);
      const now = new Date();

      if (end <= start) {
        newErrors.auction_end = 'End date must be after start date';
      }

      if (end <= now) {
        newErrors.auction_end = 'End date must be in the future';
      }
    }

    if (images.length === 0) {
      newErrors.images = 'At least one image is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const data = new FormData();
      data.append('title', formData.title);
      data.append('description', formData.description);
      data.append('starting_bid', formData.starting_bid);
      data.append('minimum_increment', formData.minimum_increment);
      data.append('auction_start', formData.auction_start);
      data.append('auction_end', formData.auction_end);

      images.forEach((image) => {
        data.append('images', image);
      });

      const res = await auctionAPI.createAuction(data);

      if (res.data.success) {
        alert('Auction created successfully!');
        navigate('/seller/dashboard');
      }
    } catch (err) {
      console.error('Create auction error:', err);
      alert(err.response?.data?.message || 'Failed to create auction');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="create-auction-page">
      <div className="create-auction-container">
        <div className="page-header">
          <h1>Create Auction</h1>
          <p>List your handcrafted item for auction</p>
        </div>

        <form onSubmit={handleSubmit} className="auction-form">
          <div className="form-section">
            <h2>Auction Details</h2>

            <div className="form-field">
              <label>Title *</label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="e.g., Hand-carved Wooden Sculpture"
                className={errors.title ? 'error' : ''}
              />
              {errors.title && <span className="error-msg">{errors.title}</span>}
            </div>

            <div className="form-field">
              <label>Description *</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Describe your item, its craftsmanship, materials, size, etc."
                rows="5"
                className={errors.description ? 'error' : ''}
              />
              {errors.description && <span className="error-msg">{errors.description}</span>}
            </div>

            <div className="form-row">
              <div className="form-field">
                <label>Starting Bid (Rs.) *</label>
                <input
                  type="number"
                  name="starting_bid"
                  value={formData.starting_bid}
                  onChange={handleChange}
                  placeholder="5000"
                  min="1"
                  className={errors.starting_bid ? 'error' : ''}
                />
                {errors.starting_bid && <span className="error-msg">{errors.starting_bid}</span>}
              </div>

              <div className="form-field">
                <label>Minimum Increment (Rs.)</label>
                <input
                  type="number"
                  name="minimum_increment"
                  value={formData.minimum_increment}
                  onChange={handleChange}
                  placeholder="100"
                  min="1"
                />
                <small>Minimum amount to raise the bid</small>
              </div>
            </div>

            <div className="form-row">
              <div className="form-field">
                <label>Auction Start Date & Time *</label>
                <input
                  type="datetime-local"
                  name="auction_start"
                  value={formData.auction_start}
                  onChange={handleChange}
                  className={errors.auction_start ? 'error' : ''}
                />
                {errors.auction_start && <span className="error-msg">{errors.auction_start}</span>}
              </div>

              <div className="form-field">
                <label>Auction End Date & Time *</label>
                <input
                  type="datetime-local"
                  name="auction_end"
                  value={formData.auction_end}
                  onChange={handleChange}
                  className={errors.auction_end ? 'error' : ''}
                />
                {errors.auction_end && <span className="error-msg">{errors.auction_end}</span>}
              </div>
            </div>
          </div>

          <div className="form-section">
            <h2>Auction Images *</h2>
            <p className="section-description">Upload up to 5 high-quality images of your item</p>

            <div className="image-upload-area">
              <input
                type="file"
                id="image-input"
                accept="image/*"
                multiple
                onChange={handleImageChange}
                style={{ display: 'none' }}
              />
              <label htmlFor="image-input" className="upload-label">
                <div className="upload-icon">📷</div>
                <p>Click to upload images</p>
                <small>Max 5 images, JPG/PNG/WEBP</small>
              </label>
            </div>

            {errors.images && <span className="error-msg">{errors.images}</span>}

            {previewUrls.length > 0 && (
              <div className="image-previews">
                {previewUrls.map((url, index) => (
                  <div key={index} className="preview-item">
                    <img src={url} alt={`Preview ${index + 1}`} />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="remove-image-btn"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="form-actions">
            <button
              type="button"
              onClick={() => navigate('/seller/dashboard')}
              className="btn-cancel"
            >
              Cancel
            </button>
            <button type="submit" disabled={loading} className="btn-submit">
              {loading ? 'Creating...' : 'Create Auction'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateAuction;