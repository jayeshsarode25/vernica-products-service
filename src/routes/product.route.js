import express from "express";
import upload from "../middleware/multer.js";
import * as productController  from "../controller/product.controller.js";
import {
  createProductValidators,
  updateProductValidators,
} from "../middleware/product.middleware.js";
import createAuthMiddleware from "../middleware/auth.middleware.js";

const router = express.Router();

router.get("/", productController.getProduct);

// Get products by category ID
router.get("/category/:categoryId", productController.getProductsByCategory);

// Get products by category slug
router.get("/category-slug/:slug", productController.getProductsByCategorySlug);


router.post(
  "/",
  createAuthMiddleware(["admin"]),
  upload.fields([
    { name: "imagesUrls", maxCount: 2 },
    { name: "videoUrl", maxCount: 1 },
  ]),
  createProductValidators,
  productController.createProduct
);

// Update product
router.patch(
  "/:id",
  createAuthMiddleware(["admin"]),
  updateProductValidators,
  productController.updateProduct
);

// Delete product
router.delete(
  "/:id",
  createAuthMiddleware(["admin"]),
  productController.deleteProduct
);

// Get product count (admin only)
router.get(
  "/count",
  createAuthMiddleware(["admin"]),
  productController.getProductCount
);

// Get single product by ID (MUST BE LAST)
router.get("/:id", productController.getProductById);

export default router;
