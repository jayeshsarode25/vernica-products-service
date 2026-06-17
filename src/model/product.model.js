import mongoose from "mongoose";

const productSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  tagline: {
    type: String,
    trim: true,
  },
  description: {
    type: String,
  },
  price: {
    amount: {
      type: Number,
      required: true,
    },
    currency: {
      type: String,
      enum: ["INR", "USD"],
      default: "INR",
    },
  },
  images: [
    {
      url: String,
      thumbnail: String,
      id: String,
    },
  ],
  video: {
    url: String,
    thumbnail: String,
    id: String,
  },
  stock: {
    type: Number,
    default: 0,
  },
  size: {
    type: String,
    trim: true,
  },
  productDetails: {
    benefits: {
      type: String,
      trim: true,
    },
    howToUse: {
      type: String,
      trim: true,
    },
    ingredients: {
      type: String,
      trim: true,
    },
    warningCaution: {
      type: String,
      trim: true,
    },
  },
  // ⭐ NEW: Category Reference
  categoryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "category",
    required: [true, "Product must belong to a category"],
  },
  subCategory: {
    type: String,
    enum: ["male", "female", "unisex"],
    default: "unisex",
    lowercase: true,
    trim: true,
  },
  // Optional: Add rating for featured products section
  rating: {
    type: Number,
    default: 0,
    min: [0, "Rating cannot be less than 0"],
    max: [5, "Rating cannot exceed 5"],
  },
  reviewCount: {
    type: Number,
    default: 0,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
});

productSchema.index({ title: "text", tagline: "text", description: "text" });
productSchema.index({ categoryId: 1 }); // Index for category queries
productSchema.index({ categoryId: 1, subCategory: 1 });
productSchema.index({ isActive: 1 }); // Index for active products

const productModel = mongoose.model("product", productSchema);

export default productModel;
