const express = require("express");
const router = express.Router();
const User = require("../models/User");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
//const multer = require("multer");
//const { CloudinaryStorage } = require("multer-storage-cloudinary");
//const cloudinary = require("../config/cloudinary");
//const requireAdmin = require("../middlewares/requireAdmin");
const mongoose = require("mongoose");
const { auth, allowRoles } = require("../middlewares/auth");

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

router.put(
  "/assign-role/:id",
  auth,
  allowRoles("ADMIN"),
  async (req, res) => {
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
      res.status(500).json({ error: "Error en el servidor" });
    }
  }
);



router.get(
  "/",
  auth,
  allowRoles("ADMIN"),
  async (req, res) => {
    try {
      const users = await User.find().select("-password");
      res.json(users);
    } catch (err) {
      res.status(500).json({ error: "Error al obtener usuarios" });
    }
  }
);


module.exports = router;
