const express = require("express");
const router = express.Router();
const {
  createReview,
  getProductReviews,
  getUserReviews,
  updateReview,
  deleteReview
} = require("../controllers/review.controller");
const { authenticate } = require("../middlewares/auth.middleware");
const { checkRole } = require("../middlewares/roleCheck.middleware");

// Public routes
router.get("/product/:product_id", getProductReviews);

// Protected routes (buyers only)
router.post("/", authenticate, checkRole("buyer"), createReview);
router.get("/my-reviews", authenticate, checkRole("buyer"), getUserReviews);
router.put("/:review_id", authenticate, checkRole("buyer"), updateReview);
router.delete("/:review_id", authenticate, checkRole("buyer"), deleteReview);

module.exports = router;