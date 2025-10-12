const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  username: { type: String, required: true },
  password: { type: String, required: true },
  image: { type: String }, //campo para guardar el nombre de la imagen
});

module.exports = mongoose.model("User", UserSchema);
