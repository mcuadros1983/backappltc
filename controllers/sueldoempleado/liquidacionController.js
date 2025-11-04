// Calcula recibos (snapshot): fijos vigentes + variables del periodo
import { Op } from "sequelize";
import { sequelize } from "../../config/database.js";
import PeriodoLiquidacion from "../../models/sueldoempleado/periodoliquidacion.js";
import EmpleadoTabla from "../../models/tablas/empleadoModel.js";
import EmpleadoAdicionalFijo from "../../models/sueldoempleado/empleadoadicionalfijo.js";
import AdicionalFijoTipo from "../../models/sueldoempleado/adicionalfijotipo.js";
import AdicionalFijoValor from "../../models/sueldoempleado/adicionalfijovalor.js";
import AdicionalVariable from "../../models/sueldoempleado/adicionalvariable.js";
import AdicionalVariableTipo from "../../models/sueldoempleado/adicionalvariabletipo.js";
import Recibo from "../../models/sueldoempleado/recibo.js";
import ReciboItem from "../../models/sueldoempleado/reciboitem.js";
import AdelantoEmpleado from "../../models/sueldoempleado/AdelantoEmpleado.js";

async function getFijosVigentes({ empleado_id, fecha }) {
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
        referencia: `FIJO:${a.adicionalfijotipo_id}`,
        descripcion: a.AdicionalFijoTipo?.descripcion ?? "Adicional fijo",
        monto: Number(a.monto_override),
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
        referencia: `FIJO:${a.adicionalfijotipo_id}`,
        descripcion: a.AdicionalFijoTipo?.descripcion ?? "Adicional fijo",
        monto: Number(valor.monto),
      });
    }
  }
  return items;
}

