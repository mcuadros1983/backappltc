// Asignación de fijos al empleado (con vigencia y override opcional)
import { Op } from "sequelize";
import EmpleadoAdicionalFijo from "../../models/sueldoempleado/empleadoadicionalfijo.js";
import AdicionalFijoValor from "../../models/sueldoempleado/adicionalfijovalor.js";
import AdicionalFijoTipo from "../../models/sueldoempleado/adicionalfijotipo.js";

export const listarFijosEmpleado = async (req, res) => {
  const { empleado_id, fecha } = req.query;
  const where = {};
  if (empleado_id) where.empleado_id = empleado_id;
  if (fecha) {
    where.vigencia_desde = { [Op.lte]: fecha };
    where[Op.or] = [{ vigencia_hasta: null }, { vigencia_hasta: { [Op.gte]: fecha } }];
  }
  const rows = await EmpleadoAdicionalFijo.findAll({
    where,
    include: [{ model: AdicionalFijoTipo, required: true }],
    order: [["vigencia_desde", "DESC"], ["id", "DESC"]],
  });
  res.json(rows);
};

export const asignarFijoEmpleado = async (req, res) => {
  const { empleado_id, adicionalfijotipo_id, vigencia_desde, vigencia_hasta, monto_override } = req.body || {};
  const row = await EmpleadoAdicionalFijo.create({
    empleado_id, adicionalfijotipo_id, vigencia_desde, vigencia_hasta: vigencia_hasta || null, monto_override,
  });
  res.status(201).json(row);
};

export const cerrarFijoEmpleado = async (req, res) => {
  const { id } = req.params;
  const { vigencia_hasta } = req.body || {};
  const row = await EmpleadoAdicionalFijo.findByPk(id);
  if (!row) return res.status(404).json({ error: "No encontrado" });
  await row.update({ vigencia_hasta });
  res.json(row);
};

// Utilidad: calcular fijos vigentes (monto efectivo) para un empleado/fecha
export const fijosVigentesEmpleado = async (req, res) => {
  const { empleado_id, fecha } = req.query;
  if (!empleado_id || !fecha) return res.status(400).json({ error: "empleado_id y fecha son requeridos" });

  const asignaciones = await EmpleadoAdicionalFijo.findAll({
    where: {
      empleado_id,
      vigencia_desde: { [Op.lte]: fecha },
      [Op.or]: [{ vigencia_hasta: null }, { vigencia_hasta: { [Op.gte]: fecha } }],
    },
    include: [{ model: AdicionalFijoTipo, required: true }],
  });

  const items = [];
  for (const a of asignaciones) {
    if (a.monto_override != null) {
      items.push({
        adicionalfijotipo_id: a.adicionalfijotipo_id,
        codigo: a.AdicionalFijoTipo?.codigo ?? null,
        descripcion: a.AdicionalFijoTipo?.descripcion ?? "",
        monto: a.monto_override,
        fuente: "OVERRIDE",
      });
      continue;
    }
    const valor = await AdicionalFijoValor.findOne({
      where: {
        adicionalfijotipo_id: a.adicionalfijotipo_id,
        vigencia_desde: { [Op.lte]: fecha },
        [Op.or]: [{ vigencia_hasta: null }, { vigencia_hasta: { [Op.gte]: fecha } }],
      },
      order: [["vigencia_desde", "DESC"]],
    });
    if (valor) {
      items.push({
        adicionalfijotipo_id: a.adicionalfijotipo_id,
        codigo: a.AdicionalFijoTipo?.codigo ?? null,
        descripcion: a.AdicionalFijoTipo?.descripcion ?? "",
        monto: valor.monto,
        fuente: "GLOBAL",
      });
    }
  }

  res.json(items);
};
