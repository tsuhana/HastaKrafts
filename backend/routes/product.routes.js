const express = require("express");
const router = express.Router();
const productController = require("../controllers/product.controller");
const { authenticate } = require("../middlewares/auth.middleware");
const { checkRole, checkSellerApproval } = require("../middlewares/roleCheck.middleware");
const { uploadProduct } = require("../middlewares/upload.middleware");
const { createProductRules, updateProductRules } = require("../validations/product.validation");

const handleProductUpload = (req, res, next) => {
  uploadProduct(req, res, (err) => {
    if (err) return res.status(400).json({ success: false, message: err.message || "Image upload failed" });
    next();
  });
};

// ==================== PUBLIC ====================
router.get("/featured",         productController.getFeaturedProducts);
router.get("/trending",         productController.getTrendingProducts);
router.get("/random",           productController.getRandomProducts);
router.get("/categories/top",   productController.getTopCategories);
router.get("/categories",       productController.getAllCategories);
router.get("/languages/supported", productController.getSupportedLanguages);
router.get("/",                 productController.getAllProducts);
router.get("/:id/translated",   productController.getProductWithTranslations);
router.get("/:id",              productController.getProductById);
router.post("/:id/translate",   productController.translateProduct);

// ==================== SELLER ====================
router.post(
  "/",
  authenticate, checkRole("seller"), checkSellerApproval,
  handleProductUpload,
  createProductRules,
  productController.createProduct
);

router.get(
  "/seller/my-products",
  authenticate, checkRole("seller"), checkSellerApproval,
  productController.getSellerProducts
);

router.put(
  "/:id",
  authenticate, checkRole("seller", "admin"),
  handleProductUpload,
  updateProductRules,
  productController.updateProduct
);

router.delete(
  "/:id",
  authenticate, checkRole("seller", "admin"),
  productController.deleteProduct
);

// ==================== ADMIN ====================
router.patch(
  "/:id/toggle-featured",
  authenticate, checkRole("admin"),
  productController.toggleFeatured
);

module.exports = router;