export const liquidarPeriodo = async (req, res) => {

  // Helper para armar descripciones
  const joinText = (...parts) =>
    parts.map(p => (p == null ? "" : String(p).trim())).filter(Boolean).join(" — ");

  const {
    excluir = {}
  } = req.body || {};

  const exclVars = new Set((excluir.variables || []).map(Number));     // ids de AdicionalVariable
  const exclFIds = new Set((excluir.fijos_ids || []).map(Number));     // ids de fijo
  const exclFRef = new Set((excluir.fijos_refs || []).map(s => String(s).toUpperCase()));
  const exclAdel = new Set((excluir.adelantos || []).map(Number));     // ids de adelanto

  const t = await sequelize.transaction();
  try {
    const { periodo_id } = req.params;
    const { empleado_id: empleadoIdQuery, empresa_id: empresaIdQuery } = req.query;

    const periodo = await PeriodoLiquidacion.findByPk(periodo_id, { transaction: t });
    if (!periodo) return res.status(404).json({ error: "Periodo no encontrado" });
    if (periodo.estado !== "abierto") return res.status(400).json({ error: "Periodo no está abierto" });

    const fechaDesde = periodo.fecha_desde;
    const fechaHasta = periodo.fecha_hasta;
    const periodoStr = `${periodo.anio}-${String(periodo.mes).padStart(2, "0")}`;

    // Empleados a procesar
    let empleados = [];
    if (empleadoIdQuery) {
      const emp = await EmpleadoTabla.findByPk(Number(empleadoIdQuery), { transaction: t });
      if (emp) empleados = [emp];
    } else {
      empleados = await EmpleadoTabla.findAll({ transaction: t });
    }

    if (!empleados.length) {
      await t.rollback();
      return res.json({ periodo_id: periodo.id, generados: 0, detalles: [] });
    }

    const resultados = [];
    const empresaIdForCreate = empresaIdQuery ? Number(empresaIdQuery) : null;

    for (const emp of empleados) {
      if (emp.fechabaja && new Date(emp.fechabaja) < new Date(fechaDesde)) continue;

      const whereRecibo = { periodo_id: periodo.id, empleado_id: emp.id };
      if (empresaIdForCreate) whereRecibo.empresa_id = empresaIdForCreate;

      let recibo = await Recibo.findOne({ where: whereRecibo, transaction: t });

      if (!recibo) {
        if (!empresaIdForCreate) {
          await t.rollback();
          return res.status(400).json({ error: "empresa_id es requerida para crear recibos" });
        }
        recibo = await Recibo.create({
          periodo_id: periodo.id,
          empleado_id: emp.id,
          sueldo: 0,
          totalhaberes: 0,
          descuentos: 0,
          acobrarporbanco: 0,
          acobrarporsucursal: 0,
          estado: "calculado",
          empresa_id: empresaIdForCreate,
        }, { transaction: t });
      } else {
        await ReciboItem.destroy({ where: { recibo_id: recibo.id }, transaction: t });
        await recibo.update({
          totalhaberes: 0,
          descuentos: 0,
          acobrarporsucursal: 0,
          estado: "calculado",
        }, { transaction: t });
      }

      // Recalcular snapshot
      let haberesItemsPos = 0;
      let descuentosItemsAbs = 0;

      // 1) Fijos (respetar exclusión por id o referencia)
      const fijos = await getFijosVigentes({ empleado_id: emp.id, fecha: fechaHasta });
      for (const f of fijos) {
        const ref = (f.referencia ?? f.codigo ?? "").toString().toUpperCase();
        const idF = Number(f.id ?? 0);

        if (exclFIds.has(idF) || (ref && exclFRef.has(ref))) {
          continue; // 🔸 EXCLUIDO
        }

        await ReciboItem.create({
          recibo_id: recibo.id,
          tipo: "FIJO",
          referencia: f.referencia,
          descripcion: f.descripcion,
          cantidad: 1,
          monto_unitario: f.monto,
          monto_total: f.monto,
          fuente_id: idF || null,
        }, { transaction: t });

        const m = Number(f.monto || 0);
        if (m >= 0) haberesItemsPos += m;
        else descuentosItemsAbs += Math.abs(m);
      }

      // 2) Variables (excluir por id de AdicionalVariable)
      const variables = await AdicionalVariable.findAll({
        where: { empleado_id: emp.id, periodo: periodoStr },
        include: [{ model: AdicionalVariableTipo, as: "TipoAV", required: false, attributes: ["id", "descripcion"] }],
        transaction: t,
      });

      for (const v of variables) {
        if (exclVars.has(Number(v.id))) continue; // 🔸 EXCLUIDO

        const mv = Number(v.monto || 0);
        const descVar = joinText(v?.descripcion, v?.observaciones, v?.fecha);

        await ReciboItem.create({
          recibo_id: recibo.id,
          tipo: "VARIABLE",
          referencia: `VAR:${v.adicionalvariabletipo_id}`,
          descripcion: descVar || (v?.TipoAV?.descripcion ?? "Adicional variable"),
          cantidad: 1,
          monto_unitario: mv,
          monto_total: mv,
          fuente_id: v.id,
        }, { transaction: t });

        if (mv >= 0) haberesItemsPos += mv;
        else descuentosItemsAbs += Math.abs(mv);
      }

      // 3) Adelantos (excluir por id)
      const adelantos = await AdelantoEmpleado.findAll({
        where: { empleado_id: emp.id, fecha: { [Op.between]: [fechaDesde, fechaHasta] } },
        transaction: t,
      });

      for (const ad of adelantos) {
        if (exclAdel.has(Number(ad.id))) continue; // 🔸 EXCLUIDO

        const ma = Number(ad.monto || 0);
        if (ma <= 0) continue;

        const descAd = joinText("Adelanto en administración", ad?.observaciones, ad?.fecha);

        await ReciboItem.create({
          recibo_id: recibo.id,
          tipo: "ADELANTO",
          referencia: `ADELANTO:${ad.id}`,
          descripcion: descAd,
          cantidad: 1,
          monto_unitario: -ma,
          monto_total: -ma,
          fuente_id: ad.id,
        }, { transaction: t });

        descuentosItemsAbs += ma;
      }

      // Totales (conservando sueldo/acobrarporbanco)
      const sueldoBase = Number(recibo.sueldo ?? 0);
      const bancoBase = Number(recibo.acobrarporbanco ?? 0);

      const totalhaberes = sueldoBase + haberesItemsPos;
      const descuentos = descuentosItemsAbs;
      const acobrarporsucursal = totalhaberes - descuentos - bancoBase;

      await recibo.update({ totalhaberes, descuentos, acobrarporsucursal }, { transaction: t });

      resultados.push({
        recibo_id: recibo.id,
        empleado_id: emp.id,
        sueldo: sueldoBase,
        acobrarporbanco: bancoBase,
        totalhaberes,
        descuentos,
        acobrarporsucursal,
      });
    }

    await t.commit();
    res.json({ periodo_id, generados: resultados.length, detalles: resultados });

  } catch (e) {
    await t.rollback();
    console.error("[liquidarPeriodo] ERROR:", e?.message, e?.stack);
    res.status(500).json({ error: "No se pudo liquidar el período" });
  }
};


