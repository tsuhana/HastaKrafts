import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import "./SellerMyBlogs.css";
 
const API_URL = "http://localhost:5000";
 
const CATEGORY_LABELS = {
  craft_process:    "Craft Process",
  heritage:         "Heritage",
  personal_journey: "Personal Journey",
  tips_tricks:      "Tips & Tricks",
  behind_scenes:    "Behind the Scenes",
  other:            "Other",
};
 
const CATEGORY_COLORS = {
  craft_process:    "smb-cat-craft",
  heritage:         "smb-cat-heritage",
  personal_journey: "smb-cat-journey",
  tips_tricks:      "smb-cat-tips",
  behind_scenes:    "smb-cat-behind",
  other:            "smb-cat-other",
};
 
const SellerMyBlogs = ({ toast, t }) => {
  const [stories, setStories]             = useState([]);
  const [loading, setLoading]             = useState(true);
  const [filter, setFilter]               = useState("all");
  const [searchQuery, setSearchQuery]     = useState("");
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [togglingId, setTogglingId]       = useState(null);
  const [deletingId, setDeletingId]       = useState(null);
 
  useEffect(() => {
    fetchMyStories();
  }, []);
 
  const fetchMyStories = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/api/stories/seller/my-stories`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      const data = await res.json();
      if (data.success) setStories(data.data || []);
      else toast?.error("Failed to load your blogs");
    } catch (err) {
      console.error("fetchMyStories:", err);
      toast?.error("Failed to load your blogs");
    } finally {
      setLoading(false);
    }
  };
 
  const handleTogglePublish = async (story) => {
    setTogglingId(story.story_id);
    try {
      const res = await fetch(`${API_URL}/api/stories/${story.story_id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({ is_published: !story.is_published }),
      });
      const data = await res.json();
      if (data.success) {
        setStories((prev) =>
          prev.map((s) =>
            s.story_id === story.story_id
              ? { ...s, is_published: !s.is_published }
              : s
          )
        );
        toast?.success(story.is_published ? "Story moved to drafts" : "Story published!");
      } else {
        toast?.error(data.message || "Failed to update story");
      }
    } catch (err) {
      console.error("togglePublish:", err);
      toast?.error("Failed to update story");
    } finally {
      setTogglingId(null);
    }
  };
 
  const handleDelete = async (storyId) => {
    setDeletingId(storyId);
    setConfirmDelete(null);
    try {
      const res = await fetch(`${API_URL}/api/stories/${storyId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      const data = await res.json();
      if (data.success) {
        setStories((prev) => prev.filter((s) => s.story_id !== storyId));
        toast?.success("Story deleted");
      } else {
        toast?.error(data.message || "Failed to delete story");
      }
    } catch (err) {
      console.error("deleteStory:", err);
      toast?.error("Failed to delete story");
    } finally {
      setDeletingId(null);
    }
  };
 
  const publishedCount = stories.filter((s) => s.is_published).length;
  const draftCount     = stories.filter((s) => !s.is_published).length;
  const totalViews     = stories.reduce((sum, s) => sum + (s.views_count || 0), 0);
 
  const filtered = stories.filter((s) => {
    const matchStatus =
      filter === "all" ||
      (filter === "published" && s.is_published) ||
      (filter === "draft" && !s.is_published);
    const q = searchQuery.toLowerCase();
    const matchSearch =
      !q ||
      s.title.toLowerCase().includes(q) ||
      (s.excerpt || "").toLowerCase().includes(q);
    return matchStatus && matchSearch;
  });
 
  if (loading) {
    return (
      <div className="sd-loading">
        <div className="sd-spinner" />
        <p>Loading your blogs…</p>
      </div>
    );
  }
 
  return (
    <div className="smb-wrap">
 
      {/* ── Page header ── */}
      <div className="sd-page-header">
        <div>
          <h1>My Blogs</h1>
          <p>
            {stories.length} blog{stories.length !== 1 ? "s" : ""} ·{" "}
            {publishedCount} published · {draftCount} draft
            {totalViews > 0 && ` · ${totalViews.toLocaleString()} total views`}
          </p>
        </div>
        <Link to="/seller/create-blog" className="sd-btn-primary">
          + Write New Blog
        </Link>
      </div>
 
      {/* ── Stats row ── */}
      {stories.length > 0 && (
        <div className="smb-stats-row">
          <div className="smb-stat-card smb-stat-brown">
            <div className="smb-stat-label">Total Posts</div>
            <div className="smb-stat-value">{stories.length}</div>
          </div>
          <div className="smb-stat-card smb-stat-green">
            <div className="smb-stat-label">Published</div>
            <div className="smb-stat-value">{publishedCount}</div>
          </div>
          <div className="smb-stat-card smb-stat-blue">
            <div className="smb-stat-label">Total Views</div>
            <div className="smb-stat-value">{totalViews.toLocaleString()}</div>
          </div>
        </div>
      )}
 
      {/* ── Filter + Search bar ── */}
      <div className="smb-controls">
        <div className="smb-filter-row">
          {[
            { key: "all",       label: `All (${stories.length})` },
            { key: "published", label: `Published (${publishedCount})` },
            { key: "draft",     label: `Drafts (${draftCount})` },
          ].map((f) => (
            <button
              key={f.key}
              className={`sd-filter-chip ${filter === f.key ? "active" : ""}`}
              onClick={() => setFilter(f.key)}
            >
              {f.label}
            </button>
          ))}
        </div>
        <div className="smb-search-wrap">
          <span className="smb-search-icon">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
          </span>
          <input
            type="text"
            className="smb-search-input"
            placeholder="Search your blogs…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button className="smb-search-clear" onClick={() => setSearchQuery("")}>×</button>
          )}
        </div>
      </div>
 
      {/* ── Empty state: no blogs at all ── */}
      {stories.length === 0 ? (
        <div className="smb-empty-state">
          <div className="smb-empty-icon">📝</div>
          <h3>No blogs yet</h3>
          <p>Share your craft journey, techniques, and stories with customers.</p>
          <Link to="/seller/create-blog" className="sd-btn-primary">
            Write Your First Blog
          </Link>
        </div>
      ) : filtered.length === 0 ? (
        <div className="smb-empty-filter">
          No blogs match your search or filter.
        </div>
      ) : (
        /* ── Blog cards ── */
        <div className="smb-list">
          {filtered.map((story) => {
            const catClass = CATEGORY_COLORS[story.category] || "smb-cat-other";
            const catLabel = CATEGORY_LABELS[story.category] || "Other";
            const isToggling = togglingId === story.story_id;
            const isDeleting = deletingId === story.story_id;
            const displayDate = story.published_at || story.created_at;
 
            return (
              <div
                key={story.story_id}
                className={`smb-card ${isDeleting ? "smb-card-deleting" : ""}`}
              >
                {/* Thumbnail */}
                <div className="smb-card-thumb">
                  {story.featured_image ? (
                    <img
                      src={`${API_URL}${story.featured_image}`}
                      alt={story.title}
                    />
                  ) : (
                    <span className="smb-card-thumb-placeholder">📖</span>
                  )}
                </div>
 
                {/* Content */}
                <div className="smb-card-body">
                  <div className="smb-card-badges">
                    <span className={`smb-cat-badge ${catClass}`}>{catLabel}</span>
                    <span className={`smb-status-badge ${story.is_published ? "smb-published" : "smb-draft"}`}>
                      {story.is_published ? "● Published" : "○ Draft"}
                    </span>
                    {story.views_count > 0 && (
                      <span className="smb-views">👁 {story.views_count.toLocaleString()} views</span>
                    )}
                  </div>
                  <h3 className="smb-card-title">{story.title}</h3>
                  <p className="smb-card-excerpt">
                    {story.excerpt || (story.content || "").substring(0, 150)}
                  </p>
                  <div className="smb-card-date">
                    {new Date(displayDate).toLocaleDateString("en-US", {
                      year: "numeric", month: "short", day: "numeric",
                    })}
                  </div>
                </div>
 
                {/* Actions */}
                <div className="smb-card-actions">
                  <a
                    href={`/blog/${story.story_id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="smb-action-btn smb-btn-view"
                  >
                    View
                  </a>
                  <Link
                    to={`/seller/edit-blog/${story.story_id}`}
                    className="smb-action-btn smb-btn-edit"
                  >
                    Edit
                  </Link>
                  <button
                    className={`smb-action-btn ${story.is_published ? "smb-btn-unpublish" : "smb-btn-publish"}`}
                    onClick={() => handleTogglePublish(story)}
                    disabled={isToggling}
                  >
                    {isToggling ? "…" : story.is_published ? "Unpublish" : "Publish"}
                  </button>
                  <button
                    className="smb-action-btn smb-btn-delete"
                    onClick={() => setConfirmDelete(story.story_id)}
                    disabled={isDeleting}
                  >
                    {isDeleting ? "…" : "Delete"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
 
      {/* ── Delete confirm modal ── */}
      {confirmDelete && (
        <div className="smb-overlay" onClick={() => setConfirmDelete(null)}>
          <div className="smb-confirm-modal" onClick={(e) => e.stopPropagation()}>
            <div className="smb-confirm-icon">🗑️</div>
            <h3>Delete this blog?</h3>
            <p>This action cannot be undone. The blog and all its images will be permanently removed.</p>
            <div className="smb-confirm-actions">
              <button className="smb-confirm-cancel" onClick={() => setConfirmDelete(null)}>
                Cancel
              </button>
              <button className="smb-confirm-delete" onClick={() => handleDelete(confirmDelete)}>
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
 
export default SellerMyBlogs;