import { useEffect, useRef, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap, Polyline } from "react-leaflet";
import L from "leaflet";
import { IconButton, Typography, Box, Button } from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";
import Sidebar from "./Sidebar";
import LineasDrawer from "./LineasDrawer";
import ClimaDrawer from "./ClimaDrawer";
import ClimaWidget from "../clima/ClimaWidget";
import { GeoJSON } from "react-leaflet";
//import paradasGeoJSON from "./mapas/lineas.geojson";



// Iconos
const customIcon = new L.Icon({
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
  iconSize: [30, 45],
  iconAnchor: [15, 45],
  popupAnchor: [0, -45],
  shadowSize: [45, 45],
});

const colectivoIcon = new L.Icon({
  iconUrl: "https://cdn-icons-png.flaticon.com/512/296/296216.png",
  iconSize: [40, 40],
  iconAnchor: [20, 40],
  popupAnchor: [0, -40],
});

const DEFAULT_POSITION = [-33.6756, -65.4578];

// Para centrar mapa en posición dinámica
const SetViewToLocation = ({ position }) => {
  const map = useMap();
  useEffect(() => {
    if (position) map.setView(position, 13);
  }, [position, map]);
  return null;
};

const MapContainerComponent = () => {
  // Estados principales
  const [buses, setBuses] = useState([]);
  const [userPosition, setUserPosition] = useState(DEFAULT_POSITION);
  const [openDrawer, setOpenDrawer] = useState(false);
  const [openLineasDrawer, setOpenLineasDrawer] = useState(false);
  const [mostrarClima, setMostrarClima] = useState(false);

  const [posicionIndex, setPosicionIndex] = useState(0);
  const intervaloRef = useRef(null);

  const [username, setUsername] = useState(
    localStorage.getItem("username") || sessionStorage.getItem("username") || "Desconocido"
  );
  const [image, setImage] = useState(
    localStorage.getItem("image") || sessionStorage.getItem("image") || ""
  );

  // Recorrido del colectivo ARRAY
  const rutaColectivo = [
    [-33.675013, -65.461921],
    [-33.674815, -65.463013],
    [-33.675660, -65.463276],
    [-33.675899, -65.462208],
    [-33.676837, -65.462482],
    [-33.677760, -65.462771],
    [-33.678644, -65.463029],
    [-33.679514, -65.463302],
    [-33.680398, -65.463592],
    [-33.681291, -65.463827],
    [-33.681551, -65.462801],
    [-33.680661, -65.462512],
    [-33.679752, -65.462244],
    [-33.678862, -65.461977],
    [-33.677962, -65.461698],
    [-33.678194, -65.460662],
    [-33.678416, -65.459570],
    [-33.677500, -65.459313],
    [-33.676599, -65.459083],
    [-33.675718, -65.458785],
    [-33.675470, -65.459864],
    [-33.675238, -65.460923],
    [-33.674387, -65.460626],
    [-33.673474, -65.460347],
    [-33.673258, -65.461425],
    [-33.674140, -65.461704],
    [-33.675037, -65.461927],
  ];

  // Animación del Cole
  useEffect(() => {
    intervaloRef.current = setInterval(() => {
      setPosicionIndex((prev) => (prev + 1) % rutaColectivo.length);
    }, 2700);
    return () => clearInterval(intervaloRef.current);
  }, []);

  // Geolocalización del usuario
  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setUserPosition([pos.coords.latitude, pos.coords.longitude]),
        (error) => console.error("Error obteniendo ubicación:", error.message)
      );
    }
  }, []);

  // Fetch clectivo desde back
  const fetchBuses = async () => {
    try {
      const response = await fetch("http://localhost:4001/buses");
      if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);
      const data = await response.json();
      setBuses(data);
    } catch (error) {
      console.error("Error obteniendo buses:", error);
    }
  };

  useEffect(() => {
    fetchBuses();
    const interval = setInterval(fetchBuses, 3000);
    return () => clearInterval(interval);
  }, []);

  // Funciones de usuario
  const handleLogout = () => {
    localStorage.clear();
    sessionStorage.clear();
    window.location.href = "/";
  };

  const handleChangeUsername = () => {
    const newName = prompt("Ingrese su nuevo nombre:", username);
    if (newName) {
      localStorage.setItem("username", newName);
      setUsername(newName);
    }
  };

  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const userId = localStorage.getItem("userId") || sessionStorage.getItem("userId");
    const formData = new FormData();
    formData.append("image", file);
    try {
      const response = await fetch(`http://localhost:4001/api/users/upload/${userId}`, {
        method: "PUT",
        body: formData,
      });
      const data = await response.json();
      if (data.user && data.user.image) {
        localStorage.setItem("image", data.user.image);
        setImage(data.user.image);
      }
    } catch (error) {
      console.error("Error subiendo imagen:", error);
    }
  };

  // ACA

  const [paradasData, setParadasData] = useState(null);

