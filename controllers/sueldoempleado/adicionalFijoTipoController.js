// CRUD AdicionalFijoTipo
import AdicionalFijoTipo from "../../models/sueldoempleado/adicionalfijotipo.js";

export const listarTiposFijos = async (req, res) => {
  const rows = await AdicionalFijoTipo.findAll({ order: [["id", "ASC"]] });
  res.json(rows);
};

export const crearTipoFijo = async (req, res) => {
  const { descripcion, empresa_id } = req.body || {};
  const row = await AdicionalFijoTipo.create({ descripcion, empresa_id });
  res.status(201).json(row);
};

export const actualizarTipoFijo = async (req, res) => {
  const { id } = req.params;
  const { descripcion, empresa_id } = req.body || {};
  const row = await AdicionalFijoTipo.findByPk(id);
  if (!row) return res.status(404).json({ error: "No encontrado" });
  await row.update({ descripcion, empresa_id });
  res.json(row);
};

export const eliminarTipoFijo = async (req, res) => {
  const { id } = req.params;
  const count = await AdicionalFijoTipo.destroy({ where: { id } });
  res.json({ deleted: count });
};
