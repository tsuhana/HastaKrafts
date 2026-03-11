const db = require("../models");

// ==================== DASHBOARD STATS ====================
const getDashboardStats = async (req, res) => {
  try {
    const { Op } = db.Sequelize;

    const totalUsers       = await db.User.count();
    const totalBuyers      = await db.User.count({ where: { role: "buyer" } });
    const totalSellerUsers = await db.User.count({ where: { role: "seller" } });

    const totalSellers     = await db.Seller.count();
    const pendingSellers   = await db.Seller.count({ where: { approval_status: "pending" } });
    const approvedSellers  = await db.Seller.count({ where: { approval_status: "approved" } });
    const rejectedSellers  = await db.Seller.count({ where: { approval_status: "rejected" } });

    const totalProducts    = await db.Product.count();
    const pendingProducts  = await db.Product.count({ where: { status: "pending" } });
    const approvedProducts = await db.Product.count({ where: { status: "approved" } });
    const rejectedProducts = await db.Product.count({ where: { status: "rejected" } });

    let totalOrders = 0, pendingOrders = 0, completedOrders = 0, totalRevenue = 0;
    try {
      totalOrders     = await db.Order.count();
      pendingOrders   = await db.Order.count({ where: { status: "pending" } });
      completedOrders = await db.Order.count({ where: { status: "delivered" } });
      const revenueResult = await db.Order.sum("total_amount", {
        where: { payment_status: "paid" },
      });
      totalRevenue = revenueResult || 0;
    } catch (_) {}

    res.status(200).json({
      success: true,
      data: {
        users: {
          total:   totalUsers,
          buyers:  totalBuyers,
          // NOTE: frontend reads d.users.sellers → map totalSellerUsers here
          sellers: totalSellerUsers,
        },
        sellers: {
          total:    totalSellers,
          pending:  pendingSellers,
          approved: approvedSellers,
          rejected: rejectedSellers,
        },
        products: {
          total:    totalProducts,
          pending:  pendingProducts,
          approved: approvedProducts,
          rejected: rejectedProducts,
        },
        orders: {
          total:     totalOrders,
          pending:   pendingOrders,
          completed: completedOrders,
          revenue:   totalRevenue,
        },
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

    // ── 1. Last 7 days daily sales ──
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
        where: {
          created_at: { [Op.gte]: sevenDaysAgo },
          payment_status: "paid",
        },
        group: [fn("DATE", col("created_at"))],
        order: [[fn("DATE", col("created_at")), "ASC"]],
        raw: true,
      });
    } catch (_) {}

    // Fill missing days with zeros
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

    // ── 2. Last 6 months monthly sales ──
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
        where: {
          created_at: { [Op.gte]: sixMonthsAgo },
          payment_status: "paid",
        },
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
      const mon = d.toLocaleDateString("en-US", { month: "short" });
      const found = monthlyRaw.find((r) => r.month_key === monthKey);
      monthlySales.push({
        month:   mon,
        orders:  found ? parseInt(found.orders) || 0 : 0,
        revenue: found ? Math.round(parseFloat(found.revenue) || 0) : 0,
      });
    }

    // ── 3. Product status donut ──
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

    // ── 4. Order status donut ──
    let orderDonut = [];
    try {
      const orderStats = await db.Order.findAll({
        attributes: ["status", [fn("COUNT", col("order_id")), "count"]],
        group: ["status"],
        raw: true,
      });
      orderDonut = orderStats.map((o) => ({
        name:  o.status.charAt(0).toUpperCase() + o.status.slice(1),
        value: parseInt(o.count) || 0,
      }));
    } catch (_) {}

    // ── 5. Top 5 categories by approved products ──
    let topCategories = [];
    try {
      const cats = await db.Category.findAll({
        attributes: [
          "name",
          [fn("COUNT", col("products.product_id")), "count"],
        ],
        include: [{
          model: db.Product,
          as: "products",
          attributes: [],
          where: { status: "approved" },
          required: false,
        }],
        group: ["Category.category_id"],
        order: [[literal("count"), "DESC"]],
        limit: 5,
        subQuery: false,
        raw: true,
      });
      topCategories = cats
        .map((c) => ({ name: c.name, count: parseInt(c.count) || 0 }))
        .filter((c) => c.count > 0);
    } catch (_) {}

    // ── 6. Top 5 sellers by order items ──
    let topSellers = [];
    try {
      const sellers = await db.Seller.findAll({
        attributes: [
          "shop_name",
          [fn("COUNT", col("orderItems.order_item_id")), "sales"],
        ],
        include: [{
          model: db.OrderItem,
          as: "orderItems",
          attributes: [],
          required: false,
        }],
        group: ["Seller.seller_id"],
        order: [[literal("sales"), "DESC"]],
        limit: 5,
        subQuery: false,
        raw: true,
      });
      topSellers = sellers
        .map((s) => ({ name: s.shop_name || "Unknown", sales: parseInt(s.sales) || 0 }))
        .filter((s) => s.sales > 0);
    } catch (_) {}

    // ── 7. Revenue summary ──
    let totalRevenue = 0, thisMonthRevenue = 0, totalOrders = 0;
    try {
      const totalRevRes = await db.Order.findOne({
        attributes: [[fn("SUM", col("total_amount")), "total"]],
        where: { payment_status: "paid" },
        raw: true,
      });
      totalRevenue = Math.round(parseFloat(totalRevRes?.total) || 0);

      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const monthRevRes = await db.Order.findOne({
        attributes: [[fn("SUM", col("total_amount")), "total"]],
        where: { payment_status: "paid", created_at: { [Op.gte]: startOfMonth } },
        raw: true,
      });
      thisMonthRevenue = Math.round(parseFloat(monthRevRes?.total) || 0);

      totalOrders = await db.Order.count({ where: { payment_status: "paid" } });
    } catch (_) {}

    res.json({
      success: true,
      data: {
        dailySales,
        monthlySales,
        productDonut,
        orderDonut,
        topCategories,
        topSellers,
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
      include: [{
        model: db.User,
        as: "user",
        attributes: ["user_id", "full_name", "email", "phone"],
      }],
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
    const seller = await db.Seller.findByPk(id);
    if (!seller) return res.status(404).json({ success: false, message: "Seller not found" });
    await seller.update({ approval_status: "approved", approved_at: new Date() });
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
    if (!rejection_reason) return res.status(400).json({ success: false, message: "Please provide rejection reason" });
    const seller = await db.Seller.findByPk(id);
    if (!seller) return res.status(404).json({ success: false, message: "Seller not found" });
    await seller.update({ approval_status: "rejected", rejection_reason });
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
      include: [{
        model: db.User,
        as: "user",
        attributes: ["user_id", "full_name", "email", "phone"],
      }],
      order: [["created_at", "DESC"]],
    });
    res.status(200).json({ success: true, data: sellers });
  } catch (error) {
    console.error("Get all sellers error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch sellers" });
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
};