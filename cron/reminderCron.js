const cron = require("node-cron");
const Cita = require("../models/Cita.model");
const User = require("../models/User.model");
const { connectDB } = require("../db");
const { sendCitaReminderEmail } = require("../services/mailer");

/**
 * Cron job que se ejecuta cada hora.
 * Busca citas que:
 *   - Están entre 71 y 73 horas desde ahora (ventana de 2 h centrada en las 72 h)
 *   - Aún no han recibido el recordatorio (reminderSent: false)
 * Envía el email de recordatorio y marca la cita como notificada.
 */
function startReminderCron() {
  // Ejecutar cada hora en el minuto 0
  cron.schedule("0 * * * *", async () => {
    console.log(`[${new Date().toISOString()}] ⏰ Cron: comprobando recordatorios de 72 h...`);

    try {
      await connectDB();

      const ahora = new Date();

      // Ventana: entre 71 h y 73 h desde ahora
      const desde = new Date(ahora.getTime() + 71 * 60 * 60 * 1000);
      const hasta = new Date(ahora.getTime() + 73 * 60 * 60 * 1000);

      const citasPendientes = await Cita.find({
        fecha: { $gte: desde, $lte: hasta },
        reminderSent: false,
      });

      if (citasPendientes.length === 0) {
        console.log("  → No hay citas que recordar en esta ventana.");
        return;
      }

      console.log(`  → ${citasPendientes.length} cita(s) encontrada(s) para recordar.`);

      for (const cita of citasPendientes) {
        try {
          const usuario = await User.findById(cita.usuario).select("name email");

          if (!usuario) {
            console.warn(`  → Usuario no encontrado para la cita ${cita._id}, omitiendo.`);
            continue;
          }

          await sendCitaReminderEmail(
            { name: usuario.name, email: usuario.email },
            cita
          );

          // Marcar como enviado para no volver a notificar
          cita.reminderSent = true;
          await cita.save();

          console.log(`  → Recordatorio enviado a ${usuario.email} (cita ${cita._id})`);
        } catch (err) {
          console.error(`  → Error procesando cita ${cita._id}:`, err.message);
        }
      }
    } catch (err) {
      console.error("  → Error en el cron de recordatorios:", err.message);
    }
  });

  console.log("✅ Cron de recordatorios 72 h iniciado (se ejecuta cada hora).");
}

module.exports = { startReminderCron };
