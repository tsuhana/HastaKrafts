const express = require("express");
const router = express.Router();
const {
  createAuction,
  getAllAuctions,
  getAuctionById,
  getSellerAuctions,
  placeBid,
  getAuctionBids
} = require("../controllers/auction.controller");
const { authenticate } = require("../middlewares/auth.middleware");

// Public routes
router.get("/", getAllAuctions);
router.get("/:id", getAuctionById);
router.get("/:auction_id/bids", getAuctionBids);

// Protected routes (require authentication)
router.post("/create", authenticate, createAuction);
router.get("/seller/my-auctions", authenticate, getSellerAuctions);
router.post("/:auction_id/bid", authenticate, placeBid);

module.exports = router;