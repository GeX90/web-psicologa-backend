const express = require("express");
const router = express.Router();

const User = require("../models/User.model");
const Cita = require("../models/Cita.model");

const { isAuthenticated, isAdmin } = require("../middleware/jwt.middleware.js");

// GET /api/admin/users - Obtener todos los usuarios (solo admin)
router.get("/users", isAuthenticated, isAdmin, async (req, res) => {
  try {
    const usuarios = await User.find().select("-password").sort({ createdAt: -1 });
    res.status(200).json(usuarios);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error al obtener los usuarios", error: error.message });
  }
});

// GET /api/admin/users/:userId - Obtener un usuario específico (solo admin)
router.get("/users/:userId", isAuthenticated, isAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    const usuario = await User.findById(userId).select("-password");
    
    if (!usuario) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }
    
    res.status(200).json(usuario);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error al obtener el usuario", error: error.message });
  }
});

// GET /api/admin/citas - Obtener todas las citas con información del usuario (solo admin)
router.get("/citas", isAuthenticated, isAdmin, async (req, res) => {
  try {
    const citas = await Cita.find()
      .populate("usuario", "name email")
      .sort({ fecha: 1 });
    
    res.status(200).json(citas);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error al obtener las citas", error: error.message });
  }
});

// PUT /api/admin/citas/:citaId - Editar cualquier cita (solo admin)
router.put("/citas/:citaId", isAuthenticated, isAdmin, async (req, res) => {
  try {
    const { citaId } = req.params;
    const { fecha, hora, motivo, notas, usuario } = req.body;

    const cita = await Cita.findById(citaId);

    if (!cita) {
      return res.status(404).json({ message: "Cita no encontrada" });
    }

    // El admin puede cambiar cualquier campo, incluyendo el usuario asignado
    if (fecha) {
      const fechaDate = new Date(fecha);
      if (isNaN(fechaDate.getTime())) {
        return res.status(400).json({ message: "Fecha inválida. Usa formato ISO: YYYY-MM-DD" });
      }
      cita.fecha = fechaDate;
    }

    if (hora) cita.hora = hora;
    if (motivo) cita.motivo = motivo;
    if (notas !== undefined) cita.notas = notas;
    if (usuario) cita.usuario = usuario;

    await cita.save();

    // Populate para devolver la cita con info del usuario
    await cita.populate("usuario", "name email");

    res.status(200).json(cita);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error al actualizar la cita", error: error.message });
  }
});

// DELETE /api/admin/citas/:citaId - Eliminar cualquier cita (solo admin)
router.delete("/citas/:citaId", isAuthenticated, isAdmin, async (req, res) => {
  try {
    const { citaId } = req.params;

    const cita = await Cita.findById(citaId);

    if (!cita) {
      return res.status(404).json({ message: "Cita no encontrada" });
    }

    await Cita.findByIdAndDelete(citaId);

    res.status(200).json({ message: "Cita eliminada correctamente" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error al eliminar la cita", error: error.message });
  }
});

// PUT /api/admin/users/:userId - Actualizar rol de usuario (solo admin)
router.put("/users/:userId", isAuthenticated, isAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    const { role, name, email } = req.body;

    const usuario = await User.findById(userId);

    if (!usuario) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    if (role && ["USER", "ADMIN"].includes(role)) {
      usuario.role = role;
    }
    if (name) usuario.name = name;
    if (email) usuario.email = email;

    await usuario.save();

    // No devolver la contraseña
    const usuarioActualizado = usuario.toObject();
    delete usuarioActualizado.password;

    res.status(200).json(usuarioActualizado);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error al actualizar el usuario", error: error.message });
  }
});

// DELETE /api/admin/users/:userId - Eliminar un usuario (solo admin)
router.delete("/users/:userId", isAuthenticated, isAdmin, async (req, res) => {
  try {
    const { userId } = req.params;

    const usuario = await User.findById(userId);

    if (!usuario) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    // Eliminar también todas las citas del usuario
    await Cita.deleteMany({ usuario: userId });

    await User.findByIdAndDelete(userId);

    res.status(200).json({ message: "Usuario y sus citas eliminados correctamente" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error al eliminar el usuario", error: error.message });
  }
});

module.exports = router;
