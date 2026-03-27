const express = require("express");
const router = express.Router();
const { getSellerProfile, updateSellerProfile, uploadShopLogo, uploadCitizenship, getSellerAnalytics } = require("../controllers/seller.controller");
const { authenticate } = require("../middlewares/auth.middleware");
const { uploadShopLogo: uploadShopLogoMiddleware, uploadCitizenship: uploadCitizenshipMiddleware } = require("../middlewares/upload.middleware");
const { updateSellerProfileRules } = require("../validations/seller.validation");

router.use(authenticate);

router.get("/profile",    getSellerProfile);
router.put("/profile",    updateSellerProfileRules, updateSellerProfile);

router.post("/upload-logo",
  (req, res, next) => {
    uploadShopLogoMiddleware(req, res, (err) => {
      if (err) return res.status(400).json({ success: false, message: err.message || "Logo upload failed" });
      next();
    });
  },
  uploadShopLogo
);

router.post("/upload-citizenship",
  (req, res, next) => {
    uploadCitizenshipMiddleware(req, res, (err) => {
      if (err) return res.status(400).json({ success: false, message: err.message || "Citizenship upload failed" });
      next();
    });
  },
  uploadCitizenship
);

router.get("/analytics", getSellerAnalytics);

module.exports = router;