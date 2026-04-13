const db = require("../models");
const bcrypt = require("bcrypt");
const fs = require("fs");
const path = require("path");

// ==================== GET USER PROFILE ====================
const getUserProfile = async (req, res) => {
  try {
    const user = await db.User.findByPk(req.user.user_id, {
      attributes: { exclude: ["password"] },
      include: [{ model: db.Seller, as: "sellerProfile", required: false }],
    });
    if (!user) return res.status(404).json({ success: false, message: "User not found" });
    res.status(200).json({ success: true, data: user });
  } catch (error) {
    console.error("Get user profile error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch profile" });
  }
};

// ==================== UPDATE USER PROFILE ====================
const updateUserProfile = async (req, res) => {
  try {
    const { full_name, email, phone, address, city, state, postal_code, landmark } = req.body;
    const user = await db.User.findByPk(req.user.user_id);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });
    if (email && email !== user.email) {
      const existingUser = await db.User.findOne({ where: { email } });
      if (existingUser) return res.status(400).json({ success: false, message: "Email already in use" });
    }
    await user.update({
      full_name:   full_name   || user.full_name,
      email:       email       || user.email,
      phone:       phone       !== undefined ? phone       : user.phone,
      address:     address     !== undefined ? address     : user.address,
      city:        city        !== undefined ? city        : user.city,
      state:       state       !== undefined ? state       : user.state,
      postal_code: postal_code !== undefined ? postal_code : user.postal_code,
      landmark:    landmark    !== undefined ? landmark    : user.landmark,
    });
    res.status(200).json({ success: true, message: "Profile updated successfully", data: user.toJSON() });
  } catch (error) {
    console.error("Update profile error:", error);
    res.status(500).json({ success: false, message: error.message || "Failed to update profile" });
  }
};

// ==================== CHANGE PASSWORD ====================
const changePassword = async (req, res) => {
  try {
    const currentPassword = req.body.current_password || req.body.currentPassword;
    const newPassword     = req.body.new_password     || req.body.newPassword;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: "Please provide current and new password" });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: "New password must be at least 6 characters" });
    }
    const user = await db.User.findByPk(req.user.user_id);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });
    if (!user.password) {
      return res.status(400).json({ success: false, message: "This account uses Google login. Cannot change password." });
    }
    const isPasswordValid = await user.comparePassword(currentPassword);
    if (!isPasswordValid) {
      return res.status(400).json({ success: false, message: "Current password is incorrect" });
    }
    user.password = newPassword;
    await user.save();
    res.status(200).json({ success: true, message: "Password changed successfully" });
  } catch (error) {
    console.error("Change password error:", error);
    res.status(500).json({ success: false, message: "Failed to change password" });
  }
};

// ==================== UPLOAD PROFILE PICTURE ====================
const uploadProfilePicture = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: "Please upload an image" });
    const user = await db.User.findByPk(req.user.user_id);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });
    if (user.profile_image) {
      const oldImagePath = path.join(__dirname, "..", user.profile_image);
      if (fs.existsSync(oldImagePath)) fs.unlinkSync(oldImagePath);
    }
    const profileImagePath = `/uploads/profiles/${req.file.filename}`;
    await user.update({ profile_image: profileImagePath });
    res.status(200).json({ success: true, message: "Profile picture uploaded successfully", data: { profile_image: profileImagePath } });
  } catch (error) {
    console.error("Upload profile picture error:", error);
    res.status(500).json({ success: false, message: "Failed to upload profile picture" });
  }
};

// ==================== SAVE WEBPUSHR SID  ====================
const savePushSid = async (req, res) => {
  try {
    const { sid } = req.body;
    if (!sid) return res.status(400).json({ success: false, message: "sid is required" });
    await db.User.update({ webpushr_sid: sid }, { where: { user_id: req.user.user_id } });
    console.log(`Push sid saved for user ${req.user.user_id}: ${sid}`);
    res.json({ success: true, message: "Push subscription saved" });
  } catch (error) {
    console.error("Save push sid error:", error);
    res.status(500).json({ success: false, message: "Failed to save push subscription" });
  }
};

// ==================== UPDATE LANGUAGE PREFERENCE ====================
const updateLanguagePreference = async (req, res) => {
  try {
    const { preferred_language } = req.body;
    if (!preferred_language) return res.status(400).json({ success: false, message: "Language is required" });
    const user = await db.User.findByPk(req.user.user_id);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });
    await user.update({ preferred_language });
    res.json({ success: true, message: "Language preference updated" });
  } catch (error) {
    console.error("Update language error:", error);
    res.status(500).json({ success: false, message: "Failed to update language" });
  }
};

module.exports = {
  getUserProfile,
  updateUserProfile,
  changePassword,
  uploadProfilePicture,
  savePushSid,
  updateLanguagePreference,
};