const express = require("express");
const router = express.Router();
const {
  createProduct,
  getAllProducts,
  getProductById,
  getSellerProducts,
  updateProduct,
  deleteProduct,
  getAllCategories,
} = require("../controllers/product.controller");
const { authenticate } = require("../middlewares/auth.middleware");
const { checkRole, checkSellerApproval } = require("../middlewares/roleCheck.middleware");
const { uploadProduct } = require("../middlewares/upload.middleware");

// Public routes
router.get("/", getAllProducts);
router.get("/categories", getAllCategories);
router.get("/:id", getProductById);

// Seller routes (protected)
router.post(
  "/",
  authenticate,
  checkRole("seller"),
  checkSellerApproval,
  (req, res, next) => {
    uploadProduct(req, res, (err) => {
      if (err) {
        return res.status(400).json({
          success: false,
          message: err.message || "Image upload failed",
        });
      }
      next();
    });
  },
  createProduct
);

router.get(
  "/seller/my-products",
  authenticate,
  checkRole("seller"),
  getSellerProducts
);

router.put(
  "/:id",
  authenticate,
  checkRole("seller", "admin"),
  (req, res, next) => {
    uploadProduct(req, res, (err) => {
      if (err) {
        return res.status(400).json({
          success: false,
          message: err.message || "Image upload failed",
        });
      }
      next();
    });
  },
  updateProduct
);

router.delete(
  "/:id",
  authenticate,
  checkRole("seller", "admin"),
  deleteProduct
);

module.exports = router;