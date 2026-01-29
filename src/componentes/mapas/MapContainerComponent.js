import { useEffect, useRef, useState } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
  useMap,
  GeoJSON,
} from "react-leaflet";

import { useLocation, useNavigate } from "react-router-dom";
//import BusTrailLayer from "./BusTrailLayer";
import L from "leaflet";
//import io from "socket.io-client";
//import { Fragment } from "react";
import { IconButton } from "@mui/material";
//import MenuIcon from "@mui/icons-material/Menu";

//import Sidebar from "./Sidebar";
import LineasDrawer from "./LineasDrawer";
import ClimaDrawer from "./ClimaDrawer";
import ClimaWidget from "../clima/ClimaWidget";

//import { mockVehicles } from "../../mock/vehicles";
//import { moveVehicle } from "../../mock/moveVehicle";
//import { routesByLine } from "../../mock/routes";

import "./Drawers.css";
import { socket } from "../../socket"; 
// ajustá la ruta si hace falta

// ===================== CONFIG SOCKET =====================
/*/const socket = io("https://mibus-backend.onrender.com"); // backend en Render
const socket = io("https://mibus-backend.onrender.com", {
  transports: ["websocket"],
});*/

//const socket = io("http://localhost:4001", { transports: ["websocket"],});

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

const ROLE_UI = {
  GUEST: {
    lineas: true,
    clima: true,
    engranaje: false,
    cerrarSesion: false,
    chofer: false,
    inspector: false,
  },
  PASAJERO: {
    lineas: true,
    clima: true,
    engranaje: false,
    cerrarSesion: false,
    chofer: false,
    inspector: false,
  },
  INSPECTOR: {
    lineas: true,
    clima: true,
    engranaje: false,
    cerrarSesion: true,
    chofer: false,
    inspector: false,
  },
  CHOFER: {
    lineas: false,
    clima: false,
    engranaje: false,
    cerrarSesion: true,
    chofer: false,
    inspector: false,
  },
  ADMIN: {
    lineas: true,
    clima: true,
    engranaje: true,
    cerrarSesion: true,
    chofer: true,
    inspector: true,
  },
};

//const MAX_POINTS = 6;

const DEFAULT_POSITION = [-33.6756, -65.4578];
const LINE_COLORS = {
  A: "#007bff",
  B: "#e91e63",
  C: "#4caf50",
  D: "#ff9800",
};

const SetViewToLocation = ({ position }) => {
  const map = useMap();
  useEffect(() => {
    if (position) map.setView(position, 13);
  }, [position, map]);
  return null;
};


/*const getRoleFromToken = () => {
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
};*/


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



 // ================= HANDLES ====================== //
  /*const handleChangeUsername = () => {
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
  */
const handleLogout = () => {
  localStorage.removeItem("user");
  localStorage.removeItem("unitId");
  window.location.href = "/login";
};


/* === END NEW === */

