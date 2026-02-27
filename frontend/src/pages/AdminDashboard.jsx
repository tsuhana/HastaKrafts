import React, { useEffect, useMemo, useState } from "react";
import { adminAPI, productAPI } from "../api/axios";
import "../styles/AdminDashboard.css";

/* ── SVG icons ── */
const Icons = {
  grid: (
    <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" />
      <rect x="14" y="14" width="7" height="7" rx="1.5" />
    </svg>
  ),
  shield: (
    <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2L3 7v5c0 5.25 3.75 10.15 9 11.35C17.25 22.15 21 17.25 21 12V7l-9-5z" />
    </svg>
  ),
  box: (
    <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z" />
      <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
      <line x1="12" y1="22.08" x2="12" y2="12" />
    </svg>
  ),
  star: (
    <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  ),
  image: (
    <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <circle cx="8.5" cy="8.5" r="1.5" />
      <polyline points="21 15 16 10 5 21" />
    </svg>
  ),
  mail: (
    <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
      <polyline points="22,6 12,13 2,6" />
    </svg>
  ),
  refresh: (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 4 23 10 17 10" />
      <path d="M20.49 15a9 9 0 11-2.12-9.36L23 10" />
    </svg>
  ),
};

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

/* ── Discount badge cell ── */
const DiscountCell = ({ product }) => {
  const hasDiscount = product.has_discount === true || product.has_discount === "true";
  const pct = parseInt(product.discount_percentage) || 0;
  if (hasDiscount && pct > 0) return <span className="discount-badge">−{pct}%</span>;
  return <span style={{ color: "var(--text-3)", fontSize: "0.72rem" }}>—</span>;
};

/* ── Product image cell ── */
const ProductImg = ({ src, alt }) => {
  if (src) {
    return (
      <img
        className="td-img"
        src={src}
        alt={alt}
        onError={(e) => { e.currentTarget.style.display = "none"; }}
      />
    );
  }
  return <div className="td-img-placeholder">No img</div>;
};

