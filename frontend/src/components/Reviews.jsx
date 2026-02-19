import React, { useEffect, useRef, useState } from "react";
import { reviewAPI } from "../api/axios";
import "../styles/Reviews.css";

const API_URL = "http://localhost:5000";

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
    <div className="rv-stars" role={interactive ? "radiogroup" : "img"} aria-label={`Rating ${value} out of 5`}>
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

const Reviews = ({ productId, currentUser, isLoggedIn, canBuy, onStatsChange }) => {
  const [reviews, setReviews]   = useState([]);
  const [stats, setStats]       = useState({ totalReviews: 0, averageRating: 0, ratingCounts: { 5:0,4:0,3:0,2:0,1:0 } });
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
        ratingCounts:  d.ratingCounts  || { 5:0,4:0,3:0,2:0,1:0 },
      };
      setStats(ns);
      onStatsChange?.(ns);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const closeForm = () => {
    setRating(0); setComment("");
    previews.forEach(u => URL.revokeObjectURL(u));
    setImages([]); setPreviews([]); setShowForm(false);
  };

  const pickImages = (e) => {
    const chosen = Array.from(e.target.files || []).slice(0, 3 - images.length);
    setImages(p  => [...p, ...chosen]);
    setPreviews(p => [...p, ...chosen.map(f => URL.createObjectURL(f))]);
  };

  const removePreview = (i) => {
    URL.revokeObjectURL(previews[i]);
    setImages(p   => p.filter((_,j)  => j !== i));
    setPreviews(p => p.filter((_,j)  => j !== i));
  };

  const submit = async () => {
    if (!rating) return alert("Please select a rating.");
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append("product_id", productId);
      fd.append("rating", rating);
      if (comment.trim()) fd.append("comment", comment.trim());
      images.forEach(img => fd.append("images", img));
      await reviewAPI.createReview(fd);
      closeForm(); await load();
    } catch (e) {
      alert(e.response?.data?.message || "Could not submit review.");
    } finally { setSaving(false); }
  };

  const removeReview = async (id) => {
    if (!window.confirm("Delete this review?")) return;
    try { await reviewAPI.deleteReview(id); await load(); }
    catch { alert("Could not delete."); }
  };

  const fmtDate = (raw) => {
    if (!raw) return "";
    const d = new Date(raw);
    return isNaN(d) ? "" : d.toLocaleDateString("en-US", { year:"numeric", month:"short", day:"numeric" });
  };

  const initials = (name = "") => {
    const p = name.trim().split(" ").filter(Boolean);
    return ((p[0]?.[0] || "") + (p.length > 1 ? p[p.length-1][0] : p[0]?.[1] || "")).toUpperCase() || "?";
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

        {/* Left: big score */}
        <div className="rvScoreCard">
          <div className="rvScoreTop">
            <div className="rvScoreNum">
              {stats.averageRating > 0 ? stats.averageRating.toFixed(1) : "—"}
            </div>
            <div className="rvScoreRight">
              <Stars value={Math.round(stats.averageRating)} size={20} />
              <div className="rvScoreMeta">{total} ratings</div>
            </div>
          </div>
        </div>

        {/* Right: single-column bars */}
        <div className="rvBarsCard">
          {[5, 4, 3, 2, 1].map((s) => {
            const c = stats.ratingCounts?.[s] || 0;
            const w = total ? (c / total) * 100 : 0;
            return (
              <div className="rvBarRow" key={s}>
                <span className="rvBarLeft">{s}</span>
                <div className="rvBarTrack">
                  <div className="rvBarFill" style={{ width: `${w}%` }} />
                </div>
                <span className="rvBarCount">{c}</span>
              </div>
            );
          })}
        </div>

      </div>

      {/* WRITE FORM */}
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
              className="rvTextarea" rows={4}
              value={comment} onChange={e => setComment(e.target.value)}
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
                <button className="rvPhotoAdd" type="button" onClick={() => fileRef.current?.click()}>
                  + Add photo
                </button>
              )}
              <input ref={fileRef} type="file" accept="image/*" multiple hidden onChange={pickImages} />
            </div>
          </div>

          <div className="rvFormActions">
            <button className="rvSecondaryBtn" onClick={closeForm} disabled={saving}>Cancel</button>
            <button className="rvPrimaryBtn"   onClick={submit}    disabled={saving || !rating}>
              {saving ? "Posting…" : "Post Review"}
            </button>
          </div>
        </div>
      )}

      {/* LIST */}
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
          {reviews.map((r) => {
            const name = r.user?.full_name || "Anonymous";
            return (
              <div className="rvCard" key={r.review_id}>

                <div className="rvCardTop">
                  <div className="rvUser">
                    <div className="rvAvatar">
                      {r.user?.profile_image
                        ? <img src={`${API_URL}${r.user.profile_image}`} alt="" />
                        : initials(name)}
                    </div>
                    <div>
                      <div className="rvName">{name}</div>
                      <div className="rvRowSmall">
                        <Stars value={r.rating} size={13} />
                        {r.verified_purchase && <span className="rvBadge">✓ Verified</span>}
                      </div>
                    </div>
                  </div>

                  <div className="rvMeta">
                    <span className="rvDate">{fmtDate(r.created_at)}</span>
                    {currentUser?.user_id === r.user_id && (
                      <button className="rvDangerBtn" onClick={() => removeReview(r.review_id)}>Delete</button>
                    )}
                  </div>
                </div>

                {r.comment && <p className="rvComment">{r.comment}</p>}

                {r.images?.length > 0 && (
                  <div className="rvImgs">
                    {r.images.map((img, i) => (
                      <img key={i} src={`${API_URL}${img}`} alt="" className="rvImg"
                           onClick={() => setLightbox(`${API_URL}${img}`)} />
                    ))}
                  </div>
                )}

              </div>
            );
          })}
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