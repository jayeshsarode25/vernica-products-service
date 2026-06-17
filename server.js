import _config from "./src/config/config.js";
import app from "./src/app.js";
import connectDb from "./src/db/db.js";

const PORT = process.env.PORT || 3002;

app.get("/", (req, res) => {
  res.json({
    message: "Product service is running"
  });
});

app.listen(PORT, "0.0.0.0", async () => {
  console.log(`Product service running on port ${PORT}`);

  try {
    await connectDb();
    console.log("MongoDB connected");
  } catch (error) {
    console.error("MongoDB connection failed:", error.message);
  }
});