import { body, validationResult } from "express-validator";
import categoryModel from "../model/category.model.js";

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const formattedErrors = errors.array().map((err) => ({
      field: err.path ?? err.param ?? err.location,
      message: err.msg,
    }));

    return res.status(400).json({
      success: false,
      message: `Validation error: ${formattedErrors
        .map((err) => `${err.field}: ${err.message}`)
        .join(", ")}`,
      errors: formattedErrors,
    });
  }
  
  next(); 
};

const createProductValidators = [
  body("title")
    .isString()
    .trim()
    .notEmpty()
    .withMessage("title is required"),

  body("tagline")
    .optional()
    .isString()
    .withMessage("tagline must be a string")
    .trim()
    .isLength({ max: 160 })
    .withMessage("tagline max length is 160 characters"),

  body("description")
    .optional()
    .isString()
    .withMessage("description must be a string")
    .trim()
    .isLength({ max: 2000 })
    .withMessage("description max length is 2000 characters"),

  body("priceAmount")
    .notEmpty()
    .withMessage("priceAmount is required")
    .bail()
    .isFloat({ gt: 0 })
    .withMessage("priceAmount must be a number > 0"),

  body("priceCurrency")
    .optional()
    .isIn(["USD", "INR"])
    .withMessage("priceCurrency must be USD or INR"),

  body("categoryId")
    .notEmpty()
    .withMessage("categoryId is required")
    .bail()
    .isMongoId()
    .withMessage("categoryId must be a valid MongoDB ID")
    .bail()
    .custom(async (categoryId) => {
      const category = await categoryModel.findById(categoryId);
      if (!category) {
        throw new Error("Category does not exist");
      }
      if (!category.isActive) {
        throw new Error("Category is not active");
      }
    }),

  body("subCategory")
    .optional()
    .trim()
    .toLowerCase()
    .isIn(["male", "female", "unisex"])
    .withMessage("subCategory must be male, female, or unisex"),

  body("size")
    .optional()
    .isString()
    .withMessage("size must be a string")
    .trim()
    .isLength({ max: 80 })
    .withMessage("size max length is 80 characters"),

  body([
    "benefits",
    "howToUse",
    "ingredients",
    "warningCaution",
    "warningAndCaution",
    "productDetails.benefits",
    "productDetails.howToUse",
    "productDetails.ingredients",
    "productDetails.warningCaution",
    "productDetails.warningAndCaution",
  ])
    .optional()
    .isString()
    .withMessage("product detail fields must be strings")
    .trim()
    .isLength({ max: 2000 })
    .withMessage("product detail fields max length is 2000 characters"),

  body("rating")
    .optional()
    .isFloat({ min: 0, max: 5 })
    .withMessage("rating must be between 0 and 5"),

  body("stock")
    .optional()
    .isInt({ min: 0 })
    .withMessage("stock must be a non-negative integer"),

  handleValidationErrors,
];

const updateProductValidators = [
  body("title")
    .optional()
    .isString()
    .trim()
    .notEmpty()
    .withMessage("title cannot be empty"),

  body("tagline")
    .optional()
    .isString()
    .withMessage("tagline must be a string")
    .trim()
    .isLength({ max: 160 })
    .withMessage("tagline max length is 160 characters"),

  body("description")
    .optional()
    .isString()
    .withMessage("description must be a string")
    .trim()
    .isLength({ max: 2000 })
    .withMessage("description max length is 2000 characters"),

  body("priceAmount")
    .optional()
    .isFloat({ gt: 0 })
    .withMessage("priceAmount must be a number > 0"),

  body("priceCurrency")
    .optional()
    .isIn(["USD", "INR"])
    .withMessage("priceCurrency must be USD or INR"),

  body("categoryId")
    .optional()
    .isMongoId()
    .withMessage("categoryId must be a valid MongoDB ID")
    .bail()
    .custom(async (categoryId) => {
      const category = await categoryModel.findById(categoryId);
      if (!category) {
        throw new Error("Category does not exist");
      }
      if (!category.isActive) {
        throw new Error("Category is not active");
      }
    }),

  body("subCategory")
    .optional()
    .trim()
    .toLowerCase()
    .isIn(["male", "female", "unisex"])
    .withMessage("subCategory must be male, female, or unisex"),

  body("size")
    .optional()
    .isString()
    .withMessage("size must be a string")
    .trim()
    .isLength({ max: 80 })
    .withMessage("size max length is 80 characters"),

  body([
    "benefits",
    "howToUse",
    "ingredients",
    "warningCaution",
    "warningAndCaution",
    "productDetails.benefits",
    "productDetails.howToUse",
    "productDetails.ingredients",
    "productDetails.warningCaution",
    "productDetails.warningAndCaution",
  ])
    .optional()
    .isString()
    .withMessage("product detail fields must be strings")
    .trim()
    .isLength({ max: 2000 })
    .withMessage("product detail fields max length is 2000 characters"),

  body("rating")
    .optional()
    .isFloat({ min: 0, max: 5 })
    .withMessage("rating must be between 0 and 5"),

  body("stock")
    .optional()
    .isInt({ min: 0 })
    .withMessage("stock must be a non-negative integer"),

  body("isActive")
    .optional()
    .isBoolean()
    .withMessage("isActive must be a boolean"),

  handleValidationErrors,
];

const createCategoryValidators = [
  body("name")
    .isString()
    .trim()
    .notEmpty()
    .withMessage("name is required")
    .bail()
    .isLength({ min: 3, max: 50 })
    .withMessage("name must be between 3 and 50 characters"),

  body("description")
    .isString()
    .trim()
    .notEmpty()
    .withMessage("description is required")
    .bail()
    .isLength({ min: 10, max: 200 })
    .withMessage("description must be between 10 and 200 characters"),

  body("displayOrder")
    .optional()
    .isInt({ min: 0 })
    .withMessage("displayOrder must be a non-negative integer"),

  handleValidationErrors,
];

const updateCategoryValidators = [
  body("name")
    .optional()
    .isString()
    .trim()
    .notEmpty()
    .withMessage("name cannot be empty")
    .bail()
    .isLength({ min: 3, max: 50 })
    .withMessage("name must be between 3 and 50 characters"),

  body("description")
    .optional()
    .isString()
    .trim()
    .notEmpty()
    .withMessage("description cannot be empty")
    .bail()
    .isLength({ min: 10, max: 200 })
    .withMessage("description must be between 10 and 200 characters"),

  body("displayOrder")
    .optional()
    .isInt({ min: 0 })
    .withMessage("displayOrder must be a non-negative integer"),

  body("isActive")
    .optional()
    .isBoolean()
    .withMessage("isActive must be a boolean"),

  handleValidationErrors,
];

export {
  createProductValidators,
  updateProductValidators,
  createCategoryValidators,
  updateCategoryValidators,
  handleValidationErrors,
};
