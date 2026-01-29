const express = require("express");
const router = express.Router();
const User = require("../models/User");
const { auth, allowRoles } = require("../middlewares/auth");
const WorkSession = require("../models/WorkSession");

/* =========================
   DATOS DEL CHOFER LOGUEADO
========================= */
router.get(
  "/me",
  auth,
  allowRoles("CHOFER"),
  async (req, res) => {
    try {
      const user = await User.findById(req.user.userId)
        .select("username role assignedUnit assignedLine");

      if (!user) {
        return res.status(404).json({ error: "Chofer no encontrado" });
      }

      res.json(user);
    } catch (err) {
      res.status(500).json({ error: "Error obteniendo chofer" });
    }
  }
);

/* =========================
   SESIÓN ACTIVA
========================= */
router.get("/session/active", auth, async (req, res) => {
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
   ÚLTIMAS SESIONES
========================= */
router.get("/session/last", auth, async (req, res) => {
  try {
    const sessions = await WorkSession.find({
      userId: req.user.userId,
    })
      .sort({ startTime: -1 })
      .limit(5);

    res.json(sessions);
  } catch (err) {
    res.status(500).json({ error: "Error obteniendo sesiones" });
  }
});

/* =========================
   INICIAR SESIÓN
========================= */
router.post("/session/start", auth, async (req, res) => {
  try {
    const userId = req.user.userId;

    // 🔒 Cerramos sesión activa previa
    await WorkSession.updateMany(
      { userId, status: "ACTIVE" },
      { status: "CLOSED", endTime: new Date() }
    );

    // ✅ Nueva sesión
    const session = new WorkSession({
      userId,
      role: req.user.role,
      status: "ACTIVE",
      unitId: req.body.unitId || null,
      line: req.body.line || null,
      startTime: new Date(),
    });

    await session.save();

    console.log("SESSION CREADA 👉", session);

    res.json(session);
  } catch (err) {
    console.error("❌ Error start session:", err);
    res.status(500).json({ message: "Error iniciando sesión" });
  }
});

/* =========================
   FINALIZAR SESIÓN
========================= */
router.post("/session/stop", auth, async (req, res) => {
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
