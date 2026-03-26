const { body, param } = require("express-validator");
const { handleValidation } = require("./validationindex");

// Admin rejecting a seller requires a reason
const rejectSellerRules = [
  body("rejection_reason")
    .trim()
    .notEmpty().withMessage("Rejection reason is required")
    .isLength({ min: 5 }).withMessage("Rejection reason must be at least 5 characters"),
  handleValidation,
];

// Admin rejecting a product requires a reason
const rejectProductRules = [
  body("rejection_reason")
    .trim()
    .notEmpty().withMessage("Rejection reason is required")
    .isLength({ min: 5 }).withMessage("Rejection reason must be at least 5 characters"),
  handleValidation,
];

// Admin rejecting an auction requires a reason
const rejectAuctionRules = [
  body("rejection_reason")
    .trim()
    .notEmpty().withMessage("Rejection reason is required")
    .isLength({ min: 5 }).withMessage("Rejection reason must be at least 5 characters"),
  handleValidation,
];

// Admin updating a contact message status
const updateContactStatusRules = [
  body("status")
    .optional()
    .isIn(["pending", "in_progress", "resolved"])
    .withMessage("Status must be pending, in_progress, or resolved"),
  body("admin_reply")
    .optional()
    .trim()
    .isLength({ min: 1, max: 2000 })
    .withMessage("Reply must not exceed 2000 characters"),
  handleValidation,
];

module.exports = {
  rejectSellerRules,
  rejectProductRules,
  rejectAuctionRules,
  updateContactStatusRules,
};