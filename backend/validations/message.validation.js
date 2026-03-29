const { body } = require("express-validator");
const { handleValidation } = require("./validationindex");

const sendMessageRules = [
  body("receiver_id")
    .notEmpty().withMessage("Receiver is required")
    .isInt({ gt: 0 }).withMessage("Invalid receiver ID"),

  body("message_text")
    .optional()
    .trim()
    .isLength({ max: 2000 }).withMessage("Message must not exceed 2000 characters"),

  handleValidation,
];

module.exports = { sendMessageRules };