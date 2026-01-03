const express = require("express");
const router = express.Router();
const User = require("../models/User");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
//const multer = require("multer");
//const { CloudinaryStorage } = require("multer-storage-cloudinary");
//const cloudinary = require("../config/cloudinary");
const requireAdmin = require("../middlewares/requireAdmin");

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

router.post("/signup", (req, res, next) => next(), async (req, res) => {
  const { username, password } = req.body;
  const imagePath = req.file ? req.file.path : null;

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
      role: "USUARIO", // 🔐 SIEMPRE por defecto
    });

    await newUser.save();

    res.status(201).json({
      message: "Usuario creado correctamente",
    });
  } catch (err) {
    console.error("Error al registrar usuario:", err);
    res.status(500).json({ error: "No se pudo registrar el usuario" });
  }
});

/* ======================================================
   LOGIN
   (DEVUELVE ROL + UNIDAD)
====================================================== */

router.post("/signin", async (req, res) => {
  const { username, password } = req.body;

  try {
    const user = await User.findOne({ username });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ error: "Credenciales inválidas" });
    }

    const token = jwt.sign({
     userId: user._id,
     username: user.username,
     role: user.role
     },
    process.env.JWT_SECRET,
     { expiresIn: "1d" }
    );


    res.json({
      token,
      userId: user._id,
      username: user.username,
      role: user.role,
      assignedUnit: user.assignedUnit || null,
      image: user.image,
    });
  } catch (err) {
    console.error("Error al iniciar sesión:", err);
    res.status(500).json({ error: "Error en el servidor" });
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

/* ======================================================
   (FUTURO) ASIGNAR ROL / UNIDAD
   👉 SOLO ADMIN (lo usamos en Paso C)
====================================================== */

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

/* ======================================================
   METODO GET
====================================================== */

router.get("/", requireAdmin, async (req, res) => {
  try {
    const users = await User.find().select("-password");
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: "Error al obtener usuarios" });
  }
});


module.exports = router;
