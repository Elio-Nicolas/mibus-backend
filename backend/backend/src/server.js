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

/* ======================= MONGO ======================= */
mongoose.connect(
  "mongodb+srv://baigorriaen83_db_user:5RnvPqIcXJq6h197@clustermibus.fc3bgtx.mongodb.net/?appName=ClusterMibus",
  { useNewUrlParser: true, useUnifiedTopology: true }
);

/* ======================= SCHEMA ======================= */
const BusSchema = new mongoose.Schema({
  id: String,                // userId
  username: String,
  lat: Number,
  lon: Number,
  color: String,            // Color único del usuario
  shape: String,            // Futuro: forma del ícono
  timestamp: { type: Date, default: Date.now }
});

const Bus = mongoose.model("Bus", BusSchema);

/* ======================= ESTADO DE COMPARTIR ======================= */
let sharingState = {}; 
// sharingState[userId] = true/false

/* ======================= SOCKET.IO ======================= */
io.on("connection", (socket) => {
  console.log("🟢 Usuario conectado");

  /* --- Usuario comienza a compartir --- */
  socket.on("startSharing", (userId) => {
    sharingState[userId] = true;
    console.log(`📍 ${userId} comenzó a compartir`);
  });

  /* --- Usuario deja de compartir --- */
  socket.on("stopSharing", async (userId) => {
    sharingState[userId] = false;
    console.log(`❌ ${userId} dejó de compartir`);

    // Borrar ubicación de Mongo
    await Bus.deleteOne({ id: userId });

    // Avisar a todos que desaparece del mapa
    io.emit("userStopped", userId);
  });

  /* --- Recibir ubicación (solo si está compartiendo) --- */
  socket.on("locationUpdate", async (data) => {
    const { id, username, lat, lon } = data;

    console.log("📡 Ubicación recibida:", data);

    if (!sharingState[id]) {
      console.log(`⚠️ Ubicación ignorada: ${id} tiene sharing OFF`);
      return;
    }

    // Ver si el usuario ya existe
    let existing = await Bus.findOne({ id });

    // Si no existe → asignar color único
    if (!existing) {
      data.color = "#" + Math.floor(Math.random() * 16777215).toString(16);
      console.log(`🎨 Nuevo usuario → color asignado: ${data.color}`);
    } else {
      data.color = existing.color; // Mantener el mismo color
    }

    // Guardar en Mongo
    /* === FIX: guardar con campos correctos === */
await Bus.findOneAndUpdate(
  { id },
  {
    id,
    username,
    lat,
    lon,
    color: data.color,
    shape: "circle"
  },
  { upsert: true }
);
/* === END FIX === */


    // Enviar lista actualizada
    io.emit("busUpdate", await Bus.find({}));
  });

  socket.on("disconnect", () => console.log("🔴 Usuario desconectado"));
});

/* ======================= RUTA REST ======================= */
app.get("/buses", async (req, res) => {
  try {
    const docs = await Bus.find({});
    const response = docs.map(doc => ({
      userId: doc.id,
      username: doc.username,
      latitude: doc.lat,
      longitude: doc.lon,
      color: doc.color || "#007bff",
      shape: doc.shape || "circle",
      timestamp: doc.timestamp
    }));
    res.json(response);
  } catch (err) {
    console.error("❌ Error al obtener buses:", err);
    res.status(500).json({ error: "Error al obtener los buses" });
  }
});

/* ======================= START SERVER ======================= */
const PORT = process.env.PORT || 4001;
server.listen(PORT, () => console.log(`🚍 Backend corriendo en puerto ${PORT}`));
