const { Schema, model } = require("mongoose");

const disponibilidadSchema = new Schema(
  {
    fecha: {
      type: Date,
      required: [true, "Fecha is required."],
    },
    hora: {
      type: String,
      required: [true, "Hora is required."],
    },
    disponible: {
      type: Boolean,
      default: false, // Por defecto no disponible
    },
  },
  {
    timestamps: true,
  }
);

// Índice único para evitar duplicados de fecha + hora
disponibilidadSchema.index({ fecha: 1, hora: 1 }, { unique: true });

const Disponibilidad = model("Disponibilidad", disponibilidadSchema);

module.exports = Disponibilidad;
