import { MapContainer, TileLayer, Marker, useMap, Polyline } from "react-leaflet";
import { useEffect } from "react";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import BusPopup  from "../mapas/BusPopup";

/* componente SOLO sirve para avisarle a Leaflet */
function ResizeFix() {
  const map = useMap();

  useEffect(() => {
    // pequeño delay para que el DOM termine de ajustar
    const t = setTimeout(() => {
      map.invalidateSize();
    }, 100);

    return () => clearTimeout(t);
  }, [map]);

  return null;
}

const createBusIcon = (color = "#00bfff") =>
  L.divIcon({
    className: "",
    html: `<div class="bus-dot" style="--bus-color:${color}"></div>`,
    iconSize: [18, 18],
    iconAnchor: [9, 9],
  });

  const markerStyle = `
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
`;
export default function AdminMap({ buses = [], busTrails = {} }) {
  console.log("ADMIN MAP RECIBE:", buses);

  return (
    <MapContainer
      center={[-33.675, -65.457]}
      zoom={13}
      style={{ height: "100%", width: "100%" }}
    >
        <style>{markerStyle}</style>

      <ResizeFix />

      <TileLayer
        attribution='© OpenStreetMap'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {buses.map((bus) => (
  <>
    <Marker
      position={[bus.lat, bus.lon]}
      icon={createBusIcon(bus.color || "#00bfff")}
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
  </>
))}
    </MapContainer>
  );
}
