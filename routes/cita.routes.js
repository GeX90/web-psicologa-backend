const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");

const Cita = require("../models/Cita.model");
const User = require("../models/User.model");
const Disponibilidad = require("../models/Disponibilidad.model");
const { connectDB } = require("../db");

const { isAuthenticated } = require("../middleware/jwt.middleware.js");

// Servicio de emails
const {
  sendCitaConfirmationEmail,
  sendCitaEditadaEmail,
  sendCitaCanceladaEmail,
} = require("../services/mailer");

router.get("/disponibles", async (req, res) => {
  try {
    await connectDB();
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    const fechasDisponibles = [];
    const fechasConCitas = new Set();

    const hace30Dias = new Date(hoy);
    hace30Dias.setDate(hace30Dias.getDate() + 30);

    const citasProximas = await Cita.find({
      fecha: { $gte: hoy, $lt: hace30Dias },
    });

    citasProximas.forEach((cita) => {
      const fechaStr = cita.fecha.toISOString().split("T")[0];
      fechasConCitas.add(fechaStr);
    });

    for (let i = 0; i < 30; i++) {
      const fecha = new Date(hoy);
      fecha.setDate(fecha.getDate() + i);

      const diaSemana = fecha.getDay();
      if (diaSemana === 0 || diaSemana === 6) {
        continue;
      }

      const fechaStr = fecha.toISOString().split("T")[0];
      const tieneCitas = fechasConCitas.has(fechaStr);

      fechasDisponibles.push({
        fecha: fechaStr,
        disponible: !tieneCitas,
        citasEseDia: citasProximas.filter(
          (c) => c.fecha.toISOString().split("T")[0] === fechaStr
        ).length,
      });
    }

    res.status(200).json(fechasDisponibles);
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({
        message: "Error al obtener fechas disponibles",
        error: error.message,
      });
  }
});

router.get("/", isAuthenticated, async (req, res) => {
  try {
    await connectDB();
    const usuarioId = req.payload._id;
    const esAdmin = req.payload.role === "ADMIN";

    let citas;
    if (esAdmin) {
      citas = await Cita.find()
        .populate("usuario", "name email")
        .sort({ fecha: 1 });
    } else {
      citas = await Cita.find({ usuario: usuarioId }).sort({ fecha: 1 });
    }

    res.status(200).json(citas);
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: "Error al obtener las citas", error: error.message });
  }
});

router.get("/available/:date", isAuthenticated, async (req, res) => {
  try {
    await connectDB();
    const { date } = req.params;

    const fechaDate = new Date(date);
    if (isNaN(fechaDate.getTime())) {
      return res
        .status(400)
        .json({ message: "Fecha inválida. Usa formato ISO: YYYY-MM-DD" });
    }

    const diaSemana = fechaDate.getDay();
    if (diaSemana === 0 || diaSemana === 6) {
      return res
        .status(400)
        .json({
          message:
            "No hay citas disponibles los fines de semana. Solo de lunes a viernes",
        });
    }

    const inicioDelDia = new Date(fechaDate);
    inicioDelDia.setHours(0, 0, 0, 0);
    const finDelDia = new Date(fechaDate);
    finDelDia.setHours(23, 59, 59, 999);

    const citasDelDia = await Cita.find({
      fecha: { $gte: inicioDelDia, $lte: finDelDia },
    });

    const horariosDisponibles = [];
    const horasOcupadas = new Set(citasDelDia.map((cita) => cita.hora));

    for (let hora = 9; hora < 18; hora++) {
      if (hora === 13) continue;

      const horarioFormato = `${String(hora).padStart(2, "0")}:00`;
      if (!horasOcupadas.has(horarioFormato)) {
        horariosDisponibles.push(horarioFormato);
      }
    }

    res.status(200).json({
      fecha: date,
      horariosDisponibles,
      horariosOcupados: Array.from(horasOcupadas),
    });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({
        message: "Error al obtener horarios disponibles",
        error: error.message,
      });
  }
});

