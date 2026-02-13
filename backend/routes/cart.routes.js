const express = require("express");
const router = express.Router();
const {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart,
} = require("../controllers/cart.controller");
const { authenticate } = require("../middlewares/auth.middleware");

// All cart routes require authentication
router.use(authenticate);

router.get("/", getCart);
router.post("/add", addToCart);
router.put("/items/:cart_item_id", updateCartItem);
router.delete("/items/:cart_item_id", removeFromCart);
router.delete("/clear", clearCart);

module.exports = router;