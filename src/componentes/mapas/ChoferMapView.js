import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";


useEffect(() => {
  return () => {
    console.log("❌ ChoferMapView DESMONTADO");
  };
}, []);

// FIX iconos leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

// 📍 mueve el mapa cuando cambia la posición
const RecenterMap = ({ posicion }) => {
  const map = useMap();

  useEffect(() => {
    if (!posicion) return;

    map.setView(
      [posicion.lat, posicion.lon],
      map.getZoom(),
      { animate: true }
    );
  }, [posicion, map]);

  return null;
};

const ChoferMapView = ({ posicion }) => {
  console.log("🗺️ ChoferMapView render");

  return (
    <div style={{ height: "100vh", width: "100%" }}>
     <MapContainer
  key="chofer-map"   //  CLAVE
  center={[-33.6757, -65.4578]}
  zoom={13}
  style={{ height: "100%", width: "100%" }}
>

        <TileLayer
          attribution="© OpenStreetMap"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {posicion && (
          <Marker
  position={
    posicion
      ? [posicion.lat, posicion.lon]
      : [-33.6757, -65.4578]
  }
/>

        )}

        <RecenterMap posicion={posicion} />
      </MapContainer>
    </div>
  );
};

export default ChoferMapView;
