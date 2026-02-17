const mongoose = require("mongoose");

const MONGO_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/neuro-espacio";

let connectionPromise = null;

async function connectDB() {
  // Si ya hay una conexión establecida, usarla
  if (mongoose.connection.readyState === 1) {
    console.log("✓ MongoDB connection already established");
    return Promise.resolve();
  }

  // Si hay una conexión en proceso, esperar a ella
  if (mongoose.connection.readyState === 2) {
    console.log("⏳ MongoDB connection in progress...");
    if (connectionPromise) {
      return connectionPromise;
    }
  }

  // Si no hay conexión, crear una nueva
  if (!connectionPromise) {
    connectionPromise = mongoose.connect(MONGO_URI, {
      // Connection timeout - tiempo máximo para conectar
      serverSelectionTimeoutMS: 20000,
      // Socket timeout - tiempo máximo para queries
      socketTimeoutMS: 45000,
      // Connect timeout
      connectTimeoutMS: 20000,
      // Reintentos automáticos
      retryWrites: true,
      w: "majority",
      // Buffer de operaciones mientras se conecta
      bufferCommands: true,
      bufferMaxEntries: 0, // Sin límite de buffer
      // Pool de conexiones
      maxPoolSize: 10,
      minPoolSize: 1,
    })
    .then(() => {
      console.log("✓ MongoDB connected successfully");
      connectionPromise = null;
      return Promise.resolve();
    })
    .catch((err) => {
      console.error("✗ MongoDB connection error:", err.message);
      connectionPromise = null;
      throw err;
    });
  }

  return connectionPromise;
}

module.exports = { connectDB };