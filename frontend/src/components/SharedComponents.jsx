import React, { useState, useEffect, useRef } from "react";
import "./SharedComponents.css";

export const Pagination = ({ currentPage, totalPages, onPageChange, theme = "seller" }) => {
  if (!totalPages || totalPages <= 1) return null;

  const isAdmin = theme === "admin";

  const buildPages = () => {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
    const pages = [1];
    if (currentPage > 3) pages.push("…");
    const start = Math.max(2, currentPage - 1);
    const end   = Math.min(totalPages - 1, currentPage + 1);
    for (let i = start; i <= end; i++) pages.push(i);
    if (currentPage < totalPages - 2) pages.push("…");
    pages.push(totalPages);
    return pages;
  };

  return (
    <div className={`sc-pagination ${isAdmin ? "sc-pagination-admin" : "sc-pagination-seller"}`}>
      <button
        className={`sc-page-btn ${currentPage === 1 ? "sc-page-btn-disabled" : ""}`}
        onClick={() => currentPage > 1 && onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        aria-label="Previous page"
      >
        ←
      </button>

      {buildPages().map((p, i) =>
        p === "…" ? (
          <span key={`ellipsis-${i}`} className="sc-ellipsis">…</span>
        ) : (
          <button
            key={p}
            className={`sc-page-btn ${currentPage === p ? "sc-page-btn-active" : ""}`}
            onClick={() => onPageChange(p)}
            aria-label={`Page ${p}`}
            aria-current={currentPage === p ? "page" : undefined}
          >
            {p}
          </button>
        )
      )}

      <button
        className={`sc-page-btn ${currentPage === totalPages ? "sc-page-btn-disabled" : ""}`}
        onClick={() => currentPage < totalPages && onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        aria-label="Next page"
      >
        →
      </button>
    </div>
  );
};


export const FilterBar = ({ filters = [], active, onChange, theme = "seller" }) => {
  const isAdmin = theme === "admin";

  return (
    <div className={`sc-filter-bar ${isAdmin ? "sc-filter-bar-admin" : "sc-filter-bar-seller"}`}>
      {filters.map((f) => {
        const isActive = active === f.key;
        const label    = f.count !== undefined ? `${f.label} (${f.count})` : f.label;
        return (
          <button
            key={f.key}
            className={`sc-filter-chip ${isActive ? "sc-filter-chip-active" : ""}`}
            onClick={() => onChange(f.key)}
            aria-pressed={isActive}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
};


export const SearchInput = ({
  value: externalValue,
  onChange,
  placeholder = "Search…",
  debounce: debounceMs = 350,
  theme = "seller",
  style: wrapperStyle = {},
}) => {
  const isAdmin = theme === "admin";

  const [local, setLocal] = useState(externalValue || "");
  const timerRef = useRef(null);

  useEffect(() => {
    setLocal(externalValue || "");
  }, [externalValue]);

  const handleChange = (e) => {
    const val = e.target.value;
    setLocal(val);
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => onChange(val), debounceMs);
  };

  const handleClear = () => {
    setLocal("");
    clearTimeout(timerRef.current);
    onChange("");
  };

  useEffect(() => () => clearTimeout(timerRef.current), []);

  return (
    <div
      className={`sc-search-wrap ${isAdmin ? "sc-search-admin" : "sc-search-seller"}`}
      style={wrapperStyle}
    >
      <svg
        className="sc-search-icon"
        width="14" height="14"
        viewBox="0 0 24 24"
        fill="none" stroke="currentColor"
        strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"
      >
        <circle cx="11" cy="11" r="8"/>
        <line x1="21" y1="21" x2="16.65" y2="16.65"/>
      </svg>

      <input
        type="text"
        className="sc-search-input"
        value={local}
        onChange={handleChange}
        placeholder={placeholder}
      />

      {local && (
        <button
          className="sc-search-clear"
          onClick={handleClear}
          aria-label="Clear search"
        >
          ×
        </button>
      )}
    </div>
  );
};