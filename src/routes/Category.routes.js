import express from "express";
import * as categoryController from "../controller/Category.controller.js";
import createAuthMiddleware from "../middleware/auth.middleware.js";
import { createCategoryValidators, updateCategoryValidators } from "../middleware/product.middleware.js";

const router = express.Router();

// ====================================
// PUBLIC ROUTES
// ====================================

router.get("/", categoryController.getCategories);
router.get("/sub-categories", categoryController.getSubCategories);
router.get("/slug/:slug", categoryController.getCategoryBySlug);

// ADMIN ROUTES (WITHOUT validators for now)
router.post(
  "/",
  createAuthMiddleware(["admin"]),
  categoryController.createCategory  // ← NO VALIDATORS
);

router.put(
  "/:id",
  createAuthMiddleware(["admin"]),
  categoryController.updateCategory  // ← NO VALIDATORS
);

router.delete(
  "/:id",
  createAuthMiddleware(["admin"]),
  categoryController.deleteCategory  // ← NO VALIDATORS
);

// Generic ID route MUST BE LAST
router.get("/:id", categoryController.getCategoryById);

export default router;
