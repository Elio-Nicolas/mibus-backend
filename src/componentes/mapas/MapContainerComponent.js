import { useEffect, useRef, useState } from "react";
import {MapContainer,TileLayer,Marker,Popup,useMap,} from "react-leaflet";
import L from "leaflet";
import {Drawer,IconButton,Typography,List,ListItem,ListItemText,Avatar,Button,} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";
import { Box } from "@mui/material";
import ClimaWidget from "../clima/ClimaWidget";
import { Polyline } from "react-leaflet";

// Icono personalizado
const customIcon = new L.Icon({
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
  iconSize: [30, 45],
  iconAnchor: [15, 45],
  popupAnchor: [0, -45],
  shadowSize: [45, 45],
});

const DEFAULT_POSITION = [-33.6756, -65.4578]; // Posicion por defecto Plaza San Martin

const colectivoIcon = new L.Icon({
  iconUrl: "https://cdn-icons-png.flaticon.com/512/296/296216.png",
  iconSize: [40, 40],     // Tamaño del ícono
  iconAnchor: [20, 40],   // Punto de anclaje 
  popupAnchor: [0, -40],  // Popup respecto al ícono
});


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
  const [mostrarClima, setMostrarClima] = useState(false);
  //const username = localStorage.getItem("username") || sessionStorage.getItem("username");
  //const image = localStorage.getItem("image") || sessionStorage.getItem("image");

// array con posiciones estaticas solo pruebas
const rutaColectivo = [
  [-33.675013, -65.461921], // Plaza San Martín 
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
  [-33.673258, -65.461425],
  [-33.674140, -65.461704],
  [-33.675037, -65.461927],
];

const [posicionIndex, setPosicionIndex] = useState(0);
const intervaloRef = useRef(null);


// Usuario e imagen del avatar
const [username, setUsername] = useState(
  localStorage.getItem("username") || sessionStorage.getItem("username") || "Desconocido"
);

const [image, setImage] = useState(
  localStorage.getItem("image") || sessionStorage.getItem("image") || ""
);

useEffect(() => {
  intervaloRef.current = setInterval(() => {
    setPosicionIndex((prev) => (prev + 1) % rutaColectivo.length);
  }, 2700); // cada 1 segundo

  return () => clearInterval(intervaloRef.current); // limpieza al desmontar
}, []);


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
    console.error("❌ Error subiendo imagen:", error);
  }
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
     <div style={{ textAlign: "center" }}>
  <input
    type="file"
    accept="image/*"
    style={{ display: "none" }}
    id="avatarUpload"
    onChange={handleImageChange}
  />
  <label htmlFor="avatarUpload">
    <Avatar
      alt="Perfil"
      src={image ? `http://localhost:4001/uploads/${image}` : ""}
      sx={{ width: 85, height: 85, margin: "0 auto", cursor: "pointer" }}
    />
  </label>
  <Typography
    variant="subtitle1"
    style={{ marginTop: 10, cursor: "pointer" }}
    onClick={handleChangeUsername}
  >
    Usuario: {username}
  </Typography>
</div>

      <Button
        variant="contained"
        color="primary"
        onClick={() => setOpenLineasDrawer(true)}
        style={{ marginTop: 15, width: '80%' }}
      >
        LINEAS
      </Button>
      <Button variant="contained" color="primary" style={{ marginTop: 10, width: '80%' }}>
        SALDO
      </Button>
      <Button variant="contained" color="primary" style={{ marginTop: 10, width: '80%' }}>
        RECARGA
      </Button>
      <Button
  variant="contained"
  color="primary"
  onClick={() => setMostrarClima(true)}
  style={{ marginTop: 15, width: '80%' }}
>
  CLIMA
</Button>
      <Button
        variant="contained"
        color="secondary"
        onClick={handleLogout}
        style={{ marginTop: 15, width: '80%' }}
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
          width: 60,
          height: 60,
          fontSize: 16,
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

<Drawer
  anchor="right"
  open={mostrarClima}
  onClose={() => setMostrarClima(false)}
  PaperProps={{
    sx: {
      backgroundColor: "transparent",
      padding: 2,
      width: 250,
    }
  }}
  
>
  <ClimaWidget />
</Drawer>

      {/* Mapa */}
      <MapContainer
      center={[-33.6752, -65.4607]}
      zoom={17}
      style={{ height: "100vh", width: "100%" }}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution="&copy; OpenStreetMap contributors"
      />

      {/* Línea del recorrido */}
      <Polyline positions={rutaColectivo} color="blue" />

      {/* Marcador móvil */}
      <Marker
  position={rutaColectivo[posicionIndex]}
  icon={colectivoIcon}
>
  <Popup>🚌 Bus en movimiento</Popup>
</Marker>

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
