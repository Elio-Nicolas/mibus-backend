const fs = require("fs");
const overpassData = require("./overpass.json"); // tu archivo original de Overpass

const features = overpassData.elements
  .filter(el => el.type === "node") // solo nodos
  .map(node => ({
    type: "Feature",
    geometry: {
      type: "Point",
      coordinates: [node.lon, node.lat] // ojo, lon primero
    },
    properties: {
      id: node.id,
      name: node.tags?.name || null,
      operator: node.tags?.operator || null,
      network: node.tags?.network || null
    }
  }));

const geojson = {
  type: "FeatureCollection",
  features
};

fs.writeFileSync(__dirname + "/lineas.geojson", JSON.stringify(geojson, null, 2));
console.log("GeoJSON generado correctamente!");
