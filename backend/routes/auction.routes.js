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

// ==================== PUBLIC ROUTES ====================
router.get("/", optionalAuthenticate, getAllAuctions);
// IMPORTANT: named routes BEFORE /:id to avoid conflicts
router.get("/seller/my-auctions", authenticate, checkRole("seller"), getSellerAuctions);

router.get("/:id", optionalAuthenticate, getAuctionById);
router.get("/:auction_id/bids", getAuctionBids);

// ==================== SELLER ROUTES ====================
router.post("/create", authenticate, checkRole("seller"), createAuction);

// Seller end auction early
router.put("/:id/end-early", authenticate, checkRole("seller"), endAuctionEarly);

//  Seller cancel their own auction
router.put("/:id/cancel", authenticate, checkRole("seller"), cancelAuction);

// Seller delete their own auction (only allowed for pending/rejected/cancelled/ended-no-bids)
router.delete("/:id/seller", authenticate, checkRole("seller"), deleteSellerAuction);

// ==================== ADMIN ROUTES ====================
router.post("/:id/approve", authenticate, checkRole("admin"), approveAuction);
router.post("/:id/reject", authenticate, checkRole("admin"), rejectAuction);
// Admin hard-delete (any auction)
router.delete("/:id", authenticate, checkRole("admin"), deleteAuction);

// ==================== BUYER ROUTES ====================
router.post("/:auction_id/bid", authenticate, placeBid);

module.exports = router;