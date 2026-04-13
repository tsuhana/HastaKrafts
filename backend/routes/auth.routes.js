const express = require("express");
const router = express.Router();
const passport = require("../config/passport");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
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

// ── Multer for citizenship image upload during registration ──
const citizenshipUploadDir = path.join(__dirname, "../uploads/sellers/citizenship");
if (!fs.existsSync(citizenshipUploadDir)) fs.mkdirSync(citizenshipUploadDir, { recursive: true });

const citizenshipStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, citizenshipUploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `reg-${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`);
  },
});
const uploadCitizenshipReg = multer({
  storage: citizenshipStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const allowed = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (allowed.includes(file.type || file.mimetype)) cb(null, true);
    else cb(new Error("Only JPG, PNG, WEBP images allowed"));
  },
});

// ==================== REGISTRATION ====================
router.post("/register/buyer", registerBuyerRules, registerBuyer);
router.post(
  "/register/seller",
  uploadCitizenshipReg.single("citizenship_image"),
  registerSellerRules,
  registerSeller
);

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