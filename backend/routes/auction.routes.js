const express = require("express");
const router = express.Router();

const {
  createAuction,
  getAllAuctions,
  getAuctionById,
  getSellerAuctions,
  placeBid,
  getAuctionBids,
} = require("../controllers/auction.controller");

const { authenticate } = require("../middlewares/auth.middleware");
const { checkRole, checkSellerApproval } = require("../middlewares/roleCheck.middleware");

// ==================== PUBLIC ROUTES ====================
router.get("/", getAllAuctions);
router.get("/:id", getAuctionById);
router.get("/:auction_id/bids", getAuctionBids);

// ==================== SELLER ROUTES ====================
router.post(
  "/create",
  authenticate,
  checkRole("seller"),
  checkSellerApproval,
  createAuction
);

router.get(
  "/seller/my-auctions",
  authenticate,
  checkRole("seller"),
  checkSellerApproval,
  getSellerAuctions
);

// ==================== BUYER ROUTES ====================
router.post(
  "/:auction_id/bid",
  authenticate,
  checkRole("buyer"),
  placeBid
);

module.exports = router;
