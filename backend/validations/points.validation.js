const { body } = require("express-validator");
const { handleValidation } = require("./validationindex");

// Points controller only has GET routes (getUserPoints, getPointsHistory)
// and internal functions (awardPoints, redeemPoints) called from order controller.
// No user-submitted body input — so no input validators needed for public routes.
// This file is a placeholder to keep the validators folder consistent.

// If a future route allows manual point redemption via API body, add here:
const redeemPointsRules = [
  body("points")
    .notEmpty().withMessage("Points amount is required")
    .isInt({ min: 1 }).withMessage("Points must be a positive whole number"),

  handleValidation,
];

module.exports = { redeemPointsRules };