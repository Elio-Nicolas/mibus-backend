const mongoose = require("mongoose");

const tripEventSchema = new mongoose.Schema({
  driverId: String,
  unitId: String,
  type: { type: String, enum: ["START", "STOP"] },
  timestamp: { type: Date, default: Date.now },
});

module.exports =
  mongoose.models.TripEvent ||
  mongoose.model("TripEvent", tripEventSchema);
