const express = require("express");
const router = express.Router();
const User = require("../models/User");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("../config/cloudinary");


// Configuración de almacenamiento Cloudinary

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "mibus_profiles", // Carpeta dentro de tu cuenta Cloudinary
    allowed_formats: ["jpg", "png", "jpeg"],
    transformation: [{ width: 400, height: 400, crop: "limit" }],
  },
});

const upload = multer({ storage });

// Registro de nuevo usuario

router.post("/signup", upload.single("image"), async (req, res) => {
  const { username, password } = req.body;
  const imagePath = req.file ? req.file.path : null; //URL de Cloudinary

  console.log("Datos recibidos:");
  console.log("Username:", username);
  console.log("Password:", password);
  console.log("Imagen:", imagePath);

  try {
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ error: "El usuario ya existe" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      username,
      password: hashedPassword,
      image: imagePath,
    });

    await newUser.save();

    res.status(201).json({ message: "Usuario creado correctamente" });
  } catch (err) {
    console.error("Error al registrar usuario:", err);
    res.status(500).json({ error: "No se pudo registrar el usuario" });
  }
});


// Inicio de sesión (login)

router.post("/signin", async (req, res) => {
  const { username, password } = req.body;

  console.log("Datos recibidos:", { username, password });

  try {
    const user = await User.findOne({ username });

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ error: "Credenciales inválidas" });
    }

    const token = jwt.sign({ userId: user._id }, "secreto_mibus", {
      expiresIn: "1h",
    });

    res.json({
      token,
      userId: user._id,
      username: user.username,
      image: user.image, // URL de Cloudinary
    });
  } catch (err) {
    console.error("Error al iniciar sesión:", err);
    res.status(500).json({ error: "Error en el servidor" });
  }
});


//Actualizar perfil (nombre + imagen)

router.put("/upload/:id", upload.single("image"), async (req, res) => {
  const { username } = req.body;
  const imagePath = req.file ? req.file.path : undefined; //URL de Cloudinary

  try {
    const updates = {};
    if (username) updates.username = username;
    if (imagePath) updates.image = imagePath;

    const updatedUser = await User.findByIdAndUpdate(req.params.id, updates, {
      new: true,
    });

    if (!updatedUser)
      return res.status(404).json({ error: "Usuario no encontrado" });

    res.json({
      message: "Perfil actualizado correctamente",
      user: updatedUser,
    });
  } catch (err) {
    console.error("Error al actualizar perfil:", err);
    res.status(500).json({ error: "Error en el servidor" });
  }
});

module.exports = router;
