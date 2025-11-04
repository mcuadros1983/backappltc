import { Op } from "sequelize";
import AdicionalVariable from "../../models/sueldoempleado/adicionalvariable.js";
import EmpleadoTabla from "../../models/tablas/empleadoModel.js";
import PeriodoLiquidacion from "../../models/sueldoempleado/periodoliquidacion.js";
import dayjs from "dayjs";
import { AdicionalVariableTipo } from "../../models/index.js";

AdicionalVariable.belongsTo(EmpleadoTabla, { foreignKey: "empleado_id", as: "Empleado" });
AdicionalVariable.belongsTo(PeriodoLiquidacion, { foreignKey: "periodo_id", as: "Periodo" });

const isPeriodo = (s) => typeof s === "string" && /^\d{4}-\d{2}$/.test(s);

const getOrCreatePeriodoByString = async (periodoStr) => {
  if (!isPeriodo(periodoStr)) return null;
  const [anioStr, mesStr] = periodoStr.split("-");
  const anio = Number(anioStr);
  const mes = Number(mesStr);
  let row = await PeriodoLiquidacion.findOne({ where: { anio, mes } });
  if (!row) {
    // default fechas con todo el mes
    const fd = dayjs(`${periodoStr}-01`, "YYYY-MM-DD").format("YYYY-MM-DD");
    const fh = dayjs(fd).endOf("month").format("YYYY-MM-DD");
    row = await PeriodoLiquidacion.create({
      anio, mes, fecha_desde: fd, fecha_hasta: fh, estado: "abierto",
    });
  }
  return row;
};

// POST /adicionalvariable
export const crearAdicionalVariable = async (req, res) => {
  try {
    const { descripcion, empleado_id, periodo, periodo_id, monto, observaciones } = req.body || {};
    if (!empleado_id) return res.status(400).json({ error: "empleado_id es requerido" });
    if (monto == null || Number.isNaN(Number(monto))) return res.status(400).json({ error: "monto inválido" });

    const emp = await EmpleadoTabla.findByPk(empleado_id, {
      include: [{ model: AdicionalVariable, as: "AdicionalesVariablesPorEmpleado" }],
    });
    if (!emp) return res.status(400).json({ error: "Empleado inexistente" });

    let pId = periodo_id ?? null;
    let pStr = periodo ?? null;

    if (!pId && pStr) {
      const p = await getOrCreatePeriodoByString(pStr);
      if (!p) return res.status(400).json({ error: "periodo inválido (YYYY-MM)" });
      pId = p.id;
      // asegurar el string (por consistencia)
      pStr = `${p.anio}-${String(p.mes).padStart(2, "0")}`;
    } else if (pId && !pStr) {
      const p = await PeriodoLiquidacion.findByPk(pId, {
        include: [{ model: AdicionalVariable, as: "AdicionalesVariablesPorPeriodo" }],
      });
      if (!p) return res.status(400).json({ error: "periodo_id inexistente" });
      pStr = `${p.anio}-${String(p.mes).padStart(2, "0")}`;
    } else if (!pId && !pStr) {
      return res.status(400).json({ error: "Debe indicar periodo (YYYY-MM) o periodo_id" });
    }

    const row = await AdicionalVariable.create({
      descripcion: descripcion ?? null,
      empleado_id: Number(empleado_id),
      adicionalvariabletipo_id: null,
      periodo: pStr,
      periodo_id: pId,
      monto: Number(monto),
      observaciones: observaciones ?? null,
    });

    res.status(201).json(row);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Error al crear el adicional variable" });
  }
};

// GET /adicionalvariable
// Filtros opcionales: ?periodo=YYYY-MM&empleado_id=123&q=texto&limit=50&offset=0
export const listarAdicionalesVariables = async (req, res) => {
  try {
    const {
      periodo_id,
      periodo,
      empleado_id,
      q,
      limit = 100,
      offset = 0,
      order = "createdAt",
      dir = "DESC",
    } = req.query;

    const where = {};
    if (periodo_id) where.periodo_id = Number(periodo_id);
    else if (periodo && isPeriodo(periodo)) where.periodo = String(periodo);
    if (empleado_id) where.empleado_id = Number(empleado_id);

    // Búsqueda libre por descripción o por datos del empleado (apellido/nombre/dni "numero")
    if (q && String(q).trim()) {
      const likeOp = Op.iLike ?? Op.like;
      const term = `%${String(q).trim()}%`;
      where[Op.or] = [
        { descripcion: { [likeOp]: term } },
        { "$Empleado.apellido$": { [likeOp]: term } },
        { "$Empleado.nombre$": { [likeOp]: term } },
        { "$Empleado.numero$": { [likeOp]: term } },
      ];
    }

    const rows = await AdicionalVariable.findAll({
      where,
      include: [
        { model: EmpleadoTabla, as: "EmpleadoAV", attributes: ["id", "apellido", "nombre", "numero", "cuil"] },
        { model: PeriodoLiquidacion, as: "Periodo", attributes: ["id", "anio", "mes", "fecha_desde", "fecha_hasta", "estado"] },
        { model: AdicionalVariableTipo, as: "TipoAV", required: false },

      ],
      order: [[order, String(dir).toUpperCase() === "ASC" ? "ASC" : "DESC"]],
      limit: Number(limit),
      offset: Number(offset),
    });

    res.json(rows);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Error al listar los adicionales variables" });
  }
};

