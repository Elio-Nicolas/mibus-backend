// models/Line.js
const mongoose = require("mongoose");

const LineSchema = new mongoose.Schema({
  code: { 
    type: String, 
    required: true, 
    unique: true // A, E, ZONA ESTE, etc
  },

  name: { 
    type: String 
  },

  color: { 
    type: String, 
    required: true // ej: "#ff0000"
  },

  active: { 
    type: Boolean, 
    default: true 
  },

  units: [{
    type: String // ["A1", "A2", "A3", "A4", "A5"]
  }]
});

module.exports = mongoose.model("Line", LineSchema);
