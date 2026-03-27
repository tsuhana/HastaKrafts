const express = require("express");
const router = express.Router();
const fs = require("fs");
const path = require("path");
const multer = require("multer");
const storyController = require("../controllers/story.controller");
const { authenticate } = require("../middlewares/auth.middleware");
const { checkRole, checkSellerApproval } = require("../middlewares/roleCheck.middleware");
const { createStoryRules, updateStoryRules } = require("../validations/story.validation");

// Auto-create uploads/stories folder
const storiesDir = path.join(__dirname, "../uploads/stories");
if (!fs.existsSync(storiesDir)) fs.mkdirSync(storiesDir, { recursive: true });

const uploadStory = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => cb(null, storiesDir),
    filename:    (req, file, cb) => cb(null, `story-${Date.now()}-${Math.random().toString(36).substring(7)}${path.extname(file.originalname)}`),
  }),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|webp/;
    allowed.test(path.extname(file.originalname).toLowerCase())
      ? cb(null, true)
      : cb(new Error("Only images are allowed"));
  },
}).array("images", 5);

const handleUpload = (req, res, next) => {
  uploadStory(req, res, (err) => {
    if (err) return res.status(400).json({ success: false, message: err.message || "Image upload failed" });
    next();
  });
};

// ==================== PUBLIC ====================
router.get("/", storyController.getAllStories);

// ==================== SELLER ====================
router.get("/seller/my-stories",
  authenticate, checkRole("seller"), checkSellerApproval,
  storyController.getSellerStories
);

router.post("/",
  authenticate, checkRole("seller"),
  handleUpload,
  createStoryRules,
  storyController.createStory
);

router.put("/:id",
  authenticate, checkRole("seller"),
  updateStoryRules,
  storyController.updateStory
);

router.delete("/:id",
  authenticate, checkRole("seller"),
  storyController.deleteStory
);

// Public single story — MUST be last
router.get("/:id", storyController.getStoryById);

module.exports = router;