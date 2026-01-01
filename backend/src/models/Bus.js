const mongoose = require("mongoose");

const BusSchema = new mongoose.Schema({
  unitId: { type: String, required: true },      // Unidad / colectivo
  driverId: { type: String, required: true },    // Chofer (userId)
  driverName: String,

  lat: Number,
  lon: Number,

  color: String,
  shape: { type: String, default: "circle" },

  active: { type: Boolean, default: true },
  lastUpdate: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Bus", busSchema);
