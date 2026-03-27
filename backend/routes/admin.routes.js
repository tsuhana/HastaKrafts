const express = require("express");
const router = express.Router();

const {
  getDashboardStats,
  getAnalytics,
  getPendingSellers,
  approveSeller,
  rejectSeller,
  getPendingProducts,
  approveProduct,
  rejectProduct,
  getAllUsers,
  getAllSellers,
  getAllOrders,
  getAllReviews,
  deleteReview,
  toggleBlockUser,
  getAllAuctionsAdmin,
  approveAuction,   
  rejectAuction,
  deleteAuction,
  getAllBanners,
  createBanner,
  toggleBannerStatus,
  deleteBanner,
  getAllContactMessages,
  updateContactStatus,
  deleteContactMessage,
  toggleFeatured,
} = require("../controllers/admin.controller"); // 


const productController = require("../controllers/product.controller");
const { authenticate } = require("../middlewares/auth.middleware");
const { checkRole } = require("../middlewares/roleCheck.middleware");
const {
  rejectSellerRules,
  rejectProductRules,
  rejectAuctionRules,
  updateContactStatusRules,
} = require("../validations/admin.validation");

// All routes require admin authentication
router.use(authenticate);
router.use(checkRole("admin"));

// Dashboard
router.get("/stats",     getDashboardStats);
router.get("/analytics", getAnalytics);

// Seller management
router.get("/sellers/pending",        getPendingSellers);
router.get("/sellers",                getAllSellers);
router.post("/sellers/:id/approve",   approveSeller);
router.post("/sellers/:id/reject",    rejectSellerRules, rejectSeller);

// Product management
router.get("/products/pending",       getPendingProducts);
router.post("/products/:id/approve",  approveProduct);
router.post("/products/:id/reject",   rejectProductRules, rejectProduct);
router.put("/products/:id/featured",  toggleFeatured); 
// User management
router.get("/users",                  getAllUsers);
router.put("/users/:id/toggle-block", toggleBlockUser);

// Order management
router.get("/orders", getAllOrders);

// Reviews
router.get("/reviews",        getAllReviews);
router.delete("/reviews/:id", deleteReview);

// Auctions
router.get("/auctions",               getAllAuctionsAdmin);
router.post("/auctions/:id/approve",  approveAuction);
router.post("/auctions/:id/reject",   rejectAuctionRules, rejectAuction);
router.delete("/auctions/:id",        deleteAuction);

// Banners
router.get("/banners",              getAllBanners);
router.post("/banners",             createBanner);
router.put("/banners/:id/toggle",   toggleBannerStatus);
router.delete("/banners/:id",       deleteBanner);

// Contact messages
router.get("/contact",         getAllContactMessages);
router.put("/contact/:id",     updateContactStatusRules, updateContactStatus);
router.delete("/contact/:id",  deleteContactMessage);

module.exports = router;