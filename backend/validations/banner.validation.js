const { body } = require("express-validator");
const { handleValidation } = require("./validationindex");

const createBannerRules = [
  body("title")
    .trim()
    .notEmpty().withMessage("Banner title is required")
    .isLength({ min: 2, max: 200 }).withMessage("Title must be between 2 and 200 characters"),

  body("link_type")
    .optional()
    .isIn(["none", "category", "product", "external"])
    .withMessage("Link type must be none, category, product, or external"),

  body("link_url")
    .optional()
    .trim()
    .isLength({ max: 500 }).withMessage("Link URL must not exceed 500 characters"),

  body("display_order")
    .optional()
    .isInt({ min: 0 }).withMessage("Display order must be a non-negative number"),

  handleValidation,
];

const updateBannerRules = [
  body("title")
    .optional()
    .trim()
    .isLength({ min: 2, max: 200 }).withMessage("Title must be between 2 and 200 characters"),

  body("link_type")
    .optional()
    .isIn(["none", "category", "product", "external"])
    .withMessage("Link type must be none, category, product, or external"),

  body("display_order")
    .optional()
    .isInt({ min: 0 }).withMessage("Display order must be a non-negative number"),

  handleValidation,
];

module.exports = {
  createBannerRules,
  updateBannerRules,
};