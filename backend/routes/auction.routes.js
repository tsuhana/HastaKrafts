const express = require("express");
const router = express.Router();
const {
  createAuction,
  approveAuction,
  rejectAuction,
  deleteAuction,
  deleteSellerAuction,
  cancelAuction,
  endAuctionEarly,
  getAllAuctions,
  getAuctionById,
  getSellerAuctions,
  placeBid,
  getAuctionBids,
} = require("../controllers/auction.controller");
const { authenticate, optionalAuthenticate } = require("../middlewares/auth.middleware");
const { checkRole } = require("../middlewares/roleCheck.middleware");
const {
  createAuctionRules,
  placeBidRules,
  rejectAuctionRules,
} = require("../validations/auction.validation");

// ==================== PUBLIC ROUTES ====================
router.get("/", optionalAuthenticate, getAllAuctions);
router.get("/seller/my-auctions", authenticate, checkRole("seller"), getSellerAuctions);
router.get("/:id", optionalAuthenticate, getAuctionById);
router.get("/:auction_id/bids", getAuctionBids);

// ==================== SELLER ROUTES ====================
router.post("/create",          authenticate, checkRole("seller"), createAuctionRules, createAuction);
router.put("/:id/end-early",    authenticate, checkRole("seller"), endAuctionEarly);
router.put("/:id/cancel",       authenticate, checkRole("seller"), cancelAuction);
router.delete("/:id/seller",    authenticate, checkRole("seller"), deleteSellerAuction);

// ==================== ADMIN ROUTES ====================
router.post("/:id/approve",  authenticate, checkRole("admin"), approveAuction);
router.post("/:id/reject",   authenticate, checkRole("admin"), rejectAuctionRules, rejectAuction);
router.delete("/:id",        authenticate, checkRole("admin"), deleteAuction);

// ==================== BUYER ROUTES ====================
router.post("/:auction_id/bid", authenticate, placeBidRules, placeBid);

module.exports = router;