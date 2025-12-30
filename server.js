const express = require("express");
const mongoose = require("mongoose");
const path = require("path");

require("dotenv").config({ path: path.join(__dirname, ".env") });

const app = express();
app.use((req, res, next) => {
  const allowedOrigins = (process.env.CORS_ORIGIN || process.env.FRONTEND_URL || "http://localhost:3000")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  const origin = req.headers.origin;
  if (origin && allowedOrigins.includes(origin)) {
    res.header("Access-Control-Allow-Origin", origin);
  }
  res.header("Vary", "Origin");
  res.header("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    return res.sendStatus(204);
  }

  next();
});
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
