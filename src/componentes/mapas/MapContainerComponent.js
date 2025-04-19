import { useState, useEffect } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import {
  Drawer,
  IconButton,
  Typography,
  List,
  ListItem,
  ListItemText,
  Avatar,
  Button,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";
import { Box } from "@mui/material";


// Icono personalizado
const customIcon = new L.Icon({
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
  iconSize: [30, 45],
  iconAnchor: [15, 45],
  popupAnchor: [0, -45],
  shadowSize: [45, 45],
});

const DEFAULT_POSITION = [-33.6756, -65.4578];

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
  const [openDrawer, setOpenDrawer] = useState(false);
  const [openLineasDrawer, setOpenLineasDrawer] = useState(false);


  const username = localStorage.getItem("username") || sessionStorage.getItem("username");
  const image = localStorage.getItem("image") || sessionStorage.getItem("image");

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

  const fetchBuses = async () => {
    try {
      const response = await fetch("http://localhost:3001/buses");
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

  const handleLogout = () => {
    localStorage.clear();
    sessionStorage.clear();
    window.location.href = "/";
  };

  return (
    <div style={{ position: "relative", height: "100vh" }}>
      {/* Botón para abrir el sidebar */}
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

      {/* Drawer lateral */}
      <Drawer
  anchor="left"
  open={openDrawer}
  onClose={() => setOpenDrawer(false)}
  PaperProps={{
    elevation: 0,
    sx: {
      backgroundColor: 'rgba(169, 213, 238, 0.8)',
      boxShadow: "none",
    },
  }}
  ModalProps={{
    BackdropProps: {
      invisible: true,
    },
  }}
>
  <div style={{ width: 250, padding: 16 }}>
    <Typography variant="h6">🚌 Buses en tiempo real</Typography>
    <List>
      {buses.length === 0 ? (
        <ListItem>
          <ListItemText primary="No hay buses disponibles" />
        </ListItem>
      ) : (
        buses.map((bus) => (
          <ListItem key={bus._id}>
            <ListItemText
              primary={`🚌 ${bus.nombre || "Bus"}`}
              secondary={`📍 ${bus.lat.toFixed(4)}, ${bus.lon.toFixed(4)} ⏰ ${new Date(bus.timestamp).toLocaleTimeString()}`}
            />
          </ListItem>
        ))
      )}
    </List>

    <div style={{ marginTop: 20, textAlign: "center" }}>
      {image && (
        <Avatar
          alt="Perfil"
          src={`http://localhost:3001/uploads/${image}`}
          sx={{ width: 80, height: 80, margin: "0 auto" }}
        />
      )}
      <Typography variant="subtitle1" style={{ marginTop: 10 }}>
        Usuario: {username || "Desconocido"}
      </Typography>

      <Button
        variant="contained"
        color="primary"
        onClick={() => setOpenLineasDrawer(true)}
        style={{ marginTop: 15, width: '100%' }}
      >
        LINEAS
      </Button>
      <Button variant="contained" color="primary" style={{ marginTop: 10, width: '100%' }}>
        SALDO
      </Button>
      <Button variant="contained" color="primary" style={{ marginTop: 10, width: '100%' }}>
        RECARGA
      </Button>
      <Button variant="contained" color="primary" style={{ marginTop: 10, width: '100%' }}>
        CLIMA
      </Button>

      <Button
        variant="contained"
        color="secondary"
        onClick={handleLogout}
        style={{ marginTop: 15, width: '100%' }}
      >
        Cerrar sesión
      </Button>
    </div>
  </div>
</Drawer>

<Drawer
  anchor="bottom"
  open={openLineasDrawer}
  onClose={() => setOpenLineasDrawer(false)}
  PaperProps={{
    sx: {
      height: 180,
      backgroundColor: "transparent",
      padding: 2,
      pl: '200px', // Igual al ancho del drawer izquierdo
      //pr: 2,        // Padding derecho
      boxSizing: 'border-box',
    },
  }}
>
  <Typography variant="h6" sx={{ mb: 1, textAlign: "center" }}>
    🗺️ Líneas disponibles
  </Typography>
  <Box
    sx={{
      display: 'flex',
      justifyContent: 'center', // <--- Mueve los botones hacia la derecha
      gap: 2,
      padding: 1,
      marginRight: '16px', // <--- Ajustá este valor para moverlos más o menos
    }}


  >
    {["A", "E", "Z E", "Z O"].map((linea) => (
      <Button
        key={linea}
        variant="contained"
        //backgroundColor= "yellow"
        sx={{
          borderRadius: "50%",
          width: 70,
          height: 70,
          fontSize: 12,
          background: "green",
          opacity: 0.5,
          textAlign: 'center',
        }}
      >
        {linea}
      </Button>
    ))}
  </Box>
</Drawer>




      {/* Mapa */}
      <MapContainer center={userPosition} zoom={13} style={{ height: "100%" }}>
        <SetViewToLocation position={userPosition} />
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; OpenStreetMap contributors'
        />
        <Marker position={userPosition} icon={customIcon}>
          <Popup>
            <strong>📍 Usuario:</strong> {username}
          </Popup>
        </Marker>
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
