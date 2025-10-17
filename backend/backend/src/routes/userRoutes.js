const express = require("express");
const router = express.Router();
const User = require("../models/User");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const multer = require("multer");
const path = require("path");

// Configuración del almacenamiento con multer
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/"); // Carpeta donde se guardan las imágenes
  },
  filename: function (req, file, cb) {
    const uniqueName = Date.now() + path.extname(file.originalname); // nombre único
    cb(null, uniqueName);
  },
});

const upload = multer({ storage });

// Registrar nuevo usuario
router.post("/signup", upload.single("image"), async (req, res) => {
  const { username, password } = req.body;
  const imagePath = req.file ? req.file.filename : null;

  console.log("Datos recibidos:");
  console.log("Username:", username);
  console.log("Password:", password);
  console.log("Imagen:", req.file); // <--- VER ESTO!! ELIO

  try {
    // Verificar si ya existe el usuario
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ error: "El usuario ya existe" });
    }

    // Hashear la contraseña
    const hashedPassword = await bcrypt.hash(password, 10);

    // Crear nuevo usuario
    const newUser = new User({ username, password: hashedPassword, image: imagePath, });
    await newUser.save();

    res.status(201).json({ message: "Usuario creado correctamente" });
  } catch (err) {
    console.error(" Error al registrar usuario:", err);
    res.status(500).json({ error: "No se pudo registrar el usuario" });
  }
});

// Login y generación de token
router.post("/signin", async (req, res) => {
  const { username, password, image } = req.body;
 

  console.log("Datos recibidos:", { username, password, image}); // Verifica que los datos del formulario están llegando correctamente

  try {
    // Buscar al usuario
    const user = await User.findOne({ username });

    // Validar existencia y contraseña
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ error: "Credenciales inválidas" });
    }

    // Generar token JWT
    const token = jwt.sign({ userId: user._id }, "secreto_mibus", {
      expiresIn: "1h",
    });

   res.json({
    token,
    userId: user._id,     // para que el front sepa quién es el usuario
    username: user.username,
    image: user.image
   });

  } catch (err) {
    console.error(" Error al iniciar sesión:", err);
    res.status(500).json({ error: "Error en el servidor" });
  }
});

// end point para cambio de perfil

//  Actualizar perfil (nombre + imagen)
router.put("/upload/:id", upload.single("image"), async (req, res) => {
  const { username } = req.body; // nuevo nombre
  const imagePath = req.file ? req.file.filename : undefined;

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
    console.error(" Error al actualizar perfil:", err);
    res.status(500).json({ error: "Error en el servidor" });
  }
});

module.exports = router;
