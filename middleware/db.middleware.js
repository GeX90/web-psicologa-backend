const { connectDB } = require("../db");

let isConnected = false;

// Intentar conectar al iniciar (no bloquea)
connectDB()
  .then(() => {
    isConnected = true;
    console.log("✓ Initial MongoDB connection established");
  })
  .catch((err) => {
    console.error("✗ Initial connection failed, will retry on requests:", err.message);
  });

// Middleware para asegurar conexión a MongoDB antes de procesar requests
const ensureDBConnection = async (req, res, next) => {
  try {
    // Si ya está conectado, continuar
    if (isConnected) {
      return next();
    }

    // Si no está conectado, intentar conectar
    console.log("⏳ Attempting to connect to MongoDB...");
    await connectDB();
    isConnected = true;
    console.log("✓ MongoDB connected via middleware");
    next();
  } catch (err) {
    console.error("❌ MongoDB connection failed:", err.message);
    // NO bloquear el request - Mongoose manejará el error cuando intente acceder
    next();
  }
};

module.exports = { ensureDBConnection };


