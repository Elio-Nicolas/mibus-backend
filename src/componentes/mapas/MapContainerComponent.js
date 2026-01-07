// MapContainerComponent.js  (REEMPLAZAR TU ARCHIVO COMPLETO)
import { useEffect, useRef, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap, GeoJSON } from "react-leaflet";
import L from "leaflet";
import { IconButton } from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
//import markerIcon from "leaflet/dist/images/marker-icon.png";
//import markerShadow from "leaflet/dist/images/marker-shadow.png";
import Sidebar from "./Sidebar";
import LineasDrawer from "./LineasDrawer";
import ClimaDrawer from "./ClimaDrawer";
import ClimaWidget from "../clima/ClimaWidget";
import "./Drawers.css";
import io from "socket.io-client";
import { useNavigate } from "react-router-dom";

// ===================== CONFIG SOCKET =====================
/*/const socket = io("https://mibus-backend.onrender.com"); // backend en Render
const socket = io("https://mibus-backend.onrender.com", {
  transports: ["websocket"],
});*/

const socket = io("http://localhost:4001", { transports: ["websocket"],});

const getBusStatus = (lastUpdate) => {
  if (!lastUpdate) return { label: "SIN DATOS", color: "#999" };

  const now = Date.now();
  const last = new Date(lastUpdate).getTime();
  const diffSeconds = (now - last) / 1000;

  if (diffSeconds < 30) {
    return { label: "EN SERVICIO", color: "green" };
  }
  if (diffSeconds < 120) {
    return { label: "DETENIDA", color: "orange" };
  }
  return { label: "SIN SEÑAL", color: "red" };
};


const DEFAULT_POSITION = [-33.6756, -65.4578];

const SetViewToLocation = ({ position }) => {
  const map = useMap();
  useEffect(() => {
    if (position) map.setView(position, 13);
  }, [position, map]);
  return null;
};


const getRoleFromToken = () => {
  const token =
    localStorage.getItem("token") ||
    sessionStorage.getItem("token");

  if (!token) return null;

  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload.role || null;
  } catch {
    return null;
  }
};


/* === NEW: createColoredIcon ===
   Genera un ícono SVG dinámico con color y forma.
   (Usalo en los Markers: icon={createColoredIcon(bus.color, bus.shape)})

const createColoredIcon = (color = "#007bff", shape = "circle") => {
  const svgInner =
    shape === "square"
      ? `<rect x="4" y="4" width="32" height="32" rx="6" fill="${color}" stroke="black" stroke-width="2"/>`
      : `<circle cx="20" cy="20" r="12" fill="${color}" stroke="black" stroke-width="2"/>`;

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40">${svgInner}</svg>`;

  const encoded = encodeURIComponent(svg); // <- la clave: encodear

  return new L.Icon({
    iconUrl: `data:image/svg+xml;charset=UTF-8,${encoded}`,
    iconSize: [40, 40],
    iconAnchor: [20, 40],
    popupAnchor: [0, -35],
  });
};
*/

