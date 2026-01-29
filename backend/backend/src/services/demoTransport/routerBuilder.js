function distance(a, b) {
  const dx = a.lat - b.lat;
  const dy = a.lon - b.lon;
  return Math.sqrt(dx * dx + dy * dy);
}

function buildRouteFromStops(geojson) {
  const stops = geojson.features.map(f => ({
    lat: f.geometry.coordinates[1],
    lon: f.geometry.coordinates[0],
    name: f.properties?.name || "Parada"
  }));

  // ordenar por cercanía progresiva
  const route = [stops[0]];
  const remaining = stops.slice(1);

  while (remaining.length) {
    const last = route[route.length - 1];
    let nearestIndex = 0;
    let nearestDistance = Infinity;

    remaining.forEach((s, i) => {
      const d = distance(last, s);
      if (d < nearestDistance) {
        nearestDistance = d;
        nearestIndex = i;
      }
    });

    route.push(remaining.splice(nearestIndex, 1)[0]);
  }

  return {
    forward: route,
    backward: [...route].reverse()
  };
}

module.exports = { buildRouteFromStops };
