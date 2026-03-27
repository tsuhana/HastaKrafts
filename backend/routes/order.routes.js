const express = require("express");
const router = express.Router();
const { createOrder, verifyKhaltiPayment, getUserOrders, getOrderById, getSellerOrders, updateOrderStatus } = require("../controllers/order.controller");
const { authenticate } = require("../middlewares/auth.middleware");
const { checkRole, checkSellerApproval } = require("../middlewares/roleCheck.middleware");
const { createOrderRules, updateOrderStatusRules } = require("../validations/order.validation");

router.use(authenticate);

// ==================== BUYER ====================
router.post("/create",         checkRole("buyer"), createOrderRules,       createOrder);
router.get("/khalti/verify",   checkRole("buyer"), verifyKhaltiPayment);
router.get("/my-orders",       checkRole("buyer"), getUserOrders);
router.get("/:id",             checkRole("buyer", "admin"), getOrderById);

// ==================== SELLER ====================
router.get("/seller/orders",
  checkRole("seller"), checkSellerApproval,
  getSellerOrders
);
router.put("/seller/:order_id/status",
  checkRole("seller"), checkSellerApproval,
  updateOrderStatusRules, updateOrderStatus
);

module.exports = router;