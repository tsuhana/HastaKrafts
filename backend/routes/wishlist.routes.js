const express = require("express");
const router = express.Router();
const {
  addToWishlist,
  removeFromWishlist,
  getWishlist,
  checkWishlist,
  clearWishlist
} = require("../controllers/wishlist.controller");
const { authenticate } = require("../middlewares/auth.middleware");
const { checkRole } = require("../middlewares/roleCheck.middleware");

// All wishlist routes require buyer authentication
router.use(authenticate);
router.use(checkRole("buyer"));

router.get("/", getWishlist);
router.post("/add", addToWishlist);
router.get("/check/:product_id", checkWishlist);
router.delete("/remove/:product_id", removeFromWishlist);
router.delete("/clear", clearWishlist);

module.exports = router;