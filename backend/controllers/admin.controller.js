const db = require("../models");
const { sendSellerApprovalEmail, sendSellerRejectionEmail } = require("../utils/email");

// ==================== DASHBOARD STATS ====================
const getDashboardStats = async (req, res) => {
  try {
    const { Op } = db.Sequelize;

    const totalUsers       = await db.User.count();
    const totalBuyers      = await db.User.count({ where: { role: "buyer" } });
    const totalSellerUsers = await db.User.count({ where: { role: "seller" } });

    const totalSellers    = await db.Seller.count();
    const pendingSellers  = await db.Seller.count({ where: { approval_status: "pending" } });
    const approvedSellers = await db.Seller.count({ where: { approval_status: "approved" } });
    const rejectedSellers = await db.Seller.count({ where: { approval_status: "rejected" } });

    const totalProducts    = await db.Product.count();
    const pendingProducts  = await db.Product.count({ where: { status: "pending" } });
    const approvedProducts = await db.Product.count({ where: { status: "approved" } });
    const rejectedProducts = await db.Product.count({ where: { status: "rejected" } });

    let totalOrders = 0, pendingOrders = 0, completedOrders = 0, totalRevenue = 0;
    try {
      totalOrders     = await db.Order.count();
      pendingOrders   = await db.Order.count({ where: { status: "pending" } });
      completedOrders = await db.Order.count({ where: { status: "delivered" } });
      const revenueResult = await db.Order.sum("total_amount", { where: { payment_status: "paid" } });
      totalRevenue = revenueResult || 0;
    } catch (_) {}

    // Pending auctions count for sidebar badge
    let pendingAuctions = 0;
    try {
      pendingAuctions = await db.Auction.count({ where: { approval_status: "pending" } });
    } catch (_) {}

    res.status(200).json({
      success: true,
      data: {
        users:    { total: totalUsers, buyers: totalBuyers, sellers: totalSellerUsers },
        sellers:  { total: totalSellers, pending: pendingSellers, approved: approvedSellers, rejected: rejectedSellers },
        products: { total: totalProducts, pending: pendingProducts, approved: approvedProducts, rejected: rejectedProducts },
        orders:   { total: totalOrders, pending: pendingOrders, completed: completedOrders, revenue: totalRevenue },
        auctions: { pending: pendingAuctions },
      },
    });
  } catch (error) {
    console.error("Get dashboard stats error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch dashboard stats" });
  }
};