// GET /api/citas/disponibilidad - Obtener horarios disponibles para usuarios (público)
// IMPORTANTE: Esta ruta debe estar ANTES de /:citaId para evitar que el parámetro dinámico la capture
router.get("/disponibilidad", async (req, res) => {
  try {
    await connectDB();

    // Construir el filtro base
    const filtro = { disponible: true };
    
    // Si se proporcionan fechas de rango, filtrar por ellas
    const { fechaInicio, fechaFin } = req.query;
    if (fechaInicio && fechaFin) {
      // Parsear fechas como UTC para manejar correctamente las zonas horarias
      // Expandimos el rango para capturar cualquier documento que caiga en el mes
      const inicio = new Date(fechaInicio + 'T00:00:00.000Z');
      // Retroceder 1 día para capturar registros que puedan tener offset de timezone
      inicio.setDate(inicio.getDate() - 1);
      
      const fin = new Date(fechaFin + 'T23:59:59.999Z');
      // Avanzar 1 día para capturar registros que puedan tener offset de timezone
      fin.setDate(fin.getDate() + 1);
      
      filtro.fecha = {
        $gte: inicio,
        $lte: fin
      };
      
    }

    // Obtener todas las fechas/horas marcadas como disponibles
    const disponibles = await Disponibilidad.find(filtro)
      .sort({ fecha: 1, hora: 1 })
      .lean();

    res.status(200).json(disponibles);
  } catch (error) {
    console.error("Error en GET /api/citas/disponibilidad:", error);
    res.status(500).json({ 
      message: "Error al obtener disponibilidad",
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

router.get("/:citaId", isAuthenticated, async (req, res) => {
  try {
    await connectDB();
    const { citaId } = req.params;
    const usuarioId = req.payload._id;
    const esAdmin = req.payload.role === "ADMIN";

    const cita = await Cita.findById(citaId).populate("usuario", "name email");

    if (!cita) {
      return res.status(404).json({ message: "Cita no encontrada" });
    }

    // El admin puede ver cualquier cita, los usuarios solo las suyas
    if (!esAdmin && cita.usuario._id.toString() !== usuarioId.toString()) {
      return res
        .status(403)
        .json({ message: "No tienes permiso para acceder a esta cita" });
    }

    res.status(200).json(cita);
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: "Error al obtener la cita", error: error.message });
  }
});

router.post("/", isAuthenticated, async (req, res) => {
  try {
    await connectDB();
    const { fecha, hora, motivo, notas } = req.body;
    const usuarioId = req.payload._id;

    if (!fecha || !hora || !motivo) {
      return res.status(400).json({ message: "Faltan campos requeridos" });
    }

    const fechaDate = new Date(fecha);
    if (isNaN(fechaDate.getTime())) {
      return res
        .status(400)
        .json({ message: "Fecha inválida. Usa formato ISO: YYYY-MM-DD" });
    }

    const nuevaCita = await Cita.create({
      fecha: fechaDate,
      hora,
      motivo,
      notas,
      usuario: usuarioId,
    });

    // Enviar email de confirmación al usuario
    const usuario = await User.findById(usuarioId).select("name email");
    if (usuario) {
      sendCitaConfirmationEmail(
        { name: usuario.name, email: usuario.email },
        nuevaCita
      ).catch((err) => console.error("Error enviando email confirmación cita:", err.message));
    }

    res.status(201).json(nuevaCita);
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: "Error al crear la cita", error: error.message });
  }
});

router.put("/:citaId", isAuthenticated, async (req, res) => {
  try {
    await connectDB();
    const { citaId } = req.params;
    const { fecha, hora, motivo, notas } = req.body;
    const usuarioId = req.payload._id;
    const esAdmin = req.payload.role === "ADMIN";

    const cita = await Cita.findById(citaId);

    if (!cita) {
      return res.status(404).json({ message: "Cita no encontrada" });
    }

    // Si NO es admin, aplicar todas las restricciones
    if (!esAdmin) {
      // Verificar que sea dueño de la cita
      if (cita.usuario.toString() !== usuarioId.toString()) {
        return res
          .status(403)
          .json({ message: "No tienes permiso para actualizar esta cita" });
      }

      // Verificar restricción de 48 horas
      const ahora = new Date();
      const horasRestantes = (cita.fecha - ahora) / (1000 * 60 * 60);
      if (horasRestantes < 48) {
        return res
          .status(403)
          .json({
            message:
              "No puedes editar una cita con menos de 48 horas de anticipación",
          });
      }
    }

    if (fecha) {
      const fechaDate = new Date(fecha);
      if (isNaN(fechaDate.getTime())) {
        return res
          .status(400)
          .json({ message: "Fecha inválida. Usa formato ISO: YYYY-MM-DD" });
      }
      cita.fecha = fechaDate;
    }

    if (hora) cita.hora = hora;
    if (motivo) cita.motivo = motivo;
    if (notas !== undefined) cita.notas = notas;

    await cita.save();

    // Populate para devolver información del usuario si es admin
    if (esAdmin) {
      await cita.populate("usuario", "name email");
    }

    // Enviar email de confirmación de edición al usuario (siempre)
    const usuarioEdicion = await User.findById(cita.usuario).select("name email");
    if (usuarioEdicion) {
      sendCitaEditadaEmail(
        { name: usuarioEdicion.name, email: usuarioEdicion.email },
        cita
      ).catch((err) => console.error("Error enviando email edición cita:", err.message));
    }

    res.status(200).json(cita);
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: "Error al actualizar la cita", error: error.message });
  }
});

router.delete("/:citaId", isAuthenticated, async (req, res) => {
  try {
    await connectDB();
    const { citaId } = req.params;
    const usuarioId = req.payload._id;
    const esAdmin = req.payload.role === "ADMIN";

    const cita = await Cita.findById(citaId);

    if (!cita) {
      return res.status(404).json({ message: "Cita no encontrada" });
    }

    // Si NO es admin, aplicar todas las restricciones
    if (!esAdmin) {
      // Verificar que sea dueño de la cita
      if (cita.usuario.toString() !== usuarioId.toString()) {
        return res
          .status(403)
          .json({ message: "No tienes permiso para eliminar esta cita" });
      }

      // Verificar restricción de 48 horas
      const ahora = new Date();
      const horasRestantes = (cita.fecha - ahora) / (1000 * 60 * 60);
      if (horasRestantes < 48) {
        return res
          .status(403)
          .json({
            message:
              "No puedes eliminar una cita con menos de 48 horas de anticipación",
          });
      }
    }

    // Guardar datos de la cita antes de eliminar para el email
    const datosParaEmail = {
      fecha: cita.fecha,
      hora: cita.hora,
      motivo: cita.motivo,
    };
    const usuarioCancelacion = await User.findById(cita.usuario).select("name email");

    await Cita.findByIdAndDelete(citaId);

    // Enviar email de cancelación al usuario
    if (usuarioCancelacion) {
      sendCitaCanceladaEmail(
        { name: usuarioCancelacion.name, email: usuarioCancelacion.email },
        datosParaEmail
      ).catch((err) => console.error("Error enviando email cancelación cita:", err.message));
    }

    res.status(200).json({ message: "Cita eliminada correctamente" });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: "Error al eliminar la cita", error: error.message });
  }
});

// TEST endpoint - verificar que las rutas funcionan
router.get("/test", (req, res) => {
  res.status(200).json({ message: "Test endpoint works!", timestamp: new Date() });
});

module.exports = router;

