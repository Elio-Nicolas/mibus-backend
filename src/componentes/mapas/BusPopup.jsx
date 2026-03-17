import React from "react";
import { Popup } from "react-leaflet";

const getStatusColor = (atStop) => (atStop ? "#22c55e" : "#f97316");

const BusPopup = ({ bus }) => {
  return (
    <Popup>
      <div
        style={{
          minWidth: "220px",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        {/* Header */}
        <div
          style={{
            background: "#111827",
            color: "white",
            padding: "8px 10px",
            borderRadius: "8px 8px 0 0",
            fontWeight: "600",
            fontSize: "14px",
          }}
        >
          🚌 Unidad {bus.unitId || "—"}
        </div>

        {/* Body */}
        <div
          style={{
            padding: "10px",
            background: "#f9fafb",
            borderRadius: "0 0 8px 8px",
            fontSize: "13px",
            lineHeight: "1.6",
          }}
        >
          <div><strong>Línea:</strong> {bus.linea || "—"}</div>
          <div><strong>Chofer:</strong> {bus.driverName || "—"}</div>
          <div><strong>Próxima parada:</strong> {bus.nextStopName || "En parada"}</div>

          <div>
            <strong>ETA:</strong>{" "}
            {bus.etaSeconds != null
              ? `${Math.floor(bus.etaSeconds / 60)}m ${Math.floor(
                  bus.etaSeconds % 60
                )}s`
              : "—"}
          </div>

          {/* Estado badge */}
          <div style={{ marginTop: "6px" }}>
            <span
              style={{
                background: getStatusColor(bus.atStop),
                color: "white",
                padding: "4px 8px",
                borderRadius: "20px",
                fontSize: "12px",
                fontWeight: "500",
              }}
            >
              {bus.atStop ? "En parada" : "En movimiento"}
            </span>
          </div>

          <div style={{ marginTop: "6px", fontSize: "11px", color: "#6b7280" }}>
            Actualizado:{" "}
            {bus.lastUpdate
              ? new Date(bus.lastUpdate).toLocaleTimeString()
              : "—"}
          </div>
        </div>
      </div>
    </Popup>
  );
};

export default BusPopup;