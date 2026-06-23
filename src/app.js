import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import productRoutes from "./routes/product.route.js";
import categoryRoute from "./routes/Category.routes.js";
import blogRoutes from './routes/blog.routes.js';
import { applySecurityMiddleware } from "./middleware/Security.middleware .js";
import { authMiddleware } from "./middleware/auth.middleware.js";
import { globalErrorHandler } from "./utils/error.utils.js"; 

const app = express();
app.set("trust proxy", 1);

const buildCookieVariants = () => {
  const variants = [];

  if (process.env.COOKIE_DOMAIN) {
    variants.push({
      httpOnly: true,
      secure: true,
      sameSite: "none",
      domain: process.env.COOKIE_DOMAIN,
      path: "/",
    });
    variants.push({
      httpOnly: true,
      secure: false,
      sameSite: "lax",
      domain: process.env.COOKIE_DOMAIN,
      path: "/",
    });
  }

  return variants;
};

app.locals.cookieVariants = buildCookieVariants();

const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(",") || [
  "https://varnikaorganics.com",
  "http://localhost:5173",
];

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("CORS blocked origin: " + origin));
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  optionsSuccessStatus: 200,
};

app.use(cors(corsOptions));

// ✅ INCREASE REQUEST SIZE LIMIT (ADD THIS - BEFORE OTHER MIDDLEWARE)
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

app.use(cookieParser());
app.use(authMiddleware);
applySecurityMiddleware(app);

app.get("/", (req, res) => {
  res.status(200).json({ message: "Product service is running" });
});

app.use("/api/products", productRoutes);
app.use("/api/categories", categoryRoute);
app.use('/api/blogs', blogRoutes);

app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

app.use(globalErrorHandler);

export default app;
