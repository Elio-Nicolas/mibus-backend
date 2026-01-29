import React, { useEffect, useState, useMemo } from "react";
import AdminMap from "../componentes/admin/AdminMap";
import { io } from "socket.io-client";
import { ResizableBox } from "react-resizable";
import "react-resizable/css/styles.css";
import { ThemeProvider, createTheme, CssBaseline } from "@mui/material";
import { Switch, FormControlLabel } from "@mui/material";
import AdminHeader from "../componentes/admin/AdminHeader";


// MUI
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Box,
  Paper,
  Button,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Tooltip,
  TableContainer,
  Select,
  MenuItem,
  Stack,
  FormControl,
  InputLabel
} from "@mui/material";

// Icons
import MinimizeIcon from "@mui/icons-material/Minimize";
import CropSquareIcon from "@mui/icons-material/CropSquare";
import CloseIcon from "@mui/icons-material/Close";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import SaveIcon from "@mui/icons-material/Save";
import { MapContainer } from "react-leaflet";
import { useNavigate } from "react-router-dom";

const DEFAULT_LAYOUT = [65, 35];

//const socket = io("http://localhost:4001");

export default function AdminPanel() {

  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editingRole, setEditingRole] = useState("");
  const [editingUnit, setEditingUnit] = useState("");
  const [adding, setAdding] = useState(false);
  const [editingLine, setEditingLine] = useState("");
  const [mode, setMode] = useState("dark");
  const [buses, setBuses] = useState([]);
  const navigate = useNavigate();

  const stored = localStorage.getItem("user");
  const user = stored ? JSON.parse(stored) : null;
  const token = user?.token || null;

  const [demoEnabled, setDemoEnabled] = useState(false);
  const [leftWidth, setLeftWidth] = useState(60); // %
  const isDraggingRef = React.useRef(false);

  const [newUser, setNewUser] = useState({
    username: "",
    password: "",
    role: "PASAJERO",
  });

  const [layout, setLayout] = useState(null);
  

  // ================== SOCKET ====================//
  const socket = io("http://localhost:4001", {
  transports: ["websocket"],
});


  // ================== HANDLE ===============
  const toggleDemo = () => {
  const next = !demoEnabled;
  setDemoEnabled(next);

  socket.emit(next ? "demo:start" : "demo:stop");
};

