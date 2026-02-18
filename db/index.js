const mongoose = require("mongoose");

// ⚠️ CRITICO: Desactivar buffering globalmente.
// Sin esto, si la conexión no está lista, Mongoose encola queries
// y espera 10s antes de dar timeout. Con esto, fallan inmediatamente.
mongoose.set("bufferCommands", false);

const MONGO_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/neuro-espacio";

// Log de diagnóstico (sin exponer credenciales)
console.log("🔧 MONGODB_URI definido:", !!process.env.MONGODB_URI);
if (MONGO_URI) {
  // Mostrar solo el protocolo y host, ocultar credenciales
  try {
    const parsed = new URL(MONGO_URI);
    console.log("🔧 MONGODB_URI host:", parsed.hostname);
  } catch {
    console.log("🔧 MONGODB_URI empieza con:", MONGO_URI.substring(0, 20) + "...");
  }
} else {
  console.error("🔧 MONGODB_URI: NO DEFINIDO");
}

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
 * Valida el estado real de la conexión con un ping.
 */
async function connectDB() {
  // 1. Si hay conexión cacheada, verificar que realmente esté viva con un ping
  if (cached.conn && mongoose.connection.readyState === 1) {
    try {
      await mongoose.connection.db.admin().ping();
      return cached.conn;
    } catch (pingErr) {
      console.warn("⚠️ Ping a MongoDB falló. Reconectando...", pingErr.message);
      cached.conn = null;
      cached.promise = null;
      // Forzar desconexión limpia
      try { await mongoose.disconnect(); } catch (_) {}
    }
  } else if (cached.conn) {
    // readyState no es 1
    console.warn("⚠️ readyState:", mongoose.connection.readyState, "- Reconectando...");
    cached.conn = null;
    cached.promise = null;
    try { await mongoose.disconnect(); } catch (_) {}
  }

  // 2. Si ya hay un intento de conexión en curso, esperar
  if (cached.promise) {
    try {
      cached.conn = await cached.promise;
      return cached.conn;
    } catch (err) {
      cached.promise = null;
      cached.conn = null;
    }
  }

  // 3. Crear nueva conexión
  console.log("🔗 Conectando a MongoDB...");
  console.log("🔗 readyState antes de connect:", mongoose.connection.readyState);

  cached.promise = mongoose
    .connect(MONGO_URI, {
      bufferCommands: false,
      serverSelectionTimeoutMS: 8000,
      socketTimeoutMS: 30000,
      connectTimeoutMS: 8000,
      maxPoolSize: 10,
      minPoolSize: 1,
      retryWrites: true,
      w: "majority",
    })
    .then((client) => {
      console.log("✓ MongoDB conectado. readyState:", mongoose.connection.readyState);
      return client;
    })
    .catch((err) => {
      console.error("✗ Fallo de conexión a MongoDB:", err.message);
      console.error("✗ Error completo:", err.name, err.code);
      cached.promise = null;
      cached.conn = null;
      throw err;
    });

  cached.conn = await cached.promise;
  return cached.conn;
}

module.exports = { connectDB };