// ==================== ANALYTICS ====================
const getAnalytics = async (req, res) => {
  try {
    const { Op, fn, col, literal } = db.Sequelize;
    const now = new Date();

    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(now.getDate() - 6);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    let dailyRaw = [];
    try {
      dailyRaw = await db.Order.findAll({
        attributes: [
          [fn("DATE", col("created_at")), "date"],
          [fn("COUNT", col("order_id")), "orders"],
          [fn("SUM", col("total_amount")), "revenue"],
        ],
        where: { created_at: { [Op.gte]: sevenDaysAgo }, payment_status: "paid" },
        group: [fn("DATE", col("created_at"))],
        order: [[fn("DATE", col("created_at")), "ASC"]],
        raw: true,
      });
    } catch (_) {}

    const dailySales = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      const dateStr = d.toISOString().split("T")[0];
      const found = dailyRaw.find((r) => r.date === dateStr);
      dailySales.push({
        date:    d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        orders:  found ? parseInt(found.orders) || 0 : 0,
        revenue: found ? Math.round(parseFloat(found.revenue) || 0) : 0,
      });
    }

    const sixMonthsAgo = new Date(now);
    sixMonthsAgo.setMonth(now.getMonth() - 5);
    sixMonthsAgo.setDate(1);
    sixMonthsAgo.setHours(0, 0, 0, 0);

    let monthlyRaw = [];
    try {
      monthlyRaw = await db.Order.findAll({
        attributes: [
          [fn("TO_CHAR", col("created_at"), "YYYY-MM"), "month_key"],
          [fn("COUNT", col("order_id")), "orders"],
          [fn("SUM", col("total_amount")), "revenue"],
        ],
        where: { created_at: { [Op.gte]: sixMonthsAgo }, payment_status: "paid" },
        group: [fn("TO_CHAR", col("created_at"), "YYYY-MM")],
        order: [[fn("TO_CHAR", col("created_at"), "YYYY-MM"), "ASC"]],
        raw: true,
      });
    } catch (_) {}

    const monthlySales = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now);
      d.setMonth(now.getMonth() - i);
      const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const found = monthlyRaw.find((r) => r.month_key === monthKey);
      monthlySales.push({
        month:   d.toLocaleDateString("en-US", { month: "short" }),
        orders:  found ? parseInt(found.orders) || 0 : 0,
        revenue: found ? Math.round(parseFloat(found.revenue) || 0) : 0,
      });
    }

    let productDonut = [];
    try {
      const productStats = await db.Product.findAll({
        attributes: ["status", [fn("COUNT", col("product_id")), "count"]],
        group: ["status"],
        raw: true,
      });
      productDonut = productStats.map((p) => ({
        name:  p.status.charAt(0).toUpperCase() + p.status.slice(1),
        value: parseInt(p.count) || 0,
      }));
    } catch (_) {}

    let orderDonut = [];
    try {
      const orderStats = await db.Order.findAll({
        attributes: ["order_status", [fn("COUNT", col("order_id")), "count"]],
        group: ["order_status"],
        raw: true,
      });
      orderDonut = orderStats.map((o) => ({
        name:  o.order_status.charAt(0).toUpperCase() + o.order_status.slice(1),
        value: parseInt(o.count) || 0,
      }));
    } catch (_) {}

    let topCategories = [];
    try {
      const cats = await db.Category.findAll({
        attributes: ["name", [fn("COUNT", col("products.product_id")), "count"]],
        include: [{
          model: db.Product, as: "products", attributes: [],
          where: { status: "approved" }, required: false,
        }],
        group: ["Category.category_id"],
        order: [[literal("count"), "DESC"]],
        limit: 5,
        subQuery: false,
        raw: true,
      });
      topCategories = cats.map((c) => ({ name: c.name, count: parseInt(c.count) || 0 })).filter((c) => c.count > 0);
    } catch (_) {}

    let topSellers = [];
    try {
      const sellers = await db.Seller.findAll({
        attributes: ["shop_name", [fn("COUNT", col("orderItems.order_item_id")), "sales"]],
        include: [{ model: db.OrderItem, as: "orderItems", attributes: [], required: false }],
        group: ["Seller.seller_id"],
        order: [[literal("sales"), "DESC"]],
        limit: 5,
        subQuery: false,
        raw: true,
      });
      topSellers = sellers.map((s) => ({ name: s.shop_name || "Unknown", sales: parseInt(s.sales) || 0 })).filter((s) => s.sales > 0);
    } catch (_) {}

    let totalRevenue = 0, thisMonthRevenue = 0, totalOrders = 0;
    try {
      const totalRevRes = await db.Order.findOne({
        attributes: [[fn("SUM", col("total")), "total"]],
        where: { payment_status: "paid" },
        raw: true,
      });
      totalRevenue = Math.round(parseFloat(totalRevRes?.total) || 0);
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const monthRevRes = await db.Order.findOne({
        attributes: [[fn("SUM", col("total")), "total"]],
        where: { payment_status: "paid", created_at: { [Op.gte]: startOfMonth } },
        raw: true,
      });
      thisMonthRevenue = Math.round(parseFloat(monthRevRes?.total) || 0);
      totalOrders = await db.Order.count({ where: { payment_status: "paid" } });
    } catch (_) {}

    res.json({
      success: true,
      data: {
        dailySales, monthlySales, productDonut, orderDonut, topCategories, topSellers,
        summary: { totalRevenue, thisMonthRevenue, totalOrders },
      },
    });
  } catch (error) {
    console.error("Analytics error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch analytics" });
  }
};

