import React, { useEffect, useMemo, useState } from "react";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import { adminAPI, productAPI } from "../api/axios";
import { useToast } from "../context/ToastContext";
import ConfirmModal from "../components/ConfirmModal";
import {
  Pagination, FilterBar, SearchInput, DateRangePicker, SortSelect, filterByDateRange,
} from "../components/SharedComponents";
import "../styles/AdminDashboard.css";

/* ─── Icons ─── */
const Icons = {
  grid:     <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></svg>,
  shield:   <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L3 7v5c0 5.25 3.75 10.15 9 11.35C17.25 22.15 21 17.25 21 12V7l-9-5z"/></svg>,
  box:      <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>,
  star:     <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>,
  image:    <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>,
  mail:     <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>,
  users:    <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>,
  store:    <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>,
  orders:   <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="1"/><line x1="9" y1="12" x2="15" y2="12"/><line x1="9" y1="16" x2="13" y2="16"/></svg>,
  products: <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/></svg>,
  reviews:  <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>,
  refresh:  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 11-2.12-9.36L23 10"/></svg>,
  trending: <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>,
  rupee:    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><line x1="6" y1="4" x2="18" y2="4"/><line x1="6" y1="9" x2="18" y2="9"/><path d="M6 14l6 6 6-6"/><path d="M6 9c0 3.314 2.686 5 6 5s6-1.686 6-5"/></svg>,
  pkg:      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/></svg>,
  usersLg:  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>,
  storeLg:  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>,
  auction:  <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2.5l7 7-7 7"/><path d="M9.5 7.5L2.5 14.5"/><path d="M6 21h12"/><path d="M12 17v4"/></svg>,
};

/* ─── Helpers ─── */
const API_URL = "http://localhost:5000";
const PER_PAGE = 15;
const DONUT_COLORS_PRODUCT = ["#2a9e6a", "#c08830", "#aa2c1c"];
const DONUT_COLORS_ORDER   = ["#c08830", "#1a509a", "#2a9e6a", "#aa2c1c", "#b86e38"];

const parseAnyDate = (raw) => {
  if (!raw) return null;
  const d = new Date(raw);
  return isNaN(d.getTime()) ? null : d;
};

const fmtDate = (val) => {
  const d = parseAnyDate(val);
  if (!d) return "—";
  return d.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
};

const fmtDateTime = (val) => {
  const d = parseAnyDate(val);
  if (!d) return "—";
  return d.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" }) +
    " " + d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
};

const getDate = (obj) => obj?.created_at || obj?.createdAt || obj?.auction_start || obj?.date || null;

const timeAgo = (obj) => {
  const d = parseAnyDate(getDate(obj));
  if (!d) return "—";
  const days = Math.floor((Date.now() - d) / 86_400_000);
  if (days <= 0) return "Today";
  if (days === 1) return "1 day ago";
  return `${days} days ago`;
};

const safe = (v) => { if (v == null) return "—"; const s = String(v).trim(); return s || "—"; };
const fmtAmount = (v) => `Rs. ${Math.round(parseFloat(v) || 0).toLocaleString()}`;
const initials = (name) => {
  const parts = (name || "").trim().split(" ").filter(Boolean);
  if (!parts.length) return "?";
  return ((parts[0][0] || "") + (parts.length > 1 ? parts[parts.length - 1][0] : parts[0][1] || "")).toUpperCase() || "?";
};

/* ─── Sub-components ─── */
// cx/cy come from Recharts as numbers (not strings) when used inside <Pie> label
// but when passed as props from outside they can be strings — parse defensively
const DonutLabel = ({ cx, cy, value, label }) => {
  const x = parseFloat(cx) || 0;
  const y = parseFloat(cy) || 0;
  return (
    <g>
      <text x={x} y={y - 8} textAnchor="middle" fill="var(--text-1)" fontSize="24" fontWeight="800" fontFamily="inherit">{value}</text>
      <text x={x} y={y + 14} textAnchor="middle" fill="var(--text-3)" fontSize="10" fontWeight="600" fontFamily="inherit" letterSpacing="0.05em">{label}</text>
    </g>
  );
};

const ChartTooltip = ({ active, payload, label, prefix = "" }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 8, padding: "8px 12px", fontSize: "0.75rem", boxShadow: "0 4px 16px rgba(0,0,0,0.10)" }}>
      <p style={{ color: "var(--text-3)", marginBottom: 4, fontWeight: 600 }}>{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color, fontWeight: 700 }}>
          {p.name}: {prefix}{typeof p.value === "number" ? p.value.toLocaleString() : p.value}
        </p>
      ))}
    </div>
  );
};

const KpiCard = ({ icon, label, value, sub, accent, trend }) => (
  <div className="kpi-card" style={{ "--kpi-accent": accent }}>
    <div className="kpi-icon-wrap">{icon}</div>
    <div className="kpi-body">
      <div className="kpi-label">{label}</div>
      <div className="kpi-value">{value}</div>
      {sub && <div className="kpi-sub">{sub}</div>}
    </div>
    {trend !== undefined && (
      <div className={`kpi-trend ${trend >= 0 ? "kpi-trend-up" : "kpi-trend-down"}`}>
        {trend >= 0 ? "▲" : "▼"} {Math.abs(trend)}%
      </div>
    )}
  </div>
);

const PriceCell = ({ product }) => {
  const hasDiscount = product.has_discount === true || product.has_discount === "true";
  const pct = parseInt(product.discount_percentage) || 0;
  const original = parseFloat(product.price);
  if (hasDiscount && pct > 0) {
    const discounted = Math.round(original * (1 - pct / 100));
    return (
      <div className="price-wrap">
        <span className="price-original">Rs. {original.toLocaleString()}</span>
        <span className="price-discounted">Rs. {discounted.toLocaleString()}</span>
      </div>
    );
  }
  return <span className="price-normal">Rs. {original.toLocaleString()}</span>;
};

const DiscountCell = ({ product }) => {
  const hasDiscount = product.has_discount === true || product.has_discount === "true";
  const pct = parseInt(product.discount_percentage) || 0;
  if (hasDiscount && pct > 0) return <span className="discount-badge">−{pct}%</span>;
  return <span style={{ color: "var(--text-3)", fontSize: "0.72rem" }}>—</span>;
};

const ProductImg = ({ src, alt }) => {
  if (src) return <img className="td-img" src={src} alt={alt} onError={(e) => { e.currentTarget.style.display = "none"; }} />;
  return <div className="td-img-placeholder">No img</div>;
};

const StarRating = ({ rating }) => {
  const r = parseInt(rating) || 0;
  return (
    <div style={{ display: "flex", gap: 1, alignItems: "center" }}>
      {[1,2,3,4,5].map((s) => (
        <span key={s} style={{ fontSize: "0.75rem", color: s <= r ? "#c08830" : "#ddd5c4" }}>★</span>
      ))}
      <span style={{ fontSize: "0.68rem", color: "var(--text-3)", marginLeft: 3 }}>{r}/5</span>
    </div>
  );
};

const RejectModal = ({ isOpen, title, onConfirm, onCancel }) => {
  const [reason, setReason] = useState("");
  useEffect(() => { if (isOpen) setReason(""); }, [isOpen]);
  if (!isOpen) return null;
  return (
    <div className="cm-overlay" onClick={onCancel}>
      <div className="cm-box" onClick={(e) => e.stopPropagation()}>
        <div className="cm-icon-wrap cm-icon-warning">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
        </div>
        <h3 className="cm-title">{title || "Rejection Reason"}</h3>
        <p className="cm-message">Please provide a reason. This will be shared with the applicant.</p>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Enter rejection reason…"
          rows={3}
          style={{ width: "100%", padding: "0.6rem 0.75rem", borderRadius: 10, border: "1.5px solid #e5e7eb", fontSize: "0.875rem", resize: "vertical", marginBottom: "1.2rem", fontFamily: "inherit", outline: "none", boxSizing: "border-box" }}
          onFocus={(e) => (e.target.style.borderColor = "#f59e0b")}
          onBlur={(e)  => (e.target.style.borderColor = "#e5e7eb")}
          autoFocus
        />
        <div className="cm-actions">
          <button className="cm-btn cm-cancel" onClick={onCancel}>Cancel</button>
          <button
            className="cm-btn cm-confirm cm-warning"
            onClick={() => { if (reason.trim()) onConfirm(reason.trim()); }}
            disabled={!reason.trim()}
            style={{ opacity: reason.trim() ? 1 : 0.5, cursor: reason.trim() ? "pointer" : "not-allowed" }}
          >Reject</button>
        </div>
      </div>
    </div>
  );
};

const ReplyModal = ({ isOpen, contact, onClose, onSend }) => {
  const [reply, setReply]     = useState("");
  const [sending, setSending] = useState(false);
  useEffect(() => { if (isOpen) { setReply(contact?.admin_reply || ""); setSending(false); } }, [isOpen, contact]);
  if (!isOpen || !contact) return null;
  const canSend = reply.trim().length > 0 && !sending;
  const handleSend = async () => {
    if (!canSend) return;
    setSending(true);
    await onSend(contact.contact_id, reply.trim());
    setSending(false);
    onClose();
  };
  return (
    <div className="cm-overlay" onClick={onClose}>
      <div className="cm-box" style={{ maxWidth: 520 }} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
          <div>
            <h3 className="cm-title" style={{ marginBottom: 4 }}>Reply to {contact.name}</h3>
            <p style={{ fontSize: "0.72rem", color: "var(--text-3)", margin: 0 }}>{contact.email} · {contact.subject}</p>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: "1.3rem", cursor: "pointer", color: "var(--text-3)", lineHeight: 1 }}>×</button>
        </div>
        <div style={{ background: "var(--bg)", border: "1px solid var(--border-light)", borderRadius: 8, padding: "10px 12px", marginBottom: 14, fontSize: "0.78rem", color: "var(--text-2)", lineHeight: 1.6 }}>
          <div style={{ fontSize: "0.6rem", fontWeight: 700, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 5 }}>Their message</div>
          {contact.message}
        </div>
        <div style={{ marginBottom: 14 }}>
          <label style={{ display: "block", fontSize: "0.65rem", fontWeight: 700, color: "var(--text-2)", marginBottom: 5, textTransform: "uppercase", letterSpacing: "0.06em" }}>Your reply (sent via email)</label>
          <textarea
            value={reply}
            onChange={(e) => setReply(e.target.value)}
            rows={5}
            autoFocus
            placeholder="Write your reply here…"
            style={{ width: "100%", padding: "0.65rem 0.8rem", borderRadius: 8, border: "1.5px solid var(--border)", fontSize: "0.84rem", fontFamily: "inherit", resize: "vertical", outline: "none", boxSizing: "border-box", background: "var(--bg)", color: "var(--text-1)" }}
            onFocus={(e) => (e.target.style.borderColor = "var(--accent)")}
            onBlur={(e)  => (e.target.style.borderColor = "var(--border)")}
          />
        </div>
        <div className="cm-actions">
          <button className="cm-btn cm-cancel" onClick={onClose}>Cancel</button>
          <button
            className="cm-btn cm-confirm"
            onClick={handleSend}
            disabled={!canSend}
            style={{ opacity: canSend ? 1 : 0.5, cursor: canSend ? "pointer" : "not-allowed", background: "var(--accent)", color: "#fff", border: "none" }}
          >
            {sending ? "Sending…" : "Send Reply"}
          </button>
        </div>
      </div>
    </div>
  );
};

