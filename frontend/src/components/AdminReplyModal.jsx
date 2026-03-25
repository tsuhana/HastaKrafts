

import React, { useState, useEffect, useRef } from "react";
import "./AdminReplyModal.css";

const MAX_CHARS = 5000;

const AdminReplyModal = ({ isOpen, contact, onClose, onSend }) => {
  const [reply, setReply]     = useState("");
  const [sending, setSending] = useState(false);
  const textareaRef           = useRef(null);

  // Pre-fill with existing reply when modal opens
  useEffect(() => {
    if (isOpen) {
      setReply(contact?.admin_reply || "");
      setSending(false);
      setTimeout(() => textareaRef.current?.focus(), 80);
    }
  }, [isOpen, contact]);

  if (!isOpen || !contact) return null;

  const handleSend = async () => {
    const trimmed = reply.trim();
    if (!trimmed || trimmed.length > MAX_CHARS) return;
    setSending(true);
    await onSend(contact.contact_id, trimmed);
    setSending(false);
    onClose();
  };

  const handleKeyDown = (e) => {
    if (e.key === "Escape") onClose();
  };

  const charCount  = reply.length;
  const isOverMax  = charCount > MAX_CHARS;
  const canSend    = reply.trim().length > 0 && !isOverMax && !sending;
  const isEditing  = Boolean(contact.admin_reply);

  return (
    <div
      className="arm-overlay"
      onClick={onClose}
      onKeyDown={handleKeyDown}
      role="dialog"
      aria-modal="true"
      aria-label="Reply to contact message"
    >
      <div
        className="arm-modal"
        onClick={(e) => e.stopPropagation()}
      >

        {/* ── Header ── */}
        <div className="arm-header">
          <div className="arm-header-info">
            <h3 className="arm-title">
              Reply to {contact.name}
              {isEditing && <span className="arm-editing-badge">Editing reply</span>}
            </h3>
            <p className="arm-subtitle">
              <span className="arm-email">{contact.email}</span>
              <span className="arm-dot">·</span>
              <span className="arm-subject">{contact.subject}</span>
            </p>
          </div>
          <button
            className="arm-close-btn"
            onClick={onClose}
            aria-label="Close modal"
          >
            ×
          </button>
        </div>

        {/* ── Original message preview ── */}
        <div className="arm-original">
          <span className="arm-original-label">Their message</span>
          <p className="arm-original-text">{contact.message}</p>
        </div>

        {/* ── Reply textarea ── */}
        <div className="arm-reply-section">
          <label className="arm-reply-label">
            Your reply
          </label>
          <textarea
            ref={textareaRef}
            className={`arm-textarea ${isOverMax ? "arm-textarea-error" : ""}`}
            value={reply}
            onChange={(e) => setReply(e.target.value)}
            placeholder="Write your reply here. The user will receive this by email…"
            rows={6}
          />
          <div className="arm-textarea-footer">
            <span className="arm-email-hint">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ verticalAlign: "middle", marginRight: 4 }}>
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                <polyline points="22,6 12,13 2,6"/>
              </svg>
              User will receive this as an email
            </span>
            <span className={`arm-char-count ${isOverMax ? "arm-char-over" : ""}`}>
              {charCount.toLocaleString()}/{MAX_CHARS.toLocaleString()}
            </span>
          </div>
        </div>

        {/* ── Actions ── */}
        <div className="arm-actions">
          <button className="arm-btn-cancel" onClick={onClose}>
            Cancel
          </button>
          <button
            className={`arm-btn-send ${!canSend ? "arm-btn-send-disabled" : ""}`}
            onClick={handleSend}
            disabled={!canSend}
          >
            {sending ? (
              <span className="arm-sending-row">
                <span className="arm-spinner" />
                Sending…
              </span>
            ) : (
              <>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 5 }}>
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                  <polyline points="22,6 12,13 2,6"/>
                </svg>
                Send Reply
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
};

export default AdminReplyModal;