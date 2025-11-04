import { Op, fn, col, literal } from "sequelize";
import GastoEstimadoInstancia from "../../models/tesoreria/gastoestimadoinstancia.js";
import GastoEstimadoPago from "../../models/tesoreria/gastoestimadopago.js";
import Proveedor from "../../models/comun/proveedor.js";
import CategoriaEgreso from "../../models/tesoreria/categoriaEgreso.js";

function ymd(date) { return new Date(date).toISOString().slice(0, 10); }
function firstDayOfMonth(y, m) { return ymd(new Date(Number(y), Number(m) - 1, 1)); }
function lastDayOfMonth(y, m) { return ymd(new Date(Number(y), Number(m), 0)); }

function buildWhereFromQuery(q) {
  const { empresa_id, proveedor_id, sucursal_id, categoria_id, estado, desde, hasta, anio, mes } = q || {};
  const where = {};
  if (empresa_id) where.empresa_id = Number(empresa_id);
  if (proveedor_id) where.proveedor_id = Number(proveedor_id);
  if (sucursal_id) where.sucursal_id = Number(sucursal_id);
  if (categoria_id) where.categoriaegreso_id = Number(categoria_id);
  if (estado) where.estado = estado;

  if (anio && mes) {
    where.fecha_vencimiento = { [Op.between]: [firstDayOfMonth(anio, mes), lastDayOfMonth(anio, mes)] };
  } else if (desde || hasta) {
    where.fecha_vencimiento = {};
    if (desde) where.fecha_vencimiento[Op.gte] = desde;
    if (hasta) where.fecha_vencimiento[Op.lte] = hasta;
  }
  return where;
}

const BASE_FIELD = fn("COALESCE",
  col("GastoEstimadoInstancia.monto_real"),
  col("GastoEstimadoInstancia.monto_estimado"),
  0
);

// 1) Obligaciones del mes agrupadas
export async function obligacionesMesAgrupado(req, res) {
  try {
    const { group_by = "proveedor" } = req.query;
    const where = buildWhereFromQuery(req.query);

    let groupKeyCol, includeModels = [];
    if (group_by === "proveedor") {
      groupKeyCol = col("GastoEstimadoInstancia.proveedor_id");
      includeModels.push({ model: Proveedor, attributes: ["id", "nombre"], required: false });
    } else if (group_by === "categoria") {
      groupKeyCol = col("GastoEstimadoInstancia.categoriaegreso_id");
      includeModels.push({ model: CategoriaEgreso, attributes: ["id", "nombre"], required: false });
    } else {
      return res.status(400).json({ error: "group_by inválido. Use proveedor|categoria" });
    }

    const totales = await GastoEstimadoInstancia.findAll({
      where,
      attributes: [
        [groupKeyCol, "group_id"],
        [fn("COUNT", col("GastoEstimadoInstancia.id")), "cantidad"],
        [fn("SUM", BASE_FIELD), "total_base"],
        [fn("SUM", fn("COALESCE", col("GastoEstimadoInstancia.monto_estimado"), 0)), "total_estimado"],
        [fn("SUM", fn("COALESCE", col("GastoEstimadoInstancia.monto_real"), 0)), "total_real"],
      ],
      include: includeModels,
      group: ["group_id"],
      raw: true,
    });

    // pagos por grupo: include instancia (para poder agrupar por el mismo groupKeyCol)
    const pagosRaw = await GastoEstimadoPago.findAll({
      attributes: [
        [groupKeyCol, "group_id"],
        [fn("SUM", col("GastoEstimadoPago.monto_aplicado")), "total_pagado"],
      ],
      include: [{ model: GastoEstimadoInstancia, attributes: [], where, required: true }],
      group: ["group_id"],
      raw: true,
    });

    const pagosMap = new Map(
      pagosRaw.map(p => [String(p.group_id), Number(p.total_pagado || 0)])
    );

    const resultados = totales.map(t => {
      const gid = String(t.group_id);
      const total_base = Number(t.total_base || 0);
      const total_pagado = Number(pagosMap.get(gid) || 0);
      const saldo = total_base - total_pagado;

      let etiqueta = null;
      if (group_by === "proveedor") etiqueta = t["Proveedor.nombre"] || null;
      if (group_by === "categoria") etiqueta = t["CategoriaEgreso.nombre"] || null;

      return {
        group_by,
        group_id: t.group_id,
        etiqueta,
        cantidad: Number(t.cantidad || 0),
        total_estimado: Number(t.total_estimado || 0),
        total_real: Number(t.total_real || 0),
        total_base,
        total_pagado,
        saldo,
      };
    });

    res.json(resultados);
  } catch (err) {
    console.error("obligacionesMesAgrupado:", err);
    res.status(500).json({ error: "Error generando reporte agrupado" });
  }
}

