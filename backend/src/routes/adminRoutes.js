const express = require("express");
const router = express.Router();

const auth = require("../middlewares/auth");
const requireAdmin = require("../middlewares/requireAdmin");
const User = require("../models/User");

/* =========================
   TEST ADMIN
========================= */
router.get("/ping", auth, requireAdmin, (req, res) => {
  res.json({ ok: true });
});

/* =========================
   LISTAR USUARIOS
========================= */
router.get("/users", auth, requireAdmin, async (req, res) => {
  try {
    const users = await User.find().select("username role assignedUnit");
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: "Error obteniendo usuarios" });
  }
});

/* =========================
   ELIMINAR USUARIO (ADMIN)
========================= */
router.delete("/users/:id", auth, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    await User.findByIdAndDelete(id);

    res.json({ ok: true });
  } catch (err) {
    console.error(" Error al eliminar este usuario:", err);
    res.status(500).json({ error: "Error al eliminar este usuario" });
  }
});

/* =========================
   CAMBIAR ROL (ADMIN)
========================= */
router.put("/users/:id/role", auth, requireAdmin, async (req, res) => {
  const { id } = req.params;
  const { role } = req.body;

  try {
    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    user.role = role;
    await user.save();

    res.json({
      msg: "Rol actualizado",
      user: {
        id: user._id,
        username: user.username,
        role: user.role
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error actualizando Rol" });
  }
});

/* =========================
   ASIGNAR UNIDAD A CHOFER
========================= */
router.put("/users/:id/unit", auth, requireAdmin, async (req, res) => {
  const { unit } = req.body;

  const user = await User.findById(req.params.id);
  if (!user) {
    return res.status(404).json({ error: "Usuario no encontrado" });
  }

  if (user.role !== "CHOFER") {
    return res.status(400).json({
      error: "Solo se puede asignar unidad a choferes",
    });
  }

  user.assignedUnit = unit || null;
  await user.save();

  res.json({ ok: true, assignedUnit: user.assignedUnit });
});

module.exports = router;
