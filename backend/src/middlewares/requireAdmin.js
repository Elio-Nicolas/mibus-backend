const jwt = require("jsonwebtoken");
const User = require("../models/User");

const requireAdmin = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({ error: "Token no enviado" });
    }

    const token = authHeader.split(" ")[1];

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.userId);

    if (!user || user.role !== "ADMIN") {
      return res.status(403).json({ error: "Acceso solo para ADMIN" });
    }

    req.user = user; // opcional
    next();
  } catch (err) {
    console.error("Error requireAdmin:", err);
    res.status(401).json({ error: "Token inválido" });
  }
};

module.exports = requireAdmin;
