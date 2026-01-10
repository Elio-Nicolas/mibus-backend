const express = require("express");
const router = express.Router();
const User = require("../models/User");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
//const multer = require("multer");
//const { CloudinaryStorage } = require("multer-storage-cloudinary");
//const cloudinary = require("../config/cloudinary");
const requireAdmin = require("../middlewares/requireAdmin");
const mongoose = require("mongoose");

/* ======================================================
   CONFIGURACIÓN CLOUDINARY
====================================================== */
/* 
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "mibus_profiles",
    allowed_formats: ["jpg", "png", "jpeg"],
    transformation: [{ width: 400, height: 400, crop: "limit" }],
  },
});

const upload = multer({ storage }); */

/* ======================================================
   REGISTRO DE USUARIO
   (por defecto USUARIO)
====================================================== */

router.post("/signup", async (req, res) => {

  //console.log(" BODY SIGNUP:", req.body);
  const { username, password } = req.body;

  try {
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ error: "El usuario ya existe" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      username,
      password: hashedPassword,
      role: "USUARIO"
    });

    await newUser.save();
    //console.log(" Usuario guardado en:", newUser.username, "| DB:", mongoose.connection.name);

    res.status(201).json({
      message: "Usuario creado correctamente"
    });
  } catch (err) {
    console.error(" Error en signup:", err);
    res.status(500).json({ error: "Error interno del servidor" });
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

    // ===== CREACION DE TOKEN ===== //
   const token = jwt.sign(
  {
    userId: user._id,
    role: user.role,
    username: user.username
  },
  process.env.JWT_SECRET,
  { expiresIn: "1h" }
);


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


/* ======================================================
   ACTUALIZAR PERFIL
====================================================== */

router.put("/upload/:id", (req, res, next) => next(), async (req, res) => {
  const { username } = req.body;
  const imagePath = req.file ? req.file.path : undefined;

  try {
    const updates = {};
    if (username) updates.username = username;
    if (imagePath) updates.image = imagePath;

    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    res.json({
      message: "Perfil actualizado correctamente",
      user: updatedUser,
    });
  } catch (err) {
    console.error("Error al actualizar perfil:", err);
    res.status(500).json({ error: "Error en el servidor" });
  }
});


router.put("/assign-role/:id", requireAdmin, async (req, res) => {
  const { role, assignedUnit } = req.body;

  try {
    const updates = {};
    if (role) updates.role = role;
    if (assignedUnit !== undefined) updates.assignedUnit = assignedUnit;

    const user = await User.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    res.json({
      message: "Rol / unidad actualizados",
      user,
    });
  } catch (err) {
    console.error("Error al asignar rol:", err);
    res.status(500).json({ error: "Error en el servidor" });
  }
});

router.get("/", requireAdmin, async (req, res) => {
  try {
    const users = await User.find().select("-password");
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: "Error al obtener usuarios" });
  }
});


module.exports = router;
