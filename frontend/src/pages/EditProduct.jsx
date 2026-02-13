import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { productAPI } from '../api/axios';
import '../styles/EditProduct.css';

const EditProduct = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [categories, setCategories] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category_id: '',
    price: '',
    stock_quantity: '',
    sku: ''
  });
  const [existingImages, setExistingImages] = useState([]);
  const [newImages, setNewImages] = useState([]);
  const [newImagePreviews, setNewImagePreviews] = useState([]);
  const [imagesToDelete, setImagesToDelete] = useState([]);
  const [errors, setErrors] = useState({});

  const API_URL = 'http://localhost:5000';

  useEffect(() => {
    fetchProductData();
    fetchCategories();
  }, [id]);

  const fetchProductData = async () => {
    try {
      setLoading(true);
      const res = await productAPI.getProductById(id);
      if (res.data.success) {
        const product = res.data.data;
        setFormData({
          name: product.name,
          description: product.description,
          category_id: product.category_id,
          price: product.price,
          stock_quantity: product.stock_quantity,
          sku: product.sku || ''
        });
        setExistingImages(product.images || []);
      }
    } catch (err) {
      console.error('Error fetching product:', err);
      alert('Failed to load product data');
      navigate('/seller/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await productAPI.getCategories();
      if (res.data.success) {
        setCategories(res.data.data);
      }
    } catch (err) {
      console.error('Error fetching categories:', err);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    if (errors[e.target.name]) {
      setErrors({ ...errors, [e.target.name]: '' });
    }
  };

  const handleNewImageChange = (e) => {
    const files = Array.from(e.target.files);
    
    // Calculate total images after adding new ones
    const totalImages = existingImages.length - imagesToDelete.length + newImages.length + files.length;
    
    if (totalImages > 8) {
      setErrors({ ...errors, images: 'Maximum 8 images allowed in total' });
      return;
    }

    if (totalImages < 3) {
      setErrors({ ...errors, images: 'Minimum 3 images required' });
      return;
    }

    // Validate file sizes
    const oversizedFiles = files.filter(file => file.size > 5 * 1024 * 1024);
    if (oversizedFiles.length > 0) {
      setErrors({ ...errors, images: 'Each image must be less than 5MB' });
      return;
    }

    // Validate file types
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    const invalidFiles = files.filter(file => !validTypes.includes(file.type));
    if (invalidFiles.length > 0) {
      setErrors({ ...errors, images: 'Only JPG, PNG, and WEBP images allowed' });
      return;
    }

    setNewImages([...newImages, ...files]);
    setErrors({ ...errors, images: '' });

    // Create preview URLs
    const previews = files.map(file => URL.createObjectURL(file));
    setNewImagePreviews([...newImagePreviews, ...previews]);
  };

  const removeExistingImage = (imageUrl) => {
    setImagesToDelete([...imagesToDelete, imageUrl]);
    setExistingImages(existingImages.filter(img => img !== imageUrl));
  };

  const removeNewImage = (index) => {
    const newImagesArray = newImages.filter((_, i) => i !== index);
    const newPreviewsArray = newImagePreviews.filter((_, i) => i !== index);
    setNewImages(newImagesArray);
    setNewImagePreviews(newPreviewsArray);
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Product name is required';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }

    if (!formData.category_id) {
      newErrors.category_id = 'Please select a category';
    }

    if (!formData.price || parseFloat(formData.price) <= 0) {
      newErrors.price = 'Valid price is required';
    }

    if (!formData.stock_quantity || parseInt(formData.stock_quantity) < 0) {
      newErrors.stock_quantity = 'Valid stock quantity is required';
    }

    // Validate total images
    const totalImages = existingImages.length + newImages.length;
    if (totalImages < 3) {
      newErrors.images = 'Minimum 3 images required';
    } else if (totalImages > 8) {
      newErrors.images = 'Maximum 8 images allowed';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setSubmitting(true);

    try {
      const formDataToSend = new FormData();
      
      // Append text fields
      Object.keys(formData).forEach(key => {
        formDataToSend.append(key, formData[key]);
      });

      // Append new images
      newImages.forEach((image) => {
        formDataToSend.append('images', image);
      });

      // Append images to delete
      if (imagesToDelete.length > 0) {
        formDataToSend.append('imagesToDelete', JSON.stringify(imagesToDelete));
      }

      // Append existing images to keep
      if (existingImages.length > 0) {
        formDataToSend.append('existingImages', JSON.stringify(existingImages));
      }

      const response = await productAPI.updateProduct(id, formDataToSend);

      if (response.data.success) {
        alert('Product updated successfully! It will be reviewed by admin.');
        navigate('/seller/dashboard');
      }
    } catch (err) {
      console.error('Error updating product:', err);
      if (err.response?.data?.message) {
        alert('Error: ' + err.response.data.message);
      } else {
        alert('Failed to update product. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="edit-product-loading">
        <div className="spinner"></div>
        <p>Loading product data...</p>
      </div>
    );
  }

  return (
    <div className="edit-product-page">
      <div className="edit-product-container">
        <div className="page-header">
          <h1>Edit Product</h1>
          <p>Update your product details</p>
        </div>

        <form onSubmit={handleSubmit} className="edit-product-form">
          {/* Existing Images */}
          {existingImages.length > 0 && (
            <div className="form-section">
              <h3>Current Images</h3>
              <div className="existing-images-grid">
                {existingImages.map((imageUrl, index) => (
                  <div key={index} className="image-preview-item">
                    <img src={`${API_URL}${imageUrl}`} alt={`Product ${index + 1}`} />
                    <button
                      type="button"
                      onClick={() => removeExistingImage(imageUrl)}
                      className="remove-image-btn"
                      title="Remove this image"
                    >
                      ✕
                    </button>
                    {index === 0 && <span className="primary-badge">Primary</span>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Add New Images */}
          <div className="form-section">
            <h3>Add More Images (Optional)</h3>
            <p className="section-description">
              Current: {existingImages.length + newImages.length} images 
              (Min: 3, Max: 8)
            </p>
            
            <div className="image-upload-section">
              <label htmlFor="new-images" className="image-upload-label">
                <div className="upload-placeholder">
                  <span className="upload-icon">📸</span>
                  <p>Click to add more images</p>
                  <span className="upload-hint">JPG, PNG or WEBP (Max 5MB each)</span>
                </div>
                <input
                  type="file"
                  id="new-images"
                  accept="image/jpeg,image/jpg,image/png,image/webp"
                  multiple
                  onChange={handleNewImageChange}
                  className="file-input"
                />
              </label>

              {errors.images && <p className="error-text">{errors.images}</p>}

              {newImagePreviews.length > 0 && (
                <div className="new-images-grid">
                  <h4>New Images to Add:</h4>
                  <div className="existing-images-grid">
                    {newImagePreviews.map((preview, index) => (
                      <div key={index} className="image-preview-item">
                        <img src={preview} alt={`New ${index + 1}`} />
                        <button
                          type="button"
                          onClick={() => removeNewImage(index)}
                          className="remove-image-btn"
                        >
                          ✕
                        </button>
                        <span className="new-badge">New</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Product Details */}
          <div className="form-section">
            <h3>Product Details</h3>

            <div className="form-row">
              <div className="form-group">
                <label>Product Name *</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className={errors.name ? 'error' : ''}
                />
                {errors.name && <p className="error-text">{errors.name}</p>}
              </div>

              <div className="form-group">
                <label>Category *</label>
                <select
                  name="category_id"
                  value={formData.category_id}
                  onChange={handleChange}
                  className={errors.category_id ? 'error' : ''}
                >
                  <option value="">Select Category</option>
                  {categories.map((cat) => (
                    <option key={cat.category_id} value={cat.category_id}>
                      {cat.icon} {cat.name}
                    </option>
                  ))}
                </select>
                {errors.category_id && <p className="error-text">{errors.category_id}</p>}
              </div>
            </div>

            <div className="form-group">
              <label>Description *</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows="5"
                className={errors.description ? 'error' : ''}
              />
              {errors.description && <p className="error-text">{errors.description}</p>}
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Price (Rs.) *</label>
                <input
                  type="number"
                  name="price"
                  value={formData.price}
                  onChange={handleChange}
                  min="0"
                  step="0.01"
                  className={errors.price ? 'error' : ''}
                />
                {errors.price && <p className="error-text">{errors.price}</p>}
              </div>

              <div className="form-group">
                <label>Stock Quantity *</label>
                <input
                  type="number"
                  name="stock_quantity"
                  value={formData.stock_quantity}
                  onChange={handleChange}
                  min="0"
                  className={errors.stock_quantity ? 'error' : ''}
                />
                {errors.stock_quantity && <p className="error-text">{errors.stock_quantity}</p>}
              </div>

              <div className="form-group">
                <label>SKU (Optional)</label>
                <input
                  type="text"
                  name="sku"
                  value={formData.sku}
                  onChange={handleChange}
                />
              </div>
            </div>
          </div>

          {/* Submit Buttons */}
          <div className="form-actions">
            <button
              type="button"
              onClick={() => navigate('/seller/dashboard')}
              className="btn-cancel"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="btn-submit"
            >
              {submitting ? 'Updating Product...' : 'Update Product'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditProduct;