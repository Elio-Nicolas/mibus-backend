const jwt = require("jsonwebtoken");

const auth = (req, res, next) => {
  const header = req.headers.authorization;

  if (!header) {
    return res.status(401).json({ error: "Token requerido" });
  }

  const token = header.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "secret");

    req.user = {
      userId: decoded.userId,
      role: decoded.role,
      username: decoded.username,
    };

    next();
  } catch (err) {
    return res.status(401).json({ error: "Token inválido" });
  }
};

const allowRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: "No autorizado" });
    }
    next();
  };
};

module.exports = {
  auth,
  allowRoles,
};
