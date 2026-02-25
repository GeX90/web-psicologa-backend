// ⚠️ PRIMERO: Cargar variables de entorno ANTES que cualquier otro módulo
require("dotenv").config({ path: ".env.local" });
if (!process.env.MONGODB_URI) {
  require("dotenv").config();
}

const { connectDB } = require("./db");
const app = require("./app");
const { startReminderCron } = require("./cron/reminderCron");

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

      // Iniciar el cron de recordatorios (solo en entornos con servidor persistente)
      startReminderCron();
    })
    .catch((err) => {
      console.error("Failed to connect to MongoDB:", err.message);
      process.exit(1);
    });
}

// Exportar Express app directamente para Vercel
// La conexión DB se maneja en el middleware dentro de app.js
module.exports = app;