useEffect(() => {
  fetch("/lineas.geojson")
    .then((res) => res.json())
    .then((data) => {console.log("📍 Datos GeoJSON cargados:", data); setParadasData(data);})
    .catch((err) => console.error("Error cargando GeoJSON:", err));
}, []);


  return (
    <div style={{ position: "relative", height: "100vh" }}>
      {/* Botón para abrir sidebar */}
      <IconButton
        onClick={() => setOpenDrawer(true)}
        style={{
          position: "absolute",
          top: 20,
          right: 10,
          zIndex: 1000,
          backgroundColor: "white",
          border: "1px solid #ccc",
          boxShadow: "0 2px 4px rgba(0,0,0,0.3)",
        }}
      >
        <MenuIcon fontSize="large" />
      </IconButton>

      {/* Sidebar */}
      <Sidebar
        open={openDrawer}
        onClose={() => setOpenDrawer(false)}
        buses={buses}
        image={image}
        username={username}
        handleImageChange={handleImageChange}
        handleChangeUsername={handleChangeUsername}
        handleLogout={handleLogout}
        setOpenLineasDrawer={setOpenLineasDrawer}
        setMostrarClima={setMostrarClima}
      />

      {/* Drawer de líneas */}
      <LineasDrawer open={openLineasDrawer} onClose={() => setOpenLineasDrawer(false)} />

      {/* Drawer de clima */}
      <ClimaDrawer open={mostrarClima} onClose={() => setMostrarClima(false)}>
        <ClimaWidget />
      </ClimaDrawer>

      {/* Mapa */}
      <MapContainer
        center={DEFAULT_POSITION}
        zoom={17}
        style={{ height: "100vh", width: "100%" }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution="&copy; OpenStreetMap contributors"
        />

        <Polyline positions={rutaColectivo} color="blue" />

        {/* Paradas de colectivo */}
{paradasData && (
  <GeoJSON
    data={paradasData}
    pointToLayer={(feature, latlng) =>
      L.marker(latlng, {
        icon: new L.Icon({
          iconUrl: "https://cdn-icons-png.flaticon.com/512/684/684908.png",
          iconSize: [25, 25],
          iconAnchor: [12, 24],
          popupAnchor: [0, -20],
        }),
      })
    }
    onEachFeature={(feature, layer) => {
      const name = feature.properties?.name || "Parada de colectivo";
      layer.bindPopup(`🚌 ${name}`);
    }}
  />
)}



        {/* Bus en movimiento */}
        <Marker position={rutaColectivo[posicionIndex]} icon={colectivoIcon}>
          <Popup>🚌 Colectivo en movimiento</Popup>
        </Marker>

        {/* Usuario */}
        {userPosition && (
          <Marker position={userPosition} icon={customIcon}>
            <Popup>Estás acá</Popup>
          </Marker>
        )}

        <SetViewToLocation position={userPosition} />
      </MapContainer>
    </div>
  );
};

export default MapContainerComponent;
