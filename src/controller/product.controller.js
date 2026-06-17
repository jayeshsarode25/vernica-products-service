import mongoose from "mongoose";
import productModel from "../model/product.model.js";
import categoryModel from "../model/category.model.js";
import { uploadImage, uploadVideo } from "../services/imagekit.services.js";
import { AppError, catchAsync } from "../utils/error.utils.js"; // ✅

// ── shared sort builder ────────────────────────────────────────────
const buildSortObj = (sort) => {
  if (sort === "price_asc")  return { "price.amount": 1 };
  if (sort === "price_desc") return { "price.amount": -1 };
  if (sort === "rating")     return { rating: -1 };
  return { createdAt: -1 }; // default: newest
};

const normalizeSubCategory = (value) =>
  typeof value === "string" ? value.trim().toLowerCase() : value;

const VALID_SUB_CATEGORIES = ["male", "female", "unisex"];

const assertValidSubCategory = (subCategory) => {
  if (!VALID_SUB_CATEGORIES.includes(subCategory)) {
    throw new AppError("Sub-category must be male, female, or unisex", 400);
  }
};

const buildProductDetails = (body, includeEmpty = false) => {
  const detailMap = {
    benefits: body.benefits ?? body.productDetails?.benefits,
    howToUse: body.howToUse ?? body.productDetails?.howToUse,
    ingredients: body.ingredients ?? body.productDetails?.ingredients,
    warningCaution:
      body.warningCaution ??
      body.warningAndCaution ??
      body.productDetails?.warningCaution ??
      body.productDetails?.warningAndCaution,
  };

  return Object.fromEntries(
    Object.entries(detailMap).filter(([, value]) => includeEmpty || value !== undefined)
  );
};

const getExistingProductDetails = (product) =>
  product.productDetails?.toObject?.() ?? product.productDetails ?? {};

// ─────────────────────────────────────────────────────────────────
// CREATE PRODUCT
// ─────────────────────────────────────────────────────────────────
export const createProduct = catchAsync(async (req, res) => {
  const {
    title,
    tagline = "",
    description,
    priceAmount,
    priceCurrency = "INR",
    categoryId,
    subCategory = "unisex",
    rating = 0,
    stock  = 0,
    size = "",
  } = req.body;

  const normalizedSubCategory = normalizeSubCategory(subCategory);
  assertValidSubCategory(normalizedSubCategory);

  if (!categoryId) {
    throw new AppError("Category ID is required", 400);
  }

  if (!mongoose.Types.ObjectId.isValid(categoryId)) {
    throw new AppError("Invalid Category ID", 400);
  }

  const categoryExists = await categoryModel.findById(categoryId);
  if (!categoryExists) {
    throw new AppError("Category not found", 404);
  }

  const price = { amount: Number(priceAmount), currency: priceCurrency };

  // upload images
  let imageUrls = [];
  if (req.files?.imagesUrls?.length) {
    imageUrls = await Promise.all(
      req.files.imagesUrls.map(async (file) => {
        const uploaded = await uploadImage({ buffer: file.buffer, folder: "products/images" });
        return { url: uploaded.url };
      })
    );
  }

  // upload video
  let videoUrl = "";
  if (req.files?.videoUrl) {
    const file  = req.files.videoUrl[0];
    const video = await uploadVideo({
      buffer:       file.buffer,
      originalname: file.originalname,
      folder:       "products/videos",
    });
    videoUrl = { url: video.url, thumbnail: video.thumbnail, id: video.id };
  }

  const product = await productModel.create({
    title, tagline, description, price,
    images: imageUrls, video: videoUrl,
    categoryId, subCategory: normalizedSubCategory, rating, stock, size,
    productDetails: buildProductDetails(req.body, true),
  });

  // update category product count
  await categoryModel.findByIdAndUpdate(categoryId, { $inc: { productCount: 1 } }, { new: true });

  const populatedProduct = await product.populate("categoryId", "name slug description");

  res.status(201).json({ message: "Product created successfully", data: populatedProduct });
});

