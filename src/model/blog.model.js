import mongoose from "mongoose";

const blogSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Blog title is required"],
      trim: true,
      maxlength: [150, "Title cannot exceed 150 characters"],
      minlength: [5, "Title must be at least 5 characters"],
    },

    slug: {
      type: String,
      unique: true,
      index: true,
      lowercase: true,
      trim: true,
    },

    description: {
      type: String,
      required: [true, "Blog description is required"],
      maxlength: [500, "Description cannot exceed 500 characters"],
      minlength: [20, "Description must be at least 20 characters"],
    },

    content: {
      type: String,
      required: [true, "Blog content is required"],
      minlength: [1000, "Content must be at least 1000 characters"],
    },

    author: {
      type: String,
      required: [true, "Author name is required"],
      trim: true,
      maxlength: [50, "Author name cannot exceed 50 characters"],
    },

    thumbnail: {
      type: String,
      required: [true, "Thumbnail image is required"],
    },

    category: {
      type: String,
      required: [true, "Blog category is required"],
      enum: [
        "Beauty Tips",
        "Skincare",
        "Haircare",
        "Wellness",
        "Trending",
        "Tutorials",
        "Reviews",
        "News",
      ],
    },

    tags: [
      {
        type: String,
        trim: true,
        lowercase: true,
      },
    ],

    isPublished: {
      type: Boolean,
      default: false,
    },

    viewCount: {
      type: Number,
      default: 0,
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    metaTitle: {
      type: String,
      maxlength: [60, "Meta title cannot exceed 60 characters"],
    },

    metaDescription: {
      type: String,
      maxlength: [160, "Meta description cannot exceed 160 characters"],
    },

    metaKeywords: [String],

    readingTime: {
      type: Number,
    },
  },
  { timestamps: true }
);

// ✅ Indexes for faster queries
blogSchema.index({ isPublished: 1 });
blogSchema.index({ category: 1 });
blogSchema.index({ createdAt: -1 });
blogSchema.index({ tags: 1 });

// ✅ Pre-save hook — use async, no next() needed (Mongoose 6+)
blogSchema.pre("save", async function () {
  if (this.isModified("title")) {
    this.slug = this.title
      .toLowerCase()
      .replace(/[^\w\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-");
  }

  if (this.isModified("content")) {
    const wordCount = this.content.split(/\s+/).length;
    this.readingTime = Math.ceil(wordCount / 200);
  }
});

const blogModel = mongoose.model("blog", blogSchema);

export default blogModel;
