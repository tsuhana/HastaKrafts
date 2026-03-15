import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { storyAPI } from '../api/axios';
import { useToast } from '../context/ToastContext';
import { useTranslation } from 'react-i18next';
import ConfirmModal from '../components/ConfirmModal';
import '../styles/Blog.css';

const API_URL = 'http://localhost:5000';

// shop_logo → user profile_image → initials
const SellerAvatar = ({ seller, className = 'blog-avatar', initClass = 'blog-avatar-init' }) => {
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

const Blog = () => {
  const toast = useToast();
  const { t } = useTranslation();

  // Build categories using translation keys
  const CATEGORIES = [
    { value: 'all',              labelKey: 'blog.all_stories'     },
    { value: 'craft_process',    labelKey: 'blog.craft_process'   },
    { value: 'heritage',         labelKey: 'blog.heritage'        },
    { value: 'personal_journey', labelKey: 'blog.personal_journey'},
    { value: 'tips_tricks',      labelKey: 'blog.tips_tricks'     },
    { value: 'behind_scenes',    labelKey: 'blog.behind_scenes'   },
    { value: 'other',            labelKey: 'blog.other'           },
  ];

  const getCategoryLabel = (val) => {
    const cat = CATEGORIES.find(c => c.value === val);
    return cat ? t(cat.labelKey) : val;
  };

  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('all');
  const [deletingId, setDeletingId] = useState(null);
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, storyId: null });

  const user = JSON.parse(localStorage.getItem('user') || 'null');

  useEffect(() => { fetchStories(); }, [activeCategory]);

  const fetchStories = async () => {
    try {
      setLoading(true);
      const params = activeCategory !== 'all' ? { category: activeCategory } : {};
      const res = await storyAPI.getAllStories(params);
      setStories(res.data.data.stories || []);
    } catch (err) {
      console.error('Error fetching stories:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = (e, storyId) => {
    e.preventDefault();
    e.stopPropagation();
    setConfirmModal({ isOpen: true, storyId });
  };

  const handleDeleteConfirm = async () => {
    const storyId = confirmModal.storyId;
    setConfirmModal({ isOpen: false, storyId: null });
    try {
      setDeletingId(storyId);
      await storyAPI.deleteStory(storyId);
      setStories(prev => prev.filter(s => s.story_id !== storyId));
    } catch (err) {
      console.error('Delete error:', err);
      toast.error('Failed to delete story.');
    } finally {
      setDeletingId(null);
    }
  };

  const isAuthor = (story) =>
    user?.role === 'seller' && story.seller?.user?.user_id === user?.user_id;

  const fmtDate = (d) =>
    new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });

  const latestStories = stories.slice(0, 5);

  return (
    <div className="blog-page">
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title="Delete this story?"
        message="This action cannot be undone. The story will be permanently removed."
        confirmText={t('blog.delete')}
        cancelText={t('common.cancel')}
        confirmVariant="danger"
        onConfirm={handleDeleteConfirm}
        onCancel={() => setConfirmModal({ isOpen: false, storyId: null })}
      />

      <header className="blog-header">
        <p className="blog-eyebrow">{t('blog.eyebrow')}</p>
        <h1 className="blog-title">{t('blog.title')}</h1>
        <p className="blog-subtitle">{t('blog.subtitle')}</p>
        {user?.role === 'seller' && (
          <Link to="/seller/create-blog" className="blog-write-btn">{t('blog.write')}</Link>
        )}
      </header>

      <nav className="blog-filter-bar">
        <div className="blog-filter-inner">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.value}
              className={`blog-filter-btn${activeCategory === cat.value ? ' active' : ''}`}
              onClick={() => setActiveCategory(cat.value)}
            >
              {t(cat.labelKey)}
            </button>
          ))}
        </div>
      </nav>

      <div className="blog-layout">
        <main className="blog-main">
          {loading ? (
            <div className="blog-state"><div className="blog-spinner" /><p>{t('blog.loading')}</p></div>
          ) : stories.length === 0 ? (
            <div className="blog-state">
              <h3>{t('blog.no_stories')}</h3>
              <p>{t('blog.no_stories_desc')}</p>
            </div>
          ) : (
            <div className="blog-feed">
              {stories.map((story) => (
                <article key={story.story_id} className="blog-row">
                  <Link to={`/blog/${story.story_id}`} className="blog-row-img-wrap">
                    {story.featured_image
                      ? <img src={`${API_URL}${story.featured_image}`} alt={story.title} />
                      : <div className="blog-img-placeholder" />
                    }
                  </Link>

                  <div className="blog-row-body">
                    <div className="blog-row-top">
                      <span className="blog-chip">{getCategoryLabel(story.category)}</span>
                      {isAuthor(story) && (
                        <div className="blog-actions">
                          <Link to={`/seller/edit-blog/${story.story_id}`} className="blog-action-btn edit" onClick={(e) => e.stopPropagation()}>
                            {t('blog.edit')}
                          </Link>
                          <button className="blog-action-btn delete" onClick={(e) => handleDeleteClick(e, story.story_id)} disabled={deletingId === story.story_id}>
                            {deletingId === story.story_id ? '…' : t('blog.delete')}
                          </button>
                        </div>
                      )}
                    </div>

                    <Link to={`/blog/${story.story_id}`} className="blog-row-title-link">
                      <h2 className="blog-row-title">{story.title}</h2>
                    </Link>

                    <p className="blog-row-excerpt">{story.excerpt}</p>

                    <div className="blog-row-footer">
                      <div className="blog-author">
                        <SellerAvatar seller={story.seller} />
                        <div>
                          <p className="blog-author-name">{story.seller?.shop_name}</p>
                          <p className="blog-author-city">
                            {story.seller?.user?.full_name}
                            {story.seller?.city ? ` · ${story.seller.city}` : ''}
                          </p>
                        </div>
                      </div>
                      <div className="blog-row-meta">
                        <span>{fmtDate(story.published_at)}</span>
                        <span className="blog-sep">·</span>
                        <span>{story.views_count} {t('blog.views')}</span>
                      </div>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </main>

        <aside className="blog-sidebar">
          <div className="blog-sidebar-box">
            <h3 className="blog-sidebar-heading">{t('blog.latest_posts')}</h3>
            {loading ? <p className="blog-sidebar-muted">{t('common.loading')}</p>
              : latestStories.length === 0 ? <p className="blog-sidebar-muted">{t('blog.no_stories')}.</p>
              : (
                <ul className="blog-sidebar-list">
                  {latestStories.map((s) => (
                    <li key={s.story_id}>
                      <Link to={`/blog/${s.story_id}`} className="blog-sidebar-item">
                        <div className="blog-sidebar-thumb">
                          {s.featured_image
                            ? <img src={`${API_URL}${s.featured_image}`} alt={s.title} />
                            : <div className="blog-sidebar-placeholder" />
                          }
                        </div>
                        <div className="blog-sidebar-info">
                          <p className="blog-sidebar-cat">{getCategoryLabel(s.category)}</p>
                          <p className="blog-sidebar-name">{s.title}</p>
                          <p className="blog-sidebar-date">{fmtDate(s.published_at)}</p>
                        </div>
                      </Link>
                    </li>
                  ))}
                </ul>
              )
            }
          </div>

          <div className="blog-sidebar-box">
            <h3 className="blog-sidebar-heading">{t('blog.categories')}</h3>
            <ul className="blog-sidebar-cats">
              {CATEGORIES.filter(c => c.value !== 'all').map((cat) => (
                <li key={cat.value}>
                  <button
                    className={`blog-sidebar-cat-btn${activeCategory === cat.value ? ' active' : ''}`}
                    onClick={() => setActiveCategory(cat.value)}
                  >
                    {t(cat.labelKey)}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default Blog;