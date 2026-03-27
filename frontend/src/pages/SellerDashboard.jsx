import React, { useState, useEffect } from "react";
import {
  BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area, Legend, LineChart, Line,
} from "recharts";
import { productAPI, orderAPI, sellerAPI, auctionAPI, reviewAPI } from "../api/axios";
import { useToast } from "../context/ToastContext";
import { useTranslation } from "react-i18next";
import ConfirmModal from "../components/ConfirmModal";
import { Pagination, FilterBar, SearchInput, SortSelect, DateRangePicker, filterByDateRange } from "../components/SharedComponents";
import "../styles/SellerDashboard.css";
import SellerMyBlogs from "../components/SellerMyBlogs";
import { Link } from "react-router-dom";

const API_URL = "http://localhost:5000";

const Icons = {
  overview:  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></svg>,
  analytics: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>,
  orders:    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/></svg>,
  products:  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/></svg>,
  shop:      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>,
  add:       <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>,
  auction:   <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2.5l7 7-7 7"/><path d="M9.5 7.5L2.5 14.5"/><path d="M6 21h12"/><path d="M12 17v4"/></svg>,
  trendUp:   <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>,
  trendDown: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 18 13.5 8.5 8.5 13.5 1 6"/><polyline points="17 18 23 18 23 12"/></svg>,
  blog:      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>,
  reviews:   <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>,
  arrow:     <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>,
};

const STATUS_COLORS = { delivered: "#10B981", pending: "#F59E0B", processing: "#3B82F6", shipped: "#8B5CF6", cancelled: "#EF4444" };
const DONUT_COLORS  = ["#10B981", "#F59E0B", "#3B82F6", "#8B5CF6", "#EF4444"];

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

const ChartTip = ({ active, payload, label, prefix = "" }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: "#fff", border: "1px solid #E8E5E1", borderRadius: 8, padding: "8px 14px", fontSize: "0.75rem", boxShadow: "0 4px 16px rgba(0,0,0,0.10)" }}>
      <p style={{ color: "#8B6F5E", marginBottom: 4, fontWeight: 700 }}>{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color, fontWeight: 700, margin: "2px 0" }}>
          {p.name}: {prefix}{typeof p.value === "number" ? p.value.toLocaleString() : p.value}
        </p>
      ))}
    </div>
  );
};

const KpiCard = ({ label, value, meta, color, trend, onClick }) => (
  <div className={`sd-kpi-card sd-kpi-${color}`} onClick={onClick} style={onClick ? { cursor: "pointer" } : {}}>
    <div className="sd-kpi-label">{label}</div>
    <div className="sd-kpi-value">{value}</div>
    {trend !== undefined && trend !== null ? (
      <div className={`sd-kpi-trend ${trend >= 0 ? "up" : "down"}`}>
        <span className="sd-kpi-trend-icon">{trend >= 0 ? Icons.trendUp : Icons.trendDown}</span>
        {Math.abs(trend)}% vs last month
      </div>
    ) : (
      meta && <div className="sd-kpi-meta">{meta}</div>
    )}
  </div>
);

const StarRating = ({ rating }) => {
  const r = parseInt(rating) || 0;
  return (
    <div style={{ display: "flex", gap: 1, alignItems: "center" }}>
      {[1,2,3,4,5].map((s) => (
        <span key={s} style={{ fontSize: "0.85rem", color: s <= r ? "#c08830" : "#ddd5c4" }}>★</span>
      ))}
      <span style={{ fontSize: "0.72rem", color: "#8B6F5E", marginLeft: 4 }}>{r}/5</span>
    </div>
  );
};