// ==================== GET PENDING SELLERS ====================
const getPendingSellers = async (req, res) => {
  try {
    const sellers = await db.Seller.findAll({
      where: { approval_status: "pending" },
      include: [{ model: db.User, as: "user", attributes: ["user_id", "full_name", "email", "phone"] }],
      order: [["created_at", "ASC"]],
    });
    res.status(200).json({ success: true, data: sellers });
  } catch (error) {
    console.error("Get pending sellers error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch pending sellers" });
  }
};

// ==================== APPROVE SELLER ====================
const approveSeller = async (req, res) => {
  try {
    const { id } = req.params;
    const seller = await db.Seller.findByPk(id, {
      include: [{ model: db.User, as: "user", attributes: ["full_name", "email"] }],
    });
    if (!seller) return res.status(404).json({ success: false, message: "Seller not found" });
    await seller.update({ approval_status: "approved", approved_at: new Date() });
    if (seller.user?.email) {
      sendSellerApprovalEmail(seller.user.email, seller.user.full_name, seller.shop_name || "your shop")
        .catch((err) => console.error("Approval email error (non-fatal):", err.message));
    }
    res.status(200).json({ success: true, message: "Seller approved successfully", data: seller });
  } catch (error) {
    console.error("Approve seller error:", error);
    res.status(500).json({ success: false, message: "Failed to approve seller" });
  }
};

// ==================== REJECT SELLER ====================
const rejectSeller = async (req, res) => {
  try {
    const { id } = req.params;
    const { rejection_reason } = req.body;
    if (!rejection_reason || !rejection_reason.trim()) {
      return res.status(400).json({ success: false, message: "Please provide a rejection reason" });
    }
    const seller = await db.Seller.findByPk(id, {
      include: [{ model: db.User, as: "user", attributes: ["full_name", "email"] }],
    });
    if (!seller) return res.status(404).json({ success: false, message: "Seller not found" });
    await seller.update({ approval_status: "rejected", rejection_reason: rejection_reason.trim() });
    if (seller.user?.email) {
      sendSellerRejectionEmail(seller.user.email, seller.user.full_name, seller.shop_name || "your shop", rejection_reason.trim())
        .catch((err) => console.error("Rejection email error (non-fatal):", err.message));
    }
    res.status(200).json({ success: true, message: "Seller rejected", data: seller });
  } catch (error) {
    console.error("Reject seller error:", error);
    res.status(500).json({ success: false, message: "Failed to reject seller" });
  }
};

// ==================== GET PENDING PRODUCTS ====================
const getPendingProducts = async (req, res) => {
  try {
    const products = await db.Product.findAll({
      where: { status: "pending" },
      include: [
        {
          model: db.Seller,
          as: "seller",
          attributes: ["seller_id", "shop_name"],
          include: [{ model: db.User, as: "user", attributes: ["full_name", "email"] }],
        },
        { model: db.Category, as: "category", attributes: ["category_id", "name", "icon"] },
      ],
      order: [["created_at", "ASC"]],
    });
    res.status(200).json({ success: true, data: products });
  } catch (error) {
    console.error("Get pending products error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch pending products" });
  }
};

// ==================== APPROVE PRODUCT ====================
const approveProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const product = await db.Product.findByPk(id);
    if (!product) return res.status(404).json({ success: false, message: "Product not found" });
    await product.update({ status: "approved", approved_at: new Date(), approved_by: req.user.user_id });
    res.status(200).json({ success: true, message: "Product approved successfully", data: product });
  } catch (error) {
    console.error("Approve product error:", error);
    res.status(500).json({ success: false, message: "Failed to approve product" });
  }
};

