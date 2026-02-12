import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { productAPI } from '../api/axios';
import '../styles/AddProduct.css';

const AddProduct = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category_id: '',
    price: '',
    stock_quantity: '',
    sku: ''
  });
  const [images, setImages] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    fetchCategories();
  }, []);

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
    // Clear error for this field
    if (errors[e.target.name]) {
      setErrors({ ...errors, [e.target.name]: '' });
    }
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    
    // Validation
    if (files.length < 3) {
      setErrors({ ...errors, images: 'Please select at least 3 images' });
      return;
    }
    
    if (files.length > 8) {
      setErrors({ ...errors, images: 'Maximum 8 images allowed' });
      return;
    }

    // Check file sizes (max 5MB per image)
    const oversizedFiles = files.filter(file => file.size > 5 * 1024 * 1024);
    if (oversizedFiles.length > 0) {
      setErrors({ ...errors, images: 'Each image must be less than 5MB' });
      return;
    }

    // Check file types
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    const invalidFiles = files.filter(file => !validTypes.includes(file.type));
    if (invalidFiles.length > 0) {
      setErrors({ ...errors, images: 'Only JPG, PNG, and WEBP images allowed' });
      return;
    }

    setImages(files);
    setErrors({ ...errors, images: '' });

    // Create preview URLs
    const previews = files.map(file => URL.createObjectURL(file));
    setImagePreviews(previews);
  };

  const removeImage = (index) => {
    const newImages = images.filter((_, i) => i !== index);
    const newPreviews = imagePreviews.filter((_, i) => i !== index);
    setImages(newImages);
    setImagePreviews(newPreviews);
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Product name is required';
    } else if (formData.name.length < 3) {
      newErrors.name = 'Product name must be at least 3 characters';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    } else if (formData.description.length < 10) {
      newErrors.description = 'Description must be at least 10 characters';
    }

    if (!formData.category_id) {
      newErrors.category_id = 'Please select a category';
    }

    if (!formData.price) {
      newErrors.price = 'Price is required';
    } else if (parseFloat(formData.price) <= 0) {
      newErrors.price = 'Price must be greater than 0';
    }

    if (!formData.stock_quantity) {
      newErrors.stock_quantity = 'Stock quantity is required';
    } else if (parseInt(formData.stock_quantity) < 0) {
      newErrors.stock_quantity = 'Stock cannot be negative';
    }

    if (images.length < 3) {
      newErrors.images = 'Please upload at least 3 product images';
    } else if (images.length > 8) {
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

    setLoading(true);

    try {
      const formDataToSend = new FormData();
      
      // Append text fields
      Object.keys(formData).forEach(key => {
        formDataToSend.append(key, formData[key]);
      });

      // Append images
      images.forEach((image) => {
        formDataToSend.append('images', image);
      });

      const response = await productAPI.createProduct(formDataToSend);

      if (response.data.success) {
        alert('Product added successfully! It will be visible after admin approval.');
        navigate('/seller/dashboard');
      }
    } catch (err) {
      console.error('Error adding product:', err);
      if (err.response?.data?.message) {
        alert('Error: ' + err.response.data.message);
      } else {
        alert('Failed to add product. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="add-product-page">
      <div className="add-product-container">
        <div className="page-header">
          <h1>Add New Product</h1>
          <p>Add your handicraft to the marketplace</p>
        </div>

        <form onSubmit={handleSubmit} className="add-product-form">
          {/* Product Images */}
          <div className="form-section">
            <h3>Product Images *</h3>
            <p className="section-description">Upload 3-8 high-quality images of your product</p>
            
            <div className="image-upload-section">
              <label htmlFor="images" className="image-upload-label">
                <div className="upload-placeholder">
                  <span className="upload-icon">📸</span>
                  <p>Click to upload images</p>
                  <span className="upload-hint">JPG, PNG or WEBP (Max 5MB each)</span>
                </div>
                <input
                  type="file"
                  id="images"
                  accept="image/jpeg,image/jpg,image/png,image/webp"
                  multiple
                  onChange={handleImageChange}
                  className="file-input"
                />
              </label>

              {errors.images && <p className="error-text">{errors.images}</p>}

              {imagePreviews.length > 0 && (
                <div className="image-previews">
                  {imagePreviews.map((preview, index) => (
                    <div key={index} className="image-preview-item">
                      <img src={preview} alt={`Preview ${index + 1}`} />
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="remove-image-btn"
                      >
                        ✕
                      </button>
                      {index === 0 && <span className="primary-badge">Primary</span>}
                    </div>
                  ))}
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
                  placeholder="e.g., Handmade Clay Pot"
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
                placeholder="Describe your product, materials used, dimensions, etc."
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
                  placeholder="e.g., 1500"
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
                  placeholder="e.g., 10"
                  min="0"
                  className={errors.stock ? 'error' : ''}
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
                  placeholder="e.g., POT-001"
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
              disabled={loading}
              className="btn-submit"
            >
              {loading ? 'Adding Product...' : 'Add Product'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddProduct;