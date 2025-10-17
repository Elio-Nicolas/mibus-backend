import {
  Drawer,
  Typography,
  Avatar,
  Button
} from "@mui/material";
import React from "react";

const Sidebar = ({
  open,
  onClose,
  image,
  username,
  handleImageChange,
  handleChangeUsername,
  handleLogout,
  setOpenLineasDrawer,
  setMostrarClima
}) => {
  return (
    <Drawer
      anchor="left"
      open={open}
      onClose={onClose}
      PaperProps={{
        elevation: 0,
        sx: {
          backgroundColor: "rgba(169, 213, 238, 0.8)",
          boxShadow: "none",
        },
      }}
      ModalProps={{
        BackdropProps: { invisible: true },
      }}
    >
      <div style={{ width: 250, padding: 16 }}>
        <Typography variant="h6">🚌 Buses en tiempo real</Typography>

        {/* Avatar + nombre de usuario */}
        <div style={{ textAlign: "center", marginTop: 20 }}>
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
            sx={{ mt: 1, cursor: "pointer" }}
            onClick={handleChangeUsername}
          >
            Usuario: {username}
          </Typography>
        </div>

        {/* Botones */}
        <div style={{ marginTop: 20, textAlign: "center" }}>
          <Button
            variant="contained"
            color="primary"
            onClick={() => setOpenLineasDrawer(true)}
            sx={{ mt: 1, width: "80%" }}
          >
            LINEAS
          </Button>
          <Button
            variant="contained"
            color="primary"
            sx={{ mt: 1, width: "80%" }}
          >
            SALDO
          </Button>
          <Button
            variant="contained"
            color="primary"
            sx={{ mt: 1, width: "80%" }}
          >
            RECARGA
          </Button>
          <Button
            variant="contained"
            color="primary"
            onClick={() => setMostrarClima(true)}
            sx={{ mt: 1, width: "80%" }}
          >
            CLIMA
          </Button>
          <Button
            variant="contained"
            color="secondary"
            onClick={handleLogout}
            sx={{ mt: 1, width: "80%" }}
          >
            Cerrar sesión
          </Button>
        </div>
      </div>
    </Drawer>
  );
};

export default Sidebar;
