const db = require("../models");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { sendPushNotification, createNotification } = require("../utils/notification.util");

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
    if (
      allowed.test(path.extname(file.originalname).toLowerCase()) &&
      allowed.test(file.mimetype)
    ) {
      return cb(null, true);
    }
    cb(new Error("Only image files allowed"));
  },
}).array("images", 3);

const fetchReviewsWithReplies = async (productId, currentUserId = null) => {
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

  let helpfulSet = new Set();
  if (currentUserId) {
    const votes = await db.ReviewHelpful.findAll({
      where: { user_id: currentUserId },
      attributes: ["review_id"],
    });
    helpfulSet = new Set(votes.map((v) => v.review_id));
  }

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

const createReview = async (req, res) => {
  upload(req, res, async (err) => {
    if (err) {
      return res.status(400).json({
        success: false,
        message: err.message || "File upload error",
      });
    }

    try {
      const { product_id, rating, comment } = req.body;

      if (!product_id) {
        return res.status(400).json({ success: false, message: "Product ID is required" });
      }
      if (!rating) {
        return res.status(400).json({ success: false, message: "Rating is required" });
      }

      const parsedRating = parseInt(rating);
      if (isNaN(parsedRating) || parsedRating < 1 || parsedRating > 5) {
        return res.status(400).json({ success: false, message: "Rating must be between 1 and 5" });
      }
      if (comment && comment.trim().length > 1000) {
        return res.status(400).json({ success: false, message: "Comment must be under 1000 characters" });
      }

      const product = await db.Product.findByPk(product_id, {
        include: [
          {
            model: db.Seller,
            as: "seller",
            include: [
              {
                model: db.User,
                as: "user",
                attributes: ["user_id", "webpushr_sid"],
              },
            ],
          },
        ],
      });
      if (!product) {
        return res.status(404).json({ success: false, message: "Product not found" });
      }

      const existing = await db.Review.findOne({
        where: { product_id, user_id: req.user.user_id, parent_id: null },
      });
      if (existing) {
        return res.status(400).json({ success: false, message: "You have already reviewed this product" });
      }

      const orderItem = await db.OrderItem.findOne({
        include: [
          {
            model: db.Order,
            as: "order",
            where: { user_id: req.user.user_id, order_status: "delivered" },
          },
        ],
        where: { product_id },
      });

      const imagePaths = req.files
        ? req.files.map((f) => `/uploads/reviews/${f.filename}`)
        : [];

      const review = await db.Review.create({
        product_id,
        user_id: req.user.user_id,
        order_id: orderItem ? orderItem.order_id : null,
        parent_id: null,
        rating: parsedRating,
        comment: comment ? comment.trim() : null,
        images: imagePaths,
        verified_purchase: !!orderItem,
        helpful_count: 0,
      });

      const reviewWithUser = await db.Review.findByPk(review.review_id, {
        include: [
          {
            model: db.User,
            as: "user",
            attributes: ["user_id", "full_name", "profile_image"],
          },
        ],
      });

      //  Notify seller of new review
      if (product.seller?.user?.user_id) {
        createNotification(
          product.seller.user.user_id,
          "new_review",
          "⭐ New Review on Your Product",
          `A buyer left a ${parsedRating}-star review on "${product.name}". Reply to build trust!`,
          "/seller/dashboard",
          { product_id: parseInt(product_id), review_id: review.review_id }
        ).catch(() => {});
      }

      return res.status(201).json({
        success: true,
        message: "Review submitted successfully",
        data: reviewWithUser,
      });
    } catch (error) {
      console.error("Create review error:", error);
      return res.status(500).json({ success: false, message: "Failed to submit review" });
    }
  });
};

const createReply = async (req, res) => {
  try {
    const { review_id } = req.params;
    const { comment } = req.body;

    if (!comment || !comment.trim()) {
      return res.status(400).json({ success: false, message: "Reply comment is required" });
    }
    if (comment.trim().length > 500) {
      return res.status(400).json({ success: false, message: "Reply must be under 500 characters" });
    }

    const parentReview = await db.Review.findByPk(review_id, {
      include: [
        {
          model: db.User,
          as: "user",
          attributes: ["user_id", "webpushr_sid", "full_name"],
        },
      ],
    });
    if (!parentReview) {
      return res.status(404).json({ success: false, message: "Review not found" });
    }

    const rootParentId = parentReview.parent_id
      ? parentReview.parent_id
      : parseInt(review_id);

    const reply = await db.Review.create({
      product_id: parentReview.product_id,
      user_id: req.user.user_id,
      parent_id: rootParentId,
      rating: null,
      comment: comment.trim(),
      images: [],
      verified_purchase: false,
      helpful_count: 0,
    });

    const replyWithUser = await db.Review.findByPk(reply.review_id, {
      include: [
        {
          model: db.User,
          as: "user",
          attributes: ["user_id", "full_name", "profile_image"],
        },
      ],
    });

    // Push + in-app notification to original reviewer
    if (parentReview.user && parentReview.user_id !== req.user.user_id) {
      if (parentReview.user.webpushr_sid) {
        sendPushNotification(
          parentReview.user.webpushr_sid,
          "💬 Reply to your review!",
          "A seller replied to your review. See what they said!",
          `http://localhost:5173/products/${parentReview.product_id}`
        ).catch(() => {});
      }
      createNotification(
        parentReview.user.user_id,
        "review_reply",
        "💬 Someone replied to your review!",
        "A seller replied to your review. Tap to see their response.",
        `/products/${parentReview.product_id}`,
        { review_id: parseInt(review_id) }
      ).catch(() => {});
    }

    return res.status(201).json({
      success: true,
      message: "Reply posted successfully",
      data: replyWithUser,
    });
  } catch (error) {
    console.error("Create reply error:", error);
    return res.status(500).json({ success: false, message: "Failed to post reply" });
  }
};

const toggleHelpful = async (req, res) => {
  try {
    const { review_id } = req.params;
    const user_id = req.user.user_id;

    const review = await db.Review.findByPk(review_id);
    if (!review) {
      return res.status(404).json({ success: false, message: "Review not found" });
    }

    const existing = await db.ReviewHelpful.findOne({
      where: { review_id: parseInt(review_id), user_id },
    });

    if (existing) {
      await existing.destroy();
      await review.update({ helpful_count: Math.max(0, review.helpful_count - 1) });
      return res.json({
        success: true,
        marked: false,
        helpful_count: review.helpful_count - 1,
      });
    } else {
      await db.ReviewHelpful.create({ review_id: parseInt(review_id), user_id });
      await review.update({ helpful_count: review.helpful_count + 1 });
      return res.json({
        success: true,
        marked: true,
        helpful_count: review.helpful_count + 1,
      });
    }
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to toggle helpful" });
  }
};

const getProductReviews = async (req, res) => {
  try {
    const { product_id } = req.params;
    const currentUserId = req.user?.user_id || null;

    const reviews = await fetchReviewsWithReplies(product_id, currentUserId);

    // Only top-level reviews with actual ratings (exclude replies)
    const ratedReviews = reviews.filter((r) => r.rating !== null && r.rating > 0);
    const totalReviews = ratedReviews.length;
    const avgRating =
      totalReviews > 0
        ? ratedReviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews
        : 0;

    const ratingCounts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    ratedReviews.forEach((r) => {
      ratingCounts[r.rating] = (ratingCounts[r.rating] || 0) + 1;
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
    return res.status(500).json({ success: false, message: "Failed to fetch reviews" });
  }
};

const getUserReviews = async (req, res) => {
  try {
    const reviews = await db.Review.findAll({
      where: { user_id: req.user.user_id, parent_id: null },
      include: [
        {
          model: db.Product,
          as: "product",
          attributes: ["product_id", "name", "images", "price"],
        },
      ],
      order: [["created_at", "DESC"]],
    });
    return res.status(200).json({ success: true, data: reviews });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to fetch reviews" });
  }
};

const getSellerReviews = async (req, res) => {
  try {
    const seller = await db.Seller.findOne({ where: { user_id: req.user.user_id } });
    if (!seller) {
      return res.status(404).json({ success: false, message: "Seller profile not found" });
    }

    const sellerProducts = await db.Product.findAll({
      where: { seller_id: seller.seller_id },
      attributes: ["product_id"],
    });
    const productIds = sellerProducts.map((p) => p.product_id);

    if (productIds.length === 0) {
      return res.status(200).json({ success: true, data: [] });
    }

    const reviews = await db.Review.findAll({
      where: { product_id: productIds, parent_id: null },
      include: [
        {
          model: db.User,
          as: "user",
          attributes: ["user_id", "full_name", "profile_image"],
        },
        {
          model: db.Product,
          as: "product",
          attributes: ["product_id", "name", "images", "price"],
        },
      ],
      order: [["created_at", "DESC"]],
    });

    return res.status(200).json({ success: true, data: reviews });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to fetch seller reviews" });
  }
};

const updateReview = async (req, res) => {
  try {
    const { review_id } = req.params;
    const { rating, comment } = req.body;
    const currentUserId = req.user.user_id;
    const isAdmin = req.user.role === "admin";

    const review = await db.Review.findByPk(review_id);
    if (!review) {
      return res.status(404).json({ success: false, message: "Review not found" });
    }
    if (review.user_id !== currentUserId && !isAdmin) {
      return res.status(403).json({ success: false, message: "You can only edit your own reviews" });
    }

    const isReply = review.parent_id !== null;

    if (rating !== undefined && isReply) {
      return res.status(400).json({ success: false, message: "Cannot set a rating on a reply" });
    }
    if (rating !== undefined) {
      const parsedRating = parseInt(rating);
      if (isNaN(parsedRating) || parsedRating < 1 || parsedRating > 5) {
        return res.status(400).json({ success: false, message: "Rating must be between 1 and 5" });
      }
    }
    if (comment !== undefined) {
      if (typeof comment !== "string" || comment.trim().length === 0) {
        return res.status(400).json({ success: false, message: "Comment cannot be empty" });
      }
      const maxLen = isReply ? 500 : 1000;
      if (comment.trim().length > maxLen) {
        return res.status(400).json({
          success: false,
          message: `Comment must be under ${maxLen} characters`,
        });
      }
    }

    const updatePayload = {};
    if (comment !== undefined) updatePayload.comment = comment.trim();
    if (rating !== undefined && !isReply) updatePayload.rating = parseInt(rating);

    await review.update(updatePayload);
    return res.status(200).json({ success: true, message: "Updated successfully", data: review });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to update review" });
  }
};

const deleteReview = async (req, res) => {
  try {
    const { review_id } = req.params;
    const currentUserId = req.user.user_id;
    const isAdmin = req.user.role === "admin";

    const review = await db.Review.findByPk(review_id);
    if (!review) {
      return res.status(404).json({ success: false, message: "Review not found" });
    }
    if (review.user_id !== currentUserId && !isAdmin) {
      return res.status(403).json({ success: false, message: "You can only delete your own reviews" });
    }

    if (review.images?.length > 0) {
      review.images.forEach((imgPath) => {
        const fullPath = path.join(__dirname, "..", imgPath);
        if (fs.existsSync(fullPath)) fs.unlinkSync(fullPath);
      });
    }

    await db.Review.destroy({ where: { parent_id: review_id } });
    await db.ReviewHelpful.destroy({ where: { review_id } });
    await review.destroy();

    return res.status(200).json({ success: true, message: "Review deleted successfully" });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to delete review" });
  }
};

module.exports = {
  createReview,
  createReply,
  toggleHelpful,
  getProductReviews,
  getUserReviews,
  getSellerReviews,
  updateReview,
  deleteReview,
};