// ================= ICONO UNIDAD / COLECTIVO =================
const createBusIcon = (color = "#007bff") => {
  return L.divIcon({
    className: "bus-icon",
    html: `
      <div style="
        width: 16px;
        height: 16px;
        background: ${color};
        border-radius: 50%;
        border: 2px solid white;
        box-shadow: 0 0 4px rgba(0,0,0,0.5);
      "></div>
    `,
    iconSize: [16, 16],
    iconAnchor: [8, 8],
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
  const lastPositionRef = useRef(null);

  
  // === ESTADO GPS (PRECISIÓN Y FUENTE) ===
  const [gpsInfo, setGpsInfo] = useState({accuracy: null,source: "desconocida",});

  // === SELECCIONA UNIDAD ===
  const [selectedUnit, setSelectedUnit] = useState(localStorage.getItem("unitId") || "");

  // === USER INFO (username) ===
  const [username, setUsername] = useState(localStorage.getItem("username") || sessionStorage.getItem("username") || "Desconocido");
  const [image, setImage] = useState(localStorage.getItem("image") || sessionStorage.getItem("image") || "");
  const role = localStorage.getItem("role") || sessionStorage.getItem("role");

  // ==== VOLVER A MAPA DESDE ADMIN ====
  //const navigate = useNavigate();

  /* === CRITICO: asegurar que exista un userId único por dispositivo ===
     Si no existe en localStorage/sessionStorage, lo creamos (crypto.randomUUID o fallback).
     Esto evita que PC y teléfono compartan el mismo ID.
  */
  const [storedUserId] = useState(() => {
    let id = localStorage.getItem("userId") || sessionStorage.getItem("userId");
    if (!id) {
      // navegador moderno: crypto.randomUUID(); fallback simple si no disponible:
      id = (typeof crypto !== "undefined" && crypto.randomUUID) ? crypto.randomUUID() 
         : `id-${Date.now()}-${Math.floor(Math.random()*10000)}`;
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

  if (isSharing) return;

  if (!("geolocation" in navigator)) {
    alert("La geolocalización no está disponible");
    return;
  }

  if (role !== "CHOFER") {
  alert("Solo los choferes pueden compartir ubicación");
  return;
}

  if (!selectedUnit) {
  alert("Debe seleccionar una unidad antes de iniciar el servicio");
  return;
}

  setIsSharing(true);
  socket.emit("startSharing", storedUserId);


  watchIdRef.current = navigator.geolocation.watchPosition(
  (pos) => {
   const { latitude, longitude, accuracy, speed } = pos.coords;

    console.log("📡 GPS:", {
      lat: latitude,
      lon: longitude,
      accuracy,
      speed
    });

    // Filtro scepta precision baja solo para pc
    const isDesktop = !/Mobi|Android/i.test(navigator.userAgent);

    if (accuracy > 50 && !isDesktop) {
     console.warn("⚠ GPS impreciso (celular)");
     return;
    }

    if (accuracy > 2000 && isDesktop) {
     console.warn("⚠ Ubicación demasiado imprecisa incluso para PC");
     return;
    }

    setGpsInfo({
    accuracy,
    source: isDesktop ? "IP / WiFi (PC)" : "GPS (móvil)"
    });

 //------------------------------------------------------------------------
    
    if (lastPositionRef.current) {
     const [prevLat, prevLon] = lastPositionRef.current;

     const distance = L.latLng(prevLat, prevLon)
      .distanceTo(L.latLng(latitude, longitude));

     // Si el salto es irreal (ej: > 200 m en segundos)
    if (distance > 200) {
     console.warn("🚫 Salto GPS descartado:", distance, "m");
     return;
    }
  }

 lastPositionRef.current = [latitude, longitude];

    const newPosition = [latitude, longitude];
    setUserPosition(newPosition);

    socket.emit("locationUpdate", {
      unitId: selectedUnit,
      driverId: storedUserId,
      driverName: username,
      lat: latitude,
      lon: longitude,
      accuracy,
      speed
    });
  },
  (err) => {
    console.error("❌ Error GPS:", err.message);
  },
  {
    enableHighAccuracy: true,
    timeout: 15000,
    maximumAge: 0
  }
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

  /*// === FETCH INITIAL (ruta REST /buses) ===
  const fetchBuses = async () => {
  try {
    const response = await fetch("http://localhost:4001/buses");
    if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);
    const data = await response.json();

    setBuses(
      data.map((u) => ({
        unitId: u.unitId,
        driverName: u.driverName,
        lat: u.latitude,   // backend REST devuelve latitude
        lon: u.longitude, // backend REST devuelve longitude
        color: u.color || "#007bff",
        lastUpdate: u.lastUpdate,
      }))
    );
  } catch (error) {
    console.error("Error obteniendo buses:", error);
  }
};*/


  /* === SOCKET LISTENERS ===
     - Escuchamos 'busUpdate' (lista completa o parcial) enviado por el backend
     - Escuchamos 'userStopped' para remover usuarios que dejan de compartir (si así lo querés)
  */
  useEffect(() => {
    socket.on("busUpdate", (list) => {
  console.log("🚌 busUpdate recibido:", list);

  setBuses(
    list.map((u) => ({
      unitId: u.unitId,
      driverName: u.driverName,
      lat: u.lat,
      lon: u.lon,
      color: u.color || "#007bff",
      lastUpdate: u.lastUpdate,
    }))
  );
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

 /* useEffect(() => {
    fetchBuses();
    const interval = setInterval(fetchBuses, 3000);
    return () => clearInterval(interval);
  }, []);*/

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
     const response = await fetch(`http://localhost:4001/api/users/upload/${userId}`,{
     method: "PUT",
     body: formData,
    }
    );

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


 useEffect(() => {
  if (!storedUserId) return;

  socket.emit("register", {
    userId: storedUserId,
    username,
    role,
    assignedUnit: role === "CHOFER" ? selectedUnit : null
  });

}, [storedUserId, role, selectedUnit, username]);

  // ===== PARA NAVEGAR DESDE MAPA A PANEL ADMIN =====
  const navigate = useNavigate();

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
         
        {/* Tu marcador (local) 
        {userPosition && (
          <Marker position={userPosition} icon={userIcon}> ## SE ELIMINA 
            <Popup>Estás acá</Popup>
          </Marker>
        )}*/}

        <SetViewToLocation position={userPosition} />

        {/* Marcadores de UNIDADES */}
         {buses
           .filter(
             (bus) =>
              typeof bus.lat === "number" &&
              typeof bus.lon === "number"
            )
            .map((bus) => {
             const status = getBusStatus(bus.lastUpdate);

             return (
           <Marker
             key={`${bus.unitId}-${bus.lat}-${bus.lon}`}
             position={[bus.lat, bus.lon]}
             icon={createBusIcon(status.color)}
             riseOnHover
           >
         
          <Popup>
      <div style={{ minWidth: "180px" }}>
      <strong>🚍 Unidad:</strong> {bus.unitId}
      <br />

       <strong>👤 Chofer:</strong> {bus.driverName || "No asignado"}
      <br />

      <strong>📊 Estado:</strong>{" "}
       <span style={{ color: status.color, fontWeight: "bold" }}>
         {status.label}
         </span>
         <br />

         <strong>🕒 Última señal:</strong>
         <br />
         {bus.lastUpdate
         ? new Date(bus.lastUpdate).toLocaleTimeString()
         : "Sin datos"}
          <hr style={{ margin: "6px 0" }} />

          <small>
           📡 Fuente: {gpsInfo.source}
           <br />
           🎯 Precisión:{" "}
            {gpsInfo.accuracy
             ? `${Math.round(gpsInfo.accuracy)} m`
             : "N/D"}
            </small>
            </div>
           </Popup>
          </Marker>
         )})} 
      </MapContainer>

      {/* BOTÓN Y DRAWERS */}
      <IconButton
        onClick={() => setOpenDrawer(true)}
        style={{
          position: "fixed",
          top: 95,
          right: 10,
          zIndex: 1300,
          backgroundColor: "white",
          border: "1px solid #ccc",
          boxShadow: "0 2px 4px rgba(0,0,0,0.3)",
        }}
      >
        <MenuIcon fontSize="large" />
      </IconButton>
      
      {/* BOTON ELECCION DE UNIDAD */}
      {role === "CHOFER" && (
     <select
      value={selectedUnit}
      onChange={(e) => {
      setSelectedUnit(e.target.value);
      localStorage.setItem("unitId", e.target.value);
      }}
    style={{
      position: "fixed",
      bottom: 80,
      right: 20,
      zIndex: 2000,
      padding: "10px",
      borderRadius: "8px",
      fontSize: "14px",
    }}
  >
    <option value="">Seleccionar unidad</option>
    <option value="Unidad 1">Unidad 1</option>
    <option value="Unidad 2">Unidad 2</option>
    <option value="Unidad 3">Unidad 3</option>
  </select>
)}


       {/* BOTON COMPARTIR UBICACION */}
      {role === "CHOFER" && (
      <button
       disabled={!selectedUnit}
       onClick={isSharing ? stopSharing : startSharing}
       style={{
       position: "fixed",
       bottom: 20,
       right: 20,
       zIndex: 2000,
       padding: "12px 20px",
       backgroundColor: !selectedUnit
        ? "gray"
        : isSharing
        ? "red"
        : "green",
      color: "white",
      border: "none",
      borderRadius: "10px",
      fontSize: "16px",
      cursor: !selectedUnit ? "not-allowed" : "pointer",
    }}
  >
    {isSharing ? "🚫 Finalizar servicio" : "🚍 Iniciar servicio"}
  </button>
)}

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
