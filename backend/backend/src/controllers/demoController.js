// controllers/demoController.js

// 🔹 MISMA fuente que tu simulador
const DEMO_BUSES = [
  { unitId: "DEMO-A-01", driverName: "Carlos Gómez" },
  { unitId: "DEMO-A-02", driverName: "Lucía Fernández" },
  { unitId: "DEMO-A-03", driverName: "Miguel Rojas" }
];

exports.getDemoStatus = (req, res) => {
  res.json({
    buses: DEMO_BUSES.length,
    choferes: DEMO_BUSES.length,
    drivers: DEMO_BUSES.map(b => b.driverName)
  });
};