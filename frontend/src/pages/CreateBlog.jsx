import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { storyAPI } from '../api/axios';
import { useToast } from '../context/ToastContext';
import '../styles/CreateBlog.css';

const CATEGORIES = [
  { value: 'craft_process',    label: 'Craft Process'     },
  { value: 'heritage',         label: 'Heritage'          },
  { value: 'personal_journey', label: 'Personal Journey'  },
  { value: 'tips_tricks',      label: 'Tips & Tricks'     },
  { value: 'behind_scenes',    label: 'Behind the Scenes' },
  { value: 'other',            label: 'Other'             },
];

const CreateBlog = () => {
  const navigate        = useNavigate();
  const toast           = useToast();
  const [submitting, setSubmitting]     = useState(false);
  const [previewing, setPreviewing]     = useState(false);
  const [images, setImages]             = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);

  const [form, setForm] = useState({
    title:    '',
    category: 'craft_process',
    excerpt:  '',
    content:  '',
  });

  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const handleImages = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 5) {
      toast.warning('Maximum 5 images allowed.');
      return;
    }
    setImages(files);
    setImagePreviews(files.map((f) => URL.createObjectURL(f)));
  };

  const removeImage = (i) => {
    setImages((prev) => prev.filter((_, idx) => idx !== i));
    setImagePreviews((prev) => prev.filter((_, idx) => idx !== i));
  };

  const validate = () => {
    const errs = {};
    if (!form.title.trim())   errs.title   = 'Title is required';
    if (!form.content.trim()) errs.content = 'Content is required';
    if (form.content.trim().length < 50)
      errs.content = 'Content must be at least 50 characters';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    try {
      setSubmitting(true);
      const formData = new FormData();
      formData.append('title',    form.title);
      formData.append('category', form.category);
      formData.append('excerpt',  form.excerpt || form.content.substring(0, 200) + '…');
      formData.append('content',  form.content);
      images.forEach((img) => formData.append('images', img));

      const res = await storyAPI.createStory(formData);
      if (res.data.success) {
        navigate(`/blog/${res.data.data.story_id}`);
      }
    } catch (err) {
      console.error('Create blog error:', err);
      toast.error(err.response?.data?.message || 'Failed to publish story');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="cb-page">
      <div className="cb-container">

        {/* HEADER */}
        <div className="cb-header">
          <Link to="/blog" className="cb-back">← Back to Blog</Link>
          <h1>Write a Story</h1>
          <p>Share your craft, heritage, and journey with the world.</p>
        </div>

        <form onSubmit={handleSubmit} className="cb-form">

          {/* TITLE */}
          <div className="cb-field">
            <label htmlFor="title">Title <span className="cb-req">*</span></label>
            <input
              id="title"
              type="text"
              name="title"
              value={form.title}
              onChange={handleChange}
              placeholder="Give your story a memorable title…"
              className={`cb-input${errors.title ? ' error' : ''}`}
            />
            {errors.title && <span className="cb-error">{errors.title}</span>}
          </div>

          {/* CATEGORY */}
          <div className="cb-field">
            <label>Category</label>
            <div className="cb-cat-grid">
              {CATEGORIES.map((cat) => (
                <label
                  key={cat.value}
                  className={`cb-cat-option${form.category === cat.value ? ' active' : ''}`}
                >
                  <input
                    type="radio"
                    name="category"
                    value={cat.value}
                    checked={form.category === cat.value}
                    onChange={handleChange}
                  />
                  {cat.label}
                </label>
              ))}
            </div>
          </div>

          {/* EXCERPT */}
          <div className="cb-field">
            <label htmlFor="excerpt">
              Short Excerpt
              <span className="cb-hint"> — leave blank to auto-generate</span>
            </label>
            <textarea
              id="excerpt"
              name="excerpt"
              value={form.excerpt}
              onChange={handleChange}
              placeholder="A 1–2 sentence teaser for your story…"
              rows={2}
              className="cb-input"
            />
          </div>

          {/* CONTENT */}
          <div className="cb-field">
            <label htmlFor="content">Your Story <span className="cb-req">*</span></label>
            <textarea
              id="content"
              name="content"
              value={form.content}
              onChange={handleChange}
              placeholder="Write your story here… Use blank lines to separate paragraphs."
              rows={14}
              className={`cb-input cb-textarea${errors.content ? ' error' : ''}`}
            />
            <div className="cb-char-count">{form.content.length} characters</div>
            {errors.content && <span className="cb-error">{errors.content}</span>}
          </div>

          {/* IMAGES */}
          <div className="cb-field">
            <label>
              Images
              <span className="cb-hint"> — up to 5, first becomes the cover</span>
            </label>
            <label className="cb-upload-area">
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleImages}
                style={{ display: 'none' }}
              />
              <p className="cb-upload-label">Click to upload images</p>
              <p className="cb-upload-hint">JPG, PNG, WEBP — max 5MB each</p>
            </label>

            {imagePreviews.length > 0 && (
              <div className="cb-previews">
                {imagePreviews.map((src, i) => (
                  <div key={i} className="cb-preview-item">
                    <img src={src} alt={`Preview ${i + 1}`} />
                    {i === 0 && <span className="cb-cover-tag">Cover</span>}
                    <button
                      type="button"
                      className="cb-remove-img"
                      onClick={() => removeImage(i)}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* PREVIEW */}
          {form.content && (
            <div className="cb-preview-section">
              <button
                type="button"
                className="cb-preview-toggle"
                onClick={() => setPreviewing(!previewing)}
              >
                {previewing ? 'Hide Preview' : 'Preview Story'}
              </button>

              {previewing && (
                <div className="cb-preview-box">
                  <h2 className="cb-preview-title">{form.title || '(No title yet)'}</h2>
                  {form.content.split(/\n\n+/).filter(Boolean).map((para, i) => (
                    <p key={i}>{para}</p>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* SUBMIT */}
          <div className="cb-submit-row">
            <Link to="/blog" className="cb-cancel">Cancel</Link>
            <button type="submit" disabled={submitting} className="cb-submit">
              {submitting ? 'Publishing…' : 'Publish Story'}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};

export default CreateBlog;