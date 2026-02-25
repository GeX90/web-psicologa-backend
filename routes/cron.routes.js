/**
 * Endpoint para el cron job de Vercel.
 * Vercel lo llama automáticamente cada hora (según vercel.json).
 * También puede llamarse manualmente con la cabecera Authorization correcta.
 *
 * URL: GET /api/cron/reminders
 */
const express = require("express");
const router = express.Router();

const Cita = require("../models/Cita.model");
const User = require("../models/User.model");
const { connectDB } = require("../db");
const { sendCitaReminderEmail } = require("../services/mailer");

router.get("/reminders", async (req, res) => {
  // Protección básica: comprueba el header Authorization para evitar llamadas no autorizadas
  const authHeader = req.headers.authorization;
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    await connectDB();

    const ahora = new Date();
    const desde = new Date(ahora.getTime() + 71 * 60 * 60 * 1000);
    const hasta = new Date(ahora.getTime() + 73 * 60 * 60 * 1000);

    const citasPendientes = await Cita.find({
      fecha: { $gte: desde, $lte: hasta },
      reminderSent: false,
    });

    let enviados = 0;
    let errores = 0;

    for (const cita of citasPendientes) {
      try {
        const usuario = await User.findById(cita.usuario).select("name email");
        if (!usuario) continue;

        await sendCitaReminderEmail(
          { name: usuario.name, email: usuario.email },
          cita
        );

        cita.reminderSent = true;
        await cita.save();
        enviados++;
      } catch (err) {
        console.error(`Error en recordatorio para cita ${cita._id}:`, err.message);
        errores++;
      }
    }

    console.log(`[Cron reminders] Enviados: ${enviados}, Errores: ${errores}`);
    res.status(200).json({ ok: true, total: citasPendientes.length, enviados, errores });
  } catch (err) {
    console.error("Error en cron/reminders:", err.message);
    res.status(500).json({ ok: false, error: err.message });
  }
});

module.exports = router;
