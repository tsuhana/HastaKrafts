const express = require("express");
const cors = require("cors");
const session = require("express-session");
const passport = require("./config/passport");
const path = require("path");
require("dotenv").config();

const db = require("./models");
const authRoutes = require("./routes/auth.routes");
const productRoutes = require("./routes/product.routes");
const adminRoutes = require("./routes/admin.routes");
const userRoutes = require("./routes/user.routes");
const cartRoutes = require("./routes/cart.routes"); // ✅ NEW

const app = express();

// MIDDLEWARE
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files for uploaded images
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Session middleware (required for Passport)
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    },
  })
);

// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());

// ROUTES
app.get("/", (req, res) => {
  res.send("HastaKrafts Backend Running");
});

app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/users", userRoutes);
app.use("/api/cart", cartRoutes); // ✅ NEW

const PORT = process.env.PORT || 5000;

db.sequelize
  .authenticate()
  .then(() => {
    console.log("PostgreSQL connected successfully");
    // Updates schema without deleting data
    return db.sequelize.sync({ alter: true });
  })
  .then(async () => {
    console.log("Database tables synced successfully");
    
    // SEEDERS (Run in order)
    
    // 1. Seed categories (only runs once)
    const seedCategories = require('./seeders/categories.seeder');
    await seedCategories();
    
    // 2. Create admin account (only runs once)
    const createAdmin = require('./seeders/admin.seeder');
    await createAdmin();
    
    // 3. Create test seller (ONLY FOR DEVELOPMENT - REMOVE IN PRODUCTION)
    const createTestSeller = require('./seeders/testSeller.seeder');
    await createTestSeller();
    
    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
      console.log(`Uploads available at: http://localhost:${PORT}/uploads`);
    });
  })
  .catch((err) => {
    console.error("Database connection error:", err);
  });