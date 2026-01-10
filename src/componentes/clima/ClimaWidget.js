import React, { useEffect, useState } from "react";
import { obtenerClima } from "./ClimaService";
import { Typography } from "@mui/material";

const ClimaWidget = () => {
  const [clima, setClima] = useState(null);

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        obtenerClima(position.coords.latitude, position.coords.longitude).then(
          (data) => setClima(data)
        );
      },
      (error) => console.error("Error al obtener ubicación:", error)
    );
  }, []);

  if (!clima) return null;

  return (
    <div style={{ textAlign: "center", padding: 10 }}>
      <img src={clima.icono} alt="Clima" />
      <Typography variant="subtitle1">
        {clima.ciudad}: {clima.temperatura}°C - {clima.descripcion}
      </Typography>
    </div>
  );
};

export default ClimaWidget;
