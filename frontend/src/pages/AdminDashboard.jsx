import React, { useEffect, useMemo, useState } from "react";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import { adminAPI, productAPI } from "../api/axios";
import { useToast } from "../context/ToastContext";
import ConfirmModal from "../components/ConfirmModal";
import AdminReplyModal from "../components/AdminReplyModal";
import { Pagination, FilterBar, SearchInput } from "../components/SharedComponents";
import "../styles/AdminDashboard.css";

const API_URL = "http://localhost:5000";

/* ── SVG icons ── */
const Icons = {
  grid: (<svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></svg>),
  shield: (<svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L3 7v5c0 5.25 3.75 10.15 9 11.35C17.25 22.15 21 17.25 21 12V7l-9-5z"/></svg>),
  box: (<svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>),
  star: (<svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>),
  image: (<svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>),
  mail: (<svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>),
  refresh: (<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 11-2.12-9.36L23 10"/></svg>),
  users: (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>),
  store: (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>),
  pkg: (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/></svg>),
  rupee: (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><line x1="6" y1="4" x2="18" y2="4"/><line x1="6" y1="9" x2="18" y2="9"/><path d="M6 14l6 6 6-6"/><path d="M6 9c0 3.314 2.686 5 6 5s6-1.686 6-5"/></svg>),
  orders: (<svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="1"/><line x1="9" y1="12" x2="15" y2="12"/><line x1="9" y1="16" x2="13" y2="16"/></svg>),
  allUsers: (<svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>),
  allSellers: (<svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>),
  reviews: (<svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>),
};

/* ── Donut chart center label ── */
const DonutLabel = ({ cx, cy, value, label }) => (
  <g>
    <text x={cx} y={cy - 8} textAnchor="middle" fill="var(--text-1)" fontSize="1.5rem" fontWeight="800" fontFamily="inherit">{value}</text>
    <text x={cx} y={cy + 12} textAnchor="middle" fill="var(--text-3)" fontSize="0.62rem" fontWeight="600" fontFamily="inherit" letterSpacing="0.05em">{label}</text>
  </g>
);

/* ── Custom tooltip ── */
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

/* ── KPI Card ── */
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

/* ── Price cell ── */
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

/* ── Star Rating ── */
const StarRating = ({ rating }) => {
  const r = Math.round(rating || 0);
  return (
    <span style={{ color: "#c08830", fontSize: "0.85rem", letterSpacing: 1 }}>
      {"★".repeat(r)}{"☆".repeat(5 - r)}
    </span>
  );
};

/* ── Reject Modal ── */
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
          placeholder="Enter rejection reason..."
          rows={3}
          style={{ width: "100%", padding: "0.6rem 0.75rem", borderRadius: "10px", border: "1.5px solid #e5e7eb", fontSize: "0.875rem", resize: "vertical", marginBottom: "1.2rem", fontFamily: "inherit", outline: "none", boxSizing: "border-box" }}
          onFocus={(e) => (e.target.style.borderColor = "#f59e0b")}
          onBlur={(e) => (e.target.style.borderColor = "#e5e7eb")}
          autoFocus
        />
        <div className="cm-actions">
          <button className="cm-btn cm-cancel" onClick={onCancel}>Cancel</button>
          <button
            className="cm-btn cm-confirm cm-warning"
            onClick={() => { if (reason.trim()) onConfirm(reason.trim()); }}
            disabled={!reason.trim()}
            style={{ opacity: reason.trim() ? 1 : 0.5, cursor: reason.trim() ? "pointer" : "not-allowed" }}
          >
            Reject
          </button>
        </div>
      </div>
    </div>
  );
};

