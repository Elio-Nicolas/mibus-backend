const express = require("express");
const router = express.Router();
const User = require("../models/User");
const { auth, allowRoles } = require("../middlewares/auth");

/* =========================
   VER CHOFERES (INSPECTOR)
========================= */
router.get(
  "/drivers",
  auth,
  allowRoles("INSPECTOR"),
  async (req, res) => {
    try {
      const drivers = await User.find({ role: "CHOFER" })
        .select("username assignedUnit");

      res.json(drivers);
    } catch (err) {
      res.status(500).json({ error: "Error obteniendo choferes" });
    }
  }
);

module.exports = router;
