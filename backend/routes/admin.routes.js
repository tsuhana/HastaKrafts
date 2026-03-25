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
} = require("../controllers/admin.controller");
const productController = require("../controllers/product.controller");
const { authenticate } = require("../middlewares/auth.middleware");
const { checkRole } = require("../middlewares/roleCheck.middleware");

// All routes require admin authentication
router.use(authenticate);
router.use(checkRole("admin"));

// Dashboard
router.get("/stats", getDashboardStats);
router.get("/analytics", getAnalytics);

// Seller management
router.get("/sellers/pending", getPendingSellers);
router.get("/sellers", getAllSellers);
router.post("/sellers/:id/approve", approveSeller);
router.post("/sellers/:id/reject", rejectSeller);

// Product management
router.get("/products/pending", getPendingProducts);
router.post("/products/:id/approve", approveProduct);
router.post("/products/:id/reject", rejectProduct);
router.put("/products/:id/featured", productController.toggleFeatured);

// User management
router.get("/users", getAllUsers);
router.put("/users/:id/toggle-block", toggleBlockUser);

// Order management 
router.get("/orders", getAllOrders);

// Reviews moderation 
router.get("/reviews", getAllReviews);
router.delete("/reviews/:id", deleteReview);

module.exports = router;