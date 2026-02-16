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

router.use(authenticate);

router.post("/create", createOrder);
router.post("/khalti/verify", verifyKhaltiPayment);
router.get("/my-orders", getUserOrders);
router.get("/:id", getOrderById);

// Seller routes
router.get("/seller/orders", getSellerOrders);
router.put("/seller/:order_id/status", updateOrderStatus);


module.exports = router;