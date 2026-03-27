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
const {
  registerBuyerRules,
  registerSellerRules,
  loginRules,
  forgotPasswordRules,
  verifyOTPRules,
  resetPasswordRules,
} = require("../validations/auth.validation");

// ==================== REGISTRATION ====================
router.post("/register/buyer",  registerBuyerRules,  registerBuyer);
router.post("/register/seller", registerSellerRules, registerSeller);

// ==================== LOGIN ====================
router.post("/login", loginRules, login);

// ==================== PASSWORD RESET ====================
router.post("/forgot-password", forgotPasswordRules, requestPasswordReset);
router.post("/verify-otp",      verifyOTPRules,      verifyOTP);
router.post("/reset-password",  resetPasswordRules,  resetPassword);

// ==================== GOOGLE OAUTH ====================
router.get("/google", passport.authenticate("google", { scope: ["profile", "email"] }));
router.get(
  "/google/callback",
  passport.authenticate("google", { failureRedirect: "/api/auth/google/failure" }),
  googleAuthSuccess
);
router.get("/google/failure", googleAuthFailure);

// ==================== PROTECTED ====================
router.get("/me", authenticate, getCurrentUser);

module.exports = router;