// 2) Vencen en X días
export async function vencenEn(req, res) {
  try {
    const { dias = 7 } = req.query;
    const today = ymd(new Date());
    const hasta = ymd(new Date(Date.now() + Number(dias) * 24 * 3600 * 1000));

    const where = buildWhereFromQuery({
      ...req.query,
      desde: req.query.desde || today,
      hasta: req.query.hasta || hasta,
    });

    where.estado = { [Op.in]: ["pendiente", "parcial", "vencido"] };

    const items = await GastoEstimadoInstancia.findAll({
      where,
      attributes: [
        "id", "descripcion", "fecha_vencimiento", "estado",
        "empresa_id", "proveedor_id", "sucursal_id", "categoriaegreso_id",
        [BASE_FIELD, "monto_base"],
      ],
      include: [
        { model: Proveedor, attributes: ["id", "nombre"], required: false },
        { model: CategoriaEgreso, attributes: ["id", "nombre"], required: false },
      ],
      order: [["fecha_vencimiento", "ASC"], ["id", "ASC"]],
      raw: true,
    });

    console.log("datos", items)

    const withDiff = items.map(it => {
      const dv = new Date(it.fecha_vencimiento + "T00:00:00Z");
      const d0 = new Date(today + "T00:00:00Z");
      const diff = Math.round((dv - d0) / (24 * 3600 * 1000));
      return {
        ...it,
        proveedor_nombre: it["Proveedor.nombre"] || null,
        categoria_nombre: it["CategoriaEgreso.nombre"] || null,
        monto_base: Number(it.monto_base || 0),
        dias_restantes: diff,
      };
    });

    res.json(withDiff);
  } catch (err) {
    console.error("vencenEn:", err);
    res.status(500).json({ error: "Error listando obligaciones próximas a vencer" });
  }
}

// 3) Resumen por estado
export async function estadoResumen(req, res) {
  try {
    const where = buildWhereFromQuery(req.query);
    const rows = await GastoEstimadoInstancia.findAll({
      where,
      attributes: [
        "estado",
        [fn("COUNT", col("GastoEstimadoInstancia.id")), "cantidad"],
        [fn("SUM", BASE_FIELD), "total_base"],
      ],
      group: ["estado"],
      raw: true,
    });

    res.json(rows.map(r => ({
      estado: r.estado,
      cantidad: Number(r.cantidad || 0),
      total_base: Number(r.total_base || 0),
    })));
  } catch (err) {
    console.error("estadoResumen:", err);
    res.status(500).json({ error: "Error generando resumen por estado" });
  }
}

// 4) Pagadas vs. Pendientes
export async function pagadasVsPendientes(req, res) {
  try {
    const where = buildWhereFromQuery(req.query);

    const rows = await GastoEstimadoInstancia.findAll({
      where,
      attributes: [
        [fn("SUM", literal(`CASE WHEN GastoEstimadoInstancia.estado = 'pagado' THEN 1 ELSE 0 END`)), "cant_pagadas"],
        [fn("SUM", literal(`CASE WHEN GastoEstimadoInstancia.estado <> 'pagado' THEN 1 ELSE 0 END`)), "cant_no_pagadas"],
        [fn("SUM", literal(`CASE WHEN GastoEstimadoInstancia.estado = 'pagado' THEN COALESCE(GastoEstimadoInstancia.monto_real,GastoEstimadoInstancia.monto_estimado,0) ELSE 0 END`)), "monto_pagadas_base"],
        [fn("SUM", literal(`CASE WHEN GastoEstimadoInstancia.estado <> 'pagado' THEN COALESCE(GastoEstimadoInstancia.monto_real,GastoEstimadoInstancia.monto_estimado,0) ELSE 0 END`)), "monto_no_pagadas_base"],
      ],
      raw: true,
    });

    const r = rows?.[0] || {};
    res.json({
      cant_pagadas: Number(r.cant_pagadas || 0),
      cant_no_pagadas: Number(r.cant_no_pagadas || 0),
      monto_pagadas_base: Number(r.monto_pagadas_base || 0),
      monto_no_pagadas_base: Number(r.monto_no_pagadas_base || 0),
    });
  } catch (err) {
    console.error("pagadasVsPendientes:", err);
    res.status(500).json({ error: "Error generando pagadas vs. pendientes" });
  }
}
