import { MapContainer, TileLayer, Marker, useMap, Polyline } from "react-leaflet";
import { useEffect } from "react";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import BusPopup from "../mapas/BusPopup";
import React from "react";

/* componente SOLO sirve para avisarle a Leaflet */
function ResizeFix() {
  const map = useMap();

  useEffect(() => {
    if (!map) return;

    const t = setTimeout(() => {
      if (map._container) {
        try {
          map.invalidateSize();
        } catch (e) {}
      }
    }, 150);

    return () => clearTimeout(t);
  }, [map]);

  return null;
}

const iconCache = {};
const createBusIcon = (color = "#00bfff") => {
  if (iconCache[color]) return iconCache[color];

  const icon = L.divIcon({
    className: "",
    html: `<div class="bus-dot" style="--bus-color:${color}"></div>`,
    iconSize: [18, 18],
    iconAnchor: [9, 9],
  });

  iconCache[color] = icon;
  return icon;
};

export default function AdminMap({ buses = [], busTrails = {}, demoEnabled }) {
  console.log("ADMIN MAP RECIBE:", buses);
  console.log("DEMO:", demoEnabled);

  // 🔥 línea activa basada en el primer bus
  const lineaActiva = buses[0]?.line || null;

  // 🔥 paradas (ajustar si tu backend usa otra propiedad)
  const paradas = lineaActiva
    ? buses
        .filter(b => b.isStop && b.lat && (b.lon || b.lng))
        .map(b => [b.lat, b.lon ?? b.lng])
    : [];

  return (
    <MapContainer
      center={[-33.675, -65.457]}
      zoom={13}
      style={{ height: "100%", width: "100%" }}
    >
      <style>
        {`
.bus-dot {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: var(--bus-color);
  border: 3px solid white;
  box-shadow: 0 0 12px rgba(0,0,0,0.25);
  position: relative;
}

.bus-dot::after {
  content: "";
  position: absolute;
  inset: -6px;
  border-radius: 50%;
  background: var(--bus-color);
  opacity: 0.25;
}
`}
      </style>

      <ResizeFix />

      <TileLayer
        attribution="© OpenStreetMap"
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {/* 🔥 PARADAS */}
      {demoEnabled &&
        paradas.map((pos, i) => (
          <Marker
            key={`stop-${i}`}
            position={pos}
            icon={L.divIcon({
              className: "",
              html: `<div style="
                width:10px;
                height:10px;
                border-radius:50%;
                background:#ffcc00;
                border:2px solid white;
              "></div>`,
              iconSize: [10, 10],
              iconAnchor: [5, 5],
            })}
          />
        ))}

      {/* 🔥 BUSES */}
      {demoEnabled &&
        buses
          .filter(bus => bus.lat && (bus.lon || bus.lng))
          .map((bus) => (
            <React.Fragment key={bus.unitId}>
              <Marker
                position={[bus.lat, bus.lon ?? bus.lng]}
                icon={createBusIcon(bus.color)}
              >
                <BusPopup bus={bus} />
              </Marker>

              {busTrails?.[bus.unitId] && (
                <Polyline
                  positions={busTrails[bus.unitId]}
                  pathOptions={{
                    color: bus.color || "#00bfff",
                    weight: 3,
                    opacity: 0.7,
                  }}
                />
              )}
            </React.Fragment>
          ))}
    </MapContainer>
  );
}