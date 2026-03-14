const express = require("express");
const router = express.Router();
const productController = require("../controllers/product.controller");
const { authenticate } = require("../middlewares/auth.middleware");
const { checkRole, checkSellerApproval } = require("../middlewares/roleCheck.middleware");
const { uploadProduct } = require("../middlewares/upload.middleware");

// ==================== PUBLIC ROUTES ====================
// Homepage specific routes
router.get('/featured', productController.getFeaturedProducts);
router.get('/trending', productController.getTrendingProducts);
router.get('/random', productController.getRandomProducts);
router.get('/categories/top', productController.getTopCategories);

// Translation routes
router.post('/:id/translate', productController.translateProduct);
router.get('/languages/supported', productController.getSupportedLanguages);

// General public routes
router.get("/", productController.getAllProducts);
router.get("/categories", productController.getAllCategories);

// Dynamic routes — translated version first, then plain
router.get("/:id/translated", productController.getProductWithTranslations);
router.get("/:id", productController.getProductById);

// ==================== SELLER ROUTES (PROTECTED) ====================
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
  productController.createProduct
);

router.get(
  "/seller/my-products",
  authenticate,
  checkRole("seller"),
  checkSellerApproval,
  productController.getSellerProducts
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
  productController.updateProduct
);

router.delete(
  "/:id",
  authenticate,
  checkRole("seller", "admin"),
  productController.deleteProduct
);

// ==================== ADMIN ROUTES (PROTECTED) ====================
router.patch(
  "/:id/toggle-featured",
  authenticate,
  checkRole("admin"),
  productController.toggleFeatured
);

module.exports = router;