const mongoose = require("mongoose");

const WorkSessionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },

  role: {
    type: String,
    enum: ["CHOFER", "INSPECTOR"],
    required: true,
  },

  unitId: {
    type: String,
    default: null,
  },

  line: {
    type: String,
    default: null,
  },

  startTime: {
    type: Date,
    required: true,
  },

  endTime: Date,

  status: {
    type: String,
    enum: ["ACTIVE", "CLOSED"],
    required: true
  },
}, {
  timestamps: true
});

module.exports = mongoose.model("WorkSession", WorkSessionSchema);
