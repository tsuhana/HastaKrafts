const express = require("express");
const router = express.Router();
const {
  getDashboardStats,
  getPendingSellers,
  approveSeller,
  rejectSeller,
  getPendingProducts,
  approveProduct,
  rejectProduct,
  getAllUsers,
  getAllSellers,
} = require("../controllers/admin.controller");
const { authenticate } = require("../middlewares/auth.middleware");
const { checkRole } = require("../middlewares/roleCheck.middleware");

// All routes require admin authentication
router.use(authenticate);
router.use(checkRole("admin"));

// Dashboard
router.get("/stats", getDashboardStats);

// Seller management
router.get("/sellers/pending", getPendingSellers);
router.get("/sellers", getAllSellers);
router.post("/sellers/:id/approve", approveSeller);
router.post("/sellers/:id/reject", rejectSeller);

// Product management
router.get("/products/pending", getPendingProducts);
router.post("/products/:id/approve", approveProduct);
router.post("/products/:id/reject", rejectProduct);

// User management
router.get("/users", getAllUsers);

module.exports = router;