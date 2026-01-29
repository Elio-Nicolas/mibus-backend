import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import IconButton from "@mui/material/IconButton";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Tooltip from "@mui/material/Tooltip";
import { Switch, FormControlLabel } from "@mui/material";

import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import PauseIcon from "@mui/icons-material/Pause";
import MapIcon from "@mui/icons-material/Map";
import BarChartIcon from "@mui/icons-material/BarChart";
import SettingsIcon from "@mui/icons-material/Settings";
import PersonIcon from "@mui/icons-material/Person";

import React, { useState } from "react";

export default function AdminHeader({
  mode,
  onToggleMode,
  onToggleDemo,
  demoEnabled,
  onGoMap }) {
  return (
    <AppBar
       position="static"
       elevation={1}
       sx={{
             bgcolor: "background.paper",
             color: "text.primary",
             borderBottom: "1px solid",
             borderColor: "divider",
             zIndex: theme => theme.zIndex.drawer + 1
           }}
    >

      <Toolbar sx={{ minHeight: 56 }}>
        {/* MODE */}
        <FormControlLabel
          control={
            <Switch
              checked={mode === "dark"}
              onChange={onToggleMode}
            />
          }
          label={mode === "dark" ? "Dark" : "Light"}
        />

        {/* Branding */}
        <Typography variant="subtitle1" sx={{ fontWeight: 1000 }}>
          MiBus
        </Typography>
        <Typography variant="caption" sx={{ ml: 1, color: "text.secondary" }}>
          Transporte Inteligente
        </Typography>

        <Box sx={{ flexGrow: 1 }} />

        {/* TOOLBAR */}
        <Box sx={{ display: "flex", gap: 1}}>
          <Tooltip title={demoEnabled ? "Detener demo" : "Iniciar demo"}>
            <IconButton size="small" onClick={onToggleDemo} >
             {demoEnabled ? <PauseIcon /> : <PlayArrowIcon />}
            </IconButton>
          </Tooltip>

          <Tooltip title="Pausar">
            <IconButton size="small">
              <PauseIcon />
            </IconButton>
          </Tooltip>

          <Tooltip title="Volver al mapa">
            <IconButton size="small" onClick={onGoMap}>
              <MapIcon />
            </IconButton>
          </Tooltip>

          <Tooltip title="Datos">
            <IconButton size="small">
              <BarChartIcon />
            </IconButton>
          </Tooltip>

          <Tooltip title="Configuración">
            <IconButton size="small">
              <SettingsIcon />
            </IconButton>
          </Tooltip>

          <Tooltip title="Usuario">
            <IconButton size="small">
              <PersonIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Toolbar>
    </AppBar>
  );
}
