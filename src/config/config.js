import { config as dotenvconfig } from "dotenv";
dotenvconfig();

// ─────────────────────────────────────────────────────────────────
// ENV VALIDATOR — Product Service
// ─────────────────────────────────────────────────────────────────

const REQUIRED_VARS = [
  "MONGO_URI",
  "JWT_SECRET",
  "IMAGEKIT_PUBLIC_KEY",
  "IMAGEKIT_PRIVATE_KEY",
  "IMAGEKIT_URL",
];

const missing = REQUIRED_VARS.filter((key) => !process.env[key]);

if (missing.length > 0) {
  console.error("Missing required environment variables:");
  missing.forEach((key) => console.error(`   - ${key}`));
  console.error("\nAdd the missing variables to your .env file and restart.");
  process.exit(1);
}

const _config = {
  MONGO_URI:            process.env.MONGO_URI,
  JWT_SECRET:           process.env.JWT_SECRET,
  IMAGEKIT_PUBLIC_KEY:  process.env.IMAGEKIT_PUBLIC_KEY,
  IMAGEKIT_PRIVATE_KEY: process.env.IMAGEKIT_PRIVATE_KEY,
  IMAGEKIT_URL:         process.env.IMAGEKIT_URL,
};

export default _config;