const express = require("express");
const router = express.Router();
const User = require("../models/User");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

/* =========================
   REGISTRO
========================= */
router.post("/signup", async (req, res) => {
  const { username, password, role } = req.body;

  try {
    const exists = await User.findOne({ username });
    if (exists) {
      return res.status(400).json({ error: "Usuario ya existe" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = new User({
      username,
      password: hashedPassword,
    });

    await user.save();

    res.status(201).json({ message: "Usuario creado" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al crear Usuario" });
  }
});

/* =========================
   LOGIN
========================= */
router.post("/signin", async (req, res) => {
  const { username, password } = req.body;

  try {
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(401).json({ error: "Credenciales inválidas" });
    }

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) {
      return res.status(401).json({ error: "Credenciales inválidas" });
    }

    const jwt = require("jsonwebtoken");

      module.exports = (req, res, next) => {
      const authHeader = req.headers.authorization;

     if (!authHeader) {
      return res.status(401).json({ error: "No token" });
     }

      const token = authHeader.split(" ")[1];

      try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = decoded; // { userId }
      next();
     } catch (err) {
       return res.status(401).json({ error: "Token inválido" });
     }
     };

    res.json({
     token,
     userId: user._id,
     username: user.username,
     image: user.image,
     role: user.role  
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error en login" });
  }
});

module.exports = router;
