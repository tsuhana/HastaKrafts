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
router.get("/me", authenticate, getCurrentUser);// TEMPORARY: Create admin account (REMOVE IN PRODUCTION!)
router.post('/register/admin', async (req, res) => {
  try {
    const { email, password, full_name, phone } = req.body;

    // Check if admin already exists
    const existingAdmin = await User.findOne({ where: { role: 'admin' } });
    if (existingAdmin) {
      return res.status(400).json({
        success: false,
        message: 'Admin account already exists'
      });
    }

    // Check if email is already registered
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Email already registered'
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create admin user
    const admin = await User.create({
      email,
      password: hashedPassword,
      full_name,
      phone,
      role: 'admin'
    });

    res.status(201).json({
      success: true,
      message: 'Admin account created successfully',
      data: {
        user_id: admin.user_id,
        email: admin.email,
        full_name: admin.full_name,
        role: admin.role
      }
    });

  } catch (error) {
    console.error('Admin registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create admin account',
      error: error.message
    });
  }
});
module.exports = router;