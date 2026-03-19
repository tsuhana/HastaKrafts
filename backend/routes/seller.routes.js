const express = require("express");
const router = express.Router();
const {
  getSellerProfile,
  updateSellerProfile,
  uploadShopLogo,
  uploadCitizenship,
  getSellerAnalytics,
} = require("../controllers/seller.controller");
const { authenticate } = require("../middlewares/auth.middleware");
const {
  uploadShopLogo: uploadShopLogoMiddleware,
  uploadCitizenship: uploadCitizenshipMiddleware,
} = require("../middlewares/upload.middleware");

// All routes require authentication
router.use(authenticate);

// GET seller profile
router.get("/profile", getSellerProfile);

// PUT update seller profile (shop info + bank info)
router.put("/profile", updateSellerProfile);

// POST upload shop logo
router.post(
  "/upload-logo",
  (req, res, next) => {
    uploadShopLogoMiddleware(req, res, (err) => {
      if (err) {
        return res.status(400).json({
          success: false,
          message: err.message || "Logo upload failed",
        });
      }
      next();
    });
  },
  uploadShopLogo
);

// POST upload citizenship document
router.post(
  "/upload-citizenship",
  (req, res, next) => {
    uploadCitizenshipMiddleware(req, res, (err) => {
      if (err) {
        return res.status(400).json({
          success: false,
          message: err.message || "Citizenship upload failed",
        });
      }
      next();
    });
  },
  uploadCitizenship
);

// GET seller analytics
router.get("/analytics", getSellerAnalytics);

module.exports = router;