const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");

const app = express();

process.env.JWT_SECRET = "mibus_secret_local";


/* ======================= MIDDLEWARE ======================= */
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use(cors());
app.use(express.json());

/* ======================= SERVER + SOCKET.IO ======================= */
const server = http.createServer(app);
const io = socketIo(server, {
  cors: { origin: "*" }
});

/* ======================= ROUTES ======================= */
const userRoutes = require("./routes/userRoutes");
app.use("/api/users", userRoutes);

const adminRoutes = require("./routes/adminRoutes");
app.use("/api/admin", require("./routes/adminRoutes"));

/* ======================= MONGO ======================= */
mongoose.connect(
  "mongodb+srv://baigorriaen83_db_user:5RnvPqIcXJq6h197@clustermibus.fc3bgtx.mongodb.net/mibus?appName=ClusterMibus"
);

mongoose.connection.once("open", async () => {

  // ======================= CREAR ADMIN INICIAL =======================
const User = require("./models/User");
const bcrypt = require("bcrypt");

(async () => {
  const adminUsername = "admin";
  const adminPassword = "admin123";

  const exists = await User.findOne({ username: adminUsername });

  if (!exists) {
    const hashed = await bcrypt.hash(adminPassword, 10);

    await User.create({
      username: adminUsername,
      password: hashed,
      role: "ADMIN",
    });
  } 
})();

  //const User = require("./models/User");
  const users = await User.find();
  users.forEach(u => {
  // console.log(` - ${u.username} | role=${u.role}`);
  });
});

/* ======================= SCHEMA ======================= */
const BusSchema = new mongoose.Schema({
  unitId: { type: String, required: true, unique: true },
  driverId: { type: String, required: true },
  driverName: { type: String },

  lat: Number,
  lon: Number,

  color: String,
  shape: { type: String, default: "circle" },

  active: { type: Boolean, default: false },
  lastUpdate: { type: Date, default: Date.now }
});

const Bus = mongoose.model("Bus", BusSchema);

/* ======================= ESTADO DE COMPARTIR ======================= */
const sharingState = {};

/* ======================= SOCKET.IO ======================= */
io.on("connection", (socket) => {
  console.log(" Usuario conectado");

  socket.on("register", async ({ userId, username, role, assignedUnit }) => {
    socket.userId = userId;
    socket.username = username;
    socket.role = role;
    socket.unitId = assignedUnit || null;

    if (role !== "CHOFER" || !assignedUnit) return;

    const bus = await Bus.findOne({ unitId: assignedUnit });

    if (bus) {
      bus.driverId = userId;
      bus.driverName = username;
      bus.active = true;
      bus.lastUpdate = new Date();
      await bus.save();
    } else {
      await Bus.create({
        unitId: assignedUnit,
        driverId: userId,
        driverName: username,
        active: true,
        lastUpdate: new Date()
      });
    }

    const activeUnits = await Bus.find({ active: true });
    io.emit("busUpdate", activeUnits);
  });

  socket.on("startSharing", () => {
    if (socket.role !== "CHOFER") return;
    sharingState[socket.userId] = true;
  });

  socket.on("stopSharing", async () => {
    if (socket.role !== "CHOFER") return;

    sharingState[socket.userId] = false;

    await Bus.updateMany(
      { driverId: socket.userId },
      { active: false }
    );

    const activeUnits = await Bus.find({ active: true });
    io.emit("busUpdate", activeUnits);
  });

  socket.on("locationUpdate", async ({ lat, lon }) => {
    if (socket.role !== "CHOFER") return;
    if (!socket.unitId) return;
    if (!sharingState[socket.userId]) return;

    const unitInUse = await Bus.findOne({
      unitId: socket.unitId,
      active: true,
      driverId: { $ne: socket.userId }
    });

    if (unitInUse) {
      socket.emit("unitBlocked", {
        unitId: socket.unitId,
        driverName: unitInUse.driverName
      });
      return;
    }

    await Bus.findOneAndUpdate(
      { unitId: socket.unitId },
      {
        unitId: socket.unitId,
        driverId: socket.userId,
        driverName: socket.username,
        lat,
        lon,
        active: true,
        lastUpdate: new Date()
      },
      { upsert: true }
    );

    const activeUnits = await Bus.find({ active: true });
    io.emit("busUpdate", activeUnits);
  });

  socket.on("disconnect", () => {
    if (socket.userId) delete sharingState[socket.userId];
    console.log(" Usuario desconectado:", socket.username || "desconocido");
  });
});

/* ======================= TIMEOUT ======================= */
const UNIT_TIMEOUT_MS = 30_000;

setInterval(async () => {
  const limite = new Date(Date.now() - UNIT_TIMEOUT_MS);
  await Bus.updateMany(
    { active: true, lastUpdate: { $lt: limite } },
    { active: false }
  );
}, 10_000);

/* ======================= REST ======================= */
app.get("/buses", async (req, res) => {
  const units = await Bus.find({ active: true });
  res.json(units);
});

/* ======================= START SERVER ======================= */
const PORT = process.env.PORT || 4001;
server.listen(PORT, () => {
});
