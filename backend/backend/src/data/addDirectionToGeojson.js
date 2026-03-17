const fs = require("fs");

const inputPath = "./lineaA.stops.geojson";       // 👈 tu archivo real
const outputPath = "./lineaA_updated.geojson";

const geo = JSON.parse(fs.readFileSync(inputPath, "utf8"));

const total = geo.features.length;
const half = Math.floor(total / 2);

geo.features = geo.features.map((feature, index) => {
  const isFirst = index === 0;
  const isLast = index === total - 1;

  feature.properties.direction = index < half ? "ida" : "vuelta";
  feature.properties.isTerminal = isFirst || isLast;

  return feature;
});

fs.writeFileSync(outputPath, JSON.stringify(geo, null, 2));

console.log("GeoJSON actualizado correctamente");