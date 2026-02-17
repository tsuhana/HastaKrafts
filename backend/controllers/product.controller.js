const db = require("../models");
const fs = require("fs");
const path = require("path");

// ==================== CREATE PRODUCT ====================
const createProduct = async (req, res) => {
  try {
    const { name, description, price, stock_quantity, category_id, sku } = req.body;

    if (!name || !description || !price || !category_id) {
      return res.status(400).json({
        success: false,
        message: "Please provide all required fields",
      });
    }

    // Get seller_id from authenticated user
    const seller = await db.Seller.findOne({
      where: { user_id: req.user.user_id },
    });

    if (!seller) {
      return res.status(404).json({
        success: false,
        message: "Seller profile not found",
      });
    }

    // Handle image uploads
    const images = req.files ? req.files.map((file) => `/uploads/products/${file.filename}`) : [];

    if (images.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Please upload at least one product image",
      });
    }

    const product = await db.Product.create({
      seller_id: seller.seller_id,
      category_id,
      name,
      description,
      price,
      stock_quantity: stock_quantity || 0,
      sku: sku || null,
      images,
      status: "pending",
    });

    res.status(201).json({
      success: true,
      message: "Product created successfully and is pending approval",
      data: product,
    });
  } catch (error) {
    console.error("Create product error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to create product",
    });
  }
};

// ==================== GET ALL PRODUCTS (PUBLIC) ====================
const getAllProducts = async (req, res) => {
  try {
    const { category_id, status = "approved", page = 1, limit = 20, search } = req.query;

    const where = {};
    
    // Only show approved products for public
    if (!req.user || req.user.role !== "admin") {
      where.status = "approved";
    } else if (status) {
      where.status = status;
    }

    if (category_id) {
      where.category_id = category_id;
    }

    if (search) {
      where[db.Sequelize.Op.or] = [
        { name: { [db.Sequelize.Op.iLike]: `%${search}%` } },
        { description: { [db.Sequelize.Op.iLike]: `%${search}%` } },
      ];
    }

    const offset = (page - 1) * limit;

    const { count, rows: products } = await db.Product.findAndCountAll({
      where,
      include: [
        {
          model: db.Category,
          as: "category",
          attributes: ["category_id", "name", "slug", "icon"],
        },
        {
          model: db.Seller,
          as: "seller",
          attributes: ["seller_id", "shop_name", "shop_logo"],
        },
      ],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [["created_at", "DESC"]],
    });

    res.status(200).json({
      success: true,
      data: {
        products,
        pagination: {
          total: count,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(count / limit),
        },
      },
    });
  } catch (error) {
    console.error("Get all products error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch products",
    });
  }
};

// ==================== GET SINGLE PRODUCT ====================
const getProductById = async (req, res) => {
  try {
    const { id } = req.params;

    const product = await db.Product.findByPk(id, {
      include: [
        {
          model: db.Category,
          as: "category",
          attributes: ["category_id", "name", "slug", "icon"],
        },
        {
          model: db.Seller,
          as: "seller",
          attributes: ["seller_id", "shop_name", "shop_description", "shop_logo", "city", "user_id"],
          include: [
            {
              model: db.User,
              as: "user",
              attributes: ["full_name", "email"],
            },
          ],
        },
      ],
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    // Increment views
    product.views_count += 1;
    await product.save();

    res.status(200).json({
      success: true,
      data: product,
    });
  } catch (error) {
    console.error("Get product error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch product",
    });
  }
};

// ==================== GET SELLER'S PRODUCTS ====================
const getSellerProducts = async (req, res) => {
  try {
    const seller = await db.Seller.findOne({
      where: { user_id: req.user.user_id },
    });

    if (!seller) {
      return res.status(404).json({
        success: false,
        message: "Seller profile not found",
      });
    }

    const products = await db.Product.findAll({
      where: { seller_id: seller.seller_id },
      include: [
        {
          model: db.Category,
          as: "category",
          attributes: ["category_id", "name", "slug"],
        },
      ],
      order: [["created_at", "DESC"]],
    });

    const stats = {
      total: products.length,
      pending: products.filter((p) => p.status === "pending").length,
      approved: products.filter((p) => p.status === "approved").length,
      rejected: products.filter((p) => p.status === "rejected").length,
    };

    res.status(200).json({
      success: true,
      data: {
        products,
        stats,
      },
    });
  } catch (error) {
    console.error("Get seller products error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch products",
    });
  }
};

