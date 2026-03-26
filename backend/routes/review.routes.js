const express = require("express");
const router = express.Router();
const {
  createReview,
  createReply,
  toggleHelpful,
  getProductReviews,
  getUserReviews,
  getSellerReviews,
  updateReview,
  deleteReview,
} = require("../controllers/review.controller");
const { authenticate, optionalAuthenticate } = require("../middlewares/auth.middleware");

// Public — guests can read reviews, logged-in users get helpful vote state
router.get("/product/:product_id", optionalAuthenticate, getProductReviews);

// Buyer — their own reviews
router.get("/my-reviews", authenticate, getUserReviews);

// Seller — reviews on their products
router.get("/seller/my-reviews", authenticate, getSellerReviews);

// Authenticated actions
router.post("/",                    authenticate, createReview);
router.post("/:review_id/reply",    authenticate, createReply);
router.post("/:review_id/helpful",  authenticate, toggleHelpful);
router.put("/:review_id",           authenticate, updateReview);
router.delete("/:review_id",        authenticate, deleteReview);

module.exports = router;