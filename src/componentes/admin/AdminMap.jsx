import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import { useEffect } from "react";
import "leaflet/dist/leaflet.css";
import L from "leaflet";


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
    iconSize: [16, 16],
    iconAnchor: [8, 8],
  });

  const markerStyle = `
.bus-dot {
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: var(--bus-color);
  box-shadow:
    0 0 6px var(--bus-color),
    0 0 12px var(--bus-color),
    0 0 18px var(--bus-color);
  animation: pulse 1.5s infinite;
}

@keyframes pulse {
  0% { transform: scale(1); }
  50% { transform: scale(1.5); }
  100% { transform: scale(1); }
}
`;

export default function AdminMap({ buses = [] }) {
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
     <Marker
  key={bus.unitId}
  position={[bus.lat, bus.lon]}
  icon={createBusIcon(bus.color || "#ff2b2b")}
>


          <Popup>
            <b>Unidad:</b> {bus.unitId}<br />
            <b>Chofer:</b> {bus.driverName}
          </Popup>
        </Marker>
      ))}

    </MapContainer>
  );
}
