/**
 * ==========================================================
 * Archivo: controllers/dashboardController.js
 * ----------------------------------------------------------
 * Controlador del dashboard operativo.
 *
 * Responsabilidad:
 * - Consultar la colección de vueltas (laps)
 * - Calcular métricas agregadas
 * - Enviar datos al frontend
 *
 * Este archivo NO define rutas.
 * Solo contiene la lógica de negocio.
 * ==========================================================
 */

const Lap = require("../models/Lap");

/**
 * ==========================================================
 * GET /api/dashboard/summary
 *
 * Devuelve métricas generales del día:
 * - vueltas totales
 * - duración promedio de vuelta
 * - unidades activas
 * ==========================================================
 */
exports.getDashboardSummary = async (req, res) => {

  const startOfDay = new Date();
  startOfDay.setHours(0,0,0,0);

  const lapsToday = await Lap.countDocuments({
    completedAt: { $gte: startOfDay }
  });

  const avgLap = await Lap.aggregate([
    { $match: { completedAt: { $gte: startOfDay } } },
    {
      $group: {
        _id: null,
        avg: { $avg: "$durationSeconds" }
      }
    }
  ]);

  const units = await Lap.distinct("unitId", {
    completedAt: { $gte: startOfDay }
  });

  res.json({
    lapsToday,
    avgLapSeconds: avgLap[0]?.avg || 0,
    activeUnits: units.length
  });
};


/**
 * ==========================================================
 * GET /api/dashboard/laps-by-unit
 *
 * Devuelve vueltas realizadas por cada unidad.
 *
 * Permite construir gráficos de productividad
 * por colectivo.
 * ==========================================================
 */
exports.getLapsByUnit = async (req, res) => {

  const data = await Lap.aggregate([
    {
      $group: {
        _id: "$unitId",
        laps: { $sum: 1 },
        totalTime: { $sum: "$durationSeconds" }
      }
    }
  ]);

  res.json(data);
};


/**
 * ==========================================================
 * GET /api/dashboard/laps-hourly
 *
 * Devuelve vueltas agrupadas por hora.
 *
 * Sirve para visualizar:
 * - horas pico
 * - tráfico
 * - actividad operativa
 * ==========================================================
 */
exports.getHourlyLaps = async (req, res) => {

  const data = await Lap.aggregate([
    {
      $group: {
        _id: { $hour: "$completedAt" },
        laps: { $sum: 1 }
      }
    },
    { $sort: { "_id": 1 } }
  ]);

  res.json(data);
};

/**
 * ==========================================================
 * GET /api/dashboard/laps-by-day-line
 *
 * Devuelve vueltas agrupadas por:
 * - linea
 * - dia
 * - unidad
 * ==========================================================
 */
exports.getLapsByDayLine = async (req, res) => {

  const data = await Lap.aggregate([

    {
      $group: {
        _id: {
          line: "$lineId",
          day: {
            $dateToString: {
              format: "%d/%m/%Y",
              date: "$completedAt"
            }
          },
          unit: "$unitId"
        },
        laps: { $sum: 1 }
      }
    },

    {
      $group: {
        _id: {
          line: "$_id.line",
          day: "$_id.day"
        },
        units: {
          $push: {
            unitId: "$_id.unit",
            laps: "$laps"
          }
        }
      }
    },

    { $sort: { "_id.day": -1 } }

  ]);

  res.json(data);

};