// ==================== REJECT PRODUCT ====================
const rejectProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const { rejection_reason } = req.body;
    if (!rejection_reason) return res.status(400).json({ success: false, message: "Please provide rejection reason" });
    const product = await db.Product.findByPk(id);
    if (!product) return res.status(404).json({ success: false, message: "Product not found" });
    await product.update({ status: "rejected", rejection_reason });
    res.status(200).json({ success: true, message: "Product rejected", data: product });
  } catch (error) {
    console.error("Reject product error:", error);
    res.status(500).json({ success: false, message: "Failed to reject product" });
  }
};

// ==================== GET ALL USERS ====================
const getAllUsers = async (req, res) => {
  try {
    const users = await db.User.findAll({
      attributes: { exclude: ["password"] },
      order: [["created_at", "DESC"]],
    });
    res.status(200).json({ success: true, data: users });
  } catch (error) {
    console.error("Get all users error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch users" });
  }
};

// ==================== GET ALL SELLERS ====================
const getAllSellers = async (req, res) => {
  try {
    const sellers = await db.Seller.findAll({
      include: [{ model: db.User, as: "user", attributes: ["user_id", "full_name", "email", "phone", "is_active"] }],
      order: [["created_at", "DESC"]],
    });
    res.status(200).json({ success: true, data: sellers });
  } catch (error) {
    console.error("Get all sellers error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch sellers" });
  }
};

// ==================== GET ALL ORDERS ====================
const getAllOrders = async (req, res) => {
  try {
    const orders = await db.Order.findAll({
      include: [
        { model: db.User, as: "user", attributes: ["user_id", "full_name", "email", "phone"] },
        {
          model: db.OrderItem,
          as: "items",
          include: [
            { model: db.Product, as: "product", attributes: ["product_id", "name", "images"] },
            { model: db.Seller, as: "seller", attributes: ["seller_id", "shop_name"] },
          ],
        },
      ],
      order: [["created_at", "DESC"]],
    });
    res.status(200).json({ success: true, data: orders });
  } catch (error) {
    console.error("Get all orders error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch orders" });
  }
};

// ==================== GET ALL REVIEWS ====================
const getAllReviews = async (req, res) => {
  try {
    const reviews = await db.Review.findAll({
      include: [
        { model: db.User, as: "user", attributes: ["user_id", "full_name", "email"] },
        { model: db.Product, as: "product", attributes: ["product_id", "name", "images"] },
      ],
      order: [["created_at", "DESC"]],
    });
    res.status(200).json({ success: true, data: reviews });
  } catch (error) {
    console.error("Get all reviews error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch reviews" });
  }
};

// ==================== DELETE REVIEW ====================
const deleteReview = async (req, res) => {
  try {
    const { id } = req.params;
    const review = await db.Review.findByPk(id);
    if (!review) return res.status(404).json({ success: false, message: "Review not found" });
    await review.destroy();
    res.status(200).json({ success: true, message: "Review deleted successfully" });
  } catch (error) {
    console.error("Delete review error:", error);
    res.status(500).json({ success: false, message: "Failed to delete review" });
  }
};

// ==================== TOGGLE BLOCK USER ====================
const toggleBlockUser = async (req, res) => {
  try {
    const { id } = req.params;
    if (parseInt(id) === req.user.user_id) {
      return res.status(400).json({ success: false, message: "You cannot block yourself" });
    }
    const user = await db.User.findByPk(id);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });
    if (user.role === "admin") return res.status(400).json({ success: false, message: "Cannot block an admin account" });
    await user.update({ is_active: !user.is_active });
    res.status(200).json({
      success: true,
      message: user.is_active ? "User unblocked successfully" : "User blocked successfully",
      data: { user_id: user.user_id, is_active: user.is_active },
    });
  } catch (error) {
    console.error("Toggle block user error:", error);
    res.status(500).json({ success: false, message: "Failed to update user status" });
  }
};

