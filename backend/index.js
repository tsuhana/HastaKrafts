const express = require("express");
const cors = require("cors");
const session = require("express-session");
const passport = require("./config/passport");
const path = require("path");
const http = require("http");
const { Server } = require("socket.io");
require("dotenv").config();

const db = require("./models");
const { sendPushNotification, createNotification } = require("./utils/notification.util");

// ==================== ROUTES IMPORT ====================
const authRoutes         = require("./routes/auth.routes");
const productRoutes      = require("./routes/product.routes");
const adminRoutes        = require("./routes/admin.routes");
const userRoutes         = require("./routes/user.routes");
const sellerRoutes       = require("./routes/seller.routes");
const cartRoutes         = require("./routes/cart.routes");
const orderRoutes        = require("./routes/order.routes");
const auctionRoutes      = require("./routes/auction.routes");
const messageRoutes      = require("./routes/message.routes");
const reviewRoutes       = require("./routes/review.routes");
const wishlistRoutes     = require("./routes/wishlist.routes");
const bannerRoutes       = require("./routes/banner.routes");
const contactRoutes      = require("./routes/contact.routes");
const pointsRoutes       = require("./routes/points.routes");
const storyRoutes        = require("./routes/story.routes");
const notificationRoutes = require("./routes/notification.routes");

// ==================== APP AND SERVER SETUP ====================
const app    = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
  origin: [
  process.env.FRONTEND_URL || "http://localhost:5173",
  "http://localhost:5173",
  "http://localhost:4173",
  "http://localhost:4174",
],
    methods: ["GET", "POST"],
    credentials: true,
  },
});

app.set("io", io);
global.io = io;

// ==================== MIDDLEWARE ====================
app.use(
  cors({
    origin: [
  process.env.FRONTEND_URL || "http://localhost:5173",
  "http://localhost:5173",
  "http://localhost:4173",
  "http://localhost:4174",
  ],
    credentials: true,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      maxAge: 24 * 60 * 60 * 1000,
    },
  })
);

app.use(passport.initialize());
app.use(passport.session());

// ==================== ROUTES ====================
app.get("/", (req, res) => res.send("HastaKrafts Backend Running"));

app.use("/api/auth",          authRoutes);
app.use("/api/products",      productRoutes);
app.use("/api/admin",         adminRoutes);
app.use("/api/users",         userRoutes);
app.use("/api/sellers",       sellerRoutes);
app.use("/api/cart",          cartRoutes);
app.use("/api/orders",        orderRoutes);
app.use("/api/auctions",      auctionRoutes);
app.use("/api/messages",      messageRoutes);
app.use("/api/reviews",       reviewRoutes);
app.use("/api/wishlist",      wishlistRoutes);
app.use("/api/banners",       bannerRoutes);
app.use("/api/contact",       contactRoutes);
app.use("/api/points",        pointsRoutes);
app.use("/api/stories",       storyRoutes);
app.use("/api/notifications", notificationRoutes);

// ==================== SOCKET.IO ====================
const onlineUsers = new Map();

io.on("connection", (socket) => {
  console.log("Socket connected:", socket.id);

  socket.on("join_user", (userId) => {
    if (!userId) return;
    socket.userId = userId;
    socket.join(`user_${userId}`);
    if (!onlineUsers.has(userId)) {
      onlineUsers.set(userId, new Set());
      socket.broadcast.emit("user_online", userId);
    }
    onlineUsers.get(userId).add(socket.id);
    socket.emit("online_users", Array.from(onlineUsers.keys()));
  });

  socket.on("messages_read", ({ reader_id, partner_id }) => {
    if (!reader_id || !partner_id) return;
    io.to(`user_${partner_id}`).emit("message_read", { reader_id });
  });

  socket.on("join_auction", (auctionId) => {
    socket.join(`auction_${auctionId}`);
  });

  socket.on("leave_auction", (auctionId) => {
    socket.leave(`auction_${auctionId}`);
  });

  socket.on("disconnect", () => {
    const userId = socket.userId;
    if (userId && onlineUsers.has(userId)) {
      const sockets = onlineUsers.get(userId);
      sockets.delete(socket.id);
      if (sockets.size === 0) {
        onlineUsers.delete(userId);
        socket.broadcast.emit("user_offline", userId);
      }
    }
    console.log("Socket disconnected:", socket.id);
  });
});

