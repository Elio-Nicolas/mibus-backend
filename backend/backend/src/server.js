const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const mongoose = require("mongoose");
const cors = require("cors");
const app = express();
const path = require("path");


app.use("/uploads", express.static(path.join(__dirname, "uploads"))); //acceso a img desde el navegador

app.use(cors()); // Solo permite el acceso del FRONT  { origin: "http://localhost:4000" } <-- VA ESTO DENTRO DE ()

app.use(express.json()); //  Parsear JSON

app.use('/uploads', express.static('uploads'));


const server = http.createServer(app);
const io = socketIo(server, {
  cors: { origin: "*" }, //http://localhost:4000 <-- VA ESTO DENTRO DE ""
});


const userRoutes = require("./routes/userRoutes"); //  importar
app.use("/api/users", userRoutes);                 //  usar

// Conexión MongoDB
mongoose.connect("mongodb+srv://baigorriaen83_db_user:5RnvPqIcXJq6h197@clustermibus.fc3bgtx.mongodb.net/?appName=ClusterMibus", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Esquema y modelo
const BusSchema = new mongoose.Schema({
  id: String,
  lat: Number,
  lon: Number,
  timestamp: { type: Date, default: Date.now },
});
const Bus = mongoose.model("Bus", BusSchema);

/*
// WebSocket
io.on("connection", (socket) => {
  console.log("conectado");

  socket.on("locationUpdate", async (data) => {
    console.log(" Ubicación recibida:", data);
    await Bus.findOneAndUpdate({ id: data.id }, data, { upsert: true });
  });

  socket.on("disconnect", () => console.log("desconectado"));
});
/*
//  Emitir datos cada 3 segundos
setInterval(async () => {
  const buses = await Bus.find({});
  io.emit("busUpdate", buses);
  console.log(" Enviando datos a los clientes:", buses);
}, 3000);*/

//-------------------------------------------------------------
// Compartir Ubicacion
//-------------------------------------------------------------

// Estado de si cada usuario está compartiendo o no su ubicación
let sharingState = {}; 
// sharingState[idDelUsuario] = true/false

io.on("connection", (socket) => {
  console.log("conectado");

  // El usuario comparte ubicación
  socket.on("startSharing", (userId) => {
    sharingState[userId] = true;
    console.log(`📍 ${userId} comenzó a compartir`);
  });

  // El usuario deja de compartir ubicación
socket.on("stopSharing", async (userId) => {
  sharingState[userId] = false;
  console.log(`❌ ${userId} dejó de compartir`);

  // 1. Borrar su ubicación de Mongo
  await Bus.deleteOne({ id: userId });

  // 2. Avisar a todos los clientes que el usuario apagó compartir
  io.emit("userStopped", userId);
});


  // Recibimos una actualización de ubicación
  socket.on("locationUpdate", async (data) => {
    const { id, lat, lon } = data;

    console.log(" Ubicación recibida:", data);

    // Si el usuario apagó el compartir → NO guardamos ni reenviamos
    if (!sharingState[id]) {
      console.log(`⚠️ ${id} envió ubicación, pero tiene sharing OFF. Ignorada.`);
      return;
    }

    // Guardar ubicación en Mongo
    await Bus.findOneAndUpdate({ id }, data, { upsert: true });

    // Enviar a todos los clientes
    io.emit("busUpdate", await Bus.find({}));
  });

  socket.on("disconnect", () => console.log("desconectado"));
});


// Ruta REST única
app.get("/buses", async (req, res) => {
  try {
    const buses = await Bus.find({});
    res.json(buses);
  } catch (err) {
    console.error(" Error al obtener Colectivos:", err);
    res.status(500).json({ error: "Error al obtener los buses" });
  }
});

const PORT = process.env.PORT || 4001;
server.listen(PORT, () => console.log(`🚍 Backend corriendo en puerto ${PORT}`));



