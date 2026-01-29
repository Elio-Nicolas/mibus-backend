const fs = require("fs");
const path = require("path");
const { buildRouteFromStops } = require("./routerBuilder");
const { startBusSimulation } = require("./busSimulator");

function startDemo(io) {
  const intervals = [];
  const geojsonPath = path.join(__dirname, "../../data/lineaA.stops.geojson");
  const geojson = JSON.parse(fs.readFileSync(geojsonPath));

  const route = buildRouteFromStops(geojson);

  intervals.push(
  startBusSimulation({ io, unitId: "DEMO-A-01", route, startOffset: 0 }),
  startBusSimulation({ io, unitId: "DEMO-A-02", route, startOffset: 20 }),
  startBusSimulation({ io, unitId: "DEMO-A-03", route, startOffset: 40 })
);
   
  return {
  stop: () => intervals.forEach(clearInterval)
};

  console.log("🚌 DEMO Línea A activa (3 colectivos)");
}

module.exports = { startDemo };
