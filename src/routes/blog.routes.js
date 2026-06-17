import express from "express";
import * as blogController from "../controller/blog.controller.js";
import createAuthMiddleware from "../middleware/auth.middleware.js";

const router = express.Router();

// ─────────────────────────────────────────────────────────────────
// PUBLIC ROUTES (No authentication required)
// ─────────────────────────────────────────────────────────────────

// Get all published blogs (with pagination, filtering, search)
router.get("/", blogController.getBlogs);

// Get single blog by slug with view count increment
router.get("/slug/:slug", blogController.getBlogBySlug);

// Get blog categories
router.get("/categories", blogController.getBlogCategories);

// Get all tags from published blogs
router.get("/tags", blogController.getAllTags);

// Get related blogs by ID
router.get("/related/:id", blogController.getRelatedBlogs);

// ─────────────────────────────────────────────────────────────────
// ADMIN ROUTES (Authentication + Admin role required)
// ─────────────────────────────────────────────────────────────────

// Get all blogs (including drafts)
router.get(
  "/admin/all",
  createAuthMiddleware(["admin"]),
  blogController.getAllBlogs
);

// Get single blog by ID (for editing)
router.get(
  "/admin/:id",
  createAuthMiddleware(["admin"]),
  blogController.getBlogById
);

// Create new blog
router.post(
  "/",
  createAuthMiddleware(["admin"]),
  blogController.createBlog
);

// Update blog
router.put(
  "/:id",
  createAuthMiddleware(["admin"]),
  blogController.updateBlog
);

// Delete blog
router.delete(
  "/:id",
  createAuthMiddleware(["admin"]),
  blogController.deleteBlog
);

export default router;