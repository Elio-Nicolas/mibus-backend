const mongoose = require("mongoose");

// console.log(" Cargando Bus model");

// Mostrar modelos ya cargados (útil para debug)
//console.log("Modelos cargados actualmente:", Object.keys(mongoose.models));

const busSchema = new mongoose.Schema({
  unitId: { type: String, required: true },      // Unidad / colectivo
  driverId: { type: String, required: true },    // Chofer (userId)

  lineCode: {
    type: String,
    enum: ["A", "E", "ZONA ESTE", "ZONA OESTE"],
    required: true, // obligatorio
  },
  driverName: String,
  lat: Number,
  lon: Number,

  color: String,
  shape: { type: String, default: "circle" },
  isDemo: { type: Boolean, default: false },
  active: { type: Boolean, default: true },
  lastUpdate: { type: Date, default: Date.now },
});

// ✅ Exportar modelo, evitando OverwriteModelError
module.exports = mongoose.models.Bus || mongoose.model("Bus", busSchema);
