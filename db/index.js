const mongoose = require("mongoose");

const MONGO_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/neuro-espacio";

let connectionPromise = null;

async function connectDB() {
  // Si ya hay una conexión, usarla
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
      serverSelectionTimeoutMS: 15000,
      socketTimeoutMS: 45000,
      connectTimeoutMS: 15000,
    })
    .then(() => {
      console.log("✓ MongoDB connected successfully");
      connectionPromise = null; // Reset para evitar reutilizar promise vieja
      return Promise.resolve();
    })
    .catch((err) => {
      console.error("✗ MongoDB connection error:", err.message);
      connectionPromise = null; // Reset para intentar de nuevo
      throw err;
    });
  }

  return connectionPromise;
}

module.exports = { connectDB };