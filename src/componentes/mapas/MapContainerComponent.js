// MapContainerComponent.js  (REEMPLAZAR TU ARCHIVO COMPLETO)
import { useEffect, useRef, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap, GeoJSON } from "react-leaflet";
import L from "leaflet";
import { IconButton } from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";
import Sidebar from "./Sidebar";
import LineasDrawer from "./LineasDrawer";
import ClimaDrawer from "./ClimaDrawer";
import ClimaWidget from "../clima/ClimaWidget";
import "./Drawers.css";
import io from "socket.io-client";

// ===================== CONFIG SOCKET =====================
const socket = io("https://mibus-backend.onrender.com"); // tu backend en Render

// ===================== ICONOS =============================

const userIcon = new L.Icon({
            iconUrl: "https://cdn-icons-png.flaticon.com/512/64/64113.png",
            iconSize: [35, 35],
            iconAnchor: [17, 35],
            popupAnchor: [0, -30],
            });

const customIcon = new L.Icon({
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
  iconSize: [30, 45],
  iconAnchor: [15, 45],
  popupAnchor: [0, -45],
  shadowSize: [45, 45],
});

// ícono por defecto (si necesitás)
const colectivoIcon = new L.Icon({
  iconUrl: "https://cdn-icons-png.flaticon.com/512/296/296216.png",
  iconSize: [40, 40],
  iconAnchor: [20, 40],
  popupAnchor: [0, -40],
});

const DEFAULT_POSITION = [-33.6756, -65.4578];

const SetViewToLocation = ({ position }) => {
  const map = useMap();
  useEffect(() => {
    if (position) map.setView(position, 13);
  }, [position, map]);
  return null;
};

/* === NEW: createColoredIcon ===
   Genera un ícono SVG dinámico con color y forma.
   (Usalo en los Markers: icon={createColoredIcon(bus.color, bus.shape)})
*/
const createColoredIcon = (color = "#007bff", shape = "circle") => {
  const svg =
    shape === "square"
      ? `<rect x='4' y='4' width='32' height='32' rx='6' fill='${color}' stroke='black' stroke-width='2'/>`
      : `<circle cx='20' cy='20' r='12' fill='${color}' stroke='black' stroke-width='2'/>`;

  return new L.Icon({
    iconUrl: `data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='40' height='40'>${svg}</svg>`,
    iconSize: [40, 40],
    iconAnchor: [20, 40],
    popupAnchor: [0, -35],
  });
};
/* === END NEW === */

