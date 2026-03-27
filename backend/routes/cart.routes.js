const express = require("express");
const router = express.Router();
const { getCart, addToCart, updateCartItem, removeFromCart, clearCart } = require("../controllers/cart.controller");
const { authenticate } = require("../middlewares/auth.middleware");
const { checkRole } = require("../middlewares/roleCheck.middleware");
const { addToCartRules, updateCartItemRules } = require("../validations/cart.validation");

// All cart routes require buyer authentication
router.use(authenticate);
router.use(checkRole("buyer"));

router.get("/",                        getCart);
router.post("/add",       addToCartRules,      addToCart);
router.put("/items/:cart_item_id",     updateCartItemRules, updateCartItem);
router.delete("/items/:cart_item_id",  removeFromCart);
router.delete("/clear",                clearCart);

module.exports = router;