const express = require("express");
const router = express.Router();

const Cita = require("../models/Cita.model");

const { isAuthenticated } = require("../middleware/jwt.middleware.js");

router.get("/disponibles", async (req, res) => {
  try {
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

router.get("/:citaId", isAuthenticated, async (req, res) => {
  try {
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

    await Cita.findByIdAndDelete(citaId);

    res.status(200).json({ message: "Cita eliminada correctamente" });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: "Error al eliminar la cita", error: error.message });
  }
});

module.exports = router;