// ─────────────────────────────────────────────────────────────────
// UPDATE PRODUCT
// ─────────────────────────────────────────────────────────────────
export const updateProduct = catchAsync(async (req, res) => {
  const { id } = req.params;

  if (!req.body || Object.keys(req.body).length === 0) {
    throw new AppError("No update data provided", 400);
  }

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new AppError("Invalid Product ID", 400);
  }

  const product = await productModel.findById(id);
  if (!product) {
    throw new AppError("Product not found", 404);
  }

  const allowUpdates = [
    "title",
    "tagline",
    "description",
    "price",
    "priceAmount",
    "priceCurrency",
    "categoryId",
    "subCategory",
    "rating",
    "stock",
    "size",
    "productDetails",
    "benefits",
    "howToUse",
    "ingredients",
    "warningCaution",
    "warningAndCaution",
    "isActive",
  ];

  for (const key of Object.keys(req.body)) {
    if (!allowUpdates.includes(key)) continue;

    if (key === "categoryId") {
      if (!mongoose.Types.ObjectId.isValid(req.body.categoryId)) {
        throw new AppError("Invalid Category ID", 400);
      }
      const newCategory = await categoryModel.findById(req.body.categoryId);
      if (!newCategory) {
        throw new AppError("New category not found", 404);
      }
      // update counts for old and new category
      await Promise.all([
        categoryModel.findByIdAndUpdate(product.categoryId,   { $inc: { productCount: -1 } }),
        categoryModel.findByIdAndUpdate(req.body.categoryId,  { $inc: { productCount:  1 } }),
      ]);
      product[key] = req.body[key];
    } else if (key === "price" && typeof req.body.price === "object") {
      if (req.body.price.amount   !== undefined) product.price.amount   = Number(req.body.price.amount);
      if (req.body.price.currency !== undefined) product.price.currency = req.body.price.currency;
    } else if (key === "priceAmount") {
      product.price.amount = Number(req.body.priceAmount);
    } else if (key === "priceCurrency") {
      product.price.currency = req.body.priceCurrency;
    } else if (key === "subCategory") {
      const normalizedSubCategory = normalizeSubCategory(req.body.subCategory);
      assertValidSubCategory(normalizedSubCategory);
      product.subCategory = normalizedSubCategory;
    } else if (key === "productDetails" && typeof req.body.productDetails === "object") {
      product.productDetails = {
        ...getExistingProductDetails(product),
        ...buildProductDetails(req.body),
      };
    } else if (["benefits", "howToUse", "ingredients", "warningCaution", "warningAndCaution"].includes(key)) {
      product.productDetails = {
        ...getExistingProductDetails(product),
        ...buildProductDetails(req.body),
      };
    } else {
      product[key] = req.body[key];
    }
  }

  await product.save();

  const updatedProduct = await product.populate("categoryId", "name slug description");
  res.status(200).json({ message: "Product updated successfully", product: updatedProduct });
});

// ─────────────────────────────────────────────────────────────────
// DELETE PRODUCT
// ─────────────────────────────────────────────────────────────────
export const deleteProduct = catchAsync(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new AppError("Invalid Product ID", 400);
  }

  const product = await productModel.findByIdAndDelete(id);
  if (!product) {
    throw new AppError("Product not found", 404);
  }

  await categoryModel.findByIdAndUpdate(
    product.categoryId,
    { $inc: { productCount: -1 } },
    { new: true }
  );

  res.status(200).json({ message: "Product deleted successfully" });
});

// ─────────────────────────────────────────────────────────────────
// GET PRODUCTS (with filters + pagination)
// ─────────────────────────────────────────────────────────────────
export const getProduct = catchAsync(async (req, res) => {
  const { q, skip = 0, limit = 10, categoryId, categorySlug, subCategory } = req.query;

  const minPriceRaw = req.query.minprice ?? req.query.minPrice;
  const maxPriceRaw = req.query.maxprice ?? req.query.maxPrice;

  const filter = { isActive: true };

  if (q) filter.$text = { $search: q };

  if (minPriceRaw !== undefined) {
    const min = Number(minPriceRaw);
    if (!Number.isNaN(min)) filter["price.amount"] = { ...(filter["price.amount"] || {}), $gte: min };
  }

  if (maxPriceRaw !== undefined) {
    const max = Number(maxPriceRaw);
    if (!Number.isNaN(max)) filter["price.amount"] = { ...(filter["price.amount"] || {}), $lte: max };
  }

  if (categoryId) {
    if (!mongoose.Types.ObjectId.isValid(categoryId)) {
      throw new AppError("Invalid Category ID", 400);
    }
    filter.categoryId = new mongoose.Types.ObjectId(categoryId);
  }

  if (categorySlug) {
    const category = await categoryModel.findOne({ slug: categorySlug, isActive: true });
    if (category) filter.categoryId = category._id;
  }

  if (subCategory) {
    const normalizedSubCategory = normalizeSubCategory(subCategory);
    assertValidSubCategory(normalizedSubCategory);
    filter.subCategory = normalizedSubCategory;
  }

  const safeLimit = Math.min(Number(limit), 50);

  const [products, totalCount] = await Promise.all([
    productModel
      .find(filter)
      .populate("categoryId", "name slug description")
      .skip(Number(skip))
      .limit(safeLimit)
      .sort({ createdAt: -1 }),
    productModel.countDocuments(filter),
  ]);

  res.status(200).json({
    message: "Products fetched successfully",
    pagination: { skip: Number(skip), limit: safeLimit, total: totalCount },
    data: products,
  });
});

