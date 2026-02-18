const mongoose = require("mongoose");
const { connectDB } = require("../db");

// Middleware para asegurar conexión a MongoDB en cada request
const ensureDBConnection = async (req, res, next) => {
  const startTime = Date.now();
  try {
    console.log(`🔌 [${req.method} ${req.path}] Verificando conexión DB...`);
    await connectDB();

    const state = mongoose.connection.readyState;
    const elapsed = Date.now() - startTime;
    console.log(`🔌 [${req.method} ${req.path}] DB readyState: ${state} (${elapsed}ms)`);

    if (state !== 1) {
      console.error("❌ MongoDB readyState:", state, "después de connectDB()");
      return res.status(503).json({
        message: "Base de datos no disponible. Intenta de nuevo en unos segundos.",
      });
    }

    next();
  } catch (err) {
    const elapsed = Date.now() - startTime;
    console.error(`❌ [${req.method} ${req.path}] DB connection failed (${elapsed}ms):`, err.message);
    if (!res.headersSent) {
      res.status(503).json({
        message: "Servicio no disponible. Error de conexión a la base de datos.",
        error: err.message,
      });
    }
  }
};

module.exports = { ensureDBConnection };


