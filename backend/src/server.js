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
mongoose.connect("mongodb://localhost:27017/colectivos", {
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



