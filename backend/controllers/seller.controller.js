const db = require("../models");
const { Op, fn, col, literal } = require("sequelize");
const fs = require("fs");
const path = require("path");

// ==================== GET SELLER PROFILE ====================
const getSellerProfile = async (req, res) => {
  try {
    const seller = await db.Seller.findOne({
      where: { user_id: req.user.user_id },
      include: [{ model: db.User, as: "user", attributes: { exclude: ["password"] } }],
    });

    if (!seller) {
      return res.status(404).json({ success: false, message: "Seller profile not found" });
    }

    res.status(200).json({ success: true, data: seller });
  } catch (error) {
    console.error("Get seller profile error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch seller profile" });
  }
};

// ==================== UPDATE SELLER PROFILE ====================
const updateSellerProfile = async (req, res) => {
  try {
    const {
      shop_name, shop_description, address, city,
      bank_name, bank_account_number, bank_account_name,
    } = req.body;

    const seller = await db.Seller.findOne({ where: { user_id: req.user.user_id } });

    if (!seller) {
      return res.status(404).json({ success: false, message: "Seller profile not found" });
    }

    // Check shop name uniqueness if changing
    if (shop_name && shop_name !== seller.shop_name) {
      const existing = await db.Seller.findOne({
        where: { shop_name, seller_id: { [Op.ne]: seller.seller_id } },
      });
      if (existing) {
        return res.status(400).json({ success: false, message: "Shop name already taken" });
      }
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
    if (!req.file) {
      return res.status(400).json({ success: false, message: "Please upload an image" });
    }

    const seller = await db.Seller.findOne({ where: { user_id: req.user.user_id } });

    if (!seller) {
      return res.status(404).json({ success: false, message: "Seller profile not found" });
    }

    // Delete old logo if exists
    if (seller.shop_logo) {
      const oldPath = path.join(__dirname, "..", seller.shop_logo);
      if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
    }

    const logoPath = `/uploads/sellers/logos/${req.file.filename}`;
    await seller.update({ shop_logo: logoPath });

    res.status(200).json({
      success: true,
      message: "Shop logo uploaded successfully",
      data: { shop_logo: logoPath },
    });
  } catch (error) {
    console.error("Upload shop logo error:", error);
    res.status(500).json({ success: false, message: "Failed to upload shop logo" });
  }
};

// ==================== UPLOAD CITIZENSHIP ====================
const uploadCitizenship = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: "Please upload an image" });
    }

    const seller = await db.Seller.findOne({ where: { user_id: req.user.user_id } });

    if (!seller) {
      return res.status(404).json({ success: false, message: "Seller profile not found" });
    }

    // Delete old citizenship image if exists
    if (seller.citizenship_image) {
      const oldPath = path.join(__dirname, "..", seller.citizenship_image);
      if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
    }

    const citizenshipPath = `/uploads/sellers/citizenship/${req.file.filename}`;
    await seller.update({ citizenship_image: citizenshipPath });

    res.status(200).json({
      success: true,
      message: "Citizenship document uploaded successfully",
      data: { citizenship_image: citizenshipPath },
    });
  } catch (error) {
    console.error("Upload citizenship error:", error);
    res.status(500).json({ success: false, message: "Failed to upload citizenship document" });
  }
};

