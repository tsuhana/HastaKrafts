const { body } = require("express-validator");
const { handleValidation } = require("./validationindex");

const createProductRules = [
  body("name")
    .trim()
    .notEmpty().withMessage("Product name is required")
    .isLength({ min: 3, max: 200 }).withMessage("Product name must be between 3 and 200 characters"),

  body("description")
    .trim()
    .notEmpty().withMessage("Product description is required")
    .isLength({ min: 10, max: 2000 }).withMessage("Description must be between 10 and 2000 characters"),

  body("price")
    .notEmpty().withMessage("Price is required")
    .isFloat({ gt: 0 }).withMessage("Price must be a positive number"),

  body("category_id")
    .notEmpty().withMessage("Category is required")
    .isInt({ gt: 0 }).withMessage("Invalid category"),

  body("stock_quantity")
    .notEmpty().withMessage("Stock quantity is required")
    .isInt({ min: 0 }).withMessage("Stock quantity cannot be negative"),

  body("discount_percentage")
    .optional()
    .isInt({ min: 0, max: 99 }).withMessage("Discount percentage must be between 0 and 99"),

  body("sku")
    .optional()
    .trim()
    .isLength({ max: 100 }).withMessage("SKU must not exceed 100 characters"),

  handleValidation,
];

const updateProductRules = [
  body("name")
    .optional()
    .trim()
    .isLength({ min: 3, max: 200 }).withMessage("Product name must be between 3 and 200 characters"),

  body("description")
    .optional()
    .trim()
    .isLength({ min: 10, max: 2000 }).withMessage("Description must be between 10 and 2000 characters"),

  body("price")
    .optional()
    .isFloat({ gt: 0 }).withMessage("Price must be a positive number"),

  body("stock_quantity")
    .optional()
    .isInt({ min: 0 }).withMessage("Stock quantity cannot be negative"),

  body("discount_percentage")
    .optional()
    .isInt({ min: 0, max: 99 }).withMessage("Discount percentage must be between 0 and 99"),

  handleValidation,
];

module.exports = {
  createProductRules,
  updateProductRules,
};