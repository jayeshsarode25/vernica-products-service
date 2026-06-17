import mongoose from "mongoose";
import categoryModel from "../model/category.model.js";
import { AppError, catchAsync } from "../utils/error.utils.js"; 

// ── shared slug generator ──────────────────────────────────────────
const DEFAULT_SUB_CATEGORIES = [
  { name: "Male", slug: "male" },
  { name: "Female", slug: "female" },
  { name: "Unisex", slug: "unisex" },
];

const withDefaultSubCategories = (category) => ({
  ...category,
  subCategories: [
    ...DEFAULT_SUB_CATEGORIES,
    ...(Array.isArray(category.subCategories) ? category.subCategories : []),
  ].filter(
    (subCategory, index, subCategories) =>
      index === subCategories.findIndex((item) => item.slug === subCategory.slug)
  ),
});

const generateSlug = (name) =>
  name
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");

// ─────────────────────────────────────────────────────────────────
// GET ALL CATEGORIES (public)
// ─────────────────────────────────────────────────────────────────
export const getCategories = catchAsync(async (req, res) => {
  const categories = await categoryModel
    .find({ isActive: true })
    .sort({ displayOrder: 1 })
    .lean();

  res.json({
    success: true,
    message: "Categories retrieved successfully",
    count:   categories.length,
    subCategories: DEFAULT_SUB_CATEGORIES,
    data:    categories.map(withDefaultSubCategories),
  });
});

export const getSubCategories = catchAsync(async (req, res) => {
  res.json({
    success: true,
    message: "Sub-categories retrieved successfully",
    data: DEFAULT_SUB_CATEGORIES,
  });
});

// ─────────────────────────────────────────────────────────────────
// GET CATEGORY BY ID (public)
// ─────────────────────────────────────────────────────────────────
export const getCategoryById = catchAsync(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new AppError("Invalid category ID", 400);
  }

  const category = await categoryModel.findById(id).lean();
  if (!category) {
    throw new AppError("Category not found", 404);
  }

  res.json({
    success: true,
    message: "Category retrieved successfully",
    data: withDefaultSubCategories(category),
  });
});

// ─────────────────────────────────────────────────────────────────
// GET CATEGORY BY SLUG (public)
// ─────────────────────────────────────────────────────────────────
export const getCategoryBySlug = catchAsync(async (req, res) => {
  const { slug } = req.params;

  const category = await categoryModel
    .findOne({ slug: slug.toLowerCase(), isActive: true })
    .lean();

  if (!category) {
    throw new AppError("Category not found", 404);
  }

  res.json({
    success: true,
    message: "Category retrieved successfully",
    data: withDefaultSubCategories(category),
  });
});

// ─────────────────────────────────────────────────────────────────
// CREATE CATEGORY (admin)
// ─────────────────────────────────────────────────────────────────
export const createCategory = catchAsync(async (req, res) => {
  const { name, description, displayOrder } = req.body;

  if (!name || !description) {
    throw new AppError("Name and description are required", 400);
  }

  if (name.length < 3) {
    throw new AppError("Category name must be at least 3 characters", 400);
  }

  if (description.length < 10) {
    throw new AppError("Description must be at least 10 characters", 400);
  }

  const existingCategory = await categoryModel.findOne({
    name: { $regex: `^${name}$`, $options: "i" },
  });

  if (existingCategory) {
    throw new AppError("Category with this name already exists", 409);
  }

  const newCategory = await categoryModel.create({
    name,
    description,
    slug:         generateSlug(name),
    displayOrder: displayOrder || 0,
    subCategories: DEFAULT_SUB_CATEGORIES,
  });

  res.status(201).json({
    success: true,
    message: "Category created successfully",
    data:    newCategory,
  });
});

// ─────────────────────────────────────────────────────────────────
// UPDATE CATEGORY (admin)
// ─────────────────────────────────────────────────────────────────
export const updateCategory = catchAsync(async (req, res) => {
  const { id }                                    = req.params;
  const { name, description, displayOrder, isActive } = req.body;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new AppError("Invalid category ID", 400);
  }

  const category = await categoryModel.findById(id);
  if (!category) {
    throw new AppError("Category not found", 404);
  }

  // check name uniqueness if name is changing
  if (name && name !== category.name) {
    const existing = await categoryModel.findOne({
      name: { $regex: `^${name}$`, $options: "i" },
      _id:  { $ne: id },
    });
    if (existing) {
      throw new AppError("Category with this name already exists", 409);
    }
  }

  if (name && name.length < 3) {
    throw new AppError("Category name must be at least 3 characters", 400);
  }

  if (description && description.length < 10) {
    throw new AppError("Description must be at least 10 characters", 400);
  }

  if (name) {
    category.name = name;
    category.slug = generateSlug(name); // regenerate slug when name changes
  }
  if (description)             category.description  = description;
  if (displayOrder !== undefined) category.displayOrder = displayOrder;
  if (isActive     !== undefined) category.isActive     = isActive;

  await category.save();

  res.json({ success: true, message: "Category updated successfully", data: category });
});

// ─────────────────────────────────────────────────────────────────
// DELETE CATEGORY (admin)
// ─────────────────────────────────────────────────────────────────
export const deleteCategory = catchAsync(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new AppError("Invalid category ID", 400);
  }

  const category = await categoryModel.findByIdAndDelete(id);
  if (!category) {
    throw new AppError("Category not found", 404);
  }

  res.json({ success: true, message: "Category deleted successfully", data: category });
});
