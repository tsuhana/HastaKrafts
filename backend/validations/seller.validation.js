const { body } = require("express-validator");
const { handleValidation } = require("./validationindex");

const updateSellerProfileRules = [
  body("shop_name")
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage("Shop name must be between 2 and 100 characters"),

  body("shop_description")
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage("Shop description must not exceed 1000 characters"),

  body("address")
    .optional()
    .trim()
    .isLength({ min: 5, max: 255 })
    .withMessage("Address must be between 5 and 255 characters"),

  body("city")
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage("City must be between 2 and 50 characters"),

  body("bank_name")
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage("Bank name must not exceed 100 characters"),

  body("bank_account_number")
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage("Bank account number must not exceed 50 characters"),

  body("bank_account_name")
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage("Bank account name must not exceed 100 characters"),

  handleValidation,
];

module.exports = { updateSellerProfileRules };