const express = require("express");
const router = express.Router();
const {
  createReview,
  createReply,
  toggleHelpful,
  getProductReviews,
  getUserReviews,
  updateReview,
  deleteReview,
} = require("../controllers/review.controller");
const { authenticate, optionalAuthenticate } = require("../middlewares/auth.middleware");

// optionalAuthenticate — guests see reviews, logged-in users get helpful state
router.get("/product/:product_id", optionalAuthenticate, getProductReviews);
router.get("/my-reviews", authenticate, getUserReviews);

// Authenticated routes
router.post("/", authenticate, createReview);
router.post("/:review_id/reply", authenticate, createReply);
router.post("/:review_id/helpful", authenticate, toggleHelpful);
router.put("/:review_id", authenticate, updateReview);
router.delete("/:review_id", authenticate, deleteReview);

module.exports = router;