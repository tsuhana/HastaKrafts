const db = require("../models");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

// ==================== MULTER CONFIG ====================
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, "../uploads/auctions");
    if (!fs.existsSync(uploadPath)) fs.mkdirSync(uploadPath, { recursive: true });
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueName = `auction-${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedExt = /jpeg|jpg|png|webp/;
    const ok =
      allowedExt.test(path.extname(file.originalname).toLowerCase()) &&
      allowedExt.test(file.mimetype);
    ok ? cb(null, true) : cb(new Error("Only image files allowed (jpeg, jpg, png, webp)"));
  },
}).array("images", 5);

// ==================== HELPER: AUTO UPDATE STATUS ====================
// Only auto-updates approved auctions
const autoUpdateStatus = async (auction) => {
  if (auction.approval_status !== "approved") return;
  // Don't touch cancelled auctions
  if (auction.status === "cancelled") return;

  const now   = new Date();
  const start = new Date(auction.auction_start);
  const end   = new Date(auction.auction_end);

  if (now >= start && now < end && auction.status === "upcoming") {
    await auction.update({ status: "live" });
    auction.status = "live";
  } else if (now >= end && auction.status !== "ended") {
    let winnerId = null;
    if (auction.bids && auction.bids.length > 0) {
      const highest = [...auction.bids].sort(
        (a, b) => parseFloat(b.bid_amount) - parseFloat(a.bid_amount)
      )[0];
      winnerId = highest.user_id;
    } else {
      const bids = await db.Bid.findAll({
        where: { auction_id: auction.auction_id },
        order: [["bid_amount", "DESC"]],
        limit: 1,
      });
      winnerId = bids[0]?.user_id || null;
    }
    await auction.update({ status: "ended", winner_id: winnerId });
    auction.status    = "ended";
    auction.winner_id = winnerId;
  }
};

// ==================== CREATE AUCTION ====================
const createAuction = async (req, res) => {
  upload(req, res, async (err) => {
    if (err)
      return res.status(400).json({ success: false, message: err.message || "File upload error" });

    try {
      const {
        title,
        description,
        starting_bid,
        minimum_increment,
        auction_start,
        auction_end,
        product_id,
      } = req.body;

      const seller = await db.Seller.findOne({ where: { user_id: req.user.user_id } });
      if (!seller)
        return res.status(403).json({ success: false, message: "Only sellers can create auctions" });

      const startDate = new Date(auction_start);
      const endDate   = new Date(auction_end);
      const now       = new Date();

      if (endDate <= startDate)
        return res.status(400).json({ success: false, message: "End date must be after start date" });
      if (endDate <= now)
        return res.status(400).json({ success: false, message: "End date must be in the future" });

      const imagePaths = req.files ? req.files.map((f) => `/uploads/auctions/${f.filename}`) : [];

      const auction = await db.Auction.create({
        seller_id:         seller.seller_id,
        product_id:        product_id || null,
        title,
        description,
        images:            imagePaths,
        starting_bid:      parseFloat(starting_bid),
        current_bid:       0,
        minimum_increment: parseFloat(minimum_increment) || 100,
        auction_start:     startDate,
        auction_end:       endDate,
        status:            "upcoming",
        approval_status:   "pending",
        total_bids:        0,
      });

      return res.status(201).json({
        success: true,
        message: "Auction created! Awaiting admin approval before going live.",
        data: auction,
      });
    } catch (error) {
      console.error("Create auction error:", error);
      return res.status(500).json({ success: false, message: "Failed to create auction" });
    }
  });
};

// ==================== GET ALL AUCTIONS (PUBLIC) ====================
// Public only sees approved auctions
const getAllAuctions = async (req, res) => {
  try {
    const { status, search } = req.query;
    const where = { approval_status: "approved" };

    if (status && status !== "all") where.status = status;
    if (search) {
      where[db.Sequelize.Op.or] = [
        { title:       { [db.Sequelize.Op.iLike]: `%${search}%` } },
        { description: { [db.Sequelize.Op.iLike]: `%${search}%` } },
      ];
    }

    const auctions = await db.Auction.findAll({
      where,
      include: [
        {
          model: db.Seller,
          as: "seller",
          attributes: ["seller_id", "shop_name", "user_id"],
          include: [{ model: db.User, as: "user", attributes: ["full_name"] }],
        },
        { model: db.User, as: "winner", attributes: ["user_id", "full_name"] },
        { model: db.Bid,  as: "bids",   attributes: ["bid_id", "bid_amount", "user_id"] },
      ],
      order: [["created_at", "DESC"]],
    });

    for (const auction of auctions) await autoUpdateStatus(auction);
    return res.status(200).json({ success: true, data: auctions });
  } catch (error) {
    console.error("Get auctions error:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch auctions" });
  }
};

// ==================== GET AUCTION BY ID ====================
const getAuctionById = async (req, res) => {
  try {
    const auction = await db.Auction.findByPk(req.params.id, {
      include: [
        {
          model: db.Seller,
          as: "seller",
          attributes: ["seller_id", "shop_name", "user_id"],
          include: [{ model: db.User, as: "user", attributes: ["full_name", "email"] }],
        },
        { model: db.User, as: "winner", attributes: ["user_id", "full_name"] },
        {
          model: db.Bid,
          as: "bids",
          include: [{ model: db.User, as: "user", attributes: ["user_id", "full_name"] }],
        },
      ],
    });

    if (!auction)
      return res.status(404).json({ success: false, message: "Auction not found" });

    // Block public access to unapproved auctions
    if (auction.approval_status !== "approved") {
      const isAdmin  = req.user?.role === "admin";
      const isSeller = req.user && auction.seller?.user_id === req.user.user_id;
      if (!isAdmin && !isSeller) {
        return res.status(404).json({ success: false, message: "Auction not found" });
      }
    }

    await autoUpdateStatus(auction);
    const auctionData = auction.toJSON();
    auctionData.bids = (auctionData.bids || []).sort(
      (a, b) => parseFloat(b.bid_amount) - parseFloat(a.bid_amount)
    );

    return res.status(200).json({ success: true, data: auctionData });
  } catch (error) {
    console.error("Get auction error:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch auction" });
  }
};

// ==================== GET SELLER AUCTIONS ====================
// Seller sees ALL their auctions (all approval statuses)
const getSellerAuctions = async (req, res) => {
  try {
    const seller = await db.Seller.findOne({ where: { user_id: req.user.user_id } });
    if (!seller)
      return res.status(404).json({ success: false, message: "Seller not found" });

    const auctions = await db.Auction.findAll({
      where: { seller_id: seller.seller_id },
      include: [
        {
          model: db.Bid,
          as: "bids",
          include: [{ model: db.User, as: "user", attributes: ["user_id", "full_name"] }],
        },
        { model: db.User, as: "winner", attributes: ["user_id", "full_name"] },
      ],
      order: [["created_at", "DESC"]],
    });

    for (const auction of auctions) await autoUpdateStatus(auction);
    return res.status(200).json({ success: true, data: auctions });
  } catch (error) {
    console.error("Get seller auctions error:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch auctions" });
  }
};

// ==================== PLACE BID ====================
const placeBid = async (req, res) => {
  try {
    const { auction_id } = req.params;
    const { bid_amount }  = req.body;

    if (req.user.role === "admin")
      return res.status(403).json({ success: false, message: "Admins cannot place bids" });

    const auction = await db.Auction.findByPk(auction_id, {
      include: [{ model: db.Seller, as: "seller" }],
    });
    if (!auction)
      return res.status(404).json({ success: false, message: "Auction not found" });

    if (auction.approval_status !== "approved")
      return res.status(400).json({ success: false, message: "This auction has not been approved yet" });

    await autoUpdateStatus(auction);

    if (auction.status !== "live")
      return res.status(400).json({ success: false, message: "Auction is not active" });
    if (new Date() > new Date(auction.auction_end))
      return res.status(400).json({ success: false, message: "Auction has ended" });
    if (auction.seller?.user_id === req.user.user_id)
      return res.status(403).json({ success: false, message: "You cannot bid on your own auction" });

    const isSeller = await db.Seller.findOne({ where: { user_id: req.user.user_id } });
    if (isSeller)
      return res.status(403).json({ success: false, message: "Sellers cannot place bids" });

    const currentBid = parseFloat(auction.current_bid) || parseFloat(auction.starting_bid);
    const minimumBid = currentBid + (parseFloat(auction.minimum_increment) || 100);
    const bidValue   = parseFloat(bid_amount);

    if (!bidValue || Number.isNaN(bidValue))
      return res.status(400).json({ success: false, message: "Invalid bid amount" });
    if (bidValue < minimumBid)
      return res.status(400).json({
        success: false,
        message: `Minimum bid is Rs. ${minimumBid.toLocaleString()}`,
      });

    await db.Bid.update({ is_highest: false }, { where: { auction_id, is_highest: true } });

    const bid = await db.Bid.create({
      auction_id,
      user_id:    req.user.user_id,
      bid_amount: bidValue,
      is_highest: true,
      bid_time:   new Date(),
    });

    const newTotalBids = auction.total_bids + 1;
    await auction.update({ current_bid: bidValue, total_bids: newTotalBids });

    const bidWithUser = await db.Bid.findByPk(bid.bid_id, {
      include: [{ model: db.User, as: "user", attributes: ["user_id", "full_name"] }],
    });

    try {
      global.io.to(`auction_${auction_id}`).emit("new_bid", {
        auction_id:  parseInt(auction_id, 10),
        bid_id:      bidWithUser.bid_id,
        bid_amount:  parseFloat(bidWithUser.bid_amount),
        user:        bidWithUser.user,
        total_bids:  newTotalBids,
        current_bid: bidValue,
      });
    } catch (e) {
      console.log("Socket emit error (non-critical):", e.message);
    }

    return res.status(201).json({ success: true, message: "Bid placed successfully", data: bidWithUser });
  } catch (error) {
    console.error("Place bid error:", error);
    return res.status(500).json({ success: false, message: "Failed to place bid" });
  }
};

// ==================== GET AUCTION BIDS ====================
const getAuctionBids = async (req, res) => {
  try {
    const bids = await db.Bid.findAll({
      where: { auction_id: req.params.auction_id },
      include: [{ model: db.User, as: "user", attributes: ["user_id", "full_name"] }],
      order: [["bid_amount", "DESC"]],
    });
    return res.status(200).json({ success: true, data: bids });
  } catch (error) {
    console.error("Get bids error:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch bids" });
  }
};

// ==================== APPROVE AUCTION (admin) ====================
const approveAuction = async (req, res) => {
  try {
    const { id } = req.params;
    const auction = await db.Auction.findByPk(id);
    if (!auction)
      return res.status(404).json({ success: false, message: "Auction not found" });

    const now   = new Date();
    const start = new Date(auction.auction_start);
    const end   = new Date(auction.auction_end);

    let lifecycleStatus = "upcoming";
    if (now >= start && now < end) lifecycleStatus = "live";
    else if (now >= end)           lifecycleStatus = "ended";

    await auction.update({ approval_status: "approved", status: lifecycleStatus });
    return res.status(200).json({ success: true, message: "Auction approved successfully", data: auction });
  } catch (error) {
    console.error("Approve auction error:", error);
    return res.status(500).json({ success: false, message: "Failed to approve auction" });
  }
};

// ==================== REJECT AUCTION (admin) ====================
const rejectAuction = async (req, res) => {
  try {
    const { id } = req.params;
    const { rejection_reason } = req.body;
    if (!rejection_reason || !rejection_reason.trim())
      return res.status(400).json({ success: false, message: "Please provide a rejection reason" });

    const auction = await db.Auction.findByPk(id);
    if (!auction)
      return res.status(404).json({ success: false, message: "Auction not found" });

    await auction.update({
      approval_status:  "rejected",
      rejection_reason: rejection_reason.trim(),
      status:           "cancelled",
    });
    return res.status(200).json({ success: true, message: "Auction rejected", data: auction });
  } catch (error) {
    console.error("Reject auction error:", error);
    return res.status(500).json({ success: false, message: "Failed to reject auction" });
  }
};

// ==================== DELETE AUCTION (admin) ====================
const deleteAuction = async (req, res) => {
  try {
    const { id } = req.params;
    const auction = await db.Auction.findByPk(id);
    if (!auction)
      return res.status(404).json({ success: false, message: "Auction not found" });

    await db.Bid.destroy({ where: { auction_id: id } });
    await auction.destroy();

    return res.status(200).json({ success: true, message: "Auction deleted successfully" });
  } catch (error) {
    console.error("Delete auction error:", error);
    return res.status(500).json({ success: false, message: "Failed to delete auction" });
  }
};

// ==================== END AUCTION EARLY (seller) ====================
const endAuctionEarly = async (req, res) => {
  try {
    const { id } = req.params;
    const seller = await db.Seller.findOne({ where: { user_id: req.user.user_id } });
    if (!seller)
      return res.status(403).json({ success: false, message: "Seller not found" });

    const auction = await db.Auction.findByPk(id);
    if (!auction)
      return res.status(404).json({ success: false, message: "Auction not found" });
    if (auction.seller_id !== seller.seller_id)
      return res.status(403).json({ success: false, message: "You can only end your own auctions" });
    if (auction.status !== "live" && auction.status !== "upcoming")
      return res.status(400).json({
        success: false,
        message: "Only live or upcoming auctions can be ended early",
      });

    const highestBid = await db.Bid.findOne({
      where: { auction_id: id },
      order: [["bid_amount", "DESC"]],
    });
    const winnerId = highestBid?.user_id || null;

    await auction.update({ status: "ended", winner_id: winnerId, auction_end: new Date() });
    return res.status(200).json({ success: true, message: "Auction ended early", data: auction });
  } catch (error) {
    console.error("End auction early error:", error);
    return res.status(500).json({ success: false, message: "Failed to end auction" });
  }
};

// ==================== CANCEL AUCTION (seller) ====================
// Seller can cancel their own upcoming or live auction (no bids or with bids)
const cancelAuction = async (req, res) => {
  try {
    const { id } = req.params;
    const seller = await db.Seller.findOne({ where: { user_id: req.user.user_id } });
    if (!seller)
      return res.status(403).json({ success: false, message: "Seller not found" });

    const auction = await db.Auction.findByPk(id);
    if (!auction)
      return res.status(404).json({ success: false, message: "Auction not found" });
    if (auction.seller_id !== seller.seller_id)
      return res.status(403).json({ success: false, message: "You can only cancel your own auctions" });
    if (auction.status === "ended" || auction.status === "cancelled")
      return res.status(400).json({
        success: false,
        message: "Cannot cancel an auction that has already ended or is already cancelled",
      });

    await auction.update({ status: "cancelled" });
    return res.status(200).json({ success: true, message: "Auction cancelled successfully", data: auction });
  } catch (error) {
    console.error("Cancel auction error:", error);
    return res.status(500).json({ success: false, message: "Failed to cancel auction" });
  }
};

// ==================== DELETE AUCTION (seller) ====================
// Seller can delete their own auction ONLY if it's pending, cancelled, or ended with no bids
const deleteSellerAuction = async (req, res) => {
  try {
    const { id } = req.params;
    const seller = await db.Seller.findOne({ where: { user_id: req.user.user_id } });
    if (!seller)
      return res.status(403).json({ success: false, message: "Seller not found" });

    const auction = await db.Auction.findByPk(id, {
      include: [{ model: db.Bid, as: "bids", attributes: ["bid_id"] }],
    });
    if (!auction)
      return res.status(404).json({ success: false, message: "Auction not found" });
    if (auction.seller_id !== seller.seller_id)
      return res.status(403).json({ success: false, message: "You can only delete your own auctions" });

    // Allow delete if: pending approval, rejected, cancelled, or ended with no bids
    const deletableStatuses = ["cancelled"];
    const isDeletable =
      auction.approval_status === "pending" ||
      auction.approval_status === "rejected" ||
      deletableStatuses.includes(auction.status) ||
      (auction.status === "ended" && (auction.bids || []).length === 0);

    if (!isDeletable)
      return res.status(400).json({
        success: false,
        message:
          "You can only delete auctions that are pending approval, rejected, cancelled, or ended with no bids.",
      });

    await db.Bid.destroy({ where: { auction_id: id } });
    await auction.destroy();

    return res.status(200).json({ success: true, message: "Auction deleted successfully" });
  } catch (error) {
    console.error("Delete seller auction error:", error);
    return res.status(500).json({ success: false, message: "Failed to delete auction" });
  }
};

module.exports = {
  createAuction,
  getAllAuctions,
  getAuctionById,
  getSellerAuctions,
  placeBid,
  getAuctionBids,
  approveAuction,
  rejectAuction,
  deleteAuction,
  endAuctionEarly,
  cancelAuction,         
  deleteSellerAuction,   
};