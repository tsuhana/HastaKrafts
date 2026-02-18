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
const { checkRole } = require("../middlewares/roleCheck.middleware"); 

// All cart routes require authentication AND buyer role
router.use(authenticate);
router.use(checkRole("buyer")); //Only buyers can access cart

router.get("/", getCart);
router.post("/add", addToCart);
router.put("/items/:cart_item_id", updateCartItem);
router.delete("/items/:cart_item_id", removeFromCart);
router.delete("/clear", clearCart);

module.exports = router;