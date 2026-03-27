const { body } = require("express-validator");
const { handleValidation } = require("./validationindex");

const updateProfileRules = [
  body("full_name")
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage("Full name must be between 2 and 100 characters"),

  body("email")
    .optional()
    .trim()
    .isEmail().withMessage("Please provide a valid email address")
    .customSanitizer((value) => value.toLowerCase()),

  body("phone")
    .optional()
    .trim()
    .matches(/^[0-9+\-\s]{7,15}$/)
    .withMessage("Please provide a valid phone number"),

  body("address")
    .optional()
    .trim()
    .isLength({ max: 255 }).withMessage("Address must not exceed 255 characters"),

  body("city")
    .optional()
    .trim()
    .isLength({ max: 100 }).withMessage("City must not exceed 100 characters"),

  handleValidation,
];

const changePasswordRules = [
  body("current_password")
    .notEmpty().withMessage("Current password is required"),

  body("new_password")
    .notEmpty().withMessage("New password is required")
    .isLength({ min: 6 }).withMessage("New password must be at least 6 characters")
    .matches(/[A-Za-z]/).withMessage("New password must contain at least one letter")
    .matches(/[0-9]/).withMessage("New password must contain at least one number"),

  handleValidation,
];

module.exports = { updateProfileRules, changePasswordRules };