// ─────────────────────────────────────────────────────────────────
// GET PRODUCT BY ID
// ─────────────────────────────────────────────────────────────────
export const getProductById = catchAsync(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new AppError("Invalid Product ID", 400);
  }

  const product = await productModel
    .findById(id)
    .populate("categoryId", "name slug description");

  if (!product) {
    throw new AppError("Product not found", 404);
  }

  res.status(200).json({ data: product });
});

// ─────────────────────────────────────────────────────────────────
// GET PRODUCT COUNT (admin)
// ─────────────────────────────────────────────────────────────────
export const getProductCount = catchAsync(async (req, res) => {
  const [totalProducts, countByCategory, countBySubCategory] = await Promise.all([
    productModel.countDocuments({ isActive: true }),
    productModel.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: "$categoryId", count: { $sum: 1 } } },
      { $lookup: { from: "categories", localField: "_id", foreignField: "_id", as: "category" } },
    ]),
    productModel.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: "$subCategory", count: { $sum: 1 } } },
    ]),
  ]);

  res.json({
    totalProducts,
    countByCategory: countByCategory.map((item) => ({
      categoryId:   item._id,
      categoryName: item.category[0]?.name,
      count:        item.count,
    })),
    countBySubCategory: countBySubCategory.map((item) => ({
      subCategory: item._id,
      count:       item.count,
    })),
  });
});

// ─────────────────────────────────────────────────────────────────
// GET PRODUCTS BY CATEGORY ID
// ─────────────────────────────────────────────────────────────────
export const getProductsByCategory = catchAsync(async (req, res) => {
  const { categoryId }              = req.params;
  const { skip = 0, limit = 12, sort = "newest", subCategory } = req.query;

  if (!mongoose.Types.ObjectId.isValid(categoryId)) {
    throw new AppError("Invalid Category ID", 400);
  }

  const category = await categoryModel.findById(categoryId);
  if (!category) {
    throw new AppError("Category not found", 404);
  }

  const safeLimit = Math.min(Number(limit), 50);
  const filter = { categoryId, isActive: true };

  if (subCategory) {
    const normalizedSubCategory = normalizeSubCategory(subCategory);
    assertValidSubCategory(normalizedSubCategory);
    filter.subCategory = normalizedSubCategory;
  }

  const [products, totalCount] = await Promise.all([
    productModel
      .find(filter)
      .populate("categoryId", "name slug description")
      .sort(buildSortObj(sort))
      .skip(Number(skip))
      .limit(safeLimit),
    productModel.countDocuments(filter),
  ]);

  res.json({
    message:  "Products retrieved successfully",
    category: { id: category._id, name: category.name, slug: category.slug, description: category.description },
    pagination: { skip: Number(skip), limit: safeLimit, total: totalCount, pages: Math.ceil(totalCount / safeLimit) },
    sort, count: products.length, data: products,
  });
});

// ─────────────────────────────────────────────────────────────────
// GET PRODUCTS BY CATEGORY SLUG
// ─────────────────────────────────────────────────────────────────
export const getProductsByCategorySlug = catchAsync(async (req, res) => {
  const { slug }                    = req.params;
  const { skip = 0, limit = 12, sort = "newest", subCategory } = req.query;

  const category = await categoryModel.findOne({ slug, isActive: true });
  if (!category) {
    throw new AppError("Category not found", 404);
  }

  const safeLimit = Math.min(Number(limit), 50);
  const filter = { categoryId: category._id, isActive: true };

  if (subCategory) {
    const normalizedSubCategory = normalizeSubCategory(subCategory);
    assertValidSubCategory(normalizedSubCategory);
    filter.subCategory = normalizedSubCategory;
  }

  const [products, totalCount] = await Promise.all([
    productModel
      .find(filter)
      .populate("categoryId", "name slug description")
      .sort(buildSortObj(sort))
      .skip(Number(skip))
      .limit(safeLimit),
    productModel.countDocuments(filter),
  ]);

  res.json({
    message:  "Products retrieved successfully",
    category: { id: category._id, name: category.name, slug: category.slug, description: category.description },
    pagination: { skip: Number(skip), limit: safeLimit, total: totalCount, pages: Math.ceil(totalCount / safeLimit) },
    sort, count: products.length, data: products,
  });
});
