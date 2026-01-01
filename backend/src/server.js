const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");

const app = express();

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

const authRoutes = require("../routes/auth");
app.use("/auth", authRoutes);

/* ======================= MONGO ======================= */
mongoose.connect(
  "mongodb+srv://baigorriaen83_db_user:5RnvPqIcXJq6h197@clustermibus.fc3bgtx.mongodb.net/?appName=ClusterMibus"
);

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
// sharingState[userId] = true | false

/* ======================= SOCKET.IO ======================= */
io.on("connection", (socket) => {
  console.log("🟢 Usuario conectado");

  /* ======================= D9: RECONEXIÓN LIMPIA ======================= */
socket.on("register", async ({ userId, username, role, assignedUnit }) => {
  socket.userId = userId;
  socket.username = username;
  socket.role = role;
  socket.unitId = assignedUnit || null;

  if (role !== "CHOFER" || !assignedUnit) return;

  const bus = await Bus.findOne({ unitId: assignedUnit });

  if (bus) {
    // Si la unidad existe, la reactivamos
    bus.driverId = userId;
    bus.driverName = username;
    bus.active = true;
    bus.lastUpdate = new Date();
    await bus.save();

    console.log(`🔁 Reconexion: ${username} retomó ${assignedUnit}`);
  } else {
    // Si no existe, la creamos (caso extremo)
    await Bus.create({
      unitId: assignedUnit,
      driverId: userId,
      driverName: username,
      active: true,
      lastUpdate: new Date()
    });

    console.log(`🆕 Unidad creada en reconexión: ${assignedUnit}`);
  }

  const activeUnits = await Bus.find({ active: true });
  io.emit("busUpdate", activeUnits);
});

  /* ========= START SHARING ========= */
  socket.on("startSharing", () => {
    if (socket.role !== "CHOFER") return;

    sharingState[socket.userId] = true;
    console.log(`📍 Chofer ${socket.username} comenzó a compartir`);
  });

  /* ========= STOP SHARING ========= */
  socket.on("stopSharing", async () => {
    if (socket.role !== "CHOFER") return;

    sharingState[socket.userId] = false;
    console.log(`❌ Chofer ${socket.username} dejó de compartir`);

    await Bus.updateMany(
      { driverId: socket.userId },
      { active: false }
    );

    const activeUnits = await Bus.find({ active: true });
    io.emit("busUpdate", activeUnits);
  });

  /* ========= LOCATION UPDATE (ÚNICO Y SEGURO) ========= */
  socket.on("locationUpdate", async ({ lat, lon }) => {
    if (socket.role !== "CHOFER") return;
    if (!socket.unitId) return;
    if (!sharingState[socket.userId]) return;

    // verifica si la unidad está siendo usada 
    const unitInUse = await Bus.findOne({
     unitId: socket.unitId,
     active: true,
     driverId: { $ne: socket.userId }
    });

if (unitInUse) {
  console.log("🚫 Unidad en uso por otro chofer:", socket.unitId);
  socket.emit("unitBlocked", {
    unitId: socket.unitId,
    driverName: unitInUse.driverName
  });
  return;
}

    let existing = await Bus.findOne({ unitId: socket.unitId });

    let color = existing
      ? existing.color
      : "#" + Math.floor(Math.random() * 16777215).toString(16);

    await Bus.findOneAndUpdate(
      { unitId: socket.unitId },
      {
        unitId: socket.unitId,
        driverId: socket.userId,
        driverName: socket.username,
        lat,
        lon,
        color,
        shape: "circle",
        active: true,
        lastUpdate: new Date()
      },
      { upsert: true }
    );

    const activeUnits = await Bus.find({ active: true });
    io.emit("busUpdate", activeUnits);
  });

  socket.on("disconnect", () => {
   if (socket.userId) {
     delete sharingState[socket.userId];
   }
   console.log("🔴 Usuario desconectado:", socket.username || "desconocido");
  });

});

/* ======================= D8: TIMEOUT DE UNIDADES ======================= */
// Si una unidad no envía ubicación en X segundos → inactive
const UNIT_TIMEOUT_MS = 30_000; // 30 segundos (ajustable)

setInterval(async () => {
  try {
    const limite = new Date(Date.now() - UNIT_TIMEOUT_MS);

    const result = await Bus.updateMany(
      {
        active: true,
        lastUpdate: { $lt: limite }
      },
      {
        active: false
      }
    );

    if (result.modifiedCount > 0) {
      console.log(`⏱ Unidades desactivadas por timeout: ${result.modifiedCount}`);

      const activeUnits = await Bus.find({
        active: true,
        lat: { $type: "number" },
        lon: { $type: "number" }
      });

      io.emit("busUpdate", activeUnits);
    }
  } catch (err) {
    console.error("❌ Error en timeout de unidades:", err);
  }
}, 10_000); // corre cada 10 segundos


/* ======================= RUTA REST ======================= */
app.get("/buses", async (req, res) => {
  try {
    const units = await Bus.find({ active: true });

    res.json(
      units.map((u) => ({
        unitId: u.unitId,
        driverName: u.driverName,
        latitude: u.lat,
        longitude: u.lon,
        color: u.color,
        shape: u.shape,
        lastUpdate: u.lastUpdate
      }))
    );
  } catch (error) {
    console.error("Error en /buses:", error);
    res.status(500).json({ error: "Error obteniendo unidades" });
  }
});

/* ======================= START SERVER ======================= */
const PORT = process.env.PORT || 4001;
server.listen(PORT, () =>
  console.log(`🚍 Backend corriendo en puerto ${PORT}`)
);
