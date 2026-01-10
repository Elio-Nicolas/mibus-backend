const express = require("express");
const router = express.Router();
const { auth, allowRoles } = require("../middlewares/auth");

//const auth = require("../middlewares/auth");
//const allowRoles = require("../middlewares/allowRoles");
//const requireAdmin = require("../middlewares/requireAdmin");
const User = require("../models/User");


console.log("ADMIN ROUTES CARGADAS");
router.use((req, res, next) => {
  console.log("ENTRA A ADMIN ROUTES:", req.method, req.url);
  next();
});

/* =========================
   TEST ADMIN
========================= */
router.get("/ping", auth, allowRoles("ADMIN"), (req, res) => {

    res.json({ ok: true });
});

/* =========================
   LISTAR USUARIOS
========================= */
router.get(
  "/users",
  auth,
  allowRoles("ADMIN"),
  async (req, res) => {
    console.log("ADMIN USERS by:", req.user.userId);
    const users = await User.find({}, "-password");
    res.json(users);
  }
);


/* =========================
   ELIMINAR USUARIO (ADMIN)
========================= */
router.delete(
  "/users/:id",
  auth,
  allowRoles("ADMIN"),
  async (req, res) => {


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
router.put(
  "/users/:id/role",
  auth,
  allowRoles("ADMIN"),
  async (req, res) => {


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
// PUT /api/admin/users/:id/unit
router.put(
  "/users/:id/unit",
  auth,
  allowRoles("ADMIN"),
  async (req, res) => {
    try {
      const { unit } = req.body;

      const user = await User.findByIdAndUpdate(
        req.params.id,
        { assignedUnit: unit },
        { new: true }
      );

      if (!user) {
        return res.status(404).json({ error: "Usuario no encontrado" });
      }

      res.json(user);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Error actualizando unidad" });
    }
  }
);



module.exports = router;
