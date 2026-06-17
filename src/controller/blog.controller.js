import mongoose from "mongoose";
import blogModel from "../model/blog.model.js";
import { AppError, catchAsync } from "../utils/error.utils.js";

// ── Helper: Generate slug ──────────────────────────────────────────
const generateSlug = (title) =>
  title
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");

// ─────────────────────────────────────────────────────────────────
// GET ALL PUBLISHED BLOGS (Public)
// ─────────────────────────────────────────────────────────────────
export const getBlogs = catchAsync(async (req, res) => {
  const { page = 1, limit = 10, category, tag, search } = req.query;

  // Build filter
  const filter = { isPublished: true, isActive: true };

  if (category) {
    filter.category = category;
  }

  if (tag) {
    filter.tags = { $in: [tag.toLowerCase()] };
  }

  if (search) {
    filter.$or = [
      { title: { $regex: search, $options: "i" } },
      { description: { $regex: search, $options: "i" } },
      { content: { $regex: search, $options: "i" } },
    ];
  }

  const skip = (page - 1) * limit;

  const blogs = await blogModel
    .find(filter)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit))
    .select("-content") // Don't send full content in list
    .lean();

  const total = await blogModel.countDocuments(filter);

  res.json({
    success: true,
    message: "Blogs retrieved successfully",
    data: blogs,
    pagination: {
      total,
      pages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      limit: parseInt(limit),
    },
  });
});

// ─────────────────────────────────────────────────────────────────
// GET SINGLE BLOG BY SLUG (Public)
// ─────────────────────────────────────────────────────────────────
export const getBlogBySlug = catchAsync(async (req, res) => {
  const { slug } = req.params;

  const blog = await blogModel.findOne({
    slug: slug.toLowerCase(),
    isPublished: true,
    isActive: true,
  });

  if (!blog) {
    throw new AppError("Blog not found", 404);
  }

  // ✅ Increment view count
  blog.viewCount = (blog.viewCount || 0) + 1;
  await blog.save();

  res.json({
    success: true,
    message: "Blog retrieved successfully",
    data: blog,
  });
});

// ─────────────────────────────────────────────────────────────────
// GET SINGLE BLOG BY ID (Admin)
// ─────────────────────────────────────────────────────────────────
export const getBlogById = catchAsync(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new AppError("Invalid blog ID", 400);
  }

  const blog = await blogModel.findById(id);

  if (!blog) {
    throw new AppError("Blog not found", 404);
  }

  res.json({
    success: true,
    message: "Blog retrieved successfully",
    data: blog,
  });
});

// ─────────────────────────────────────────────────────────────────
// GET ALL BLOGS (Admin - includes drafts)
// ─────────────────────────────────────────────────────────────────
export const getAllBlogs = catchAsync(async (req, res) => {
  const { page = 1, limit = 10 } = req.query;

  const skip = (page - 1) * limit;

  const blogs = await blogModel
    .find()
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit))
    .select("-content");

  const total = await blogModel.countDocuments();

  res.json({
    success: true,
    message: "All blogs retrieved successfully",
    data: blogs,
    pagination: {
      total,
      pages: Math.ceil(total / limit),
      currentPage: parseInt(page),
    },
  });
});

// ─────────────────────────────────────────────────────────────────
// CREATE BLOG (Admin)
// ─────────────────────────────────────────────────────────────────
export const createBlog = catchAsync(async (req, res) => {
  const {
    title,
    description,
    content,
    author,
    thumbnail,
    category,
    tags,
    isPublished,
    metaTitle,
    metaDescription,
    metaKeywords,
  } = req.body;

  // ✅ Validate required fields
  if (!title || !description || !content || !author || !thumbnail) {
    throw new AppError("All required fields must be provided", 400);
  }

  // ✅ Validate length
  if (title.length < 5) {
    throw new AppError("Title must be at least 5 characters", 400);
  }

  if (description.length < 20) {
    throw new AppError("Description must be at least 20 characters", 400);
  }

  if (content.length < 100) {
    throw new AppError("Content must be at least 100 characters", 400);
  }

  // ✅ Check for duplicate title
  const existingBlog = await blogModel.findOne({
    title: { $regex: `^${title}$`, $options: "i" },
  });

  if (existingBlog) {
    throw new AppError("Blog with this title already exists", 409);
  }

  // ✅ Create blog
  const newBlog = await blogModel.create({
    title,
    slug: generateSlug(title),
    description,
    content,
    author,
    thumbnail,
    category,
    tags: tags ? tags.map((tag) => tag.toLowerCase()) : [],
    isPublished: isPublished || false,
    metaTitle,
    metaDescription,
    metaKeywords,
  });

  res.status(201).json({
    success: true,
    message: "Blog created successfully",
    data: newBlog,
  });
});

