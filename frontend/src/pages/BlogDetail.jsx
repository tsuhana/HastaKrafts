import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { storyAPI } from '../api/axios';
import { useToast } from '../context/ToastContext';
import { useTranslation } from 'react-i18next';
import '../styles/BlogDetail.css';

const API_URL = 'http://localhost:5000';

const SellerAvatar = ({ seller, className = 'bd-avatar', initClass = 'bd-avatar-init' }) => {
  const name = seller?.shop_name || '??';
  const initials = name.substring(0, 2).toUpperCase();
  const photo = seller?.shop_logo
    ? `${API_URL}${seller.shop_logo}`
    : seller?.user?.profile_image
      ? `${API_URL}${seller.user.profile_image}`
      : null;
  return photo
    ? <img className={className} src={photo} alt={name} />
    : <div className={initClass}>{initials}</div>;
};

const BlogDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const { t } = useTranslation();
  const [story, setStory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);

  const user = JSON.parse(localStorage.getItem('user') || sessionStorage.getItem('user') || 'null');

  // Category label map using translation keys
  const getCategoryLabel = (val) => {
    const map = {
      craft_process: 'blog.craft_process',
      heritage: 'blog.heritage',
      personal_journey: 'blog.personal_journey',
      tips_tricks: 'blog.tips_tricks',
      behind_scenes: 'blog.behind_scenes',
      other: 'blog.other',
    };
    return map[val] ? t(map[val]) : val;
  };

  useEffect(() => { fetchStory(); }, [id]);

  const fetchStory = async () => {
    try {
      setLoading(true);
      const res = await storyAPI.getStoryById(id);
      setStory(res.data.data);
    } catch (err) {
      console.error('Error fetching story:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Delete this story permanently?')) return;
    try {
      setDeleting(true);
      await storyAPI.deleteStory(id);
      navigate('/blog');
    } catch (err) {
      console.error('Delete error:', err);
      toast.error('Failed to delete story.');
    } finally {
      setDeleting(false);
    }
  };

  if (loading) return (
    <div className="bd-state"><div className="bd-spinner" /><p>{t('common.loading')}</p></div>
  );

  if (!story) return (
    <div className="bd-state">
      <h2>Story not found</h2>
      <Link to="/blog">{t('blog.back')}</Link>
    </div>
  );

  const isAuthor = user?.role === 'seller' && story.seller?.user?.user_id === user?.user_id;
  const paragraphs = story.content.split(/\n\n+/).filter(Boolean);

  return (
    <div className="bd-page">
      {story.featured_image && (
        <div className="bd-hero">
          <img src={`${API_URL}${story.featured_image}`} alt={story.title} />
          <div className="bd-hero-fade" />
        </div>
      )}

      <div className="bd-container">
        <nav className="bd-breadcrumb">
          <Link to="/blog">{t('nav.blog')}</Link>
          <span>/</span>
          <span className="bd-crumb-current">{story.title}</span>
        </nav>

        <header className="bd-header">
          <span className="bd-chip">{getCategoryLabel(story.category)}</span>
          <h1 className="bd-title">{story.title}</h1>

          <div className="bd-byline">
            <div className="bd-author">
              <SellerAvatar seller={story.seller} />
              <div>
                <p className="bd-author-name">{story.seller?.shop_name}</p>
                <p className="bd-author-meta">
                  {story.seller?.user?.full_name}
                  {story.seller?.city ? ` · ${story.seller.city}` : ''}
                  {' · '}
                  {new Date(story.published_at).toLocaleDateString('en-US', {
                    year: 'numeric', month: 'long', day: 'numeric',
                  })}
                  {' · '}{story.views_count} {t('blog.views')}
                </p>
              </div>
            </div>

            {isAuthor && (
              <div className="bd-author-actions">
                <Link to={`/seller/edit-blog/${id}`} className="bd-edit-btn">{t('blog.edit')}</Link>
                <button onClick={handleDelete} disabled={deleting} className="bd-delete-btn">
                  {deleting ? t('common.loading') : t('blog.delete')}
                </button>
              </div>
            )}
          </div>
        </header>

        <div className="bd-divider" />

        <article className="bd-article">
          {paragraphs.map((para, i) => <p key={i}>{para}</p>)}
        </article>

        {story.images?.length > 1 && (
          <section className="bd-gallery">
            <h3>Gallery</h3>
            <div className="bd-gallery-grid">
              {story.images.slice(1).map((img, i) => (
                <div key={i} className="bd-gallery-item">
                  <img src={`${API_URL}${img}`} alt={`Gallery ${i + 1}`} />
                </div>
              ))}
            </div>
          </section>
        )}

        <div className="bd-author-card">
          <SellerAvatar seller={story.seller} className="bd-author-card-img" initClass="bd-avatar-init lg" />
          <div className="bd-author-card-info">
            <p className="bd-written-by">{t('blog.written_by')}</p>
            <h3>{story.seller?.shop_name}</h3>
            <p className="bd-author-fullname">{story.seller?.user?.full_name}</p>
            {story.seller?.shop_description && (
              <p className="bd-shop-desc">{story.seller.shop_description}</p>
            )}
            <p className="bd-shop-city">{story.seller?.city}</p>
          </div>
        </div>

        <Link to="/blog" className="bd-back-btn">{t('blog.back')}</Link>
      </div>
    </div>
  );
};

export default BlogDetail;