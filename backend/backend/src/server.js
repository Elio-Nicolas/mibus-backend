const WorkSession = require("./models/WorkSession");
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

/* ====================== DEMO ============================== */
const { startDemo } = require("./services/demoTransport");
let demoRunning = false;
let demoInstance = null;

if (process.env.DEMO_MODE === "true") {
  require("./services/demoTransport")(io);
}

/* ======================= ROUTES ======================= */
const userRoutes = require("./routes/userRoutes");
app.use("/api/users", userRoutes);

const adminRoutes = require("./routes/adminRoutes");
app.use("/api/admin", adminRoutes);

const inspectorRoutes = require("./routes/inspector");
app.use("/api/inspector", inspectorRoutes);

const choferRoutes = require("./routes/chofer");
app.use("/api/chofer", choferRoutes);

const authRoutes = require("./routes/Auth");
app.use("/api/auth", authRoutes);


const TripEvent = require("./models/TripEvent");
/* ======================= MONGO ======================= */
mongoose.connect(
  "mongodb+srv://baigorriaen83_db_user:5RnvPqIcXJq6h197@clustermibus.fc3bgtx.mongodb.net/mibus?appName=ClusterMibus"
);

mongoose.connection.once("open", async () => {

  // ======================= CREAR ADMINISTARTIVO INICIAL =======================
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

  // const User = require("./models/User");
  const users = await User.find();
  users.forEach(u => { /* console.log(` - ${u.username} | role=${u.role}`); */ });

  const Line = require("./models/Line");

  (async () => {
    const exists = await Line.findOne({ code: "A" });

    if (!exists) {
      await Line.create({
        code: "A",
        name: "Línea A",
        color: "#e53935",
        units: ["A1", "A2", "A3", "A4", "A5"]
      });
    }
  })();

});

/* ======================= MODELOS ======================= */
const Bus = require("./models/Bus");

/* ======================= ESTADO DE COMPARTIR ======================= */
const sharingState = {};

const activeBuses = {};


/* ======================= SOCKET.IO ======================= */
io.on("connection", (socket) => {
   console.log(" Cliente conectado / desde SERVER");

  const LINE_COLORS = {
    A: "#e74c3c",
    E: "#2980b9",
    "ZONA ESTE": "#27ae60",
    "ZONA OESTE": "#f39c12",
  };

  socket.on(
    "register",
    async ({ userId, username, role, assignedUnit, assignedLine }) => {

      socket.userId = userId;
      socket.username = username;
      socket.role = role;
      socket.unitId = assignedUnit || null;
      socket.lineCode = assignedLine || null;

      if (role !== "CHOFER" || !assignedUnit || !assignedLine) return;

      let bus = await Bus.findOne({ unitId: assignedUnit });

if (bus) {
  bus.driverId = userId;
  bus.driverName = username;
  bus.lineCode = assignedLine;
  bus.active = true;
  bus.lastUpdate = new Date();
  bus.isDemo = false;
  await bus.save();
} else {
  await Bus.create({
    unitId: assignedUnit,
    driverId: userId,
    driverName: username,
    lineCode: assignedLine,
    active: true,
    isDemo: false,
    lastUpdate: new Date(),
  });
     }
    }
  );

socket.on("locationUpdate", (data) => {
  if (
    !data ||
    typeof data.lat !== "number" ||
    typeof data.lon !== "number"
  ) {
    console.warn("⚠️ locationUpdate inválido", data);
    return;
  }

  // si todavía no estaba creado (o venía de startSharing)
  if (!activeBuses[socket.userId]) {
    activeBuses[socket.userId] = {
      userId: socket.userId,
      unitId: socket.unitId,
      line: socket.lineCode,
      driverName: socket.username,
      lat: data.lat,
      lon: data.lon,
      lastUpdate: new Date(),
    };
  } else {
    // si ya existía → actualizamos
    activeBuses[socket.userId].lat = data.lat;
    activeBuses[socket.userId].lon = data.lon;
    activeBuses[socket.userId].lastUpdate = new Date();
  }

  io.emit("busUpdate", Object.values(activeBuses));
});




 async function emitActiveBuses(io) {
  const query = { active: true };

  if (!demoRunning) {
    query.isDemo = false;
  }

  const buses = await Bus.find(query);
  io.emit("busUpdate", buses);
}


  //================= DEMO ================== //
  
 socket.on("disconnect", () => {
  console.log("⚠️ disconnect (no se limpia estado)", socket.userId);
});


  // cuando alguien se conecta, le decimos el estado real
  socket.emit("demo:status", { enabled: demoRunning });

  socket.on("demo:start", () => {
    if (demoRunning) return;

    demoRunning = true;
    demoInstance = startDemo(io);

    io.emit("demo:status", { enabled: true });
  });

  socket.on("demo:stop", () => {
    if (!demoRunning) return;

    demoRunning = false;
    demoInstance?.stop?.();

    io.emit("demo:status", { enabled: false });
  });

socket.on("startSharing", () => {
  console.log("🟢 startSharing", socket.userId);
  sharingState[socket.userId] = true;
});





socket.on("stopSharing", () => {
  delete sharingState[socket.userId];
  delete activeBuses[socket.userId];

  console.log("🛑 stopSharing manual", socket.userId);

  io.emit("busUpdate", Object.values(activeBuses));
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
  // console.log(`Servidor escuchando en puerto ${PORT}`);
});
