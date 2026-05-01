import React, { useMemo } from "react";
import { GeoJSON } from "react-leaflet";
import L from "leaflet";

const paradaIcon = L.divIcon({
  className: "",
  html: `
    <div style="
      width:10px;
      height:10px;
      background:#007bff;
      border-radius:50%;
      border:2px solid white;
    "></div>
  `,
  iconSize: [14, 14],
  iconAnchor: [7, 7],
});

const ParadasLayer = ({ paradasData, selectedLinea, visible }) => {

  // 🔥 FIX 4: useMemo SIEMPRE se ejecuta (no condicional)
  const filteredData = useMemo(() => {
    if (!paradasData) return null;

    // sin filtro → devolver todo
    if (!selectedLinea) return paradasData;

    // filtrar por línea
    return {
      ...paradasData,
      features: paradasData.features.filter(
        (f) => f.properties?.linea === selectedLinea
      ),
    };
  }, [paradasData, selectedLinea]);

  // 🔥 control de visibilidad (clave para la simulación)
  if (!visible) return null;

  if (!filteredData) return null;

  return (
    <GeoJSON
      data={filteredData}
      pane="paradasPane"
      pointToLayer={(feature, latlng) =>
        L.marker(latlng, {
          icon: paradaIcon,
          pane: "paradasPane",
        })
      }
      onEachFeature={(feature, layer) => {
        const id = feature.id || "Sin ID";
        const tipo = feature.properties?.highway || "bus_stop";

        layer.bindPopup(`
          <strong>🚌 Parada</strong><br/>
          ID: ${id}<br/>
          Tipo: ${tipo}
        `);
      }}
    />
  );
};

export default React.memo(ParadasLayer);