const { body } = require("express-validator");
const { handleValidation } = require("./validationindex");

const createOrderRules = [
  body("delivery_name")
    .trim()
    .notEmpty().withMessage("Delivery name is required")
    .isLength({ min: 2, max: 100 }).withMessage("Delivery name must be between 2 and 100 characters"),

  body("delivery_phone")
    .trim()
    .notEmpty().withMessage("Delivery phone number is required")
    .matches(/^[0-9+\-\s]{7,15}$/).withMessage("Please provide a valid phone number"),

  body("delivery_address")
    .trim()
    .notEmpty().withMessage("Delivery address is required"),

  body("delivery_city")
    .trim()
    .notEmpty().withMessage("Delivery city is required"),

  body("payment_method")
    .trim()
    .notEmpty().withMessage("Payment method is required")
    .isIn(["khalti", "cod"]).withMessage("Payment method must be khalti or cod"),

  body("redeem_points")
    .optional()
    .isBoolean().withMessage("redeem_points must be true or false"),

  handleValidation,
];

const updateOrderStatusRules = [
  body("order_status")
    .trim()
    .notEmpty().withMessage("Order status is required")
    .isIn(["pending", "processing", "shipped", "delivered", "cancelled"])
    .withMessage("Invalid order status. Must be: pending, processing, shipped, delivered, or cancelled"),

  handleValidation,
];

module.exports = {
  createOrderRules,
  updateOrderStatusRules,
};