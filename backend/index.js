const express = require("express");
const cors = require("cors");
const session = require("express-session");
const passport = require("./config/passport");
const path = require("path");
const http = require("http");
const { Server } = require("socket.io");
require("dotenv").config();

const db = require("./models");
const authRoutes = require("./routes/auth.routes");
const productRoutes = require("./routes/product.routes");
const adminRoutes = require("./routes/admin.routes");
const userRoutes = require("./routes/user.routes");
const cartRoutes = require("./routes/cart.routes");
const orderRoutes = require("./routes/order.routes");
const auctionRoutes = require("./routes/auction.routes");
const messageRoutes = require("./routes/message.routes");
const reviewRoutes = require("./routes/review.routes");
const wishlistRoutes = require("./routes/wishlist.routes");
const bannerRoutes = require("./routes/banner.routes");
const contactRoutes = require("./routes/contact.routes");
const pointsRoutes = require("./routes/points.routes");
const storyRoutes = require("./routes/story.routes");

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    methods: ["GET", "POST"],
    credentials: true
  }
});

app.set('io', io);
global.io = io;

app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:5173",
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === "production",
    maxAge: 24 * 60 * 60 * 1000,
  },
}));
app.use(passport.initialize());
app.use(passport.session());

app.get("/", (req, res) => res.send("HastaKrafts Backend Running"));
app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/users", userRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/auctions", auctionRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/wishlist", wishlistRoutes);
app.use('/api/banners', bannerRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/points', pointsRoutes);
app.use('/api/stories', storyRoutes);
// ══════════════════════════════════════════════════════════════
// SOCKET.IO — Online tracking + messaging + auctions
// onlineUsers: Map<userId, Set<socketId>>
// Using Set per user so multiple browser tabs work correctly
// ══════════════════════════════════════════════════════════════
const onlineUsers = new Map();

io.on('connection', (socket) => {
  console.log('Socket connected:', socket.id);

  // ── User comes online ─────────────────────────────────────
  socket.on('join_user', (userId) => {
    if (!userId) return;

    socket.userId = userId; // store for cleanup on disconnect
    socket.join(`user_${userId}`);

    // First tab for this user → broadcast they came online
    if (!onlineUsers.has(userId)) {
      onlineUsers.set(userId, new Set());
      socket.broadcast.emit('user_online', userId);
    }
    onlineUsers.get(userId).add(socket.id);

    // Send this socket the full list of currently online user IDs
    socket.emit('online_users', Array.from(onlineUsers.keys()));

    console.log(`User ${userId} online. Total online: ${onlineUsers.size}`);
  });

  // ── Messages read — notify the sender ────────────────────
  socket.on('messages_read', ({ reader_id, partner_id }) => {
    if (!reader_id || !partner_id) return;
    // Tell the partner (sender) their messages were read
    io.to(`user_${partner_id}`).emit('message_read', { reader_id });
  });

  // ── Auction rooms
  socket.on('join_auction', (auctionId) => {
    socket.join(`auction_${auctionId}`);
  });

  socket.on('leave_auction', (auctionId) => {
    socket.leave(`auction_${auctionId}`);
  });

  // ── Disconnect 
  socket.on('disconnect', () => {
    const userId = socket.userId;

    if (userId && onlineUsers.has(userId)) {
      const sockets = onlineUsers.get(userId);
      sockets.delete(socket.id);

      // Only mark offline when ALL tabs/windows close
      if (sockets.size === 0) {
        onlineUsers.delete(userId);
        socket.broadcast.emit('user_offline', userId);
        console.log(`User ${userId} offline. Total online: ${onlineUsers.size}`);
      }
    }

    console.log('Socket disconnected:', socket.id);
  });
});

// AUTO END AUCTIONS — runs every 30 seconds

const autoEndAuctions = async () => {
  try {
    const now = new Date();

    const endedAuctions = await db.Auction.findAll({
      where: {
        status: 'live',
        auction_end: { [db.Sequelize.Op.lte]: now }
      },
      include: [
        {
          model: db.Bid,
          as: 'bids',
          include: [{ model: db.User, as: 'user', attributes: ['user_id', 'full_name'] }]
        },
        {
          model: db.Seller,
          as: 'seller',
          include: [{ model: db.User, as: 'user', attributes: ['user_id', 'full_name'] }]
        }
      ]
    });

    for (const auction of endedAuctions) {
      const highestBid = [...(auction.bids || [])]
        .sort((a, b) => parseFloat(b.bid_amount) - parseFloat(a.bid_amount))[0];

      await auction.update({
        status: 'ended',
        winner_id: highestBid?.user_id || null
      });

      io.to(`auction_${auction.auction_id}`).emit('auction_ended', {
        auction_id: auction.auction_id,
        winner: highestBid
          ? {
              user_id: highestBid.user_id,
              full_name: highestBid.user.full_name,
              bid_amount: highestBid.bid_amount
            }
          : null
      });

      // Send winner a congratulations message from the seller
      if (highestBid && auction.seller) {
        try {
          await db.Message.create({
            sender_id: auction.seller.user_id,
            receiver_id: highestBid.user_id,
            auction_id: auction.auction_id,
            message_text: `Congratulations! You won the auction for "${auction.title}" with a bid of Rs. ${parseFloat(highestBid.bid_amount).toLocaleString()}. Please contact us to arrange payment and delivery.`,
            is_read: false
          });

          io.to(`user_${highestBid.user_id}`).emit('auction_won', {
            auction_id: auction.auction_id,
            auction_title: auction.title,
            bid_amount: highestBid.bid_amount,
            message: 'You won the auction! Check your messages.'
          });
        } catch (e) {
          console.error('Winner message error:', e.message);
        }
      }
    }

    // Activate upcoming auctions whose start time has passed
    await db.Auction.update(
      { status: 'live' },
      {
        where: {
          status: 'upcoming',
          auction_start: { [db.Sequelize.Op.lte]: now },
          auction_end: { [db.Sequelize.Op.gt]: now }
        }
      }
    );

    if (endedAuctions.length > 0) {
      console.log(`Auto-ended ${endedAuctions.length} auction(s)`);
    }
  } catch (error) {
    console.error('Auto-end auction error:', error.message);
  }
};

module.exports = { io };

// START SERVER
const PORT = process.env.PORT || 5000;

db.sequelize.authenticate()
  .then(() => {
    console.log("PostgreSQL connected successfully");
    return db.sequelize.sync({ alter: true });
  })
  .then(async () => {
    console.log("Database tables synced successfully");

    const seedCategories = require('./seeders/categories.seeder');
    await seedCategories();

    const createAdmin = require('./seeders/admin.seeder');
    await createAdmin();

    const createTestSeller = require('./seeders/testSeller.seeder');
    await createTestSeller();

    setInterval(autoEndAuctions, 30000);
    console.log('Auction auto-end service started (every 30 seconds)');

    server.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
      console.log(`Uploads: http://localhost:${PORT}/uploads`);
    });
  })
  .catch((err) => {
    console.error("Database connection error:", err);
  });