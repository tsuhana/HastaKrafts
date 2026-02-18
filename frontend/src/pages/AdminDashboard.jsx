import React, { useEffect, useMemo, useState } from "react";
import { adminAPI } from "../api/axios";
import "../styles/AdminDashboard.css";

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState("overview");
  const [loading, setLoading] = useState(true);

  const [stats, setStats] = useState({
    totalUsers: 0,
    totalAdmins: 0,
    totalSellersUsers: 0,
    totalBuyers: 0,
    totalSellerProfiles: 0,
    pendingSellers: 0,
    approvedSellers: 0,
    totalProducts: 0,
    pendingProducts: 0,
    approvedProducts: 0,
    rejectedProducts: 0,
  });

  const [pendingSellers, setPendingSellers] = useState([]);
  const [pendingProducts, setPendingProducts] = useState([]);

  const API_URL = "http://localhost:5000";

  useEffect(() => {
    fetchDashboardData();
    // eslint-disable-next-line
  }, []);

  const safeText = (v) => {
    if (v === null || v === undefined) return "N/A";
    const s = String(v).trim();
    return s ? s : "N/A";
  };

  const parseDateSafe = (raw) => {
    if (!raw) return null;
    const d = new Date(raw);
    return Number.isNaN(d.getTime()) ? null : d;
  };

  const formatApplied = (seller) => {
    const raw = seller?.created_at || seller?.createdAt;
    const d = parseDateSafe(raw);
    if (!d) return "N/A";
    const now = new Date();
    const diffDays = Math.floor((now - d) / (1000 * 60 * 60 * 24));
    if (diffDays <= 0) return "Today";
    if (diffDays === 1) return "1 day ago";
    return `${diffDays} days ago`;
  };

  const getInitials = (name) => {
    const n = (name || "").trim();
    if (!n) return "NA";
    const parts = n.split(" ").filter(Boolean);
    const a = parts[0]?.[0] || "";
    const b = parts.length > 1 ? parts[parts.length - 1]?.[0] : parts[0]?.[1] || "";
    return (a + b).toUpperCase() || "NA";
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
          totalUsers: d?.users?.total || 0,
          totalAdmins: 0,
          totalSellersUsers: d?.users?.sellers || 0,
          totalBuyers: d?.users?.buyers || 0,
          totalSellerProfiles: d?.sellers?.total || 0,
          pendingSellers: d?.sellers?.pending || 0,
          approvedSellers: d?.sellers?.approved || 0,
          totalProducts: d?.products?.total || 0,
          pendingProducts: d?.products?.pending || 0,
          approvedProducts: d?.products?.approved || 0,
          rejectedProducts: d?.products?.rejected || 0,
        });
      }

      if (sellersRes?.data?.success) {
        setPendingSellers(sellersRes.data.data || []);
      }
      if (productsRes?.data?.success) {
        setPendingProducts(productsRes.data.data || []);
      }
    } catch (err) {
      console.error("fetchDashboardData error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveSeller = async (sellerId) => {
    if (!window.confirm("Approve this seller?")) return;
    try {
      const res = await adminAPI.approveSeller(sellerId);
      if (res.data.success) { alert("Seller approved"); fetchDashboardData(); }
    } catch (err) { console.error(err); alert("Failed to approve seller"); }
  };

  const handleRejectSeller = async (sellerId) => {
    const reason = prompt("Enter rejection reason:");
    if (!reason) return;
    try {
      const res = await adminAPI.rejectSeller(sellerId, { rejection_reason: reason });
      if (res.data.success) { alert("Seller rejected"); fetchDashboardData(); }
    } catch (err) { console.error(err); alert("Failed to reject seller"); }
  };

  const handleApproveProduct = async (productId) => {
    if (!window.confirm("Approve this product?")) return;
    try {
      const res = await adminAPI.approveProduct(productId);
      if (res.data.success) { alert("Product approved"); fetchDashboardData(); }
    } catch (err) { console.error(err); alert("Failed to approve product"); }
  };

  const handleRejectProduct = async (productId) => {
    const reason = prompt("Enter rejection reason:");
    if (!reason) return;
    try {
      const res = await adminAPI.rejectProduct(productId, { rejection_reason: reason });
      if (res.data.success) { alert("Product rejected"); fetchDashboardData(); }
    } catch (err) { console.error(err); alert("Failed to reject product"); }
  };

  const nav = useMemo(
    () => [
      { key: "overview", label: "Overview", badge: 0 },
      { key: "sellers", label: "Artisan Verification", badge: pendingSellers.length },
      { key: "products", label: "Product Approvals", badge: pendingProducts.length },
    ],
    [pendingSellers.length, pendingProducts.length]
  );

  if (loading) {
    return (
      <div className="admin-loading">
        <div className="spinner" />
        <p>Loading dashboard...</p>
      </div>
    );
  }

  const sellerApprovalRate = stats.totalSellerProfiles > 0
    ? Math.round((stats.approvedSellers / stats.totalSellerProfiles) * 100) : 0;
  const productApprovalRate = stats.totalProducts > 0
    ? Math.round((stats.approvedProducts / stats.totalProducts) * 100) : 0;

  return (
    <div className="admin-dashboard-container">
      {/* Sidebar - UNCHANGED */}
      <aside className="admin-sidebar">
        <div className="sidebar-header">
          <h2>Admin Panel</h2>
        </div>
        <nav className="sidebar-nav">
          {nav.map((item) => (
            <button
              key={item.key}
              className={`nav-item ${activeTab === item.key ? "active" : ""}`}
              onClick={() => setActiveTab(item.key)}
            >
              {item.label}
              {item.badge > 0 && <span className="badge">{item.badge}</span>}
            </button>
          ))}
        </nav>
      </aside>

      <main className="admin-main">
        {/* ===================== OVERVIEW (REDESIGNED) ===================== */}
        {activeTab === "overview" && (
          <div className="admin-content">
            <div className="overview-top">
              <h1>Dashboard Overview</h1>
              <button className="btn-refresh" onClick={fetchDashboardData}>Refresh</button>
            </div>

            {/* Pending Alert */}
            {(stats.pendingSellers > 0 || stats.pendingProducts > 0) && (
              <div className="pending-alert">
                <span className="pending-dot"></span>
                <p>
                  {stats.pendingSellers > 0 && (
                    <strong>{stats.pendingSellers} seller{stats.pendingSellers > 1 ? "s" : ""}</strong>
                  )}
                  {stats.pendingSellers > 0 && stats.pendingProducts > 0 && " and "}
                  {stats.pendingProducts > 0 && (
                    <strong>{stats.pendingProducts} product{stats.pendingProducts > 1 ? "s" : ""}</strong>
                  )}
                  {" "}awaiting your review
                </p>
                <button
                  className="pending-review-btn"
                  onClick={() => setActiveTab(stats.pendingSellers > 0 ? "sellers" : "products")}
                >
                  Review now
                </button>
              </div>
            )}

            {/* Stats */}
            <div className="stats-grid">
              <div className="stat-card">
                <span className="stat-label">Total Users</span>
                <h3 className="stat-number">{stats.totalUsers}</h3>
                <div className="stat-sub">
                  <span>{stats.totalBuyers} buyers</span>
                  <span className="stat-sep">·</span>
                  <span>{stats.totalSellersUsers} sellers</span>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-label-row">
                  <span className="stat-label">Seller Profiles</span>
                  {stats.pendingSellers > 0 && (
                    <span className="stat-badge-pending">{stats.pendingSellers} pending</span>
                  )}
                </div>
                <h3 className="stat-number">{stats.totalSellerProfiles}</h3>
                <div className="stat-sub">
                  <span>{stats.approvedSellers} approved</span>
                  <span className="stat-sep">·</span>
                  <span>{stats.pendingSellers} pending</span>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-label-row">
                  <span className="stat-label">Total Products</span>
                  {stats.pendingProducts > 0 && (
                    <span className="stat-badge-pending">{stats.pendingProducts} pending</span>
                  )}
                </div>
                <h3 className="stat-number">{stats.totalProducts}</h3>
                <div className="stat-sub">
                  <span>{stats.approvedProducts} approved</span>
                  <span className="stat-sep">·</span>
                  <span>{stats.pendingProducts} pending</span>
                  <span className="stat-sep">·</span>
                  <span>{stats.rejectedProducts} rejected</span>
                </div>
              </div>
            </div>

            {/* Insights */}
            <div className="insights-grid">
              <div className="insight-card">
                <h4>Seller Approval Rate</h4>
                <div className="progress-row">
                  <div className="progress-track">
                    <div className="progress-fill fill-green" style={{ width: `${sellerApprovalRate}%` }}></div>
                  </div>
                  <span className="progress-pct">{sellerApprovalRate}%</span>
                </div>
                <p className="insight-note">{stats.approvedSellers} of {stats.totalSellerProfiles} sellers approved</p>
              </div>

              <div className="insight-card">
                <h4>Product Approval Rate</h4>
                <div className="progress-row">
                  <div className="progress-track">
                    <div className="progress-fill fill-amber" style={{ width: `${productApprovalRate}%` }}></div>
                  </div>
                  <span className="progress-pct">{productApprovalRate}%</span>
                </div>
                <p className="insight-note">{stats.approvedProducts} of {stats.totalProducts} products approved</p>
              </div>

              <div className="insight-card">
                <h4>Quick Summary</h4>
                <div className="summary-list">
                  <div className="summary-item">
                    <span>Active Sellers</span>
                    <strong>{stats.approvedSellers}</strong>
                  </div>
                  <div className="summary-item">
                    <span>Live Products</span>
                    <strong>{stats.approvedProducts}</strong>
                  </div>
                  <div className="summary-item">
                    <span>Rejected Products</span>
                    <strong>{stats.rejectedProducts}</strong>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ===================== SELLERS (UNCHANGED) ===================== */}
        {activeTab === "sellers" && (
          <div className="admin-content">
            <h1>Artisan Verification Requests</h1>

            {pendingSellers.length === 0 ? (
              <div className="empty-state">
                <p>No pending seller verifications</p>
              </div>
            ) : (
              <div className="verification-list">
                {pendingSellers.map((seller) => {
                  const u = seller?.user || {};
                  const fullName = u.full_name || u.name || "";
                  const shopName = seller?.shop_name || "N/A";

                  return (
                    <div key={seller.seller_id} className="verification-card-wide">
                      <div className="verification-left">
                        <div className="seller-avatar-large">{getInitials(fullName || shopName)}</div>
                        <div className="seller-title">
                          <h3>{fullName?.trim() ? fullName : "No name provided"}</h3>
                          <p className="shop-name-badge">{shopName}</p>
                          <p style={{ marginTop: "0.5rem", color: "#5D4E37", fontSize: "0.85rem" }}>
                            Applied: {formatApplied(seller)}
                          </p>
                        </div>
                      </div>

                      <div className="verification-center">
                        <div className="details-compact">
                          <div className="detail-row"><div><label>Email</label><p>{safeText(u.email)}</p></div></div>
                          <div className="detail-row"><div><label>Phone</label><p>{safeText(u.phone)}</p></div></div>
                          <div className="detail-row"><div><label>Location</label><p>{safeText(seller.city)}{seller.address ? `, ${seller.address}` : ""}</p></div></div>
                          <div className="detail-row"><div><label>Citizenship No.</label><p>{safeText(seller.citizenship_number)}</p></div></div>
                          <div className="detail-row"><div><label>Bank</label><p>{safeText(seller.bank_name)}</p></div></div>
                          <div className="detail-row"><div><label>Account No.</label><p>{safeText(seller.bank_account_number)}</p></div></div>
                          <div className="detail-row"><div><label>Account Name</label><p>{safeText(seller.bank_account_name)}</p></div></div>
                        </div>
                      </div>

                      <div className="verification-right">
                        <button onClick={() => handleApproveSeller(seller.seller_id)} className="btn-approve">Approve</button>
                        <button onClick={() => handleRejectSeller(seller.seller_id)} className="btn-reject">Reject</button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ===================== PRODUCTS (UNCHANGED) ===================== */}
        {activeTab === "products" && (
          <div className="admin-content">
            <h1>Pending Product Approvals</h1>

            {pendingProducts.length === 0 ? (
              <div className="empty-state">
                <p>No pending products</p>
              </div>
            ) : (
              <div className="products-table-container">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Image</th>
                      <th>Product Name</th>
                      <th>Seller</th>
                      <th>Category</th>
                      <th>Price</th>
                      <th>Stock</th>
                      <th>Submitted</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pendingProducts.map((product) => {
                      const created = product.created_at || product.createdAt;
                      const d = parseDateSafe(created);
                      return (
                        <tr key={product.product_id}>
                          <td>
                            <div className="product-image-cell">
                              {product.images && product.images.length > 0 ? (
                                <img src={`${API_URL}${product.images[0]}`} alt={product.name} onError={(e) => { e.currentTarget.style.display = "none"; }} />
                              ) : (
                                <div className="no-image">No</div>
                              )}
                            </div>
                          </td>
                          <td className="product-name">{product.name || "N/A"}</td>
                          <td>{product?.seller?.user?.full_name || "Unknown"}</td>
                          <td>{product?.category?.name || "N/A"}</td>
                          <td className="product-price">Rs. {product.price ? parseFloat(product.price).toLocaleString() : "0"}</td>
                          <td>
                            <span className={product.stock_quantity > 10 ? "stock-good" : product.stock_quantity > 0 ? "stock-low" : "stock-out"}>
                              {product.stock_quantity || 0} units
                            </span>
                          </td>
                          <td>{d ? d.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" }) : "N/A"}</td>
                          <td className="actions-cell">
                            <button onClick={() => handleApproveProduct(product.product_id)} className="btn-approve">Approve</button>
                            <button onClick={() => handleRejectProduct(product.product_id)} className="btn-reject">Reject</button>
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
      </main>
    </div>
  );
};

export default AdminDashboard;