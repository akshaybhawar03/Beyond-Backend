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

async function start() {
  try {
    if (!MONGODB_URI) {
      console.error("❌ Missing MONGODB_URI in server/.env");
      process.exit(1);
    }

    await mongoose.connect(MONGODB_URI);
    console.log("✅ MongoDB connected successfully");

    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error("❌ MongoDB connection failed:", err.message);
    process.exit(1);
  }
}

start();
