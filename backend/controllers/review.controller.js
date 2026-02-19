const db = require("../models");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

// ==================== MULTER CONFIG (Review Images) ====================
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, "../uploads/reviews");

    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }

    cb(null, uploadPath);
  },

  filename: (req, file, cb) => {
    const uniqueName = `review-${Date.now()}-${Math.round(
      Math.random() * 1e9
    )}${path.extname(file.originalname)}`;

    cb(null, uniqueName);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB per image
  fileFilter: (req, file, cb) => {
    const allowedExt = /jpeg|jpg|png|webp/;
    const extnameOk = allowedExt.test(
      path.extname(file.originalname).toLowerCase()
    );
    const mimetypeOk = allowedExt.test(file.mimetype);

    if (extnameOk && mimetypeOk) {
      cb(null, true);
    } else {
      cb(new Error("Only image files allowed (jpeg, jpg, png, webp)"));
    }
  }
}).array("images", 3); // Max 3 images per review

// ==================== CREATE REVIEW ====================
const createReview = async (req, res) => {
  upload(req, res, async (err) => {
    if (err) {
      return res.status(400).json({
        success: false,
        message: err.message || "File upload error"
      });
    }

    try {
      const { product_id, rating, comment } = req.body;

      // Validate required fields
      if (!product_id || !rating) {
        return res.status(400).json({
          success: false,
          message: "Product ID and rating are required"
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

      // Check if user already reviewed this product
      const existingReview = await db.Review.findOne({
        where: {
          product_id,
          user_id: req.user.user_id
        }
      });

      if (existingReview) {
        return res.status(400).json({
          success: false,
          message: "You have already reviewed this product"
        });
      }

      // Check if user purchased this product (verified purchase)
      const orderItem = await db.OrderItem.findOne({
        include: [
          {
            model: db.Order,
            as: "order",
            where: {
              user_id: req.user.user_id,
              payment_status: "paid"
            }
          }
        ],
        where: { product_id }
      });

      const verifiedPurchase = !!orderItem;
      const orderId = orderItem ? orderItem.order_id : null;

      // Handle uploaded images
      const imagePaths = req.files
        ? req.files.map((file) => `/uploads/reviews/${file.filename}`)
        : [];

      // Create review
      const review = await db.Review.create({
        product_id,
        user_id: req.user.user_id,
        order_id: orderId,
        rating: parseInt(rating),
        comment: comment || null,
        images: imagePaths,
        verified_purchase: verifiedPurchase
      });

      // Fetch review with user info
      const reviewWithUser = await db.Review.findByPk(review.review_id, {
        include: [
          {
            model: db.User,
            as: "user",
            attributes: ["user_id", "full_name", "profile_image"]
          }
        ]
      });

      return res.status(201).json({
        success: true,
        message: "Review submitted successfully",
        data: reviewWithUser
      });
    } catch (error) {
      console.error("Create review error:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to submit review"
      });
    }
  });
};

// ==================== GET PRODUCT REVIEWS ====================
const getProductReviews = async (req, res) => {
  try {
    const { product_id } = req.params;

    const reviews = await db.Review.findAll({
      where: { product_id },
      include: [
        {
          model: db.User,
          as: "user",
          attributes: ["user_id", "full_name", "profile_image"]
        }
      ],
      order: [["created_at", "DESC"]]
    });

    // Calculate average rating
    const avgRating = reviews.length > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      : 0;

    // Count by star rating
    const ratingCounts = {
      5: reviews.filter(r => r.rating === 5).length,
      4: reviews.filter(r => r.rating === 4).length,
      3: reviews.filter(r => r.rating === 3).length,
      2: reviews.filter(r => r.rating === 2).length,
      1: reviews.filter(r => r.rating === 1).length,
    };

    return res.status(200).json({
      success: true,
      data: {
        reviews,
        totalReviews: reviews.length,
        averageRating: parseFloat(avgRating.toFixed(1)),
        ratingCounts
      }
    });
  } catch (error) {
    console.error("Get product reviews error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch reviews"
    });
  }
};

// ==================== GET USER REVIEWS ====================
const getUserReviews = async (req, res) => {
  try {
    const reviews = await db.Review.findAll({
      where: { user_id: req.user.user_id },
      include: [
        {
          model: db.Product,
          as: "product",
          attributes: ["product_id", "name", "images", "price"]
        }
      ],
      order: [["created_at", "DESC"]]
    });

    return res.status(200).json({
      success: true,
      data: reviews
    });
  } catch (error) {
    console.error("Get user reviews error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch reviews"
    });
  }
};

// ==================== UPDATE REVIEW ====================
const updateReview = async (req, res) => {
  try {
    const { review_id } = req.params;
    const { rating, comment } = req.body;

    const review = await db.Review.findByPk(review_id);

    if (!review) {
      return res.status(404).json({
        success: false,
        message: "Review not found"
      });
    }

    // Check if user owns this review
    if (review.user_id !== req.user.user_id) {
      return res.status(403).json({
        success: false,
        message: "You can only edit your own reviews"
      });
    }

    // Update review
    await review.update({
      rating: rating ? parseInt(rating) : review.rating,
      comment: comment !== undefined ? comment : review.comment
    });

    return res.status(200).json({
      success: true,
      message: "Review updated successfully",
      data: review
    });
  } catch (error) {
    console.error("Update review error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update review"
    });
  }
};

// ==================== DELETE REVIEW ====================
const deleteReview = async (req, res) => {
  try {
    const { review_id } = req.params;

    const review = await db.Review.findByPk(review_id);

    if (!review) {
      return res.status(404).json({
        success: false,
        message: "Review not found"
      });
    }

    // Check if user owns this review
    if (review.user_id !== req.user.user_id) {
      return res.status(403).json({
        success: false,
        message: "You can only delete your own reviews"
      });
    }

    // Delete review images from filesystem
    if (review.images && review.images.length > 0) {
      review.images.forEach((imagePath) => {
        const fullPath = path.join(__dirname, "..", imagePath);
        if (fs.existsSync(fullPath)) {
          fs.unlinkSync(fullPath);
        }
      });
    }

    await review.destroy();

    return res.status(200).json({
      success: true,
      message: "Review deleted successfully"
    });
  } catch (error) {
    console.error("Delete review error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to delete review"
    });
  }
};

module.exports = {
  createReview,
  getProductReviews,
  getUserReviews,
  updateReview,
  deleteReview
};