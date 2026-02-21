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
    sku: '',
    has_discount: false,       
    discount_percentage: '',  
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
          sku: product.sku || '',
          has_discount: product.has_discount || false,                          // ✅ NEW
          discount_percentage: product.discount_percentage > 0 ? product.discount_percentage : '', // ✅ NEW
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
      if (res.data.success) setCategories(res.data.data);
    } catch (err) {
      console.error('Error fetching categories:', err);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
      // reset discount_percentage if toggling off
      ...(name === 'has_discount' && !checked ? { discount_percentage: '' } : {}),
    }));
    if (errors[name]) setErrors({ ...errors, [name]: '' });
  };

  const handleNewImageChange = (e) => {
    const files = Array.from(e.target.files);
    const totalImages = existingImages.length - imagesToDelete.length + newImages.length + files.length;
    if (totalImages > 8) { setErrors({ ...errors, images: 'Maximum 8 images allowed in total' }); return; }
    const oversizedFiles = files.filter(file => file.size > 5 * 1024 * 1024);
    if (oversizedFiles.length > 0) { setErrors({ ...errors, images: 'Each image must be less than 5MB' }); return; }
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    const invalidFiles = files.filter(file => !validTypes.includes(file.type));
    if (invalidFiles.length > 0) { setErrors({ ...errors, images: 'Only JPG, PNG, and WEBP images allowed' }); return; }
    setNewImages([...newImages, ...files]);
    setErrors({ ...errors, images: '' });
    setNewImagePreviews([...newImagePreviews, ...files.map(file => URL.createObjectURL(file))]);
  };

  const removeExistingImage = (imageUrl) => {
    setImagesToDelete([...imagesToDelete, imageUrl]);
    setExistingImages(existingImages.filter(img => img !== imageUrl));
  };

  const removeNewImage = (index) => {
    setNewImages(newImages.filter((_, i) => i !== index));
    setNewImagePreviews(newImagePreviews.filter((_, i) => i !== index));
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'Product name is required';
    if (!formData.description.trim()) newErrors.description = 'Description is required';
    if (!formData.category_id) newErrors.category_id = 'Please select a category';
    if (!formData.price || parseFloat(formData.price) <= 0) newErrors.price = 'Valid price is required';
    if (!formData.stock_quantity || parseInt(formData.stock_quantity) < 0) newErrors.stock_quantity = 'Valid stock quantity is required';

    //  Validate discount
    if (formData.has_discount) {
      const pct = parseInt(formData.discount_percentage);
      if (!pct || pct < 1 || pct > 99) newErrors.discount_percentage = 'Discount must be between 1% and 99%';
    }

    const totalImages = existingImages.length + newImages.length;
    if (totalImages < 3) newErrors.images = 'Minimum 3 images required';
    else if (totalImages > 8) newErrors.images = 'Maximum 8 images allowed';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Live preview calculation
  const discountedPreviewPrice = formData.has_discount && formData.discount_percentage && formData.price
    ? Math.round(parseFloat(formData.price) * (1 - parseInt(formData.discount_percentage) / 100))
    : null;
  const savings = discountedPreviewPrice ? Math.round(parseFloat(formData.price) - discountedPreviewPrice) : null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    setSubmitting(true);
    try {
      const formDataToSend = new FormData();

      // Append all text fields except has_discount (handle separately)
      Object.keys(formData).forEach(key => {
        if (key !== 'has_discount' && key !== 'discount_percentage') {
          formDataToSend.append(key, formData[key]);
        }
      });

      //  Append discount fields
      formDataToSend.append('has_discount', formData.has_discount);
      formDataToSend.append('discount_percentage', formData.has_discount ? (parseInt(formData.discount_percentage) || 0) : 0);

      newImages.forEach((image) => formDataToSend.append('images', image));
      if (imagesToDelete.length > 0) formDataToSend.append('imagesToDelete', JSON.stringify(imagesToDelete));
      if (existingImages.length > 0) formDataToSend.append('existingImages', JSON.stringify(existingImages));

      const response = await productAPI.updateProduct(id, formDataToSend);
      if (response.data.success) {
        alert('Product updated successfully! It will be reviewed by admin.');
        navigate('/seller/dashboard');
      }
    } catch (err) {
      console.error('Error updating product:', err);
      alert(err.response?.data?.message ? 'Error: ' + err.response.data.message : 'Failed to update product. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="edit-product-loading"><div className="spinner"></div><p>Loading product data...</p></div>;
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
                    <button type="button" onClick={() => removeExistingImage(imageUrl)} className="remove-image-btn" title="Remove this image">✕</button>
                    {index === 0 && <span className="primary-badge">Primary</span>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Add New Images */}
          <div className="form-section">
            <h3>Add More Images (Optional)</h3>
            <p className="section-description">Current: {existingImages.length + newImages.length} images (Min: 3, Max: 8)</p>
            <div className="image-upload-section">
              <label htmlFor="new-images" className="image-upload-label">
                <div className="upload-placeholder">
                  <span className="upload-icon">📸</span>
                  <p>Click to add more images</p>
                  <span className="upload-hint">JPG, PNG or WEBP (Max 5MB each)</span>
                </div>
                <input type="file" id="new-images" accept="image/jpeg,image/jpg,image/png,image/webp" multiple onChange={handleNewImageChange} className="file-input" />
              </label>
              {errors.images && <p className="error-text">{errors.images}</p>}
              {newImagePreviews.length > 0 && (
                <div className="new-images-grid">
                  <h4>New Images to Add:</h4>
                  <div className="existing-images-grid">
                    {newImagePreviews.map((preview, index) => (
                      <div key={index} className="image-preview-item">
                        <img src={preview} alt={`New ${index + 1}`} />
                        <button type="button" onClick={() => removeNewImage(index)} className="remove-image-btn">✕</button>
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
                <input type="text" name="name" value={formData.name} onChange={handleChange} className={errors.name ? 'error' : ''} />
                {errors.name && <p className="error-text">{errors.name}</p>}
              </div>
              <div className="form-group">
                <label>Category *</label>
                <select name="category_id" value={formData.category_id} onChange={handleChange} className={errors.category_id ? 'error' : ''}>
                  <option value="">Select Category</option>
                  {categories.map((cat) => (
                    <option key={cat.category_id} value={cat.category_id}>{cat.icon} {cat.name}</option>
                  ))}
                </select>
                {errors.category_id && <p className="error-text">{errors.category_id}</p>}
              </div>
            </div>

            <div className="form-group">
              <label>Description *</label>
              <textarea name="description" value={formData.description} onChange={handleChange} rows="5" className={errors.description ? 'error' : ''} />
              {errors.description && <p className="error-text">{errors.description}</p>}
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Price (Rs.) *</label>
                <input type="number" name="price" value={formData.price} onChange={handleChange} min="0" step="0.01" className={errors.price ? 'error' : ''} />
                {errors.price && <p className="error-text">{errors.price}</p>}
              </div>
              <div className="form-group">
                <label>Stock Quantity *</label>
                <input type="number" name="stock_quantity" value={formData.stock_quantity} onChange={handleChange} min="0" className={errors.stock_quantity ? 'error' : ''} />
                {errors.stock_quantity && <p className="error-text">{errors.stock_quantity}</p>}
              </div>
              <div className="form-group">
                <label>SKU (Optional)</label>
                <input type="text" name="sku" value={formData.sku} onChange={handleChange} />
              </div>
            </div>
          </div>

          {/* DISCOUNT SECTION */}
          <div className="form-section">
            <h3>Discount</h3>

            <div className="discount-toggle-row">
              <label className="toggle-label">
                <div className="toggle-switch">
                  <input
                    type="checkbox"
                    name="has_discount"
                    checked={formData.has_discount}
                    onChange={handleChange}
                  />
                  <span className="toggle-slider"></span>
                </div>
                <span>Enable Discount</span>
              </label>
            </div>

            {formData.has_discount && (
              <div className="discount-inputs" style={{ marginTop: '1rem' }}>
                <div className="form-group" style={{ maxWidth: '220px' }}>
                  <label>Discount Percentage *</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type="number"
                      name="discount_percentage"
                      value={formData.discount_percentage}
                      onChange={handleChange}
                      min="1"
                      max="99"
                      placeholder="e.g. 20"
                      className={errors.discount_percentage ? 'error' : ''}
                      style={{ paddingRight: '2rem' }}
                    />
                    <span style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', color: '#888' }}>%</span>
                  </div>
                  {errors.discount_percentage && <p className="error-text">{errors.discount_percentage}</p>}
                </div>

                {/* Live preview */}
                {discountedPreviewPrice && (
                  <div className="discount-preview" style={{
                    marginTop: '0.75rem',
                    background: 'linear-gradient(135deg, #fffbeb, #fef3c7)',
                    border: '1px solid #fcd34d',
                    borderRadius: '10px',
                    padding: '0.85rem 1.2rem',
                    display: 'inline-block',
                  }}>
                    <p style={{ margin: 0, fontSize: '0.8rem', color: '#92400e', fontWeight: 600, marginBottom: '0.3rem' }}>Preview</p>
                    <span style={{ textDecoration: 'line-through', color: '#aaa', fontSize: '0.9rem', marginRight: '0.6rem' }}>
                      Rs. {parseFloat(formData.price).toLocaleString()}
                    </span>
                    <span style={{ color: '#DC2626', fontWeight: 800, fontSize: '1.15rem', marginRight: '0.6rem' }}>
                      Rs. {discountedPreviewPrice.toLocaleString()}
                    </span>
                    <span style={{ color: '#059669', fontSize: '0.8rem', fontWeight: 600 }}>
                      Save Rs. {savings.toLocaleString()}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Submit Buttons */}
          <div className="form-actions">
            <button type="button" onClick={() => navigate('/seller/dashboard')} className="btn-cancel">Cancel</button>
            <button type="submit" disabled={submitting} className="btn-submit">
              {submitting ? 'Updating Product...' : 'Update Product'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditProduct;