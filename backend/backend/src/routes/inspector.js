const express = require("express");
const router = express.Router();
const User = require("../models/User");
const WorkSession = require("../models/WorkSession");
const { auth, allowRoles } = require("../middlewares/auth");

/* =========================
   DATOS DEL INSPECTOR LOGUEADO
========================= */
router.get("/me", auth, allowRoles("INSPECTOR"), async (req, res) => {
  try {
    const user = await User.findById(req.user.userId)
      .select("username role");

    if (!user) {
      return res.status(404).json({ error: "Inspector no encontrado" });
    }

    res.json(user);
  } catch (err) {
    res.status(500).json({ error: "Error obteniendo inspector" });
  }
});

/* =========================
   VER CHOFERES (YA EXISTENTE)
========================= */
router.get(
  "/drivers",
  auth,
  allowRoles("INSPECTOR"),
  async (req, res) => {
    try {
      const drivers = await User.find({ role: "CHOFER" })
        .select("username assignedUnit assignedLine location");

      res.json(drivers);
    } catch (err) {
      res.status(500).json({ error: "Error obteniendo choferes" });
    }
  }
);

/* =========================
   SESIÓN ACTIVA
========================= */
router.get("/session/active", auth, allowRoles("INSPECTOR"), async (req, res) => {
  try {
    const session = await WorkSession.findOne({
      userId: req.user.userId,
      status: "ACTIVE",
    }).sort({ startTime: -1 });

    res.json(session);
  } catch (err) {
    res.status(500).json({ error: "Error obteniendo sesión activa" });
  }
});

/* =========================
   INICIAR SESIÓN
========================= */
router.post("/session/start", auth, allowRoles("INSPECTOR"), async (req, res) => {
  try {
    const userId = req.user.userId;

    await WorkSession.updateMany(
      { userId, status: "ACTIVE" },
      { status: "CLOSED", endTime: new Date() }
    );

    const session = new WorkSession({
      userId,
      role: req.user.role,
      status: "ACTIVE",
      startTime: new Date(),
    });

    await session.save();

    res.json(session);
  } catch (err) {
    res.status(500).json({ message: "Error iniciando sesión" });
  }
});

/* =========================
   FINALIZAR SESIÓN
========================= */
router.post("/session/stop", auth, allowRoles("INSPECTOR"), async (req, res) => {
  try {
    const session = await WorkSession.findOneAndUpdate(
      { userId: req.user.userId, status: "ACTIVE" },
      { status: "CLOSED", endTime: new Date() },
      { new: true }
    );

    if (!session) {
      return res.status(400).json({ error: "No hay sesión activa" });
    }

    res.json(session);
  } catch (err) {
    res.status(500).json({ error: "Error cerrando sesión" });
  }
});

module.exports = router;
