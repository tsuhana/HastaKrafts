const { body } = require("express-validator");
const { handleValidation } = require("./validationindex");

const registerBuyerRules = [
  body("full_name")
    .trim()
    .notEmpty().withMessage("Full name is required")
    .isLength({ min: 2, max: 100 }).withMessage("Full name must be between 2 and 100 characters")
    .matches(/^[A-Za-z\s\u0900-\u097F'-]+$/).withMessage("Full name must contain only letters"),

  body("email")
    .trim()
    .notEmpty().withMessage("Email is required")
    .isEmail().withMessage("Please provide a valid email address")
    .customSanitizer((value) => value.toLowerCase()),

  body("password")
    .notEmpty().withMessage("Password is required")
    .isLength({ min: 6 }).withMessage("Password must be at least 6 characters")
    .matches(/[A-Za-z]/).withMessage("Password must contain at least one letter")
    .matches(/[0-9]/).withMessage("Password must contain at least one number"),

  body("phone")
    .optional({ checkFalsy: true })
    .trim()
    .matches(/^[0-9+\-\s]{7,15}$/).withMessage("Please provide a valid phone number"),

  handleValidation,
];

const registerSellerRules = [
  body("full_name")
    .trim()
    .notEmpty().withMessage("Full name is required")
    .isLength({ min: 2, max: 100 }).withMessage("Full name must be between 2 and 100 characters")
    .matches(/^[A-Za-z\s\u0900-\u097F'-]+$/).withMessage("Full name must contain only letters"),

  body("email")
    .trim()
    .notEmpty().withMessage("Email is required")
    .isEmail().withMessage("Please provide a valid email address")
    .customSanitizer((value) => value.toLowerCase()),

  body("password")
    .notEmpty().withMessage("Password is required")
    .isLength({ min: 6 }).withMessage("Password must be at least 6 characters")
    .matches(/[A-Za-z]/).withMessage("Password must contain at least one letter")
    .matches(/[0-9]/).withMessage("Password must contain at least one number"),

  body("phone")
    .trim()
    .notEmpty().withMessage("Phone number is required for sellers")
    .matches(/^[0-9+\-\s]{7,15}$/).withMessage("Please provide a valid phone number"),

  body("shop_name")
    .trim()
    .notEmpty().withMessage("Shop name is required")
    .isLength({ min: 2, max: 100 }).withMessage("Shop name must be between 2 and 100 characters"),

  body("address")
    .trim()
    .notEmpty().withMessage("Address is required"),

  body("city")
    .trim()
    .notEmpty().withMessage("City is required"),

  body("citizenship_number")
    .trim()
    .notEmpty().withMessage("Citizenship number is required"),

  handleValidation,
];

const loginRules = [
  body("email")
    .trim()
    .notEmpty().withMessage("Email is required")
    .isEmail().withMessage("Please provide a valid email address")
    .customSanitizer((value) => value.toLowerCase()),

  body("password")
    .notEmpty().withMessage("Password is required"),

  handleValidation,
];

const forgotPasswordRules = [
  body("email")
    .trim()
    .notEmpty().withMessage("Email is required")
    .isEmail().withMessage("Please provide a valid email address")
    .customSanitizer((value) => value.toLowerCase()),

  handleValidation,
];

const verifyOTPRules = [
  body("email")
    .trim()
    .notEmpty().withMessage("Email is required")
    .isEmail().withMessage("Please provide a valid email address")
    .customSanitizer((value) => value.toLowerCase()),

  body("otp")
    .trim()
    .notEmpty().withMessage("OTP is required")
    .isLength({ min: 6, max: 6 }).withMessage("OTP must be 6 digits")
    .isNumeric().withMessage("OTP must contain only numbers"),

  handleValidation,
];

const resetPasswordRules = [
  body("resetToken")
    .trim()
    .notEmpty().withMessage("Reset token is required"),

  body("newPassword")
    .notEmpty().withMessage("New password is required")
    .isLength({ min: 6 }).withMessage("Password must be at least 6 characters")
    .matches(/[A-Za-z]/).withMessage("Password must contain at least one letter")
    .matches(/[0-9]/).withMessage("Password must contain at least one number"),

  handleValidation,
];

module.exports = {
  registerBuyerRules,
  registerSellerRules,
  loginRules,
  forgotPasswordRules,
  verifyOTPRules,
  resetPasswordRules,
};