export const crearVariable = async (req, res) => {
  const { empleado_id, adicionalvariabletipo_id, periodo, monto, observaciones } = req.body || {};
  // opcional: verificar que el empleado exista
  const ok = await EmpleadoTabla.findByPk(empleado_id, {
    include: [{ model: AdicionalVariable, as: "AdicionalesVariablesPorEmpleado" }],
  });
  if (!ok) return res.status(400).json({ error: "Empleado inexistente" });

  const row = await AdicionalVariable.create({ empleado_id, adicionalvariabletipo_id, periodo, monto, observaciones });
  res.status(201).json(row);
};
// GET /adicionalvariable/:id
export const obtenerAdicionalVariable = async (req, res) => {
  try {
    const { id } = req.params;
    const row = await AdicionalVariable.findByPk(id, {
      include: [{ model: EmpleadoTabla, as: "Empleado", attributes: ["id", "apellido", "nombre", "numero", "cuil"] }, { model: AdicionalVariableTipo, as: "TipoAV", required: false },],
    });
    if (!row) return res.status(404).json({ error: "No encontrado" });
    res.json(row);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Error al obtener el adicional variable" });
  }
};

// POST /adicionalvariable
// Campos: { descripcion, empleado_id, periodo (YYYY-MM), monto, observaciones }


// PUT /adicionalvariable/:id
// Permite editar: descripcion, periodo, monto, observaciones, empleado_id (opcional)
// PUT /adicionalvariable/:id
export const actualizarAdicionalVariable = async (req, res) => {
  try {
    const { id } = req.params;
    const { descripcion, periodo, periodo_id, monto, observaciones, empleado_id } = req.body || {};

    const row = await AdicionalVariable.findByPk(id);
    if (!row) return res.status(404).json({ error: "No encontrado" });

    const patch = {};

    if (empleado_id !== undefined) {
      const emp = await EmpleadoTabla.findByPk(empleado_id, {
        include: [{ model: AdicionalVariable, as: "AdicionalesVariablesPorEmpleado" }],
      });
      if (!emp) return res.status(400).json({ error: "Empleado inexistente" });
      patch.empleado_id = Number(empleado_id);
    }

    if (descripcion !== undefined) patch.descripcion = descripcion ?? null;

    // Sincronizar periodo/periodo_id según lo que venga
    if (periodo_id !== undefined && periodo_id !== null) {
      const p = await PeriodoLiquidacion.findByPk(periodo_id, {
        include: [{ model: AdicionalVariable, as: "AdicionalesVariablesPorPeriodo" }],
      });
      if (!p) return res.status(400).json({ error: "periodo_id inexistente" });
      patch.periodo_id = p.id;
      patch.periodo = `${p.anio}-${String(p.mes).padStart(2, "0")}`;
    } else if (periodo !== undefined && periodo !== null) {
      if (!isPeriodo(periodo)) return res.status(400).json({ error: "periodo inválido (YYYY-MM)" });
      const p = await getOrCreatePeriodoByString(periodo);
      patch.periodo_id = p.id;
      patch.periodo = `${p.anio}-${String(p.mes).padStart(2, "0")}`;
    }

    if (monto !== undefined) {
      if (monto == null || Number.isNaN(Number(monto))) return res.status(400).json({ error: "monto inválido" });
      patch.monto = Number(monto); // admite negativos
    }

    if (observaciones !== undefined) patch.observaciones = observaciones ?? null;

    await row.update(patch);
    res.json(row);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Error al actualizar el adicional variable" });
  }
};

// DELETE /adicionalvariable/:id
export const eliminarAdicionalVariable = async (req, res) => {
  try {
    const { id } = req.params;
    const row = await AdicionalVariable.findByPk(id);
    if (!row) return res.status(404).json({ error: "No encontrado" });
    await row.destroy();
    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Error al eliminar el adicional variable" });
  }
};
