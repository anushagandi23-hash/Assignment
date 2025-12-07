require("dotenv").config();
const express = require("express");
const cors = require("cors");

// Initialize database pool first (this initializes the schema)
const pool = require("./db");

const app = express();

// ============ MIDDLEWARE ============
// CORS configuration - allow all origins in production
const allowedOrigins = process.env.NODE_ENV === 'production' 
  ? ['*'] 
  : ['http://localhost:3000', 'http://localhost:5173'];

app.use(cors({
  origin: allowedOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Explicit CORS headers as fallback
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

app.use(express.json());

// ============ ROUTES ============
const bookingRoutes = require("./routes/bookingRoutes");
const authRoutes = require("./routes/authRoutes");

// Mount all routes under /api prefix
app.use("/api/auth", authRoutes);
app.use("/api", bookingRoutes);

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({ status: "ok", message: "Modex Ticket Booking System - Backend" });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});

// Error handler
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ error: "Internal server error" });
});

// ============ BACKGROUND SERVICES ============
const bookingExpiryService = require("./services/bookingExpiryService");

// ============ START SERVER ============
const PORT = process.env.PORT || 4000;
const server = app.listen(PORT, () => {
  console.log(
    `\n🚀 Modex Ticket Booking System Backend running on http://localhost:${PORT}`
  );
  console.log(`📝 API Docs: http://localhost:${PORT}/api/docs (coming soon)`);
  console.log(`💚 Health Check: http://localhost:${PORT}/health\n`);
  
  // Start automatic booking expiry service
  bookingExpiryService.start();
});

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("SIGTERM received, shutting down gracefully...");
  bookingExpiryService.stop();
  server.close(() => {
    console.log("Server closed");
    process.exit(0);
  });
});

process.on("SIGINT", () => {
  console.log("SIGINT received, shutting down gracefully...");
  bookingExpiryService.stop();
  server.close(() => {
    console.log("Server closed");
    process.exit(0);
  });
});

module.exports = app;