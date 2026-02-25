const { Schema, model } = require("mongoose");

const citaSchema = new Schema(
  {
    fecha: {
      type: Date,
      required: [true, "Fecha is required."],
    },
    hora: {
      type: String,
      required: [true, "Hora is required."],
    },
    motivo: {
      type: String,
      required: [true, "Motivo is required."],
    },
    notas: {
      type: String,
    },
    usuario: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    reminderSent: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

const Cita = model("Cita", citaSchema);

module.exports = Cita;