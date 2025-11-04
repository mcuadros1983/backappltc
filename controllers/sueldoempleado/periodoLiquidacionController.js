import PeriodoLiquidacion from "../../models/sueldoempleado/periodoliquidacion.js";

export const listarPeriodos = async (_req, res) => {
  const rows = await PeriodoLiquidacion.findAll({ order: [["anio", "DESC"], ["mes", "DESC"]] });
  res.json(rows);
};

export const crearPeriodo = async (req, res) => {
  const { anio, mes, fecha_desde, fecha_hasta } = req.body || {};
  const row = await PeriodoLiquidacion.create({ anio, mes, fecha_desde, fecha_hasta, estado: "abierto" });
  res.status(201).json(row);
};

export const cerrarPeriodo = async (req, res) => {
  const { id } = req.params;
  const row = await PeriodoLiquidacion.findByPk(id);
  if (!row) return res.status(404).json({ error: "No encontrado" });
  await row.update({ estado: "cerrado" });
  res.json(row);
};
