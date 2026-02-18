// ⚠️ PRIMERO: Cargar variables de entorno ANTES que cualquier otro módulo
require("dotenv").config({ path: ".env.local" });
if (!process.env.MONGODB_URI) {
  require("dotenv").config();
}

const { connectDB } = require("./db");
const app = require("./app");

// ℹ️ Sets the PORT for our app to have access to it. If no env has been set, we hard code it to 5005
const PORT = process.env.PORT || 5005;

// Solo iniciar el servidor si no estamos en Vercel
if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
  // En local, conectar primero y luego escuchar
  connectDB()
    .then(() => {
      app.listen(PORT, () => {
        console.log(`Server listening on http://localhost:${PORT}`);
      });
    })
    .catch((err) => {
      console.error("Failed to connect to MongoDB:", err.message);
      process.exit(1);
    });
}

// Exportar para Vercel: wrapper async que FUERZA la conexión DB
// antes de que Express procese cualquier request
module.exports = async (req, res) => {
  try {
    await connectDB();
  } catch (err) {
    console.error("❌ Vercel handler: DB connection failed:", err.message);
    res.statusCode = 503;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ message: "Database connection failed", error: err.message }));
    return;
  }
  return app(req, res);
};
