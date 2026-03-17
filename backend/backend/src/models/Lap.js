/**
 * ==========================================================
 * Archivo: models/Lap.js
 * ----------------------------------------------------------
 * Guarda únicamente vueltas completas confirmadas.
 *
 * No guardamos todos los GPS.
 * Solo persistimos eventos relevantes.
 *
 * Esto mantiene el sistema liviano y escalable.
 * ==========================================================
 */

const mongoose = require("mongoose");

const lapSchema = new mongoose.Schema({
  unitId: {
    type: String,
    required: true
  },

  lineId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Line",
    required: true
  },

  startedAt: {
    type: Date,
    required: true
  },

  completedAt: {
    type: Date,
    required: true
  },

  durationSeconds: {
    type: Number,
    required: true
  }
});

module.exports = mongoose.model("Lap", lapSchema);