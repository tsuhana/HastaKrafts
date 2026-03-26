import React, { useEffect, useRef, useState } from "react";
import { reviewAPI } from "../api/axios";
import { useToast } from "../context/ToastContext";
import "./Reviews.css";

const API_URL = "http://localhost:5000";

// ── Star components ──────────────────────────────────────────────────────────
const StarIcon = ({ filled, size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" className="rv-starSvg" aria-hidden="true">
    <polygon
      points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth="1.5"
    />
  </svg>
);

const Stars = ({ value, interactive = false, onChange, size = 18 }) => {
  const [hover, setHover] = useState(0);
  const active = interactive ? hover || value : value;
  return (
    <div
      className="rv-stars"
      role={interactive ? "radiogroup" : "img"}
      aria-label={`Rating ${value} out of 5`}
    >
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          className={`rv-starBtn ${interactive ? "isPick" : ""}`}
          onClick={() => interactive && onChange?.(n)}
          onMouseEnter={() => interactive && setHover(n)}
          onMouseLeave={() => interactive && setHover(0)}
          tabIndex={interactive ? 0 : -1}
          aria-label={`Rate ${n} star`}
        >
          <span className={n <= active ? "rv-starFilled" : "rv-starEmpty"}>
            <StarIcon filled={n <= active} size={size} />
          </span>
        </button>
      ))}
    </div>
  );
};

const LABELS = ["", "Poor", "Fair", "Good", "Very good", "Excellent"];