// ==================== AUTO END AUCTIONS (every 30 seconds) ====================
const autoEndAuctions = async () => {
  try {
    const now = new Date();

    const endedAuctions = await db.Auction.findAll({
      where: {
        status: "live",
        auction_end: { [db.Sequelize.Op.lte]: now },
      },
      include: [
        {
          model: db.Bid,
          as: "bids",
          include: [
            {
              model: db.User,
              as: "user",
              attributes: ["user_id", "full_name", "webpushr_sid"],
            },
          ],
        },
        {
          model: db.Seller,
          as: "seller",
          include: [
            {
              model: db.User,
              as: "user",
              attributes: ["user_id", "webpushr_sid"],
            },
          ],
        },
      ],
    });

    for (const auction of endedAuctions) {
      const highestBid = [...(auction.bids || [])]
        .sort((a, b) => parseFloat(b.bid_amount) - parseFloat(a.bid_amount))[0];

      await auction.update({
        status: "ended",
        winner_id: highestBid?.user_id || null,
      });

      // Socket emit — unchanged
      io.to(`auction_${auction.auction_id}`).emit("auction_ended", {
        auction_id: auction.auction_id,
        winner: highestBid || null,
      });

      // ✅ Push + in-app to winner
      if (highestBid?.user) {
        if (highestBid.user.webpushr_sid) {
          sendPushNotification(
            highestBid.user.webpushr_sid,
            "🎉 You won the auction!",
            `You won "${auction.title}" with Rs. ${parseFloat(highestBid.bid_amount).toLocaleString()}!`,
            `${process.env.FRONTEND_URL || "http://localhost:5173"}/auctions/${auction.auction_id}`
          ).catch(() => {});
        }
        createNotification(
          highestBid.user.user_id,
          "auction_won",
          "🎉 You Won the Auction!",
          `Congratulations! You won "${auction.title}" with Rs. ${parseFloat(highestBid.bid_amount).toLocaleString()}. Proceed to checkout!`,
          `/auctions/${auction.auction_id}`,
          { auction_id: auction.auction_id }
        ).catch(() => {});
      }

      // ✅ Push + in-app to seller
      if (auction.seller?.user) {
        const winnerName = highestBid?.user?.full_name || "No bidder";
        const winAmount  = highestBid
          ? `Rs. ${parseFloat(highestBid.bid_amount).toLocaleString()}`
          : "No bids";

        if (auction.seller.user.webpushr_sid) {
          sendPushNotification(
            auction.seller.user.webpushr_sid,
            "🔔 Your auction has ended!",
            `"${auction.title}" ended. Winner: ${winnerName} — ${winAmount}.`,
            `${process.env.FRONTEND_URL || "http://localhost:5173"}/seller/dashboard`
          ).catch(() => {});
        }
        createNotification(
          auction.seller.user.user_id,
          "auction_ended",
          "🔔 Auction Ended",
          `"${auction.title}" ended. ${
            highestBid
              ? `Winner: ${winnerName} — ${winAmount}. Prepare shipment!`
              : "No bids were placed."
          }`,
          "/seller/dashboard",
          { auction_id: auction.auction_id }
        ).catch(() => {});
      }

      // ✅ In-app to all losing bidders
      const losingBidders = (auction.bids || []).filter(
        (b) => b.user_id !== highestBid?.user_id
      );
      const uniqueLosers = [
        ...new Map(losingBidders.map((b) => [b.user_id, b])).values(),
      ];

      for (const loser of uniqueLosers) {
        if (loser.user?.user_id) {
          createNotification(
            loser.user.user_id,
            "auction_lost",
            "😔 Auction Ended",
            `The auction for "${auction.title}" has ended. You didn't win this time, but similar items are available!`,
            "/auctions",
            { auction_id: auction.auction_id }
          ).catch(() => {});
        }
      }
    }

    // Upcoming → live promotion
    await db.Auction.update(
      { status: "live" },
      {
        where: {
          status: "upcoming",
          auction_start: { [db.Sequelize.Op.lte]: now },
          auction_end:   { [db.Sequelize.Op.gt]:  now },
        },
      }
    );
  } catch (error) {
    console.error("Auto-end auction error:", error.message);
  }
};

// ==================== STARTUP WINNER RECOVERY ====================
const recoverMissedWinners = async () => {
  try {
    const missedAuctions = await db.Auction.findAll({
      where: {
        status: "ended",
        winner_id: null,
      },
      include: [{ model: db.Bid, as: "bids" }],
    });

    if (missedAuctions.length === 0) return;

    for (const auction of missedAuctions) {
      if (!auction.bids?.length) continue;

      const highest = [...auction.bids]
        .sort((a, b) => parseFloat(b.bid_amount) - parseFloat(a.bid_amount))[0];

      await auction.update({ winner_id: highest.user_id });
      console.log(
        `✅ Winner recovered — Auction #${auction.auction_id}: user_id ${highest.user_id} (Rs. ${highest.bid_amount})`
      );
    }

    console.log(`✅ Recovered winners for ${missedAuctions.length} auction(s)`);
  } catch (err) {
    console.error("Startup winner recovery error:", err.message);
  }
};

// ==================== STARTUP: END MISSED AUCTIONS ====================
const recoverMissedEndedAuctions = async () => {
  try {
    const now = new Date();

    const shouldBeEnded = await db.Auction.findAll({
      where: {
        status: "live",
        auction_end: { [db.Sequelize.Op.lte]: now },
      },
      include: [{ model: db.Bid, as: "bids" }],
    });

    for (const auction of shouldBeEnded) {
      const highest = [...(auction.bids || [])]
        .sort((a, b) => parseFloat(b.bid_amount) - parseFloat(a.bid_amount))[0];

      await auction.update({
        status: "ended",
        winner_id: highest?.user_id || null,
      });

      console.log(
        `✅ Ended missed auction #${auction.auction_id}, winner: user_id ${highest?.user_id || "none"}`
      );
    }

    if (shouldBeEnded.length > 0) {
      console.log(`✅ Ended ${shouldBeEnded.length} auction(s) that were missed`);
    }
  } catch (err) {
    console.error("Startup auction recovery error:", err.message);
  }
};

// ==================== SERVER START ====================
const PORT = process.env.PORT || 5000;

db.sequelize
  .authenticate()
  .then(() => {
    console.log("PostgreSQL connected successfully");
    return db.sequelize.sync({ alter: true });
  })
  .then(async () => {
    console.log("Database synced successfully");

    const seedCategories = require("./seeders/categories.seeder");
    await seedCategories();

    setInterval(autoEndAuctions, 30000);
    console.log("Auction auto-end service started");

    server.listen(PORT, async () => {
      console.log(`Server running on http://localhost:${PORT}`);

      await recoverMissedEndedAuctions();
      await recoverMissedWinners();
    });
  })
  .catch((err) => {
    console.error("Database connection error:", err);
  });