import React, { useEffect, useMemo, useState, useCallback } from "react";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import { adminAPI, productAPI } from "../api/axios";
import { useToast } from "../context/ToastContext";
import ConfirmModal from "../components/ConfirmModal";
import "../styles/AdminDashboard.css";

/* ── SVG icons ── */
const Icons = {
  grid: (<svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></svg>),
  shield: (<svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L3 7v5c0 5.25 3.75 10.15 9 11.35C17.25 22.15 21 17.25 21 12V7l-9-5z"/></svg>),
  box: (<svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>),
  star: (<svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>),
  image: (<svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>),
  mail: (<svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>),
  refresh: (<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 11-2.12-9.36L23 10"/></svg>),
  trending: (<svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>),
  users: (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>),
  store: (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>),
  pkg: (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/></svg>),
  rupee: (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><line x1="6" y1="4" x2="18" y2="4"/><line x1="6" y1="9" x2="18" y2="9"/><path d="M6 14l6 6 6-6"/><path d="M6 9c0 3.314 2.686 5 6 5s6-1.686 6-5"/></svg>),
};

/* ── Donut chart center label ── */
const DonutLabel = ({ cx, cy, value, label }) => (
  <g>
    <text x={cx} y={cy - 8} textAnchor="middle" fill="var(--text-1)" fontSize="1.5rem" fontWeight="800" fontFamily="inherit">{value}</text>
    <text x={cx} y={cy + 12} textAnchor="middle" fill="var(--text-3)" fontSize="0.62rem" fontWeight="600" fontFamily="inherit" textTransform="uppercase" letterSpacing="0.05em">{label}</text>
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
        <textarea value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Enter rejection reason..." rows={3}
          style={{ width: "100%", padding: "0.6rem 0.75rem", borderRadius: "10px", border: "1.5px solid #e5e7eb", fontSize: "0.875rem", resize: "vertical", marginBottom: "1.2rem", fontFamily: "inherit", outline: "none", boxSizing: "border-box" }}
          onFocus={(e) => (e.target.style.borderColor = "#f59e0b")}
          onBlur={(e) => (e.target.style.borderColor = "#e5e7eb")}
          autoFocus
        />
        <div className="cm-actions">
          <button className="cm-btn cm-cancel" onClick={onCancel}>Cancel</button>
          <button className="cm-btn cm-confirm cm-warning" onClick={() => { if (reason.trim()) onConfirm(reason.trim()); }}
            disabled={!reason.trim()} style={{ opacity: reason.trim() ? 1 : 0.5, cursor: reason.trim() ? "pointer" : "not-allowed" }}>
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
  const [msgFilter, setMsgFilter] = useState("all");
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const [revenueView, setRevenueView] = useState("weekly"); // "weekly" | "monthly"

  const [stats, setStats] = useState({
    totalUsers: 0, totalSellersUsers: 0, totalBuyers: 0,
    totalSellerProfiles: 0, pendingSellers: 0, approvedSellers: 0,
    totalProducts: 0, pendingProducts: 0, approvedProducts: 0, rejectedProducts: 0,
  });

  const [analytics, setAnalytics] = useState({
    dailySales: [],
    monthlySales: [],
    productDonut: [],
    orderDonut: [],
    topCategories: [],
    topSellers: [],
    summary: { totalRevenue: 0, thisMonthRevenue: 0, totalOrders: 0 },
  });

  const [pendingSellers, setPendingSellers] = useState([]);
  const [pendingProducts, setPendingProducts] = useState([]);
  const [allProducts, setAllProducts] = useState([]);
  const [banners, setBanners] = useState([]);
  const [contactMessages, setContactMessages] = useState([]);

  const [confirmModal, setConfirmModal] = useState({ isOpen: false, type: null, id: null });
  const [rejectModal, setRejectModal] = useState({ isOpen: false, type: null, id: null });

  const API_URL = "http://localhost:5000";

  // Chart colors — all harmonious with the existing warm palette
  const CHART_COLORS = {
    accent: "#b86e38",
    green: "#2a9e6a",
    amber: "#c08830",
    blue: "#1a509a",
    red: "#aa2c1c",
    purple: "#6b4fa0",
  };

  const DONUT_COLORS_PRODUCT = ["#2a9e6a", "#c08830", "#aa2c1c"];
  const DONUT_COLORS_ORDER   = ["#c08830", "#1a509a", "#2a9e6a", "#aa2c1c", "#b86e38"];

  useEffect(() => {
    fetchDashboardData();
    fetchAnalytics();
    fetchBanners();
    fetchContactMessages();
    // eslint-disable-next-line
  }, []);

  const safe = (v) => { if (v == null) return "—"; const s = String(v).trim(); return s || "—"; };
  const parseDate = (raw) => { if (!raw) return null; const d = new Date(raw); return isNaN(d.getTime()) ? null : d; };
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

  const handleRefresh = () => { fetchDashboardData(); fetchAnalytics(); };

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

  const handleDeleteBanner        = (id) => setConfirmModal({ isOpen: true, type: "deleteBanner", id });
  const handleContactStatus       = async (contactId, status) => {
    try { const res = await adminAPI.updateContactStatus(contactId, { status }); if (res.data.success) { toast.success("Status updated"); fetchContactMessages(); } }
    catch { toast.error("Failed to update status"); }
  };
  const handleDeleteContact       = (id) => setConfirmModal({ isOpen: true, type: "deleteContact", id });
  const handleApproveSeller       = (id) => setConfirmModal({ isOpen: true, type: "approveSeller", id });
  const handleRejectSeller        = (id) => setRejectModal({ isOpen: true, type: "rejectSeller", id });
  const handleApproveProduct      = (id) => setConfirmModal({ isOpen: true, type: "approveProduct", id });
  const handleRejectProduct       = (id) => setRejectModal({ isOpen: true, type: "rejectProduct", id });
  const handleToggleFeatured      = async (productId) => {
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
    } catch {
      const labels = { deleteBanner: "Failed to delete banner", deleteContact: "Failed to delete message", approveSeller: "Failed to approve seller", approveProduct: "Failed to approve product" };
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
  };
  const rejectConfig = { rejectSeller: { title: "Reject this seller?" }, rejectProduct: { title: "Reject this product?" } };

  const nav = useMemo(() => [
    { key: "overview",  label: "Overview",             icon: Icons.grid,   badge: 0 },
    { key: "sellers",   label: "Artisan Verification", icon: Icons.shield, badge: pendingSellers.length },
    { key: "products",  label: "Product Approvals",    icon: Icons.box,    badge: pendingProducts.length },
    { key: "featured",  label: "Featured Products",    icon: Icons.star,   badge: 0 },
    { key: "banners",   label: "Festival Banners",     icon: Icons.image,  badge: 0 },
    { key: "contacts",  label: "Contact Messages",     icon: Icons.mail,   badge: 0 },
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

  const chartData = revenueView === "weekly" ? analytics.dailySales : analytics.monthlySales;
  const chartXKey = revenueView === "weekly" ? "date" : "month";

  /* ── Total for donut center labels ── */
  const totalProductsDonut = analytics.productDonut.reduce((s, d) => s + d.value, 0);
  const totalOrdersDonut   = analytics.orderDonut.reduce((s, d) => s + d.value, 0);

  /* ════════════════════ RENDER ════════════════════ */
  return (
    <div className="admin-dashboard-container">

      <ConfirmModal isOpen={confirmModal.isOpen} title={activeCfg.title} message={activeCfg.message}
        confirmText={activeCfg.confirmText} cancelText="Cancel" confirmVariant={activeCfg.confirmVariant}
        onConfirm={handleConfirmAction} onCancel={() => setConfirmModal({ isOpen: false, type: null, id: null })} />
      <RejectModal isOpen={rejectModal.isOpen} title={activeRejCfg.title}
        onConfirm={handleRejectAction} onCancel={() => setRejectModal({ isOpen: false, type: null, id: null })} />

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
            {/* Header */}
            <div className="page-header">
              <div>
                <h1>Dashboard Overview</h1>
                <p>Real-time platform metrics and activity</p>
              </div>
              <button className="btn-refresh" onClick={handleRefresh}>{Icons.refresh} Refresh</button>
            </div>

            {/* Pending alert */}
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

            {/* ── KPI Row ── */}
            <div className="kpi-grid">
              <KpiCard icon={Icons.users}  label="Total Users"     value={stats.totalUsers}          sub={`${stats.totalBuyers} buyers · ${stats.totalSellersUsers} sellers`} accent="#b86e38" />
              <KpiCard icon={Icons.store}  label="Active Sellers"  value={stats.approvedSellers}     sub={`${stats.pendingSellers} pending verification`}                      accent="#2a9e6a" />
              <KpiCard icon={Icons.pkg}    label="Total Products"  value={stats.totalProducts}       sub={`${stats.approvedProducts} live · ${stats.pendingProducts} pending`} accent="#1a509a" />
              <KpiCard icon={Icons.rupee}  label="Total Revenue"   value={`Rs. ${(analytics.summary.totalRevenue || 0).toLocaleString()}`} sub={`Rs. ${(analytics.summary.thisMonthRevenue || 0).toLocaleString()} this month`} accent="#c08830" />
            </div>

            {/* ── Revenue Chart + Product Donut ── */}
            <div className="charts-row">
              {/* Area/Bar Revenue */}
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

              {/* Product Status Donut */}
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
                        <Pie data={analytics.productDonut} cx="50%" cy="50%" innerRadius={55} outerRadius={78}
                          paddingAngle={3} dataKey="value" strokeWidth={0}>
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

            {/* ── Bottom Row: Bar Chart + Order Donut + Top Sellers ── */}
            <div className="charts-row charts-row-3">
              {/* Top Categories Bar */}
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

              {/* Order Status Donut */}
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
                        <Pie data={analytics.orderDonut} cx="50%" cy="50%" innerRadius={45} outerRadius={65}
                          paddingAngle={3} dataKey="value" strokeWidth={0}>
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

              {/* Top Sellers */}
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

            {/* ── Approval Rates ── */}
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

        {/* ══ SELLERS ══ */}
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
              {banners.length === 0 ? <div className="empty-state" style={{ border: "none", padding: "24px 0 0" }}><p>No banners uploaded yet</p></div> : (
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
            {filteredMsgs.length === 0 ? <div className="no-messages">No {msgFilter !== "all" ? msgFilter.replace("_", " ") : ""} messages found.</div> : (
              <div className="msg-list">
                {filteredMsgs.map((contact) => {
                  const created = parseDate(contact.created_at);
                  return (
                    <div key={contact.contact_id} className="msg-card">
                      <div className="msg-head">
                        <div><div className="msg-name">{contact.name}</div><div className="msg-email">{contact.email}</div>{contact.phone && <div className="msg-phone">{contact.phone}</div>}</div>
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
                        {contact.status === "pending"     && <button className="btn-inprogress" onClick={() => handleContactStatus(contact.contact_id, "in_progress")}>Mark In Progress</button>}
                        {(contact.status === "pending" || contact.status === "in_progress") && <button className="btn-resolve" onClick={() => handleContactStatus(contact.contact_id, "resolved")}>Mark Resolved</button>}
                        {contact.status === "resolved"    && <button className="btn-reopen"    onClick={() => handleContactStatus(contact.contact_id, "pending")}>Reopen</button>}
                        <button className="btn-delete" onClick={() => handleDeleteContact(contact.contact_id)}>Delete</button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

      </main>
    </div>
  );
};

export default AdminDashboard;