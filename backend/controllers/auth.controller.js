const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const db = require("../models");
const { sendOTPEmail, sendWelcomeEmail } = require("../utils/email");
const { createNotification } = require("../utils/notification.util");

// ==================== REGISTER BUYER ====================
const registerBuyer = async (req, res) => {
  try {
    const { full_name, email, password, phone } = req.body;

    if (!full_name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Please provide all required fields",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters",
      });
    }

    const existingUser = await db.User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "Email already registered",
      });
    }

    const newUser = await db.User.create({
      full_name,
      email,
      password,
      phone: phone || null,
      role: "buyer",
    });

    sendWelcomeEmail(newUser.email, newUser.full_name).catch(() => {});

    const token = jwt.sign(
      { user_id: newUser.user_id, email: newUser.email, role: newUser.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    return res.status(201).json({
      success: true,
      message: "Buyer registered successfully",
      data: {
        user: {
          user_id: newUser.user_id,
          full_name: newUser.full_name,
          email: newUser.email,
          role: newUser.role,
          phone: newUser.phone,
        },
        token,
      },
    });
  } catch (error) {
    console.error("Register buyer error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Registration failed",
    });
  }
};

// ==================== REGISTER SELLER ====================
const registerSeller = async (req, res) => {
  try {
    const {
      full_name,
      email,
      password,
      phone,
      shop_name,
      shop_description,
      address,
      city,
      citizenship_number,
      bank_name,
      bank_account_number,
      bank_account_name,
    } = req.body;

    const citizenshipImagePath = req.file
    ? `/uploads/sellers/citizenship/${req.file.filename}`
    : null;

    if (
      !full_name ||
      !email ||
      !password ||
      !phone ||
      !shop_name ||
      !address ||
      !city ||
      !citizenship_number
    ) {
      return res.status(400).json({
        success: false,
        message: "Please provide all required fields",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters",
      });
    }

    const existingUser = await db.User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "Email already registered",
      });
    }

    const existingShop = await db.Seller.findOne({ where: { shop_name } });
    if (existingShop) {
      return res.status(400).json({
        success: false,
        message: "Shop name already taken",
      });
    }

    const existingCitizenship = await db.Seller.findOne({ where: { citizenship_number } });
    if (existingCitizenship) {
      return res.status(400).json({
        success: false,
        message: "Citizenship number already registered",
      });
    }

    const result = await db.sequelize.transaction(async (t) => {
      const user = await db.User.create(
        {
          full_name,
          email,
          password,
          phone,
          role: "seller",
        },
        { transaction: t }
      );

      const seller = await db.Seller.create(
        {
          user_id: user.user_id,
          shop_name,
          shop_description,
          address,
          city,
          citizenship_number,
          citizenship_image: citizenshipImagePath,
          bank_name,
          bank_account_number,
          bank_account_name,
          approval_status: "pending",
        },
        { transaction: t }
      );

      return { user, seller };
    });

    //  Notify all admins of new seller application
    try {
      const admins = await db.User.findAll({ where: { role: "admin" } });
      for (const admin of admins) {
        createNotification(
          admin.user_id,
          "new_seller_application",
          "🏪 New Seller Application",
          `"${shop_name}" from ${city} submitted a seller application. Review citizenship and bank docs.`,
          "/admin/dashboard",
          { seller_id: result.seller.seller_id }
        ).catch(() => {});
      }
    } catch (_) {}

    return res.status(201).json({
      success: true,
      message: "Seller registration successful. Your account is pending admin approval.",
      data: {
        user: {
          user_id: result.user.user_id,
          full_name: result.user.full_name,
          email: result.user.email,
          role: result.user.role,
        },
        seller: {
          seller_id: result.seller.seller_id,
          shop_name: result.seller.shop_name,
          approval_status: result.seller.approval_status,
        },
      },
    });
  } catch (error) {
    console.error("Register seller error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Seller registration failed",
    });
  }
};

