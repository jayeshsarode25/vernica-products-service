import mongoose from "mongoose";

const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Category name is required"],
      unique: true,
      trim: true,
      maxlength: [50, "Category name cannot exceed 50 characters"],
    },
    description: {
      type: String,
      required: [true, "Category description is required"],
      maxlength: [200, "Description cannot exceed 200 characters"],
    },
    slug: {
      type: String,
      unique: true,
      lowercase: true,
      trim: true,
    },
    displayOrder: {
      type: Number,
      default: 0,
    },
    subCategories: {
      type: [
        {
          name: {
            type: String,
            required: true,
            enum: ["Male", "Female", "Unisex"],
          },
          slug: {
            type: String,
            required: true,
            enum: ["male", "female", "unisex"],
          },
        },
      ],
      default: [
        { name: "Male", slug: "male" },
        { name: "Female", slug: "female" },
        { name: "Unisex", slug: "unisex" },
      ],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    productCount: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

// Indexes for faster queries
categorySchema.index({ slug: 1 });
categorySchema.index({ isActive: 1 });

const categoryModel = mongoose.model("category", categorySchema);

export default categoryModel;