export const confirmarRecibo = async (req, res) => {
  const { id } = req.params;
  const recibo = await Recibo.findByPk(id);
  if (!recibo) return res.status(404).json({ error: "Recibo no encontrado" });
  await recibo.update({ estado: "confirmado", locked_at: new Date() });
  res.json(recibo);
};

export const obtenerReciboDetalle = async (req, res) => {
  try {
    const { id } = req.params;

    const row = await Recibo.findByPk(id, {
      include: [
        {
          model: EmpleadoTabla,
          as: "Empleado",
          attributes: ["id", "apellido", "nombre", "numero", "cuil"],
          required: false,
        },
        {
          model: PeriodoLiquidacion,
          as: "Periodo",
          attributes: ["id", "anio", "mes", "fecha_desde", "fecha_hasta", "estado"],
          required: false,
        },
        {
          model: ReciboItem,
          as: "Items",
          attributes: [
            "id",
            "tipo",
            "referencia",
            "descripcion",
            "cantidad",
            "monto_unitario",
            "monto_total",
            "fuente_id",
            "createdAt",
          ],
          required: false,
          order: [["id", "ASC"]],
        },
      ],
    });

    if (!row) return res.status(404).json({ error: "No encontrado" });
    res.json(row);
  } catch (e) {
    console.error("[obtenerReciboDetalle] ERROR:", e?.message, e?.stack);
    res.status(500).json({ error: "No se pudo obtener el detalle del recibo" });
  }
};

export const listarRecibos = async (req, res) => {
  try {
    const {
      empleado_id,
      periodo_id,
      empresa_id,
      completos,
      order = "createdAt",
      dir = "DESC",
      limit = "100",
    } = req.query;

    // --- filtros base ---
    const where = {};
    if (empleado_id) where.empleado_id = Number(empleado_id);
    if (periodo_id) where.periodo_id = Number(periodo_id);
    if (empresa_id) where.empresa_id = Number(empresa_id);



    // --- sanitización de orden ---
    const allowedOrder = new Set([
      "id",
      "createdAt",
      "updatedAt",
      "sueldo",
      "totalhaberes",
      "descuentos",
      "acobrarporbanco",
      "acobrarporsucursal",
      "estado",
      // si querés agregar campos del include, usá el formato Sequelize:
      // p.ej. [{ model: PeriodoLiquidacion, as: "Periodo" }, "anio"] pero requiere otro formato en "order"
    ]);
    const orderCol = allowedOrder.has(String(order)) ? String(order) : "createdAt";
    const dirSan = String(dir).toUpperCase() === "ASC" ? "ASC" : "DESC";

    const limitInt = Math.min(Math.max(parseInt(limit, 10) || 100, 1), 1000);

    const rows = await Recibo.findAll({
      where,
      include: [
        {
          model: EmpleadoTabla,
          as: "Empleado",
          attributes: ["id", "apellido", "nombre", "numero", "cuil"],
          required: false,
        },
        {
          model: PeriodoLiquidacion,
          as: "Periodo",
          attributes: ["id", "anio", "mes", "fecha_desde", "fecha_hasta", "estado"],
          required: false,
        },
      ],
      order: [[orderCol, dirSan]],
      limit: limitInt,
    });

    res.json(rows);
  } catch (e) {
    console.error("[listarRecibos] ERROR:", e?.message, e?.stack);
    res.status(500).json({ error: "No se pudo listar los recibos" });
  }
};
export const listarRecibosTotales = async (req, res) => {
  try {
    const {

      order = "createdAt",
      dir = "DESC",
      limit = "100",
    } = req.query;
    // --- sanitización de orden ---
    const allowedOrder = new Set([
      "id",
      "createdAt",
      "updatedAt",
      "sueldo",
      "totalhaberes",
      "descuentos",
      "acobrarporbanco",
      "acobrarporsucursal",
      "estado",
      // si querés agregar campos del include, usá el formato Sequelize:
      // p.ej. [{ model: PeriodoLiquidacion, as: "Periodo" }, "anio"] pero requiere otro formato en "order"
    ]);
    const orderCol = allowedOrder.has(String(order)) ? String(order) : "createdAt";
    const dirSan = String(dir).toUpperCase() === "ASC" ? "ASC" : "DESC";

    const limitInt = Math.min(Math.max(parseInt(limit, 10) || 100, 1), 1000);

    const rows = await Recibo.findAll({
      // where,
      include: [
        {
          model: EmpleadoTabla,
          as: "Empleado",
          attributes: ["id", "apellido", "nombre", "numero", "cuil"],
          required: false,
        },
        {
          model: PeriodoLiquidacion,
          as: "Periodo",
          attributes: ["id", "anio", "mes", "fecha_desde", "fecha_hasta", "estado"],
          required: false,
        },
      ],
      order: [[orderCol, dirSan]],
      limit: limitInt,
    });

    res.json(rows);
  } catch (e) {
    console.error("[listarRecibos] ERROR:", e?.message, e?.stack);
    res.status(500).json({ error: "No se pudo listar los recibos" });
  }
};