// ─────────────────────────────────────────────────────────────────
// UPDATE BLOG (Admin)
// ─────────────────────────────────────────────────────────────────
export const updateBlog = catchAsync(async (req, res) => {
  const { id } = req.params;
  const {
    title,
    description,
    content,
    author,
    thumbnail,
    category,
    tags,
    isPublished,
    isActive,
    metaTitle,
    metaDescription,
    metaKeywords,
  } = req.body;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new AppError("Invalid blog ID", 400);
  }

  const blog = await blogModel.findById(id);

  if (!blog) {
    throw new AppError("Blog not found", 404);
  }

  // ✅ Check title uniqueness if changing
  if (title && title !== blog.title) {
    const existingBlog = await blogModel.findOne({
      title: { $regex: `^${title}$`, $options: "i" },
      _id: { $ne: id },
    });

    if (existingBlog) {
      throw new AppError("Blog with this title already exists", 409);
    }
  }

  // ✅ Update fields
  if (title) {
    blog.title = title;
    blog.slug = generateSlug(title);
  }
  if (description) blog.description = description;
  if (content) blog.content = content;
  if (author) blog.author = author;
  if (thumbnail) blog.thumbnail = thumbnail;
  if (category) blog.category = category;
  if (tags) blog.tags = tags.map((tag) => tag.toLowerCase());
  if (isPublished !== undefined) blog.isPublished = isPublished;
  if (isActive !== undefined) blog.isActive = isActive;
  if (metaTitle) blog.metaTitle = metaTitle;
  if (metaDescription) blog.metaDescription = metaDescription;
  if (metaKeywords) blog.metaKeywords = metaKeywords;

  await blog.save();

  res.json({
    success: true,
    message: "Blog updated successfully",
    data: blog,
  });
});

// ─────────────────────────────────────────────────────────────────
// DELETE BLOG (Admin)
// ─────────────────────────────────────────────────────────────────
export const deleteBlog = catchAsync(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new AppError("Invalid blog ID", 400);
  }

  const blog = await blogModel.findByIdAndDelete(id);

  if (!blog) {
    throw new AppError("Blog not found", 404);
  }

  res.json({
    success: true,
    message: "Blog deleted successfully",
    data: blog,
  });
});

// ─────────────────────────────────────────────────────────────────
// GET BLOG CATEGORIES
// ─────────────────────────────────────────────────────────────────
export const getBlogCategories = catchAsync(async (req, res) => {
  const categories = [
    "Beauty Tips",
    "Skincare",
    "Haircare",
    "Wellness",
    "Trending",
    "Tutorials",
    "Reviews",
    "News",
  ];

  res.json({
    success: true,
    message: "Categories retrieved successfully",
    data: categories,
  });
});

// ─────────────────────────────────────────────────────────────────
// GET ALL TAGS (from blogs)
// ─────────────────────────────────────────────────────────────────
export const getAllTags = catchAsync(async (req, res) => {
  const tags = await blogModel.aggregate([
    { $match: { isPublished: true, isActive: true } },
    { $unwind: "$tags" },
    { $group: { _id: "$tags", count: { $sum: 1 } } },
    { $sort: { count: -1 } },
  ]);

  res.json({
    success: true,
    message: "Tags retrieved successfully",
    data: tags,
  });
});

// ─────────────────────────────────────────────────────────────────
// GET RELATED BLOGS (by category and tags)
// ─────────────────────────────────────────────────────────────────
export const getRelatedBlogs = catchAsync(async (req, res) => {
  const { id } = req.params;
  const limit = 3;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new AppError("Invalid blog ID", 400);
  }

  const blog = await blogModel.findById(id);

  if (!blog) {
    throw new AppError("Blog not found", 404);
  }

  const relatedBlogs = await blogModel
    .find({
      _id: { $ne: id },
      isPublished: true,
      isActive: true,
      $or: [{ category: blog.category }, { tags: { $in: blog.tags } }],
    })
    .limit(limit)
    .select("-content")
    .lean();

  res.json({
    success: true,
    message: "Related blogs retrieved successfully",
    data: relatedBlogs,
  });
});