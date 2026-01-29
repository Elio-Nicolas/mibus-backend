import React, { useEffect, useMemo, useState } from "react";
import MapContainerComponent from "../componentes/mapas/MapContainerComponent";
import {
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
} from "@mui/material";

const InspectorPanel = () => {
  const user = JSON.parse(localStorage.getItem("user"));
  const token = user?.token;
  const [drivers, setDrivers] = useState([]);
  const [selectedLine, setSelectedLine] = useState("");
  const [selectedDriver, setSelectedDriver] = useState(null);

  useEffect(() => {
    fetch("http://localhost:4001/api/inspector/drivers", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(res => res.json())
      .then(data => {
        console.log("Choferes recibidos:", data);
        setDrivers(Array.isArray(data) ? data : []);
      });
  }, [token]);

  const lines = useMemo(() => {
    return [...new Set(drivers.map(d => d.assignedLine).filter(Boolean))];
  }, [drivers]);

  const driversByLine = useMemo(() => {
    if (!selectedLine) return [];
    return drivers.filter(d => d.assignedLine === selectedLine);
  }, [drivers, selectedLine]);

  return (
    <div style={{ display: "flex", height: "100vh" }}>
      {/* PANEL */}
      <div style={{ width: "30%", padding: 16, background: "#f5f5f5" }}>
        <h3>Inspector</h3>

        <FormControl fullWidth size="small" sx={{ mb: 2 }}>
          <InputLabel>Línea</InputLabel>
          <Select
            value={selectedLine}
            label="Línea"
            onChange={e => {
              setSelectedLine(e.target.value);
              setSelectedDriver(null);
            }}
          >
            {lines.map(line => (
              <MenuItem key={line} value={line}>
                {line}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>CHOFER</TableCell>
              <TableCell>UNIDAD</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {driversByLine.map(d => (
              <TableRow
                key={d._id}
                hover
                sx={{ cursor: "pointer" }}
                onClick={() => setSelectedDriver(d)}
              >
                <TableCell>{d.username}</TableCell>
                <TableCell>{d.assignedUnit || "-"}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* MAPA */}
      <div style={{ flex: 1 }}>
        <MapContainerComponent focusDriver={selectedDriver} />
      </div>
    </div>
  );
};

export default InspectorPanel;
