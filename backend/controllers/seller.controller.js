const db = require("../models");
const { Op, fn, col, literal, QueryTypes } = require("sequelize");
const fs = require("fs");
const path = require("path");

// ==================== GET SELLER PROFILE ====================
const getSellerProfile = async (req, res) => {
  try {
    const seller = await db.Seller.findOne({
      where: { user_id: req.user.user_id },
      include: [{ model: db.User, as: "user", attributes: { exclude: ["password"] } }],
    });
    if (!seller) return res.status(404).json({ success: false, message: "Seller profile not found" });
    res.status(200).json({ success: true, data: seller });
  } catch (error) {
    console.error("Get seller profile error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch seller profile" });
  }
};

// ==================== UPDATE SELLER PROFILE ====================
const updateSellerProfile = async (req, res) => {
  try {
    const { shop_name, shop_description, address, city, bank_name, bank_account_number, bank_account_name } = req.body;
    const seller = await db.Seller.findOne({ where: { user_id: req.user.user_id } });
    if (!seller) return res.status(404).json({ success: false, message: "Seller profile not found" });
    if (shop_name && shop_name !== seller.shop_name) {
      const existing = await db.Seller.findOne({ where: { shop_name, seller_id: { [Op.ne]: seller.seller_id } } });
      if (existing) return res.status(400).json({ success: false, message: "Shop name already taken" });
    }
    await seller.update({
      shop_name: shop_name || seller.shop_name,
      shop_description: shop_description !== undefined ? shop_description : seller.shop_description,
      address: address || seller.address,
      city: city || seller.city,
      bank_name: bank_name !== undefined ? bank_name : seller.bank_name,
      bank_account_number: bank_account_number !== undefined ? bank_account_number : seller.bank_account_number,
      bank_account_name: bank_account_name !== undefined ? bank_account_name : seller.bank_account_name,
    });
    res.status(200).json({ success: true, message: "Shop profile updated successfully", data: seller });
  } catch (error) {
    console.error("Update seller profile error:", error);
    res.status(500).json({ success: false, message: "Failed to update seller profile" });
  }
};

// ==================== UPLOAD SHOP LOGO ====================
const uploadShopLogo = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: "Please upload an image" });
    const seller = await db.Seller.findOne({ where: { user_id: req.user.user_id } });
    if (!seller) return res.status(404).json({ success: false, message: "Seller profile not found" });
    if (seller.shop_logo) {
      const oldPath = path.join(__dirname, "..", seller.shop_logo);
      if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
    }
    const logoPath = `/uploads/sellers/logos/${req.file.filename}`;
    await seller.update({ shop_logo: logoPath });
    res.status(200).json({ success: true, message: "Shop logo uploaded successfully", data: { shop_logo: logoPath } });
  } catch (error) {
    console.error("Upload shop logo error:", error);
    res.status(500).json({ success: false, message: "Failed to upload shop logo" });
  }
};

// ==================== UPLOAD CITIZENSHIP ====================
const uploadCitizenship = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: "Please upload an image" });
    const seller = await db.Seller.findOne({ where: { user_id: req.user.user_id } });
    if (!seller) return res.status(404).json({ success: false, message: "Seller profile not found" });
    if (seller.citizenship_image) {
      const oldPath = path.join(__dirname, "..", seller.citizenship_image);
      if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
    }
    const citizenshipPath = `/uploads/sellers/citizenship/${req.file.filename}`;
    await seller.update({ citizenship_image: citizenshipPath });
    res.status(200).json({ success: true, message: "Citizenship document uploaded successfully", data: { citizenship_image: citizenshipPath } });
  } catch (error) {
    console.error("Upload citizenship error:", error);
    res.status(500).json({ success: false, message: "Failed to upload citizenship document" });
  }
};

