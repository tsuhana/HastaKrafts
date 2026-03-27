const { body } = require("express-validator");
const { handleValidation } = require("./validationindex");

const createReviewRules = [
  body("product_id")
    .notEmpty().withMessage("Product ID is required")
    .isInt({ gt: 0 }).withMessage("Invalid product ID"),

  body("rating")
    .notEmpty().withMessage("Rating is required")
    .isInt({ min: 1, max: 5 }).withMessage("Rating must be between 1 and 5"),

  body("comment")
    .optional()
    .trim()
    .isLength({ max: 1000 }).withMessage("Comment must not exceed 1000 characters"),

  handleValidation,
];

const createReplyRules = [
  body("comment")
    .trim()
    .notEmpty().withMessage("Reply comment is required")
    .isLength({ min: 1, max: 500}).withMessage("Reply must not exceed 500 characters"),

  handleValidation,
];

const updateReviewRules = [
  body("rating")
    .optional()
    .isInt({ min: 1, max: 5 }).withMessage("Rating must be between 1 and 5"),

  body("comment")
    .optional()
    .trim()
    .isLength({ max: 1000 }).withMessage("Comment must not exceed 1000 characters"),

  handleValidation,
];

module.exports = {
  createReviewRules,
  createReplyRules,
  updateReviewRules,
};