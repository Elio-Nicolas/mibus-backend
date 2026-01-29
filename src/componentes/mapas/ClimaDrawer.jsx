import React from "react";
import { Drawer, Typography, Box } from "@mui/material";

const ClimaDrawer = ({ open, onClose, children }) => {
  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      container={document.getElementById("map-wrapper")}
      PaperProps={{
        sx: {
          width: 300,
          backgroundColor: "rgba(169, 213, 238, 0.8)",
          padding: 2,
          textAlign: "center",
        },
      }}
    >
      <Typography variant="h6" sx={{ mb: 2 }}>
        🌤️ Clima actual
      </Typography>
      <Box>{children}</Box>
    </Drawer>
  );
};

export default ClimaDrawer;
