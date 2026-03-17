/**
 * ==========================================================
 * Archivo: models/Line.js
 * ----------------------------------------------------------
 * Modelo de Línea de Transporte
 *
 * Este modelo es una EVOLUCIÓN del modelo original.
 *
 * Mantiene:
 * - code
 * - name
 * - color
 * - active
 * - units
 *
 * Agrega:
 * - route (LineString completo del recorrido)
 * - startPoint (zona inicio vuelta)
 * - endPoint (zona fin vuelta)
 * - tolerancias configurables
 *
 * Importante:
 * NO rompe compatibilidad con:
 * - server.js
 * - creación inicial de Línea A
 * - lineCode usado en Bus
 *
 * ==========================================================
 */

const mongoose = require("mongoose");

const LineSchema = new mongoose.Schema({
  /**
   * Código corto de línea
   * Ej: "A", "E", "ZONA ESTE"
   * Se usa actualmente en Bus.lineCode
   */
  code: {
    type: String,
    required: true,
    unique: true
  },

  /**
   * Nombre descriptivo
   */
  name: {
    type: String
  },

  /**
   * Color usado en el mapa
   */
  color: {
    type: String,
    required: true
  },

  /**
   * Si la línea está activa
   */
  active: {
    type: Boolean,
    default: true
  },

  /**
   * Lista de unidades asignadas
   * Ej: ["A1", "A2", "A3"]
   */
  units: [{
    type: String
  }],

  // ==========================================================
  // 🔽 NUEVA SECCIÓN GEOESPACIAL (NO rompe nada existente)
  // ==========================================================

  /**
   * Recorrido completo de la línea
   * Formato GeoJSON LineString
   *
   * coordinates: [[lng, lat], [lng, lat], ...]
   *
   * Es opcional para no romper líneas existentes.
   */
  route: {
    type: {
      type: String,
      enum: ["LineString"],
      default: undefined
    },
    coordinates: {
      type: [[Number]],
      default: undefined
    }
  },

  /**
   * Punto oficial de inicio de vuelta
   */
  startPoint: {
    type: {
      type: String,
      enum: ["Point"],
      default: undefined
    },
    coordinates: {
      type: [Number], // [lng, lat]
      default: undefined
    }
  },

  /**
   * Punto oficial de fin de vuelta
   */
  endPoint: {
    type: {
      type: String,
      enum: ["Point"],
      default: undefined
    },
    coordinates: {
      type: [Number],
      default: undefined
    }
  },

  /**
   * Radio de detección en metros
   * para inicio de vuelta
   */
  toleranceStartMeters: {
    type: Number,
    default: 50
  },

  /**
   * Radio de detección en metros
   * para fin de vuelta
   */
  toleranceEndMeters: {
    type: Number,
    default: 50
  },

  /**
   * Tiempo mínimo válido para vuelta completa
   * Evita falsos positivos por GPS errático
   */
  minLapTimeSeconds: {
    type: Number,
    default: 300
  }

}, { timestamps: true });

/**
 * Indexes geoespaciales
 * Solo se activan si existen los campos.
 */
LineSchema.index({ route: "2dsphere" });
LineSchema.index({ startPoint: "2dsphere" });
LineSchema.index({ endPoint: "2dsphere" });

module.exports = mongoose.models.Line || mongoose.model("Line", LineSchema);