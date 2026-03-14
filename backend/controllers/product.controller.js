const db = require("../models");
const fs = require("fs");
const path = require("path");
const { translateText, SUPPORTED_LANGUAGES } = require('../utils/translate.util');

// ==================== CREATE PRODUCT ====================
const createProduct = async (req, res) => {
  try {
    const { name, description, price, stock_quantity, category_id, sku, has_discount, discount_percentage } = req.body;

    if (!name || !description || !price || !category_id) {
      return res.status(400).json({
        success: false,
        message: "Please provide all required fields",
      });
    }

    const seller = await db.Seller.findOne({
      where: { user_id: req.user.user_id },
    });

    if (!seller) {
      return res.status(404).json({
        success: false,
        message: "Seller profile not found",
      });
    }

    const images = req.files ? req.files.map((file) => `/uploads/products/${file.filename}`) : [];

    if (images.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Please upload at least one product image",
      });
    }

    const hasDiscount = has_discount === 'true' || has_discount === true;
    const discountPct = hasDiscount ? (parseInt(discount_percentage) || 0) : 0;

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
      has_discount: hasDiscount,
      discount_percentage: discountPct,
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

// ==================== GET SINGLE PRODUCT WITH TRANSLATIONS ====================
const getProductWithTranslations = async (req, res) => {
  try {
    const { id } = req.params;
    const { lang = 'en' } = req.query;

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
        {
          model: db.ProductTranslation,
          as: "translations",
          where: lang !== 'en' ? { language_code: lang } : undefined,
          required: false,
        },
      ],
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    product.views_count += 1;
    await product.save();

    // If translation requested and exists, replace name/description
    const responseProduct = product.toJSON();
    if (lang !== 'en' && responseProduct.translations && responseProduct.translations.length > 0) {
      const translation = responseProduct.translations[0];
      responseProduct.name = translation.name;
      responseProduct.description = translation.description;
    }
    delete responseProduct.translations;

    res.status(200).json({
      success: true,
      data: responseProduct,
    });
  } catch (error) {
    console.error("Get product with translations error:", error);
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
      has_discount,
      discount_percentage,
    } = req.body;

    const product = await db.Product.findByPk(id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

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

    let finalImages = [];

    if (existingImages) {
      try {
        const existingImagesArray = JSON.parse(existingImages);
        finalImages = [...existingImagesArray];
      } catch (err) {
        console.error("Error parsing existingImages:", err);
      }
    }

    if (req.files && req.files.length > 0) {
      const newImagePaths = req.files.map((file) => `/uploads/products/${file.filename}`);
      finalImages = [...finalImages, ...newImagePaths];
    }

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

    const hasDiscount = has_discount === 'true' || has_discount === true;
    const discountPct = hasDiscount ? (parseInt(discount_percentage) || 0) : 0;

    await product.update({
      name: name || product.name,
      description: description || product.description,
      price: price || product.price,
      stock_quantity: stock_quantity !== undefined ? stock_quantity : product.stock_quantity,
      category_id: category_id || product.category_id,
      sku: sku || product.sku,
      images: finalImages,
      status: "pending",
      has_discount: hasDiscount,
      discount_percentage: discountPct,
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

    const seller = await db.Seller.findOne({
      where: { user_id: req.user.user_id },
    });

    if (product.seller_id !== seller.seller_id && req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "You don't have permission to delete this product",
      });
    }

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

// ==================== HOMEPAGE FUNCTIONS ====================

// Get Featured Products (admin marks products as featured)
const getFeaturedProducts = async (req, res) => {
  try {
    const products = await db.Product.findAll({
      where: {
        status: 'approved',
        is_featured: true,
        stock_quantity: { [db.Sequelize.Op.gt]: 0 },
      },
      include: [
        {
          model: db.Seller,
          as: 'seller',
          attributes: ['seller_id', 'shop_name', 'city', 'shop_logo'],
        },
        {
          model: db.Category,
          as: 'category',
          attributes: ['category_id', 'name', 'icon'],
        },
      ],
      limit: 8,
      order: [['created_at', 'DESC']],
    });

    res.json({
      success: true,
      data: products,
    });
  } catch (error) {
    console.error('Get featured products error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch featured products',
    });
  }
};

