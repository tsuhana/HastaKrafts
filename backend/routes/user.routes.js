const express = require("express");
const router = express.Router();
const {
  getUserProfile,
  updateUserProfile,
  changePassword,
  uploadProfilePicture,
} = require("../controllers/user.controller");
const { authenticate } = require("../middlewares/auth.middleware");
const { uploadProfile } = require("../middlewares/upload.middleware");

// All routes require authentication
router.use(authenticate);

router.get("/profile", getUserProfile);
router.put("/profile", updateUserProfile);
router.put("/change-password", changePassword);
router.post(
  "/upload-avatar",
  (req, res, next) => {
    uploadProfile(req, res, (err) => {
      if (err) {
        return res.status(400).json({
          success: false,
          message: err.message || "Image upload failed",
        });
      }
      next();
    });
  },
  uploadProfilePicture
);

module.exports = router;