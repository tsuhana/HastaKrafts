const express = require("express");
const router = express.Router();
const {
  getUserProfile,
  updateUserProfile,
  changePassword,
  uploadProfilePicture,
  savePushSid,
  updateLanguagePreference,
} = require("../controllers/user.controller");
const { authenticate } = require("../middlewares/auth.middleware");
const { uploadProfile } = require("../middlewares/upload.middleware");
const { updateProfileRules, changePasswordRules } = require("../validations/user.validation");

router.use(authenticate);

router.get("/profile",          getUserProfile);
router.put("/profile",          updateProfileRules,  updateUserProfile);
router.put("/change-password",  changePasswordRules, changePassword);
router.put("/language-preference", updateLanguagePreference);

// Save WebPushr subscriber ID
router.post("/save-push-sid", savePushSid);

router.post(
  "/upload-avatar",
  (req, res, next) => {
    uploadProfile(req, res, (err) => {
      if (err) return res.status(400).json({ success: false, message: err.message || "Image upload failed" });
      next();
    });
  },
  uploadProfilePicture
);

module.exports = router;