// ✅ Review Reply Modal — maxLength={500} added to textarea
const ReviewReplyModal = ({ modal, setModal, onSubmit, loading }) => {
  if (!modal.open || !modal.review) return null;
  return (
    <div
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999, padding: "1rem" }}
      onClick={() => setModal({ open: false, review: null, text: "" })}
    >
      <div
        style={{ background: "#fff", borderRadius: 16, padding: "1.75rem", maxWidth: 520, width: "100%", boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 style={{ fontSize: "1.05rem", fontWeight: 700, color: "#2C1810", marginBottom: "0.5rem" }}>Reply to Review</h3>
        <p style={{ fontSize: "0.78rem", color: "#8B6F5E", marginBottom: "0.75rem" }}>
          by {modal.review.user?.full_name || "Customer"} · {modal.review.product?.name}
        </p>
        <div style={{ background: "#faf7f2", border: "1px solid #e8e0d5", borderRadius: 8, padding: "0.75rem 1rem", marginBottom: "1rem", fontSize: "0.82rem", color: "#5a3e26", lineHeight: 1.6 }}>
          <div style={{ fontSize: "0.6rem", fontWeight: 700, color: "#9a8268", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 5 }}>Their Review</div>
          {modal.review.comment || "(no comment)"}
        </div>
        {/* FIX 1: maxLength={500} added */}
        <textarea
          value={modal.text}
          onChange={(e) => setModal((m) => ({ ...m, text: e.target.value }))}
          rows={4}
          maxLength={500}
          placeholder="Write your reply…"
          autoFocus
          style={{ width: "100%", padding: "0.65rem 0.875rem", border: "1.5px solid #ddd5c4", borderRadius: 8, fontSize: "0.875rem", fontFamily: "inherit", resize: "vertical", outline: "none", boxSizing: "border-box", color: "#2C1810" }}
          onFocus={(e) => (e.target.style.borderColor = "#b86e38")}
          onBlur={(e)  => (e.target.style.borderColor = "#ddd5c4")}
        />
        <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end", marginTop: "1rem" }}>
          <button
            style={{ padding: "0.5rem 1rem", border: "1.5px solid #ddd5c4", background: "#fff", borderRadius: 8, cursor: "pointer", fontSize: "0.875rem", fontFamily: "inherit" }}
            onClick={() => setModal({ open: false, review: null, text: "" })}
          >Cancel</button>
          <button
            style={{ padding: "0.5rem 1.25rem", background: "#b86e38", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer", fontSize: "0.875rem", fontWeight: 600, fontFamily: "inherit", opacity: (!modal.text.trim() || loading) ? 0.5 : 1 }}
            disabled={!modal.text.trim() || loading}
            onClick={onSubmit}
          >{loading ? "Posting…" : "Post Reply"}</button>
        </div>
      </div>
    </div>
  );
};

/* ══════════════════════════════════════════ */
const SellerDashboard = () => {
  const toast = useToast();
  const { t } = useTranslation();

  const [activeTab, setActiveTab]             = useState("overview");
  const [loading, setLoading]                 = useState(true);
  const [products, setProducts]               = useState([]);
  const [orders, setOrders]                   = useState([]);
  const [reviews, setReviews]                 = useState([]);
  const [reviewsLoading, setReviewsLoading]   = useState(false);
  const [auctions, setAuctions]               = useState([]);
  const [auctionsLoading, setAuctionsLoading] = useState(false);
  const [stats, setStats]                     = useState({ totalSales: 0, totalOrders: 0, activeProducts: 0, pendingProducts: 0 });
  const [analytics, setAnalytics]             = useState({
    kpis: { totalRevenue: 0, thisMonthRevenue: 0, lastMonthRevenue: 0, momGrowth: 0, aov: 0, fulfillmentRate: 0, cancellationRate: 0, totalOrders: 0, deliveredOrders: 0 },
    revenueByMonth: [], revenueByWeek: [], topProducts: [],
    ordersByStatus: [], revenueByDow: [], stockHealth: [],
  });
  const [analyticsLoaded, setAnalyticsLoaded] = useState(false);
  const [confirmModal, setConfirmModal]       = useState({ isOpen: false, productId: null, type: "product", auctionId: null, auctionAction: null });

  const [auctionActionLoading, setAuctionActionLoading] = useState({});

  const [reviewReplyModal, setReviewReplyModal]   = useState({ open: false, review: null, text: "" });
  const [reviewReplyLoading, setReviewReplyLoading] = useState(false);

  // Orders tab
  const [orderSearch, setOrderSearch]   = useState("");
  const [orderFilter, setOrderFilter]   = useState("all");
  const [orderSort, setOrderSort]       = useState("newest");
  const [orderDate, setOrderDate]       = useState({ startDate: "", endDate: "" });
  const [orderPage, setOrderPage]       = useState(1);
  const ORDERS_PER_PAGE = 10;

  // Products tab
  const [productSearch, setProductSearch] = useState("");
  const [productFilter, setProductFilter] = useState("all");
  const [productSort, setProductSort]     = useState("newest");
  const [productPage, setProductPage]     = useState(1);
  const PRODUCTS_PER_PAGE = 12;

  // Reviews tab
  const [reviewSearch, setReviewSearch] = useState("");
  const [reviewRating, setReviewRating] = useState("all");
  const [reviewSort, setReviewSort]     = useState("newest");
  const [reviewPage, setReviewPage]     = useState(1);
  const REVIEWS_PER_PAGE = 10;

  // Auctions tab
  const [auctionSearch, setAuctionSearch] = useState("");
  const [auctionFilter, setAuctionFilter] = useState("all");
  const [auctionSort, setAuctionSort]     = useState("newest");
  const [auctionPage, setAuctionPage]     = useState(1);
  const AUCTIONS_PER_PAGE = 10;

  useEffect(() => { fetchAll(); }, []);

  useEffect(() => {
    if (activeTab === "reviews" && reviews.length === 0 && !reviewsLoading) fetchReviews();
    if (activeTab === "auctions" && auctions.length === 0 && !auctionsLoading) fetchAuctions();
  }, [activeTab]);

  const fetchAll = async () => {
    try {
      setLoading(true);
      const [productRes, orderRes] = await Promise.all([
        productAPI.getSellerProducts(),
        orderAPI.getSellerOrders(),
      ]);
      if (productRes.data.success) {
        const prods = productRes.data.data.products || [];
        setProducts(prods);
        setStats((s) => ({ ...s, activeProducts: prods.filter((p) => p.status === "approved").length, pendingProducts: prods.filter((p) => p.status === "pending").length }));
      }
      if (orderRes.data.success) {
        const { orders: ords, stats: st } = orderRes.data.data;
        setOrders(ords || []);
        setStats((s) => ({ ...s, totalSales: st.total_sales || 0, totalOrders: st.total_orders || 0 }));
      }
      try {
        const anaRes = await sellerAPI.getAnalytics();
        if (anaRes.data.success) { setAnalytics(anaRes.data.data); setAnalyticsLoaded(true); }
      } catch (e) {
        console.warn("Analytics endpoint failed:", e.message);
        const ords = orderRes.data?.data?.orders || [];
        const statusMap = {};
        ords.forEach((o) => { const st = o.order?.order_status || "pending"; statusMap[st] = (statusMap[st] || 0) + 1; });
        setAnalytics((a) => ({ ...a, ordersByStatus: Object.entries(statusMap).map(([status, count]) => ({ status, count })) }));
      }
      setOrderPage(1); setProductPage(1);
    } catch (err) { console.error("Dashboard fetch error:", err); }
    finally { setLoading(false); }
  };

  const fetchReviews = async () => {
    try {
      setReviewsLoading(true);
      const res = await sellerAPI.getMyReviews();
      if (res.data.success) setReviews(res.data.data || []);
    } catch (err) { console.warn("Reviews fetch failed:", err.message); setReviews([]); }
    finally { setReviewsLoading(false); }
  };

  const fetchAuctions = async () => {
    try {
      setAuctionsLoading(true);
      const res = await auctionAPI.getSellerAuctions();
      if (res.data.success) setAuctions(res.data.data || []);
    } catch (err) { console.warn("Auctions fetch failed:", err.message); setAuctions([]); }
    finally { setAuctionsLoading(false); }
  };

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      const res = await orderAPI.updateOrderStatus(orderId, { order_status: newStatus });
      if (res.data.success) { toast.success("Order status updated"); fetchAll(); }
    } catch { toast.error("Failed to update order status"); }
  };

  const handleDeleteConfirm = async () => {
    if (confirmModal.type === "auction") {
      const { auctionId, auctionAction } = confirmModal;
      setConfirmModal({ isOpen: false, productId: null, type: "product", auctionId: null, auctionAction: null });
      setAuctionActionLoading((prev) => ({ ...prev, [auctionId]: auctionAction === "cancel" ? "cancelling" : "deleting" }));
      try {
        if (auctionAction === "cancel") {
          const res = await auctionAPI.cancelAuction(auctionId);
          if (res.data.success) { toast.success("Auction cancelled"); fetchAuctions(); }
        } else if (auctionAction === "delete") {
          const res = await auctionAPI.deleteSellerAuction(auctionId);
          if (res.data.success) { toast.success("Auction deleted"); fetchAuctions(); }
        }
      } catch (err) {
        toast.error(err.response?.data?.message || `Failed to ${auctionAction} auction`);
      } finally {
        setAuctionActionLoading((prev) => ({ ...prev, [auctionId]: null }));
      }
      return;
    }
    const { productId } = confirmModal;
    setConfirmModal({ isOpen: false, productId: null, type: "product", auctionId: null, auctionAction: null });
    try { await productAPI.deleteProduct(productId); toast.success("Product deleted"); fetchAll(); }
    catch { toast.error("Failed to delete product"); }
  };

  const handleEndEarly = async (auctionId) => {
    setAuctionActionLoading((prev) => ({ ...prev, [auctionId]: "ending" }));
    try {
      const res = await auctionAPI.endAuctionEarly(auctionId);
      if (res.data.success) { toast.success("Auction ended early"); fetchAuctions(); }
    } catch (err) { toast.error(err.response?.data?.message || "Failed to end auction"); }
    finally { setAuctionActionLoading((prev) => ({ ...prev, [auctionId]: null })); }
  };

  const handleCancelAuction = (auctionId) => {
    setConfirmModal({ isOpen: true, type: "auction", auctionId, auctionAction: "cancel", productId: null });
  };

  const handleDeleteSellerAuction = (auctionId) => {
    setConfirmModal({ isOpen: true, type: "auction", auctionId, auctionAction: "delete", productId: null });
  };

  const handleReviewReply = async () => {
    if (!reviewReplyModal.text.trim()) return;
    setReviewReplyLoading(true);
    try {
      const res = await reviewAPI.createReply(reviewReplyModal.review.review_id, { comment: reviewReplyModal.text.trim() });
      if (res.data.success) { toast.success("Reply posted!"); setReviewReplyModal({ open: false, review: null, text: "" }); fetchReviews(); }
    } catch (err) { toast.error(err.response?.data?.message || "Failed to post reply"); }
    finally { setReviewReplyLoading(false); }
  };

  const getDiscountedPrice = (p) => {
    const has = p.has_discount === true || p.has_discount === "true";
    const pct = parseInt(p.discount_percentage) || 0;
    return has && pct > 0 ? Math.round(parseFloat(p.price) * (1 - pct / 100)) : null;
  };

  const pendingCount = orders.filter((o) => o.order?.order_status === "pending").length;

  /* ── Filtered lists ── */
  const filteredOrders = (() => {
    let list = [...orders];
    if (orderFilter !== "all") list = list.filter((item) => item.order?.order_status === orderFilter);
    if (orderSearch.trim()) {
      const q = orderSearch.toLowerCase();
      list = list.filter((item) =>
        (item.order?.order_number || "").toLowerCase().includes(q) ||
        (item.product_name || "").toLowerCase().includes(q) ||
        (item.order?.user?.full_name || "").toLowerCase().includes(q)
      );
    }
    list = filterByDateRange(list, "created_at", orderDate.startDate, orderDate.endDate);
    list.sort((a, b) => {
      const da = parseAnyDate(a.order?.createdAt || a.order?.created_at || a.created_at);
      const db = parseAnyDate(b.order?.createdAt || b.order?.created_at || b.created_at);
      if (orderSort === "newest")  return (db || 0) - (da || 0);
      if (orderSort === "oldest")  return (da || 0) - (db || 0);
      if (orderSort === "highest") return parseFloat(b.subtotal || 0) - parseFloat(a.subtotal || 0);
      if (orderSort === "lowest")  return parseFloat(a.subtotal || 0) - parseFloat(b.subtotal || 0);
      return 0;
    });
    return list;
  })();
  const totalOrderPages = Math.ceil(filteredOrders.length / ORDERS_PER_PAGE);
  const pagedOrders     = filteredOrders.slice((orderPage - 1) * ORDERS_PER_PAGE, orderPage * ORDERS_PER_PAGE);

  const filteredProducts = (() => {
    let list = [...products];
    if (productFilter !== "all") list = list.filter((p) => p.status === productFilter);
    if (productSearch.trim()) {
      const q = productSearch.toLowerCase();
      list = list.filter((p) =>
        (p.name || "").toLowerCase().includes(q) ||
        (p.category?.name || "").toLowerCase().includes(q)
      );
    }
    list.sort((a, b) => {
      const da = parseAnyDate(a.created_at || a.createdAt);
      const db = parseAnyDate(b.created_at || b.createdAt);
      if (productSort === "newest")     return (db || 0) - (da || 0);
      if (productSort === "oldest")     return (da || 0) - (db || 0);
      if (productSort === "price_asc")  return parseFloat(a.price || 0) - parseFloat(b.price || 0);
      if (productSort === "price_desc") return parseFloat(b.price || 0) - parseFloat(a.price || 0);
      if (productSort === "stock_asc")  return (a.stock_quantity || 0) - (b.stock_quantity || 0);
      if (productSort === "stock_desc") return (b.stock_quantity || 0) - (a.stock_quantity || 0);
      return 0;
    });
    return list;
  })();
  const totalProductPages = Math.ceil(filteredProducts.length / PRODUCTS_PER_PAGE);
  const pagedProducts     = filteredProducts.slice((productPage - 1) * PRODUCTS_PER_PAGE, productPage * PRODUCTS_PER_PAGE);

  const filteredReviews = (() => {
    let list = [...reviews];
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
  })();
  const totalReviewPages = Math.ceil(filteredReviews.length / REVIEWS_PER_PAGE);
  const pagedReviews     = filteredReviews.slice((reviewPage - 1) * REVIEWS_PER_PAGE, reviewPage * REVIEWS_PER_PAGE);

  const filteredAuctions = (() => {
    let list = [...auctions];
    if (auctionFilter !== "all") list = list.filter((a) => a.status === auctionFilter);
    if (auctionSearch.trim()) {
      const q = auctionSearch.toLowerCase();
      list = list.filter((a) => (a.title || "").toLowerCase().includes(q));
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
  })();
  const totalAuctionPages = Math.ceil(filteredAuctions.length / AUCTIONS_PER_PAGE);
  const pagedAuctions     = filteredAuctions.slice((auctionPage - 1) * AUCTIONS_PER_PAGE, auctionPage * AUCTIONS_PER_PAGE);

  const totalDonut = analytics.ordersByStatus.reduce((s, d) => s + d.count, 0);
  const bestDow    = analytics.revenueByDow?.length
    ? analytics.revenueByDow.reduce((a, b) => b.orders > a.orders ? b : a, analytics.revenueByDow[0])
    : null;

  const avgRating = reviews.length > 0
    ? (reviews.reduce((s, r) => s + (r.rating || 0), 0) / reviews.length).toFixed(1)
    : "—";

  const auctionStatusStyle = (status) => ({
    live:      { background: "#D1FAE5", color: "#065F46" },
    upcoming:  { background: "#DBEAFE", color: "#1E40AF" },
    ended:     { background: "#F1F5F9", color: "#475569" },
    cancelled: { background: "#FEE2E2", color: "#991B1B" },
  }[status] || { background: "#F1F5F9", color: "#475569" });

  const approvalStatusStyle = (status) => ({
    approved: { background: "#D1FAE5", color: "#065F46" },
    pending:  { background: "#FEF3C7", color: "#92400E" },
    rejected: { background: "#FEE2E2", color: "#991B1B" },
  }[status] || { background: "#F1F5F9", color: "#475569" });

  if (loading) {
    return (
      <div className="seller-page-wrap">
        <div className="sd-loading"><div className="sd-spinner" /><p>{t("common.loading")}</p></div>
      </div>
    );
  }

  return (
    <div className="seller-page-wrap">
      <ReviewReplyModal
        modal={reviewReplyModal}
        setModal={setReviewReplyModal}
        onSubmit={handleReviewReply}
        loading={reviewReplyLoading}
      />

      <div className="seller-layout">

        {/* ── SIDEBAR ── */}
        <aside className="seller-sidebar">
          <div className="sd-sidebar-brand">
            <div className="sd-brand-mark">हK</div>
            <div>
              <div className="sd-brand-name">हस्तKrafts</div>
              <div className="sd-brand-sub">Artisan Panel</div>
            </div>
          </div>

          <nav className="sd-nav">
            <div className="sd-nav-label">Navigation</div>
            {[
              { key: "overview",  label: "Overview",        icon: Icons.overview },
              { key: "analytics", label: "Analytics",       icon: Icons.analytics },
              { key: "orders",    label: "All Orders",      icon: Icons.orders, badge: pendingCount },
              { key: "products",  label: "My Products",     icon: Icons.products },
              { key: "auctions",  label: "My Auctions",     icon: Icons.auction, badge: auctions.filter((a) => a.status === "live").length },
              { key: "reviews",   label: "My Reviews",      icon: Icons.reviews },
              { key: "blogs",     label: "My Blogs",        icon: Icons.blog },
              { key: "shop",      label: "Shop Management", icon: Icons.shop },
            ].map((item) => (
              <button key={item.key} className={`sd-nav-item ${activeTab === item.key ? "active" : ""}`} onClick={() => setActiveTab(item.key)}>
                <span className="sd-nav-icon">{item.icon}</span>
                <span className="sd-nav-label-text">{item.label}</span>
                {item.badge > 0 && <span className="sd-badge">{item.badge}</span>}
              </button>
            ))}
          </nav>

          <div className="sd-sidebar-actions">
            <Link to="/seller/add-product" className="sd-action-btn"><span className="sd-action-icon">{Icons.add}</span> Add Product</Link>
            <Link to="/seller/create-auction" className="sd-action-btn sd-action-secondary"><span className="sd-action-icon">{Icons.auction}</span> Create Auction</Link>
          </div>

          <div className="sd-sidebar-footer">
            <div className="sd-footer-user">
              <div className="sd-footer-avatar">S</div>
              <div>
                <div className="sd-footer-name">Artisan Dashboard</div>
                <div className="sd-footer-role">Seller</div>
              </div>
            </div>
          </div>
        </aside>

        {/* ── MAIN ── */}
        <main className="seller-main">

          {/* ════════ OVERVIEW ════════ */}
          {activeTab === "overview" && (
            <div>
              <div className="sd-page-header">
                <div><h1>{t("seller.dashboard")}</h1><p>Welcome back! Here's what's happening with your shop.</p></div>
              </div>

              <div className="sd-kpi-grid">
                <KpiCard label="Total Sales"     value={`Rs. ${stats.totalSales.toLocaleString()}`}    trend={analyticsLoaded ? analytics.kpis?.momGrowth : null} color="sales"    onClick={() => setActiveTab("analytics")} />
                <KpiCard label="Total Orders"    value={stats.totalOrders}    meta={`${pendingCount} pending`}                  color="orders"   onClick={() => setActiveTab("orders")} />
                <KpiCard label="Active Products" value={stats.activeProducts} meta={`${stats.pendingProducts} pending review`}  color="products" onClick={() => setActiveTab("products")} />
                <KpiCard label="My Auctions"     value={auctions.length || "—"} meta={`${auctions.filter((a) => a.status === "live").length} live`} color="items" onClick={() => setActiveTab("auctions")} />
              </div>

              {analytics.revenueByMonth.length > 0 && (
                <div className="sd-two-col" style={{ marginBottom: "1.5rem" }}>
                  <div className="sd-chart-card sd-chart-wide">
                    <div className="sd-chart-header">
                      <div className="sd-chart-title">Revenue Trend</div>
                      {analyticsLoaded && analytics.kpis?.momGrowth !== undefined && (
                        <div className={`sd-mom-badge ${analytics.kpis.momGrowth >= 0 ? "up" : "down"}`}>
                          {analytics.kpis.momGrowth >= 0 ? "↑" : "↓"} {Math.abs(analytics.kpis.momGrowth)}% vs last month
                        </div>
                      )}
                    </div>
                    <ResponsiveContainer width="100%" height={200}>
                      <AreaChart data={analytics.revenueByMonth} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                        <defs>
                          <linearGradient id="revGradOv" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%"  stopColor="#b86e38" stopOpacity={0.25} />
                            <stop offset="95%" stopColor="#b86e38" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#F0EBE5" />
                        <XAxis dataKey="month" tick={{ fontSize: 10, fill: "#8B6F5E" }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fontSize: 10, fill: "#8B6F5E" }} axisLine={false} tickLine={false} />
                        <Tooltip content={<ChartTip prefix="Rs. " />} />
                        <Area type="monotone" dataKey="revenue" name="Revenue" stroke="#b86e38" strokeWidth={2.5} fill="url(#revGradOv)" dot={false} activeDot={{ r: 4 }} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>

                  {analytics.ordersByStatus.length > 0 && (
                    <div className="sd-chart-card">
                      <div className="sd-chart-title">Orders by Status</div>
                      <ResponsiveContainer width="100%" height={160}>
                        <PieChart>
                          <Pie data={analytics.ordersByStatus} cx="50%" cy="50%" innerRadius={45} outerRadius={68} paddingAngle={3} dataKey="count" nameKey="status" strokeWidth={0}>
                            {analytics.ordersByStatus.map((d, i) => <Cell key={i} fill={STATUS_COLORS[d.status] || DONUT_COLORS[i % DONUT_COLORS.length]} />)}
                          </Pie>
                          <Tooltip formatter={(v, n) => [v, n]} />
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="sd-donut-legend">
                        {analytics.ordersByStatus.map((d, i) => (
                          <div key={i} className="sd-legend-item">
                            <span className="sd-legend-dot" style={{ background: STATUS_COLORS[d.status] || DONUT_COLORS[i % DONUT_COLORS.length] }} />
                            <span style={{ textTransform: "capitalize", flex: 1 }}>{d.status}</span>
                            <span className="sd-legend-val">{d.count}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="sd-section">
                <div className="sd-section-header">
                  <h2>{t("seller.recent_orders")}</h2>
                  <button className="sd-btn-outline" onClick={() => setActiveTab("orders")}>View All →</button>
                </div>
                {orders.length === 0 ? (
                  <div className="sd-empty"><p>{t("seller.no_orders")}</p></div>
                ) : (
                  <div className="sd-orders-list">
                    {orders.slice(0, 5).map((item) => (
                      <div key={item.order_item_id} className="sd-order-row">
                        <div className="sd-order-info">
                          <div className="sd-order-num">#{item.order?.order_number}</div>
                          <div className="sd-order-meta">{item.product_name} · {item.order?.user?.full_name} · Rs. {parseFloat(item.subtotal).toLocaleString()}</div>
                        </div>
                        <div className={`sd-status-text status-text-${item.order?.order_status}`}>
                          {item.order?.order_status ? item.order.order_status.charAt(0).toUpperCase() + item.order.order_status.slice(1) : ""} ✓
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <button className="sd-analytics-cta" onClick={() => setActiveTab("analytics")}>
                <div><div className="sd-cta-title">Deep Dive into Analytics</div><div className="sd-cta-sub">Revenue breakdowns, product performance & more</div></div>
                <span className="sd-cta-arrow">{Icons.arrow}</span>
              </button>
            </div>
          )}

          {/* ════════ ANALYTICS ════════ */}
          {activeTab === "analytics" && (
            <div>
              <div className="sd-page-header">
                <div><h1>Analytics</h1><p>Comprehensive business insights for your shop</p></div>
              </div>

              <div className="sd-kpi-grid">
                <KpiCard label="Total Revenue"    value={`Rs. ${(analytics.kpis?.totalRevenue || stats.totalSales).toLocaleString()}`} trend={analytics.kpis?.momGrowth} color="sales" />
                <KpiCard label="This Month"       value={`Rs. ${(analytics.kpis?.thisMonthRevenue || 0).toLocaleString()}`} meta={`Last month: Rs. ${(analytics.kpis?.lastMonthRevenue || 0).toLocaleString()}`} color="orders" />
                <KpiCard label="Avg. Order Value" value={`Rs. ${(analytics.kpis?.aov || 0).toLocaleString()}`} meta="Per order item" color="products" />
                <KpiCard label="Total Orders"     value={analytics.kpis?.totalOrders || stats.totalOrders} meta={`${analytics.kpis?.deliveredOrders || 0} delivered`} color="items" />
              </div>

              <div className="sd-ana-section-head">
                <span className="sd-ana-section-icon">📈</span>
                <div><div className="sd-ana-section-title">Revenue Analytics</div><div className="sd-ana-section-sub">Track your earnings over time</div></div>
              </div>

              <div className="sd-chart-card" style={{ marginBottom: "1.25rem" }}>
                <div className="sd-chart-title">Revenue Over Time (12 Months)</div>
                {analytics.revenueByMonth.length === 0 ? (
                  <div className="sd-empty-chart">No revenue data yet</div>
                ) : (
                  <ResponsiveContainer width="100%" height={260}>
                    <AreaChart data={analytics.revenueByMonth} margin={{ top: 8, right: 16, left: -10, bottom: 0 }}>
                      <defs>
                        <linearGradient id="revGrad12" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%"  stopColor="#b86e38" stopOpacity={0.22} />
                          <stop offset="95%" stopColor="#b86e38" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#F0EBE5" />
                      <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#8B6F5E" }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 11, fill: "#8B6F5E" }} axisLine={false} tickLine={false} />
                      <Tooltip content={<ChartTip prefix="Rs. " />} />
                      <Legend wrapperStyle={{ fontSize: "0.75rem" }} />
                      <Area type="monotone" dataKey="revenue" name="Revenue (Rs.)" stroke="#b86e38" strokeWidth={2.5} fill="url(#revGrad12)" dot={false} activeDot={{ r: 5 }} />
                      <Line type="monotone" dataKey="orders" name="Orders" stroke="#2a9e6a" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </div>

              <div className="sd-chart-row-2" style={{ marginBottom: "1.25rem" }}>
                <div className="sd-chart-card">
                  <div className="sd-chart-title">This Month (Weekly)</div>
                  {!analytics.revenueByWeek || analytics.revenueByWeek.every((w) => w.revenue === 0) ? (
                    <div className="sd-empty-chart">No data this month yet</div>
                  ) : (
                    <ResponsiveContainer width="100%" height={200}>
                      <BarChart data={analytics.revenueByWeek} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#F0EBE5" vertical={false} />
                        <XAxis dataKey="week" tick={{ fontSize: 11, fill: "#8B6F5E" }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fontSize: 10, fill: "#8B6F5E" }} axisLine={false} tickLine={false} />
                        <Tooltip content={<ChartTip prefix="Rs. " />} />
                        <Bar dataKey="revenue" name="Revenue" radius={[6, 6, 0, 0]} fill="#b86e38" />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>
                <div className="sd-chart-card">
                  <div className="sd-chart-title">Top Products by Revenue</div>
                  {analytics.topProducts.length === 0 ? (
                    <div className="sd-empty-chart">No product data yet</div>
                  ) : (
                    <ResponsiveContainer width="100%" height={200}>
                      <BarChart data={analytics.topProducts} layout="vertical" margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#F0EBE5" horizontal={false} />
                        <XAxis type="number" tick={{ fontSize: 10, fill: "#8B6F5E" }} axisLine={false} tickLine={false} />
                        <YAxis type="category" dataKey="name" width={110} tick={{ fontSize: 10, fill: "#5D4E37" }} axisLine={false} tickLine={false} />
                        <Tooltip content={<ChartTip prefix="Rs. " />} />
                        <Bar dataKey="revenue" name="Revenue" radius={[0, 6, 6, 0]} fill="#b86e38" />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>

              <div className="sd-ana-section-head">
                <span className="sd-ana-section-icon">📦</span>
                <div><div className="sd-ana-section-title">Order Analytics</div><div className="sd-ana-section-sub">Order patterns and fulfillment performance</div></div>
              </div>

              <div className="sd-chart-row-2" style={{ marginBottom: "1.25rem" }}>
                <div className="sd-chart-card">
                  <div className="sd-chart-title">Orders by Status</div>
                  {analytics.ordersByStatus.length === 0 ? (
                    <div className="sd-empty-chart">No order data yet</div>
                  ) : (
                    <>
                      <ResponsiveContainer width="100%" height={180}>
                        <PieChart>
                          <Pie data={analytics.ordersByStatus} cx="50%" cy="50%" innerRadius={50} outerRadius={75} paddingAngle={3} dataKey="count" nameKey="status" strokeWidth={0}>
                            {analytics.ordersByStatus.map((d, i) => <Cell key={i} fill={STATUS_COLORS[d.status] || DONUT_COLORS[i % DONUT_COLORS.length]} />)}
                          </Pie>
                          <Tooltip formatter={(v, n) => [v, n]} />
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="sd-donut-legend">
                        {analytics.ordersByStatus.map((d, i) => (
                          <div key={i} className="sd-legend-item">
                            <span className="sd-legend-dot" style={{ background: STATUS_COLORS[d.status] || DONUT_COLORS[i % DONUT_COLORS.length] }} />
                            <span style={{ textTransform: "capitalize", flex: 1 }}>{d.status}</span>
                            <span className="sd-legend-val">{d.count}</span>
                            <span className="sd-legend-pct">{totalDonut > 0 ? `${Math.round((d.count / totalDonut) * 100)}%` : ""}</span>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>

                <div className="sd-chart-card">
                  <div className="sd-chart-header">
                    <div className="sd-chart-title">Orders by Day of Week</div>
                    {bestDow && bestDow.orders > 0 && <div className="sd-peak-badge">Peak: {bestDow.day}</div>}
                  </div>
                  {!analytics.revenueByDow || analytics.revenueByDow.every((d) => d.orders === 0) ? (
                    <div className="sd-empty-chart">No data for last 30 days</div>
                  ) : (
                    <>
                      <ResponsiveContainer width="100%" height={190}>
                        <BarChart data={analytics.revenueByDow} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#F0EBE5" vertical={false} />
                          <XAxis dataKey="day" tick={{ fontSize: 11, fill: "#8B6F5E" }} axisLine={false} tickLine={false} />
                          <YAxis tick={{ fontSize: 10, fill: "#8B6F5E" }} axisLine={false} tickLine={false} />
                          <Tooltip content={<ChartTip />} />
                          <Bar dataKey="orders" name="Orders" radius={[5, 5, 0, 0]} fill="#10B981" />
                        </BarChart>
                      </ResponsiveContainer>
                      {bestDow && bestDow.orders > 0 && (
                        <div className="sd-peak-note">📈 Peak day: <strong>{bestDow.day}</strong> ({bestDow.orders} orders avg)</div>
                      )}
                    </>
                  )}
                </div>
              </div>

              <div className="sd-ana-section-head">
                <span className="sd-ana-section-icon">🏪</span>
                <div><div className="sd-ana-section-title">Stock Health</div><div className="sd-ana-section-sub">Inventory levels across your catalog</div></div>
              </div>

              <div className="sd-chart-card" style={{ marginBottom: "1.5rem" }}>
                {analytics.stockHealth.length === 0 ? (
                  <div className="sd-empty-chart">No approved products yet</div>
                ) : (
                  <div className="sd-stock-grid">
                    {analytics.stockHealth.map((p) => {
                      const maxStock = Math.max(...analytics.stockHealth.map((x) => x.stock), 1);
                      const pct   = Math.round((p.stock / maxStock) * 100);
                      const isLow = p.stock > 0 && p.stock <= 3;
                      const isOut = p.stock === 0;
                      return (
                        <div key={p.id} className="sd-stock-row">
                          <div className="sd-stock-img">
                            {p.image ? <img src={`${API_URL}${p.image}`} alt={p.name} /> : <span>📦</span>}
                          </div>
                          <div className="sd-stock-info">
                            <div className="sd-stock-name">{p.name}</div>
                            <div className="sd-stock-bar-wrap">
                              <div className="sd-stock-bar" style={{ width: `${pct}%`, background: isOut ? "#EF4444" : isLow ? "#F59E0B" : "#10B981" }} />
                            </div>
                          </div>
                          <div className={`sd-stock-count ${isOut ? "out" : isLow ? "low" : "ok"}`}>
                            {isOut ? "Out of stock" : `${p.stock} units`}{isLow ? " ⚠️" : ""}
                          </div>
                          <Link to={`/seller/edit-product/${p.id}`} className="sd-stock-edit">Restock</Link>
                        </div>
                      );
                    })}
                    {analytics.stockHealth.filter((p) => p.stock <= 3).length > 0 && (
                      <div className="sd-restock-alert">
                        ⚠️ {analytics.stockHealth.filter((p) => p.stock <= 3).length} product{analytics.stockHealth.filter((p) => p.stock <= 3).length !== 1 ? "s" : ""} need restocking: {analytics.stockHealth.filter((p) => p.stock <= 3).map((p) => p.name).join(", ")}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ════════ ALL ORDERS ════════ */}
          {activeTab === "orders" && (
            <div>
              <div className="sd-page-header">
                <div><h1>All Orders</h1><p>{filteredOrders.length} of {orders.length} order items</p></div>
              </div>

              <div style={{ display: "flex", gap: "0.75rem", marginBottom: "0.65rem", flexWrap: "wrap", alignItems: "flex-end" }}>
                <SearchInput value={orderSearch} onChange={(v) => { setOrderSearch(v); setOrderPage(1); }} placeholder="Search by order #, product or customer…" theme="seller" style={{ flex: 1, minWidth: 220, maxWidth: 400 }} />
                <SortSelect theme="seller" value={orderSort} onChange={(v) => { setOrderSort(v); setOrderPage(1); }}
                  options={[{ value: "newest", label: "Newest first" }, { value: "oldest", label: "Oldest first" }, { value: "highest", label: "Highest amount" }, { value: "lowest", label: "Lowest amount" }]} />
              </div>
              <div style={{ marginBottom: "0.65rem" }}>
                <DateRangePicker theme="seller" startDate={orderDate.startDate} endDate={orderDate.endDate} onChange={(v) => { setOrderDate(v); setOrderPage(1); }} label="Date:" />
              </div>
              <FilterBar theme="seller" active={orderFilter} onChange={(f) => { setOrderFilter(f); setOrderPage(1); }}
                filters={[
                  { key: "all",        label: "All",        count: orders.length },
                  { key: "pending",    label: "Pending",    count: orders.filter((o) => o.order?.order_status === "pending").length },
                  { key: "processing", label: "Processing", count: orders.filter((o) => o.order?.order_status === "processing").length },
                  { key: "shipped",    label: "Shipped",    count: orders.filter((o) => o.order?.order_status === "shipped").length },
                  { key: "delivered",  label: "Delivered",  count: orders.filter((o) => o.order?.order_status === "delivered").length },
                  { key: "cancelled",  label: "Cancelled",  count: orders.filter((o) => o.order?.order_status === "cancelled").length },
                ]}
              />

              <div className="sd-section">
                {filteredOrders.length === 0 && orders.length > 0 ? (
                  <div className="sd-empty"><p>No orders match your search or filter.</p></div>
                ) : pagedOrders.length === 0 ? (
                  <div className="sd-empty"><p>No orders found</p></div>
                ) : (
                  <div className="sd-orders-list">
                    {pagedOrders.map((item) => (
                      <div key={item.order_item_id} className="sd-order-row sd-order-row-full">
                        <div className="sd-order-img">
                          {item.product?.images?.[0] ? (
                            <img src={`${API_URL}${item.product.images[0]}`} alt={item.product_name} />
                          ) : (
                            <div className="sd-order-no-img">📦</div>
                          )}
                        </div>
                        <div className="sd-order-info sd-order-info-full">
                          <div className="sd-order-num">#{item.order?.order_number}</div>
                          <div className="sd-order-product">{item.product_name}</div>
                          <div className="sd-order-meta">Customer: <strong>{item.order?.user?.full_name}</strong> · Qty: {item.quantity} · Rs. {parseFloat(item.subtotal).toLocaleString()}</div>
                          <div className="sd-order-date">{fmtDate(item.order?.createdAt || item.order?.created_at || item.created_at)}</div>
                        </div>
                        <div className="sd-order-actions">
                          <span className={`sd-payment-badge ${item.order?.payment_status === "paid" ? "paid" : "unpaid"}`}>
                            {item.order?.payment_status === "paid" ? "Paid" : "Unpaid"}
                          </span>
                          <select
                            value={item.order?.order_status}
                            onChange={(e) => handleStatusChange(item.order?.order_id, e.target.value)}
                            className={`sd-status-select status-${item.order?.order_status}`}
                          >
                            {["pending", "processing", "shipped", "delivered", "cancelled"].map((s) => (
                              <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                <Pagination currentPage={orderPage} totalPages={totalOrderPages} onPageChange={setOrderPage} theme="seller" />
              </div>
            </div>
          )}

          {/* ════════ MY PRODUCTS ════════ */}
          {activeTab === "products" && (
            <div>
              <div className="sd-page-header">
                <div><h1>{t("seller.your_products")}</h1><p>{filteredProducts.length} of {products.length} products · {stats.activeProducts} approved</p></div>
                <Link to="/seller/add-product" className="sd-btn-primary">+ {t("seller.add_product")}</Link>
              </div>

              <div style={{ display: "flex", gap: "0.75rem", marginBottom: "1rem", flexWrap: "wrap", alignItems: "center" }}>
                <FilterBar theme="seller" active={productFilter} onChange={(f) => { setProductFilter(f); setProductPage(1); }}
                  filters={[
                    { key: "all",      label: "All",      count: products.length },
                    { key: "approved", label: "Approved", count: products.filter((p) => p.status === "approved").length },
                    { key: "pending",  label: "Pending",  count: products.filter((p) => p.status === "pending").length },
                    { key: "rejected", label: "Rejected", count: products.filter((p) => p.status === "rejected").length },
                  ]}
                />
              </div>
              <div style={{ display: "flex", gap: "0.75rem", marginBottom: "1.25rem", flexWrap: "wrap", alignItems: "flex-end" }}>
                <SearchInput value={productSearch} onChange={(v) => { setProductSearch(v); setProductPage(1); }} placeholder="Search products…" theme="seller" style={{ flex: 1, minWidth: 200, maxWidth: 340 }} />
                <SortSelect theme="seller" value={productSort} onChange={(v) => { setProductSort(v); setProductPage(1); }}
                  options={[{ value: "newest", label: "Newest first" }, { value: "oldest", label: "Oldest first" }, { value: "price_asc", label: "Price ↑" }, { value: "price_desc", label: "Price ↓" }, { value: "stock_asc", label: "Stock ↑" }, { value: "stock_desc", label: "Stock ↓" }]} />
              </div>

              {products.length === 0 ? (
                <div className="sd-empty">
                  <p>{t("seller.no_products")}</p>
                  <Link to="/seller/add-product" className="sd-btn-primary">{t("seller.add_product")}</Link>
                </div>
              ) : (
                <>
                  {filteredProducts.length === 0 && products.length > 0 && (
                    <div className="sd-empty"><p>No products match your search or filter.</p></div>
                  )}
                  <div className="sd-products-grid sd-products-grid-full">
                    {pagedProducts.map((product) => {
                      const dp = getDiscountedPrice(product);
                      return (
                        <div key={product.product_id} className="sd-product-card">
                          <div className="sd-product-img">
                            {product.images?.[0] ? (
                              <img src={`${API_URL}${product.images[0]}`} alt={product.name} />
                            ) : (
                              <div className="sd-no-img">No Image</div>
                            )}
                            <span className={`sd-status-badge status-${product.status}`}>{product.status}</span>
                            {dp && <span className="sd-discount-badge">-{product.discount_percentage}%</span>}
                          </div>
                          <div className="sd-product-info">
                            <h4>{product.name}</h4>
                            {dp ? (
                              <div>
                                <p className="sd-price-orig">Rs. {parseFloat(product.price).toLocaleString()}</p>
                                <p className="sd-price-disc">Rs. {dp.toLocaleString()}</p>
                              </div>
                            ) : (
                              <p className="sd-price">Rs. {parseFloat(product.price).toLocaleString()}</p>
                            )}
                            <p className="sd-stock">{product.stock_quantity} {t("seller.in_stock")}</p>
                          </div>
                          <div className="sd-product-actions">
                            <Link to={`/seller/edit-product/${product.product_id}`} className="sd-btn-icon">{t("seller.edit")}</Link>
                            <button onClick={() => setConfirmModal({ isOpen: true, productId: product.product_id, type: "product", auctionId: null, auctionAction: null })} className="sd-btn-icon sd-btn-icon-danger">{t("seller.delete")}</button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <Pagination currentPage={productPage} totalPages={totalProductPages} onPageChange={setProductPage} theme="seller" />
                </>
              )}
            </div>
          )}

          {/* ════════ MY AUCTIONS ════════ */}
          {activeTab === "auctions" && (
            <div>
              <div className="sd-page-header">
                <div>
                  <h1>My Auctions</h1>
                  <p>
                    {auctions.length} total ·{" "}
                    {auctions.filter((a) => a.status === "live").length} live ·{" "}
                    {auctions.filter((a) => a.status === "upcoming").length} upcoming ·{" "}
                    {auctions.filter((a) => a.approval_status === "pending").length} pending approval
                  </p>
                </div>
                <Link to="/seller/create-auction" className="sd-btn-primary">+ Create Auction</Link>
              </div>

              {auctions.filter((a) => a.approval_status === "pending").length > 0 && (
                <div style={{ display: "flex", alignItems: "flex-start", gap: "0.75rem", background: "#fdf5e0", border: "1.5px solid #e0cc80", borderRadius: 10, padding: "0.875rem 1.1rem", marginBottom: "1.25rem" }}>
                  <span style={{ fontSize: "1.1rem", flexShrink: 0 }}>⏳</span>
                  <div>
                    <p style={{ fontWeight: 700, color: "#9a6410", margin: 0, fontSize: "0.875rem" }}>
                      {auctions.filter((a) => a.approval_status === "pending").length} auction{auctions.filter((a) => a.approval_status === "pending").length > 1 ? "s" : ""} awaiting admin approval
                    </p>
                    <p style={{ color: "#7a5010", fontSize: "0.8rem", margin: "2px 0 0 0" }}>
                      Auctions go live automatically at their scheduled start time once approved.
                    </p>
                  </div>
                </div>
              )}

              {auctions.length > 0 && (
                <div className="sd-kpi-grid" style={{ marginBottom: "1.5rem" }}>
                  <KpiCard label="Total Auctions" value={auctions.length}                                              meta="All time"        color="sales" />
                  <KpiCard label="Live Now"        value={auctions.filter((a) => a.status === "live").length}          meta="Active bidding"  color="orders" />
                  <KpiCard label="Upcoming"        value={auctions.filter((a) => a.status === "upcoming").length}      meta="Scheduled"       color="products" />
                  <KpiCard label="Ended"           value={auctions.filter((a) => a.status === "ended").length}         meta={`${auctions.filter((a) => a.status === "ended" && a.winner_id).length} with winner`} color="items" />
                </div>
              )}

              <div style={{ display: "flex", gap: "0.75rem", marginBottom: "0.65rem", flexWrap: "wrap", alignItems: "flex-end" }}>
                <SearchInput value={auctionSearch} onChange={(v) => { setAuctionSearch(v); setAuctionPage(1); }} placeholder="Search auctions…" theme="seller" style={{ flex: 1, minWidth: 220, maxWidth: 400 }} />
                <SortSelect theme="seller" value={auctionSort} onChange={(v) => { setAuctionSort(v); setAuctionPage(1); }}
                  options={[{ value: "newest", label: "Newest first" }, { value: "oldest", label: "Oldest first" }, { value: "bid_high", label: "Highest bid" }, { value: "bid_low", label: "Lowest bid" }]} />
              </div>
              <FilterBar theme="seller" active={auctionFilter} onChange={(f) => { setAuctionFilter(f); setAuctionPage(1); }}
                filters={[
                  { key: "all",       label: "All",        count: auctions.length },
                  { key: "live",      label: "🔴 Live",    count: auctions.filter((a) => a.status === "live").length },
                  { key: "upcoming",  label: "Upcoming",   count: auctions.filter((a) => a.status === "upcoming").length },
                  { key: "ended",     label: "Ended",      count: auctions.filter((a) => a.status === "ended").length },
                  { key: "cancelled", label: "Cancelled",  count: auctions.filter((a) => a.status === "cancelled").length },
                ]}
              />

              <div className="sd-section" style={{ marginTop: "1rem" }}>
                {auctionsLoading ? (
                  <div className="sd-loading" style={{ minHeight: 200 }}><div className="sd-spinner" /><p>Loading auctions…</p></div>
                ) : filteredAuctions.length === 0 ? (
                  <div className="sd-empty">
                    <p>{auctions.length === 0 ? "No auctions yet. Create your first auction!" : "No auctions match your search."}</p>
                    {auctions.length === 0 && <Link to="/seller/create-auction" className="sd-btn-primary">Create Auction</Link>}
                  </div>
                ) : (
                  <div className="sd-orders-list">
                    {pagedAuctions.map((auction) => {
                      const isActionLoading = !!auctionActionLoading?.[auction.auction_id];
                      const hasBids    = (auction.total_bids || 0) > 0;
                      const canEndEarly = auction.status === "live" && auction.approval_status === "approved";
                      const canCancel  = ["live", "upcoming"].includes(auction.status) && auction.approval_status === "approved";
                      const canDelete  =
                        auction.approval_status === "pending" ||
                        auction.approval_status === "rejected" ||
                        auction.status === "cancelled" ||
                        (auction.status === "ended" && !hasBids);

                      return (
                        <div key={auction.auction_id} className="sd-order-row sd-order-row-full">
                          <div className="sd-order-img" style={{ width: 64, height: 64, borderRadius: 10, overflow: "hidden", flexShrink: 0, background: "#f5e6d3" }}>
                            {auction.images?.[0] ? (
                              <img src={`${API_URL}${auction.images[0]}`} alt={auction.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                            ) : (
                              <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.6rem" }}>🔨</div>
                            )}
                          </div>

                          <div className="sd-order-info sd-order-info-full">
                            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.3rem", flexWrap: "wrap" }}>
                              <div className="sd-order-num" style={{ fontSize: "0.95rem" }}>{auction.title}</div>
                              <span style={{ ...approvalStatusStyle(auction.approval_status), padding: "2px 8px", borderRadius: 999, fontSize: "0.62rem", fontWeight: 700 }}>
                                {auction.approval_status === "pending" ? "⏳ Awaiting Approval"
                                  : auction.approval_status === "approved" ? "✓ Approved"
                                  : "✗ Rejected"}
                              </span>
                            </div>

                            {auction.approval_status === "rejected" && auction.rejection_reason && (
                              <div style={{ fontSize: "0.75rem", color: "#991B1B", background: "#FEE2E2", padding: "4px 8px", borderRadius: 6, marginBottom: "0.3rem" }}>
                                Reason: {auction.rejection_reason}
                              </div>
                            )}

                            <div className="sd-order-meta" style={{ marginTop: 2 }}>
                              Starting: Rs. {parseFloat(auction.starting_bid || 0).toLocaleString()}
                              {parseFloat(auction.current_bid || 0) > 0 && (
                                <> · Current: <strong style={{ color: "#b86e38" }}>Rs. {parseFloat(auction.current_bid).toLocaleString()}</strong></>
                              )}
                              · {auction.total_bids || 0} bid{(auction.total_bids || 0) !== 1 ? "s" : ""}
                              · Min increment: Rs. {parseFloat(auction.minimum_increment || 100).toLocaleString()}
                            </div>
                            <div className="sd-order-meta" style={{ marginTop: 2 }}>
                              Start: {fmtDateTime(auction.auction_start)} · End: {fmtDateTime(auction.auction_end)}
                            </div>
                            {auction.status === "ended" && auction.winner && (
                              <div style={{ fontSize: "0.78rem", color: "#059669", marginTop: 2, fontWeight: 600 }}>
                                🏆 Winner: {auction.winner.full_name}
                              </div>
                            )}
                            {auction.status === "ended" && !auction.winner && (
                              <div style={{ fontSize: "0.78rem", color: "#8B6F5E", marginTop: 2 }}>No winner (no bids)</div>
                            )}
                          </div>

                          <div className="sd-order-actions" style={{ alignItems: "flex-end", gap: "0.4rem", minWidth: 130 }}>
                            <span style={{ ...auctionStatusStyle(auction.status), padding: "3px 10px", borderRadius: 999, fontSize: "0.68rem", fontWeight: 700 }}>
                              {auction.status === "live" ? "🔴 Live" : auction.status?.charAt(0).toUpperCase() + auction.status?.slice(1)}
                            </span>

                            {canEndEarly && (
                              <button
                                className="sd-btn-outline"
                                style={{ fontSize: "0.72rem", padding: "4px 10px", whiteSpace: "nowrap" }}
                                disabled={isActionLoading}
                                onClick={() => handleEndEarly(auction.auction_id)}
                              >
                                {auctionActionLoading?.[auction.auction_id] === "ending" ? "Ending…" : "End Early"}
                              </button>
                            )}

                            {canCancel && (
                              <button
                                style={{ fontSize: "0.72rem", padding: "4px 10px", color: "#92400E", borderColor: "#FDE68A", background: "#FEF3C7", border: "1.5px solid #FDE68A", borderRadius: 8, cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap" }}
                                disabled={isActionLoading}
                                onClick={() => handleCancelAuction(auction.auction_id)}
                              >
                                {auctionActionLoading?.[auction.auction_id] === "cancelling" ? "Cancelling…" : "Cancel"}
                              </button>
                            )}

                            {canDelete && (
                              <button
                                className="sd-btn-icon sd-btn-icon-danger"
                                style={{ fontSize: "0.72rem", padding: "4px 10px", flex: "none", whiteSpace: "nowrap" }}
                                disabled={isActionLoading}
                                onClick={() => handleDeleteSellerAuction(auction.auction_id)}
                              >
                                {auctionActionLoading?.[auction.auction_id] === "deleting" ? "Deleting…" : "Delete"}
                              </button>
                            )}

                            <div style={{ fontSize: "0.68rem", color: "#8B6F5E" }}>
                              {fmtDate(auction.created_at || auction.createdAt)}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
                <Pagination currentPage={auctionPage} totalPages={totalAuctionPages} onPageChange={setAuctionPage} theme="seller" />
              </div>
            </div>
          )}

          {/* ════════ MY REVIEWS ════════ */}
          {activeTab === "reviews" && (
            <div>
              <div className="sd-page-header">
                <div>
                  <h1>My Reviews</h1>
                  <p>{reviews.length} total reviews · Avg rating: {avgRating} ★</p>
                </div>
              </div>

              {reviews.length > 0 && (
                <div className="sd-reviews-summary">
                  {[5,4,3,2,1].map((star) => {
                    const count = reviews.filter((r) => r.rating === star).length;
                    const pct   = reviews.length > 0 ? Math.round((count / reviews.length) * 100) : 0;
                    return (
                      <div key={star} className="sd-review-bar-row">
                        <span className="sd-review-star-label">{star} ★</span>
                        <div className="sd-review-bar-track">
                          <div className="sd-review-bar-fill" style={{ width: `${pct}%`, background: star >= 4 ? "#10B981" : star === 3 ? "#F59E0B" : "#EF4444" }} />
                        </div>
                        <span className="sd-review-bar-count">{count}</span>
                      </div>
                    );
                  })}
                </div>
              )}

              <div style={{ display: "flex", gap: "0.75rem", marginBottom: "0.65rem", flexWrap: "wrap", alignItems: "flex-end" }}>
                <SearchInput value={reviewSearch} onChange={(v) => { setReviewSearch(v); setReviewPage(1); }} placeholder="Search by reviewer, product or comment…" theme="seller" style={{ flex: 1, minWidth: 220, maxWidth: 400 }} />
                <SortSelect theme="seller" value={reviewSort} onChange={(v) => { setReviewSort(v); setReviewPage(1); }}
                  options={[{ value: "newest", label: "Newest first" }, { value: "oldest", label: "Oldest first" }, { value: "highest", label: "Highest rating" }, { value: "lowest", label: "Lowest rating" }]} />
              </div>

              <FilterBar theme="seller" active={reviewRating} onChange={(f) => { setReviewRating(f); setReviewPage(1); }}
                filters={[
                  { key: "all", label: "All ratings", count: reviews.length },
                  { key: "5",   label: "★★★★★",       count: reviews.filter((r) => r.rating === 5).length },
                  { key: "4",   label: "★★★★",         count: reviews.filter((r) => r.rating === 4).length },
                  { key: "3",   label: "★★★",           count: reviews.filter((r) => r.rating === 3).length },
                  { key: "2",   label: "★★",            count: reviews.filter((r) => r.rating === 2).length },
                  { key: "1",   label: "★",             count: reviews.filter((r) => r.rating === 1).length },
                ]}
              />

              <div className="sd-section" style={{ marginTop: "1rem" }}>
                {reviewsLoading ? (
                  <div className="sd-loading" style={{ minHeight: 200 }}><div className="sd-spinner" /><p>Loading reviews…</p></div>
                ) : filteredReviews.length === 0 ? (
                  <div className="sd-empty">
                    <p>{reviews.length === 0 ? "No reviews yet. Reviews appear after customers purchase your products." : "No reviews match your search."}</p>
                  </div>
                ) : (
                  <div className="sd-reviews-list">
                    {pagedReviews.map((review) => (
                      <div key={review.review_id} className="sd-review-card">
                        <div className="sd-review-header">
                          <div className="sd-review-product-info">
                            {review.product?.images?.[0] && (
                              <img src={`${API_URL}${review.product.images[0]}`} alt={review.product?.name} className="sd-review-product-img" />
                            )}
                            <div>
                              <div className="sd-review-product-name">{review.product?.name || "—"}</div>
                              <div className="sd-review-reviewer">by <strong>{review.user?.full_name || "Anonymous"}</strong></div>
                            </div>
                          </div>
                          <div className="sd-review-meta">
                            <StarRating rating={review.rating} />
                            <div className="sd-review-date">{fmtDate(review.created_at || review.createdAt)}</div>
                            {review.verified_purchase && (
                              <span className="sd-verified-badge">✓ Verified Purchase</span>
                            )}
                          </div>
                        </div>
                        {review.comment && <p className="sd-review-comment">{review.comment}</p>}
                        {review.images?.length > 0 && (
                          <div className="sd-review-images">
                            {review.images.slice(0, 4).map((img, i) => (
                              <img key={i} src={`${API_URL}${img}`} alt="" className="sd-review-thumb" />
                            ))}
                          </div>
                        )}
                        <div style={{ marginTop: "0.75rem", display: "flex", gap: "0.5rem" }}>
                          <button
                            className="sd-btn-outline"
                            style={{ fontSize: "0.78rem", padding: "5px 12px" }}
                            onClick={() => setReviewReplyModal({ open: true, review, text: "" })}
                          >
                            💬 Reply
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                <Pagination currentPage={reviewPage} totalPages={totalReviewPages} onPageChange={setReviewPage} theme="seller" />
              </div>
            </div>
          )}

          {activeTab === "shop"  && <ShopManagement toast={toast} t={t} />}
          {activeTab === "blogs" && <SellerMyBlogs toast={toast} t={t} />}

          <div className="sd-footer">© {new Date().getFullYear()} हस्तKrafts Nepal. All rights reserved.</div>
        </main>
      </div>

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title={
          confirmModal.type === "auction" && confirmModal.auctionAction === "cancel"
            ? "Cancel this auction?"
            : confirmModal.type === "auction" && confirmModal.auctionAction === "delete"
            ? "Delete this auction?"
            : "Delete this product?"
        }
        message={
          confirmModal.type === "auction" && confirmModal.auctionAction === "cancel"
            ? "This will cancel the auction. Bidders will be notified. This cannot be undone."
            : confirmModal.type === "auction" && confirmModal.auctionAction === "delete"
            ? "This will permanently delete the auction. This cannot be undone."
            : "This action cannot be undone."
        }
        confirmText={
          confirmModal.type === "auction" && confirmModal.auctionAction === "cancel"
            ? "Yes, Cancel Auction"
            : t("common.delete")
        }
        cancelText={t("common.cancel")}
        confirmVariant="danger"
        onConfirm={handleDeleteConfirm}
        onCancel={() => setConfirmModal({ isOpen: false, productId: null, type: "product", auctionId: null, auctionAction: null })}
      />
    </div>
  );
};

/* ══════════════════════════════════════════ */
const ShopManagement = ({ toast, t }) => {
  const [seller, setSeller]                             = useState(null);
  const [loading, setLoading]                           = useState(true);
  const [saving, setSaving]                             = useState(false);
  const [uploadingLogo, setUploadingLogo]               = useState(false);
  const [uploadingCitizenship, setUploadingCitizenship] = useState(false);
  const [isEditing, setIsEditing]                       = useState(false);
  const [form, setForm] = useState({
    shop_name: "", shop_description: "", city: "", address: "",
    bank_name: "", bank_account_number: "", bank_account_name: "",
  });

  useEffect(() => { fetchSeller(); }, []);

  const fetchSeller = async () => {
    try {
      setLoading(true);
      const res = await sellerAPI.getProfile();
      if (res.data.success) {
        const s = res.data.data;
        setSeller(s);
        setForm({
          shop_name: s.shop_name || "", shop_description: s.shop_description || "",
          city: s.city || "", address: s.address || "",
          bank_name: s.bank_name || "", bank_account_number: s.bank_account_number || "",
          bank_account_name: s.bank_account_name || "",
        });
      }
    } catch { toast.error("Failed to load shop info"); }
    finally { setLoading(false); }
  };

  const handleSave = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      const res = await sellerAPI.updateProfile(form);
      if (res.data.success) { toast.success("Shop profile updated!"); setIsEditing(false); fetchSeller(); }
    } catch (err) { toast.error(err.response?.data?.message || "Failed to update shop"); }
    finally { setSaving(false); }
  };

  const handleLogoUpload = async (e) => {
    const file = e.target.files[0]; if (!file) return; setUploadingLogo(true);
    try { const fd = new FormData(); fd.append("shop_logo", file); const res = await sellerAPI.uploadLogo(fd); if (res.data.success) { toast.success("Shop logo updated!"); fetchSeller(); } }
    catch (err) { toast.error(err.response?.data?.message || "Failed to upload logo"); }
    finally { setUploadingLogo(false); }
  };

  const handleCitizenshipUpload = async (e) => {
    const file = e.target.files[0]; if (!file) return; setUploadingCitizenship(true);
    try { const fd = new FormData(); fd.append("citizenship_image", file); const res = await sellerAPI.uploadCitizenship(fd); if (res.data.success) { toast.success("Citizenship document updated!"); fetchSeller(); } }
    catch (err) { toast.error(err.response?.data?.message || "Failed to upload citizenship"); }
    finally { setUploadingCitizenship(false); }
  };

  if (loading) return <div className="sd-loading"><div className="sd-spinner" /><p>Loading shop info…</p></div>;

  return (
    <div>
      <div className="sd-page-header">
        <div><h1>Shop Management</h1><p>Manage your shop profile and documents</p></div>
        {!isEditing && <button className="sd-btn-primary" onClick={() => setIsEditing(true)}>Edit Shop Info</button>}
      </div>

      <div className="sd-section sd-shop-logo-section">
        <h3>Shop Logo</h3>
        <div className="sd-logo-wrap">
          <div className="sd-logo-preview">
            {seller?.shop_logo ? (
              <img src={`http://localhost:5000${seller.shop_logo}`} alt="Shop logo" />
            ) : (
              <div className="sd-logo-placeholder">{seller?.shop_name?.[0]?.toUpperCase() || "S"}</div>
            )}
          </div>
          <div className="sd-logo-actions">
            <p className="sd-logo-hint">Upload a square image (recommended 400×400px, max 2MB)</p>
            <label className="sd-upload-btn">
              {uploadingLogo ? "Uploading…" : "Upload Logo"}
              <input type="file" accept="image/*" onChange={handleLogoUpload} disabled={uploadingLogo} style={{ display: "none" }} />
            </label>
          </div>
        </div>
      </div>

      <div className="sd-section">
        <h3>Shop Information</h3>
        {!isEditing ? (
          <div className="sd-info-grid">
            <div className="sd-info-item"><label>Shop Name</label><p>{seller?.shop_name || "—"}</p></div>
            <div className="sd-info-item sd-info-full"><label>Description</label><p>{seller?.shop_description || "—"}</p></div>
            <div className="sd-info-item"><label>City</label><p>{seller?.city || "—"}</p></div>
            <div className="sd-info-item sd-info-full"><label>Address</label><p>{seller?.address || "—"}</p></div>
            <div className="sd-info-item"><label>Bank Name</label><p>{seller?.bank_name || "—"}</p></div>
            <div className="sd-info-item"><label>Account Number</label><p>{seller?.bank_account_number || "—"}</p></div>
            <div className="sd-info-item"><label>Account Holder</label><p>{seller?.bank_account_name || "—"}</p></div>
          </div>
        ) : (
          <form onSubmit={handleSave} className="sd-edit-form">
            <div className="sd-form-grid">
              <div className="sd-form-field"><label>Shop Name *</label><input type="text" value={form.shop_name} onChange={(e) => setForm({ ...form, shop_name: e.target.value })} required /></div>
              {/* FIX 2: maxLength={1000} added to shop_description textarea */}
              <div className="sd-form-field sd-form-full"><label>Shop Description</label><textarea rows={3} maxLength={1000} value={form.shop_description} onChange={(e) => setForm({ ...form, shop_description: e.target.value })} /></div>
              <div className="sd-form-field"><label>City *</label><input type="text" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} required /></div>
              <div className="sd-form-field sd-form-full"><label>Address *</label><textarea rows={2} value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} required /></div>
            </div>
            <h4 className="sd-form-section-title">Bank Information</h4>
            <div className="sd-form-grid">
              <div className="sd-form-field"><label>Bank Name</label><input type="text" value={form.bank_name} onChange={(e) => setForm({ ...form, bank_name: e.target.value })} placeholder="e.g. Nabil Bank" /></div>
              <div className="sd-form-field"><label>Account Number</label><input type="text" value={form.bank_account_number} onChange={(e) => setForm({ ...form, bank_account_number: e.target.value })} /></div>
              <div className="sd-form-field"><label>Account Holder Name</label><input type="text" value={form.bank_account_name} onChange={(e) => setForm({ ...form, bank_account_name: e.target.value })} /></div>
            </div>
            <div className="sd-form-actions">
              <button type="button" className="sd-btn-outline" onClick={() => setIsEditing(false)}>Cancel</button>
              <button type="submit" className="sd-btn-primary" disabled={saving}>{saving ? "Saving…" : "Save Changes"}</button>
            </div>
          </form>
        )}
      </div>

      <div className="sd-section">
        <h3>Citizenship Document</h3>
        <p className="sd-section-hint">Upload a clear photo of your citizenship certificate for verification.</p>
        <div className="sd-citizenship-wrap">
          {seller?.citizenship_image ? (
            <div className="sd-citizenship-preview">
              <img src={`http://localhost:5000${seller.citizenship_image}`} alt="Citizenship" />
              <div className="sd-citizenship-overlay">
                <label className="sd-upload-btn">
                  {uploadingCitizenship ? "Uploading…" : "Update Document"}
                  <input type="file" accept="image/*" onChange={handleCitizenshipUpload} disabled={uploadingCitizenship} style={{ display: "none" }} />
                </label>
              </div>
            </div>
          ) : (
            <label className="sd-citizenship-upload-zone">
              <div className="sd-upload-icon">📄</div>
              <p>{uploadingCitizenship ? "Uploading…" : "Click to upload citizenship photo"}</p>
              <span>JPG, PNG up to 5MB</span>
              <input type="file" accept="image/*" onChange={handleCitizenshipUpload} disabled={uploadingCitizenship} style={{ display: "none" }} />
            </label>
          )}
        </div>
        <div className="sd-citizenship-info">
          <p><strong>Citizenship Number:</strong> {seller?.citizenship_number || "—"}</p>
          <p><strong>Approval Status:</strong> <span className={`sd-approval-badge ${seller?.approval_status}`}>{seller?.approval_status}</span></p>
          {seller?.rejection_reason && <p><strong>Rejection Reason:</strong> {seller.rejection_reason}</p>}
        </div>
      </div>
    </div>
  );
};

export default SellerDashboard;