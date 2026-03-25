import React, { useState, useEffect, useRef } from "react";
import "./SharedComponents.css";

// ─────────────────────────────────────────────────────────────
// 1. PAGINATION
// ─────────────────────────────────────────────────────────────
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
      >←</button>

      {buildPages().map((p, i) =>
        p === "…" ? (
          <span key={`el-${i}`} className="sc-ellipsis">…</span>
        ) : (
          <button
            key={p}
            className={`sc-page-btn ${currentPage === p ? "sc-page-btn-active" : ""}`}
            onClick={() => onPageChange(p)}
            aria-label={`Page ${p}`}
            aria-current={currentPage === p ? "page" : undefined}
          >{p}</button>
        )
      )}

      <button
        className={`sc-page-btn ${currentPage === totalPages ? "sc-page-btn-disabled" : ""}`}
        onClick={() => currentPage < totalPages && onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        aria-label="Next page"
      >→</button>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
// 2. FILTER BAR
// ─────────────────────────────────────────────────────────────
export const FilterBar = ({ filters = [], active, onChange, theme = "seller" }) => {
  const isAdmin = theme === "admin";

  return (
    <div className={`sc-filter-bar ${isAdmin ? "sc-filter-bar-admin" : "sc-filter-bar-seller"}`}>
      {filters.map((f) => {
        const isActive = active === f.key;
        const label = f.count !== undefined ? `${f.label} (${f.count})` : f.label;
        return (
          <button
            key={f.key}
            className={`sc-filter-chip ${isActive ? "sc-filter-chip-active" : ""}`}
            onClick={() => onChange(f.key)}
            aria-pressed={isActive}
          >{label}</button>
        );
      })}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
// 3. SEARCH INPUT (debounced)
// ─────────────────────────────────────────────────────────────
export const SearchInput = ({
  value: externalValue,
  onChange,
  placeholder = "Search…",
  debounce: debounceMs = 350,
  theme = "seller",
  style: wrapperStyle = {},
}) => {
  const isAdmin  = theme === "admin";
  const [local, setLocal] = useState(externalValue || "");
  const timerRef = useRef(null);

  useEffect(() => { setLocal(externalValue || ""); }, [externalValue]);

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
      <svg className="sc-search-icon" width="14" height="14" viewBox="0 0 24 24"
        fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
      </svg>
      <input
        type="text"
        className="sc-search-input"
        value={local}
        onChange={handleChange}
        placeholder={placeholder}
      />
      {local && (
        <button className="sc-search-clear" onClick={handleClear} aria-label="Clear search">×</button>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
// 4. DATE RANGE PICKER  ← NEW
// Props:
//   startDate  string  "YYYY-MM-DD" or ""
//   endDate    string  "YYYY-MM-DD" or ""
//   onChange   ({ startDate, endDate }) => void
//   theme      "admin" | "seller"
//   label      string  (optional label above)
// ─────────────────────────────────────────────────────────────
export const DateRangePicker = ({
  startDate = "",
  endDate   = "",
  onChange,
  theme     = "seller",
  label     = "Date Range",
}) => {
  const isAdmin = theme === "admin";

  const handleStart = (e) => {
    const val = e.target.value;
    // Don't allow start > end
    if (endDate && val > endDate) {
      onChange({ startDate: val, endDate: val });
    } else {
      onChange({ startDate: val, endDate });
    }
  };

  const handleEnd = (e) => {
    const val = e.target.value;
    if (startDate && val < startDate) {
      onChange({ startDate: val, endDate: val });
    } else {
      onChange({ startDate, endDate: val });
    }
  };

  const handleClear = () => onChange({ startDate: "", endDate: "" });

  const hasValue = startDate || endDate;

  return (
    <div className={`sc-daterange ${isAdmin ? "sc-daterange-admin" : "sc-daterange-seller"}`}>
      {label && <span className="sc-daterange-label">{label}</span>}
      <div className="sc-daterange-inputs">
        <div className="sc-daterange-field">
          <span className="sc-daterange-fieldlabel">From</span>
          <input
            type="date"
            className="sc-daterange-input"
            value={startDate}
            onChange={handleStart}
            max={endDate || undefined}
          />
        </div>
        <span className="sc-daterange-sep">→</span>
        <div className="sc-daterange-field">
          <span className="sc-daterange-fieldlabel">To</span>
          <input
            type="date"
            className="sc-daterange-input"
            value={endDate}
            onChange={handleEnd}
            min={startDate || undefined}
          />
        </div>
        {hasValue && (
          <button className="sc-daterange-clear" onClick={handleClear} title="Clear dates">
            ×
          </button>
        )}
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
// 5. SORT SELECT  ← NEW
// Props:
//   options  Array<{ value: string, label: string }>
//   value    string
//   onChange (value: string) => void
//   theme    "admin" | "seller"
// ─────────────────────────────────────────────────────────────
export const SortSelect = ({ options = [], value, onChange, theme = "seller" }) => {
  const isAdmin = theme === "admin";

  return (
    <div className={`sc-sort ${isAdmin ? "sc-sort-admin" : "sc-sort-seller"}`}>
      <svg className="sc-sort-icon" width="13" height="13" viewBox="0 0 24 24"
        fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="3" y1="6" x2="21" y2="6"/>
        <line x1="3" y1="12" x2="15" y2="12"/>
        <line x1="3" y1="18" x2="9" y2="18"/>
      </svg>
      <select
        className="sc-sort-select"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-label="Sort by"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
// HELPER: apply date range filter on an array of items
// Usage: filterByDateRange(items, "created_at", startDate, endDate)
// ─────────────────────────────────────────────────────────────
export const filterByDateRange = (items, dateField, startDate, endDate) => {
  if (!startDate && !endDate) return items;
  return items.filter((item) => {
    const raw = item[dateField] || item.createdAt || item.created_at;
    if (!raw) return true;
    const d = new Date(raw);
    if (startDate && d < new Date(startDate + "T00:00:00")) return false;
    if (endDate   && d > new Date(endDate   + "T23:59:59")) return false;
    return true;
  });
};