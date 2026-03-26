import React from 'react';
import './ConfirmModal.css';

const ConfirmModal = ({
  isOpen,
  title,
  message,
  confirmText = 'Confirm',
  cancelText  = 'Cancel',
  confirmVariant = 'danger',
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null;

  return (
    <div className="cm-overlay" onClick={onCancel}>
      <div className="cm-box" onClick={(e) => e.stopPropagation()}>

        {/* Icon */}
        <div className={`cm-icon-wrap cm-icon-${confirmVariant}`}>
          {confirmVariant === 'danger' ? (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
              <path d="M10 11v6M14 11v6" />
              <path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
          )}
        </div>

        <h3 className="cm-title">{title || 'Are you sure?'}</h3>
        {message && <p className="cm-message">{message}</p>}

        <div className="cm-actions">
          <button className="cm-btn cm-cancel" onClick={onCancel}>{cancelText}</button>
          <button className={`cm-btn cm-confirm cm-${confirmVariant}`} onClick={onConfirm}>{confirmText}</button>
        </div>

      </div>
    </div>
  );
};

export default ConfirmModal;