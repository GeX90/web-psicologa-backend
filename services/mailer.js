const nodemailer = require("nodemailer");

// ------------------------------------------------------------------
// Transporter – usa Gmail con App Password almacenada en variables de entorno
// ------------------------------------------------------------------
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,       // bdmm1993nps@gmail.com
    pass: process.env.GMAIL_APP_PASSWORD, // App Password de 16 caracteres
  },
});

// Verifica la conexión al iniciar (no bloquea el arranque del servidor)
transporter.verify((error) => {
  if (error) {
    console.error("❌ Nodemailer: error de configuración SMTP:", error.message);
  } else {
    console.log("✅ Nodemailer: transporter listo para enviar correos");
  }
});

// ------------------------------------------------------------------
// Helper – formatea una fecha Date a "DD/MM/YYYY"
// ------------------------------------------------------------------
function formatFecha(fecha) {
  const d = new Date(fecha);
  const dia = String(d.getDate()).padStart(2, "0");
  const mes = String(d.getMonth() + 1).padStart(2, "0");
  const anio = d.getFullYear();
  return `${dia}/${mes}/${anio}`;
}

// ------------------------------------------------------------------
// Estilos CSS compartidos para los emails
// ------------------------------------------------------------------
const emailStyles = `
  body { font-family: 'Segoe UI', Arial, sans-serif; background: #f5f5f5; margin: 0; padding: 0; }
  .container { max-width: 600px; margin: 40px auto; background: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
  .header { background: #5b8fa8; padding: 32px 40px; text-align: center; }
  .header h1 { color: #ffffff; margin: 0; font-size: 22px; font-weight: 600; }
  .header p { color: #d6eaf8; margin: 6px 0 0; font-size: 14px; }
  .body { padding: 32px 40px; color: #333333; }
  .body p { line-height: 1.7; margin: 0 0 14px; }
  .info-box { background: #f0f7fb; border-left: 4px solid #5b8fa8; border-radius: 4px; padding: 16px 20px; margin: 20px 0; }
  .info-box p { margin: 6px 0; font-size: 15px; }
  .info-box strong { color: #5b8fa8; }
  .warning-box { background: #fff8e1; border-left: 4px solid #f9a825; border-radius: 4px; padding: 16px 20px; margin: 20px 0; }
  .warning-box p { margin: 6px 0; font-size: 14px; color: #555; }
  .footer { background: #f0f0f0; padding: 20px 40px; text-align: center; font-size: 12px; color: #888; }
`;

// ------------------------------------------------------------------
// 1. BIENVENIDA tras el registro
// ------------------------------------------------------------------
async function sendWelcomeEmail(user) {
  const { name, email } = user;

  const html = `
    <!DOCTYPE html><html><head><style>${emailStyles}</style></head>
    <body>
      <div class="container">
        <div class="header">
          <h1>¡Bienvenida, ${name}!</h1>
          <p>Beatriz de Mergelina – Psicóloga</p>
        </div>
        <div class="body">
          <p>Hola <strong>${name}</strong>,</p>
          <p>Tu cuenta ha sido creada correctamente. Ya puedes acceder a tu área personal y reservar una cita.</p>
          <p>Si en cualquier momento necesitas ayuda, no dudes en ponerte en contacto con nosotros respondiendo a este correo.</p>
          <p>Un saludo,<br/><strong>Beatriz de Mergelina – Psicóloga</strong></p>
        </div>
        <div class="footer">Este mensaje fue enviado a ${email}. Si no creaste esta cuenta, ignora este correo.</div>
      </div>
    </body></html>
  `;

  await transporter.sendMail({
    from: `"Beatriz de Mergelina – Psicóloga" <${process.env.GMAIL_USER}>`,
    to: email,
    subject: "¡Bienvenida! Tu cuenta ha sido creada",
    html,
  });
}

// ------------------------------------------------------------------
// 2. CONFIRMACIÓN de nueva cita
// ------------------------------------------------------------------
async function sendCitaConfirmationEmail(user, cita) {
  const { name, email } = user;

  const html = `
    <!DOCTYPE html><html><head><style>${emailStyles}</style></head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Cita confirmada ✓</h1>
          <p>Beatriz de Mergelina – Psicóloga</p>
        </div>
        <div class="body">
          <p>Hola <strong>${name}</strong>,</p>
          <p>Tu cita ha sido reservada correctamente. Aquí tienes el resumen:</p>
          <div class="info-box">
            <p><strong>Fecha:</strong> ${formatFecha(cita.fecha)}</p>
            <p><strong>Hora:</strong> ${cita.hora}</p>
            <p><strong>Motivo:</strong> ${cita.motivo}</p>
            ${cita.notas ? `<p><strong>Notas:</strong> ${cita.notas}</p>` : ""}
          </div>
          <div class="warning-box">
            <p>⚠️ Recuerda que las citas solo pueden modificarse o cancelarse con un mínimo de <strong>48 horas de antelación</strong>.</p>
          </div>
          <p>Si tienes alguna duda, no dudes en contactarnos.</p>
          <p>Un saludo,<br/><strong>Beatriz de Mergelina – Psicóloga</strong></p>
        </div>
        <div class="footer">Este mensaje fue enviado a ${email}.</div>
      </div>
    </body></html>
  `;

  await transporter.sendMail({
    from: `"Beatriz de Mergelina – Psicóloga" <${process.env.GMAIL_USER}>`,
    to: email,
    subject: `Cita confirmada – ${formatFecha(cita.fecha)} a las ${cita.hora}`,
    html,
  });
}

