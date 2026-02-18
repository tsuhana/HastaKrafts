const express = require("express");
const router = express.Router();

const {
  createOrder,
  verifyKhaltiPayment,
  getUserOrders,
  getOrderById,
  getSellerOrders,
  updateOrderStatus,
} = require("../controllers/order.controller");

const { authenticate } = require("../middlewares/auth.middleware");
const { checkRole, checkSellerApproval } = require("../middlewares/roleCheck.middleware");

// All order routes require login
router.use(authenticate);

// ==================== BUYER ROUTES ====================
router.post("/create", checkRole("buyer"), createOrder);

// verifyKhaltiPayment uses req.query so GET 
router.get("/khalti/verify", checkRole("buyer"), verifyKhaltiPayment);

router.get("/my-orders", checkRole("buyer"), getUserOrders);

// buyer order details page
router.get("/:id", checkRole("buyer", "admin"), getOrderById);

// ==================== SELLER ROUTES ====================
// KEEP THESE BEFORE "/:id" (already done)
router.get(
  "/seller/orders",
  checkRole("seller"),
  checkSellerApproval,
  getSellerOrders
);

router.put(
  "/seller/:order_id/status",
  checkRole("seller"),
  checkSellerApproval,
  updateOrderStatus
);

module.exports = router;
