const express = require("express");
const router = express.Router();
const { createReview, createReply, toggleHelpful, getProductReviews, getUserReviews, getSellerReviews, updateReview, deleteReview } = require("../controllers/review.controller");
const { authenticate, optionalAuthenticate } = require("../middlewares/auth.middleware");
const { createReviewRules, createReplyRules, updateReviewRules } = require("../validations/review.validation");

// Public
router.get("/product/:product_id", optionalAuthenticate, getProductReviews);

// Buyer / seller
router.get("/my-reviews",            authenticate, getUserReviews);
router.get("/seller/my-reviews",     authenticate, getSellerReviews);

// Authenticated actions
router.post("/",                     authenticate, createReviewRules,  createReview);
router.post("/:review_id/reply",     authenticate, createReplyRules,   createReply);
router.post("/:review_id/helpful",   authenticate, toggleHelpful);
router.put("/:review_id",            authenticate, updateReviewRules,  updateReview);
router.delete("/:review_id",         authenticate, deleteReview);

module.exports = router;