// ==================== GET ALL AUCTIONS (admin) ====================
const getAllAuctionsAdmin = async (req, res) => {
  try {
    const auctions = await db.Auction.findAll({
      include: [
        {
          model: db.Seller,
          as: "seller",
          attributes: ["seller_id", "shop_name", "user_id"],
          include: [{ model: db.User, as: "user", attributes: ["full_name"] }],
        },
        { model: db.User, as: "winner", attributes: ["user_id", "full_name"] },
        { model: db.Bid, as: "bids", attributes: ["bid_id", "bid_amount", "user_id"] },
      ],
      order: [["created_at", "DESC"]],
    });
    res.status(200).json({ success: true, data: auctions });
  } catch (error) {
    console.error("Get all auctions admin error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch auctions" });
  }
};

// ==================== APPROVE AUCTION (admin) ====================
const approveAuction = async (req, res) => {
  try {
    const { id } = req.params;
    const auction = await db.Auction.findByPk(id);
    if (!auction) return res.status(404).json({ success: false, message: "Auction not found" });

    // Determine lifecycle status based on current time vs scheduled times
    const now = new Date();
    const start = new Date(auction.auction_start);
    const end   = new Date(auction.auction_end);

    let newStatus = "upcoming";
    if (now >= start && now < end) newStatus = "live";
    else if (now >= end)           newStatus = "ended";

    await auction.update({
      approval_status: "approved",
      status: newStatus,
      approved_at: now,
      approved_by: req.user.user_id,
    });

    res.status(200).json({ success: true, message: "Auction approved successfully", data: auction });
  } catch (error) {
    console.error("Approve auction error:", error);
    res.status(500).json({ success: false, message: "Failed to approve auction" });
  }
};

// ==================== REJECT AUCTION (admin) ====================
const rejectAuction = async (req, res) => {
  try {
    const { id } = req.params;
    const { rejection_reason } = req.body;
    if (!rejection_reason || !rejection_reason.trim()) {
      return res.status(400).json({ success: false, message: "Please provide a rejection reason" });
    }
    const auction = await db.Auction.findByPk(id);
    if (!auction) return res.status(404).json({ success: false, message: "Auction not found" });

    await auction.update({
      approval_status: "rejected",
      status: "cancelled",           // treat rejected as cancelled so it's terminal
      rejection_reason: rejection_reason.trim(),
    });

    res.status(200).json({ success: true, message: "Auction rejected", data: auction });
  } catch (error) {
    console.error("Reject auction error:", error);
    res.status(500).json({ success: false, message: "Failed to reject auction" });
  }
};

// ==================== DELETE AUCTION (admin hard delete) ====================
const deleteAuction = async (req, res) => {
  try {
    const { id } = req.params;
    const auction = await db.Auction.findByPk(id);
    if (!auction) return res.status(404).json({ success: false, message: "Auction not found" });

    // Delete associated bids first to avoid FK constraint errors
    await db.Bid.destroy({ where: { auction_id: id } });
    await auction.destroy();

    res.status(200).json({ success: true, message: "Auction deleted successfully" });
  } catch (error) {
    console.error("Delete auction error:", error);
    res.status(500).json({ success: false, message: "Failed to delete auction" });
  }
};

// ==================== BANNER MANAGEMENT ====================
const getAllBanners = async (req, res) => {
  try {
    const banners = await db.Banner.findAll({ order: [["created_at", "DESC"]] });
    res.status(200).json({ success: true, data: banners });
  } catch (error) {
    console.error("Get all banners error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch banners" });
  }
};

const createBanner = async (req, res) => {
  try {
    const { title, description, link_url, link_type } = req.body;
    if (!title || !req.file) return res.status(400).json({ success: false, message: "Title and image are required" });
    const banner = await db.Banner.create({
      title,
      description: description || null,
      image: `/uploads/banners/${req.file.filename}`,
      link_url: link_url || null,
      link_type: link_type || "none",
      is_active: true,
    });
    res.status(201).json({ success: true, message: "Banner created successfully", data: banner });
  } catch (error) {
    console.error("Create banner error:", error);
    res.status(500).json({ success: false, message: "Failed to create banner" });
  }
};

const toggleBannerStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const banner = await db.Banner.findByPk(id);
    if (!banner) return res.status(404).json({ success: false, message: "Banner not found" });
    await banner.update({ is_active: !banner.is_active });
    res.status(200).json({
      success: true,
      message: banner.is_active ? "Banner activated" : "Banner deactivated",
      data: banner,
    });
  } catch (error) {
    console.error("Toggle banner error:", error);
    res.status(500).json({ success: false, message: "Failed to toggle banner" });
  }
};

const deleteBanner = async (req, res) => {
  try {
    const { id } = req.params;
    const banner = await db.Banner.findByPk(id);
    if (!banner) return res.status(404).json({ success: false, message: "Banner not found" });
    await banner.destroy();
    res.status(200).json({ success: true, message: "Banner deleted successfully" });
  } catch (error) {
    console.error("Delete banner error:", error);
    res.status(500).json({ success: false, message: "Failed to delete banner" });
  }
};

// ==================== CONTACT MESSAGES ====================
const getAllContactMessages = async (req, res) => {
  try {
    const messages = await db.Contact.findAll({ order: [["created_at", "DESC"]] });
    res.status(200).json({ success: true, data: messages });
  } catch (error) {
    console.error("Get all contact messages error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch contact messages" });
  }
};

const updateContactStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, admin_reply } = req.body;
    const contact = await db.Contact.findByPk(id);
    if (!contact) return res.status(404).json({ success: false, message: "Contact message not found" });
    const updates = {};
    if (status) updates.status = status;
    if (admin_reply !== undefined) {
      updates.admin_reply = admin_reply;
      updates.replied_at  = new Date();
      if (!status) updates.status = "resolved";
    }
    await contact.update(updates);
    res.status(200).json({ success: true, message: "Contact message updated", data: contact });
  } catch (error) {
    console.error("Update contact status error:", error);
    res.status(500).json({ success: false, message: "Failed to update contact message" });
  }
};

const deleteContactMessage = async (req, res) => {
  try {
    const { id } = req.params;
    const contact = await db.Contact.findByPk(id);
    if (!contact) return res.status(404).json({ success: false, message: "Contact message not found" });
    await contact.destroy();
    res.status(200).json({ success: true, message: "Contact message deleted successfully" });
  } catch (error) {
    console.error("Delete contact message error:", error);
    res.status(500).json({ success: false, message: "Failed to delete contact message" });
  }
};

// ==================== TOGGLE FEATURED ====================
const toggleFeatured = async (req, res) => {
  try {
    const { id } = req.params;
    const product = await db.Product.findByPk(id);
    if (!product) return res.status(404).json({ success: false, message: "Product not found" });
    await product.update({ is_featured: !product.is_featured });
    res.status(200).json({
      success: true,
      message: product.is_featured ? "Product featured" : "Product unfeatured",
      data: product,
    });
  } catch (error) {
    console.error("Toggle featured error:", error);
    res.status(500).json({ success: false, message: "Failed to toggle featured status" });
  }
};

module.exports = {
  getDashboardStats,
  getAnalytics,
  getPendingSellers,
  approveSeller,
  rejectSeller,
  getPendingProducts,
  approveProduct,
  rejectProduct,
  getAllUsers,
  getAllSellers,
  getAllOrders,
  getAllReviews,
  deleteReview,
  toggleBlockUser,
  getAllAuctionsAdmin,
  approveAuction,   // 
  rejectAuction,    // 
  deleteAuction,    // 
  getAllBanners,
  createBanner,
  toggleBannerStatus,
  deleteBanner,
  getAllContactMessages,
  updateContactStatus,
  deleteContactMessage,
  toggleFeatured,
};