import { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

const userData = localStorage.getItem("user");
const user = userData ? JSON.parse(userData) : null;


// Icono personalizado para los buses y el usuario
const customIcon = new L.Icon({
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
  iconSize: [30, 45],
  iconAnchor: [15, 45],
  popupAnchor: [0, -45],
  shadowSize: [45, 45],
});

// Posición por defecto: Villa Mercedes, San Luis, Argentina
const DEFAULT_POSITION = [-33.6756, -65.4578];

// Componente para centrar el mapa en la ubicación del usuario
const SetViewToLocation = ({ position }) => {
  const map = useMap();
  useEffect(() => {
    if (position) {
      map.setView(position, 13);
    }
  }, [position, map]);
  return null;
};

const MapContainerComponent = () => {
  const [buses, setBuses] = useState([]);
  const [userPosition, setUserPosition] = useState(DEFAULT_POSITION);
  const username =
  localStorage.getItem("username") || sessionStorage.getItem("username");
  localStorage.getItem("user")
  const image = localStorage.getItem("image") || sessionStorage.getItem("image");

  console.log(localStorage.getItem("image"))

  // Obtener la ubicación del usuario
  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords;
          setUserPosition([latitude, longitude]);
        },
        (error) => {
          console.error("Error obteniendo ubicación:", error.message);
        }
      );
    }
  }, []);

  // Función para obtener los datos del backend
  const fetchBuses = async () => {
    try {
      const response = await fetch("http://localhost:3001/buses");

      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status}`);
      }

      const data = await response.json();
      setBuses(data);
    } catch (error) {
      console.error("Error obteniendo buses:", error);
    }
  };
/*
  // Llamar a la API cada 3 segundos
  useEffect(() => {
    fetchBuses();
    const interval = setInterval(fetchBuses, 3000);  //refresco cada 3 seg.
    return () => clearInterval(interval);
  }, []);*/


  return (
    <div className="map-container-wrapper">
      {/* Panel lateral con datos de buses */}
      <div className="bus-info-panel">
        <h2>🚌 Buses en tiempo real</h2>
        {buses.length === 0 ? (
          <p>No hay buses disponibles en este momento.</p>
        ) : (
          buses.map((bus) => (
            <div key={bus._id} className="bus-info">
              <b>🚌 {bus.nombre || "Bus"}</b>
              <p>📍 {bus.lat.toFixed(4)}, {bus.lon.toFixed(4)}</p>
              <p>⏰ {new Date(bus.timestamp).toLocaleTimeString()}</p>
            </div>
          ))
        )}
        <div className="user-info">
         <h3>👤 Usuario: {username || "Desconocido"}</h3>
         {image && (
  <img
    alt="Foto de perfil"
    src={`http://localhost:3001/uploads/${image}`}
    style={{ width: "100px", borderRadius: "50%" }}
  />
)}

        </div>
         </div>

  
      {/* Mapa */}
      <MapContainer center={userPosition} zoom={13} className="map-container">
        <SetViewToLocation position={userPosition} />
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        />

        {/* 📌 Marcador del usuario */}
        <Marker position={userPosition} icon={customIcon}>  
          <Popup><strong>📍 Usuario:</strong> {username}</Popup> 
        </Marker>


        {/* 🚌 Marcadores de los buses */}
        {buses.map((bus) => (
          <Marker key={bus._id} position={[bus.lat, bus.lon]} icon={customIcon}>
            <Popup>
              <b>🚌 {bus.nombre || "Bus"}</b> <br />
              📍 {bus.lat.toFixed(4)}, {bus.lon.toFixed(4)} <br />
              ⏰ {new Date(bus.timestamp).toLocaleTimeString()}
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
};

export default MapContainerComponent;
