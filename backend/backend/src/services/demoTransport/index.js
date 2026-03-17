/*
  startDemo.js
  ------------------------------------------------------
  DEMO AVL PROFESIONAL — SIN FUGAS NI DEMOS ZOMBIE
*/

const fs = require("fs");
const path = require("path");
const { buildRouteFromStops } = require("./routerBuilder");
const { startBusSimulation } = require("./busSimulator");

/**
 * 🧠 Simulaciones activas en memoria
 */
let runningSimulations = {};

async function startDemo(io) {

  /**
   * 🧹 PASO 1 — DETENER DEMOS ANTERIORES
   */
  Object.values(runningSimulations).forEach(sim => sim.stop?.());
  runningSimulations = {};

  /**
   * 📄 Leer GeoJSON de paradas reales
   */
  const geojsonPath = path.join(
    __dirname,
    "../../data/lineaA_updated.geojson"
  );

  const geojson = JSON.parse(
    fs.readFileSync(geojsonPath, "utf-8")
  );

  /**
   * 🧭 Construir ruta optimizada
   */
  const route = await buildRouteFromStops(geojson);

  /**
   * 🧠 DEFINIR OBJETO LINEA PARA EL LAP DETECTOR
   */
  const linea = {
  _id: "64f0000000000000000000a1", // ObjectId válido para el demo
  name: "Linea A",

  startPoint: {
    coordinates: route.cabeceraA
      ? [route.cabeceraA.lon, route.cabeceraA.lat]
      : geojson.features[0].geometry.coordinates
  },

  endPoint: {
    coordinates: route.cabeceraB
      ? [route.cabeceraB.lon, route.cabeceraB.lat]
      : geojson.features[geojson.features.length - 1].geometry.coordinates
  },

  toleranceStartMeters: 250,
  toleranceEndMeters: 250,

  minLapTimeSeconds: 20
};
  /**
   * 🚌 Colectivos simulados
   */
  const buses = [
    { unitId: "DEMO-A-01", offset: 0, driverName: "Carlos Gómez" },
    { unitId: "DEMO-A-02", offset: 20, driverName: "Lucía Fernández" },
    { unitId: "DEMO-A-03", offset: 40, driverName: "Miguel Rojas" }
  ];

  buses.forEach(bus => {

    const sim = startBusSimulation({
      io,
      unitId: bus.unitId,
      route,
      stops: geojson.features,
      startOffset: bus.offset,
      linea,
      driverName: bus.driverName
    });

    runningSimulations[bus.unitId] = sim;
  });

  console.log("🚌 DEMO Línea A activa (3 colectivos simulados)");

  /**
   * 🔴 API CONTROL
   */
  return {

    stop() {
      Object.values(runningSimulations).forEach(sim => sim.stop?.());
      runningSimulations = {};
      console.log("🛑 DEMO detenida correctamente");
    },

    pause() {
      Object.values(runningSimulations).forEach(sim => sim.pause?.());
      console.log("⏸️ DEMO pausada");
    },

    resume() {
      Object.values(runningSimulations).forEach(sim => sim.resume?.());
      console.log("▶️ DEMO reanudada");
    }
  };
}

module.exports = { startDemo };