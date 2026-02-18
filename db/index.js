const mongoose = require("mongoose");

/**
 * Conecta a MongoDB de forma fiable en Vercel serverless.
 * Lee MONGODB_URI al momento de conectar (no al cargar el módulo)
 * para asegurar que dotenv ya haya cargado las variables.
 */
async function connectDB() {
  const MONGO_URI =
    process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/neuro-espacio";

  if (!MONGO_URI) {
    throw new Error("❌ MONGODB_URI is not defined in environment variables");
  }

  const state = mongoose.connection.readyState;

  // 1 = connected
  if (state === 1) {
    return mongoose;
  }

  // 2 = connecting — esperar a que termine
  if (state === 2) {
    console.log("⏳ Mongoose está conectando, esperando...");
    await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error("Timeout esperando conexión MongoDB"));
      }, 15000);

      mongoose.connection.once("connected", () => {
        clearTimeout(timeout);
        resolve();
      });
      mongoose.connection.once("error", (err) => {
        clearTimeout(timeout);
        reject(err);
      });
    });
    return mongoose;
  }

  // 0 = disconnected, 3 = disconnecting — conectar
  console.log("🔗 Conectando a MongoDB... (readyState:", state, ")");
  console.log("🔗 MONGODB_URI definido:", !!process.env.MONGODB_URI);

  try {
    await mongoose.connect(MONGO_URI, {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      connectTimeoutMS: 10000,
      maxPoolSize: 10,
      minPoolSize: 1,
      retryWrites: true,
      w: "majority",
    });

    // Verificar que la conexión funciona con un ping real
    await mongoose.connection.db.admin().ping();
    console.log("✓ MongoDB conectado y verificado con ping");
  } catch (err) {
    console.error("✗ Error conectando a MongoDB:", err.message);
    // Si falló, desconectar limpiamente para poder reintentar
    try { await mongoose.disconnect(); } catch (_) {}
    throw err;
  }

  return mongoose;
}

module.exports = { connectDB };