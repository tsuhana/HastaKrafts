import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area, Legend, LineChart, Line,
} from "recharts";
import { productAPI, orderAPI, sellerAPI } from "../api/axios";
import { useToast } from "../context/ToastContext";
import { useTranslation } from "react-i18next";
import ConfirmModal from "../components/ConfirmModal";
import "../styles/SellerDashboard.css";

const API_URL = "http://localhost:5000";

const Icons = {
  overview:  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></svg>,
  analytics: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>,
  orders:    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/></svg>,
  products:  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/></svg>,
  shop:      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>,
  add:       <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>,
  auction:   <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2.5l7 7-7 7"/><path d="M9.5 7.5L2.5 14.5"/><path d="M6 21h12"/><path d="M12 17v4"/></svg>,
  upload:    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>,
  trendUp:   <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>,
  trendDown: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 18 13.5 8.5 8.5 13.5 1 6"/><polyline points="17 18 23 18 23 12"/></svg>,
  arrow:     <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>,
};

const STATUS_COLORS = { delivered: "#10B981", pending: "#F59E0B", processing: "#3B82F6", shipped: "#8B5CF6", cancelled: "#EF4444" };
const DONUT_COLORS  = ["#10B981", "#F59E0B", "#3B82F6", "#8B5CF6", "#EF4444"];

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