const MapContainerComponent = () => {
  const [isSharing, setIsSharing] = useState(false);
  const [userPosition, setUserPosition] = useState(null);
  const watchIdRef = useRef(null);
  const [buses, setBuses] = useState([]); // aquí almacenamos los usuarios mostrados en el mapa
  
  //const [openDrawer, setOpenDrawer] = useState(false);
  const [openLineasDrawer, setOpenLineasDrawer] = useState(false);
  const [mostrarClima, setMostrarClima] = useState(false);
  const [selectedLinea, setSelectedLinea] = useState(null);
  const [paradasData, setParadasData] = useState(null);
  const lastPositionRef = useRef(null);
  const [busTrails, setBusTrails] = useState({});
  const location = useLocation();
  //const fromAdmin = location.state?.fromAdmin === true;
  const navigate = useNavigate();


  //* =============== MOCK ============== /
  /*
  const [vehicles, setVehicles] = useState(
  mockVehicles.map(v => ({
    ...v,
    position: routesByLine[v.line][0],
  }))
);*/

  
  // === ESTADO GPS (PRECISIÓN Y FUENTE) ===
  const [ setGpsInfo] = useState({accuracy: null,source: "desconocida",});

  // === SELECCIONA UNIDAD ===
  const [selectedUnit, setSelectedUnit] = useState(localStorage.getItem("unitId") || "");

  // === USER INFO (username) ===
  const [username] = useState(localStorage.getItem("username") || sessionStorage.getItem("username") || "Desconocido");
  //const [image, setImage] = useState(localStorage.getItem("image") || sessionStorage.getItem("image") || "");
  const storedUser = localStorage.getItem("user");
  const user = storedUser ? JSON.parse(storedUser) : null;

  const role = user?.role ?? "GUEST";
  const ui = ROLE_UI[role] || ROLE_UI.GUEST;

  const assignedLine = localStorage.getItem("assignedLine") || sessionStorage.getItem("assignedLine");
  


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

 // setIsSharing(true);
 // socket.emit("startSharing", storedUserId);

/*
  watchIdRef.current = navigator.geolocation.watchPosition(
  (pos) => {
   const { latitude, longitude, accuracy, speed } = pos.coords;

    console.log("📡 GPS:", { //prueba de campo
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
); */

};

  /* ==== STOP SHARING ====
     - Detiene geolocalización
     - Emite 'stopSharing' con el userId (backend decide si borrar o marcar offline)
     - NO borramos la posición local (para hacerlo descomentar setUserPosition(null))
  */
  const stopSharing = () => {
    setIsSharing(false);

    if (watchIdRef.current) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }

    // opcionalmente borra la posición local:
    // setUserPosition(null);

    //socket.emit("stopSharing", storedUserId);
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
      linea: u.linea,
      lat: u.lat,
      lon: u.lon,
      color: u.color || "#007bff",
      lastUpdate: u.lastUpdate,
    }))
  );

  setBusTrails((prev) => {
    const next = { ...prev };

    list.forEach((u) => {
      if (typeof u.lat !== "number" || typeof u.lon !== "number") return;

      if (!next[u.unitId]) {
        next[u.unitId] = [];
      }

      next[u.unitId] = [
        ...next[u.unitId],
        [u.lat, u.lon],
      ].slice(-5); // máximo 5 puntos
    });

    return next;
  });
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

  // ================= MOCK ======================= //
 /* useEffect(() => {
  const interval = setInterval(() => {
    setVehicles(prev =>
      prev.map(v => moveVehicle(v))
    );
  }, 2000); // cada 2 segundos

  return () => clearInterval(interval);
}, []);*/


  useEffect(() => {
    fetch("/lineas.geojson")
      .then((res) => res.json())
      .then((data) => setParadasData(data))
      .catch((err) => console.error("Error cargando GeoJSON:", err));
  }, []);