/* ════════════════════ MAIN ════════════════════ */
const AdminDashboard = () => {
  const toast = useToast();
  const [activeTab, setActiveTab]               = useState("overview");
  const [loading, setLoading]                   = useState(true);
  const [analyticsLoading, setAnalyticsLoading] = useState(true);
  const [msgFilter, setMsgFilter]               = useState("all");
  const [uploadingBanner, setUploadingBanner]   = useState(false);
  const [revenueView, setRevenueView]           = useState("weekly");

  /* ── Data ── */
  const [stats, setStats]             = useState({ totalUsers: 0, totalSellersUsers: 0, totalBuyers: 0, totalSellerProfiles: 0, pendingSellers: 0, approvedSellers: 0, totalProducts: 0, pendingProducts: 0, approvedProducts: 0, rejectedProducts: 0 });
  const [analytics, setAnalytics]     = useState({ dailySales: [], monthlySales: [], productDonut: [], orderDonut: [], topCategories: [], topSellers: [], summary: { totalRevenue: 0, thisMonthRevenue: 0, totalOrders: 0 } });
  const [pendingSellers, setPendingSellers]   = useState([]);
  const [pendingProducts, setPendingProducts] = useState([]);
  const [allProducts, setAllProducts]         = useState([]);
  const [allOrders, setAllOrders]             = useState([]);
  const [allUsers, setAllUsers]               = useState([]);
  const [allSellers, setAllSellers]           = useState([]);
  const [allReviews, setAllReviews]           = useState([]);
  const [allAuctions, setAllAuctions]         = useState([]);
  const [banners, setBanners]                 = useState([]);
  const [contactMessages, setContactMessages] = useState([]);

  /* ── Modals ── */
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, type: null, id: null });
  const [rejectModal, setRejectModal]   = useState({ isOpen: false, type: null, id: null });
  const [replyModal, setReplyModal]     = useState({ isOpen: false, contact: null });
  const [contactSearch, setContactSearch] = useState("");
  const [contactDate, setContactDate]     = useState({ startDate: "", endDate: "" });

  /* ── Tab filter/sort/page state ── */
  const [orderSearch, setOrderSearch]       = useState("");
  const [orderFilter, setOrderFilter]       = useState("all");
  const [orderPayFilter, setOrderPayFilter] = useState("all");
  const [orderDate, setOrderDate]           = useState({ startDate: "", endDate: "" });
  const [orderSort, setOrderSort]           = useState("newest");
  const [orderPage, setOrderPage]           = useState(1);

  const [prodSearch, setProdSearch] = useState("");
  const [prodFilter, setProdFilter] = useState("all");
  const [prodSort, setProdSort]     = useState("newest");
  const [prodPage, setProdPage]     = useState(1);

  const [featPage, setFeatPage]     = useState(1);
  const [featSearch, setFeatSearch] = useState("");
  const FEAT_PER_PAGE = 15;

  const [userSearch, setUserSearch] = useState("");
  const [userFilter, setUserFilter] = useState("all");
  const [userSort, setUserSort]     = useState("newest");
  const [userPage, setUserPage]     = useState(1);

  const [sellerSearch, setSellerSearch] = useState("");
  const [sellerFilter, setSellerFilter] = useState("all");
  const [sellerSort, setSellerSort]     = useState("newest");
  const [sellerPage, setSellerPage]     = useState(1);

  const [reviewSearch, setReviewSearch] = useState("");
  const [reviewSort, setReviewSort]     = useState("newest");
  const [reviewRating, setReviewRating] = useState("all");
  const [reviewPage, setReviewPage]     = useState(1);

  const [auctionSearch, setAuctionSearch] = useState("");
  const [auctionFilter, setAuctionFilter] = useState("all");
  const [auctionSort, setAuctionSort]     = useState("newest");
  const [auctionPage, setAuctionPage]     = useState(1);

  useEffect(() => {
    fetchDashboardData();
    fetchAnalytics();
    fetchBanners();
    fetchContactMessages();
    fetchAllOrders();
    fetchAllUsers();
    fetchAllSellers();
    fetchAllReviews();
    fetchAllAuctions();
  }, []);

  /* ── Fetch functions ── */
  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [statsRes, sellersRes, productsRes] = await Promise.all([
        adminAPI.getDashboardStats(),
        adminAPI.getPendingSellers(),
        adminAPI.getPendingProducts(),
      ]);
      if (statsRes?.data?.success) {
        const d = statsRes.data.data || {};
        setStats({
          totalUsers:          d?.users?.total      || 0,
          totalSellersUsers:   d?.users?.sellers    || 0,
          totalBuyers:         d?.users?.buyers     || 0,
          totalSellerProfiles: d?.sellers?.total    || 0,
          pendingSellers:      d?.sellers?.pending  || 0,
          approvedSellers:     d?.sellers?.approved || 0,
          totalProducts:       d?.products?.total    || 0,
          pendingProducts:     d?.products?.pending  || 0,
          approvedProducts:    d?.products?.approved || 0,
          rejectedProducts:    d?.products?.rejected || 0,
        });
      }
      if (sellersRes?.data?.success)  setPendingSellers(sellersRes.data.data || []);
      if (productsRes?.data?.success) setPendingProducts(productsRes.data.data || []);
      try {
        const r = await productAPI.getAllProducts({});
        setAllProducts(r.data.data?.products || r.data.data || []);
      } catch {}
    } catch (err) { console.error("fetchDashboardData:", err); }
    finally { setLoading(false); }
  };

  const fetchAnalytics = async () => {
    try { setAnalyticsLoading(true); const res = await adminAPI.getAnalytics(); if (res?.data?.success) setAnalytics(res.data.data); }
    catch (err) { console.error("fetchAnalytics:", err); }
    finally { setAnalyticsLoading(false); }
  };
  const fetchBanners = async () => {
    try { const res = await adminAPI.getAllBanners(); if (res.data.success) setBanners(res.data.data || []); } catch {}
  };
  const fetchContactMessages = async () => {
    try { const res = await adminAPI.getAllContactMessages(); if (res.data.success) setContactMessages(res.data.data || []); } catch {}
  };
  const fetchAllOrders = async () => {
    try { const res = await adminAPI.getAllOrders(); if (res.data.success) setAllOrders(res.data.data || []); } catch (err) { console.error(err); }
  };
  const fetchAllUsers = async () => {
    try { const res = await adminAPI.getAllUsers(); if (res.data.success) setAllUsers(res.data.data || []); } catch {}
  };
  const fetchAllSellers = async () => {
    try { const res = await adminAPI.getAllSellers(); if (res.data.success) setAllSellers(res.data.data || []); } catch {}
  };
  const fetchAllReviews = async () => {
    try { const res = await adminAPI.getAllReviews(); if (res.data.success) setAllReviews(res.data.data || []); } catch {}
  };

  // ✅ FIX: Uses adminAPI (sees ALL auctions regardless of approval_status)
  const fetchAllAuctions = async () => {
    try { const res = await adminAPI.getAllAuctions(); if (res.data.success) setAllAuctions(res.data.data || []); }
    catch (err) { console.error("fetchAllAuctions:", err); }
  };

  const handleRefresh = () => {
    fetchDashboardData(); fetchAnalytics(); fetchAllOrders();
    fetchAllUsers(); fetchAllSellers(); fetchAllReviews(); fetchAllAuctions();
  };

  /* ── Banner handlers ── */
  const handleUploadBanner = async (e) => {
    e.preventDefault(); setUploadingBanner(true);
    try { const res = await adminAPI.createBanner(new FormData(e.target)); if (res.data.success) { toast.success("Banner uploaded!"); fetchBanners(); e.target.reset(); } }
    catch (err) { toast.error(err.response?.data?.message || "Failed to upload banner"); }
    finally { setUploadingBanner(false); }
  };
  const handleToggleBanner = async (id) => {
    try { const res = await adminAPI.toggleBannerStatus(id); if (res.data.success) { toast.info(res.data.message); fetchBanners(); } } catch { toast.error("Failed to toggle banner"); }
  };

  /* ── Contact handlers ── */
  const handleContactStatus = async (id, status) => {
    try { const res = await adminAPI.updateContactStatus(id, { status }); if (res.data.success) { toast.success("Status updated"); fetchContactMessages(); } } catch { toast.error("Failed to update status"); }
  };
  const handleOpenReply  = (contact) => setReplyModal({ isOpen: true, contact });
  const handleCloseReply = () => setReplyModal({ isOpen: false, contact: null });
  const handleSendReply  = async (contactId, reply) => {
    try {
      const res = await adminAPI.updateContactStatus(contactId, { admin_reply: reply });
      if (res.data.success) { toast.success("Reply sent! Email delivered to user."); fetchContactMessages(); }
    } catch { toast.error("Failed to send reply"); }
  };

  /* ── User block ── */
  const handleToggleBlock = async (userId) => {
    try {
      const res = await adminAPI.toggleBlockUser(userId);
      if (res.data.success) {
        toast.success(res.data.message);
        setAllUsers((prev) => prev.map((u) => u.user_id === userId ? { ...u, is_active: !u.is_active } : u));
      }
    } catch { toast.error("Failed to update user"); }
  };

  /* ── Confirm / reject handlers ── */
  const handleConfirmAction = async () => {
    const { type, id } = confirmModal;
    setConfirmModal({ isOpen: false, type: null, id: null });
    try {
      if (type === "deleteBanner")   { const r = await adminAPI.deleteBanner(id);        if (r.data.success) { toast.success("Banner deleted");   fetchBanners(); } }
      if (type === "deleteContact")  { const r = await adminAPI.deleteContactMessage(id); if (r.data.success) { toast.success("Message deleted");  fetchContactMessages(); } }
      if (type === "deleteReview")   { const r = await adminAPI.deleteReview(id);         if (r.data.success) { toast.success("Review deleted");   fetchAllReviews(); } }
      if (type === "approveSeller")  { const r = await adminAPI.approveSeller(id);        if (r.data.success) { toast.success("Seller approved");  fetchDashboardData(); fetchAllSellers(); } }
      if (type === "approveProduct") { const r = await adminAPI.approveProduct(id);       if (r.data.success) { toast.success("Product approved"); fetchDashboardData(); } }
      if (type === "toggleFeatured") { const r = await adminAPI.toggleFeatured(id);       if (r.data.success) { toast.info(r.data.message);       fetchDashboardData(); } }
      if (type === "deleteAuction")  { const r = await adminAPI.deleteAuction(id);        if (r.data.success) { toast.success("Auction deleted");  fetchAllAuctions(); } }
      if (type === "approveAuction") { const r = await adminAPI.approveAuction(id);       if (r.data.success) { toast.success("Auction approved"); fetchAllAuctions(); fetchDashboardData(); } }
    } catch { toast.error("Action failed"); }
  };

  const handleRejectAction = async (reason) => {
    const { type, id } = rejectModal;
    setRejectModal({ isOpen: false, type: null, id: null });
    try {
      if (type === "rejectSeller")  { const r = await adminAPI.rejectSeller(id, { rejection_reason: reason });  if (r.data.success) { toast.success("Seller rejected");  fetchDashboardData(); fetchAllSellers(); } }
      if (type === "rejectProduct") { const r = await adminAPI.rejectProduct(id, { rejection_reason: reason }); if (r.data.success) { toast.success("Product rejected"); fetchDashboardData(); } }
      if (type === "rejectAuction") { const r = await adminAPI.rejectAuction(id, { rejection_reason: reason }); if (r.data.success) { toast.success("Auction rejected"); fetchAllAuctions(); fetchDashboardData(); } }
    } catch { toast.error("Failed to reject"); }
  };

  const confirmConfig = {
    deleteBanner:    { title: "Delete this banner?",     message: "This cannot be undone.",                                 confirmText: "Delete",  confirmVariant: "danger"  },
    deleteContact:   { title: "Delete this message?",    message: "The message will be permanently removed.",               confirmText: "Delete",  confirmVariant: "danger"  },
    deleteReview:    { title: "Delete this review?",     message: "The review will be permanently removed.",                confirmText: "Delete",  confirmVariant: "danger"  },
    deleteAuction:   { title: "Delete this auction?",    message: "This cannot be undone.",                                 confirmText: "Delete",  confirmVariant: "danger"  },
    approveAuction:  { title: "Approve this auction?",   message: "It will be visible to buyers and accept bids.",          confirmText: "Approve", confirmVariant: "warning" },
    approveSeller:   { title: "Approve this seller?",    message: "They will be able to list products on the marketplace.", confirmText: "Approve", confirmVariant: "warning" },
    approveProduct:  { title: "Approve this product?",   message: "It will be visible to buyers on the marketplace.",       confirmText: "Approve", confirmVariant: "warning" },
    toggleFeatured:  { title: "Toggle featured status?", message: "This will update the product's featured status.",        confirmText: "Confirm", confirmVariant: "warning" },
  };
  const rejectConfig = {
    rejectSeller:  { title: "Reject this seller?" },
    rejectProduct: { title: "Reject this product?" },
    rejectAuction: { title: "Reject this auction?" },
  };

  /* ─── Derived / Filtered Data ─── */
  const filteredOrders = useMemo(() => {
    let list = [...allOrders];
    if (orderFilter !== "all") list = list.filter((o) => o.order_status === orderFilter);
    if (orderPayFilter !== "all") list = list.filter((o) => o.payment_status === orderPayFilter);
    if (orderSearch.trim()) {
      const q = orderSearch.toLowerCase();
      list = list.filter((o) =>
        (o.order_number || "").toLowerCase().includes(q) ||
        (o.user?.full_name || "").toLowerCase().includes(q) ||
        (o.user?.email || "").toLowerCase().includes(q) ||
        (o.delivery_city || "").toLowerCase().includes(q)
      );
    }
    list = filterByDateRange(list, "created_at", orderDate.startDate, orderDate.endDate);
    list.sort((a, b) => {
      const da = parseAnyDate(a.created_at || a.createdAt);
      const db = parseAnyDate(b.created_at || b.createdAt);
      if (orderSort === "newest")  return (db || 0) - (da || 0);
      if (orderSort === "oldest")  return (da || 0) - (db || 0);
      if (orderSort === "highest") return parseFloat(b.total) - parseFloat(a.total);
      if (orderSort === "lowest")  return parseFloat(a.total) - parseFloat(b.total);
      return 0;
    });
    return list;
  }, [allOrders, orderFilter, orderPayFilter, orderSearch, orderDate, orderSort]);
  const orderPages  = Math.ceil(filteredOrders.length / PER_PAGE);
  const pagedOrders = filteredOrders.slice((orderPage - 1) * PER_PAGE, orderPage * PER_PAGE);

  const filteredAllProds = useMemo(() => {
    let list = [...allProducts];
    if (prodFilter !== "all") list = list.filter((p) => p.status === prodFilter);
    if (prodSearch.trim()) {
      const q = prodSearch.toLowerCase();
      list = list.filter((p) =>
        (p.name || "").toLowerCase().includes(q) ||
        (p.category?.name || "").toLowerCase().includes(q) ||
        (p.seller?.shop_name || "").toLowerCase().includes(q)
      );
    }
    list.sort((a, b) => {
      const da = parseAnyDate(a.created_at || a.createdAt);
      const db = parseAnyDate(b.created_at || b.createdAt);
      if (prodSort === "newest")    return (db || 0) - (da || 0);
      if (prodSort === "oldest")    return (da || 0) - (db || 0);
      if (prodSort === "price_asc") return parseFloat(a.price) - parseFloat(b.price);
      if (prodSort === "price_desc")return parseFloat(b.price) - parseFloat(a.price);
      return 0;
    });
    return list;
  }, [allProducts, prodFilter, prodSearch, prodSort]);
  const prodPages  = Math.ceil(filteredAllProds.length / PER_PAGE);
  const pagedProds = filteredAllProds.slice((prodPage - 1) * PER_PAGE, prodPage * PER_PAGE);

  const approvedProducts = useMemo(() => allProducts.filter((p) => p.status === "approved"), [allProducts]);
  const filteredFeatured = useMemo(() => {
    if (!featSearch.trim()) return approvedProducts;
    const q = featSearch.toLowerCase();
    return approvedProducts.filter((p) =>
      (p.name || "").toLowerCase().includes(q) ||
      (p.seller?.shop_name || "").toLowerCase().includes(q) ||
      (p.category?.name || "").toLowerCase().includes(q)
    );
  }, [approvedProducts, featSearch]);
  const featPages = Math.ceil(filteredFeatured.length / FEAT_PER_PAGE);
  const pagedFeat = filteredFeatured.slice((featPage - 1) * FEAT_PER_PAGE, featPage * FEAT_PER_PAGE);

  const filteredUsers = useMemo(() => {
    let list = [...allUsers];
    if (userFilter === "buyer")   list = list.filter((u) => u.role === "buyer");
    if (userFilter === "seller")  list = list.filter((u) => u.role === "seller");
    if (userFilter === "active")  list = list.filter((u) => u.is_active);
    if (userFilter === "blocked") list = list.filter((u) => !u.is_active);
    if (userSearch.trim()) {
      const q = userSearch.toLowerCase();
      list = list.filter((u) =>
        (u.full_name || "").toLowerCase().includes(q) ||
        (u.email || "").toLowerCase().includes(q) ||
        (u.phone || "").toLowerCase().includes(q)
      );
    }
    list.sort((a, b) => {
      const da = parseAnyDate(a.created_at || a.createdAt);
      const db = parseAnyDate(b.created_at || b.createdAt);
      if (userSort === "newest") return (db || 0) - (da || 0);
      if (userSort === "oldest") return (da || 0) - (db || 0);
      if (userSort === "name")   return (a.full_name || "").localeCompare(b.full_name || "");
      return 0;
    });
    return list;
  }, [allUsers, userFilter, userSearch, userSort]);
  const userPages  = Math.ceil(filteredUsers.length / PER_PAGE);
  const pagedUsers = filteredUsers.slice((userPage - 1) * PER_PAGE, userPage * PER_PAGE);

  const filteredSellers = useMemo(() => {
    let list = [...allSellers];
    if (sellerFilter !== "all") list = list.filter((s) => s.approval_status === sellerFilter);
    if (sellerSearch.trim()) {
      const q = sellerSearch.toLowerCase();
      list = list.filter((s) =>
        (s.shop_name || "").toLowerCase().includes(q) ||
        (s.user?.full_name || "").toLowerCase().includes(q) ||
        (s.user?.email || "").toLowerCase().includes(q) ||
        (s.city || "").toLowerCase().includes(q)
      );
    }
    list.sort((a, b) => {
      const da = parseAnyDate(a.created_at || a.createdAt);
      const db = parseAnyDate(b.created_at || b.createdAt);
      if (sellerSort === "newest") return (db || 0) - (da || 0);
      if (sellerSort === "oldest") return (da || 0) - (db || 0);
      if (sellerSort === "name")   return (a.shop_name || "").localeCompare(b.shop_name || "");
      return 0;
    });
    return list;
  }, [allSellers, sellerFilter, sellerSearch, sellerSort]);
  const sellerPages  = Math.ceil(filteredSellers.length / PER_PAGE);
  const pagedSellers = filteredSellers.slice((sellerPage - 1) * PER_PAGE, sellerPage * PER_PAGE);

  const filteredReviews = useMemo(() => {
    let list = [...allReviews].filter((r) => !r.parent_id);
    if (reviewRating !== "all") list = list.filter((r) => String(r.rating) === reviewRating);
    if (reviewSearch.trim()) {
      const q = reviewSearch.toLowerCase();
      list = list.filter((r) =>
        (r.comment || "").toLowerCase().includes(q) ||
        (r.user?.full_name || "").toLowerCase().includes(q) ||
        (r.product?.name || "").toLowerCase().includes(q)
      );
    }
    list.sort((a, b) => {
      const da = parseAnyDate(a.created_at || a.createdAt);
      const db = parseAnyDate(b.created_at || b.createdAt);
      if (reviewSort === "newest")  return (db || 0) - (da || 0);
      if (reviewSort === "oldest")  return (da || 0) - (db || 0);
      if (reviewSort === "highest") return (b.rating || 0) - (a.rating || 0);
      if (reviewSort === "lowest")  return (a.rating || 0) - (b.rating || 0);
      return 0;
    });
    return list;
  }, [allReviews, reviewRating, reviewSearch, reviewSort]);
  const reviewPages  = Math.ceil(filteredReviews.length / PER_PAGE);
  const pagedReviews = filteredReviews.slice((reviewPage - 1) * PER_PAGE, reviewPage * PER_PAGE);

  const filteredAuctions = useMemo(() => {
    let list = [...allAuctions];
    if (auctionFilter !== "all") list = list.filter((a) => a.status === auctionFilter);
    if (auctionSearch.trim()) {
      const q = auctionSearch.toLowerCase();
      list = list.filter((a) =>
        (a.title || "").toLowerCase().includes(q) ||
        (a.seller?.shop_name || "").toLowerCase().includes(q) ||
        (a.seller?.user?.full_name || "").toLowerCase().includes(q)
      );
    }
    list.sort((a, b) => {
      const da = parseAnyDate(a.created_at || a.createdAt);
      const db = parseAnyDate(b.created_at || b.createdAt);
      if (auctionSort === "newest")   return (db || 0) - (da || 0);
      if (auctionSort === "oldest")   return (da || 0) - (db || 0);
      if (auctionSort === "bid_high") return parseFloat(b.current_bid || 0) - parseFloat(a.current_bid || 0);
      if (auctionSort === "bid_low")  return parseFloat(a.current_bid || 0) - parseFloat(b.current_bid || 0);
      return 0;
    });
    return list;
  }, [allAuctions, auctionFilter, auctionSearch, auctionSort]);
  const auctionPages  = Math.ceil(filteredAuctions.length / PER_PAGE);
  const pagedAuctions = filteredAuctions.slice((auctionPage - 1) * PER_PAGE, auctionPage * PER_PAGE);

  /* ── Sidebar nav ── */
  const nav = useMemo(() => [
    { key: "overview",   label: "Overview",             icon: Icons.grid,     badge: 0 },
    { key: "sellers",    label: "Artisan Verification", icon: Icons.shield,   badge: pendingSellers.length },
    { key: "products",   label: "Product Approvals",    icon: Icons.box,      badge: pendingProducts.length },
    { key: "featured",   label: "Featured Products",    icon: Icons.star,     badge: 0 },
    { key: "allorders",  label: "All Orders",           icon: Icons.orders,   badge: 0 },
    { key: "allprods",   label: "All Products",         icon: Icons.products, badge: 0 },
    { key: "allusers",   label: "All Users",            icon: Icons.users,    badge: 0 },
    { key: "allsellers", label: "All Sellers",          icon: Icons.store,    badge: 0 },
    { key: "auctions",   label: "All Auctions",         icon: Icons.auction,  badge: allAuctions.filter((a) => a.approval_status === "pending").length },
    { key: "reviews",    label: "Reviews",              icon: Icons.reviews,  badge: 0 },
    { key: "banners",    label: "Festival Banners",     icon: Icons.image,    badge: 0 },
    { key: "contacts",   label: "Contact Messages",     icon: Icons.mail,     badge: contactMessages.filter((m) => m.status === "pending").length },
  ], [pendingSellers.length, pendingProducts.length, allAuctions, contactMessages]);

  const sellerRate  = stats.totalSellerProfiles > 0 ? Math.round((stats.approvedSellers / stats.totalSellerProfiles) * 100) : 0;
  const productRate = stats.totalProducts > 0 ? Math.round((stats.approvedProducts / stats.totalProducts) * 100) : 0;
  const filteredMsgs = (() => {
    let list = msgFilter === "all" ? contactMessages : contactMessages.filter((m) => m.status === msgFilter);
    if (contactSearch.trim()) {
      const q = contactSearch.toLowerCase();
      list = list.filter((m) =>
        (m.name || "").toLowerCase().includes(q) ||
        (m.email || "").toLowerCase().includes(q) ||
        (m.subject || "").toLowerCase().includes(q) ||
        (m.message || "").toLowerCase().includes(q)
      );
    }
    list = filterByDateRange(list, "created_at", contactDate.startDate, contactDate.endDate);
    return list;
  })();
  const activeCfg    = confirmConfig[confirmModal.type] || {};
  const activeRejCfg = rejectConfig[rejectModal.type] || {};
  const chartData    = revenueView === "weekly" ? analytics.dailySales : analytics.monthlySales;
  const chartXKey    = revenueView === "weekly" ? "date" : "month";
  const totalProductsDonut = analytics.productDonut.reduce((s, d) => s + d.value, 0);
  const totalOrdersDonut   = analytics.orderDonut.reduce((s, d) => s + d.value, 0);

  if (loading) {
    return <div className="admin-loading"><div className="spinner" /><p>Loading dashboard…</p></div>;
  }

  return (
    <div className="admin-dashboard-container">
      <ConfirmModal
        isOpen={confirmModal.isOpen} title={activeCfg.title} message={activeCfg.message}
        confirmText={activeCfg.confirmText} cancelText="Cancel" confirmVariant={activeCfg.confirmVariant}
        onConfirm={handleConfirmAction} onCancel={() => setConfirmModal({ isOpen: false, type: null, id: null })}
      />
      <RejectModal
        isOpen={rejectModal.isOpen} title={activeRejCfg.title}
        onConfirm={handleRejectAction} onCancel={() => setRejectModal({ isOpen: false, type: null, id: null })}
      />
      <ReplyModal
        isOpen={replyModal.isOpen} contact={replyModal.contact}
        onClose={handleCloseReply} onSend={handleSendReply}
      />

      {/* ─── SIDEBAR ─── */}
      <aside className="admin-sidebar">
        <div className="sidebar-header">
          <div className="sidebar-logo-mark">हK</div>
          <div>
            <div className="sidebar-logo-text">हस्तKrafts</div>
            <div className="sidebar-logo-sub">Admin Console</div>
          </div>
        </div>
        <nav className="sidebar-nav">
          <div className="nav-section-label">Navigation</div>
          {nav.map((item) => (
            <button key={item.key} className={`nav-item ${activeTab === item.key ? "active" : ""}`} onClick={() => setActiveTab(item.key)}>
              {item.icon}
              <span className="nav-label">{item.label}</span>
              {item.badge > 0 && <span className="badge">{item.badge}</span>}
            </button>
          ))}
        </nav>
        <div className="sidebar-footer">
          <div className="sidebar-user">
            <div className="sidebar-avatar">AD</div>
            <div>
              <div className="sidebar-user-name">Administrator</div>
              <div className="sidebar-user-role">Full access</div>
            </div>
          </div>
        </div>
      </aside>

      {/* ─── MAIN ─── */}
      <main className="admin-main">

        {/* ══ OVERVIEW ══ */}
        {activeTab === "overview" && (
          <div>
            <div className="page-header">
              <div><h1>Dashboard Overview</h1><p>Real-time platform metrics and activity</p></div>
              <button className="btn-refresh" onClick={handleRefresh}>{Icons.refresh} Refresh</button>
            </div>

            {(stats.pendingSellers > 0 || stats.pendingProducts > 0) && (
              <div className="pending-alert">
                <span className="pending-dot" />
                <p>
                  {stats.pendingSellers > 0 && <strong>{stats.pendingSellers} seller{stats.pendingSellers > 1 ? "s" : ""}</strong>}
                  {stats.pendingSellers > 0 && stats.pendingProducts > 0 && " and "}
                  {stats.pendingProducts > 0 && <strong>{stats.pendingProducts} product{stats.pendingProducts > 1 ? "s" : ""}</strong>}
                  {" "}awaiting review
                </p>
                <button className="pending-review-btn" onClick={() => setActiveTab(stats.pendingSellers > 0 ? "sellers" : "products")}>Review now →</button>
              </div>
            )}

            <div className="kpi-grid">
              <KpiCard icon={Icons.usersLg} label="Total Users"    value={stats.totalUsers}         sub={`${stats.totalBuyers} buyers · ${stats.totalSellersUsers} sellers`} accent="#b86e38" />
              <KpiCard icon={Icons.storeLg} label="Active Sellers" value={stats.approvedSellers}    sub={`${stats.pendingSellers} pending verification`}                      accent="#2a9e6a" />
              <KpiCard icon={Icons.pkg}     label="Total Products" value={stats.totalProducts}      sub={`${stats.approvedProducts} live · ${stats.pendingProducts} pending`} accent="#1a509a" />
              <KpiCard icon={Icons.rupee}   label="Total Revenue"  value={fmtAmount(analytics.summary.totalRevenue)} sub={`${fmtAmount(analytics.summary.thisMonthRevenue)} this month`} accent="#c08830" />
            </div>

            <div className="charts-row">
              <div className="chart-card chart-card-wide">
                <div className="chart-card-header">
                  <div><div className="chart-card-title">Revenue & Orders</div><div className="chart-card-sub">Paid orders over time</div></div>
                  <div className="chart-toggle">
                    <button className={revenueView === "weekly" ? "active" : ""} onClick={() => setRevenueView("weekly")}>7 Days</button>
                    <button className={revenueView === "monthly" ? "active" : ""} onClick={() => setRevenueView("monthly")}>6 Months</button>
                  </div>
                </div>
                {analyticsLoading ? <div className="chart-loading"><div className="spinner" /></div> :
                  chartData.length === 0 ? <div className="chart-empty">No order data yet</div> : (
                  <ResponsiveContainer width="100%" height={220}>
                    <AreaChart data={chartData} margin={{ top: 8, right: 8, left: -10, bottom: 0 }}>
                      <defs>
                        <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#b86e38" stopOpacity={0.22} />
                          <stop offset="95%" stopColor="#b86e38" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="ordersGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#2a9e6a" stopOpacity={0.18} />
                          <stop offset="95%" stopColor="#2a9e6a" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border-light)" />
                      <XAxis dataKey={chartXKey} tick={{ fontSize: 11, fill: "var(--text-3)", fontFamily: "inherit" }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 11, fill: "var(--text-3)", fontFamily: "inherit" }} axisLine={false} tickLine={false} />
                      <Tooltip content={<ChartTooltip />} />
                      <Legend wrapperStyle={{ fontSize: "0.72rem", fontFamily: "inherit" }} />
                      <Area type="monotone" dataKey="revenue" name="Revenue (Rs.)" stroke="#b86e38" strokeWidth={2.5} fill="url(#revenueGrad)" dot={false} activeDot={{ r: 5, fill: "#b86e38" }} />
                      <Area type="monotone" dataKey="orders"  name="Orders"        stroke="#2a9e6a" strokeWidth={2}   fill="url(#ordersGrad)"  dot={false} activeDot={{ r: 4, fill: "#2a9e6a" }} />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </div>

              <div className="chart-card chart-card-narrow">
                <div className="chart-card-header"><div><div className="chart-card-title">Product Status</div><div className="chart-card-sub">Approval breakdown</div></div></div>
                {analyticsLoading ? <div className="chart-loading"><div className="spinner" /></div> :
                  totalProductsDonut === 0 ? <div className="chart-empty">No products yet</div> : (
                  <>
                    <ResponsiveContainer width="100%" height={180}>
                      <PieChart>
                        <Pie data={analytics.productDonut} cx="50%" cy="50%" innerRadius={55} outerRadius={78} paddingAngle={3} dataKey="value" strokeWidth={0}>
                          {analytics.productDonut.map((_, i) => <Cell key={i} fill={DONUT_COLORS_PRODUCT[i % DONUT_COLORS_PRODUCT.length]} />)}
                          <DonutLabel cx="50%" cy="50%" value={totalProductsDonut} label="total" />
                        </Pie>
                        <Tooltip formatter={(v) => [v, ""]} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="donut-legend">
                      {analytics.productDonut.map((d, i) => (
                        <div key={i} className="donut-legend-item">
                          <span className="donut-dot" style={{ background: DONUT_COLORS_PRODUCT[i % DONUT_COLORS_PRODUCT.length] }} />
                          <span className="donut-label">{d.name}</span>
                          <span className="donut-val">{d.value}</span>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>

            <div className="charts-row charts-row-3">
              <div className="chart-card">
                <div className="chart-card-header"><div><div className="chart-card-title">Top Categories</div><div className="chart-card-sub">By approved products</div></div></div>
                {analyticsLoading ? <div className="chart-loading"><div className="spinner" /></div> :
                  analytics.topCategories.length === 0 ? <div className="chart-empty">No data</div> : (
                  <ResponsiveContainer width="100%" height={190}>
                    <BarChart data={analytics.topCategories} layout="vertical" margin={{ top: 4, right: 12, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border-light)" horizontal={false} />
                      <XAxis type="number" tick={{ fontSize: 11, fill: "var(--text-3)", fontFamily: "inherit" }} axisLine={false} tickLine={false} />
                      <YAxis type="category" dataKey="name" width={80} tick={{ fontSize: 11, fill: "var(--text-2)", fontFamily: "inherit" }} axisLine={false} tickLine={false} />
                      <Tooltip content={<ChartTooltip />} />
                      <Bar dataKey="count" name="Products" radius={[0, 5, 5, 0]} fill="#b86e38" />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>

              <div className="chart-card">
                <div className="chart-card-header"><div><div className="chart-card-title">Order Status</div><div className="chart-card-sub">{analytics.summary.totalOrders} total orders</div></div></div>
                {analyticsLoading ? <div className="chart-loading"><div className="spinner" /></div> :
                  totalOrdersDonut === 0 ? <div className="chart-empty">No orders yet</div> : (
                  <>
                    <ResponsiveContainer width="100%" height={155}>
                      <PieChart>
                        <Pie data={analytics.orderDonut} cx="50%" cy="50%" innerRadius={45} outerRadius={65} paddingAngle={3} dataKey="value" strokeWidth={0}>
                          {analytics.orderDonut.map((_, i) => <Cell key={i} fill={DONUT_COLORS_ORDER[i % DONUT_COLORS_ORDER.length]} />)}
                          <DonutLabel cx="50%" cy="50%" value={totalOrdersDonut} label="orders" />
                        </Pie>
                        <Tooltip formatter={(v) => [v, ""]} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="donut-legend">
                      {analytics.orderDonut.map((d, i) => (
                        <div key={i} className="donut-legend-item">
                          <span className="donut-dot" style={{ background: DONUT_COLORS_ORDER[i % DONUT_COLORS_ORDER.length] }} />
                          <span className="donut-label">{d.name}</span>
                          <span className="donut-val">{d.value}</span>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>

              <div className="chart-card">
                <div className="chart-card-header"><div><div className="chart-card-title">Top Sellers</div><div className="chart-card-sub">By total sales</div></div></div>
                {analyticsLoading ? <div className="chart-loading"><div className="spinner" /></div> :
                  analytics.topSellers.length === 0 ? <div className="chart-empty">No sales data</div> : (
                  <div className="top-sellers-list">
                    {analytics.topSellers.map((s, i) => {
                      const maxSales = analytics.topSellers[0]?.sales || 1;
                      const pct = Math.round((s.sales / maxSales) * 100);
                      return (
                        <div key={i} className="top-seller-item">
                          <div className="top-seller-rank">{i + 1}</div>
                          <div className="top-seller-info">
                            <div className="top-seller-name">{s.name}</div>
                            <div className="top-seller-bar-wrap">
                              <div className="top-seller-bar" style={{ width: `${pct}%`, background: i === 0 ? "#b86e38" : i === 1 ? "#c08830" : "#9a8268" }} />
                            </div>
                          </div>
                          <div className="top-seller-count">{s.sales}</div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            <div className="insights-grid" style={{ marginTop: 14 }}>
              <div className="insight-card">
                <div className="insight-title">Seller Approval Rate</div>
                <div className="progress-row">
                  <div className="progress-track"><div className="progress-fill fill-green" style={{ width: `${sellerRate}%` }} /></div>
                  <span className="progress-pct">{sellerRate}%</span>
                </div>
                <p className="insight-note">{stats.approvedSellers} of {stats.totalSellerProfiles} sellers approved</p>
              </div>
              <div className="insight-card">
                <div className="insight-title">Product Approval Rate</div>
                <div className="progress-row">
                  <div className="progress-track"><div className="progress-fill fill-amber" style={{ width: `${productRate}%` }} /></div>
                  <span className="progress-pct">{productRate}%</span>
                </div>
                <p className="insight-note">{stats.approvedProducts} of {stats.totalProducts} products approved</p>
              </div>
              <div className="insight-card">
                <div className="insight-title">Quick Summary</div>
                <div className="summary-list">
                  <div className="summary-item"><span>Active Sellers</span><strong>{stats.approvedSellers}</strong></div>
                  <div className="summary-item"><span>Approved Products</span><strong>{stats.approvedProducts}</strong></div>
                  <div className="summary-item"><span>Total Orders</span><strong>{analytics.summary.totalOrders}</strong></div>
                  <div className="summary-item"><span>Pending Reviews</span><strong>{stats.pendingSellers + stats.pendingProducts}</strong></div>
                  <div className="summary-item"><span>Active Auctions</span><strong>{allAuctions.filter((a) => a.status === "live").length}</strong></div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ══ ARTISAN VERIFICATION ══ */}
        {activeTab === "sellers" && (
          <div>
            <div className="page-header">
              <div><h1>Artisan Verification</h1><p>{pendingSellers.length} application{pendingSellers.length !== 1 ? "s" : ""} pending</p></div>
            </div>
            {pendingSellers.length === 0 ? (
              <div className="empty-state"><p>No pending seller verifications</p></div>
            ) : (
              <div className="verification-list">
                {pendingSellers.map((seller) => {
                  const u = seller?.user || {};
                  const fullName = u.full_name || u.name || "";
                  return (
                    <div key={seller.seller_id} className="verification-card">
                      <div className="v-left">
                        <div className="v-avatar">{initials(fullName || seller.shop_name)}</div>
                        <div>
                          <div className="v-name">{fullName?.trim() || "No name"}</div>
                          <div className="v-shop">{seller.shop_name || "—"}</div>
                          <div className="v-time">Applied {timeAgo(seller)}</div>
                        </div>
                      </div>
                      <div className="v-center">
                        <div className="v-details">
                          <div className="v-field"><label>Email</label><p>{safe(u.email)}</p></div>
                          <div className="v-field"><label>Phone</label><p>{safe(u.phone)}</p></div>
                          <div className="v-field"><label>Location</label><p>{safe(seller.city)}{seller.address ? `, ${seller.address}` : ""}</p></div>
                          <div className="v-field"><label>Citizenship No.</label><p>{safe(seller.citizenship_number)}</p></div>
                          <div className="v-field"><label>Bank</label><p>{safe(seller.bank_name)}</p></div>
                          <div className="v-field"><label>Account No.</label><p>{safe(seller.bank_account_number)}</p></div>
                          <div className="v-field"><label>Account Name</label><p>{safe(seller.bank_account_name)}</p></div>
                        </div>
                      </div>
                      <div className="v-right">
                        <button className="btn-approve" onClick={() => setConfirmModal({ isOpen: true, type: "approveSeller", id: seller.seller_id })}>Approve</button>
                        <button className="btn-reject"  onClick={() => setRejectModal({ isOpen: true, type: "rejectSeller", id: seller.seller_id })}>Reject</button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ══ PRODUCT APPROVALS ══ */}
        {activeTab === "products" && (
          <div>
            <div className="page-header">
              <div><h1>Pending Product Approvals</h1><p>{pendingProducts.length} product{pendingProducts.length !== 1 ? "s" : ""} waiting</p></div>
            </div>
            {pendingProducts.length === 0 ? (
              <div className="empty-state"><p>No pending products</p></div>
            ) : (
              <div className="table-wrap">
                <table className="admin-table">
                  <thead><tr><th>Image</th><th>Product Name</th><th>Seller</th><th>Category</th><th>Price</th><th>Discount</th><th>Stock</th><th>Submitted</th><th>Actions</th></tr></thead>
                  <tbody>
                    {pendingProducts.map((product) => (
                      <tr key={product.product_id}>
                        <td><ProductImg src={product.images?.[0] ? `${API_URL}${product.images[0]}` : null} alt={product.name} /></td>
                        <td className="td-name">{product.name || "—"}</td>
                        <td>{product?.seller?.user?.full_name || "—"}</td>
                        <td>{product?.category?.name || "—"}</td>
                        <td><PriceCell product={product} /></td>
                        <td><DiscountCell product={product} /></td>
                        <td><span className={product.stock_quantity > 10 ? "stock-good" : product.stock_quantity > 0 ? "stock-low" : "stock-out"}>{product.stock_quantity || 0} units</span></td>
                        <td style={{ color: "var(--text-3)", fontSize: "0.72rem" }}>{fmtDate(product.created_at || product.createdAt || product.updatedAt)}</td>
                        <td>
                          <div className="actions-cell">
                            <button className="btn-approve" onClick={() => setConfirmModal({ isOpen: true, type: "approveProduct", id: product.product_id })}>Approve</button>
                            <button className="btn-reject"  onClick={() => setRejectModal({ isOpen: true, type: "rejectProduct", id: product.product_id })}>Reject</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ══ FEATURED PRODUCTS ══ */}
        {activeTab === "featured" && (
          <div>
            <div className="page-header">
              <div><h1>Manage Featured Products</h1><p>Featured products are highlighted on the homepage</p></div>
            </div>
            <div style={{ marginBottom: "0.75rem" }}>
              <SearchInput value={featSearch} onChange={(v) => { setFeatSearch(v); setFeatPage(1); }} placeholder="Search products…" theme="admin" style={{ maxWidth: 340 }} />
            </div>
            {filteredFeatured.length === 0 ? (
              <div className="empty-state"><p>No approved products available</p></div>
            ) : (
              <>
                <div className="table-wrap">
                  <table className="admin-table">
                    <thead><tr><th>Image</th><th>Product Name</th><th>Shop</th><th>Category</th><th>Price</th><th>Discount</th><th>Featured</th><th>Action</th></tr></thead>
                    <tbody>
                      {pagedFeat.map((product) => (
                        <tr key={product.product_id}>
                          <td><ProductImg src={product.images?.[0] ? `${API_URL}${product.images[0]}` : null} alt={product.name} /></td>
                          <td className="td-name">{product.name || "—"}</td>
                          <td>{product?.seller?.shop_name || "—"}</td>
                          <td>{product?.category?.name || "—"}</td>
                          <td><PriceCell product={product} /></td>
                          <td><DiscountCell product={product} /></td>
                          <td>{product.is_featured ? <span className="featured-tag">★ Featured</span> : <span style={{ color: "var(--text-3)", fontSize: "0.72rem" }}>Not featured</span>}</td>
                          <td><button className={product.is_featured ? "btn-reject" : "btn-approve"} onClick={() => setConfirmModal({ isOpen: true, type: "toggleFeatured", id: product.product_id })}>{product.is_featured ? "Remove" : "Feature"}</button></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <Pagination currentPage={featPage} totalPages={featPages} onPageChange={setFeatPage} theme="admin" />
              </>
            )}
          </div>
        )}

        {/* ══ ALL ORDERS ══ */}
        {activeTab === "allorders" && (
          <div>
            <div className="page-header">
              <div><h1>All Orders</h1><p>{filteredOrders.length} of {allOrders.length} orders</p></div>
            </div>
            <div style={{ display: "flex", gap: "0.65rem", flexWrap: "wrap", alignItems: "flex-end", marginBottom: "0.75rem" }}>
              <SearchInput value={orderSearch} onChange={(v) => { setOrderSearch(v); setOrderPage(1); }} placeholder="Search by order #, customer, city…" theme="admin" style={{ flex: 1, minWidth: 220 }} />
              <SortSelect theme="admin" value={orderSort} onChange={(v) => { setOrderSort(v); setOrderPage(1); }}
                options={[{ value: "newest", label: "Newest first" }, { value: "oldest", label: "Oldest first" }, { value: "highest", label: "Highest amount" }, { value: "lowest", label: "Lowest amount" }]} />
            </div>
            <div style={{ marginBottom: "0.75rem" }}>
              <DateRangePicker theme="admin" startDate={orderDate.startDate} endDate={orderDate.endDate} onChange={(v) => { setOrderDate(v); setOrderPage(1); }} label="Date:" />
            </div>
            <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginBottom: "1rem" }}>
              <FilterBar theme="admin" active={orderFilter} onChange={(f) => { setOrderFilter(f); setOrderPage(1); }}
                filters={[
                  { key: "all",        label: "All",        count: allOrders.length },
                  { key: "pending",    label: "Pending",    count: allOrders.filter((o) => o.order_status === "pending").length },
                  { key: "processing", label: "Processing", count: allOrders.filter((o) => o.order_status === "processing").length },
                  { key: "shipped",    label: "Shipped",    count: allOrders.filter((o) => o.order_status === "shipped").length },
                  { key: "delivered",  label: "Delivered",  count: allOrders.filter((o) => o.order_status === "delivered").length },
                  { key: "cancelled",  label: "Cancelled",  count: allOrders.filter((o) => o.order_status === "cancelled").length },
                ]}
              />
              <FilterBar theme="admin" active={orderPayFilter} onChange={(f) => { setOrderPayFilter(f); setOrderPage(1); }}
                filters={[{ key: "all", label: "All payments" }, { key: "paid", label: "Paid" }, { key: "pending", label: "Unpaid" }]}
              />
            </div>
            {filteredOrders.length === 0 ? (
              <div className="empty-state"><p>No orders match your filters.</p></div>
            ) : (
              <>
                <div className="table-wrap">
                  <table className="admin-table">
                    <thead><tr><th>Order #</th><th>Customer</th><th>Items</th><th>Delivery</th><th>Status</th><th>Payment</th><th>Total</th><th>Date</th></tr></thead>
                    <tbody>
                      {pagedOrders.map((order) => (
                        <tr key={order.order_id}>
                          <td style={{ fontWeight: 700, color: "var(--accent)", fontSize: "0.78rem" }}>#{order.order_number}</td>
                          <td>
                            <div style={{ fontWeight: 600, color: "var(--text-1)", fontSize: "0.8rem" }}>{order.user?.full_name || "—"}</div>
                            <div style={{ fontSize: "0.68rem", color: "var(--text-3)" }}>{order.user?.email || "—"}</div>
                            <div style={{ fontSize: "0.68rem", color: "var(--text-3)" }}>{order.user?.phone || ""}</div>
                          </td>
                          <td>
                            <div style={{ fontSize: "0.75rem", color: "var(--text-2)" }}>{order.items?.length || 0} item{(order.items?.length || 0) !== 1 ? "s" : ""}</div>
                            {order.items?.slice(0, 2).map((item) => (
                              <div key={item.order_item_id} style={{ fontSize: "0.67rem", color: "var(--text-3)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 140 }}>
                                {item.product_name} ×{item.quantity}
                              </div>
                            ))}
                          </td>
                          <td>
                            <div style={{ fontSize: "0.75rem", color: "var(--text-2)" }}>{order.delivery_name}</div>
                            <div style={{ fontSize: "0.68rem", color: "var(--text-3)" }}>{order.delivery_city}{order.delivery_state ? `, ${order.delivery_state}` : ""}</div>
                            <div style={{ fontSize: "0.68rem", color: "var(--text-3)" }}>{order.delivery_phone}</div>
                          </td>
                          <td>
                            <span style={{ padding: "2px 8px", borderRadius: 999, fontSize: "0.65rem", fontWeight: 700, background: { pending: "#FEF3C7", processing: "#DBEAFE", shipped: "#E9D5FF", delivered: "#D1FAE5", cancelled: "#FEE2E2" }[order.order_status] || "#F1F5F9", color: { pending: "#92400E", processing: "#1E40AF", shipped: "#6B21A8", delivered: "#065F46", cancelled: "#991B1B" }[order.order_status] || "#475569" }}>
                              {order.order_status?.charAt(0).toUpperCase() + order.order_status?.slice(1)}
                            </span>
                          </td>
                          <td>
                            <span style={{ padding: "2px 8px", borderRadius: 999, fontSize: "0.65rem", fontWeight: 700, background: order.payment_status === "paid" ? "#D1FAE5" : "#FEF3C7", color: order.payment_status === "paid" ? "#065F46" : "#92400E" }}>
                              {order.payment_status === "paid" ? "Paid" : "Unpaid"}
                            </span>
                            <div style={{ fontSize: "0.65rem", color: "var(--text-3)", marginTop: 2 }}>{order.payment_method?.toUpperCase()}</div>
                          </td>
                          <td style={{ fontWeight: 700, color: "var(--text-1)", fontSize: "0.8rem" }}>{fmtAmount(order.total)}</td>
                          <td style={{ color: "var(--text-3)", fontSize: "0.68rem" }}>{fmtDate(order.created_at || order.createdAt)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <Pagination currentPage={orderPage} totalPages={orderPages} onPageChange={setOrderPage} theme="admin" />
              </>
            )}
          </div>
        )}

        {/* ══ ALL PRODUCTS ══ */}
        {activeTab === "allprods" && (
          <div>
            <div className="page-header">
              <div><h1>All Products</h1><p>{filteredAllProds.length} of {allProducts.length} products</p></div>
            </div>
            <div style={{ display: "flex", gap: "0.65rem", flexWrap: "wrap", alignItems: "flex-end", marginBottom: "0.75rem" }}>
              <SearchInput value={prodSearch} onChange={(v) => { setProdSearch(v); setProdPage(1); }} placeholder="Search by name, category, shop…" theme="admin" style={{ flex: 1, minWidth: 220 }} />
              <SortSelect theme="admin" value={prodSort} onChange={(v) => { setProdSort(v); setProdPage(1); }}
                options={[{ value: "newest", label: "Newest first" }, { value: "oldest", label: "Oldest first" }, { value: "price_asc", label: "Price ↑" }, { value: "price_desc", label: "Price ↓" }]} />
            </div>
            <div style={{ marginBottom: "1rem" }}>
              <FilterBar theme="admin" active={prodFilter} onChange={(f) => { setProdFilter(f); setProdPage(1); }}
                filters={[
                  { key: "all",      label: "All",      count: allProducts.length },
                  { key: "approved", label: "Approved", count: allProducts.filter((p) => p.status === "approved").length },
                  { key: "pending",  label: "Pending",  count: allProducts.filter((p) => p.status === "pending").length },
                  { key: "rejected", label: "Rejected", count: allProducts.filter((p) => p.status === "rejected").length },
                ]}
              />
            </div>
            {filteredAllProds.length === 0 ? (
              <div className="empty-state"><p>No products match your filters.</p></div>
            ) : (
              <>
                <div className="table-wrap">
                  <table className="admin-table">
                    <thead><tr><th>Image</th><th>Product</th><th>Seller</th><th>Category</th><th>Price</th><th>Stock</th><th>Status</th><th>Featured</th><th>Date</th></tr></thead>
                    <tbody>
                      {pagedProds.map((product) => (
                        <tr key={product.product_id}>
                          <td><ProductImg src={product.images?.[0] ? `${API_URL}${product.images[0]}` : null} alt={product.name} /></td>
                          <td>
                            <div className="td-name">{product.name || "—"}</div>
                            {product.sku && <div style={{ fontSize: "0.65rem", color: "var(--text-3)" }}>SKU: {product.sku}</div>}
                          </td>
                          <td style={{ fontSize: "0.78rem" }}>{product?.seller?.shop_name || "—"}</td>
                          <td style={{ fontSize: "0.78rem" }}>{product?.category?.name || "—"}</td>
                          <td><PriceCell product={product} /></td>
                          <td><span className={product.stock_quantity > 10 ? "stock-good" : product.stock_quantity > 0 ? "stock-low" : "stock-out"}>{product.stock_quantity || 0}</span></td>
                          <td>
                            <span style={{ padding: "2px 8px", borderRadius: 999, fontSize: "0.63rem", fontWeight: 700, background: { approved: "var(--green-bg)", pending: "var(--amber-bg)", rejected: "var(--red-bg)" }[product.status], color: { approved: "var(--green)", pending: "var(--amber)", rejected: "var(--red)" }[product.status] }}>
                              {product.status?.charAt(0).toUpperCase() + product.status?.slice(1)}
                            </span>
                          </td>
                          <td>{product.is_featured ? <span className="featured-tag">★ Featured</span> : <span style={{ color: "var(--text-3)", fontSize: "0.7rem" }}>—</span>}</td>
                          <td style={{ color: "var(--text-3)", fontSize: "0.68rem" }}>{fmtDate(product.created_at || product.createdAt || product.updatedAt)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <Pagination currentPage={prodPage} totalPages={prodPages} onPageChange={setProdPage} theme="admin" />
              </>
            )}
          </div>
        )}

        {/* ══ ALL USERS ══ */}
        {activeTab === "allusers" && (
          <div>
            <div className="page-header">
              <div><h1>All Users</h1><p>{filteredUsers.length} of {allUsers.length} registered users</p></div>
              <button className="btn-refresh" onClick={fetchAllUsers}>{Icons.refresh} Refresh</button>
            </div>
            <div style={{ display: "flex", gap: "0.65rem", flexWrap: "wrap", alignItems: "flex-end", marginBottom: "0.75rem" }}>
              <SearchInput value={userSearch} onChange={(v) => { setUserSearch(v); setUserPage(1); }} placeholder="Search by name, email or phone…" theme="admin" style={{ flex: 1, minWidth: 220 }} />
              <SortSelect theme="admin" value={userSort} onChange={(v) => { setUserSort(v); setUserPage(1); }}
                options={[{ value: "newest", label: "Newest first" }, { value: "oldest", label: "Oldest first" }, { value: "name", label: "Name A→Z" }]} />
            </div>
            <div style={{ marginBottom: "1rem" }}>
              <FilterBar theme="admin" active={userFilter} onChange={(f) => { setUserFilter(f); setUserPage(1); }}
                filters={[
                  { key: "all",     label: "All",     count: allUsers.length },
                  { key: "buyer",   label: "Buyers",  count: allUsers.filter((u) => u.role === "buyer").length },
                  { key: "seller",  label: "Sellers", count: allUsers.filter((u) => u.role === "seller").length },
                  { key: "active",  label: "Active",  count: allUsers.filter((u) => u.is_active).length },
                  { key: "blocked", label: "Blocked", count: allUsers.filter((u) => !u.is_active).length },
                ]}
              />
            </div>
            {filteredUsers.length === 0 ? (
              <div className="empty-state"><p>No users match your filters.</p></div>
            ) : (
              <>
                <div className="table-wrap">
                  <table className="admin-table">
                    <thead><tr><th>User</th><th>Email</th><th>Phone</th><th>Role</th><th>Status</th><th>Joined</th><th>Action</th></tr></thead>
                    <tbody>
                      {pagedUsers.map((user) => (
                        <tr key={user.user_id}>
                          <td>
                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                              {user.profile_image ? (
                                <img src={`${API_URL}${user.profile_image}`} alt={user.full_name} style={{ width: 32, height: 32, borderRadius: "50%", objectFit: "cover", border: "1px solid var(--border)" }} />
                              ) : (
                                <div style={{ width: 32, height: 32, borderRadius: "50%", background: "var(--accent-bg)", border: "1px solid var(--accent-border)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.7rem", fontWeight: 800, color: "var(--accent)" }}>
                                  {initials(user.full_name)}
                                </div>
                              )}
                              <span style={{ fontWeight: 600, fontSize: "0.8rem", color: "var(--text-1)" }}>{user.full_name || "—"}</span>
                            </div>
                          </td>
                          <td style={{ fontSize: "0.78rem", color: "var(--text-2)" }}>{user.email}</td>
                          <td style={{ fontSize: "0.78rem", color: "var(--text-3)" }}>{user.phone || "—"}</td>
                          <td>
                            <span style={{ padding: "2px 8px", borderRadius: 999, fontSize: "0.63rem", fontWeight: 700, background: user.role === "seller" ? "var(--amber-bg)" : user.role === "admin" ? "var(--blue-bg)" : "var(--green-bg)", color: user.role === "seller" ? "var(--amber)" : user.role === "admin" ? "var(--blue)" : "var(--green)" }}>
                              {user.role}
                            </span>
                          </td>
                          <td>
                            <span style={{ padding: "2px 8px", borderRadius: 999, fontSize: "0.63rem", fontWeight: 700, background: user.is_active ? "var(--green-bg)" : "var(--red-bg)", color: user.is_active ? "var(--green)" : "var(--red)" }}>
                              {user.is_active ? "Active" : "Blocked"}
                            </span>
                          </td>
                          <td style={{ fontSize: "0.68rem", color: "var(--text-3)" }}>{fmtDate(user.created_at || user.createdAt)}</td>
                          <td>
                            {user.role !== "admin" && (
                              <button className={user.is_active ? "btn-reject" : "btn-approve"} onClick={() => handleToggleBlock(user.user_id)}>
                                {user.is_active ? "Block" : "Unblock"}
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <Pagination currentPage={userPage} totalPages={userPages} onPageChange={setUserPage} theme="admin" />
              </>
            )}
          </div>
        )}

        {/* ══ ALL SELLERS ══ */}
        {activeTab === "allsellers" && (
          <div>
            <div className="page-header">
              <div><h1>All Sellers</h1><p>{filteredSellers.length} of {allSellers.length} sellers</p></div>
              <button className="btn-refresh" onClick={fetchAllSellers}>{Icons.refresh} Refresh</button>
            </div>
            <div style={{ display: "flex", gap: "0.65rem", flexWrap: "wrap", alignItems: "flex-end", marginBottom: "0.75rem" }}>
              <SearchInput value={sellerSearch} onChange={(v) => { setSellerSearch(v); setSellerPage(1); }} placeholder="Search by shop, name, email, city…" theme="admin" style={{ flex: 1, minWidth: 220 }} />
              <SortSelect theme="admin" value={sellerSort} onChange={(v) => { setSellerSort(v); setSellerPage(1); }}
                options={[{ value: "newest", label: "Newest first" }, { value: "oldest", label: "Oldest first" }, { value: "name", label: "Shop A→Z" }]} />
            </div>
            <div style={{ marginBottom: "1rem" }}>
              <FilterBar theme="admin" active={sellerFilter} onChange={(f) => { setSellerFilter(f); setSellerPage(1); }}
                filters={[
                  { key: "all",      label: "All",      count: allSellers.length },
                  { key: "approved", label: "Approved", count: allSellers.filter((s) => s.approval_status === "approved").length },
                  { key: "pending",  label: "Pending",  count: allSellers.filter((s) => s.approval_status === "pending").length },
                  { key: "rejected", label: "Rejected", count: allSellers.filter((s) => s.approval_status === "rejected").length },
                ]}
              />
            </div>
            {filteredSellers.length === 0 ? (
              <div className="empty-state"><p>No sellers match your filters.</p></div>
            ) : (
              <>
                <div className="table-wrap">
                  <table className="admin-table">
                    <thead><tr><th>Shop</th><th>Owner</th><th>Contact</th><th>Location</th><th>Bank</th><th>Status</th><th>Joined</th><th>Actions</th></tr></thead>
                    <tbody>
                      {pagedSellers.map((seller) => {
                        const u = seller.user || {};
                        return (
                          <tr key={seller.seller_id}>
                            <td>
                              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                {seller.shop_logo ? (
                                  <img src={`${API_URL}${seller.shop_logo}`} alt={seller.shop_name} style={{ width: 32, height: 32, borderRadius: 7, objectFit: "cover", border: "1px solid var(--border)" }} />
                                ) : (
                                  <div style={{ width: 32, height: 32, borderRadius: 7, background: "var(--accent-bg)", border: "1px solid var(--accent-border)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.75rem", fontWeight: 800, color: "var(--accent)" }}>
                                    {(seller.shop_name?.[0] || "S").toUpperCase()}
                                  </div>
                                )}
                                <div>
                                  <div style={{ fontWeight: 700, fontSize: "0.8rem", color: "var(--text-1)" }}>{seller.shop_name}</div>
                                  <div style={{ fontSize: "0.65rem", color: "var(--text-3)" }}>ID #{seller.seller_id}</div>
                                </div>
                              </div>
                            </td>
                            <td style={{ fontSize: "0.78rem", color: "var(--text-2)" }}>{u.full_name || "—"}</td>
                            <td>
                              <div style={{ fontSize: "0.75rem", color: "var(--text-2)" }}>{u.email || "—"}</div>
                              <div style={{ fontSize: "0.68rem", color: "var(--text-3)" }}>{u.phone || "—"}</div>
                            </td>
                            <td style={{ fontSize: "0.78rem", color: "var(--text-2)" }}>{seller.city || "—"}</td>
                            <td>
                              <div style={{ fontSize: "0.72rem", color: "var(--text-2)" }}>{seller.bank_name || "—"}</div>
                              <div style={{ fontSize: "0.65rem", color: "var(--text-3)" }}>{seller.bank_account_number || "—"}</div>
                            </td>
                            <td>
                              <span style={{ padding: "2px 8px", borderRadius: 999, fontSize: "0.63rem", fontWeight: 700, background: { approved: "var(--green-bg)", pending: "var(--amber-bg)", rejected: "var(--red-bg)" }[seller.approval_status], color: { approved: "var(--green)", pending: "var(--amber)", rejected: "var(--red)" }[seller.approval_status] }}>
                                {seller.approval_status?.charAt(0).toUpperCase() + seller.approval_status?.slice(1)}
                              </span>
                            </td>
                            <td style={{ fontSize: "0.68rem", color: "var(--text-3)" }}>{fmtDate(seller.created_at || seller.createdAt)}</td>
                            <td>
                              {seller.approval_status === "pending" && (
                                <div className="actions-cell">
                                  <button className="btn-approve" onClick={() => setConfirmModal({ isOpen: true, type: "approveSeller", id: seller.seller_id })}>Approve</button>
                                  <button className="btn-reject"  onClick={() => setRejectModal({ isOpen: true, type: "rejectSeller", id: seller.seller_id })}>Reject</button>
                                </div>
                              )}
                              {seller.approval_status === "rejected" && (
                                <div className="actions-cell">
                                  <button className="btn-approve" onClick={() => setConfirmModal({ isOpen: true, type: "approveSeller", id: seller.seller_id })}>Re-Approve</button>
                                </div>
                              )}
                              {seller.approval_status === "approved" && (
                                <span style={{ fontSize: "0.7rem", color: "var(--text-3)" }}>—</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                <Pagination currentPage={sellerPage} totalPages={sellerPages} onPageChange={setSellerPage} theme="admin" />
              </>
            )}
          </div>
        )}

        {/* ══ ALL AUCTIONS ══ */}
        {activeTab === "auctions" && (
          <div>
            <div className="page-header">
              <div><h1>All Auctions</h1><p>{filteredAuctions.length} of {allAuctions.length} auctions</p></div>
              <button className="btn-refresh" onClick={fetchAllAuctions}>{Icons.refresh} Refresh</button>
            </div>
            <div style={{ display: "flex", gap: "0.65rem", flexWrap: "wrap", alignItems: "flex-end", marginBottom: "0.75rem" }}>
              <SearchInput value={auctionSearch} onChange={(v) => { setAuctionSearch(v); setAuctionPage(1); }} placeholder="Search by title or seller…" theme="admin" style={{ flex: 1, minWidth: 220 }} />
              <SortSelect theme="admin" value={auctionSort} onChange={(v) => { setAuctionSort(v); setAuctionPage(1); }}
                options={[{ value: "newest", label: "Newest first" }, { value: "oldest", label: "Oldest first" }, { value: "bid_high", label: "Highest bid" }, { value: "bid_low", label: "Lowest bid" }]} />
            </div>
            <div style={{ marginBottom: "1rem" }}>
              <FilterBar theme="admin" active={auctionFilter} onChange={(f) => { setAuctionFilter(f); setAuctionPage(1); }}
                filters={[
                  { key: "all",       label: "All",       count: allAuctions.length },
                  { key: "live",      label: "🔴 Live",   count: allAuctions.filter((a) => a.status === "live").length },
                  { key: "upcoming",  label: "Upcoming",  count: allAuctions.filter((a) => a.status === "upcoming").length },
                  { key: "ended",     label: "Ended",     count: allAuctions.filter((a) => a.status === "ended").length },
                  { key: "cancelled", label: "Cancelled", count: allAuctions.filter((a) => a.status === "cancelled").length },
                ]}
              />
            </div>
            {filteredAuctions.length === 0 ? (
              <div className="empty-state"><p>No auctions found.</p></div>
            ) : (
              <>
                <div className="table-wrap">
                  <table className="admin-table">
                    {/* ✅ FIXED column order: Approval first, then Status */}
                    <thead><tr><th>Image</th><th>Title</th><th>Seller</th><th>Starting Bid</th><th>Current Bid</th><th>Bids</th><th>Approval</th><th>Status</th><th>Start</th><th>End</th><th>Winner</th><th>Actions</th></tr></thead>
                    <tbody>
                      {pagedAuctions.map((auction) => (
                        <tr key={auction.auction_id}>
                          <td>
                            {auction.images?.[0] ? (
                              <img className="td-img" src={`${API_URL}${auction.images[0]}`} alt={auction.title} />
                            ) : (
                              <div className="td-img-placeholder">🔨</div>
                            )}
                          </td>
                          <td className="td-name" style={{ maxWidth: 160 }}>{auction.title || "—"}</td>
                          <td>
                            <div style={{ fontSize: "0.78rem", fontWeight: 600, color: "var(--text-1)" }}>{auction.seller?.shop_name || "—"}</div>
                            <div style={{ fontSize: "0.65rem", color: "var(--text-3)" }}>{auction.seller?.user?.full_name || ""}</div>
                          </td>
                          <td style={{ fontSize: "0.78rem", fontWeight: 600, color: "var(--text-2)" }}>Rs. {parseFloat(auction.starting_bid || 0).toLocaleString()}</td>
                          <td style={{ fontSize: "0.78rem", fontWeight: 700, color: "var(--accent)" }}>
                            {parseFloat(auction.current_bid || 0) > 0 ? `Rs. ${parseFloat(auction.current_bid).toLocaleString()}` : "—"}
                          </td>
                          <td style={{ fontSize: "0.78rem", textAlign: "center", color: "var(--text-2)" }}>{auction.total_bids || 0}</td>

                          {/* Column 7: Approval — buttons if pending, badge if not */}
                          <td>
                            {auction.approval_status === "pending" && (
                              <div className="actions-cell" style={{ flexDirection: "column", gap: 4 }}>
                                <button className="btn-approve" onClick={() => setConfirmModal({ isOpen: true, type: "approveAuction", id: auction.auction_id })}>Approve</button>
                                <button className="btn-reject"  onClick={() => setRejectModal({ isOpen: true, type: "rejectAuction", id: auction.auction_id })}>Reject</button>
                              </div>
                            )}
                            {auction.approval_status !== "pending" && (
                              <span style={{
                                padding: "2px 8px", borderRadius: 999, fontSize: "0.63rem", fontWeight: 700,
                                background: { approved: "var(--green-bg)", rejected: "var(--red-bg)" }[auction.approval_status] || "var(--bg-muted)",
                                color: { approved: "var(--green)", rejected: "var(--red)" }[auction.approval_status] || "var(--text-3)",
                              }}>
                                {auction.approval_status?.charAt(0).toUpperCase() + auction.approval_status?.slice(1)}
                              </span>
                            )}
                          </td>

                          {/* Column 8: Lifecycle status */}
                          <td>
                            <span style={{
                              padding: "2px 8px", borderRadius: 999, fontSize: "0.63rem", fontWeight: 700,
                              background: { live: "#D1FAE5", upcoming: "#DBEAFE", ended: "#F1F5F9", cancelled: "#FEE2E2" }[auction.status] || "#F1F5F9",
                              color: { live: "#065F46", upcoming: "#1E40AF", ended: "#475569", cancelled: "#991B1B" }[auction.status] || "#475569",
                            }}>
                              {auction.status === "live" ? "🔴 Live" : auction.status?.charAt(0).toUpperCase() + auction.status?.slice(1)}
                            </span>
                          </td>

                          <td style={{ fontSize: "0.68rem", color: "var(--text-3)" }}>{fmtDateTime(auction.auction_start)}</td>
                          <td style={{ fontSize: "0.68rem", color: "var(--text-3)" }}>{fmtDateTime(auction.auction_end)}</td>
                          <td style={{ fontSize: "0.72rem", color: "var(--text-2)" }}>
                            {auction.winner?.full_name || (auction.status === "ended" ? "No bids" : "—")}
                          </td>
                          <td>
                            <button className="btn-reject" onClick={() => setConfirmModal({ isOpen: true, type: "deleteAuction", id: auction.auction_id })}>Delete</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <Pagination currentPage={auctionPage} totalPages={auctionPages} onPageChange={setAuctionPage} theme="admin" />
              </>
            )}
          </div>
        )}

        {/* ══ REVIEWS ══ */}
        {activeTab === "reviews" && (
          <div>
            <div className="page-header">
              <div><h1>Reviews Moderation</h1><p>{filteredReviews.length} of {allReviews.filter((r) => !r.parent_id).length} reviews</p></div>
              <button className="btn-refresh" onClick={fetchAllReviews}>{Icons.refresh} Refresh</button>
            </div>
            <div style={{ display: "flex", gap: "0.65rem", flexWrap: "wrap", alignItems: "flex-end", marginBottom: "0.75rem" }}>
              <SearchInput value={reviewSearch} onChange={(v) => { setReviewSearch(v); setReviewPage(1); }} placeholder="Search by reviewer, product, or comment…" theme="admin" style={{ flex: 1, minWidth: 220 }} />
              <SortSelect theme="admin" value={reviewSort} onChange={(v) => { setReviewSort(v); setReviewPage(1); }}
                options={[{ value: "newest", label: "Newest first" }, { value: "oldest", label: "Oldest first" }, { value: "highest", label: "Highest rating" }, { value: "lowest", label: "Lowest rating" }]} />
            </div>
            <div style={{ marginBottom: "1rem" }}>
              <FilterBar theme="admin" active={reviewRating} onChange={(f) => { setReviewRating(f); setReviewPage(1); }}
                filters={[
                  { key: "all", label: "All ratings" },
                  { key: "5",   label: "★★★★★ 5" },
                  { key: "4",   label: "★★★★ 4" },
                  { key: "3",   label: "★★★ 3" },
                  { key: "2",   label: "★★ 2" },
                  { key: "1",   label: "★ 1" },
                ]}
              />
            </div>
            {filteredReviews.length === 0 ? (
              <div className="empty-state"><p>No reviews found.</p></div>
            ) : (
              <>
                <div className="table-wrap">
                  <table className="admin-table">
                    <thead><tr><th>Product</th><th>Reviewer</th><th>Rating</th><th>Comment</th><th>Helpful</th><th>Verified</th><th>Date</th><th>Action</th></tr></thead>
                    <tbody>
                      {pagedReviews.map((review) => (
                        <tr key={review.review_id}>
                          <td>
                            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                              {review.product?.images?.[0] && (
                                <img src={`${API_URL}${review.product.images[0]}`} alt={review.product.name} style={{ width: 32, height: 32, borderRadius: 6, objectFit: "cover", border: "1px solid var(--border)", flexShrink: 0 }} />
                              )}
                              <span style={{ fontSize: "0.78rem", fontWeight: 600, color: "var(--text-1)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 130 }}>{review.product?.name || "—"}</span>
                            </div>
                          </td>
                          <td>
                            <div style={{ fontSize: "0.78rem", fontWeight: 600, color: "var(--text-1)" }}>{review.user?.full_name || "—"}</div>
                            <div style={{ fontSize: "0.66rem", color: "var(--text-3)" }}>{review.user?.email || ""}</div>
                          </td>
                          <td><StarRating rating={review.rating} /></td>
                          <td>
                            <p style={{ fontSize: "0.75rem", color: "var(--text-2)", lineHeight: 1.5, margin: 0, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>
                              {review.comment || "—"}
                            </p>
                            {review.images?.length > 0 && (
                              <div style={{ display: "flex", gap: 3, marginTop: 3 }}>
                                {review.images.slice(0, 3).map((img, i) => (
                                  <img key={i} src={`${API_URL}${img}`} alt="" style={{ width: 22, height: 22, borderRadius: 3, objectFit: "cover", border: "1px solid var(--border)" }} />
                                ))}
                              </div>
                            )}
                          </td>
                          <td style={{ fontSize: "0.75rem", color: "var(--text-3)", textAlign: "center" }}>{review.helpful_count || 0}</td>
                          <td>
                            <span style={{ fontSize: "0.65rem", fontWeight: 700, padding: "2px 6px", borderRadius: 999, background: review.verified_purchase ? "var(--green-bg)" : "var(--bg-muted)", color: review.verified_purchase ? "var(--green)" : "var(--text-3)" }}>
                              {review.verified_purchase ? "✓ Verified" : "Unverified"}
                            </span>
                          </td>
                          <td style={{ fontSize: "0.68rem", color: "var(--text-3)" }}>{fmtDate(review.created_at || review.createdAt)}</td>
                          <td>
                            <button className="btn-reject" onClick={() => setConfirmModal({ isOpen: true, type: "deleteReview", id: review.review_id })}>Delete</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <Pagination currentPage={reviewPage} totalPages={reviewPages} onPageChange={setReviewPage} theme="admin" />
              </>
            )}
          </div>
        )}

        {/* ══ FESTIVAL BANNERS ══ */}
        {activeTab === "banners" && (
          <div>
            <div className="page-header"><div><h1>Manage Festival Banners</h1><p>Recommended 1920×600px</p></div></div>
            <div className="section-card">
              <div className="section-title">Upload New Banner</div>
              <form onSubmit={handleUploadBanner} className="banner-form">
                <div className="form-row">
                  <div className="form-group"><label>Title *</label><input type="text" name="title" required placeholder="e.g. Dashain Festival Sale" /></div>
                  <div className="form-group"><label>Banner Image *</label><input type="file" name="image" accept="image/*" required /></div>
                </div>
                <div className="form-row">
                  <div className="form-group"><label>Link URL (optional)</label><input type="text" name="link_url" placeholder="/products?category=1" /></div>
                  <div className="form-group"><label>Link Type</label><select name="link_type"><option value="none">No Link</option><option value="category">Category</option><option value="product">Product</option><option value="external">External</option></select></div>
                </div>
                <div className="form-group"><label>Description (optional)</label><textarea name="description" rows="3" placeholder="Brief description…" /></div>
                <button type="submit" className="btn-approve" disabled={uploadingBanner} style={{ width: "fit-content", padding: "7px 18px" }}>{uploadingBanner ? "Uploading…" : "Upload Banner"}</button>
              </form>
            </div>
            <div className="section-card">
              <div className="section-title">Existing Banners ({banners.length})</div>
              {banners.length === 0 ? <div className="empty-state" style={{ border: "none", padding: "24px 0 0" }}><p>No banners yet</p></div> : (
                <div className="banners-grid">
                  {banners.map((banner) => (
                    <div key={banner.banner_id} className="banner-card">
                      <div className="banner-preview">
                        <img src={`${API_URL}${banner.image}`} alt={banner.title} />
                        {!banner.is_active && <div className="banner-inactive">Inactive</div>}
                      </div>
                      <div className="banner-info">
                        <h4>{banner.title}</h4>
                        {banner.description && <p className="banner-desc">{banner.description}</p>}
                        {banner.link_url && <p className="banner-link">{banner.link_type}: {banner.link_url}</p>}
                        <div className="banner-actions">
                          <button className={banner.is_active ? "btn-reject" : "btn-approve"} onClick={() => handleToggleBanner(banner.banner_id)}>{banner.is_active ? "Deactivate" : "Activate"}</button>
                          <button className="btn-reject" onClick={() => setConfirmModal({ isOpen: true, type: "deleteBanner", id: banner.banner_id })}>Delete</button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ══ CONTACT MESSAGES ══ */}
        {activeTab === "contacts" && (
          <div>
            <div className="page-header">
              <div><h1>Contact Messages</h1><p>{contactMessages.length} message{contactMessages.length !== 1 ? "s" : ""} · {contactMessages.filter((m) => m.status === "pending").length} pending</p></div>
            </div>
            <div className="filter-bar" style={{ marginBottom: "1rem" }}>
              {[
                { key: "all",         label: `All (${contactMessages.length})` },
                { key: "pending",     label: `Pending (${contactMessages.filter((m) => m.status === "pending").length})` },
                { key: "in_progress", label: `In Progress (${contactMessages.filter((m) => m.status === "in_progress").length})` },
                { key: "resolved",    label: `Resolved (${contactMessages.filter((m) => m.status === "resolved").length})` },
              ].map((f) => (
                <button key={f.key} className={`filter-chip ${msgFilter === f.key ? "active" : ""}`} onClick={() => setMsgFilter(f.key)}>
                  {f.label}
                </button>
              ))}
            </div>
            <div style={{ display: "flex", gap: "0.65rem", flexWrap: "wrap", alignItems: "flex-end", marginBottom: "0.75rem" }}>
              <SearchInput value={contactSearch} onChange={(v) => setContactSearch(v)} placeholder="Search by name, email, subject…" theme="admin" style={{ flex: 1, minWidth: 220 }} />
            </div>
            <div style={{ marginBottom: "1rem" }}>
              <DateRangePicker theme="admin" startDate={contactDate.startDate} endDate={contactDate.endDate} onChange={(v) => setContactDate(v)} label="Date:" />
            </div>
            {filteredMsgs.length === 0 ? <div className="no-messages">No messages found.</div> : (
              <div className="msg-list">
                {filteredMsgs.map((contact) => (
                  <div key={contact.contact_id} className="msg-card">
                    <div className="msg-head">
                      <div>
                        <div className="msg-name">{contact.name}</div>
                        <div className="msg-email">{contact.email}</div>
                        {contact.phone && <div className="msg-phone">{contact.phone}</div>}
                      </div>
                      <div className="msg-meta">
                        <span className={`status-pill s-${contact.status}`}>
                          {contact.status === "in_progress" ? "In Progress" : contact.status?.charAt(0).toUpperCase() + contact.status?.slice(1)}
                        </span>
                        {contact.created_at && <span className="msg-date">{fmtDate(contact.created_at || contact.createdAt)}</span>}
                        {contact.replied_at && <span className="msg-date" style={{ color: "var(--green)" }}>Replied {fmtDate(contact.replied_at)}</span>}
                      </div>
                    </div>
                    <div className="msg-body">
                      <div className="msg-subject"><strong>Subject:</strong> {contact.subject}</div>
                      <div className="msg-text">{contact.message}</div>
                      {contact.admin_reply && (
                        <div style={{ marginTop: 8, padding: "10px 14px", background: "var(--accent-bg)", border: "1px solid var(--accent-border)", borderRadius: 8, fontSize: "0.78rem" }}>
                          <div style={{ fontSize: "0.6rem", fontWeight: 700, color: "var(--accent)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 5 }}>
                            ✉ Admin Reply · {fmtDate(contact.replied_at)}
                          </div>
                          <p style={{ margin: 0, color: "var(--text-2)", lineHeight: 1.6 }}>{contact.admin_reply}</p>
                        </div>
                      )}
                    </div>
                    <div className="msg-actions">
                      <button className="btn-inprogress" onClick={() => handleOpenReply(contact)}>
                        {contact.admin_reply ? "Edit Reply" : "Reply"}
                      </button>
                      {contact.status === "pending" && (
                        <button className="btn-inprogress" onClick={() => handleContactStatus(contact.contact_id, "in_progress")}>Mark In Progress</button>
                      )}
                      {(contact.status === "pending" || contact.status === "in_progress") && (
                        <button className="btn-resolve" onClick={() => handleContactStatus(contact.contact_id, "resolved")}>Mark Resolved</button>
                      )}
                      {contact.status === "resolved" && (
                        <button className="btn-reopen" onClick={() => handleContactStatus(contact.contact_id, "pending")}>Reopen</button>
                      )}
                      <button className="btn-delete" onClick={() => setConfirmModal({ isOpen: true, type: "deleteContact", id: contact.contact_id })}>Delete</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <div style={{ marginTop: 48, paddingTop: "1rem", borderTop: "1px solid var(--border-light)", textAlign: "center", fontSize: "0.72rem", color: "var(--text-3)" }}>
          © {new Date().getFullYear()} हस्तKrafts Nepal. All rights reserved.
        </div>

      </main>
    </div>
  );
};

export default AdminDashboard;