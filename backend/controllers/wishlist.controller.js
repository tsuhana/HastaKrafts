const db = require("../models");

// ==================== ADD TO WISHLIST ====================
const addToWishlist = async (req, res) => {
  try {
    const { product_id } = req.body;

    if (!product_id) {
      return res.status(400).json({
        success: false,
        message: "Product ID is required"
      });
    }

    // Check if product exists
    const product = await db.Product.findByPk(product_id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found"
      });
    }

    // Check if already in wishlist
    const existing = await db.Wishlist.findOne({
      where: {
        user_id: req.user.user_id,
        product_id
      }
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: "Product already in wishlist"
      });
    }

    // Add to wishlist
    const wishlistItem = await db.Wishlist.create({
      user_id: req.user.user_id,
      product_id
    });

    return res.status(201).json({
      success: true,
      message: "Added to wishlist",
      data: wishlistItem
    });
  } catch (error) {
    console.error("Add to wishlist error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to add to wishlist"
    });
  }
};

// ==================== REMOVE FROM WISHLIST ====================
const removeFromWishlist = async (req, res) => {
  try {
    const { product_id } = req.params;

    const wishlistItem = await db.Wishlist.findOne({
      where: {
        user_id: req.user.user_id,
        product_id
      }
    });

    if (!wishlistItem) {
      return res.status(404).json({
        success: false,
        message: "Item not found in wishlist"
      });
    }

    await wishlistItem.destroy();

    return res.status(200).json({
      success: true,
      message: "Removed from wishlist"
    });
  } catch (error) {
    console.error("Remove from wishlist error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to remove from wishlist"
    });
  }
};

// ==================== GET USER WISHLIST ====================
const getWishlist = async (req, res) => {
  try {
    const wishlist = await db.Wishlist.findAll({
      where: { user_id: req.user.user_id },
      include: [
        {
          model: db.Product,
          as: "product",
          include: [
            {
              model: db.Seller,
              as: "seller",
              attributes: ["seller_id", "shop_name"]
            },
            {
              model: db.Category,
              as: "category",
              attributes: ["category_id", "name", "icon"]
            }
          ]
        }
      ],
      order: [["created_at", "DESC"]]
    });

    return res.status(200).json({
      success: true,
      data: wishlist
    });
  } catch (error) {
    console.error("Get wishlist error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch wishlist"
    });
  }
};

// ==================== CHECK IF IN WISHLIST ====================
const checkWishlist = async (req, res) => {
  try {
    const { product_id } = req.params;

    const inWishlist = await db.Wishlist.findOne({
      where: {
        user_id: req.user.user_id,
        product_id
      }
    });

    return res.status(200).json({
      success: true,
      inWishlist: !!inWishlist
    });
  } catch (error) {
    console.error("Check wishlist error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to check wishlist"
    });
  }
};

// ==================== CLEAR WISHLIST ====================
const clearWishlist = async (req, res) => {
  try {
    await db.Wishlist.destroy({
      where: { user_id: req.user.user_id }
    });

    return res.status(200).json({
      success: true,
      message: "Wishlist cleared"
    });
  } catch (error) {
    console.error("Clear wishlist error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to clear wishlist"
    });
  }
};

module.exports = {
  addToWishlist,
  removeFromWishlist,
  getWishlist,
  checkWishlist,
  clearWishlist
};