/*
 useEffect(() => {
  if (!storedUserId) return;

  socket.emit("register", {
    userId: storedUserId,
    username,
    role,
    assignedUnit: role === "CHOFER" ? selectedUnit : null,
    assignedLine: role === "CHOFER" ? assignedLine : null,
  });

}, [storedUserId, role, selectedUnit, username, assignedLine]);*/


  // ===== PARA NAVEGAR DESDE MAPA A PANEL ADMIN =====
  //const navigate = useNavigate();

  // ======================== RENDER ========================
 
  

  return (
    
    <div id="map-wrapper" style={{ position: "relative", height: "100%", width: "100%", overflow: "hidden" }}>

      {/* MAPA */}

     <MapContainer
  center={DEFAULT_POSITION}
  zoom={17}
  preferCanvas={true}
  style={{ height: "100%", width: "100%" }}
>

       
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="&copy; OpenStreetMap contributors" />

        {/* 👉 4.4 RUTAS (Polyline) 
    {Object.entries(routesByLine).map(([line, route]) => (
      <Polyline
        key={line}
        positions={route}
        pathOptions={{ weight: 4 }}
      />
    ))}*/}

    {/* 👉 4.5 COLECTIVOS (Marker) 
    {vehicles.map(bus => (
      <Marker
        key={bus.id}
        position={bus.position}
      >
        {/* Acá podés meter tu Popup actual 
      </Marker>
    ))} */}

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
         {/* MARCADORES DE UNIDADES + ESTELA DE PUNTOS */}
{buses
  .filter((bus) => {
    if (typeof bus.lat !== "number" || typeof bus.lon !== "number") return false;
    if (selectedLinea && bus.linea !== selectedLinea) return false;
    return true;
  })
  .map((bus) => {
    const status = getBusStatus(bus.lastUpdate);
    const lineColor = LINE_COLORS[bus.line] || "#9110b8ff";
    const trail = busTrails[bus.unitId];

    return (
      <>
        {Array.isArray(trail) && trail.length > 1 && (
          <Polyline
            key={`trail-${bus.unitId}`}
            positions={trail}
            pathOptions={{
              color: lineColor,
              weight: 3,
              opacity: 0.6,
            }}
          />
        )}

        <Marker
          key={`marker-${bus.unitId}`}
          position={[bus.lat, bus.lon]}
          icon={createBusIcon(lineColor)}
        >
          <Popup>
            <div style={{ minWidth: "180px" }}>
              <strong>🚌 Línea:</strong> {bus.line || "No asignada"} <br />
              <strong>🚍 Unidad:</strong> {bus.unitId} <br />
              <strong>👤 Chofer:</strong>{" "}
              {bus.driverName || "No asignado"} <br />
              <strong>📊 Estado:</strong>{" "}
              <span style={{ color: status.color, fontWeight: "bold" }}>
                {status.label}
              </span>
            </div>
          </Popup>
        </Marker>
      </>
    );
  })}


      </MapContainer>
       <div
  style={{
    position: "absolute",
    top: "50%",
    left: 10,
    zIndex: 1000,
    display: "flex",
    transform: "translateY(-50%)",
    flexDirection: "column",
    gap: "10px",
    background: "#739bd3ff",
    padding: "8px",
    borderRadius: "12px",
    boxShadow: "0 2px 6px rgba(0,0,0,0.3)"
  }}
>
   {/* ================ ADMINISTRADOR ================= */}
  {/* LÍNEAS */}
  {ui.lineas && (
  <IconButton
  title="Ver líneas"
  onClick={() => setOpenLineasDrawer(true)}
>
  🚌
</IconButton>

  )}

  {/* CLIMA */}
 {ui.clima && (
  <IconButton
  title="Clima"
  onClick={() => setMostrarClima(true)}
>
  ☀️
</IconButton>

  )}

  {/* PANEL ADMIN */}
  {ui.engranaje && (
  <IconButton
  title="Panel administrador"
  onClick={() => navigate("/admin")}
>
  ⚙️
</IconButton>

  )}

{/* SEGUIMIENTO CHOFERES - SOLO ADMIN */}
{ui.engranaje && (
  <IconButton
    title="Seguimiento de choferes"
    onClick={() => navigate("/admin/choferes")}
    sx={{
      backgroundColor: "#2e7d32",
      color: "white",
      "&:hover": { backgroundColor: "#1b5e20" },
      marginBottom: "8px",
    }}
  >
    🚍
  </IconButton>
)}

{/* SEGUIMIENTO INSPECTORES - SOLO ADMIN */}
{ui.engranaje && (
  <IconButton
    title="Seguimiento de inspectores"
    onClick={() => navigate("/admin/inspectores")}
    sx={{
      backgroundColor: "#1565c0",
      color: "white",
      "&:hover": { backgroundColor: "#0d47a1" },
    }}
  >
    🕵️
  </IconButton>
)}


{ui.cerrarSesion && (
  <IconButton onClick={handleLogout}>
    🔒
  </IconButton>
)}

</div>

 {/* ================= CHOFER ================= */}

{ui.isChofer && (
  <>
    {/* SELECCIÓN DE UNIDAD */}
    <select
      value={selectedUnit}
      onChange={(e) => {
        setSelectedUnit(e.target.value);
        localStorage.setItem("unitId", e.target.value);
      }}
      style={{
        position: "fixed",
        bottom: 90,
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

    {/* BOTÓN INICIAR / FINALIZAR SERVICIO */}
    <IconButton
      disabled={!selectedUnit}
      onClick={isSharing ? stopSharing : startSharing}
      title={isSharing ? "Finalizar servicio" : "Iniciar servicio"}
      style={{
        position: "fixed",
        bottom: 20,
        right: 20,
        zIndex: 2000,
        backgroundColor: !selectedUnit
          ? "#9e9e9e"
          : isSharing
          ? "#d32f2f" // rojo
          : "#2e7d32", // verde
        color: "white",
        width: 56,
        height: 56,
      }}
    >
      {isSharing ? "🚫" : "🚍"}
    </IconButton>
  </>
)}

{/* ================= INSPECTOR ================= */}

{ui.isInspector && (
  <>
    {/* LÍNEAS */}
    <IconButton
      onClick={() => setOpenLineasDrawer(true)}
      title="Ver líneas"
      style={{ backgroundColor: "white" }}
    >
      🚌
    </IconButton>

    {/* CLIMA */}
    <IconButton
      onClick={() => setMostrarClima(true)}
      title="Ver clima"
      style={{ backgroundColor: "white" }}
    >
      ☀️
    </IconButton>

    {/* CERRAR SESIÓN */}
    <IconButton
      onClick={handleLogout}
      title="Cerrar sesión"
      style={{ backgroundColor: "#d32f2f", color: "white" }}
    >
      🚪
    </IconButton>
  </>
)}

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