// ==================== GET SELLER ANALYTICS ====================
const getSellerAnalytics = async (req, res) => {
  try {
    const seller = await db.Seller.findOne({ where: { user_id: req.user.user_id } });

    if (!seller) {
      return res.status(404).json({ success: false, message: "Seller profile not found" });
    }

    const now = new Date();
    const twelveMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 11, 1);

    // ── Revenue by month (last 12 months) ──
    const monthlyData = await db.OrderItem.findAll({
      attributes: [
        [fn("DATE_TRUNC", "month", col("OrderItem.created_at")), "month"],
        [fn("SUM", col("subtotal")), "revenue"],
        [fn("COUNT", col("order_item_id")), "orders"],
      ],
      where: {
        seller_id: seller.seller_id,
        created_at: { [Op.gte]: twelveMonthsAgo },
      },
      include: [{
        model: db.Order,
        as: "order",
        attributes: [],
        where: { order_status: { [Op.ne]: "cancelled" } },
      }],
      group: [fn("DATE_TRUNC", "month", col("OrderItem.created_at"))],
      order: [[fn("DATE_TRUNC", "month", col("OrderItem.created_at")), "ASC"]],
      raw: true,
    });

    // Fill missing months with zeros
    const monthLabels = [];
    const revenueMap = {};
    const ordersMap = {};
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = d.toISOString().slice(0, 7);
      const label = d.toLocaleString("en-US", { month: "short", year: "2-digit" });
      monthLabels.push({ key, label });
      revenueMap[key] = 0;
      ordersMap[key] = 0;
    }
    monthlyData.forEach((row) => {
      const key = new Date(row.month).toISOString().slice(0, 7);
      revenueMap[key] = parseFloat(row.revenue) || 0;
      ordersMap[key] = parseInt(row.orders) || 0;
    });
    const revenueByMonth = monthLabels.map((m) => ({
      month: m.label,
      revenue: revenueMap[m.key],
      orders: ordersMap[m.key],
    }));

    // ── Top 5 products by revenue ──
    const topProducts = await db.OrderItem.findAll({
      attributes: [
        "product_name",
        [fn("SUM", col("subtotal")), "total_revenue"],
        [fn("SUM", col("quantity")), "total_sold"],
      ],
      where: { seller_id: seller.seller_id },
      include: [{
        model: db.Order,
        as: "order",
        attributes: [],
        where: { order_status: { [Op.ne]: "cancelled" } },
      }],
      group: ["OrderItem.product_name"],
      order: [[fn("SUM", col("subtotal")), "DESC"]],
      limit: 5,
      raw: true,
    });

    // ── Orders by status ──
    const ordersByStatus = await db.OrderItem.findAll({
      attributes: [
        [col("order.order_status"), "status"],
        [fn("COUNT", col("order_item_id")), "count"],
      ],
      where: { seller_id: seller.seller_id },
      include: [{ model: db.Order, as: "order", attributes: [] }],
      group: [col("order.order_status")],
      raw: true,
    });

    // ── KPIs ──
    const totalRevenue = await db.OrderItem.sum("subtotal", {
      where: { seller_id: seller.seller_id },
      include: [{
        model: db.Order,
        as: "order",
        where: { order_status: { [Op.ne]: "cancelled" } },
      }],
    });

    const thisMonthRevenue = await db.OrderItem.sum("subtotal", {
      where: {
        seller_id: seller.seller_id,
        created_at: { [Op.gte]: new Date(now.getFullYear(), now.getMonth(), 1) },
      },
      include: [{
        model: db.Order,
        as: "order",
        where: { order_status: { [Op.ne]: "cancelled" } },
      }],
    });

    res.status(200).json({
      success: true,
      data: {
        kpis: {
          totalRevenue: parseFloat(totalRevenue) || 0,
          thisMonthRevenue: parseFloat(thisMonthRevenue) || 0,
        },
        revenueByMonth,
        topProducts: topProducts.map((p) => ({
          name: p.product_name,
          revenue: parseFloat(p.total_revenue) || 0,
          sold: parseInt(p.total_sold) || 0,
        })),
        ordersByStatus: ordersByStatus.map((o) => ({
          status: o.status,
          count: parseInt(o.count) || 0,
        })),
      },
    });
  } catch (error) {
    console.error("Get seller analytics error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch analytics" });
  }
};

module.exports = {
  getSellerProfile,
  updateSellerProfile,
  uploadShopLogo,
  uploadCitizenship,
  getSellerAnalytics,
};