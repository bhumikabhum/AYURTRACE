require("dns").setDefaultResultOrder("ipv4first");
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");

const authRoutes = require("./routes/auth");
const batchRoutes = require("./routes/batches");
const eventRoutes = require("./routes/events");
const verifyRoutes = require("./routes/verify");
const statsRoutes = require("./routes/stats");

const app = express();
const PORT = process.env.PORT || 5000;

// ── Security middleware ──
app.use(helmet());
app.use(cors({
  origin: [
    process.env.FRONTEND_URL || "http://localhost:5173",
    "http://localhost:5173",
    "http://localhost:3000",
    // Add your Vercel URL here when deployed
  ],
  credentials: true
}));

// ── Rate limiting ──
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: 200,
  message: { error: "Too many requests, please try again later" }
});
app.use(limiter);

// ── Body parsing ──
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// ── Routes ──
app.use("/api/auth", authRoutes);
app.use("/api/batches", batchRoutes);
app.use("/api/events", eventRoutes);
app.use("/api/verify", verifyRoutes);
app.use("/api/stats", statsRoutes);

// ── Health check ──
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    message: "AyurTrace API is running",
    timestamp: new Date().toISOString(),
    version: "1.0.0"
  });
});

// ── 404 handler ──
app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});

// ── Error handler ──
app.use((err, req, res, next) => {
  console.error("Error:", err.message);
  res.status(err.status || 500).json({
    error: err.message || "Internal server error"
  });
});

app.listen(PORT, () => {
  console.log(`\n🌿 AyurTrace API running on http://localhost:${PORT}`);
  console.log(`📋 Health check: http://localhost:${PORT}/health`);
  console.log(`🔗 Contract: ${process.env.CONTRACT_ADDRESS || "Not set"}\n`);
});

module.exports = app;
