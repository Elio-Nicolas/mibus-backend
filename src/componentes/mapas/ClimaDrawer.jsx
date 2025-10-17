import React from "react";
import { Drawer, Typography, Box } from "@mui/material";

const ClimaDrawer = ({ open, onClose, children }) => {
  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          width: 300,
          backgroundColor: "rgba(255,255,255,0.9)",
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