useEffect(() => {
  const onMouseMove = (e) => {
    if (!isDraggingRef.current) return;

    const container = document.getElementById("admin-layout");
    if (!container) return;

    const rect = container.getBoundingClientRect();
    let percent = ((e.clientX - rect.left) / rect.width) * 100;

    // límites sanos
    percent = Math.max(30, Math.min(80, percent));

    setLeftWidth(percent);
  };

  const onMouseUp = () => {
    isDraggingRef.current = false;
  };

  window.addEventListener("mousemove", onMouseMove);
  window.addEventListener("mouseup", onMouseUp);

  return () => {
    window.removeEventListener("mousemove", onMouseMove);
    window.removeEventListener("mouseup", onMouseUp);
  };
}, []);
// ===================== DEMO
useEffect(() => {
  socket.on("demo:status", ({ enabled }) => {
    setDemoEnabled(enabled);
  });

  return () => socket.off("demo:status");
}, []);

  // ================= FETCH =================
  useEffect(() => {
    fetch("http://localhost:4001/api/admin/users", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then(res => {
        if (!res.ok) {
          throw new Error("No autorizado");
        }
        return res.json();
      })
      .then(data => {
        console.log("USERS DESDE API:", data);
        setUsers(data);
      })
      .catch(err => {
        console.error("Error cargando usuarios:", err);
      });
  }, [token]);

  // ================== eSCucha =====================
  useEffect(() => {
  socket.on("busUpdate", (list) => {
    setBuses(
      list.map((u) => ({
        unitId: u.unitId,
        driverName: u.driverName,
        lat: u.lat,
        lon: u.lon,
        color: u.color || "red",
        lastUpdate: u.lastUpdate,
      }))
    );
  });

  return () => {
    socket.off("busUpdate");
  };
}, []);


  /* ================= FILTRO ================= */
  const filteredUsers = users.filter(u =>
  (u.username || "").toLowerCase().includes(search.toLowerCase()) ||
  (u.role || "").toLowerCase().includes(search.toLowerCase())
);


  /* ================= EDITAR ================= */
  const startEdit = (u) => {
  setEditingId(u._id);
  setEditingRole(u.role);
  setEditingUnit(u.assignedUnit || "");
  setEditingLine(u.assignedLine || "");
};


  const cancelEdit = () => {
    setEditingId(null);
    setEditingRole("");
  };

  // ================ Themes ==================== //
  const theme = useMemo(
  () =>
    createTheme({
      palette: {
        mode,
        background: {
          default: mode === "dark" ? "#020617" : "#eaf5f4ff",
          paper: mode === "dark" ? "#02092dff" : "#ffffffff"
        }
      }
    }),
  [mode]
);


  const saveUnit = async (id) => {
    await fetch(`http://localhost:4001/api/admin/users/${id}/unit`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ unit: editingUnit }),
      }
    );

    setUsers(prev =>
      prev.map(u =>
        u._id === id ? { ...u, assignedUnit: editingUnit } : u
      )
    );
  };

  const saveLine = async (id) => {
  await fetch(`http://localhost:4001/api/admin/users/${id}/line`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ line: editingLine }),
  });

  setUsers(prev =>
    prev.map(u =>
      u._id === id ? { ...u, assignedLine: editingLine } : u
    )
  );
};

  const saveRole = async (id) => {
    await fetch(`http://localhost:4001/api/admin/users/${id}/role`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ role: editingRole }),
      }
    );

    setUsers(prev =>
      prev.map(u => u._id === id ? { ...u, role: editingRole } : u)
    );

    cancelEdit();
  };

  /* ================= ELIMINAR ================= */
  const deleteUser = async (id) => {
    if (!window.confirm("¿Eliminar usuario?")) return;

    await fetch(`http://localhost:4001/api/admin/users/${id}`,
      {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    setUsers(prev => prev.filter(u => u._id !== id));
  };

  /* ================= AGREGAR ================= */
  const addUser = async () => {
    try {
      const res = await fetch("http://localhost:4001/api/admin/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(newUser),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Error al crear usuario");
      }

      setUsers(prev => [...prev, data.user]);
      setAdding(false);
      setNewUser({ username: "", password: "", role: "PASAJERO" });

      alert("Usuario creado correctamente");
    } catch (err) {
      console.error("Error creando usuario:", err);
      alert(err.message);
    }
  };

  if (!user || !token) {
    return <h3>No autorizado</h3>;
  }

  
  //                                                              //
  // =========================== RETURN ========================= //
  //                                                              //
return (
    <ThemeProvider theme={theme}>
    <CssBaseline />
  <Box sx={{ height: "100vh", display: "flex", flexDirection: "column" }}>
  
  <AdminHeader
  mode={mode}
  onToggleMode={() =>
    setMode(prev => (prev === "dark" ? "light" : "dark"))
  }
  demoEnabled={demoEnabled}
  onToggleDemo={toggleDemo}
  onGoMap={() => {
    navigate("/mapa", { state: { fromAdmin: true } });
  }}
/>


<Box
  sx={{
    flex: 1,
    display: "flex",
    overflow: "hidden",
    minHeight: 0
  }}
>

<Box
    sx={{
      width: `${leftWidth}%`,
      overflow: "auto",
      bgcolor: "background.paper"
    }}
  >




      {/* ================= PANEL ADMIN (EL TUYO, ENTERO) ================= */}
     
       <Paper
          elevation={1}
          sx={{
              height: "100%",
              bgcolor: "background.paper",
              p: 2,
              overflow: "auto",   // scroll
             }}
        >


     <div style={{ padding: 20 }}>


     <Box
  sx={{
    display: "flex",
    justifyContent: "flex-end",
    alignItems: "center",
    gap: 1,
    mb: 1,
    px: 1,
    py: 0.5,
    borderBottom: "1px solid",
    borderColor: "divider"
  }}
>
  {/* DEMO */}
  <Tooltip title={demoEnabled ? "Detener DEMO" : "Iniciar DEMO"}>
    <IconButton
      size="small"
      onClick={toggleDemo}
      sx={{
        borderRadius: 1,
        color: demoEnabled ? "error.main" : "success.main",
        boxShadow: demoEnabled
  ? "inset 0 0 0 1px rgba(239,68,68,0.4)"
  : "inset 0 0 0 1px rgba(34,197,94,0.4)",

        bgcolor: demoEnabled
          ? "rgba(239,68,68,0.12)"
          : "rgba(34,197,94,0.12)",
        "&:hover": {
          bgcolor: demoEnabled
            ? "rgba(239,68,68,0.2)"
            : "rgba(34,197,94,0.2)"
        }
      }}
    >
      {demoEnabled ? "🛑" : "▶️"}
    </IconButton>
  </Tooltip>

  {/* VOLVER AL MAPA */}
  <Tooltip title="Volver al mapa">
    <IconButton
      size="small"
      onClick={() =>
        navigate("/mapa", { state: { fromAdmin: true } })
      }
      sx={{
        borderRadius: 1,
        color: "text.secondary",
        "&:hover": {
          bgcolor: "action.hover"
        }
      }}
    >
      🗺️
    </IconButton>
  </Tooltip>
</Box>


            <Stack
              direction="row"
              spacing={2}
              alignItems="center"
              sx={{ mb: 2 }}
            >
              <TextField
                size="small"
                label="Buscar usuario"
                variant="outlined"
                value={search}
                onChange={e => setSearch(e.target.value)}
                sx={{
                  width: 260,
                  input: { color: "#e5e7eb" },
                  label: { color: "#94a3b8" }
                }}
              />

            

<Button
  variant="contained"
  startIcon={<AddIcon />}
  onClick={() => setAdding(true)}
  sx={{
    textTransform: "none",
    fontWeight: 600,
    borderRadius: 2,
    px: 2.5,
    boxShadow: "0 6px 16px rgba(3,169,155,0.25)",
    "&:hover": {
      boxShadow: "0 8px 22px rgba(3,169,155,0.35)",
      transform: "translateY(-1px)"
    }
  }}
>
  Agregar usuario
</Button>


            </Stack>

  
<Typography variant="caption">
  users: {users.length} | filteredUsers: {filteredUsers.length}
</Typography>


        <TableContainer
  component={Paper}
  sx={{
    mt: 2,
    width: "100%",
    overflowX: "auto"
  }}
>

 <Table
  size="small"
  sx={{
    minWidth: 0,        // 🔥 rompe el bloqueo
    width: "100%",
    tableLayout: "fixed",
    "& td, & th": {
      py: 0.25,
      fontSize: 13
    }
  }}
>


    <TableHead>
  <TableRow
  hover
  sx={{
    "&:hover": {
      bgcolor: "action.hover"
    }
  }}
>


        <TableCell><b>Usuario</b></TableCell>
        <TableCell><b>Rol</b></TableCell>
        <TableCell><b>Unidad</b></TableCell>
        <TableCell><b>Línea</b></TableCell>
        <TableCell align="center"><b>Acción</b></TableCell>
      </TableRow>
    </TableHead>

    <TableBody>

      {/* === FILA AGREGAR USUARIO === */}
      {adding && (
        <TableRow>
          <TableCell>
           <TextField
             size="small"
             label="Usuario"
             value={newUser.username}
             onChange={e =>
             setNewUser({ ...newUser, username: e.target.value })
              }
              />

          </TableCell>

          <TableCell>
            <FormControl size="small" fullWidth>
             <InputLabel>Rol</InputLabel>
              <Select
                 value={newUser.role}
                 label="Rol"
                 onChange={e =>
                 setNewUser({ ...newUser, role: e.target.value })
                  }
              >
               <MenuItem value="ADMIN">ADMIN</MenuItem>
               <MenuItem value="INSPECTOR">INSPECTOR</MenuItem>
               <MenuItem value="USUARIO">USUARIO</MenuItem>
               <MenuItem value="CHOFER">CHOFER</MenuItem>
               <MenuItem value="PASAJERO">PASAJERO</MenuItem>
               </Select>
               </FormControl>

           </TableCell>

          <TableCell>
            {newUser.role === "CHOFER" ? (
              <TextField
               size="small"
               label="Unidad"
               value={newUser.assignedUnit || ""}
               onChange={e =>
                setNewUser({ ...newUser, assignedUnit: e.target.value })
              }
               sx={{ width: 80 }}
              />
            ) : (
              "-"
            )}
          </TableCell>

          <TableCell>
            <TextField
              size="small"
              type="password"
              label="Password"
              value={newUser.password}
              onChange={e =>
              setNewUser({ ...newUser, password: e.target.value })
             }
            />

          </TableCell>

          <TableCell align="center">
            <Tooltip title="Guardar">
              <IconButton color="success"
                 sx={{
                      bgcolor: "rgba(34,197,94,0.15)",
                     "&:hover": { bgcolor: "rgba(34,197,94,0.25)" }
                     }}
                    >
                  <SaveIcon />
                </IconButton>

            </Tooltip>

            <Tooltip title="Cancelar">
              <IconButton color="error" onClick={() => setAdding(false)}>
                <CloseIcon />
              </IconButton>
            </Tooltip>
          </TableCell>
        </TableRow>
      )}

      {/* === USUARIOS EXISTENTES === */}
      {filteredUsers.map(u => {
        const editing = editingId === u._id;

        return (
          <TableRow key={u._id} hover>
            <TableCell>{u.username}</TableCell>

            <TableCell>
              {editing ? (
               <FormControl size="small" fullWidth>
                <Select
                  value={editingRole}
                  onChange={e => setEditingRole(e.target.value)}
                >
                <MenuItem value="ADMIN">ADMIN</MenuItem>
                <MenuItem value="INSPECTOR">INSPECTOR</MenuItem>
                <MenuItem value="USUARIO">USUARIO</MenuItem>
                <MenuItem value="CHOFER">CHOFER</MenuItem>
                <MenuItem value="PASAJERO">PASAJERO</MenuItem>
                </Select>
              </FormControl>
               ) : (
                u.role
              )}
            </TableCell>

            <TableCell>
              {u.role === "CHOFER" ? (
                editing ? (
                  <TextField
  size="small"
  value={editingUnit}
  onChange={e => setEditingUnit(e.target.value)}
  sx={{ width: 80 }}
/>

                ) : (
                  u.assignedUnit || "-"
                )
              ) : (
                "-"
              )}
            </TableCell>

            <TableCell>
              {u.role === "CHOFER" ? (
                editing ? (
                  <FormControl size="small" fullWidth>
                   <Select
                    value={editingLine}
                    onChange={e => setEditingLine(e.target.value)}
                   >
                   <MenuItem value="">-</MenuItem>
                   <MenuItem value="A">A</MenuItem>
                   <MenuItem value="E">E</MenuItem>
                   <MenuItem value="ZONA ESTE">ZONA ESTE</MenuItem>
                   <MenuItem value="ZONA OESTE">ZONA OESTE</MenuItem>
                   </Select>
                   </FormControl>
                ) : (
                  u.assignedLine || "-"
                )
              ) : (
                "-"
              )}
            </TableCell>

            <TableCell align="center">
              {editing ? (
                <>
                  <Tooltip title="Guardar">
                    <IconButton
                      color="success"
                      onClick={() => {
                        saveRole(u._id);
                        if (editingRole === "CHOFER") {
                          saveUnit(u._id);
                          saveLine(u._id);
                        }
                      }}
                    >
                      <SaveIcon />
                    </IconButton>
                  </Tooltip>

                  <Tooltip title="Cancelar">
                    <IconButton color="error" onClick={cancelEdit}>
                      <CloseIcon />
                    </IconButton>
                  </Tooltip>
                </>
              ) : (
                <>
                  <Tooltip title="Editar">
                    <IconButton
                      color="primary"
                      onClick={() => startEdit(u)}
                    >
                      <EditIcon />
                    </IconButton>
                  </Tooltip>

                  <Tooltip title="Eliminar">
                    <IconButton
                      color="error"
                      onClick={() => deleteUser(u._id)}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Tooltip>
                </>
              )}
            </TableCell>
          </TableRow>
        );
      })}
    </TableBody>
  </Table>
</TableContainer>

            </div>

        </Paper>
  </Box>      
        

<Box
    
  onMouseDown={() => (isDraggingRef.current = true)}
  sx={{
    width: "4px",
    cursor: "col-resize",
    bgcolor: "divider",
    flexShrink: 0,
    "&:hover": {
      bgcolor: "text.secondary"
    }
  }}
/>


      {/* ================= PANEL MAPA ================= */}


   <Paper
  sx={{
    position:"relative",
    flex: 1,
    display: "flex",
    flexDirection: "column",
    minWidth: 0
  }}
>

          {/* Header del panel mapa 
   <Box sx={{ flexShrink: 0 }}>
     Mapa en tiempo real
   </Box>*/}


          {/* Contenedor del mapa */}
   <Box sx={{ flex: 1 }}>
    <AdminMap buses={buses} />
   </Box>

        </Paper>
   </Box>
   </Box>
  </ThemeProvider>

);
}

