import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
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

const EditBlog = () => {
  const { id }      = useParams();
  const navigate    = useNavigate();
  const toast       = useToast();
  const [loading, setLoading]       = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    title:    '',
    category: 'craft_process',
    excerpt:  '',
    content:  '',
  });
  const [errors, setErrors] = useState({});

  useEffect(() => { fetchStory(); }, [id]);

  const fetchStory = async () => {
    try {
      const res = await storyAPI.getStoryById(id);
      const s = res.data.data;
      setForm({
        title:    s.title    || '',
        category: s.category || 'craft_process',
        excerpt:  s.excerpt  || '',
        content:  s.content  || '',
      });
    } catch (err) {
      console.error('Failed to load story:', err);
      toast.error('Could not load story.');
      navigate('/blog');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
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
      await storyAPI.updateStory(id, {
        title:    form.title,
        category: form.category,
        excerpt:  form.excerpt || form.content.substring(0, 200) + '…',
        content:  form.content,
      });
      navigate(`/blog/${id}`);
    } catch (err) {
      console.error('Update error:', err);
      toast.error(err.response?.data?.message || 'Failed to update story');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="cb-page">
        <div style={{ textAlign: 'center', padding: '5rem', color: '#9c7b65' }}>
          <div className="cb-spinner" />
          <p>Loading story…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="cb-page">
      <div className="cb-container">

        <div className="cb-header">
          <Link to="/blog" className="cb-back">← Back to Blog</Link>
          <h1>Edit Story</h1>
          <p>Update your story below.</p>
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
              rows={14}
              className={`cb-input cb-textarea${errors.content ? ' error' : ''}`}
            />
            <div className="cb-char-count">{form.content.length} characters</div>
            {errors.content && <span className="cb-error">{errors.content}</span>}
          </div>

          {/* image editing not supported in update — backend doesn't handle it */}
          <p style={{ fontSize: '0.78rem', color: '#9c7b65', margin: 0 }}>
            Note: Images cannot be changed after publishing. Delete and repost to change images.
          </p>

          {/* SUBMIT */}
          <div className="cb-submit-row">
            <Link to={`/blog/${id}`} className="cb-cancel">Cancel</Link>
            <button type="submit" disabled={submitting} className="cb-submit">
              {submitting ? 'Saving…' : 'Save Changes'}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};

export default EditBlog;