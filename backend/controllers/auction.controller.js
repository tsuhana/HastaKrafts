const db = require("../models");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

// ==================== MULTER CONFIG (Auction Images) ====================
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, "../uploads/auctions");

    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }

    cb(null, uploadPath);
  },

  filename: (req, file, cb) => {
    const uniqueName = `auction-${Date.now()}-${Math.round(
      Math.random() * 1e9
    )}${path.extname(file.originalname)}`;

    cb(null, uniqueName);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const allowedExt = /jpeg|jpg|png|webp/;
    const extnameOk = allowedExt.test(
      path.extname(file.originalname).toLowerCase()
    );
    const mimetypeOk = allowedExt.test(file.mimetype);

    if (extnameOk && mimetypeOk) {
      cb(null, true);
    } else {
      cb(new Error("Only image files allowed (jpeg, jpg, png, webp)"));
    }
  }
}).array("images", 5);

// ==================== HELPER: AUTO UPDATE STATUS ====================
const autoUpdateStatus = async (auction) => {
  const now = new Date();
  const start = new Date(auction.auction_start);
  const end = new Date(auction.auction_end);

  if (now >= start && now < end && auction.status === "upcoming") {
    await auction.update({ status: "live" });
    auction.status = "live";
  } else if (
    now >= end &&
    auction.status !== "ended" &&
    auction.status !== "cancelled"
  ) {
    await auction.update({ status: "ended" });
    auction.status = "ended";
  }
};

// ==================== CREATE AUCTION ====================
const createAuction = async (req, res) => {
  upload(req, res, async (err) => {
    if (err) {
      return res.status(400).json({
        success: false,
        message: err.message || "File upload error"
      });
    }

    try {
      const {
        title,
        description,
        starting_bid,
        minimum_increment,
        auction_start,
        auction_end,
        product_id
      } = req.body;

      const seller = await db.Seller.findOne({
        where: { user_id: req.user.user_id }
      });

      if (!seller) {
        return res.status(403).json({
          success: false,
          message: "Only sellers can create auctions"
        });
      }

      const startDate = new Date(auction_start);
      const endDate = new Date(auction_end);
      const now = new Date();

      if (endDate <= startDate) {
        return res.status(400).json({
          success: false,
          message: "End date must be after start date"
        });
      }

      if (endDate <= now) {
        return res.status(400).json({
          success: false,
          message: "End date must be in the future"
        });
      }

      const imagePaths = req.files
        ? req.files.map((file) => `/uploads/auctions/${file.filename}`)
        : [];

      const status = startDate <= now && endDate > now ? "live" : "upcoming";

      const auction = await db.Auction.create({
        seller_id: seller.seller_id,
        product_id: product_id || null,
        title,
        description,
        images: imagePaths,
        starting_bid: parseFloat(starting_bid),
        current_bid: 0,
        minimum_increment: parseFloat(minimum_increment) || 100,
        auction_start: startDate,
        auction_end: endDate,
        status,
        total_bids: 0
      });

      return res.status(201).json({
        success: true,
        message: "Auction created successfully",
        data: auction
      });
    } catch (error) {
      console.error("Create auction error:", error);

      return res.status(500).json({
        success: false,
        message: "Failed to create auction"
      });
    }
  });
};

// ==================== GET ALL AUCTIONS ====================
const getAllAuctions = async (req, res) => {
  try {
    const { status, search } = req.query;

    const where = {};

    if (status && status !== "all") {
      where.status = status;
    }

    if (search) {
      where[db.Sequelize.Op.or] = [
        { title: { [db.Sequelize.Op.iLike]: `%${search}%` } },
        { description: { [db.Sequelize.Op.iLike]: `%${search}%` } }
      ];
    }

    const auctions = await db.Auction.findAll({
      where,
      include: [
        {
          model: db.Seller,
          as: "seller",
          attributes: ["seller_id", "shop_name", "user_id"],
          include: [
            {
              model: db.User,
              as: "user",
              attributes: ["full_name"]
            }
          ]
        },
        {
          model: db.User,
          as: "winner",
          attributes: ["user_id", "full_name"]
        },
        {
          model: db.Bid,
          as: "bids",
          attributes: ["bid_id", "bid_amount"]
        }
      ],
      order: [["created_at", "DESC"]]
    });

    // Auto-update statuses
    for (const auction of auctions) {
      await autoUpdateStatus(auction);
    }

    return res.status(200).json({
      success: true,
      data: auctions
    });
  } catch (error) {
    console.error("Get auctions error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch auctions"
    });
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
          include: [
            {
              model: db.User,
              as: "user",
              attributes: ["full_name", "email"]
            }
          ]
        },
        {
          model: db.User,
          as: "winner",
          attributes: ["user_id", "full_name"]
        },
        {
          model: db.Bid,
          as: "bids",
          include: [
            {
              model: db.User,
              as: "user",
              attributes: ["user_id", "full_name"]
            }
          ],
          order: [["bid_amount", "DESC"]]
        }
      ]
    });

    if (!auction) {
      return res.status(404).json({
        success: false,
        message: "Auction not found"
      });
    }

    await autoUpdateStatus(auction);

    return res.status(200).json({
      success: true,
      data: auction
    });
  } catch (error) {
    console.error("Get auction error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch auction"
    });
  }
};