/* ════════════════════════════════════════
   MAIN COMPONENT
════════════════════════════════════════ */
const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState("overview");
  const [loading, setLoading] = useState(true);
  const [msgFilter, setMsgFilter] = useState("all");
  const [uploadingBanner, setUploadingBanner] = useState(false);

  const [stats, setStats] = useState({
    totalUsers: 0,
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
  const [allProducts, setAllProducts] = useState([]);
  const [banners, setBanners] = useState([]);
  const [contactMessages, setContactMessages] = useState([]);

  const API_URL = "http://localhost:5000";

  useEffect(() => {
    fetchDashboardData();
    fetchBanners();
    fetchContactMessages();
    // eslint-disable-next-line
  }, []);

  const safe = (v) => {
    if (v == null) return "—";
    const s = String(v).trim();
    return s || "—";
  };

  const parseDate = (raw) => {
    if (!raw) return null;
    const d = new Date(raw);
    return isNaN(d.getTime()) ? null : d;
  };

  const timeAgo = (seller) => {
    const d = parseDate(seller?.created_at || seller?.createdAt);
    if (!d) return "—";
    const days = Math.floor((Date.now() - d) / 86_400_000);
    if (days <= 0) return "Today";
    if (days === 1) return "1 day ago";
    return `${days} days ago`;
  };

  const initials = (name) => {
    const parts = (name || "").trim().split(" ").filter(Boolean);
    if (!parts.length) return "?";
    const a = parts[0][0] || "";
    const b = parts.length > 1 ? parts[parts.length - 1][0] : parts[0][1] || "";
    return (a + b).toUpperCase() || "?";
  };

  /* ── data fetching ── */
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
      } catch (err) {
        console.error("Fetch approved products error:", err);
      }
    } catch (err) {
      console.error("fetchDashboardData error:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchBanners = async () => {
    try {
      const res = await adminAPI.getAllBanners();
      if (res.data.success) setBanners(res.data.data || []);
    } catch (err) {
      console.error("Fetch banners error:", err);
    }
  };

  const fetchContactMessages = async () => {
    try {
      const res = await adminAPI.getAllContactMessages();
      if (res.data.success) setContactMessages(res.data.data || []);
    } catch (err) {
      console.error("Fetch contact messages error:", err);
    }
  };

  /* ── handlers ── */
  const handleUploadBanner = async (e) => {
    e.preventDefault();
    setUploadingBanner(true);
    try {
      const res = await adminAPI.createBanner(new FormData(e.target));
      if (res.data.success) {
        alert("Banner uploaded successfully!");
        fetchBanners();
        e.target.reset();
      }
    } catch (err) {
      alert(err.response?.data?.message || "Failed to upload banner");
    } finally {
      setUploadingBanner(false);
    }
  };

  const handleToggleBanner = async (bannerId) => {
    try {
      const res = await adminAPI.toggleBannerStatus(bannerId);
      if (res.data.success) { alert(res.data.message); fetchBanners(); }
    } catch { alert("Failed to toggle banner status"); }
  };

  const handleDeleteBanner = async (bannerId) => {
    if (!window.confirm("Delete this banner?")) return;
    try {
      const res = await adminAPI.deleteBanner(bannerId);
      if (res.data.success) { alert("Banner deleted"); fetchBanners(); }
    } catch { alert("Failed to delete banner"); }
  };

  const handleContactStatus = async (contactId, status) => {
    try {
      const res = await adminAPI.updateContactStatus(contactId, { status });
      if (res.data.success) { alert("Status updated"); fetchContactMessages(); }
    } catch { alert("Failed to update status"); }
  };

  const handleApproveSeller = async (sellerId) => {
    if (!window.confirm("Approve this seller?")) return;
    try {
      const res = await adminAPI.approveSeller(sellerId);
      if (res.data.success) { alert("Seller approved"); fetchDashboardData(); }
    } catch { alert("Failed to approve seller"); }
  };

  const handleRejectSeller = async (sellerId) => {
    const reason = window.prompt("Enter rejection reason:");
    if (!reason) return;
    try {
      const res = await adminAPI.rejectSeller(sellerId, { rejection_reason: reason });
      if (res.data.success) { alert("Seller rejected"); fetchDashboardData(); }
    } catch { alert("Failed to reject seller"); }
  };

  const handleApproveProduct = async (productId) => {
    if (!window.confirm("Approve this product?")) return;
    try {
      const res = await adminAPI.approveProduct(productId);
      if (res.data.success) { alert("Product approved"); fetchDashboardData(); }
    } catch { alert("Failed to approve product"); }
  };

  const handleRejectProduct = async (productId) => {
    const reason = window.prompt("Enter rejection reason:");
    if (!reason) return;
    try {
      const res = await adminAPI.rejectProduct(productId, { rejection_reason: reason });
      if (res.data.success) { alert("Product rejected"); fetchDashboardData(); }
    } catch { alert("Failed to reject product"); }
  };

  const handleToggleFeatured = async (productId) => {
    try {
      const res = await adminAPI.toggleFeatured(productId);
      if (res.data.success) { alert(res.data.message); fetchDashboardData(); }
    } catch (err) {
      alert(err.response?.data?.message || "Failed to update featured status");
    }
  };

  /* ── nav config ── */
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

  const sellerRate  = stats.totalSellerProfiles > 0
    ? Math.round((stats.approvedSellers / stats.totalSellerProfiles) * 100) : 0;
  const productRate = stats.totalProducts > 0
    ? Math.round((stats.approvedProducts / stats.totalProducts) * 100) : 0;

  const filteredMsgs = msgFilter === "all"
    ? contactMessages
    : contactMessages.filter((m) => m.status === msgFilter);

  /* ════════════════════════════════════════
     RENDER
  ════════════════════════════════════════ */
  return (
    <div className="admin-dashboard-container">

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
              <button className="btn-refresh" onClick={fetchDashboardData}>
                {Icons.refresh} Refresh
              </button>
            </div>

            {(stats.pendingSellers > 0 || stats.pendingProducts > 0) && (
              <div className="pending-alert">
                <span className="pending-dot" />
                <p>
                  {stats.pendingSellers > 0 && (
                    <strong>{stats.pendingSellers} seller{stats.pendingSellers > 1 ? "s" : ""}</strong>
                  )}
                  {stats.pendingSellers > 0 && stats.pendingProducts > 0 && " and "}
                  {stats.pendingProducts > 0 && (
                    <strong>{stats.pendingProducts} product{stats.pendingProducts > 1 ? "s" : ""}</strong>
                  )}
                  {" "}awaiting review
                </p>
                <button
                  className="pending-review-btn"
                  onClick={() => setActiveTab(stats.pendingSellers > 0 ? "sellers" : "products")}
                >
                  Review now →
                </button>
              </div>
            )}

            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-top">
                  <span className="stat-label">Total Users</span>
                </div>
                <div className="stat-number">{stats.totalUsers}</div>
                <div className="stat-sub">
                  <span>{stats.totalBuyers} buyers</span>
                  <span className="stat-dot">·</span>
                  <span>{stats.totalSellersUsers} sellers</span>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-top">
                  <span className="stat-label">Seller Profiles</span>
                  {stats.pendingSellers > 0 && (
                    <span className="stat-badge">{stats.pendingSellers} pending</span>
                  )}
                </div>
                <div className="stat-number">{stats.totalSellerProfiles}</div>
                <div className="stat-sub">
                  <span>{stats.approvedSellers} approved</span>
                  <span className="stat-dot">·</span>
                  <span>{stats.pendingSellers} pending</span>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-top">
                  <span className="stat-label">Total Products</span>
                  {stats.pendingProducts > 0 && (
                    <span className="stat-badge">{stats.pendingProducts} pending</span>
                  )}
                </div>
                <div className="stat-number">{stats.totalProducts}</div>
                <div className="stat-sub">
                  <span>{stats.approvedProducts} approved</span>
                  <span className="stat-dot">·</span>
                  <span>{stats.pendingProducts} pending</span>
                  <span className="stat-dot">·</span>
                  <span>{stats.rejectedProducts} rejected</span>
                </div>
              </div>
            </div>

            <div className="insights-grid">
              <div className="insight-card">
                <div className="insight-title">Seller Approval Rate</div>
                <div className="progress-row">
                  <div className="progress-track">
                    <div className="progress-fill fill-green" style={{ width: `${sellerRate}%` }} />
                  </div>
                  <span className="progress-pct">{sellerRate}%</span>
                </div>
                <p className="insight-note">{stats.approvedSellers} of {stats.totalSellerProfiles} sellers approved</p>
              </div>

              <div className="insight-card">
                <div className="insight-title">Product Approval Rate</div>
                <div className="progress-row">
                  <div className="progress-track">
                    <div className="progress-fill fill-amber" style={{ width: `${productRate}%` }} />
                  </div>
                  <span className="progress-pct">{productRate}%</span>
                </div>
                <p className="insight-note">{stats.approvedProducts} of {stats.totalProducts} products approved</p>
              </div>

              <div className="insight-card">
                <div className="insight-title">Quick Summary</div>
                <div className="summary-list">
                  <div className="summary-item">
                    <span>Active Sellers</span>
                    <strong>{stats.approvedSellers}</strong>
                  </div>
                  <div className="summary-item">
                    <span>Approved Products</span>
                    <strong>{stats.approvedProducts}</strong>
                  </div>
                  <div className="summary-item">
                    <span>Rejected Products</span>
                    <strong>{stats.rejectedProducts}</strong>
                  </div>
                  <div className="summary-item">
                    <span>Pending Reviews</span>
                    <strong>{stats.pendingSellers + stats.pendingProducts}</strong>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ══ SELLERS ══ */}
        {activeTab === "sellers" && (
          <div>
            <div className="page-header">
              <div>
                <h1>Artisan Verification</h1>
                <p>{pendingSellers.length} application{pendingSellers.length !== 1 ? "s" : ""} pending</p>
              </div>
            </div>

            {pendingSellers.length === 0 ? (
              <div className="empty-state">
                <p>No pending seller verifications</p>
              </div>
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
                        <button className="btn-reject" onClick={() => handleRejectSeller(seller.seller_id)}>Reject</button>
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
              <div>
                <h1>Pending Product Approvals</h1>
                <p>{pendingProducts.length} product{pendingProducts.length !== 1 ? "s" : ""} waiting for review</p>
              </div>
            </div>

            {pendingProducts.length === 0 ? (
              <div className="empty-state">
                <p>No pending products</p>
              </div>
            ) : (
              <div className="table-wrap">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Image</th>
                      <th>Product Name</th>
                      <th>Seller</th>
                      <th>Category</th>
                      <th>Price</th>
                      <th>Discount</th>
                      <th>Stock</th>
                      <th>Submitted</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pendingProducts.map((product) => {
                      const d = parseDate(product.created_at || product.createdAt);
                      return (
                        <tr key={product.product_id}>
                          <td>
                            <ProductImg
                              src={product.images?.length > 0 ? `${API_URL}${product.images[0]}` : null}
                              alt={product.name}
                            />
                          </td>
                          <td className="td-name">{product.name || "—"}</td>
                          <td>{product?.seller?.user?.full_name || "—"}</td>
                          <td>{product?.category?.name || "—"}</td>
                          <td><PriceCell product={product} /></td>
                          <td><DiscountCell product={product} /></td>
                          <td>
                            <span className={
                              product.stock_quantity > 10 ? "stock-good"
                              : product.stock_quantity > 0 ? "stock-low"
                              : "stock-out"
                            }>
                              {product.stock_quantity || 0} units
                            </span>
                          </td>
                          <td style={{ color: "var(--text-3)", fontSize: "0.72rem" }}>
                            {d ? d.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" }) : "—"}
                          </td>
                          <td>
                            <div className="actions-cell">
                              <button className="btn-approve" onClick={() => handleApproveProduct(product.product_id)}>Approve</button>
                              <button className="btn-reject" onClick={() => handleRejectProduct(product.product_id)}>Reject</button>
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
              <div>
                <h1>Manage Featured Products</h1>
                <p>Featured products are highlighted on the homepage</p>
              </div>
            </div>

            {allProducts.length === 0 ? (
              <div className="empty-state">
                <p>No approved products available</p>
              </div>
            ) : (
              <div className="table-wrap">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Image</th>
                      <th>Product Name</th>
                      <th>Shop</th>
                      <th>Category</th>
                      <th>Price</th>
                      <th>Discount</th>
                      <th>Featured</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allProducts.map((product) => (
                      <tr key={product.product_id}>
                        <td>
                          <ProductImg
                            src={product.images?.length > 0 ? `${API_URL}${product.images[0]}` : null}
                            alt={product.name}
                          />
                        </td>
                        <td className="td-name">{product.name || "—"}</td>
                        <td>{product?.seller?.shop_name || "—"}</td>
                        <td>{product?.category?.name || "—"}</td>
                        <td><PriceCell product={product} /></td>
                        <td><DiscountCell product={product} /></td>
                        <td>
                          {product.is_featured
                            ? <span className="featured-tag">★ Featured</span>
                            : <span style={{ color: "var(--text-3)", fontSize: "0.72rem" }}>Not featured</span>
                          }
                        </td>
                        <td>
                          <button
                            className={product.is_featured ? "btn-reject" : "btn-approve"}
                            onClick={() => handleToggleFeatured(product.product_id)}
                          >
                            {product.is_featured ? "Remove" : "Feature"}
                          </button>
                        </td>
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
            <div className="page-header">
              <div>
                <h1>Manage Festival Banners</h1>
                <p>Upload banners to display on homepage — recommended 1920×600px</p>
              </div>
            </div>

            <div className="section-card">
              <div className="section-title">Upload New Banner</div>
              <form onSubmit={handleUploadBanner} className="banner-form">
                <div className="form-row">
                  <div className="form-group">
                    <label>Title *</label>
                    <input type="text" name="title" required placeholder="e.g. Dashain Festival Sale" />
                  </div>
                  <div className="form-group">
                    <label>Banner Image * (1920×600px recommended)</label>
                    <input type="file" name="image" accept="image/*" required />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Link URL (optional)</label>
                    <input type="text" name="link_url" placeholder="/products?category=1 or external URL" />
                  </div>
                  <div className="form-group">
                    <label>Link Type</label>
                    <select name="link_type">
                      <option value="none">No Link</option>
                      <option value="category">Category</option>
                      <option value="product">Product</option>
                      <option value="external">External</option>
                    </select>
                  </div>
                </div>
                <div className="form-group">
                  <label>Description (optional)</label>
                  <textarea name="description" rows="3" placeholder="Brief description..." />
                </div>
                <button
                  type="submit"
                  className="btn-approve"
                  disabled={uploadingBanner}
                  style={{ width: "fit-content", padding: "7px 18px" }}
                >
                  {uploadingBanner ? "Uploading…" : "Upload Banner"}
                </button>
              </form>
            </div>

            <div className="section-card">
              <div className="section-title">Existing Banners ({banners.length})</div>
              {banners.length === 0 ? (
                <div className="empty-state" style={{ border: "none", padding: "24px 0 0" }}>
                  <p>No banners uploaded yet</p>
                </div>
              ) : (
                <div className="banners-grid">
                  {banners.map((banner) => (
                    <div key={banner.banner_id} className="banner-card">
                      <div className="banner-preview">
                        <img src={`${API_URL}${banner.image}`} alt={banner.title} />
                        {!banner.is_active && (
                          <div className="banner-inactive">Inactive</div>
                        )}
                      </div>
                      <div className="banner-info">
                        <h4>{banner.title}</h4>
                        {banner.description && <p className="banner-desc">{banner.description}</p>}
                        {banner.link_url && (
                          <p className="banner-link">{banner.link_type}: {banner.link_url}</p>
                        )}
                        <div className="banner-actions">
                          <button
                            className={banner.is_active ? "btn-reject" : "btn-approve"}
                            onClick={() => handleToggleBanner(banner.banner_id)}
                          >
                            {banner.is_active ? "Deactivate" : "Activate"}
                          </button>
                          <button className="btn-reject" onClick={() => handleDeleteBanner(banner.banner_id)}>
                            Delete
                          </button>
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
              <div>
                <h1>Contact Messages</h1>
                <p>{contactMessages.length} message{contactMessages.length !== 1 ? "s" : ""} from users</p>
              </div>
            </div>

            <div className="filter-bar">
              {["all", "pending", "resolved", "unresolved"].map((f) => (
                <button
                  key={f}
                  className={`filter-chip ${msgFilter === f ? "active" : ""}`}
                  onClick={() => setMsgFilter(f)}
                >
                  {f === "all"
                    ? `All (${contactMessages.length})`
                    : `${f.charAt(0).toUpperCase() + f.slice(1)} (${contactMessages.filter((m) => m.status === f).length})`
                  }
                </button>
              ))}
            </div>

            {filteredMsgs.length === 0 ? (
              <div className="no-messages">
                No {msgFilter !== "all" ? msgFilter : ""} messages found.
              </div>
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
                          <span className={`status-pill s-${contact.status}`}>{contact.status}</span>
                          {created && (
                            <span className="msg-date">{created.toLocaleDateString()}</span>
                          )}
                        </div>
                      </div>

                      <div className="msg-body">
                        <div className="msg-subject">
                          <strong>Subject:</strong> {contact.subject}
                        </div>
                        <div className="msg-text">{contact.message}</div>
                      </div>

                      <div className="msg-actions">
                        {(contact.status === "pending" || contact.status === "unresolved") && (
                          <button
                            className="btn-resolve"
                            onClick={() => handleContactStatus(contact.contact_id, "resolved")}
                          >
                            Mark Resolved
                          </button>
                        )}
                        {(contact.status === "pending" || contact.status === "resolved") && (
                          <button
                            className="btn-unresolve"
                            onClick={() => handleContactStatus(contact.contact_id, "unresolved")}
                          >
                            Mark Unresolved
                          </button>
                        )}
                        <button className="btn-delete">Delete</button>
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