const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

const router = express.Router();

const ROLES = ["ADMIN", "CHOFER", "INSPECTOR", "USUARIO"];

router.post("/signup", async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: "Datos incompletos" });
  }

  try {
    const exists = await User.findOne({ username });
    if (exists) {
      return res.status(400).json({ error: "Usuario ya existe" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = new User({
      username,
      password: hashedPassword,
      role: "USUARIO", // por defecto
    });

    await user.save();

    res.status(201).json({ message: "Usuario creado" });
  } catch (err) {
    res.status(500).json({ error: "Error creando usuario" });
  }
});

router.post("/signin", async (req, res) => {
  console.log("POST /signin recibido", req.body);

  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: "Datos incompletos" });
  }

  try {
    const user = await User.findOne({ username });
    console.log("USER ENCONTRADO:", user);

    if (!user) {
      return res.status(401).json({ error: "Credenciales inválidas" });
    }

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) {
      return res.status(401).json({ error: "Credenciales inválidas" });
    }

    const token = jwt.sign(
      {
        userId: user._id,
        role: user.role,
      },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    return res.json({
      token,
      userId: user._id,
      username: user.username,
      role: user.role,
    });

  } catch (err) {
    console.log("ERROR EN SIGNIN:", err);
    return res.status(500).json({ error: "Error en login" });
  }
});

module.exports = router;  