// ==================== GET SELLER AUCTIONS ====================
const getSellerAuctions = async (req, res) => {
  try {
    const seller = await db.Seller.findOne({
      where: { user_id: req.user.user_id }
    });

    if (!seller) {
      return res.status(404).json({
        success: false,
        message: "Seller not found"
      });
    }

    const auctions = await db.Auction.findAll({
      where: { seller_id: seller.seller_id },
      include: [
        {
          model: db.Bid,
          as: "bids",
          include: [
            {
              model: db.User,
              as: "user",
              attributes: ["user_id", "full_name"]
            }
          ]
        },
        {
          model: db.User,
          as: "winner",
          attributes: ["user_id", "full_name"]
        }
      ],
      order: [["created_at", "DESC"]]
    });

    // Auto-update statuses
    for (const auction of auctions) {
      await autoUpdateStatus(auction);
    }

    return res.status(200).json({
      success: true,
      data: auctions
    });
  } catch (error) {
    console.error("Get seller auctions error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch auctions"
    });
  }
};

// ==================== PLACE BID ====================
const placeBid = async (req, res) => {
  try {
    const { auction_id } = req.params;
    const { bid_amount } = req.body;

    // Check if user is admin
    if (req.user.role === "admin") {
      return res.status(403).json({
        success: false,
        message: "Admins cannot place bids"
      });
    }

    const auction = await db.Auction.findByPk(auction_id, {
      include: [{ model: db.Seller, as: "seller" }]
    });

    if (!auction) {
      return res.status(404).json({
        success: false,
        message: "Auction not found"
      });
    }

    await autoUpdateStatus(auction);

    if (auction.status !== "live") {
      return res.status(400).json({
        success: false,
        message: "Auction is not active"
      });
    }

    if (new Date() > new Date(auction.auction_end)) {
      return res.status(400).json({
        success: false,
        message: "Auction has ended"
      });
    }

    // Prevent seller from bidding on their own auction
    if (auction.seller?.user_id === req.user.user_id) {
      return res.status(403).json({
        success: false,
        message: "You cannot bid on your own auction"
      });
    }

    // Prevent ANY seller from bidding
    const isSeller = await db.Seller.findOne({
      where: { user_id: req.user.user_id }
    });

    if (isSeller) {
      return res.status(403).json({
        success: false,
        message: "Sellers cannot place bids"
      });
    }

    const currentBid =
      parseFloat(auction.current_bid) || parseFloat(auction.starting_bid);

    const minimumIncrement = parseFloat(auction.minimum_increment) || 100;
    const minimumBid = currentBid + minimumIncrement;

    const bidValue = parseFloat(bid_amount);

    if (!bidValue || Number.isNaN(bidValue)) {
      return res.status(400).json({
        success: false,
        message: "Invalid bid amount"
      });
    }

    if (bidValue < minimumBid) {
      return res.status(400).json({
        success: false,
        message: `Minimum bid is Rs. ${minimumBid.toLocaleString()}`
      });
    }

    // Unmark previous highest bid
    await db.Bid.update(
      { is_highest: false },
      { where: { auction_id, is_highest: true } }
    );

    // Create new highest bid
    const bid = await db.Bid.create({
      auction_id,
      user_id: req.user.user_id,
      bid_amount: bidValue,
      is_highest: true,
      bid_time: new Date()
    });

    // Update auction current bid + total bids
    await auction.update({
      current_bid: bidValue,
      total_bids: auction.total_bids + 1
    });

    const bidWithUser = await db.Bid.findByPk(bid.bid_id, {
      include: [
        {
          model: db.User,
          as: "user",
          attributes: ["user_id", "full_name"]
        }
      ]
    });

    // REAL-TIME: emit to all viewers of this auction
    try {
      global.io.to(`auction_${auction_id}`).emit("new_bid", {
        auction_id: parseInt(auction_id, 10),
        bid_id: bidWithUser.bid_id,
        bid_amount: parseFloat(bidWithUser.bid_amount),
        user: bidWithUser.user,
        total_bids: auction.total_bids + 1,
        current_bid: bidValue
      });
    } catch (e) {
      console.log("Socket emit error (non-critical):", e.message);
    }

    return res.status(201).json({
      success: true,
      message: "Bid placed successfully",
      data: bidWithUser
    });
  } catch (error) {
    console.error("Place bid error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to place bid"
    });
  }
};

// ==================== GET AUCTION BIDS ====================
const getAuctionBids = async (req, res) => {
  try {
    const bids = await db.Bid.findAll({
      where: { auction_id: req.params.auction_id },
      include: [
        {
          model: db.User,
          as: "user",
          attributes: ["user_id", "full_name"]
        }
      ],
      order: [["bid_amount", "DESC"]]
    });

    return res.status(200).json({
      success: true,
      data: bids
    });
  } catch (error) {
    console.error("Get bids error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch bids"
    });
  }
};

module.exports = {
  createAuction,
  getAllAuctions,
  getAuctionById,
  getSellerAuctions,
  placeBid,
  getAuctionBids
};