const mongoose = require("mongoose");

const MONGO_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/neuro-espacio";

// Log de diagnóstico (sin exponer credenciales)
console.log("🔧 MONGODB_URI definido:", !!process.env.MONGODB_URI);
console.log("🔧 MONGODB_URI empieza con:", MONGO_URI ? MONGO_URI.substring(0, 20) + "..." : "NO DEFINIDO");

if (!MONGO_URI) {
  throw new Error("❌ MONGODB_URI is not defined in environment variables");
}

// Cache global para persistir entre invocaciones en Vercel
let cached = global.mongooseCache;
if (!cached) {
  cached = global.mongooseCache = { conn: null, promise: null };
}

/**
 * Conecta a MongoDB. Reutiliza conexión si está activa.
 * Valida el estado real de la conexión para evitar usar conexiones muertas.
 */
async function connectDB() {
  // 1. Si hay conexión cacheada, verificar que realmente esté viva
  if (cached.conn) {
    const state = mongoose.connection.readyState;
    // 1 = connected — la conexión está activa
    if (state === 1) {
      return cached.conn;
    }
    // La conexión cacheada ya no está viva, limpiar
    console.warn("⚠️ Conexión cacheada inválida (readyState:", state, "). Reconectando...");
    cached.conn = null;
    cached.promise = null;
  }

  // 2. Si ya hay un intento de conexión en curso, esperar
  if (cached.promise) {
    try {
      cached.conn = await cached.promise;
      return cached.conn;
    } catch (err) {
      // Si el intento en curso falló, limpiar y reintentar abajo
      cached.promise = null;
      cached.conn = null;
    }
  }

  // 3. Crear nueva conexión
  console.log("🔗 Conectando a MongoDB...");
  cached.promise = mongoose
    .connect(MONGO_URI, {
      bufferCommands: false,
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      connectTimeoutMS: 10000,
      maxPoolSize: 10,
      minPoolSize: 1,
      retryWrites: true,
      w: "majority",
    })
    .then((client) => {
      console.log("✓ MongoDB conectado correctamente");
      return client;
    })
    .catch((err) => {
      console.error("✗ Fallo de conexión a MongoDB:", err.message);
      cached.promise = null;
      cached.conn = null;
      throw err;
    });

  cached.conn = await cached.promise;
  return cached.conn;
}

module.exports = { connectDB };