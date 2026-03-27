const { body, param } = require("express-validator");
const { handleValidation } = require("./validationindex");

const addToCartRules = [
  body("product_id")
    .notEmpty().withMessage("Product ID is required")
    .isInt({ gt: 0 }).withMessage("Invalid product ID"),

  body("quantity")
    .optional()
    .isInt({ min: 1 }).withMessage("Quantity must be at least 1"),

  handleValidation,
];

const updateCartItemRules = [
  body("quantity")
    .notEmpty().withMessage("Quantity is required")
    .isInt({ min: 1 }).withMessage("Quantity must be at least 1"),

  handleValidation,
];

module.exports = {
  addToCartRules,
  updateCartItemRules,
};