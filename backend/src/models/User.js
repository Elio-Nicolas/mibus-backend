const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  username: { type: String, required: true },
  password: { type: String, required: true },
  image: { type: String },

  // ===== ROLES ===== //
  role: {
    type: String,
    enum: ["ADMIN", "CHOFER", "USUARIO"],
    default: "USUARIO",
  },

  // ===== SOLO CHOFER ===== //
  assignedUnit: {
    type: String,
    default: null,
  },
});

module.exports = mongoose.model("User", UserSchema, "users");

