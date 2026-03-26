const { body } = require("express-validator");
const { handleValidation } = require("./validationindex");

const VALID_CATEGORIES = [
  "craft_process",
  "heritage",
  "personal_journey",
  "tips_tricks",
  "behind_scenes",
  "other",
];

const createStoryRules = [
  body("title")
    .trim()
    .notEmpty().withMessage("Title is required")
    .isLength({ min: 3, max: 300 }).withMessage("Title must be between 3 and 300 characters"),

  body("content")
    .trim()
    .notEmpty().withMessage("Content is required")
    .isLength({ min: 20 }).withMessage("Content must be at least 20 characters"),

  body("excerpt")
    .optional()
    .trim()
    .isLength({ max: 500 }).withMessage("Excerpt must not exceed 500 characters"),

  body("category")
    .optional()
    .isIn(VALID_CATEGORIES)
    .withMessage("Invalid category. Must be one of: " + VALID_CATEGORIES.join(", ")),

  handleValidation,
];

const updateStoryRules = [
  body("title")
    .optional()
    .trim()
    .isLength({ min: 3, max: 300 }).withMessage("Title must be between 3 and 300 characters"),

  body("content")
    .optional()
    .trim()
    .isLength({ min: 20 }).withMessage("Content must be at least 20 characters"),

  body("excerpt")
    .optional()
    .trim()
    .isLength({ max: 500 }).withMessage("Excerpt must not exceed 500 characters"),

  body("category")
    .optional()
    .isIn(VALID_CATEGORIES)
    .withMessage("Invalid category. Must be one of: " + VALID_CATEGORIES.join(", ")),

  body("is_published")
    .optional()
    .isBoolean().withMessage("is_published must be true or false"),

  handleValidation,
];

module.exports = { createStoryRules, updateStoryRules };