// ==================== GET SELLER ANALYTICS ====================
const getSellerAnalytics = async (req, res) => {
  try {
    const seller = await db.Seller.findOne({ where: { user_id: req.user.user_id } });
    if (!seller) return res.status(404).json({ success: false, message: "Seller profile not found" });

    const sid = seller.seller_id;
    const now = new Date();
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
    const twelveMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 11, 1);

    // ── 1. Core KPIs (single raw SQL pass) ──
    const kpiRows = await db.sequelize.query(
      `SELECT
        COALESCE(SUM(CASE WHEN o.order_status != 'cancelled' THEN oi.subtotal ELSE 0 END), 0)                             AS total_revenue,
        COALESCE(SUM(CASE WHEN o.order_status != 'cancelled' AND oi.created_at >= :thisMonth THEN oi.subtotal ELSE 0 END), 0) AS this_month_revenue,
        COALESCE(SUM(CASE WHEN o.order_status != 'cancelled' AND oi.created_at >= :lastMonthStart AND oi.created_at <= :lastMonthEnd THEN oi.subtotal ELSE 0 END), 0) AS last_month_revenue,
        COUNT(CASE WHEN o.order_status != 'cancelled' THEN 1 END)  AS non_cancelled,
        COUNT(CASE WHEN o.order_status = 'delivered'  THEN 1 END)  AS delivered_count,
        COUNT(CASE WHEN o.order_status = 'cancelled'  THEN 1 END)  AS cancelled_count,
        COUNT(oi.order_item_id)                                      AS total_items
       FROM order_items oi
       JOIN orders o ON oi.order_id = o.order_id
       WHERE oi.seller_id = :sid`,
      { replacements: { sid, thisMonth: thisMonthStart, lastMonthStart, lastMonthEnd }, type: QueryTypes.SELECT }
    );
    const k = kpiRows[0];
    const totalRevenue     = parseFloat(k.total_revenue)      || 0;
    const thisMonthRevenue = parseFloat(k.this_month_revenue)  || 0;
    const lastMonthRevenue = parseFloat(k.last_month_revenue)  || 0;
    const nonCancelled     = parseInt(k.non_cancelled)         || 0;
    const deliveredCount   = parseInt(k.delivered_count)       || 0;
    const cancelledCount   = parseInt(k.cancelled_count)       || 0;
    const totalItems       = parseInt(k.total_items)           || 0;
    const aov              = nonCancelled > 0 ? Math.round(totalRevenue / nonCancelled) : 0;
    const fulfillmentRate  = totalItems   > 0 ? Math.round((deliveredCount / totalItems) * 100) : 0;
    const cancellationRate = totalItems   > 0 ? Math.round((cancelledCount / totalItems) * 100) : 0;
    const momGrowth        = lastMonthRevenue > 0 ? Math.round(((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100) : 0;

    // ── 2. Revenue by month (last 12 months) ──
    const monthlyRows = await db.sequelize.query(
      `SELECT
        DATE_TRUNC('month', oi.created_at) AS month,
        COALESCE(SUM(oi.subtotal), 0)       AS revenue,
        COUNT(oi.order_item_id)             AS orders
       FROM order_items oi
       JOIN orders o ON oi.order_id = o.order_id
       WHERE oi.seller_id = :sid
         AND o.order_status != 'cancelled'
         AND oi.created_at >= :since
       GROUP BY DATE_TRUNC('month', oi.created_at)
       ORDER BY month ASC`,
      { replacements: { sid, since: twelveMonthsAgo }, type: QueryTypes.SELECT }
    );

    // Fill all 12 months (zero-pad missing)
    const revenueMap = {};
    monthlyRows.forEach((r) => {
      const key = new Date(r.month).toISOString().slice(0, 7);
      revenueMap[key] = { revenue: parseFloat(r.revenue) || 0, orders: parseInt(r.orders) || 0 };
    });
    const revenueByMonth = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = d.toISOString().slice(0, 7);
      const label = d.toLocaleString("en-US", { month: "short", year: "2-digit" });
      revenueByMonth.push({
        month: label,
        revenue: revenueMap[key]?.revenue || 0,
        orders:  revenueMap[key]?.orders  || 0,
      });
    }

    // ── 3. This month weekly breakdown ──
    const weeklyRows = await db.sequelize.query(
      `SELECT
        CEIL(EXTRACT(DAY FROM oi.created_at) / 7.0) AS week_num,
        COALESCE(SUM(oi.subtotal), 0) AS revenue,
        COUNT(oi.order_item_id)        AS orders
       FROM order_items oi
       JOIN orders o ON oi.order_id = o.order_id
       WHERE oi.seller_id = :sid
         AND o.order_status != 'cancelled'
         AND oi.created_at >= :thisMonth
       GROUP BY week_num
       ORDER BY week_num`,
      { replacements: { sid, thisMonth: thisMonthStart }, type: QueryTypes.SELECT }
    );
    const weekMap = {};
    weeklyRows.forEach((r) => { weekMap[Math.min(parseInt(r.week_num), 4)] = { revenue: parseFloat(r.revenue) || 0, orders: parseInt(r.orders) || 0 }; });
    const revenueByWeek = [1, 2, 3, 4].map((w) => ({
      week: `W${w}`,
      revenue: weekMap[w]?.revenue || 0,
      orders:  weekMap[w]?.orders  || 0,
    }));

    // ── 4. Top 5 products by revenue ──
    const topProductRows = await db.sequelize.query(
      `SELECT
        oi.product_name,
        COALESCE(SUM(oi.subtotal), 0)   AS total_revenue,
        COALESCE(SUM(oi.quantity), 0)   AS total_sold
       FROM order_items oi
       JOIN orders o ON oi.order_id = o.order_id
       WHERE oi.seller_id = :sid
         AND o.order_status != 'cancelled'
       GROUP BY oi.product_name
       ORDER BY total_revenue DESC
       LIMIT 5`,
      { replacements: { sid }, type: QueryTypes.SELECT }
    );
    const topProducts = topProductRows.map((p) => ({
      name:    p.product_name,
      revenue: parseFloat(p.total_revenue) || 0,
      sold:    parseInt(p.total_sold)       || 0,
    }));

    // ── 5. Orders by status ──
    const statusRows = await db.sequelize.query(
      `SELECT o.order_status AS status, COUNT(oi.order_item_id) AS count
       FROM order_items oi
       JOIN orders o ON oi.order_id = o.order_id
       WHERE oi.seller_id = :sid
       GROUP BY o.order_status`,
      { replacements: { sid }, type: QueryTypes.SELECT }
    );
    const ordersByStatus = statusRows.map((r) => ({ status: r.status, count: parseInt(r.count) || 0 }));

    // ── 6. Orders by day of week (last 30 days) ──
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const dowRows = await db.sequelize.query(
      `SELECT
        EXTRACT(DOW FROM oi.created_at) AS dow,
        COUNT(oi.order_item_id)          AS count,
        COALESCE(SUM(oi.subtotal), 0)    AS revenue
       FROM order_items oi
       JOIN orders o ON oi.order_id = o.order_id
       WHERE oi.seller_id = :sid
         AND o.order_status != 'cancelled'
         AND oi.created_at >= :since
       GROUP BY dow
       ORDER BY dow`,
      { replacements: { sid, since: thirtyDaysAgo }, type: QueryTypes.SELECT }
    );
    const dowMap = {};
    dowRows.forEach((r) => { dowMap[parseInt(r.dow)] = { count: parseInt(r.count) || 0, revenue: parseFloat(r.revenue) || 0 }; });
    const dowLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const revenueByDow = dowLabels.map((label, i) => ({
      day:     label,
      orders:  dowMap[i]?.count   || 0,
      revenue: dowMap[i]?.revenue || 0,
    }));

    // ── 7. Stock health (all seller products) ──
    const stockProducts = await db.Product.findAll({
      where: { seller_id: sid, status: "approved" },
      attributes: ["product_id", "name", "stock_quantity", "images"],
      order: [["stock_quantity", "ASC"]],
    });
    const stockHealth = stockProducts.map((p) => ({
      id:    p.product_id,
      name:  p.name,
      stock: p.stock_quantity,
      image: p.images?.[0] || null,
    }));

    res.status(200).json({
      success: true,
      data: {
        kpis: {
          totalRevenue,
          thisMonthRevenue,
          lastMonthRevenue,
          momGrowth,
          aov,
          fulfillmentRate,
          cancellationRate,
          totalOrders: totalItems,
          deliveredOrders: deliveredCount,
        },
        revenueByMonth,
        revenueByWeek,
        topProducts,
        ordersByStatus,
        revenueByDow,
        stockHealth,
      },
    });
  } catch (error) {
    console.error("Get seller analytics error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch analytics", error: error.message });
  }
};

module.exports = {
  getSellerProfile,
  updateSellerProfile,
  uploadShopLogo,
  uploadCitizenship,
  getSellerAnalytics,
};