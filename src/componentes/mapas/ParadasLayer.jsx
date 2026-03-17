// src/components/map/ParadasLayer.jsx
import React from "react";
import { GeoJSON } from "react-leaflet";
import L from "leaflet";

const ParadasLayer = ({ paradasData, selectedLinea }) => {
  if (!selectedLinea || !paradasData) return null;

  return (
    <GeoJSON
      key={selectedLinea} // fuerza re-render cuando cambia la línea
      data={paradasData}
      pointToLayer={(feature, latlng) =>
        L.marker(latlng, {
          icon: L.divIcon({
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
          }),
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

export default ParadasLayer;