const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");

require("dotenv").config({ path: path.join(__dirname, ".env") });

const app = express();
const allowedOrigins = (process.env.CORS_ORIGIN || process.env.FRONTEND_URL || "*")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

function isVercelAppOrigin(origin) {
  try {
    const url = new URL(origin);
    return typeof url.hostname === "string" && url.hostname.endsWith(".vercel.app");
  } catch (_) {
    return false;
  }
}

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes("*")) return callback(null, true);
      if (isVercelAppOrigin(origin)) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      return callback(null, false);
    },
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
    optionsSuccessStatus: 204,
  })
);
app.use(express.json());

const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI;

// routes
const articleRoutes = require("./routes/articleRoutes");
app.use("/api/articles", articleRoutes);

app.get("/", (req, res) => {
  res.send("BeyondChats Backend Running 🚀");
});

function connectToMongoWithRetry(delayMs = 5000) {
  if (!MONGODB_URI) {
    console.error("MongoDB connection failed", new Error("Missing MONGODB_URI"));
    return;
  }

  mongoose
    .connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 10000,
    })
    .then(() => {
      console.log("MongoDB connected successfully");
    })
    .catch((err) => {
      console.error("MongoDB connection failed", err);
      setTimeout(() => connectToMongoWithRetry(delayMs), delayMs);
    });
}

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
  connectToMongoWithRetry();
});