const MapContainerComponent = () => {
  const [isSharing, setIsSharing] = useState(false);
  const [userPosition, setUserPosition] = useState(null);
  const watchIdRef = useRef(null);
  const [buses, setBuses] = useState([]); // aquí almacenamos los usuarios mostrados en el mapa
  const [openDrawer, setOpenDrawer] = useState(false);
  const [openLineasDrawer, setOpenLineasDrawer] = useState(false);
  const [mostrarClima, setMostrarClima] = useState(false);
  const [selectedLinea, setSelectedLinea] = useState(null);
  const [paradasData, setParadasData] = useState(null);


  // === USER INFO (username) ===
  const [username, setUsername] = useState(
    localStorage.getItem("username") || sessionStorage.getItem("username") || "Desconocido"
  );
  const [image, setImage] = useState(
    localStorage.getItem("image") || sessionStorage.getItem("image") || ""
  );

  /* === CRITICAL: asegurar que exista un userId único por dispositivo ===
     Si no existe en localStorage/sessionStorage, lo creamos (crypto.randomUUID o fallback).
     Esto evita que PC y teléfono compartan el mismo ID.
  */
  const [storedUserId, setStoredUserId] = useState(() => {
    let id = localStorage.getItem("userId") || sessionStorage.getItem("userId");
    if (!id) {
      // navegador moderno: crypto.randomUUID(); fallback simple si no disponible:
      id = (typeof crypto !== "undefined" && crypto.randomUUID) ? crypto.randomUUID() : `id-${Date.now()}-${Math.floor(Math.random()*10000)}`;
      localStorage.setItem("userId", id);
      sessionStorage.setItem("userId", id);
    }
    return id;
  });

  /* ==== START SHARING ====
     - Solicita geolocalización
     - Actualiza userPosition local
     - Emite event 'locationUpdate' (payload con nombres que el backend espera: id, username, lat, lon)
     - También emite 'startSharing' para marcar el estado en el backend (opcional)
  */
  const startSharing = () => {
    if (!("geolocation" in navigator)) {
      alert("La geolocalización no está disponible");
      return;
    }

    setIsSharing(true);

    // avisar al backend que empezamos a compartir (opcional, pero útil)
    socket.emit("startSharing", storedUserId);

    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setUserPosition([latitude, longitude]);

        // Enviamos LO QUE EL BACKEND ESPERA: id, username, lat, lon
        socket.emit("locationUpdate", {
          id: storedUserId,
          username,
          lat: latitude,
          lon: longitude,
        });
      },
      (err) => console.error("Error obteniendo ubicación:", err.message),
      { enableHighAccuracy: true, maximumAge: 0 }
    );
  };

  /* ==== STOP SHARING ====
     - Detiene geolocalización
     - Emite 'stopSharing' con el userId (backend decide si borrar o marcar offline)
     - NO borramos la posición local (si querés que desaparezca, descomentá setUserPosition(null))
  */
  const stopSharing = () => {
    setIsSharing(false);

    if (watchIdRef.current) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }

    // opcionalmente borrar posición local:
    // setUserPosition(null);

    socket.emit("stopSharing", storedUserId);
  };

  // === FETCH INITIAL (ruta REST /buses) ===
  const fetchBuses = async () => {
    try {
      const response = await fetch("https://mibus-backend.onrender.com/buses");
      if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);
      const data = await response.json();
      // data esperado: array de { userId, username, latitude, longitude, color, shape }
      setBuses(data);
    } catch (error) {
      console.error("Error obteniendo buses:", error);
    }
  };

  /* === SOCKET LISTENERS ===
     - Escuchamos 'busUpdate' (lista completa o parcial) enviado por el backend
     - Escuchamos 'userStopped' para remover usuarios que dejan de compartir (si así lo querés)
  */
  useEffect(() => {
    socket.on("busUpdate", (list) => {
      // backend puede enviar lista de documentos (con doc.id, doc.lat, etc)
      // normalizamos a la forma que usa el frontend
      try {
        setBuses(
          list.map((doc) => ({
            userId: doc.id || doc.userId,
            username: doc.username || doc.user,
            latitude: doc.lat ?? doc.latitude,
            longitude: doc.lon ?? doc.longitude,
            color: doc.color || "#007bff",
            shape: doc.shape || "circle",
          }))
        );
      } catch (err) {
        console.error("Error mapeando busUpdate:", err, list);
      }
    });

    socket.on("userStopped", (userId) => {
      // opcional: eliminar del array para que desaparezca del mapa
      setBuses((prev) => prev.filter((b) => b.userId !== userId));
    });

    return () => {
      socket.off("busUpdate");
      socket.off("userStopped");
    };
  }, []);

  useEffect(() => {
    fetchBuses();
    const interval = setInterval(fetchBuses, 3000);
    return () => clearInterval(interval);
  }, []);

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
      const response = await fetch(`https://mibus-backend.onrender.com/api/users/upload/${userId}`, {
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

  useEffect(() => {
    fetch("/lineas.geojson")
      .then((res) => res.json())
      .then((data) => setParadasData(data))
      .catch((err) => console.error("Error cargando GeoJSON:", err));
  }, []);

  // ======================== RENDER ========================
  return (
    <div style={{ position: "relative", height: "100vh", width: "100vw", overflow: "hidden" }}>
      {/* MAPA */}
      <MapContainer center={DEFAULT_POSITION} zoom={17} style={{ height: "100%", width: "100%" }}>
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="&copy; OpenStreetMap contributors" />

        {selectedLinea === "A" && paradasData && (
          <GeoJSON
            data={paradasData}
            pointToLayer={(feature, latlng) =>
              L.marker(latlng, {
                icon: new L.Icon({
                  iconUrl: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24'><circle cx='12' cy='12' r='2' fill='%23007bff'/></svg>",
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

        {/* Tu marcador (local) */}
        {userPosition && (
          <Marker position={userPosition} icon={userIcon}>
            <Popup>Estás acá</Popup>
          </Marker>
        )}

        <SetViewToLocation position={userPosition} />

        {/* Marcadores de otros usuarios (PERSONAS) */}
        {buses.map((bus) => (
          <Marker
            key={bus.userId}
            position={[bus.latitude, bus.longitude]}
            icon={createColoredIcon(bus.color, bus.shape)}
          >
            <Popup>{bus.username || bus.userId}</Popup>
          </Marker>
        ))}
      </MapContainer>

      {/* BOTÓN Y DRAWERS */}
      <IconButton
        onClick={() => setOpenDrawer(true)}
        style={{
          position: "fixed",
          top: 20,
          right: 10,
          zIndex: 1300,
          backgroundColor: "white",
          border: "1px solid #ccc",
          boxShadow: "0 2px 4px rgba(0,0,0,0.3)",
        }}
      >
        <MenuIcon fontSize="large" />
      </IconButton>

      <button
        onClick={isSharing ? stopSharing : startSharing}
        style={{
          position: "fixed",
          bottom: 20,
          right: 20,
          zIndex: 2000,
          padding: "12px 20px",
          backgroundColor: isSharing ? "red" : "green",
          color: "white",
          border: "none",
          borderRadius: "10px",
          fontSize: "16px",
          boxShadow: "0 2px 5px rgba(0,0,0,0.3)",
        }}
      >
        {isSharing ? "🚫 Dejar de compartir" : "🚩 Compartir ubicación"}
      </button>

      <Sidebar
        open={openDrawer}
        onClose={() => setOpenDrawer(false)}
        buses={buses}
        image={image}
        username={username}
        handleImageChange={handleImageChange}
        handleChangeUsername={handleChangeUsername}
        handleLogout={() => { localStorage.clear(); sessionStorage.clear(); window.location.href = "/"; }}
        setOpenLineasDrawer={setOpenLineasDrawer}
        setMostrarClima={setMostrarClima}
      />

      <LineasDrawer
        open={openLineasDrawer}
        onClose={() => setOpenLineasDrawer(false)}
        onLineaSelect={(linea) => {
          setSelectedLinea(linea);
          setOpenLineasDrawer(false);
        }}
      />

      <ClimaDrawer open={mostrarClima} onClose={() => setMostrarClima(false)}>
        <ClimaWidget />
      </ClimaDrawer>
    </div>
  );
};

export default MapContainerComponent;
