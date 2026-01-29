const Bus = require("../../models/Bus");

function interpolate(a, b, t) {
  return {
    lat: a.lat + (b.lat - a.lat) * t,
    lon: a.lon + (b.lon - a.lon) * t
  };
}

function startBusSimulation({ io, unitId, route, startOffset = 0 }) {

  const path = route.forward;

  let index = startOffset % (path.length - 1);
  let direction = 1; // 1 = forward, -1 = backward
  let t = 0;

  console.log("🟢 startBusSimulation activa para", unitId, "desde index", index);

  const interval = setInterval(async () => {

    const current = path[index];
    const next = path[index + direction];

    // cambio de sentido SIN saltos
    if (!next) {
      direction *= -1;
      index += direction;
      return;
    }

    const pos = interpolate(current, next, t);

    console.log("📍 simulando", unitId, pos.lat, pos.lon);

    t += 0.05; // velocidad (más chico = más suave)

    if (t >= 1) {
      t = 0;
      index += direction;
    }

    await Bus.findOneAndUpdate(
      { unitId },
      {
        unitId,
        lat: pos.lat,
        lon: pos.lon,
        active: true,
        driverName: "DEMO",
        isDemo: true,
        lastUpdate: new Date()
      },
      { upsert: true }
    );

    // emitir TODOS juntos (paralelo real)
    const activeUnits = await Bus.find({
  active: true,
  isDemo: true
});

io.emit("busUpdate", activeUnits);


  }, 1000);

  return interval;
}

module.exports = { startBusSimulation };
