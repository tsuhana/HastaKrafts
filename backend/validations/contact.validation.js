const { body } = require("express-validator");
const { handleValidation } = require("./validationindex");

// Public contact form submission
const submitContactRules = [
  body("name")
    .trim()
    .notEmpty().withMessage("Name is required")
    .isLength({ min: 2, max: 200 }).withMessage("Name must be between 2 and 200 characters"),

  body("email")
    .trim()
    .notEmpty().withMessage("Email is required")
    .isEmail().withMessage("Please provide a valid email address")
    .normalizeEmail(),

  body("subject")
    .trim()
    .notEmpty().withMessage("Subject is required")
    .isLength({ min: 3, max: 300 }).withMessage("Subject must be between 3 and 300 characters"),

  body("message")
    .trim()
    .notEmpty().withMessage("Message is required")
    .isLength({ min: 10, max: 5000 }).withMessage("Message must be between 10 and 5000 characters"),

  body("phone")
    .optional()
    .trim()
    .isLength({ max: 20 }).withMessage("Phone number must not exceed 20 characters"),

  handleValidation,
];

module.exports = { submitContactRules };