// ── Helpful button ───────────────────────────────────────────────────────────
const HelpfulBtn = ({ reviewId, count, marked, isLoggedIn, onToggle }) => {
  const [optimisticMarked, setOptimisticMarked] = useState(marked);
  const [optimisticCount, setOptimisticCount]   = useState(count);
  const [loading, setLoading]                   = useState(false);
  const toast = useToast();

  const handleClick = async () => {
    if (!isLoggedIn) { toast.info("Please log in to mark reviews as helpful"); return; }
    if (loading) return;
    const newMarked = !optimisticMarked;
    setOptimisticMarked(newMarked);
    setOptimisticCount((c) => newMarked ? c + 1 : Math.max(0, c - 1));
    setLoading(true);
    try {
      await reviewAPI.toggleHelpful(reviewId);
      onToggle?.();
    } catch {
      setOptimisticMarked(optimisticMarked);
      setOptimisticCount(count);
      toast.error("Failed to update. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      className={`rv-helpfulBtn ${optimisticMarked ? "rv-helpfulBtn--marked" : ""}`}
      onClick={handleClick}
      disabled={loading}
      title={optimisticMarked ? "Remove helpful mark" : "Mark as helpful"}
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill={optimisticMarked ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3H14z"/>
        <path d="M7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/>
      </svg>
      <span>Helpful</span>
      {optimisticCount > 0 && <span className="rv-helpfulCount">{optimisticCount}</span>}
    </button>
  );
};

// ── Reply form ───────────────────────────────────────────────────────────────
const ReplyForm = ({ reviewId, isLoggedIn, onSubmitted, onCancel }) => {
  const [text, setText]     = useState("");
  const [saving, setSaving] = useState(false);
  const toast = useToast();

  const submit = async () => {
    if (!text.trim()) return;
    if (!isLoggedIn) { toast.info("Please log in to reply"); return; }
    if (text.trim().length > 500) { toast.warning("Reply must be under 500 characters"); return; }
    setSaving(true);
    try {
      await reviewAPI.createReply(reviewId, { comment: text.trim() });
      toast.success("Reply posted!");
      setText("");
      onSubmitted?.();
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not post reply");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="rv-replyForm">
      <textarea
        className="rv-replyTextarea"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Write a reply..."
        rows={2}
        maxLength={500}
        autoFocus
      />
      <div className="rv-replyChar">{text.length}/500</div>
      <div className="rv-replyActions">
        <button className="rv-replyCancel" onClick={onCancel} disabled={saving}>Cancel</button>
        <button className="rv-replySubmit" onClick={submit} disabled={saving || !text.trim()}>
          {saving ? "Posting…" : "Post Reply"}
        </button>
      </div>
    </div>
  );
};

// ── Single review card (recursive for nested replies) ────────────────────────
const ReviewCard = ({ review, currentUser, isLoggedIn, depth = 0, onRefresh, fmtDate, initials }) => {
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [isEditing, setIsEditing]         = useState(false);
  const [editComment, setEditComment]     = useState(review.comment || "");
  const [editRating, setEditRating]       = useState(review.rating || 0);
  const [editSaving, setEditSaving]       = useState(false);
  const toast = useToast();

  const name      = review.user?.full_name || "Anonymous";
  const isReply   = review.parent_id !== null;
  // ✅ Owner check: currentUser owns this entry OR currentUser is admin
  const isOwn     = currentUser?.user_id === review.user_id;
  const isAdmin   = currentUser?.role === "admin";
  const canEdit   = isOwn || isAdmin;
  const canDelete = isOwn || isAdmin;

  const indentClass = depth === 0 ? "" : depth === 1 ? "rv-depth1" : "rv-depth2";

  const handleDelete = async () => {
    if (!window.confirm("Delete this review?")) return;
    try {
      await reviewAPI.deleteReview(review.review_id);
      toast.success("Deleted successfully");
      onRefresh?.();
    } catch {
      toast.error("Could not delete.");
    }
  };

  // ✅ handleEdit: only sends rating for top-level reviews, never for replies
  const handleEdit = async () => {
    if (!isReply && !editRating) {
      toast.warning("Rating is required");
      return;
    }
    if (!editComment.trim()) {
      toast.warning("Comment cannot be empty");
      return;
    }
    setEditSaving(true);
    try {
      const payload = { comment: editComment.trim() };
      // Only include rating for top-level reviews
      if (!isReply) payload.rating = editRating;

      await reviewAPI.updateReview(review.review_id, payload);
      toast.success("Updated successfully!");
      setIsEditing(false);
      onRefresh?.();
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not update.");
    } finally {
      setEditSaving(false);
    }
  };

  const cancelEdit = () => {
    setEditComment(review.comment || "");
    setEditRating(review.rating || 0);
    setIsEditing(false);
  };

  return (
    <div className={`rv-card ${indentClass}`}>
      {/* Row 1: avatar | name + stars + badge | date + actions */}
      <div className="rv-cardTop">
        <div className="rv-user">
          <div className="rv-avatar">
            {review.user?.profile_image
              ? <img src={`${API_URL}${review.user.profile_image}`} alt="" />
              : initials(name)}
          </div>
          <div className="rv-userInfo">
            <div className="rv-name">{name}</div>
            <div className="rv-rowSmall">
              {/* Stars only shown on top-level reviews, not replies */}
              {review.rating && !isReply && !isEditing && <Stars value={review.rating} size={13} />}
              {review.verified_purchase && (
                <span className="rv-badge rv-badge--verified">✓ Verified</span>
              )}
              {isReply && <span className="rv-replyBadge">Reply</span>}
            </div>
          </div>
        </div>

        <div className="rv-meta">
          <span className="rv-date">{fmtDate(review.created_at || review.createdAt)}</span>
          {/* ✅ Show Edit/Delete for owner OR admin, on BOTH reviews and replies */}
          {canEdit || canDelete ? (
            <div className="rv-ownerBtns">
              {canEdit && (
                <button
                  className="rv-editBtn"
                  onClick={() => isEditing ? cancelEdit() : setIsEditing(true)}
                >
                  {isEditing ? "✕ Cancel" : "Edit"}
                </button>
              )}
              {canDelete && (
                <button className="rv-dangerBtn" onClick={handleDelete}>Delete</button>
              )}
            </div>
          ) : null}
        </div>
      </div>

      {/* Row 2: comment OR inline edit form */}
      {isEditing ? (
        <div className="rv-editForm">
          {/* Rating row — only for top-level reviews, not replies */}
          {!isReply && (
            <div className="rv-editRatingRow">
              <span className="rv-editLabel">Rating</span>
              <Stars value={editRating} interactive onChange={setEditRating} size={20} />
              {editRating > 0 && <span className="rvLabelTag">{LABELS[editRating]}</span>}
            </div>
          )}
          <textarea
            className="rv-replyTextarea"
            value={editComment}
            onChange={(e) => setEditComment(e.target.value)}
            rows={3}
            maxLength={isReply ? 500 : 1000}
            placeholder={isReply ? "Update your reply..." : "Update your review..."}
          />
          <div className="rv-replyChar">{editComment.length}/{isReply ? 500 : 1000}</div>
          <div className="rv-replyActions">
            <button className="rv-replyCancel" onClick={cancelEdit} disabled={editSaving}>Cancel</button>
            <button
              className="rv-replySubmit"
              onClick={handleEdit}
              disabled={editSaving || (!isReply && !editRating) || !editComment.trim()}
            >
              {editSaving ? "Saving…" : "Save Changes"}
            </button>
          </div>
        </div>
      ) : (
        review.comment && <p className="rv-comment">{review.comment}</p>
      )}

      {/* Row 3: images (top-level only) */}
      {!isEditing && !isReply && review.images?.length > 0 && (
        <div className="rv-imgs">
          {review.images.map((img, i) => (
            <img key={i} src={`${API_URL}${img}`} alt="" className="rv-img" />
          ))}
        </div>
      )}

      {/* Row 4: helpful + reply actions */}
      {!isEditing && (
        <div className="rv-actions">
          {/* Helpful only on top-level reviews */}
          {!isReply && (
            <HelpfulBtn
              reviewId={review.review_id}
              count={review.helpful_count || 0}
              marked={review.user_marked_helpful || false}
              isLoggedIn={isLoggedIn}
              onToggle={onRefresh}
            />
          )}
          {/* ✅ Reply button available to all logged-in users, at all depths */}
          {isLoggedIn && (
            <button className="rv-replyBtn" onClick={() => setShowReplyForm((v) => !v)}>
              {showReplyForm ? "Cancel" : "↩ Reply"}
            </button>
          )}
        </div>
      )}

      {/* Reply form */}
      {showReplyForm && (
        <ReplyForm
          reviewId={review.review_id}
          isLoggedIn={isLoggedIn}
          onSubmitted={() => { setShowReplyForm(false); onRefresh?.(); }}
          onCancel={() => setShowReplyForm(false)}
        />
      )}

      {/* Nested replies (recursive) */}
      {review.replies?.length > 0 && (
        <div className="rv-replies">
          {review.replies.map((reply) => (
            <ReviewCard
              key={reply.review_id}
              review={reply}
              currentUser={currentUser}
              isLoggedIn={isLoggedIn}
              depth={Math.min(depth + 1, 2)}
              onRefresh={onRefresh}
              fmtDate={fmtDate}
              initials={initials}
            />
          ))}
        </div>
      )}
    </div>
  );
};

// ── Main Reviews component ───────────────────────────────────────────────────
const Reviews = ({ productId, currentUser, isLoggedIn, canBuy, onStatsChange }) => {
  const toast = useToast();

  const [reviews, setReviews]   = useState([]);
  const [stats, setStats]       = useState({
    totalReviews: 0, averageRating: 0,
    ratingCounts: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
  });
  const [loading, setLoading]   = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving]     = useState(false);
  const [rating, setRating]     = useState(0);
  const [comment, setComment]   = useState("");
  const [images, setImages]     = useState([]);
  const [previews, setPreviews] = useState([]);
  const [lightbox, setLightbox] = useState(null);
  const fileRef = useRef();

  useEffect(() => { load(); }, [productId]); // eslint-disable-line

  const load = async () => {
    try {
      setLoading(true);
      const res = await reviewAPI.getProductReviews(productId);
      const d = res.data.data || {};
      setReviews(d.reviews || []);
      const ns = {
        totalReviews:  d.totalReviews  || 0,
        averageRating: d.averageRating || 0,
        ratingCounts:  d.ratingCounts  || { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
      };
      setStats(ns);
      onStatsChange?.(ns);
    } catch (e) {
      console.error(e);
      toast.error("Failed to load reviews");
    } finally {
      setLoading(false);
    }
  };

  const closeForm = () => {
    setRating(0); setComment("");
    previews.forEach((u) => URL.revokeObjectURL(u));
    setImages([]); setPreviews([]);
    setShowForm(false);
  };

  const pickImages = (e) => {
    const chosen = Array.from(e.target.files || []).slice(0, 3 - images.length);
    setImages((p) => [...p, ...chosen]);
    setPreviews((p) => [...p, ...chosen.map((f) => URL.createObjectURL(f))]);
  };

  const removePreview = (i) => {
    URL.revokeObjectURL(previews[i]);
    setImages((p) => p.filter((_, j) => j !== i));
    setPreviews((p) => p.filter((_, j) => j !== i));
  };

  const submit = async () => {
    if (!rating) { toast.warning("Please select a rating."); return; }
    if (comment && comment.trim().length > 1000) {
      toast.warning("Comment must be under 1000 characters.");
      return;
    }
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append("product_id", productId);
      fd.append("rating", rating);
      if (comment.trim()) fd.append("comment", comment.trim());
      images.forEach((img) => fd.append("images", img));
      await reviewAPI.createReview(fd);
      toast.success("Review posted successfully!");
      closeForm();
      await load();
    } catch (e) {
      toast.error(e.response?.data?.message || "Could not submit review.");
    } finally {
      setSaving(false);
    }
  };

  const fmtDate = (raw) => {
    if (!raw) return "";
    const d = new Date(raw);
    return isNaN(d) ? "" : d.toLocaleDateString("en-GB", { year: "numeric", month: "short", day: "numeric" });
  };

  const initials = (name = "") => {
    const p = name.trim().split(" ").filter(Boolean);
    return ((p[0]?.[0] || "") + (p.length > 1 ? p[p.length - 1][0] : p[0]?.[1] || "")).toUpperCase() || "?";
  };

  const total = stats.totalReviews || 0;

  return (
    <section className="rvWrap">
      {/* HEADER */}
      <div className="rvHeader">
        <div>
          <h2 className="rvTitle">Ratings &amp; Reviews</h2>
          <p className="rvSub">{total === 0 ? "No reviews yet" : `${total} ${total === 1 ? "review" : "reviews"}`}</p>
        </div>
        {canBuy && !showForm && (
          <button className="rvPrimaryBtn" onClick={() => setShowForm(true)}>Write a review</button>
        )}
      </div>

      {!isLoggedIn && (
        <div className="rvHint"><a href="/login">Log in</a> to write a review.</div>
      )}

      {/* SUMMARY */}
      <div className="rvSummary">
        <div className="rvScoreCard">
          <div className="rvScoreTop">
            <div className="rvScoreNum">{stats.averageRating > 0 ? stats.averageRating.toFixed(1) : "—"}</div>
            <div className="rvScoreRight">
              <Stars value={Math.round(stats.averageRating)} size={20} />
              <div className="rvScoreMeta">{total} ratings</div>
            </div>
          </div>
        </div>
        <div className="rvBarsCard">
          {[5, 4, 3, 2, 1].map((s) => {
            const c = stats.ratingCounts?.[s] || 0;
            const w = total ? (c / total) * 100 : 0;
            return (
              <div className="rvBarRow" key={s}>
                <span className="rvBarLeft">{s}</span>
                <div className="rvBarTrack"><div className="rvBarFill" style={{ width: `${w}%` }} /></div>
                <span className="rvBarCount">{c}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* WRITE REVIEW FORM */}
      {showForm && (
        <div className="rvForm">
          <div className="rvFormHead">
            <h3>Write a Review</h3>
            <button className="rvGhostBtn" onClick={closeForm}>×</button>
          </div>
          <div className="rvField">
            <label>Your rating <span className="rvReq">*</span></label>
            <div className="rvFieldRow">
              <Stars value={rating} interactive onChange={setRating} size={32} />
              {rating > 0 && <span className="rvLabelTag">{LABELS[rating]}</span>}
            </div>
          </div>
          <div className="rvField">
            <label>Comment <span className="rvOpt">(optional)</span></label>
            <textarea
              className="rvTextarea" rows={4} value={comment}
              onChange={(e) => setComment(e.target.value)}
              maxLength={1000} placeholder="Share your experience..."
            />
            <div className="rvChar">{comment.length}/1000</div>
          </div>
          <div className="rvField">
            <label>Photos <span className="rvOpt">(up to 3)</span></label>
            <div className="rvPhotos">
              {previews.map((url, i) => (
                <div className="rvPhoto" key={url}>
                  <img src={url} alt="" />
                  <button className="rvPhotoRm" onClick={() => removePreview(i)}>×</button>
                </div>
              ))}
              {images.length < 3 && (
                <button className="rvPhotoAdd" type="button" onClick={() => fileRef.current?.click()}>+ Add photo</button>
              )}
              <input ref={fileRef} type="file" accept="image/*" multiple hidden onChange={pickImages} />
            </div>
          </div>
          <div className="rvFormActions">
            <button className="rvSecondaryBtn" onClick={closeForm} disabled={saving}>Cancel</button>
            <button className="rvPrimaryBtn" onClick={submit} disabled={saving || !rating}>
              {saving ? "Posting…" : "Post Review"}
            </button>
          </div>
        </div>
      )}

      {/* REVIEW LIST */}
      {loading ? (
        <div className="rvState">Loading reviews…</div>
      ) : reviews.length === 0 ? (
        <div className="rvEmpty">
          <div className="rvEmptyIcon">🗨️</div>
          <div className="rvEmptyTitle">No reviews yet</div>
          <div className="rvEmptyText">Be the first to share your experience.</div>
        </div>
      ) : (
        <div className="rvList">
          <div className="rvListLabel">Product Reviews</div>
          {reviews.map((r) => (
            <ReviewCard
              key={r.review_id}
              review={r}
              currentUser={currentUser}
              isLoggedIn={isLoggedIn}
              depth={0}
              onRefresh={load}
              fmtDate={fmtDate}
              initials={initials}
            />
          ))}
        </div>
      )}

      {/* LIGHTBOX */}
      {lightbox && (
        <div className="rvLightbox" onClick={() => setLightbox(null)}>
          <button className="rvLightboxX">×</button>
          <img src={lightbox} className="rvLightboxImg" alt="" />
        </div>
      )}
    </section>
  );
};

export default Reviews;