/* ════════════════════ MAIN COMPONENT ════════════════════ */
const AdminDashboard = () => {
  const toast = useToast();
  const [activeTab, setActiveTab] = useState("overview");
  const [loading, setLoading] = useState(true);
  const [analyticsLoading, setAnalyticsLoading] = useState(true);
  const [revenueView, setRevenueView] = useState("weekly");
  const [replyModal, setReplyModal] = useState({ isOpen: false, contact: null });
  const [uploadingBanner, setUploadingBanner] = useState(false);

  // Core data
  const [stats, setStats] = useState({
    totalUsers: 0, totalSellersUsers: 0, totalBuyers: 0,
    totalSellerProfiles: 0, pendingSellers: 0, approvedSellers: 0,
    totalProducts: 0, pendingProducts: 0, approvedProducts: 0, rejectedProducts: 0,
  });
  const [analytics, setAnalytics] = useState({
    dailySales: [], monthlySales: [], productDonut: [], orderDonut: [],
    topCategories: [], topSellers: [], summary: { totalRevenue: 0, thisMonthRevenue: 0, totalOrders: 0 },
  });
  const [pendingSellers, setPendingSellers] = useState([]);
  const [pendingProducts, setPendingProducts] = useState([]);
  const [allProducts, setAllProducts] = useState([]);
  const [banners, setBanners] = useState([]);
  const [contactMessages, setContactMessages] = useState([]);

  // New tab data
  const [allOrders, setAllOrders] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [allSellers, setAllSellers] = useState([]);
  const [allReviews, setAllReviews] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [usersLoading, setUsersLoading] = useState(false);
  const [sellersLoading, setSellersLoading] = useState(false);
  const [reviewsLoading, setReviewsLoading] = useState(false);

  // Orders tab state
  const [orderSearch, setOrderSearch] = useState("");
  const [orderFilter, setOrderFilter] = useState("all");
  const [orderPage, setOrderPage] = useState(1);
  const [orderSort, setOrderSort] = useState("newest");
  const ORDERS_PER_PAGE = 12;

  // Users tab state
  const [userSearch, setUserSearch] = useState("");
  const [userFilter, setUserFilter] = useState("all");
  const [userPage, setUserPage] = useState(1);
  const USERS_PER_PAGE = 15;

  // Sellers tab state
  const [sellerSearch, setSellerSearch] = useState("");
  const [sellerFilter, setSellerFilter] = useState("all");
  const [sellerPage, setSellerPage] = useState(1);
  const SELLERS_PER_PAGE = 12;

  // Reviews tab state
  const [reviewSearch, setReviewSearch] = useState("");
  const [reviewFilter, setReviewFilter] = useState("all");
  const [reviewPage, setReviewPage] = useState(1);
  const REVIEWS_PER_PAGE = 12;

  // Contacts tab state
  const [msgFilter, setMsgFilter] = useState("all");

  // Modals
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, type: null, id: null });
  const [rejectModal, setRejectModal] = useState({ isOpen: false, type: null, id: null });

  const parseDate = (raw) => { if (!raw) return null; const d = new Date(raw); return isNaN(d.getTime()) ? null : d; };
  const safe = (v) => { if (v == null) return "—"; const s = String(v).trim(); return s || "—"; };
  const timeAgo = (seller) => {
    const d = parseDate(seller?.created_at || seller?.createdAt);
    if (!d) return "—";
    const days = Math.floor((Date.now() - d) / 86_400_000);
    if (days <= 0) return "Today"; if (days === 1) return "1 day ago"; return `${days} days ago`;
  };
  const initials = (name) => {
    const parts = (name || "").trim().split(" ").filter(Boolean);
    if (!parts.length) return "?";
    const a = parts[0][0] || ""; const b = parts.length > 1 ? parts[parts.length - 1][0] : parts[0][1] || "";
    return (a + b).toUpperCase() || "?";
  };
  const fmtDate = (raw) => {
    const d = parseDate(raw);
    return d ? d.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" }) : "—";
  };

  const DONUT_COLORS_PRODUCT = ["#2a9e6a", "#c08830", "#aa2c1c"];
  const DONUT_COLORS_ORDER   = ["#c08830", "#1a509a", "#2a9e6a", "#aa2c1c", "#b86e38"];

  useEffect(() => {
    fetchDashboardData();
    fetchAnalytics();
    fetchBanners();
    fetchContactMessages();
  }, []);

  // Lazy-load new tabs on first visit
  useEffect(() => {
    if (activeTab === "allOrders"  && allOrders.length  === 0 && !ordersLoading)  fetchAllOrders();
    if (activeTab === "allUsers"   && allUsers.length   === 0 && !usersLoading)   fetchAllUsers();
    if (activeTab === "allSellers" && allSellers.length === 0 && !sellersLoading) fetchAllSellers();
    if (activeTab === "reviews"    && allReviews.length === 0 && !reviewsLoading) fetchAllReviews();
  }, [activeTab]);

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
          totalProducts:       d?.products?.total   || 0,
          pendingProducts:     d?.products?.pending || 0,
          approvedProducts:    d?.products?.approved|| 0,
          rejectedProducts:    d?.products?.rejected|| 0,
        });
      }
      if (sellersRes?.data?.success) setPendingSellers(sellersRes.data.data || []);
      if (productsRes?.data?.success) setPendingProducts(productsRes.data.data || []);
      try {
        const r = await productAPI.getAllProducts({ status: "approved" });
        setAllProducts(r.data.data.products || []);
      } catch (err) { console.error("Fetch approved products error:", err); }
    } catch (err) { console.error("fetchDashboardData error:", err); }
    finally { setLoading(false); }
  };

  const fetchAnalytics = async () => {
    try {
      setAnalyticsLoading(true);
      const res = await adminAPI.getAnalytics();
      if (res?.data?.success) setAnalytics(res.data.data);
    } catch (err) { console.error("fetchAnalytics error:", err); }
    finally { setAnalyticsLoading(false); }
  };

  const fetchBanners = async () => {
    try { const res = await adminAPI.getAllBanners(); if (res.data.success) setBanners(res.data.data || []); }
    catch (err) { console.error("Fetch banners error:", err); }
  };

  const fetchContactMessages = async () => {
    try { const res = await adminAPI.getAllContactMessages(); if (res.data.success) setContactMessages(res.data.data || []); }
    catch (err) { console.error("Fetch contact messages error:", err); }
  };

  const fetchAllOrders = async () => {
    try { setOrdersLoading(true); const res = await adminAPI.getAllOrders(); if (res.data.success) setAllOrders(res.data.data || []); }
    catch (err) { console.error("Fetch all orders error:", err); toast.error("Failed to load orders"); }
    finally { setOrdersLoading(false); }
  };

  const fetchAllUsers = async () => {
    try { setUsersLoading(true); const res = await adminAPI.getAllUsers(); if (res.data.success) setAllUsers(res.data.data || []); }
    catch (err) { console.error("Fetch all users error:", err); toast.error("Failed to load users"); }
    finally { setUsersLoading(false); }
  };

  const fetchAllSellers = async () => {
    try { setSellersLoading(true); const res = await adminAPI.getAllSellers(); if (res.data.success) setAllSellers(res.data.data || []); }
    catch (err) { console.error("Fetch all sellers error:", err); toast.error("Failed to load sellers"); }
    finally { setSellersLoading(false); }
  };

  const fetchAllReviews = async () => {
    try { setReviewsLoading(true); const res = await adminAPI.getAllReviews(); if (res.data.success) setAllReviews(res.data.data || []); }
    catch (err) { console.error("Fetch all reviews error:", err); toast.error("Failed to load reviews"); }
    finally { setReviewsLoading(false); }
  };

  const handleRefresh = () => {
    fetchDashboardData();
    fetchAnalytics();
    if (activeTab === "allOrders")  fetchAllOrders();
    if (activeTab === "allUsers")   fetchAllUsers();
    if (activeTab === "allSellers") fetchAllSellers();
    if (activeTab === "reviews")    fetchAllReviews();
  };

  const handleUploadBanner = async (e) => {
    e.preventDefault(); setUploadingBanner(true);
    try {
      const res = await adminAPI.createBanner(new FormData(e.target));
      if (res.data.success) { toast.success("Banner uploaded!"); fetchBanners(); e.target.reset(); }
    } catch (err) { toast.error(err.response?.data?.message || "Failed to upload banner"); }
    finally { setUploadingBanner(false); }
  };

  const handleToggleBanner = async (bannerId) => {
    try { const res = await adminAPI.toggleBannerStatus(bannerId); if (res.data.success) { toast.info(res.data.message); fetchBanners(); } }
    catch { toast.error("Failed to toggle banner status"); }
  };

  const handleToggleBlock = async (userId) => {
    try {
      const res = await adminAPI.toggleBlockUser(userId);
      if (res.data.success) {
        toast.success(res.data.message);
        setAllUsers((prev) => prev.map((u) =>
          u.user_id === userId ? { ...u, is_active: res.data.data.is_active } : u
        ));
      }
    } catch (err) { toast.error(err.response?.data?.message || "Failed to update user status"); }
  };

  const handleDeleteBanner     = (id) => setConfirmModal({ isOpen: true, type: "deleteBanner",   id });
  const handleDeleteContact    = (id) => setConfirmModal({ isOpen: true, type: "deleteContact",  id });
  const handleApproveSeller    = (id) => setConfirmModal({ isOpen: true, type: "approveSeller",  id });
  const handleRejectSeller     = (id) => setRejectModal({ isOpen: true, type: "rejectSeller",   id });
  const handleApproveProduct   = (id) => setConfirmModal({ isOpen: true, type: "approveProduct", id });
  const handleRejectProduct    = (id) => setRejectModal({ isOpen: true, type: "rejectProduct",  id });
  const handleDeleteReview     = (id) => setConfirmModal({ isOpen: true, type: "deleteReview",   id });

  const handleContactStatus = async (contactId, status) => {
    try { const res = await adminAPI.updateContactStatus(contactId, { status }); if (res.data.success) { toast.success("Status updated"); fetchContactMessages(); } }
    catch { toast.error("Failed to update status"); }
  };

  const handleOpenReply  = (contact) => setReplyModal({ isOpen: true, contact });
  const handleCloseReply = () => setReplyModal({ isOpen: false, contact: null });
  const handleSendReply  = async (contactId, reply) => {
    try {
      const res = await adminAPI.updateContactStatus(contactId, { status: "in_progress", admin_reply: reply });
      if (res.data.success) { toast.success("Reply sent and email delivered!"); fetchContactMessages(); }
    } catch { toast.error("Failed to send reply"); }
  };

  const handleToggleFeatured = async (productId) => {
    try { const res = await adminAPI.toggleFeatured(productId); if (res.data.success) { toast.info(res.data.message); fetchDashboardData(); } }
    catch (err) { toast.error(err.response?.data?.message || "Failed to update featured status"); }
  };

  const handleConfirmAction = async () => {
    const { type, id } = confirmModal;
    setConfirmModal({ isOpen: false, type: null, id: null });
    try {
      if (type === "deleteBanner")   { const r = await adminAPI.deleteBanner(id);        if (r.data.success) { toast.success("Banner deleted");   fetchBanners(); } }
      if (type === "deleteContact")  { const r = await adminAPI.deleteContactMessage(id); if (r.data.success) { toast.success("Message deleted");  fetchContactMessages(); } }
      if (type === "approveSeller")  { const r = await adminAPI.approveSeller(id);        if (r.data.success) { toast.success("Seller approved");  fetchDashboardData(); fetchAnalytics(); } }
      if (type === "approveProduct") { const r = await adminAPI.approveProduct(id);       if (r.data.success) { toast.success("Product approved"); fetchDashboardData(); fetchAnalytics(); } }
      if (type === "deleteReview")   { const r = await adminAPI.deleteReview(id);         if (r.data.success) { toast.success("Review deleted");   setAllReviews((prev) => prev.filter((rv) => rv.review_id !== id)); } }
    } catch {
      const labels = { deleteBanner: "Failed to delete banner", deleteContact: "Failed to delete message", approveSeller: "Failed to approve seller", approveProduct: "Failed to approve product", deleteReview: "Failed to delete review" };
      toast.error(labels[type] || "Action failed");
    }
  };

  const handleRejectAction = async (reason) => {
    const { type, id } = rejectModal;
    setRejectModal({ isOpen: false, type: null, id: null });
    try {
      if (type === "rejectSeller")  { const r = await adminAPI.rejectSeller(id, { rejection_reason: reason });  if (r.data.success) { toast.success("Seller rejected");  fetchDashboardData(); } }
      if (type === "rejectProduct") { const r = await adminAPI.rejectProduct(id, { rejection_reason: reason }); if (r.data.success) { toast.success("Product rejected"); fetchDashboardData(); } }
    } catch { toast.error("Failed to reject"); }
  };

  const confirmConfig = {
    deleteBanner:   { title: "Delete this banner?",   message: "This action cannot be undone.",                          confirmText: "Delete",  confirmVariant: "danger"  },
    deleteContact:  { title: "Delete this message?",  message: "The message will be permanently removed.",               confirmText: "Delete",  confirmVariant: "danger"  },
    approveSeller:  { title: "Approve this seller?",  message: "They will be able to list products on the marketplace.", confirmText: "Approve", confirmVariant: "warning" },
    approveProduct: { title: "Approve this product?", message: "It will be visible to buyers on the marketplace.",       confirmText: "Approve", confirmVariant: "warning" },
    deleteReview:   { title: "Delete this review?",   message: "This review will be permanently removed.",               confirmText: "Delete",  confirmVariant: "danger"  },
  };
  const rejectConfig = { rejectSeller: { title: "Reject this seller?" }, rejectProduct: { title: "Reject this product?" } };

  // ── Derived: Orders tab ──
  const filteredOrders = useMemo(() => {
    let list = [...allOrders];
    if (orderFilter !== "all") list = list.filter((o) => o.order_status === orderFilter);
    if (orderSearch.trim()) {
      const q = orderSearch.toLowerCase();
      list = list.filter((o) =>
        (o.order_number || "").toLowerCase().includes(q) ||
        (o.user?.full_name || "").toLowerCase().includes(q) ||
        (o.user?.email || "").toLowerCase().includes(q)
      );
    }
    if (orderSort === "newest")  list.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    if (orderSort === "oldest")  list.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
    if (orderSort === "highest") list.sort((a, b) => parseFloat(b.total) - parseFloat(a.total));
    if (orderSort === "lowest")  list.sort((a, b) => parseFloat(a.total) - parseFloat(b.total));
    return list;
  }, [allOrders, orderFilter, orderSearch, orderSort]);
  const totalOrderPages = Math.ceil(filteredOrders.length / ORDERS_PER_PAGE);
  const pagedOrders = filteredOrders.slice((orderPage - 1) * ORDERS_PER_PAGE, orderPage * ORDERS_PER_PAGE);

  // ── Derived: Users tab ──
  const filteredUsers = useMemo(() => {
    let list = [...allUsers];
    if (userFilter === "buyers")   list = list.filter((u) => u.role === "buyer");
    if (userFilter === "sellers")  list = list.filter((u) => u.role === "seller");
    if (userFilter === "admins")   list = list.filter((u) => u.role === "admin");
    if (userFilter === "blocked")  list = list.filter((u) => !u.is_active);
    if (userFilter === "active")   list = list.filter((u) => u.is_active);
    if (userSearch.trim()) {
      const q = userSearch.toLowerCase();
      list = list.filter((u) =>
        (u.full_name || "").toLowerCase().includes(q) ||
        (u.email || "").toLowerCase().includes(q) ||
        (u.phone || "").toLowerCase().includes(q)
      );
    }
    return list;
  }, [allUsers, userFilter, userSearch]);
  const totalUserPages = Math.ceil(filteredUsers.length / USERS_PER_PAGE);
  const pagedUsers = filteredUsers.slice((userPage - 1) * USERS_PER_PAGE, userPage * USERS_PER_PAGE);

  // ── Derived: Sellers tab ──
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
    return list;
  }, [allSellers, sellerFilter, sellerSearch]);
  const totalSellerPages = Math.ceil(filteredSellers.length / SELLERS_PER_PAGE);
  const pagedSellers = filteredSellers.slice((sellerPage - 1) * SELLERS_PER_PAGE, sellerPage * SELLERS_PER_PAGE);

  // ── Derived: Reviews tab ──
  const filteredReviews = useMemo(() => {
    let list = [...allReviews];
    if (reviewFilter !== "all") list = list.filter((r) => String(r.rating) === reviewFilter);
    if (reviewSearch.trim()) {
      const q = reviewSearch.toLowerCase();
      list = list.filter((r) =>
        (r.comment || "").toLowerCase().includes(q) ||
        (r.user?.full_name || "").toLowerCase().includes(q) ||
        (r.product?.name || "").toLowerCase().includes(q)
      );
    }
    return list;
  }, [allReviews, reviewFilter, reviewSearch]);
  const totalReviewPages = Math.ceil(filteredReviews.length / REVIEWS_PER_PAGE);
  const pagedReviews = filteredReviews.slice((reviewPage - 1) * REVIEWS_PER_PAGE, reviewPage * REVIEWS_PER_PAGE);

  const nav = useMemo(() => [
    { key: "overview",    label: "Overview",             icon: Icons.grid,       badge: 0 },
    { key: "sellers",     label: "Artisan Verification", icon: Icons.shield,     badge: pendingSellers.length },
    { key: "products",    label: "Product Approvals",    icon: Icons.box,        badge: pendingProducts.length },
    { key: "featured",    label: "Featured Products",    icon: Icons.star,       badge: 0 },
    { key: "banners",     label: "Festival Banners",     icon: Icons.image,      badge: 0 },
    { key: "contacts",    label: "Contact Messages",     icon: Icons.mail,       badge: 0 },
    { key: "allOrders",   label: "All Orders",           icon: Icons.orders,     badge: 0 },
    { key: "allUsers",    label: "All Users",            icon: Icons.allUsers,   badge: 0 },
    { key: "allSellers",  label: "All Sellers",          icon: Icons.allSellers, badge: 0 },
    { key: "reviews",     label: "Reviews",              icon: Icons.reviews,    badge: 0 },
  ], [pendingSellers.length, pendingProducts.length]);

  if (loading) {
    return (
      <div className="admin-loading">
        <div className="spinner" />
        <p>Loading dashboard…</p>
      </div>
    );
  }

  const sellerRate  = stats.totalSellerProfiles > 0 ? Math.round((stats.approvedSellers / stats.totalSellerProfiles) * 100) : 0;
  const productRate = stats.totalProducts > 0 ? Math.round((stats.approvedProducts / stats.totalProducts) * 100) : 0;
  const filteredMsgs = msgFilter === "all" ? contactMessages : contactMessages.filter((m) => m.status === msgFilter);
  const activeCfg    = confirmConfig[confirmModal.type] || {};
  const activeRejCfg = rejectConfig[rejectModal.type]   || {};
  const chartData    = revenueView === "weekly" ? analytics.dailySales : analytics.monthlySales;
  const chartXKey    = revenueView === "weekly" ? "date" : "month";
  const totalProductsDonut = analytics.productDonut.reduce((s, d) => s + d.value, 0);
  const totalOrdersDonut   = analytics.orderDonut.reduce((s, d) => s + d.value, 0);

  return (
    <div className="admin-dashboard-container">

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title={activeCfg.title}
        message={activeCfg.message}
        confirmText={activeCfg.confirmText}
        cancelText="Cancel"
        confirmVariant={activeCfg.confirmVariant}
        onConfirm={handleConfirmAction}
        onCancel={() => setConfirmModal({ isOpen: false, type: null, id: null })}
      />
      <RejectModal
        isOpen={rejectModal.isOpen}
        title={activeRejCfg.title}
        onConfirm={handleRejectAction}
        onCancel={() => setRejectModal({ isOpen: false, type: null, id: null })}
      />
      <AdminReplyModal
        isOpen={replyModal.isOpen}
        contact={replyModal.contact}
        onClose={handleCloseReply}
        onSend={handleSendReply}
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
            <button
              key={item.key}
              className={`nav-item ${activeTab === item.key ? "active" : ""}`}
              onClick={() => setActiveTab(item.key)}
            >
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
              <div>
                <h1>Dashboard Overview</h1>
                <p>Real-time platform metrics and activity</p>
              </div>
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
              <KpiCard icon={Icons.users}  label="Total Users"    value={stats.totalUsers}         sub={`${stats.totalBuyers} buyers · ${stats.totalSellersUsers} sellers`} accent="#b86e38" />
              <KpiCard icon={Icons.store}  label="Active Sellers" value={stats.approvedSellers}    sub={`${stats.pendingSellers} pending verification`}                     accent="#2a9e6a" />
              <KpiCard icon={Icons.pkg}    label="Total Products" value={stats.totalProducts}      sub={`${stats.approvedProducts} live · ${stats.pendingProducts} pending`}accent="#1a509a" />
              <KpiCard icon={Icons.rupee}  label="Total Revenue"  value={`Rs. ${(analytics.summary.totalRevenue || 0).toLocaleString()}`} sub={`Rs. ${(analytics.summary.thisMonthRevenue || 0).toLocaleString()} this month`} accent="#c08830" />
            </div>

            <div className="charts-row">
              <div className="chart-card chart-card-wide">
                <div className="chart-card-header">
                  <div>
                    <div className="chart-card-title">Revenue & Orders</div>
                    <div className="chart-card-sub">Paid orders over time</div>
                  </div>
                  <div className="chart-toggle">
                    <button className={revenueView === "weekly" ? "active" : ""} onClick={() => setRevenueView("weekly")}>7 Days</button>
                    <button className={revenueView === "monthly" ? "active" : ""} onClick={() => setRevenueView("monthly")}>6 Months</button>
                  </div>
                </div>
                {analyticsLoading ? (
                  <div className="chart-loading"><div className="spinner" /></div>
                ) : chartData.length === 0 ? (
                  <div className="chart-empty">No order data yet</div>
                ) : (
                  <ResponsiveContainer width="100%" height={220}>
                    <AreaChart data={chartData} margin={{ top: 8, right: 8, left: -10, bottom: 0 }}>
                      <defs>
                        <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%"  stopColor="#b86e38" stopOpacity={0.22} />
                          <stop offset="95%" stopColor="#b86e38" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="ordersGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%"  stopColor="#2a9e6a" stopOpacity={0.18} />
                          <stop offset="95%" stopColor="#2a9e6a" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border-light)" />
                      <XAxis dataKey={chartXKey} tick={{ fontSize: 11, fill: "var(--text-3)", fontFamily: "inherit" }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 11, fill: "var(--text-3)", fontFamily: "inherit" }} axisLine={false} tickLine={false} />
                      <Tooltip content={<ChartTooltip prefix="" />} />
                      <Legend wrapperStyle={{ fontSize: "0.72rem", fontFamily: "inherit" }} />
                      <Area type="monotone" dataKey="revenue" name="Revenue (Rs.)" stroke="#b86e38" strokeWidth={2.5} fill="url(#revenueGrad)" dot={false} activeDot={{ r: 5, fill: "#b86e38" }} />
                      <Area type="monotone" dataKey="orders"  name="Orders"        stroke="#2a9e6a" strokeWidth={2}   fill="url(#ordersGrad)"  dot={false} activeDot={{ r: 4, fill: "#2a9e6a" }} />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </div>

              <div className="chart-card chart-card-narrow">
                <div className="chart-card-header">
                  <div>
                    <div className="chart-card-title">Product Status</div>
                    <div className="chart-card-sub">Approval breakdown</div>
                  </div>
                </div>
                {analyticsLoading ? (
                  <div className="chart-loading"><div className="spinner" /></div>
                ) : totalProductsDonut === 0 ? (
                  <div className="chart-empty">No products yet</div>
                ) : (
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
                <div className="chart-card-header">
                  <div>
                    <div className="chart-card-title">Top Categories</div>
                    <div className="chart-card-sub">By approved products</div>
                  </div>
                </div>
                {analyticsLoading ? (
                  <div className="chart-loading"><div className="spinner" /></div>
                ) : analytics.topCategories.length === 0 ? (
                  <div className="chart-empty">No data</div>
                ) : (
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
                <div className="chart-card-header">
                  <div>
                    <div className="chart-card-title">Order Status</div>
                    <div className="chart-card-sub">{analytics.summary.totalOrders} total orders</div>
                  </div>
                </div>
                {analyticsLoading ? (
                  <div className="chart-loading"><div className="spinner" /></div>
                ) : totalOrdersDonut === 0 ? (
                  <div className="chart-empty">No orders yet</div>
                ) : (
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
                <div className="chart-card-header">
                  <div>
                    <div className="chart-card-title">Top Sellers</div>
                    <div className="chart-card-sub">By total sales</div>
                  </div>
                </div>
                {analyticsLoading ? (
                  <div className="chart-loading"><div className="spinner" /></div>
                ) : analytics.topSellers.length === 0 ? (
                  <div className="chart-empty">No sales data</div>
                ) : (
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
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ══ SELLERS (pending verification) ══ */}
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
                  const shopName = seller?.shop_name || "—";
                  return (
                    <div key={seller.seller_id} className="verification-card">
                      <div className="v-left">
                        <div className="v-avatar">{initials(fullName || shopName)}</div>
                        <div>
                          <div className="v-name">{fullName?.trim() || "No name provided"}</div>
                          <div className="v-shop">{shopName}</div>
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
                        <button className="btn-approve" onClick={() => handleApproveSeller(seller.seller_id)}>Approve</button>
                        <button className="btn-reject"  onClick={() => handleRejectSeller(seller.seller_id)}>Reject</button>
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
              <div><h1>Pending Product Approvals</h1><p>{pendingProducts.length} product{pendingProducts.length !== 1 ? "s" : ""} waiting for review</p></div>
            </div>
            {pendingProducts.length === 0 ? (
              <div className="empty-state"><p>No pending products</p></div>
            ) : (
              <div className="table-wrap">
                <table className="admin-table">
                  <thead>
                    <tr><th>Image</th><th>Product Name</th><th>Seller</th><th>Category</th><th>Price</th><th>Discount</th><th>Stock</th><th>Submitted</th><th>Actions</th></tr>
                  </thead>
                  <tbody>
                    {pendingProducts.map((product) => {
                      const d = parseDate(product.created_at || product.createdAt);
                      return (
                        <tr key={product.product_id}>
                          <td><ProductImg src={product.images?.length > 0 ? `${API_URL}${product.images[0]}` : null} alt={product.name} /></td>
                          <td className="td-name">{product.name || "—"}</td>
                          <td>{product?.seller?.user?.full_name || "—"}</td>
                          <td>{product?.category?.name || "—"}</td>
                          <td><PriceCell product={product} /></td>
                          <td><DiscountCell product={product} /></td>
                          <td><span className={product.stock_quantity > 10 ? "stock-good" : product.stock_quantity > 0 ? "stock-low" : "stock-out"}>{product.stock_quantity || 0} units</span></td>
                          <td style={{ color: "var(--text-3)", fontSize: "0.72rem" }}>{d ? d.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" }) : "—"}</td>
                          <td>
                            <div className="actions-cell">
                              <button className="btn-approve" onClick={() => handleApproveProduct(product.product_id)}>Approve</button>
                              <button className="btn-reject"  onClick={() => handleRejectProduct(product.product_id)}>Reject</button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
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
            {allProducts.length === 0 ? (
              <div className="empty-state"><p>No approved products available</p></div>
            ) : (
              <div className="table-wrap">
                <table className="admin-table">
                  <thead><tr><th>Image</th><th>Product Name</th><th>Shop</th><th>Category</th><th>Price</th><th>Discount</th><th>Featured</th><th>Action</th></tr></thead>
                  <tbody>
                    {allProducts.map((product) => (
                      <tr key={product.product_id}>
                        <td><ProductImg src={product.images?.length > 0 ? `${API_URL}${product.images[0]}` : null} alt={product.name} /></td>
                        <td className="td-name">{product.name || "—"}</td>
                        <td>{product?.seller?.shop_name || "—"}</td>
                        <td>{product?.category?.name || "—"}</td>
                        <td><PriceCell product={product} /></td>
                        <td><DiscountCell product={product} /></td>
                        <td>{product.is_featured ? <span className="featured-tag">★ Featured</span> : <span style={{ color: "var(--text-3)", fontSize: "0.72rem" }}>Not featured</span>}</td>
                        <td><button className={product.is_featured ? "btn-reject" : "btn-approve"} onClick={() => handleToggleFeatured(product.product_id)}>{product.is_featured ? "Remove" : "Feature"}</button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ══ BANNERS ══ */}
        {activeTab === "banners" && (
          <div>
            <div className="page-header"><div><h1>Manage Festival Banners</h1><p>Upload banners to display on homepage — recommended 1920×600px</p></div></div>
            <div className="section-card">
              <div className="section-title">Upload New Banner</div>
              <form onSubmit={handleUploadBanner} className="banner-form">
                <div className="form-row">
                  <div className="form-group"><label>Title *</label><input type="text" name="title" required placeholder="e.g. Dashain Festival Sale" /></div>
                  <div className="form-group"><label>Banner Image * (1920×600px recommended)</label><input type="file" name="image" accept="image/*" required /></div>
                </div>
                <div className="form-row">
                  <div className="form-group"><label>Link URL (optional)</label><input type="text" name="link_url" placeholder="/products?category=1 or external URL" /></div>
                  <div className="form-group"><label>Link Type</label><select name="link_type"><option value="none">No Link</option><option value="category">Category</option><option value="product">Product</option><option value="external">External</option></select></div>
                </div>
                <div className="form-group"><label>Description (optional)</label><textarea name="description" rows="3" placeholder="Brief description..." /></div>
                <button type="submit" className="btn-approve" disabled={uploadingBanner} style={{ width: "fit-content", padding: "7px 18px" }}>{uploadingBanner ? "Uploading…" : "Upload Banner"}</button>
              </form>
            </div>
            <div className="section-card">
              <div className="section-title">Existing Banners ({banners.length})</div>
              {banners.length === 0 ? (
                <div className="empty-state" style={{ border: "none", padding: "24px 0 0" }}><p>No banners uploaded yet</p></div>
              ) : (
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
                          <button className="btn-reject" onClick={() => handleDeleteBanner(banner.banner_id)}>Delete</button>
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
            <div className="page-header"><div><h1>Contact Messages</h1><p>{contactMessages.length} message{contactMessages.length !== 1 ? "s" : ""} from users</p></div></div>
            <div className="filter-bar">
              {["all", "pending", "in_progress", "resolved"].map((f) => (
                <button key={f} className={`filter-chip ${msgFilter === f ? "active" : ""}`} onClick={() => setMsgFilter(f)}>
                  {f === "all" ? `All (${contactMessages.length})` : `${f === "in_progress" ? "In Progress" : f.charAt(0).toUpperCase() + f.slice(1)} (${contactMessages.filter((m) => m.status === f).length})`}
                </button>
              ))}
            </div>
            {filteredMsgs.length === 0 ? (
              <div className="no-messages">No {msgFilter !== "all" ? msgFilter.replace("_", " ") : ""} messages found.</div>
            ) : (
              <div className="msg-list">
                {filteredMsgs.map((contact) => {
                  const created = parseDate(contact.created_at);
                  return (
                    <div key={contact.contact_id} className="msg-card">
                      <div className="msg-head">
                        <div>
                          <div className="msg-name">{contact.name}</div>
                          <div className="msg-email">{contact.email}</div>
                          {contact.phone && <div className="msg-phone">{contact.phone}</div>}
                        </div>
                        <div className="msg-meta">
                          <span className={`status-pill s-${contact.status}`}>{contact.status === "in_progress" ? "In Progress" : contact.status}</span>
                          {created && <span className="msg-date">{created.toLocaleDateString()}</span>}
                        </div>
                      </div>
                      <div className="msg-body">
                        <div className="msg-subject"><strong>Subject:</strong> {contact.subject}</div>
                        <div className="msg-text">{contact.message}</div>
                      </div>
                      <div className="msg-actions">
                        <button className="btn-inprogress" onClick={() => handleOpenReply(contact)}>Reply</button>
                        {contact.status === "pending" && (
                          <button className="btn-inprogress" onClick={() => handleContactStatus(contact.contact_id, "in_progress")}>Mark In Progress</button>
                        )}
                        {(contact.status === "pending" || contact.status === "in_progress") && (
                          <button className="btn-resolve" onClick={() => handleContactStatus(contact.contact_id, "resolved")}>Mark Resolved</button>
                        )}
                        {contact.status === "resolved" && (
                          <button className="btn-reopen" onClick={() => handleContactStatus(contact.contact_id, "pending")}>Reopen</button>
                        )}
                        <button className="btn-delete" onClick={() => handleDeleteContact(contact.contact_id)}>Delete</button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ══ ALL ORDERS (C4 NEW) ══ */}
        {activeTab === "allOrders" && (
          <div>
            <div className="page-header">
              <div><h1>All Orders</h1><p>{allOrders.length} total orders on the platform</p></div>
              <button className="btn-refresh" onClick={fetchAllOrders}>{Icons.refresh} Refresh</button>
            </div>

            <div style={{ display: "flex", gap: "0.75rem", marginBottom: "1rem", flexWrap: "wrap", alignItems: "center" }}>
              <SearchInput
                value={orderSearch}
                onChange={(v) => { setOrderSearch(v); setOrderPage(1); }}
                placeholder="Search by order #, customer name or email…"
                theme="admin"
                style={{ flex: 1, minWidth: 260, maxWidth: 400 }}
              />
              <select
                value={orderSort}
                onChange={(e) => { setOrderSort(e.target.value); setOrderPage(1); }}
                style={{ padding: "0.4rem 0.75rem", border: "1.5px solid var(--border, #ddd5c4)", borderRadius: 8, fontSize: "0.8rem", color: "var(--text-2)", background: "var(--bg-card, #fff)", fontFamily: "inherit", cursor: "pointer" }}
              >
                <option value="newest">Newest first</option>
                <option value="oldest">Oldest first</option>
                <option value="highest">Highest amount</option>
                <option value="lowest">Lowest amount</option>
              </select>
            </div>

            <FilterBar
              theme="admin"
              active={orderFilter}
              onChange={(f) => { setOrderFilter(f); setOrderPage(1); }}
              filters={[
                { key: "all",        label: "All",        count: allOrders.length },
                { key: "pending",    label: "Pending",    count: allOrders.filter((o) => o.order_status === "pending").length },
                { key: "processing", label: "Processing", count: allOrders.filter((o) => o.order_status === "processing").length },
                { key: "shipped",    label: "Shipped",    count: allOrders.filter((o) => o.order_status === "shipped").length },
                { key: "delivered",  label: "Delivered",  count: allOrders.filter((o) => o.order_status === "delivered").length },
                { key: "cancelled",  label: "Cancelled",  count: allOrders.filter((o) => o.order_status === "cancelled").length },
              ]}
            />

            {ordersLoading ? (
              <div className="chart-loading"><div className="spinner" /></div>
            ) : pagedOrders.length === 0 ? (
              <div className="empty-state"><p>No orders found</p></div>
            ) : (
              <>
                <div className="table-wrap">
                  <table className="admin-table">
                    <thead>
                      <tr><th>Order #</th><th>Customer</th><th>Items</th><th>Total</th><th>Payment</th><th>Status</th><th>Date</th></tr>
                    </thead>
                    <tbody>
                      {pagedOrders.map((order) => (
                        <tr key={order.order_id}>
                          <td style={{ fontWeight: 700, color: "var(--accent, #b86e38)", fontSize: "0.8rem" }}>#{order.order_number}</td>
                          <td>
                            <div style={{ fontWeight: 600, fontSize: "0.82rem" }}>{order.user?.full_name || "—"}</div>
                            <div style={{ fontSize: "0.72rem", color: "var(--text-3)" }}>{order.user?.email || ""}</div>
                          </td>
                          <td style={{ fontSize: "0.78rem", color: "var(--text-2)" }}>{order.items?.length || 0} item{order.items?.length !== 1 ? "s" : ""}</td>
                          <td style={{ fontWeight: 700, fontSize: "0.82rem" }}>Rs. {parseFloat(order.total || 0).toLocaleString()}</td>
                          <td>
                            <span style={{ padding: "2px 8px", borderRadius: 999, fontSize: "0.72rem", fontWeight: 600, background: order.payment_status === "paid" ? "#d1fae5" : "#fef3c7", color: order.payment_status === "paid" ? "#065f46" : "#92400e" }}>
                              {order.payment_status === "paid" ? "Paid" : "Unpaid"}
                            </span>
                          </td>
                          <td>
                            <span style={{ padding: "2px 8px", borderRadius: 999, fontSize: "0.72rem", fontWeight: 600, background: order.order_status === "delivered" ? "#d1fae5" : order.order_status === "cancelled" ? "#fee2e2" : order.order_status === "shipped" ? "#ede9fe" : "#fef3c7", color: order.order_status === "delivered" ? "#065f46" : order.order_status === "cancelled" ? "#991b1b" : order.order_status === "shipped" ? "#5b21b6" : "#92400e" }}>
                              {order.order_status ? order.order_status.charAt(0).toUpperCase() + order.order_status.slice(1) : "—"}
                            </span>
                          </td>
                          <td style={{ color: "var(--text-3)", fontSize: "0.72rem" }}>{fmtDate(order.created_at)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <Pagination currentPage={orderPage} totalPages={totalOrderPages} onPageChange={setOrderPage} theme="admin" />
              </>
            )}
          </div>
        )}

        {/* ══ ALL USERS (C4 NEW) ══ */}
        {activeTab === "allUsers" && (
          <div>
            <div className="page-header">
              <div><h1>All Users</h1><p>{allUsers.length} registered users</p></div>
              <button className="btn-refresh" onClick={fetchAllUsers}>{Icons.refresh} Refresh</button>
            </div>

            <div style={{ marginBottom: "0.75rem" }}>
              <SearchInput
                value={userSearch}
                onChange={(v) => { setUserSearch(v); setUserPage(1); }}
                placeholder="Search by name, email or phone…"
                theme="admin"
                style={{ maxWidth: 400 }}
              />
            </div>

            <FilterBar
              theme="admin"
              active={userFilter}
              onChange={(f) => { setUserFilter(f); setUserPage(1); }}
              filters={[
                { key: "all",     label: "All",     count: allUsers.length },
                { key: "buyers",  label: "Buyers",  count: allUsers.filter((u) => u.role === "buyer").length },
                { key: "sellers", label: "Sellers", count: allUsers.filter((u) => u.role === "seller").length },
                { key: "active",  label: "Active",  count: allUsers.filter((u) => u.is_active).length },
                { key: "blocked", label: "Blocked", count: allUsers.filter((u) => !u.is_active).length },
              ]}
            />

            {usersLoading ? (
              <div className="chart-loading"><div className="spinner" /></div>
            ) : pagedUsers.length === 0 ? (
              <div className="empty-state"><p>No users found</p></div>
            ) : (
              <>
                <div className="table-wrap">
                  <table className="admin-table">
                    <thead>
                      <tr><th>User</th><th>Email</th><th>Phone</th><th>Role</th><th>Status</th><th>Joined</th><th>Action</th></tr>
                    </thead>
                    <tbody>
                      {pagedUsers.map((user) => (
                        <tr key={user.user_id}>
                          <td>
                            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                              <div style={{ width: 32, height: 32, borderRadius: "50%", background: "var(--accent-light, #f5ede4)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: "0.75rem", color: "var(--accent, #b86e38)", flexShrink: 0 }}>
                                {initials(user.full_name)}
                              </div>
                              <span style={{ fontWeight: 600, fontSize: "0.82rem" }}>{user.full_name || "—"}</span>
                            </div>
                          </td>
                          <td style={{ fontSize: "0.78rem", color: "var(--text-2)" }}>{user.email}</td>
                          <td style={{ fontSize: "0.78rem", color: "var(--text-3)" }}>{user.phone || "—"}</td>
                          <td>
                            <span style={{ padding: "2px 8px", borderRadius: 999, fontSize: "0.72rem", fontWeight: 600, background: user.role === "admin" ? "#ede9fe" : user.role === "seller" ? "#fef3c7" : "#d1fae5", color: user.role === "admin" ? "#5b21b6" : user.role === "seller" ? "#92400e" : "#065f46" }}>
                              {user.role}
                            </span>
                          </td>
                          <td>
                            <span style={{ padding: "2px 8px", borderRadius: 999, fontSize: "0.72rem", fontWeight: 600, background: user.is_active ? "#d1fae5" : "#fee2e2", color: user.is_active ? "#065f46" : "#991b1b" }}>
                              {user.is_active ? "Active" : "Blocked"}
                            </span>
                          </td>
                          <td style={{ color: "var(--text-3)", fontSize: "0.72rem" }}>{fmtDate(user.created_at || user.createdAt)}</td>
                          <td>
                            {user.role !== "admin" && (
                              <button
                                className={user.is_active ? "btn-reject" : "btn-approve"}
                                onClick={() => handleToggleBlock(user.user_id)}
                                style={{ fontSize: "0.75rem", padding: "4px 10px" }}
                              >
                                {user.is_active ? "Block" : "Unblock"}
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <Pagination currentPage={userPage} totalPages={totalUserPages} onPageChange={setUserPage} theme="admin" />
              </>
            )}
          </div>
        )}

        {/* ══ ALL SELLERS (C4 NEW) ══ */}
        {activeTab === "allSellers" && (
          <div>
            <div className="page-header">
              <div><h1>All Sellers</h1><p>{allSellers.length} registered seller profiles</p></div>
              <button className="btn-refresh" onClick={fetchAllSellers}>{Icons.refresh} Refresh</button>
            </div>

            <div style={{ marginBottom: "0.75rem" }}>
              <SearchInput
                value={sellerSearch}
                onChange={(v) => { setSellerSearch(v); setSellerPage(1); }}
                placeholder="Search by shop name, owner name, email or city…"
                theme="admin"
                style={{ maxWidth: 420 }}
              />
            </div>

            <FilterBar
              theme="admin"
              active={sellerFilter}
              onChange={(f) => { setSellerFilter(f); setSellerPage(1); }}
              filters={[
                { key: "all",      label: "All",      count: allSellers.length },
                { key: "approved", label: "Approved", count: allSellers.filter((s) => s.approval_status === "approved").length },
                { key: "pending",  label: "Pending",  count: allSellers.filter((s) => s.approval_status === "pending").length },
                { key: "rejected", label: "Rejected", count: allSellers.filter((s) => s.approval_status === "rejected").length },
              ]}
            />

            {sellersLoading ? (
              <div className="chart-loading"><div className="spinner" /></div>
            ) : pagedSellers.length === 0 ? (
              <div className="empty-state"><p>No sellers found</p></div>
            ) : (
              <>
                <div className="table-wrap">
                  <table className="admin-table">
                    <thead>
                      <tr><th>Shop</th><th>Owner</th><th>Email</th><th>City</th><th>Bank</th><th>Status</th><th>Joined</th></tr>
                    </thead>
                    <tbody>
                      {pagedSellers.map((seller) => (
                        <tr key={seller.seller_id}>
                          <td>
                            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                              {seller.shop_logo ? (
                                <img src={`${API_URL}${seller.shop_logo}`} alt={seller.shop_name} style={{ width: 32, height: 32, borderRadius: 6, objectFit: "cover", flexShrink: 0 }} onError={(e) => { e.currentTarget.style.display = "none"; }} />
                              ) : (
                                <div style={{ width: 32, height: 32, borderRadius: 6, background: "var(--accent-light, #f5ede4)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: "0.75rem", color: "var(--accent, #b86e38)", flexShrink: 0 }}>
                                  {(seller.shop_name || "?")[0].toUpperCase()}
                                </div>
                              )}
                              <span style={{ fontWeight: 600, fontSize: "0.82rem" }}>{seller.shop_name || "—"}</span>
                            </div>
                          </td>
                          <td style={{ fontSize: "0.82rem" }}>{seller.user?.full_name || "—"}</td>
                          <td style={{ fontSize: "0.78rem", color: "var(--text-3)" }}>{seller.user?.email || "—"}</td>
                          <td style={{ fontSize: "0.78rem", color: "var(--text-2)" }}>{seller.city || "—"}</td>
                          <td style={{ fontSize: "0.78rem", color: "var(--text-3)" }}>{seller.bank_name || "—"}</td>
                          <td>
                            <span style={{ padding: "2px 8px", borderRadius: 999, fontSize: "0.72rem", fontWeight: 600, background: seller.approval_status === "approved" ? "#d1fae5" : seller.approval_status === "rejected" ? "#fee2e2" : "#fef3c7", color: seller.approval_status === "approved" ? "#065f46" : seller.approval_status === "rejected" ? "#991b1b" : "#92400e" }}>
                              {seller.approval_status}
                            </span>
                          </td>
                          <td style={{ color: "var(--text-3)", fontSize: "0.72rem" }}>{fmtDate(seller.created_at)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <Pagination currentPage={sellerPage} totalPages={totalSellerPages} onPageChange={setSellerPage} theme="admin" />
              </>
            )}
          </div>
        )}

        {/* ══ REVIEWS MODERATION (C4 NEW) ══ */}
        {activeTab === "reviews" && (
          <div>
            <div className="page-header">
              <div><h1>Reviews Moderation</h1><p>{allReviews.length} total reviews on the platform</p></div>
              <button className="btn-refresh" onClick={fetchAllReviews}>{Icons.refresh} Refresh</button>
            </div>

            <div style={{ marginBottom: "0.75rem" }}>
              <SearchInput
                value={reviewSearch}
                onChange={(v) => { setReviewSearch(v); setReviewPage(1); }}
                placeholder="Search by review text, customer or product…"
                theme="admin"
                style={{ maxWidth: 420 }}
              />
            </div>

            <FilterBar
              theme="admin"
              active={reviewFilter}
              onChange={(f) => { setReviewFilter(f); setReviewPage(1); }}
              filters={[
                { key: "all", label: "All Stars", count: allReviews.length },
                { key: "5",   label: "★★★★★",     count: allReviews.filter((r) => r.rating === 5).length },
                { key: "4",   label: "★★★★",       count: allReviews.filter((r) => r.rating === 4).length },
                { key: "3",   label: "★★★",         count: allReviews.filter((r) => r.rating === 3).length },
                { key: "2",   label: "★★",           count: allReviews.filter((r) => r.rating === 2).length },
                { key: "1",   label: "★",             count: allReviews.filter((r) => r.rating === 1).length },
              ]}
            />

            {reviewsLoading ? (
              <div className="chart-loading"><div className="spinner" /></div>
            ) : pagedReviews.length === 0 ? (
              <div className="empty-state"><p>No reviews found</p></div>
            ) : (
              <>
                <div className="table-wrap">
                  <table className="admin-table">
                    <thead>
                      <tr><th>Product</th><th>Customer</th><th>Rating</th><th>Review</th><th>Date</th><th>Action</th></tr>
                    </thead>
                    <tbody>
                      {pagedReviews.map((review) => (
                        <tr key={review.review_id}>
                          <td>
                            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                              {review.product?.images?.[0] && (
                                <img src={`${API_URL}${review.product.images[0]}`} alt={review.product.name} style={{ width: 32, height: 32, borderRadius: 6, objectFit: "cover", flexShrink: 0 }} onError={(e) => { e.currentTarget.style.display = "none"; }} />
                              )}
                              <span style={{ fontWeight: 600, fontSize: "0.8rem" }}>{review.product?.name || "—"}</span>
                            </div>
                          </td>
                          <td style={{ fontSize: "0.82rem" }}>{review.user?.full_name || "—"}</td>
                          <td><StarRating rating={review.rating} /></td>
                          <td style={{ fontSize: "0.78rem", color: "var(--text-2)", maxWidth: 280 }}>
                            <div style={{ overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>
                              {review.comment || <span style={{ color: "var(--text-3)", fontStyle: "italic" }}>No comment</span>}
                            </div>
                          </td>
                          <td style={{ color: "var(--text-3)", fontSize: "0.72rem" }}>{fmtDate(review.created_at)}</td>
                          <td>
                            <button className="btn-reject" onClick={() => handleDeleteReview(review.review_id)} style={{ fontSize: "0.75rem", padding: "4px 10px" }}>Delete</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <Pagination currentPage={reviewPage} totalPages={totalReviewPages} onPageChange={setReviewPage} theme="admin" />
              </>
            )}
          </div>
        )}

      </main>
    </div>
  );
};

export default AdminDashboard;