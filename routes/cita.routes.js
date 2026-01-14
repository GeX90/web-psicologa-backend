const express = require("express");
const router = express.Router();

const Cita = require("../models/Cita.model");

const { isAuthenticated } = require("../middleware/jwt.middleware.js");


router.post("/", isAuthenticated, async (req, res) => {
  try {
    const { fecha, hora, motivo, notas } = req.body;
    const usuarioId = req.payload._id;

    if (!fecha || !hora || !motivo) {
      return res.status(400).json({ message: "Faltan campos requeridos" });
    }

    // Validar que fecha sea una fecha válida
    const fechaDate = new Date(fecha);
    if (isNaN(fechaDate.getTime())) {
      return res.status(400).json({ message: "Fecha inválida. Usa formato ISO: YYYY-MM-DD" });
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
    res.status(500).json({ message: "Error al crear la cita", error: error.message });
  }
});

module.exports = router;

