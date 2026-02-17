// ℹ️ Gets access to environment variables/settings
// https://www.npmjs.com/package/dotenv
require("dotenv").config({ path: ".env.local" });
// Fallback to .env if .env.local doesn't exist
if (!process.env.MONGODB_URI) {
  require("dotenv").config();
}


// Handles http requests (express is node js framework)
// https://www.npmjs.com/package/express
const express = require("express");

const app = express();
// ℹ️ Connects to the database
const { connectDB } = require("./db");

// Connect to DB on startup (no bloquear si falla)
connectDB().then(() => {
    console.log("✓ Conexión inicial a MongoDB exitosa");
}).catch(err => {
    console.error("✗ Error inicial de conexión a MongoDB:", err.message);
});

// 🔌 Middleware para asegurar conexión a MongoDB en cada request
const { ensureDBConnection } = require("./middleware/db.middleware");
app.use(ensureDBConnection);

// ℹ️ This function is getting exported from the config folder. It runs most pieces of middleware
require("./config")(app);

// 👇 Start handling routes here
const indexRoutes = require("./routes/index.routes");
app.use("/api", indexRoutes);

const authRoutes = require("./routes/auth.routes");
app.use("/auth", authRoutes);

const citaRoutes = require("./routes/cita.routes");
app.use("/api/citas", citaRoutes);

const adminRoutes = require("./routes/admin.routes");
app.use("/api/admin", adminRoutes);



// ❗ To handle errors. Routes that don't exist or errors that you handle in specific routes
require("./error-handling")(app);

module.exports = app;
