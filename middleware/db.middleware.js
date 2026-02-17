const { connectDB } = require("../db");

// Middleware para asegurar conexión a MongoDB en cada request
const ensureDBConnection = async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (err) {
    // Si no hay conexión, pasar error a siguiente middleware
    console.error("❌ Database connection failed:", err.message);
    // NO bloquear - dejar que Express maneje el error en las rutas
    next();
  }
};

module.exports = { ensureDBConnection };


