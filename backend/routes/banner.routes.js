const express = require("express");
const router = express.Router();
const bannerController = require("../controllers/banner.controller");
const { authenticate } = require("../middlewares/auth.middleware");
const { checkRole } = require("../middlewares/roleCheck.middleware");
const { uploadBanner } = require("../middlewares/upload.middleware");
const { createBannerRules, updateBannerRules } = require("../validations/banner.validation");

const handleBannerUpload = (req, res, next) => {
  uploadBanner(req, res, (err) => {
    if (err) return res.status(400).json({ success: false, message: err.message || "Image upload failed" });
    next();
  });
};

// ==================== PUBLIC ====================
router.get("/active", bannerController.getActiveBanners);

// ==================== ADMIN ====================
router.get("/",    authenticate, checkRole("admin"), bannerController.getAllBanners);

router.post(
  "/",
  authenticate, checkRole("admin"),
  handleBannerUpload,
  createBannerRules,
  bannerController.createBanner
);

router.put(
  "/:id",
  authenticate, checkRole("admin"),
  handleBannerUpload,
  updateBannerRules,
  bannerController.updateBanner
);

router.delete("/:id",        authenticate, checkRole("admin"), bannerController.deleteBanner);
router.put("/:id/toggle",    authenticate, checkRole("admin"), bannerController.toggleBannerStatus);

module.exports = router;