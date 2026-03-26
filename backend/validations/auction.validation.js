const { body } = require("express-validator");
const { handleValidation } = require("./validationindex");

const createAuctionRules = [
  body("title")
    .trim()
    .notEmpty().withMessage("Auction title is required")
    .isLength({ min: 3, max: 200 }).withMessage("Title must be between 3 and 200 characters"),

  body("description")
    .trim()
    .notEmpty().withMessage("Auction description is required")
    .isLength({ min: 10 }).withMessage("Description must be at least 10 characters"),

  body("starting_bid")
    .notEmpty().withMessage("Starting bid is required")
    .isFloat({ gt: 0 }).withMessage("Starting bid must be a positive number"),

  body("minimum_increment")
    .optional()
    .isFloat({ gt: 0 }).withMessage("Minimum increment must be a positive number"),

  body("auction_start")
    .notEmpty().withMessage("Auction start time is required")
    .isISO8601().withMessage("Auction start time must be a valid date")
    .custom((value) => {
      if (new Date(value) <= new Date()) {
        throw new Error("Auction start time must be in the future");
      }
      return true;
    }),

  body("auction_end")
    .notEmpty().withMessage("Auction end time is required")
    .isISO8601().withMessage("Auction end time must be a valid date")
    .custom((value, { req }) => {
      if (new Date(value) <= new Date(req.body.auction_start)) {
        throw new Error("Auction end time must be after the start time");
      }
      return true;
    }),

  handleValidation,
];

const placeBidRules = [
  body("bid_amount")
    .notEmpty().withMessage("Bid amount is required")
    .isFloat({ gt: 0 }).withMessage("Bid amount must be a positive number"),

  handleValidation,
];

const rejectAuctionRules = [
  body("rejection_reason")
    .trim()
    .notEmpty().withMessage("Rejection reason is required")
    .isLength({ min: 5 }).withMessage("Rejection reason must be at least 5 characters"),

  handleValidation,
];

module.exports = {
  createAuctionRules,
  placeBidRules,
  rejectAuctionRules,
};