/**
 * GET /recibo/:id
 */
export const obtenerRecibo = async (req, res) => {
  try {
    const { id } = req.params;
    const row = await Recibo.findByPk(id, {
      include: [
        { model: EmpleadoTabla, as: "Empleado", attributes: ["id", "apellido", "nombre", "numero", "cuil"] },
        { model: PeriodoLiquidacion, as: "Periodo", attributes: ["id", "anio", "mes"] },
      ],
    });
    if (!row) return res.status(404).json({ error: "No encontrado" });
    res.json(row);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "No se pudo obtener el recibo" });
  }
};

/**
 * POST /recibo
 * body: { periodo_id, empleado_id, empresa_id, sueldo?, totalhaberes?, descuentos?, acobrarporbanco?, acobrarporsucursal?, estado? }
 */
export const crearRecibo = async (req, res) => {
  try {
    const {
      periodo_id,
      empleado_id,
      empresa_id,
      sueldo = null,
      totalhaberes = 0,
      descuentos = 0,
      acobrarporbanco = 0,
      acobrarporsucursal = 0,
      estado = "calculado",
    } = req.body || {};

    if (!periodo_id || !empleado_id || !empresa_id) {
      return res.status(400).json({ error: "periodo_id, empleado_id y empresa_id son requeridos" });
    }

    const row = await Recibo.create({
      periodo_id,
      empleado_id,
      empresa_id,
      sueldo,
      totalhaberes,
      descuentos,
      acobrarporbanco,
      acobrarporsucursal,
      estado,
    });

    res.status(201).json(row);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "No se pudo crear el recibo" });
  }
};

/**
 * PUT /recibo/:id
 */
export const actualizarRecibo = async (req, res) => {
  try {
    const { id } = req.params;
    const row = await Recibo.findByPk(id);
    if (!row) return res.status(404).json({ error: "No encontrado" });

    const updatable = [
      "periodo_id",
      "empleado_id",
      "empresa_id",
      "sueldo",
      "totalhaberes",
      "descuentos",
      "acobrarporbanco",
      "acobrarporsucursal",
      "estado",
      "locked_at",
    ];

    const patch = {};
    for (const k of updatable) {
      if (k in req.body) patch[k] = req.body[k];
    }

    await row.update(patch);
    res.json(row);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "No se pudo actualizar el recibo" });
  }
};

/**
 * DELETE /recibo/:id  (opcional)
 */
export const eliminarRecibo = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { id } = req.params;

    const row = await Recibo.findByPk(id, { transaction: t });
    if (!row) {
      await t.rollback();
      return res.status(404).json({ error: "No encontrado" });
    }

    // 1) Borrar items explícitamente (robusto aunque no haya FK)
    await ReciboItem.destroy({ where: { recibo_id: row.id }, transaction: t });

    // 2) Borrar recibo
    await row.destroy({ transaction: t });

    await t.commit();
    res.json({ ok: true });
  } catch (e) {
    await t.rollback();
    console.error("[eliminarRecibo] ERROR:", e?.message, e?.stack);
    res.status(500).json({ error: "No se pudo eliminar el recibo" });
  }
};