const { body } = require("express-validator");
const { handleValidation } = require("./validationindex");

const addToWishlistRules = [
  body("product_id")
    .notEmpty().withMessage("Product ID is required")
    .isInt({ gt: 0 }).withMessage("Invalid product ID"),

  handleValidation,
];

module.exports = { addToWishlistRules };