// ==================== LOGIN ====================
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Please provide email and password",
      });
    }

    const user = await db.User.findOne({
      where: { email },
      include: [
        {
          model: db.Seller,
          as: "sellerProfile",
          required: false,
        },
      ],
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    if (!user.is_active) {
      return res.status(401).json({
        success: false,
        message: "Your account has been deactivated",
      });
    }

    if (!user.password) {
      return res.status(401).json({
        success: false,
        message: "Please login with Google",
      });
    }

    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    if (user.role === "seller" && user.sellerProfile) {
      if (user.sellerProfile.approval_status === "pending") {
        return res.status(403).json({
          success: false,
          message: "Your seller account is pending admin approval. Please wait for approval.",
        });
      }

      if (user.sellerProfile.approval_status === "rejected") {
        return res.status(403).json({
          success: false,
          message: `Your seller account was rejected. Reason: ${
            user.sellerProfile.rejection_reason || "Not specified"
          }`,
        });
      }
    }

    const token = jwt.sign(
      { user_id: user.user_id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    const responseData = {
      user: {
        user_id: user.user_id,
        full_name: user.full_name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        profile_image: user.profile_image,
        // Include preferred_language so frontend can set i18n on login
        preferred_language: user.preferred_language || "en",
      },
      token,
    };

    if (user.role === "seller" && user.sellerProfile) {
      responseData.seller = {
        seller_id: user.sellerProfile.seller_id,
        shop_name: user.sellerProfile.shop_name,
        shop_description: user.sellerProfile.shop_description,
        approval_status: user.sellerProfile.approval_status,
      };
    }

    return res.status(200).json({
      success: true,
      message: "Login successful",
      data: responseData,
    });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({
      success: false,
      message: "Login failed",
    });
  }
};

// ==================== REQUEST PASSWORD RESET (OTP) ====================
const requestPasswordReset = async (req, res) => {
  try {
    const { email } = req.body;
    console.log("[FORGOT PASSWORD] Request received for email:", email);

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Please provide email",
      });
    }

    const user = await db.User.findOne({ where: { email } });

    if (!user) {
      console.log("[FORGOT PASSWORD] User not found for email:", email);
      return res.status(200).json({
        success: true,
        emailExists: false, // ← ADDED
        message: "If that email exists, an OTP has been sent",
      });
    }

    if (!user.password) {
      console.log("[FORGOT PASSWORD] Google OAuth user attempted reset:", email);
      return res.status(400).json({
        success: false,
        message: "This account uses Google login. Please login with Google.",
      });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    console.log("[FORGOT PASSWORD] Generated OTP:", otp, "for user:", user.user_id);

    await db.PasswordReset.destroy({
      where: {
        user_id: user.user_id,
        used: false,
      },
    });
    console.log("[FORGOT PASSWORD] Deleted old unused OTPs");

    const resetRecord = await db.PasswordReset.create({
      user_id: user.user_id,
      otp: otp,
      expires_at: new Date(Date.now() + 10 * 60 * 1000),
      used: false,
    });
    console.log("[FORGOT PASSWORD] Created reset record with ID:", resetRecord.reset_id);

    await sendOTPEmail(user.email, otp);
    console.log("[FORGOT PASSWORD] OTP email sent successfully");

    return res.status(200).json({
      success: true,
      emailExists: true, // ← ADDED
      message: "OTP sent to your email. Please check your inbox.",
      data: {
        email: user.email,
      },
    });
  } catch (error) {
    console.error("[FORGOT PASSWORD] Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to send OTP. Please try again later.",
    });
  }
};
// ==================== VERIFY OTP ====================
const verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;
    console.log("[VERIFY OTP] Request for email:", email, "OTP:", otp);

    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        message: "Please provide email and OTP",
      });
    }

    const user = await db.User.findOne({ where: { email } });
    if (!user) {
      console.log("[VERIFY OTP] User not found");
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const otpRecord = await db.PasswordReset.findOne({
      where: {
        user_id: user.user_id,
        otp: otp,
        used: false,
        expires_at: {
          [db.Sequelize.Op.gt]: new Date(),
        },
      },
    });

    if (!otpRecord) {
      console.log("[VERIFY OTP] Invalid or expired OTP");
      return res.status(400).json({
        success: false,
        message: "Invalid or expired OTP",
      });
    }

    const resetToken = crypto.randomBytes(32).toString("hex");
    console.log("[VERIFY OTP] Generated reset token:", resetToken.substring(0, 10) + "...");

    otpRecord.reset_token = resetToken;
    await otpRecord.save();
    console.log("[VERIFY OTP] OTP verified and reset token saved");

    return res.status(200).json({
      success: true,
      message: "OTP verified successfully",
      data: {
        resetToken: resetToken,
      },
    });
  } catch (error) {
    console.error("[VERIFY OTP] Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to verify OTP",
    });
  }
};

