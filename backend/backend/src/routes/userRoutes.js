const express = require("express");
const router = express.Router();
const User = require("../models/User");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");

// 🔐 Registrar nuevo usuario
router.post("/signup", async (req, res) => {
  const { username, password } = req.body;

  try {
    // Verificar si ya existe el usuario
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ error: "El usuario ya existe" });
    }

    // Hashear la contraseña
    const hashedPassword = await bcrypt.hash(password, 10);

    // Crear nuevo usuario
    const newUser = new User({ username, password: hashedPassword });
    await newUser.save();

    res.status(201).json({ message: "Usuario creado correctamente" });
  } catch (err) {
    console.error("❌ Error al registrar usuario:", err);
    res.status(500).json({ error: "No se pudo registrar el usuario" });
  }
});

// 🔑 Login y generación de token
router.post("/signin", async (req, res) => {
  const { username, password } = req.body;

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

    res.json({ token, username: user.username });
  } catch (err) {
    console.error("❌ Error al iniciar sesión:", err);
    res.status(500).json({ error: "Error en el servidor" });
  }
});

module.exports = router;
