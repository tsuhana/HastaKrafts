const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Ensure upload directories exist
const uploadDirs = [
  "uploads/products",
  "uploads/profiles",
  "uploads/banners",
  "uploads/sellers/logos",
  "uploads/sellers/citizenship",
];
uploadDirs.forEach((dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// File filter - images only
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);
  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error("Only image files are allowed (jpeg, jpg, png, gif, webp)"));
  }
};

// Generic filename generator
const makeFilename = (req, file, cb) => {
  const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
  cb(null, uniqueSuffix + path.extname(file.originalname));
};

// ── Product images ──
const uploadProduct = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => cb(null, "uploads/products/"),
    filename: makeFilename,
  }),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter,
}).array("images", 8);

// ── User profile picture ──
const uploadProfile = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => cb(null, "uploads/profiles/"),
    filename: makeFilename,
  }),
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter,
}).single("profile_picture");

// ── Banner ──
const uploadBanner = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      const dir = path.join(__dirname, "..", "uploads", "banners");
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      cb(null, dir);
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
      cb(null, `banner-${uniqueSuffix}${path.extname(file.originalname)}`);
    },
  }),
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) cb(null, true);
    else cb(new Error("Only image files are allowed!"), false);
  },
  limits: { fileSize: 5 * 1024 * 1024 },
}).single("image");

// ── Seller shop logo ──
const uploadShopLogo = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => cb(null, "uploads/sellers/logos/"),
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
      cb(null, `logo-${uniqueSuffix}${path.extname(file.originalname)}`);
    },
  }),
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter,
}).single("shop_logo");

// ── Seller citizenship document ──
const uploadCitizenship = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => cb(null, "uploads/sellers/citizenship/"),
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
      cb(null, `citizenship-${uniqueSuffix}${path.extname(file.originalname)}`);
    },
  }),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter,
}).single("citizenship_image");

module.exports = {
  uploadProduct,
  uploadProfile,
  uploadBanner,
  uploadShopLogo,
  uploadCitizenship,
};