const express = require("express");
const cors = require("cors");
const session = require("express-session");
const passport = require("./config/passport");
require("dotenv").config();

const db = require("./models");
const authRoutes = require("./routes/auth.routes");

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

app.get("/", (req, res) => {
  res.send("HastaKrafts Backend Running");
});

app.use("/api/auth", authRoutes);

const PORT = process.env.PORT || 5000;

db.sequelize
  .authenticate()
  .then(() => {
    console.log("PostgreSQL connected successfully");
    //Updates schema without deleting data
    return db.sequelize.sync({ alter: true }); 
  })
  .then(() => {
    console.log("Database tables synced successfully");
    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error("Database connection error:", err);
  });