// ==================== UPDATE PRODUCT ====================
const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      description,
      price,
      stock_quantity,
      category_id,
      sku,
      existingImages,
      imagesToDelete,
    } = req.body;

    // Find product
    const product = await db.Product.findByPk(id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    // Check ownership
    const seller = await db.Seller.findOne({
      where: { user_id: req.user.user_id },
    });

    if (!seller) {
      return res.status(404).json({
        success: false,
        message: "Seller profile not found",
      });
    }

    if (product.seller_id !== seller.seller_id && req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "You don't have permission to update this product",
      });
    }

    // ===== IMAGE HANDLING LOGIC =====
    let finalImages = [];

    // Step 1: Parse existing images to keep (sent from frontend)
    if (existingImages) {
      try {
        const existingImagesArray = JSON.parse(existingImages);
        finalImages = [...existingImagesArray];
      } catch (err) {
        console.error("Error parsing existingImages:", err);
      }
    }

    // Step 2: Add newly uploaded images
    if (req.files && req.files.length > 0) {
      const newImagePaths = req.files.map((file) => `/uploads/products/${file.filename}`);
      finalImages = [...finalImages, ...newImagePaths];
    }

    // Step 3: Validate total image count
    if (finalImages.length < 3) {
      return res.status(400).json({
        success: false,
        message: "Product must have at least 3 images",
      });
    }

    if (finalImages.length > 8) {
      return res.status(400).json({
        success: false,
        message: "Product can have maximum 8 images",
      });
    }

    // Step 4: Delete image files that were removed (sent from frontend)
    if (imagesToDelete) {
      try {
        const imagesToDeleteArray = JSON.parse(imagesToDelete);
        imagesToDeleteArray.forEach((imagePath) => {
          const fullPath = path.join(__dirname, "..", imagePath);
          if (fs.existsSync(fullPath)) {
            fs.unlinkSync(fullPath);
            console.log(`Deleted old image: ${imagePath}`);
          }
        });
      } catch (err) {
        console.error("Error deleting images:", err);
      }
    }

    // Update product
    await product.update({
      name: name || product.name,
      description: description || product.description,
      price: price || product.price,
      stock_quantity: stock_quantity !== undefined ? stock_quantity : product.stock_quantity,
      category_id: category_id || product.category_id,
      sku: sku || product.sku,
      images: finalImages,
      status: "pending", // Reset to pending after edit for admin review
    });

    res.status(200).json({
      success: true,
      message: "Product updated successfully. It will be reviewed by admin.",
      data: product,
    });
  } catch (error) {
    console.error("Update product error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to update product",
    });
  }
};

// ==================== DELETE PRODUCT ====================
const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;

    const product = await db.Product.findByPk(id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    // Check ownership
    const seller = await db.Seller.findOne({
      where: { user_id: req.user.user_id },
    });

    if (product.seller_id !== seller.seller_id && req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "You don't have permission to delete this product",
      });
    }

    // Delete images
    product.images.forEach((img) => {
      const filePath = path.join(__dirname, "..", img);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    });

    await product.destroy();

    res.status(200).json({
      success: true,
      message: "Product deleted successfully",
    });
  } catch (error) {
    console.error("Delete product error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete product",
    });
  }
};

// ==================== GET ALL CATEGORIES ====================
const getAllCategories = async (req, res) => {
  try {
    const categories = await db.Category.findAll({
      where: { is_active: true },
      order: [["name", "ASC"]],
    });

    res.status(200).json({
      success: true,
      data: categories,
    });
  } catch (error) {
    console.error("Get categories error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch categories",
    });
  }
};

module.exports = {
  createProduct,
  getAllProducts,
  getProductById,
  getSellerProducts,
  updateProduct,
  deleteProduct,
  getAllCategories,
};