// ------------------------------------------------------------------
// 3. CONFIRMACIÓN de edición de cita
// ------------------------------------------------------------------
async function sendCitaEditadaEmail(user, cita) {
  const { name, email } = user;

  const html = `
    <!DOCTYPE html><html><head><style>${emailStyles}</style></head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Cita actualizada ✏️</h1>
          <p>Beatriz de Mergelina – Psicóloga</p>
        </div>
        <div class="body">
          <p>Hola <strong>${name}</strong>,</p>
          <p>Tu cita ha sido modificada correctamente. Estos son los nuevos datos:</p>
          <div class="info-box">
            <p><strong>Fecha:</strong> ${formatFecha(cita.fecha)}</p>
            <p><strong>Hora:</strong> ${cita.hora}</p>
            <p><strong>Motivo:</strong> ${cita.motivo}</p>
            ${cita.notas ? `<p><strong>Notas:</strong> ${cita.notas}</p>` : ""}
          </div>
          <div class="warning-box">
            <p>⚠️ Recuerda que las citas solo pueden modificarse o cancelarse con un mínimo de <strong>48 horas de antelación</strong>.</p>
          </div>
          <p>Hasta pronto,<br/><strong>Beatriz de Mergelina – Psicóloga</strong></p>
        </div>
        <div class="footer">Este mensaje fue enviado a ${email}.</div>
      </div>
    </body></html>
  `;

  await transporter.sendMail({
    from: `"Beatriz de Mergelina – Psicóloga" <${process.env.GMAIL_USER}>`,
    to: email,
    subject: `Tu cita ha sido actualizada – ${formatFecha(cita.fecha)} a las ${cita.hora}`,
    html,
  });
}

// ------------------------------------------------------------------
// 4. CONFIRMACIÓN de cancelación de cita
// ------------------------------------------------------------------
async function sendCitaCanceladaEmail(user, cita) {
  const { name, email } = user;

  const html = `
    <!DOCTYPE html><html><head><style>${emailStyles}</style></head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Cita cancelada</h1>
          <p>Beatriz de Mergelina – Psicóloga</p>
        </div>
        <div class="body">
          <p>Hola <strong>${name}</strong>,</p>
          <p>Tu cita ha sido cancelada. Aquí están los detalles de la cita eliminada:</p>
          <div class="info-box">
            <p><strong>Fecha:</strong> ${formatFecha(cita.fecha)}</p>
            <p><strong>Hora:</strong> ${cita.hora}</p>
            <p><strong>Motivo:</strong> ${cita.motivo}</p>
          </div>
          <p>Si lo deseas, puedes reservar una nueva cita desde tu área personal.</p>
          <p>Un saludo,<br/><strong>Beatriz de Mergelina – Psicóloga</strong></p>
        </div>
        <div class="footer">Este mensaje fue enviado a ${email}.</div>
      </div>
    </body></html>
  `;

  await transporter.sendMail({
    from: `"Beatriz de Mergelina – Psicóloga" <${process.env.GMAIL_USER}>`,
    to: email,
    subject: `Cita cancelada – ${formatFecha(cita.fecha)} a las ${cita.hora}`,
    html,
  });
}

// ------------------------------------------------------------------
// 5. RECORDATORIO 72 horas antes de la cita
// ------------------------------------------------------------------
async function sendCitaReminderEmail(user, cita) {
  const { name, email } = user;

  const html = `
    <!DOCTYPE html><html><head><style>${emailStyles}</style></head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Recordatorio de cita 🔔</h1>
          <p>Beatriz de Mergelina – Psicóloga</p>
        </div>
        <div class="body">
          <p>Hola <strong>${name}</strong>,</p>
          <p>Te recordamos que tienes una cita programada en <strong>menos de 72 horas</strong>:</p>
          <div class="info-box">
            <p><strong>Fecha:</strong> ${formatFecha(cita.fecha)}</p>
            <p><strong>Hora:</strong> ${cita.hora}</p>
            <p><strong>Motivo:</strong> ${cita.motivo}</p>
            ${cita.notas ? `<p><strong>Notas:</strong> ${cita.notas}</p>` : ""}
          </div>
          <div class="warning-box">
            <p>⚠️ Si necesitas modificar o cancelar tu cita, recuerda que el plazo límite es <strong>48 horas antes</strong> de la misma. Pasado ese tiempo ya no será posible realizar cambios.</p>
          </div>
          <p>¡Hasta pronto!<br/><strong>Beatriz de Mergelina – Psicóloga</strong></p>
        </div>
        <div class="footer">Este mensaje fue enviado a ${email}.</div>
      </div>
    </body></html>
  `;

  await transporter.sendMail({
    from: `"Beatriz de Mergelina – Psicóloga" <${process.env.GMAIL_USER}>`,
    to: email,
    subject: `Recordatorio: tienes cita el ${formatFecha(cita.fecha)} a las ${cita.hora}`,
    html,
  });
}

module.exports = {
  sendWelcomeEmail,
  sendCitaConfirmationEmail,
  sendCitaEditadaEmail,
  sendCitaCanceladaEmail,
  sendCitaReminderEmail,
};
