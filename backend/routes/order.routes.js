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

//(user must be logged in)
router.use(authenticate);

// Create order
router.post("/create", createOrder);

// Verify should be GET because controller uses req.query
router.get("/khalti/verify", verifyKhaltiPayment);

// My orders
router.get("/my-orders", getUserOrders);

// Seller routes MUST be before "/:id"
router.get("/seller/orders", getSellerOrders);
router.put("/seller/:order_id/status", updateOrderStatus);

router.get("/:id", getOrderById);

module.exports = router;
