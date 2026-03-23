const db = require("../models");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

// ==================== MULTER CONFIG (Review Images) ====================
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, "../uploads/reviews");
    if (!fs.existsSync(uploadPath)) fs.mkdirSync(uploadPath, { recursive: true });
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueName = `review-${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|webp/;
    const extOk = allowed.test(path.extname(file.originalname).toLowerCase());
    const mimeOk = allowed.test(file.mimetype);
    if (extOk && mimeOk) return cb(null, true);
    cb(new Error("Only image files allowed (jpeg, jpg, png, webp)"));
  },
}).array("images", 3);

// ==================== HELPER: fetch reviews with replies ====================
const fetchReviewsWithReplies = async (productId, currentUserId = null) => {
  // Fetch all records for this product (both top-level and replies)
  const all = await db.Review.findAll({
    where: { product_id: productId },
    include: [
      {
        model: db.User,
        as: "user",
        attributes: ["user_id", "full_name", "profile_image"],
      },
    ],
    order: [["created_at", "ASC"]],
  });

  // Fetch which reviews the current user has marked helpful
  let helpfulSet = new Set();
  if (currentUserId) {
    const votes = await db.ReviewHelpful.findAll({
      where: { user_id: currentUserId },
      attributes: ["review_id"],
    });
    helpfulSet = new Set(votes.map((v) => v.review_id));
  }

  // Nest replies under their parent
  const map = {};
  const topLevel = [];

  all.forEach((r) => {
    const plain = r.toJSON();
    plain.replies = [];
    plain.user_marked_helpful = helpfulSet.has(plain.review_id);
    map[plain.review_id] = plain;
  });

  all.forEach((r) => {
    const plain = map[r.review_id];
    if (plain.parent_id) {
      if (map[plain.parent_id]) {
        map[plain.parent_id].replies.push(plain);
      }
    } else {
      topLevel.push(plain);
    }
  });

  return topLevel;
};

// ==================== CREATE REVIEW ====================
const createReview = async (req, res) => {
  upload(req, res, async (err) => {
    if (err) return res.status(400).json({ success: false, message: err.message || "File upload error" });

    try {
      const { product_id, rating, comment } = req.body;

      if (!product_id || !rating) {
        return res.status(400).json({ success: false, message: "Product ID and rating are required" });
      }

      const product = await db.Product.findByPk(product_id);
      if (!product) return res.status(404).json({ success: false, message: "Product not found" });

      const existing = await db.Review.findOne({
        where: { product_id, user_id: req.user.user_id, parent_id: null },
      });
      if (existing) return res.status(400).json({ success: false, message: "You have already reviewed this product" });

      const orderItem = await db.OrderItem.findOne({
        include: [{ model: db.Order, as: "order", where: { user_id: req.user.user_id, payment_status: "paid" } }],
        where: { product_id },
      });

      const imagePaths = req.files ? req.files.map((f) => `/uploads/reviews/${f.filename}`) : [];

      const review = await db.Review.create({
        product_id,
        user_id: req.user.user_id,
        order_id: orderItem ? orderItem.order_id : null,
        parent_id: null,
        rating: parseInt(rating),
        comment: comment || null,
        images: imagePaths,
        verified_purchase: !!orderItem,
        helpful_count: 0,
      });

      const reviewWithUser = await db.Review.findByPk(review.review_id, {
        include: [{ model: db.User, as: "user", attributes: ["user_id", "full_name", "profile_image"] }],
      });

      return res.status(201).json({ success: true, message: "Review submitted successfully", data: reviewWithUser });
    } catch (error) {
      console.error("Create review error:", error);
      return res.status(500).json({ success: false, message: "Failed to submit review" });
    }
  });
};

// ==================== CREATE REPLY ====================
const createReply = async (req, res) => {
  try {
    const { review_id } = req.params;
    const { comment } = req.body;

    if (!comment || !comment.trim()) {
      return res.status(400).json({ success: false, message: "Reply comment is required" });
    }

    // Find the root review (parent or grandparent)
    const parentReview = await db.Review.findByPk(review_id);
    if (!parentReview) return res.status(404).json({ success: false, message: "Review not found" });

    // Get product_id from parent (could be a reply itself)
    const productId = parentReview.product_id;

    const reply = await db.Review.create({
      product_id: productId,
      user_id: req.user.user_id,
      parent_id: parseInt(review_id),
      rating: null,         // replies don't carry ratings
      comment: comment.trim(),
      images: [],
      verified_purchase: false,
      helpful_count: 0,
    });

    const replyWithUser = await db.Review.findByPk(reply.review_id, {
      include: [{ model: db.User, as: "user", attributes: ["user_id", "full_name", "profile_image"] }],
    });

    return res.status(201).json({ success: true, message: "Reply posted successfully", data: replyWithUser });
  } catch (error) {
    console.error("Create reply error:", error);
    return res.status(500).json({ success: false, message: "Failed to post reply" });
  }
};

// ==================== TOGGLE HELPFUL ====================
const toggleHelpful = async (req, res) => {
  try {
    const { review_id } = req.params;
    const user_id = req.user.user_id;

    const review = await db.Review.findByPk(review_id);
    if (!review) return res.status(404).json({ success: false, message: "Review not found" });

    // Check if user already voted
    const existing = await db.ReviewHelpful.findOne({
      where: { review_id: parseInt(review_id), user_id },
    });

    if (existing) {
      // Un-mark helpful (toggle off)
      await existing.destroy();
      await review.update({ helpful_count: Math.max(0, review.helpful_count - 1) });
      return res.json({ success: true, marked: false, helpful_count: review.helpful_count - 1 });
    } else {
      // Mark helpful (toggle on)
      await db.ReviewHelpful.create({ review_id: parseInt(review_id), user_id });
      await review.update({ helpful_count: review.helpful_count + 1 });
      return res.json({ success: true, marked: true, helpful_count: review.helpful_count + 1 });
    }
  } catch (error) {
    console.error("Toggle helpful error:", error);
    return res.status(500).json({ success: false, message: "Failed to toggle helpful" });
  }
};

// ==================== GET PRODUCT REVIEWS ====================
const getProductReviews = async (req, res) => {
  try {
    const { product_id } = req.params;
    const currentUserId = req.user?.user_id || null;

    const reviews = await fetchReviewsWithReplies(product_id, currentUserId);

    // Stats only from top-level reviews (not replies)
    const topLevel = reviews; // already filtered
    const totalReviews = topLevel.length;
    const avgRating = totalReviews > 0
      ? topLevel.reduce((sum, r) => sum + (r.rating || 0), 0) / totalReviews
      : 0;

    const ratingCounts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    topLevel.forEach((r) => {
      if (r.rating) ratingCounts[r.rating] = (ratingCounts[r.rating] || 0) + 1;
    });

    return res.status(200).json({
      success: true,
      data: {
        reviews,
        totalReviews,
        averageRating: parseFloat(avgRating.toFixed(1)),
        ratingCounts,
      },
    });
  } catch (error) {
    console.error("Get product reviews error:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch reviews" });
  }
};

// ==================== GET USER REVIEWS ====================
const getUserReviews = async (req, res) => {
  try {
    const reviews = await db.Review.findAll({
      where: { user_id: req.user.user_id, parent_id: null },
      include: [{ model: db.Product, as: "product", attributes: ["product_id", "name", "images", "price"] }],
      order: [["created_at", "DESC"]],
    });
    return res.status(200).json({ success: true, data: reviews });
  } catch (error) {
    console.error("Get user reviews error:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch reviews" });
  }
};

// ==================== UPDATE REVIEW ====================
const updateReview = async (req, res) => {
  try {
    const { review_id } = req.params;
    const { rating, comment } = req.body;

    const review = await db.Review.findByPk(review_id);
    if (!review) return res.status(404).json({ success: false, message: "Review not found" });
    if (review.user_id !== req.user.user_id) return res.status(403).json({ success: false, message: "You can only edit your own reviews" });

    await review.update({
      rating: rating ? parseInt(rating) : review.rating,
      comment: comment !== undefined ? comment : review.comment,
    });

    return res.status(200).json({ success: true, message: "Review updated successfully", data: review });
  } catch (error) {
    console.error("Update review error:", error);
    return res.status(500).json({ success: false, message: "Failed to update review" });
  }
};

// ==================== DELETE REVIEW ====================
const deleteReview = async (req, res) => {
  try {
    const { review_id } = req.params;
    const review = await db.Review.findByPk(review_id);

    if (!review) return res.status(404).json({ success: false, message: "Review not found" });
    if (review.user_id !== req.user.user_id) return res.status(403).json({ success: false, message: "You can only delete your own reviews" });

    // Delete images from filesystem
    if (review.images?.length > 0) {
      review.images.forEach((imgPath) => {
        const fullPath = path.join(__dirname, "..", imgPath);
        if (fs.existsSync(fullPath)) fs.unlinkSync(fullPath);
      });
    }

    // Also delete all replies to this review
    await db.Review.destroy({ where: { parent_id: review_id } });
    // Delete helpful votes
    await db.ReviewHelpful.destroy({ where: { review_id } });
    await review.destroy();

    return res.status(200).json({ success: true, message: "Review deleted successfully" });
  } catch (error) {
    console.error("Delete review error:", error);
    return res.status(500).json({ success: false, message: "Failed to delete review" });
  }
};

module.exports = {
  createReview,
  createReply,
  toggleHelpful,
  getProductReviews,
  getUserReviews,
  updateReview,
  deleteReview,
};