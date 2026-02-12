const db = require("../models");

// ==================== DASHBOARD STATS ====================
const getDashboardStats = async (req, res) => {
  try {
    const totalUsers = await db.User.count();
    const totalBuyers = await db.User.count({ where: { role: "buyer" } });
    const totalSellers = await db.Seller.count();
    const pendingSellers = await db.Seller.count({ where: { approval_status: "pending" } });
    const approvedSellers = await db.Seller.count({ where: { approval_status: "approved" } });
    
    const totalProducts = await db.Product.count();
    const pendingProducts = await db.Product.count({ where: { status: "pending" } });
    const approvedProducts = await db.Product.count({ where: { status: "approved" } });
    const rejectedProducts = await db.Product.count({ where: { status: "rejected" } });

    res.status(200).json({
      success: true,
      data: {
        users: {
          total: totalUsers,
          buyers: totalBuyers,
          sellers: totalSellers,
        },
        sellers: {
          total: totalSellers,
          pending: pendingSellers,
          approved: approvedSellers,
        },
        products: {
          total: totalProducts,
          pending: pendingProducts,
          approved: approvedProducts,
          rejected: rejectedProducts,
        },
      },
    });
  } catch (error) {
    console.error("Get dashboard stats error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch dashboard stats",
    });
  }
};

// ==================== GET PENDING SELLERS ====================
const getPendingSellers = async (req, res) => {
  try {
    const sellers = await db.Seller.findAll({
      where: { approval_status: "pending" },
      include: [
        {
          model: db.User,
          as: "user", // ✅ LOWERCASE - matches model definition
          attributes: ["user_id", "full_name", "email", "phone"],
        },
      ],
      order: [["created_at", "ASC"]],
    });

    res.status(200).json({
      success: true,
      data: sellers,
    });
  } catch (error) {
    console.error("Get pending sellers error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch pending sellers",
    });
  }
};

// ==================== APPROVE SELLER ====================
const approveSeller = async (req, res) => {
  try {
    const { id } = req.params;

    const seller = await db.Seller.findByPk(id);

    if (!seller) {
      return res.status(404).json({
        success: false,
        message: "Seller not found",
      });
    }

    await seller.update({
      approval_status: "approved",
      approved_at: new Date(),
    });

    res.status(200).json({
      success: true,
      message: "Seller approved successfully",
      data: seller,
    });
  } catch (error) {
    console.error("Approve seller error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to approve seller",
    });
  }
};

// ==================== REJECT SELLER ====================
const rejectSeller = async (req, res) => {
  try {
    const { id } = req.params;
    const { rejection_reason } = req.body;

    if (!rejection_reason) {
      return res.status(400).json({
        success: false,
        message: "Please provide rejection reason",
      });
    }

    const seller = await db.Seller.findByPk(id);

    if (!seller) {
      return res.status(404).json({
        success: false,
        message: "Seller not found",
      });
    }

    await seller.update({
      approval_status: "rejected",
      rejection_reason,
    });

    res.status(200).json({
      success: true,
      message: "Seller rejected",
      data: seller,
    });
  } catch (error) {
    console.error("Reject seller error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to reject seller",
    });
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
          include: [
            {
              model: db.User,
              as: "user", 
              attributes: ["full_name", "email"],
            },
          ],
        },
        {
          model: db.Category,
          as: "category", 
          attributes: ["category_id", "name", "icon"],
        },
      ],
      order: [["created_at", "ASC"]],
    });

    res.status(200).json({
      success: true,
      data: products,
    });
  } catch (error) {
    console.error("Get pending products error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch pending products",
    });
  }
};

// ==================== APPROVE PRODUCT ====================
const approveProduct = async (req, res) => {
  try {
    const { id } = req.params;

    const product = await db.Product.findByPk(id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    await product.update({
      status: "approved",
      approved_at: new Date(),
      approved_by: req.user.user_id,
    });

    res.status(200).json({
      success: true,
      message: "Product approved successfully",
      data: product,
    });
  } catch (error) {
    console.error("Approve product error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to approve product",
    });
  }
};

// ==================== REJECT PRODUCT ====================
const rejectProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const { rejection_reason } = req.body;

    if (!rejection_reason) {
      return res.status(400).json({
        success: false,
        message: "Please provide rejection reason",
      });
    }

    const product = await db.Product.findByPk(id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    await product.update({
      status: "rejected",
      rejection_reason,
    });

    res.status(200).json({
      success: true,
      message: "Product rejected",
      data: product,
    });
  } catch (error) {
    console.error("Reject product error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to reject product",
    });
  }
};

// ==================== GET ALL USERS ====================
const getAllUsers = async (req, res) => {
  try {
    const users = await db.User.findAll({
      attributes: { exclude: ["password"] },
      order: [["created_at", "DESC"]],
    });

    res.status(200).json({
      success: true,
      data: users,
    });
  } catch (error) {
    console.error("Get all users error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch users",
    });
  }
};

// ==================== GET ALL SELLERS ====================
const getAllSellers = async (req, res) => {
  try {
    const sellers = await db.Seller.findAll({
      include: [
        {
          model: db.User,
          as: "user", 
          attributes: ["user_id", "full_name", "email", "phone"],
        },
      ],
      order: [["created_at", "DESC"]],
    });

    res.status(200).json({
      success: true,
      data: sellers,
    });
  } catch (error) {
    console.error("Get all sellers error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch sellers",
    });
  }
};

module.exports = {
  getDashboardStats,
  getPendingSellers,
  approveSeller,
  rejectSeller,
  getPendingProducts,
  approveProduct,
  rejectProduct,
  getAllUsers,
  getAllSellers,
};