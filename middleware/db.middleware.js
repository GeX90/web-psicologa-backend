const mongoose = require("mongoose");
const { connectDB } = require("../db");

// Middleware para asegurar conexión a MongoDB en cada request
const ensureDBConnection = async (req, res, next) => {
  try {
    await connectDB();

    // Doble verificación: asegurarse de que readyState es 1 (connected)
    if (mongoose.connection.readyState !== 1) {
      console.error("❌ MongoDB readyState:", mongoose.connection.readyState, "después de connectDB()");
      return res.status(503).json({
        message: "Base de datos no disponible. Intenta de nuevo en unos segundos.",
      });
    }

    next();
  } catch (err) {
    console.error("❌ Database connection failed:", err.message);
    if (!res.headersSent) {
      res.status(503).json({
        message: "Servicio no disponible. Error de conexión a la base de datos.",
        error: process.env.NODE_ENV !== "production" ? err.message : undefined,
      });
    }
  }
};

module.exports = { ensureDBConnection };


