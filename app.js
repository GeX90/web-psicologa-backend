// Handles http requests (express is node js framework)
const express = require("express");
const app = express();
const { connectDB } = require("./db");

// ℹ️ This function is getting exported from the config folder. It runs most pieces of middleware
require("./config")(app);

// 🔌 Middleware: asegurar conexión a MongoDB ANTES de cualquier ruta
// Esto es CRITICO para Vercel serverless - cada request debe tener la conexión lista
app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (err) {
    console.error("❌ DB middleware - conexión fallida:", err.message);
    return res.status(503).json({ message: "Base de datos no disponible", error: err.message });
  }
});

// 🏥 Health check para diagnosticar conexión a MongoDB
app.get("/api/health", async (req, res) => {
  const mongoose = require("mongoose");
  const state = mongoose.connection.readyState;
  const stateMap = { 0: "disconnected", 1: "connected", 2: "connecting", 3: "disconnecting" };
  
  const info = {
    status: state === 1 ? "ok" : "error",
    mongodb: {
      readyState: state,
      readyStateText: stateMap[state] || "unknown",
      host: mongoose.connection.host || "none",
      name: mongoose.connection.name || "none",
    },
    env: {
      MONGODB_URI_SET: !!process.env.MONGODB_URI,
      NODE_ENV: process.env.NODE_ENV || "not set",
      VERCEL: !!process.env.VERCEL,
    },
    timestamp: new Date().toISOString(),
  };

  // Intentar ping
  if (state === 1) {
    try {
      await mongoose.connection.db.admin().ping();
      info.mongodb.ping = "ok";
    } catch (e) {
      info.mongodb.ping = "failed: " + e.message;
      info.status = "error";
    }
  }

  res.status(state === 1 ? 200 : 503).json(info);
});

// 👇 Start handling routes here
const indexRoutes = require("./routes/index.routes");
app.use("/api", indexRoutes);

const authRoutes = require("./routes/auth.routes");
app.use("/auth", authRoutes);

const citaRoutes = require("./routes/cita.routes");
app.use("/api/citas", citaRoutes);

const adminRoutes = require("./routes/admin.routes");
app.use("/api/admin", adminRoutes);

const cronRoutes = require("./routes/cron.routes");
app.use("/api/cron", cronRoutes);



// ❗ To handle errors. Routes that don't exist or errors that you handle in specific routes
require("./error-handling")(app);

module.exports = app;
