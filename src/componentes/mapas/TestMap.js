// src/componentes/mapas/TestMap.js
import React from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";

const createBusIcon = (color = "#007bff") =>
  L.divIcon({
    className: "bus-icon",
    html: `<div style="width:16px;height:16px;background:${color};border-radius:50%;border:2px solid white;"></div>`,
    iconSize: [16, 16],
    iconAnchor: [8, 8],
  });

const TestMap = ({ position }) => {
  const defaultPos = [-33.6756, -65.4578]; // Mendoza, solo ejemplo

  return (
    <MapContainer
      center={position || defaultPos}
      zoom={15}
      style={{ height: "400px", width: "100%" }}
    >
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

      {position && (
        <Marker position={position} icon={createBusIcon("#2e7d32")}>
          <Popup>Posición actual</Popup>
        </Marker>
      )}
    </MapContainer>
  );
};

export default TestMap;
