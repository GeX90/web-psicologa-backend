const { connectDB } = require("../db");

// Middleware para asegurar conexión a MongoDB antes de procesar requests
const ensureDBConnection = async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (err) {
    console.error("❌ Failed to connect to MongoDB:", err.message);
    res.status(503).json({
      message: "Database connection failed. Please try again later.",
      error: err.message,
    });
  }
};

module.exports = { ensureDBConnection };