// ══════════════════════════════════════════
const SellerDashboard = () => {
  const toast = useToast();
  const { t } = useTranslation();

  const [activeTab, setActiveTab]       = useState("overview");
  const [loading, setLoading]           = useState(true);
  const [products, setProducts]         = useState([]);
  const [orders, setOrders]             = useState([]);
  const [stats, setStats]               = useState({ totalSales: 0, totalOrders: 0, activeProducts: 0, pendingProducts: 0 });
  const [analytics, setAnalytics]       = useState({
    kpis: { totalRevenue: 0, thisMonthRevenue: 0, lastMonthRevenue: 0, momGrowth: 0, aov: 0, fulfillmentRate: 0, cancellationRate: 0, totalOrders: 0, deliveredOrders: 0 },
    revenueByMonth: [], revenueByWeek: [], topProducts: [],
    ordersByStatus: [], revenueByDow: [], stockHealth: [],
  });
  const [analyticsLoaded, setAnalyticsLoaded] = useState(false);
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, productId: null });
  const [orderFilter, setOrderFilter]   = useState("all");
  const [orderPage, setOrderPage]       = useState(1);
  const ORDERS_PER_PAGE = 10;

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    try {
      setLoading(true);
      const [productRes, orderRes] = await Promise.all([productAPI.getSellerProducts(), orderAPI.getSellerOrders()]);

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
    } catch (err) {
      console.error("Dashboard fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      const res = await orderAPI.updateOrderStatus(orderId, { order_status: newStatus });
      if (res.data.success) { toast.success("Order status updated"); fetchAll(); }
    } catch { toast.error("Failed to update order status"); }
  };

  const handleDeleteConfirm = async () => {
    const { productId } = confirmModal;
    setConfirmModal({ isOpen: false, productId: null });
    try { await productAPI.deleteProduct(productId); toast.success("Product deleted"); fetchAll(); }
    catch { toast.error("Failed to delete product"); }
  };

  const getDiscountedPrice = (p) => {
    const has = p.has_discount === true || p.has_discount === "true";
    const pct = parseInt(p.discount_percentage) || 0;
    return has && pct > 0 ? Math.round(parseFloat(p.price) * (1 - pct / 100)) : null;
  };

  const pendingCount     = orders.filter((o) => o.order?.order_status === "pending").length;
  const filteredOrders   = orderFilter === "all" ? orders : orders.filter((o) => o.order?.order_status === orderFilter);
  const totalOrderPages  = Math.ceil(filteredOrders.length / ORDERS_PER_PAGE);
  const pagedOrders      = filteredOrders.slice((orderPage - 1) * ORDERS_PER_PAGE, orderPage * ORDERS_PER_PAGE);
  const totalDonut       = analytics.ordersByStatus.reduce((s, d) => s + d.count, 0);
  const bestDow          = analytics.revenueByDow?.length ? analytics.revenueByDow.reduce((a, b) => b.orders > a.orders ? b : a, analytics.revenueByDow[0]) : null;

  if (loading) return <div className="seller-page-wrap"><div className="sd-loading"><div className="sd-spinner" /><p>{t("common.loading")}</p></div></div>;

  return (
    <div className="seller-page-wrap">
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
              <div><div className="sd-footer-name">Artisan Dashboard</div><div className="sd-footer-role">Seller</div></div>
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
                <KpiCard label="Total Sales"      value={`Rs. ${stats.totalSales.toLocaleString()}`}  trend={analyticsLoaded ? analytics.kpis?.momGrowth : null} color="sales"    onClick={() => setActiveTab("analytics")} />
                <KpiCard label="Total Orders"     value={stats.totalOrders}   meta={`${pendingCount} this month`}              color="orders"   onClick={() => setActiveTab("orders")} />
                <KpiCard label="Active Products"  value={stats.activeProducts} meta={`${stats.pendingProducts} pending review`} color="products" onClick={() => setActiveTab("products")} />
                <KpiCard label="Order Items"      value={orders.length}       meta="View order analytics"                      color="items"    onClick={() => setActiveTab("analytics")} />
              </div>

              {/* Revenue trend + donut */}
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

              {/* Recent Orders */}
              <div className="sd-section">
                <div className="sd-section-header">
                  <h2>{t("seller.recent_orders")}</h2>
                  <button className="sd-btn-outline" onClick={() => setActiveTab("orders")}>View All →</button>
                </div>
                {orders.length === 0 ? <div className="sd-empty"><p>{t("seller.no_orders")}</p></div> : (
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

              {/* Analytics CTA */}
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
                <KpiCard label="Total Revenue"   value={`Rs. ${(analytics.kpis?.totalRevenue || stats.totalSales).toLocaleString()}`}  trend={analytics.kpis?.momGrowth} color="sales" />
                <KpiCard label="This Month"      value={`Rs. ${(analytics.kpis?.thisMonthRevenue || 0).toLocaleString()}`}               meta={`Last month: Rs. ${(analytics.kpis?.lastMonthRevenue || 0).toLocaleString()}`} color="orders" />
                <KpiCard label="Avg. Order Value" value={`Rs. ${(analytics.kpis?.aov || 0).toLocaleString()}`}                          meta="Per order item" color="products" />
                <KpiCard label="Total Orders"    value={analytics.kpis?.totalOrders || stats.totalOrders}                               meta={`${analytics.kpis?.deliveredOrders || 0} delivered`} color="items" />
              </div>

              {/* Section header */}
              <div className="sd-ana-section-head">
                <span className="sd-ana-section-icon">📈</span>
                <div><div className="sd-ana-section-title">Revenue Analytics</div><div className="sd-ana-section-sub">Track your earnings over time</div></div>
              </div>

              {/* Revenue 12mo area chart */}
              <div className="sd-chart-card" style={{ marginBottom: "1.25rem" }}>
                <div className="sd-chart-title">Revenue Over Time (12 Months)</div>
                {analytics.revenueByMonth.length === 0 ? <div className="sd-empty-chart">No revenue data yet</div> : (
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
                      <Line type="monotone" dataKey="orders"  name="Orders"        stroke="#2a9e6a" strokeWidth={2}   dot={false} activeDot={{ r: 4 }} />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </div>

              {/* Weekly + Top products */}
              <div className="sd-chart-row-2" style={{ marginBottom: "1.25rem" }}>
                <div className="sd-chart-card">
                  <div className="sd-chart-title">This Month (Weekly)</div>
                  {!analytics.revenueByWeek || analytics.revenueByWeek.every((w) => w.revenue === 0) ? <div className="sd-empty-chart">No data this month yet</div> : (
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
                  {analytics.topProducts.length === 0 ? <div className="sd-empty-chart">No product data yet</div> : (
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

              {/* Order analytics section */}
              <div className="sd-ana-section-head">
                <span className="sd-ana-section-icon">📦</span>
                <div><div className="sd-ana-section-title">Order Analytics</div><div className="sd-ana-section-sub">Order patterns and fulfillment performance</div></div>
              </div>

              <div className="sd-chart-row-2" style={{ marginBottom: "1.25rem" }}>
                <div className="sd-chart-card">
                  <div className="sd-chart-title">Orders by Status</div>
                  {analytics.ordersByStatus.length === 0 ? <div className="sd-empty-chart">No order data yet</div> : (
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
                  {!analytics.revenueByDow || analytics.revenueByDow.every((d) => d.orders === 0) ? <div className="sd-empty-chart">No data for last 30 days</div> : (
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

              {/* Stock health */}
              <div className="sd-ana-section-head">
                <span className="sd-ana-section-icon">🏪</span>
                <div><div className="sd-ana-section-title">Stock Health</div><div className="sd-ana-section-sub">Inventory levels across your catalog</div></div>
              </div>

              <div className="sd-chart-card" style={{ marginBottom: "1.5rem" }}>
                {analytics.stockHealth.length === 0 ? <div className="sd-empty-chart">No approved products yet</div> : (
                  <div className="sd-stock-grid">
                    {analytics.stockHealth.map((p) => {
                      const maxStock = Math.max(...analytics.stockHealth.map((x) => x.stock), 1);
                      const pct = Math.round((p.stock / maxStock) * 100);
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
                <div><h1>All Orders</h1><p>{orders.length} total order items</p></div>
              </div>
              <div className="sd-filter-bar">
                {["all","pending","processing","shipped","delivered","cancelled"].map((f) => (
                  <button key={f} className={`sd-filter-chip ${orderFilter === f ? "active" : ""}`} onClick={() => { setOrderFilter(f); setOrderPage(1); }}>
                    {f === "all" ? `All (${orders.length})` : `${f.charAt(0).toUpperCase()+f.slice(1)} (${orders.filter((o) => o.order?.order_status === f).length})`}
                  </button>
                ))}
              </div>
              <div className="sd-section">
                {pagedOrders.length === 0 ? <div className="sd-empty"><p>No orders found</p></div> : (
                  <>
                    <div className="sd-orders-list">
                      {pagedOrders.map((item) => (
                        <div key={item.order_item_id} className="sd-order-row sd-order-row-full">
                          <div className="sd-order-img">
                            {item.product?.images?.[0] ? <img src={`${API_URL}${item.product.images[0]}`} alt={item.product_name} /> : <div className="sd-order-no-img">📦</div>}
                          </div>
                          <div className="sd-order-info sd-order-info-full">
                            <div className="sd-order-num">#{item.order?.order_number}</div>
                            <div className="sd-order-product">{item.product_name}</div>
                            <div className="sd-order-meta">Customer: <strong>{item.order?.user?.full_name}</strong> · Qty: {item.quantity} · Rs. {parseFloat(item.subtotal).toLocaleString()}</div>
                            <div className="sd-order-date">{new Date(item.order?.createdAt || item.created_at).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}</div>
                          </div>
                          <div className="sd-order-actions">
                            <span className={`sd-payment-badge ${item.order?.payment_status === "paid" ? "paid" : "unpaid"}`}>{item.order?.payment_status === "paid" ? "Paid" : "Unpaid"}</span>
                            <select value={item.order?.order_status} onChange={(e) => handleStatusChange(item.order?.order_id, e.target.value)} className={`sd-status-select status-${item.order?.order_status}`}>
                              {["pending","processing","shipped","delivered","cancelled"].map((s) => <option key={s} value={s}>{s.charAt(0).toUpperCase()+s.slice(1)}</option>)}
                            </select>
                          </div>
                        </div>
                      ))}
                    </div>
                    {totalOrderPages > 1 && (
                      <div className="sd-pagination">
                        <button className="sd-page-btn" onClick={() => setOrderPage((p) => Math.max(1, p-1))} disabled={orderPage === 1}>←</button>
                        {Array.from({ length: totalOrderPages }, (_, i) => i+1).map((p) => <button key={p} className={`sd-page-btn ${orderPage === p ? "active" : ""}`} onClick={() => setOrderPage(p)}>{p}</button>)}
                        <button className="sd-page-btn" onClick={() => setOrderPage((p) => Math.min(totalOrderPages, p+1))} disabled={orderPage === totalOrderPages}>→</button>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          )}

          {/* ════════ MY PRODUCTS ════════ */}
          {activeTab === "products" && (
            <div>
              <div className="sd-page-header">
                <div><h1>{t("seller.your_products")}</h1><p>{products.length} products total · {stats.activeProducts} approved</p></div>
                <Link to="/seller/add-product" className="sd-btn-primary">+ {t("seller.add_product")}</Link>
              </div>
              {products.length === 0 ? (
                <div className="sd-empty"><p>{t("seller.no_products")}</p><Link to="/seller/add-product" className="sd-btn-primary">{t("seller.add_product")}</Link></div>
              ) : (
                <div className="sd-products-grid sd-products-grid-full">
                  {products.map((product) => {
                    const dp = getDiscountedPrice(product);
                    return (
                      <div key={product.product_id} className="sd-product-card">
                        <div className="sd-product-img">
                          {product.images?.[0] ? <img src={`${API_URL}${product.images[0]}`} alt={product.name} /> : <div className="sd-no-img">No Image</div>}
                          <span className={`sd-status-badge status-${product.status}`}>{product.status}</span>
                          {dp && <span className="sd-discount-badge">-{product.discount_percentage}%</span>}
                        </div>
                        <div className="sd-product-info">
                          <h4>{product.name}</h4>
                          {dp ? <div><p className="sd-price-orig">Rs. {parseFloat(product.price).toLocaleString()}</p><p className="sd-price-disc">Rs. {dp.toLocaleString()}</p></div> : <p className="sd-price">Rs. {parseFloat(product.price).toLocaleString()}</p>}
                          <p className="sd-stock">{product.stock_quantity} {t("seller.in_stock")}</p>
                        </div>
                        <div className="sd-product-actions">
                          <Link to={`/seller/edit-product/${product.product_id}`} className="sd-btn-icon">{t("seller.edit")}</Link>
                          <button onClick={() => setConfirmModal({ isOpen: true, productId: product.product_id })} className="sd-btn-icon">{t("seller.delete")}</button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {activeTab === "shop" && <ShopManagement toast={toast} t={t} />}
          <div className="sd-footer">© 2025 HastaKrafts Nepal. All rights reserved.</div>
        </main>
      </div>

      <ConfirmModal isOpen={confirmModal.isOpen} title="Delete this product?" message="This action cannot be undone."
        confirmText={t("common.delete")} cancelText={t("common.cancel")} confirmVariant="danger"
        onConfirm={handleDeleteConfirm} onCancel={() => setConfirmModal({ isOpen: false, productId: null })} />
    </div>
  );
};

// ══════════════════════════════════════════
const ShopManagement = ({ toast, t }) => {
  const [seller, setSeller]                         = useState(null);
  const [loading, setLoading]                       = useState(true);
  const [saving, setSaving]                         = useState(false);
  const [uploadingLogo, setUploadingLogo]           = useState(false);
  const [uploadingCitizenship, setUploadingCitizenship] = useState(false);
  const [isEditing, setIsEditing]                   = useState(false);
  const [form, setForm] = useState({ shop_name:"", shop_description:"", city:"", address:"", bank_name:"", bank_account_number:"", bank_account_name:"" });

  useEffect(() => { fetchSeller(); }, []);

  const fetchSeller = async () => {
    try { setLoading(true); const res = await sellerAPI.getProfile(); if (res.data.success) { const s = res.data.data; setSeller(s); setForm({ shop_name:s.shop_name||"", shop_description:s.shop_description||"", city:s.city||"", address:s.address||"", bank_name:s.bank_name||"", bank_account_number:s.bank_account_number||"", bank_account_name:s.bank_account_name||"" }); } }
    catch { toast.error("Failed to load shop info"); } finally { setLoading(false); }
  };
  const handleSave = async (e) => { e.preventDefault(); setSaving(true); try { const res = await sellerAPI.updateProfile(form); if (res.data.success) { toast.success("Shop profile updated!"); setIsEditing(false); fetchSeller(); } } catch (err) { toast.error(err.response?.data?.message||"Failed to update shop"); } finally { setSaving(false); } };
  const handleLogoUpload = async (e) => { const file=e.target.files[0]; if(!file) return; setUploadingLogo(true); try { const fd=new FormData(); fd.append("shop_logo",file); const res=await sellerAPI.uploadLogo(fd); if(res.data.success){toast.success("Shop logo updated!"); fetchSeller();} } catch(err){toast.error(err.response?.data?.message||"Failed to upload logo");} finally{setUploadingLogo(false);} };
  const handleCitizenshipUpload = async (e) => { const file=e.target.files[0]; if(!file) return; setUploadingCitizenship(true); try { const fd=new FormData(); fd.append("citizenship_image",file); const res=await sellerAPI.uploadCitizenship(fd); if(res.data.success){toast.success("Citizenship document updated!"); fetchSeller();} } catch(err){toast.error(err.response?.data?.message||"Failed to upload citizenship");} finally{setUploadingCitizenship(false);} };

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
          <div className="sd-logo-preview">{seller?.shop_logo ? <img src={`http://localhost:5000${seller.shop_logo}`} alt="Shop logo" /> : <div className="sd-logo-placeholder">{seller?.shop_name?.[0]?.toUpperCase()||"S"}</div>}</div>
          <div className="sd-logo-actions">
            <p className="sd-logo-hint">Upload a square image (recommended 400×400px, max 2MB)</p>
            <label className="sd-upload-btn">{uploadingLogo?"Uploading…":"Upload Logo"}<input type="file" accept="image/*" onChange={handleLogoUpload} disabled={uploadingLogo} style={{display:"none"}} /></label>
          </div>
        </div>
      </div>
      <div className="sd-section">
        <h3>Shop Information</h3>
        {!isEditing ? (
          <div className="sd-info-grid">
            <div className="sd-info-item"><label>Shop Name</label><p>{seller?.shop_name||"—"}</p></div>
            <div className="sd-info-item sd-info-full"><label>Description</label><p>{seller?.shop_description||"—"}</p></div>
            <div className="sd-info-item"><label>City</label><p>{seller?.city||"—"}</p></div>
            <div className="sd-info-item sd-info-full"><label>Address</label><p>{seller?.address||"—"}</p></div>
            <div className="sd-info-item"><label>Bank Name</label><p>{seller?.bank_name||"—"}</p></div>
            <div className="sd-info-item"><label>Account Number</label><p>{seller?.bank_account_number||"—"}</p></div>
            <div className="sd-info-item"><label>Account Holder</label><p>{seller?.bank_account_name||"—"}</p></div>
          </div>
        ) : (
          <form onSubmit={handleSave} className="sd-edit-form">
            <div className="sd-form-grid">
              <div className="sd-form-field"><label>Shop Name *</label><input type="text" value={form.shop_name} onChange={(e)=>setForm({...form,shop_name:e.target.value})} required /></div>
              <div className="sd-form-field sd-form-full"><label>Shop Description</label><textarea rows={3} value={form.shop_description} onChange={(e)=>setForm({...form,shop_description:e.target.value})} /></div>
              <div className="sd-form-field"><label>City *</label><input type="text" value={form.city} onChange={(e)=>setForm({...form,city:e.target.value})} required /></div>
              <div className="sd-form-field sd-form-full"><label>Address *</label><textarea rows={2} value={form.address} onChange={(e)=>setForm({...form,address:e.target.value})} required /></div>
            </div>
            <h4 className="sd-form-section-title">Bank Information</h4>
            <div className="sd-form-grid">
              <div className="sd-form-field"><label>Bank Name</label><input type="text" value={form.bank_name} onChange={(e)=>setForm({...form,bank_name:e.target.value})} placeholder="e.g. Nabil Bank" /></div>
              <div className="sd-form-field"><label>Account Number</label><input type="text" value={form.bank_account_number} onChange={(e)=>setForm({...form,bank_account_number:e.target.value})} /></div>
              <div className="sd-form-field"><label>Account Holder Name</label><input type="text" value={form.bank_account_name} onChange={(e)=>setForm({...form,bank_account_name:e.target.value})} /></div>
            </div>
            <div className="sd-form-actions">
              <button type="button" className="sd-btn-outline" onClick={()=>setIsEditing(false)}>Cancel</button>
              <button type="submit" className="sd-btn-primary" disabled={saving}>{saving?"Saving…":"Save Changes"}</button>
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
              <div className="sd-citizenship-overlay"><label className="sd-upload-btn">{uploadingCitizenship?"Uploading…":"Update Document"}<input type="file" accept="image/*" onChange={handleCitizenshipUpload} disabled={uploadingCitizenship} style={{display:"none"}} /></label></div>
            </div>
          ) : (
            <label className="sd-citizenship-upload-zone">
              <div className="sd-upload-icon">📄</div>
              <p>{uploadingCitizenship?"Uploading…":"Click to upload citizenship photo"}</p>
              <span>JPG, PNG up to 5MB</span>
              <input type="file" accept="image/*" onChange={handleCitizenshipUpload} disabled={uploadingCitizenship} style={{display:"none"}} />
            </label>
          )}
        </div>
        <div className="sd-citizenship-info">
          <p><strong>Citizenship Number:</strong> {seller?.citizenship_number||"—"}</p>
          <p><strong>Approval Status:</strong> <span className={`sd-approval-badge ${seller?.approval_status}`}>{seller?.approval_status}</span></p>
          {seller?.rejection_reason && <p><strong>Rejection Reason:</strong> {seller.rejection_reason}</p>}
        </div>
      </div>
    </div>
  );
};

export default SellerDashboard;