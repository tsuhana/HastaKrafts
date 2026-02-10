const express = require("express");
const router = express.Router();
const passport = require("../config/passport");
const {
  registerBuyer,
  registerSeller,
  login,
  requestPasswordReset,
  verifyOTP,
  resetPassword,
  googleAuthSuccess,
  googleAuthFailure,
  getCurrentUser,
} = require("../controllers/auth.controller");
const { authenticate } = require("../middlewares/auth.middleware");

// ==================== BUYER & SELLER REGISTRATION ====================
router.post("/register/buyer", registerBuyer);
router.post("/register/seller", registerSeller);

// ==================== LOGIN ====================
router.post("/login", login);

// ==================== PASSWORD RESET ====================
router.post("/forgot-password", requestPasswordReset);
router.post("/verify-otp", verifyOTP);
router.post("/reset-password", resetPassword);

// ==================== GOOGLE OAUTH ====================
router.get("/google", passport.authenticate("google", { scope: ["profile", "email"] }));
router.get(
  "/google/callback",
  passport.authenticate("google", { failureRedirect: "/api/auth/google/failure" }),
  googleAuthSuccess
);
router.get("/google/failure", googleAuthFailure);

// ==================== PROTECTED ROUTES ====================
router.get("/me", authenticate, getCurrentUser);

module.exports = router;