// Get Trending Products (most ordered in last 30 days)
const getTrendingProducts = async (req, res) => {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const trendingProducts = await db.Product.findAll({
      where: {
        status: 'approved',
        stock_quantity: { [db.Sequelize.Op.gt]: 0 },
      },
      include: [
        {
          model: db.OrderItem,
          as: 'orderItems',
          attributes: [],
          include: [
            {
              model: db.Order,
              as: 'order',
              where: {
                created_at: { [db.Sequelize.Op.gte]: thirtyDaysAgo },
              },
              attributes: [],
              required: false,
            },
          ],
        },
        {
          model: db.Seller,
          as: 'seller',
          attributes: ['seller_id', 'shop_name', 'city', 'shop_logo'],
        },
        {
          model: db.Category,
          as: 'category',
          attributes: ['category_id', 'name', 'icon'],
        },
      ],
      attributes: {
        include: [
          [
            db.Sequelize.fn('COUNT', db.Sequelize.col('orderItems.order_item_id')),
            'order_count',
          ],
        ],
      },
      group: ['Product.product_id', 'seller.seller_id', 'category.category_id'],
      order: [[db.Sequelize.literal('order_count'), 'DESC']],
      limit: 8,
      subQuery: false,
    });

    res.json({
      success: true,
      data: trendingProducts,
    });
  } catch (error) {
    console.error('Get trending products error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch trending products',
    });
  }
};

// Get Random Products for Homepage (fallback if no featured/trending)
const getRandomProducts = async (req, res) => {
  try {
    const products = await db.Product.findAll({
      where: {
        status: 'approved',
        stock_quantity: { [db.Sequelize.Op.gt]: 0 },
      },
      include: [
        {
          model: db.Seller,
          as: 'seller',
          attributes: ['seller_id', 'shop_name', 'city', 'shop_logo'],
        },
        {
          model: db.Category,
          as: 'category',
          attributes: ['category_id', 'name', 'icon'],
        },
      ],
      order: db.Sequelize.literal('RANDOM()'),
      limit: 8,
    });

    res.json({
      success: true,
      data: products,
    });
  } catch (error) {
    console.error('Get random products error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch products',
    });
  }
};

// Get Top Categories (categories with most products)
const getTopCategories = async (req, res) => {
  try {
    const categories = await db.Category.findAll({
      attributes: {
        include: [
          [
            db.Sequelize.fn('COUNT', db.Sequelize.col('products.product_id')),
            'product_count',
          ],
        ],
      },
      include: [
        {
          model: db.Product,
          as: 'products',
          attributes: [],
          where: { status: 'approved' },
          required: false,
        },
      ],
      group: ['Category.category_id'],
      order: [[db.Sequelize.literal('product_count'), 'DESC']],
      limit: 8,
      subQuery: false,
    });

    res.json({
      success: true,
      data: categories,
    });
  } catch (error) {
    console.error('Get top categories error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch categories',
    });
  }
};

// Toggle Featured Status (ADMIN ONLY)
const toggleFeatured = async (req, res) => {
  try {
    const { id } = req.params;

    const product = await db.Product.findByPk(id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }

    product.is_featured = !product.is_featured;
    await product.save();

    res.json({
      success: true,
      message: `Product ${product.is_featured ? 'marked as' : 'removed from'} featured`,
      data: product,
    });
  } catch (error) {
    console.error('Toggle featured error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update featured status',
    });
  }
};

// ==================== TRANSLATE PRODUCT DESCRIPTION ====================
const translateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const { language } = req.body;

    if (!language) {
      return res.status(400).json({
        success: false,
        message: 'Language code is required',
      });
    }

    if (!SUPPORTED_LANGUAGES[language]) {
      return res.status(400).json({
        success: false,
        message: 'Unsupported language code',
      });
    }

    const product = await db.Product.findByPk(id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }

    if (product.translations && product.translations[language]) {
      return res.json({
        success: true,
        data: {
          language,
          translated: product.translations[language],
          cached: true,
        },
      });
    }

    const translatedDescription = await translateText(
      product.description,
      language,
      'en'
    );

    const updatedTranslations = {
      ...product.translations,
      [language]: translatedDescription,
    };

    await product.update({ translations: updatedTranslations });

    return res.json({
      success: true,
      data: {
        language,
        translated: translatedDescription,
        cached: false,
      },
    });
  } catch (error) {
    console.error('Translate product error:', error);
    return res.status(500).json({
      success: false,
      message: 'Translation failed',
      error: error.message,
    });
  }
};

// ==================== GET SUPPORTED LANGUAGES ====================
const getSupportedLanguages = async (req, res) => {
  try {
    res.json({
      success: true,
      data: SUPPORTED_LANGUAGES,
    });
  } catch (error) {
    console.error('Get languages error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch languages',
    });
  }
};

module.exports = {
  createProduct,
  getAllProducts,
  getProductById,
  getProductWithTranslations,
  getSellerProducts,
  updateProduct,
  deleteProduct,
  getAllCategories,
  getFeaturedProducts,
  getTrendingProducts,
  getRandomProducts,
  getTopCategories,
  toggleFeatured,
  translateProduct,
  getSupportedLanguages,
};