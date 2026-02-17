const mongoose = require("mongoose");

const MONGO_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/neuro-espacio";

if (!MONGO_URI) {
  throw new Error("❌ MONGODB_URI is not defined in environment variables");
}

// Global cache para la conexión (persist entre invocaciones en Vercel)
let cached = global.mongoose || { conn: null, promise: null };

if (!global.mongoose) {
  global.mongoose = cached;
}

/**
 * Conecta a MongoDB de forma eficiente en Vercel
 * Reutiliza la conexión en caché si existe
 */
async function connectDB() {
  // Si ya hay conexión establecida, usarla
  if (cached.conn) {
    console.log("✓ Reusing cached MongoDB connection");
    return cached.conn;
  }

  // Si hay conexión en proceso, esperar a ella
  if (cached.promise) {
    console.log("⏳ Waiting for existing connection promise...");
    cached.conn = await cached.promise;
    return cached.conn;
  }

  // Crear nueva conexión
  console.log("🔗 Establishing new MongoDB connection...");
  cached.promise = mongoose.connect(MONGO_URI, {
    // NO bufferear operaciones - fallar rápido si no conecta
    bufferCommands: false,
    // Socket timeout más corto
    serverSelectionTimeoutMS: 8000,
    socketTimeoutMS: 30000,
    connectTimeoutMS: 8000,
    // Pool de conexiones
    maxPoolSize: 5,
    minPoolSize: 1,
    // Reintentos
    retryWrites: true,
    w: "majority",
  })
    .then((client) => {
      console.log("✓ MongoDB connected successfully");
      return client;
    })
    .catch((err) => {
      console.error("✗ MongoDB connection failed:", err.message);
      cached.promise = null; // Reset promise para reintentar
      throw err;
    });

  cached.conn = await cached.promise;
  return cached.conn;
}

module.exports = { connectDB };