// ==================== RESET PASSWORD ====================
const resetPassword = async (req, res) => {
  try {
    const { resetToken, newPassword } = req.body;
    console.log("[RESET PASSWORD] Request with token:", resetToken?.substring(0, 10) + "...");

    if (!resetToken || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Please provide reset token and new password",
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters",
      });
    }

    const resetRecord = await db.PasswordReset.findOne({
      where: {
        reset_token: resetToken,
        used: false,
        expires_at: {
          [db.Sequelize.Op.gt]: new Date(),
        },
      },
    });

    if (!resetRecord) {
      console.log("[RESET PASSWORD] Invalid or expired reset token");
      return res.status(400).json({
        success: false,
        message: "Invalid or expired reset token",
      });
    }

    const user = await db.User.findByPk(resetRecord.user_id);
    if (!user) {
      console.log("[RESET PASSWORD] User not found");
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    user.password = newPassword;
    await user.save();
    console.log("[RESET PASSWORD] Password updated for user:", user.user_id);

    resetRecord.used = true;
    await resetRecord.save();
    console.log("[RESET PASSWORD] Reset token marked as used");

    return res.status(200).json({
      success: true,
      message: "Password reset successful. You can now login with your new password.",
    });
  } catch (error) {
    console.error("[RESET PASSWORD] Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to reset password",
    });
  }
};

// ==================== GOOGLE AUTH SUCCESS ====================
const googleAuthSuccess = (req, res) => {
  try {
    if (!req.user) {
      return res.redirect(`${process.env.FRONTEND_URL}/login?error=auth_failed`);
    }

    // ← ADD THESE 3 LINES
    if (req.user.isNewUser) {
      sendWelcomeEmail(req.user.email, req.user.full_name).catch(() => {});
    }

    const token = jwt.sign(
      { user_id: req.user.user_id, email: req.user.email, role: req.user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.redirect(`${process.env.FRONTEND_URL}/auth/google/success?token=${token}`);
  } catch (error) {
    console.error("Google auth success error:", error);
    res.redirect(`${process.env.FRONTEND_URL}/login?error=server_error`);
  }
};

// ==================== GOOGLE AUTH FAILURE ====================
const googleAuthFailure = (req, res) => {
  res.redirect(`${process.env.FRONTEND_URL}/login?error=google_auth_failed`);
};

// ==================== GET CURRENT USER ====================
const getCurrentUser = async (req, res) => {
  try {
    const user = await db.User.findByPk(req.user.user_id, {
      include: [
        {
          model: db.Seller,
          as: "sellerProfile",
          required: false,
        },
      ],
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const responseData = {
      user_id: user.user_id,
      full_name: user.full_name,
      email: user.email,
      role: user.role,
      phone: user.phone,
      profile_image: user.profile_image,
    };

    if (user.role === "seller" && user.sellerProfile) {
      responseData.seller = {
        seller_id: user.sellerProfile.seller_id,
        shop_name: user.sellerProfile.shop_name,
        shop_description: user.sellerProfile.shop_description,
        shop_logo: user.sellerProfile.shop_logo,
        address: user.sellerProfile.address,
        city: user.sellerProfile.city,
        approval_status: user.sellerProfile.approval_status,
      };
    }

    return res.status(200).json({
      success: true,
      data: responseData,
    });
  } catch (error) {
    console.error("Get current user error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch user data",
    });
  }
};

// ==================== EXPORTS ====================
module.exports = {
  registerBuyer,
  registerSeller,
  login,
  requestPasswordReset,
  verifyOTP,
  resetPassword,
  googleAuthSuccess,
  googleAuthFailure,
  getCurrentUser,
};