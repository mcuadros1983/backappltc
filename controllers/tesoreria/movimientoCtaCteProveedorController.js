import { Op, fn, col, literal, where as sqWhere } from "sequelize";

import { sequelize } from "../../config/database.js";
import MovimientoCtaCteProveedor from "../../models/tesoreria/movimientoctacteproveedor.js";
import ComprobanteEgreso from "../../models/iva/comprobanteegreso.js"; // si querés datos extra
import Proveedor from "../../models/comun/proveedor.js"; // si existe ese modelo
import MovCtaCteProvAplic from "../../models/tesoreria/movimientoctacteproveedoraplicacion.js";
import MovimientoCajaTesoreria from "../../models/tesoreria/movimientocajatesoreria.js";
import MovimientoBancoTesoreria from "../../models/tesoreria/movimientobancotesoreria.js";
import EcheqEmitido from "../../models/tesoreria/pagoecheq.js";
import PagoTarjetaCredito from "../../models/tesoreria/pagotarjetacredito.js";
import OrdenPago from "../../models/tesoreria/ordendepago.js";
import PagoProgramadoTesoreria
  from "../../models/tesoreria/PagoProgramadoTesoreria.js";
import {
  recalcularComprobanteEgreso,
} from "./helpers/recalcularComprobanteEgreso.js";

// Crear movimiento
export const crearMovimientoCtaCteProveedor = async (req, res) => {
  try {
    const mov = await MovimientoCtaCteProveedor.create(req.body);
    res.status(201).json(mov);
  } catch (error) {
    res.status(500).json({
      error: "Error al crear el movimiento de cta cte proveedor",
      detalle: error.message,
    });
  }
};

// Listar movimientos (con filtros opcionales)
export const listarMovimientosCtaCteProveedor = async (req, res) => {
  try {
    const {
      proveedor_id,
      empresa_id,
      comprobanteegreso_id,
      origen_tipo,
      origen_id,
      fecha_desde,
      fecha_hasta,
    } = req.query;

    const where = {};

    if (proveedor_id) where.proveedor_id = proveedor_id;
    if (empresa_id) where.empresa_id = empresa_id;
    if (comprobanteegreso_id) where.comprobanteegreso_id = comprobanteegreso_id;
    if (origen_tipo) where.origen_tipo = origen_tipo;
    if (origen_id) where.origen_id = origen_id;

    if (fecha_desde || fecha_hasta) {
      where.fecha = {};
      if (fecha_desde) where.fecha[Op.gte] = fecha_desde;
      if (fecha_hasta) where.fecha[Op.lte] = fecha_hasta;
    }

    const movimientos = await MovimientoCtaCteProveedor.findAll({
      where,
      order: [
        ["fecha", "ASC"],
        ["id", "ASC"],
      ],
    });

    res.status(200).json(movimientos);
  } catch (error) {
    res.status(500).json({
      error: "Error al obtener los movimientos de cta cte proveedor",
      detalle: error.message,
    });
  }
};

// Obtener por ID
export const obtenerMovimientoCtaCteProveedorPorId = async (req, res) => {
  try {
    const mov = await MovimientoCtaCteProveedor.findByPk(req.params.id);
    if (!mov) {
      return res
        .status(404)
        .json({ error: "Movimiento de cta cte proveedor no encontrado" });
    }
    res.status(200).json(mov);
  } catch (error) {
    res.status(500).json({
      error: "Error al obtener el movimiento de cta cte proveedor",
      detalle: error.message,
    });
  }
};

// Actualizar
export const actualizarMovimientoCtaCteProveedor = async (req, res) => {

  const t =
    await sequelize.transaction();

  try {

    const id =
      Number(req.params.id);


    if (
      !Number.isInteger(id) ||
      id <= 0
    ) {
      throw new Error(
        "ID de movimiento inválido"
      );
    }


    const mov =
      await MovimientoCtaCteProveedor.findByPk(
        id,
        {
          transaction: t,
          lock: t.LOCK.UPDATE,
        }
      );


    if (!mov) {

      await t.rollback();

      return res
        .status(404)
        .json({
          error:
            "Movimiento de cta cte proveedor no encontrado",
        });
    }


    /*
     * Esta edición desde Situación Financiera
     * solamente está permitida para CARGOS.
     *
     * Los abonos poseen otros circuitos.
     */
    if (
      String(mov.tipo || "")
        .trim()
        .toLowerCase() !== "cargo"
    ) {
      throw new Error(
        "Solamente se pueden editar cargos de cuenta corriente."
      );
    }


    /*
     * ============================================================
     * CAMPOS PERMITIDOS
     * ============================================================
     *
     * empresa_id
     * descripcion
     * categoriaegreso_id
     * sucursal_id
     * fecha_pago        = Vencimiento
     * formapago_id      = FP acordada
     *
     * TODO lo demás permanece inalterable.
     * ============================================================
     */

    const patch = {};


    if (
      Object.prototype.hasOwnProperty.call(
        req.body,
        "empresa_id"
      )
    ) {

      patch.empresa_id =
        req.body.empresa_id
          ? Number(req.body.empresa_id)
          : null;
    }


    if (
      Object.prototype.hasOwnProperty.call(
        req.body,
        "descripcion"
      )
    ) {

      patch.descripcion =
        req.body.descripcion != null
          ? String(req.body.descripcion).trim()
          : null;
    }


    if (
      Object.prototype.hasOwnProperty.call(
        req.body,
        "categoriaegreso_id"
      )
    ) {

      patch.categoriaegreso_id =
        req.body.categoriaegreso_id
          ? Number(
            req.body.categoriaegreso_id
          )
          : null;
    }


    if (
      Object.prototype.hasOwnProperty.call(
        req.body,
        "sucursal_id"
      )
    ) {

      patch.sucursal_id =
        req.body.sucursal_id
          ? Number(
            req.body.sucursal_id
          )
          : null;
    }


    if (
      Object.prototype.hasOwnProperty.call(
        req.body,
        "fecha_pago"
      )
    ) {

      patch.fecha_pago =
        req.body.fecha_pago ||
        null;
    }


    if (
      Object.prototype.hasOwnProperty.call(
        req.body,
        "formapago_id"
      )
    ) {

      patch.formapago_id =
        req.body.formapago_id
          ? Number(
            req.body.formapago_id
          )
          : null;
    }


    await mov.update(
      patch,
      {
        transaction: t,
      }
    );


    await t.commit();


    return res.status(200).json({
      ok: true,

      movimiento:
        mov,
    });

  } catch (error) {

    if (!t.finished) {
      await t.rollback();
    }


    console.error(
      "actualizarMovimientoCtaCteProveedor:",
      error
    );


    return res.status(400).json({
      error:
        error.message ||
        "No se pudo actualizar el movimiento de cuenta corriente",
    });
  }
};

// Eliminar
export const eliminarMovimientoCtaCteProveedor = async (req, res) => {
  try {
    const mov = await MovimientoCtaCteProveedor.findByPk(req.params.id);
    if (!mov) {
      return res
        .status(404)
        .json({ error: "Movimiento de cta cte proveedor no encontrado" });
    }
    await mov.destroy();
    res
      .status(200)
      .json({ mensaje: "Movimiento de cta cte proveedor eliminado correctamente" });
  } catch (error) {
    res.status(500).json({
      error: "Error al eliminar el movimiento de cta cte proveedor",
      detalle: error.message,
    });
  }
};

export const listarSaldosCtaCteProveedores = async (req, res) => {
  try {
    console.log("▶ listarSaldosCtaCteProveedores.query:", req.query);

    const {
      empresa_id,
      proveedor_id,
      fecha_desde,
      fecha_hasta,
      includeAnuladas = "0",
      onlyConSaldo = "0",
    } = req.query || {};

    const where = {};

    if (empresa_id) where.empresa_id = Number(empresa_id);
    if (proveedor_id) where.proveedor_id = Number(proveedor_id);

    // Soporte dual: boolean (false) o enum ('no') para anulado
    if (includeAnuladas !== "1") {
      where[Op.or] = [{ anulado: false }, { anulado: "no" }]; // si la columna es BOOLEAN o ENUM
    }

    if (fecha_desde || fecha_hasta) {
      where.fecha = {};
      if (fecha_desde) where.fecha[Op.gte] = fecha_desde;
      if (fecha_hasta) where.fecha[Op.lte] = fecha_hasta;
    }

    console.log("▶ listarSaldosCtaCteProveedores.where:", JSON.stringify(where));

    const sumCargos = fn("SUM", literal(`CASE WHEN tipo = 'cargo' THEN importe ELSE 0 END`));
    const sumAbonos = fn("SUM", literal(`CASE WHEN tipo = 'abono' THEN importe ELSE 0 END`));

    // saldo = cargos - abonos
    const saldoExpr = literal(
      `SUM(CASE WHEN tipo = 'cargo' THEN importe ELSE 0 END) - SUM(CASE WHEN tipo = 'abono' THEN importe ELSE 0 END)`
    );

    // HAVING correcto (si onlyConSaldo=1 pedimos saldo <> 0)
    const havingClause = String(onlyConSaldo) === "1"
      ? sqWhere(saldoExpr, { [Op.ne]: 0 })
      : undefined;

    const options = {
      where,
      attributes: [
        "proveedor_id",
        [sumCargos, "cargos"],
        [sumAbonos, "abonos"],
        [saldoExpr, "saldo"],
      ],
      group: ["proveedor_id"],
      // Ordenar por la expresión (evita problemas con alias en algunos motores)
      order: [[saldoExpr, "DESC"], ["proveedor_id", "ASC"]],
      logging: (sql) => console.log("SQL listarSaldosCtaCteProveedores:\n", sql),
    };
    if (havingClause) options.having = havingClause;

    console.log("▶ having activado?:", !!havingClause);

    const rows = await MovimientoCtaCteProveedor.findAll(options);

    console.log("▶ rows.length:", rows.length);
    if (rows.length) {
      console.log(
        "▶ Sample rows (plain, up to 3):",
        rows.slice(0, 3).map(r => r.get({ plain: true }))
      );
    }

    const items = rows.map((r) => {
      const p = r.get({ plain: true });
      return {
        proveedor_id: p.proveedor_id,
        cargos: Number(p.cargos || 0),
        abonos: Number(p.abonos || 0),
        saldo: Number(p.saldo || 0),
      };
    });

    const totalGeneral = items.reduce((acc, it) => acc + Number(it.saldo || 0), 0);

    console.log("▶ items.length:", items.length, " totalGeneral:", totalGeneral);

    return res.json({ items, totalGeneral });
  } catch (err) {
    console.error("❌ listarSaldosCtaCteProveedores ERROR:", err);
    return res.status(500).json({ error: err.message || "No se pudo obtener los saldos" });
  }
};

// ───────────────────────────────────────────────────────────────────────────────
export const listarMovimientosProveedor = async (req, res) => {
  try {
    console.log("▶ listarMovimientosProveedor.params:", req.params);
    console.log("▶ listarMovimientosProveedor.query:", req.query);

    const proveedorId = Number(req.params.proveedorId);
    if (!proveedorId) return res.status(400).json({ error: "proveedorId inválido" });

    const { empresa_id, fecha_desde, fecha_hasta, includeAnuladas = "0" } = req.query || {};

    const where = { proveedor_id: proveedorId };
    if (empresa_id) where.empresa_id = Number(empresa_id);

    // Soporte boolean/enum para anulado
    if (includeAnuladas !== "1") {
      where[Op.or] = [{ anulado: false }, { anulado: "no" }];
    }

    if (fecha_desde || fecha_hasta) {
      where.fecha = {};
      if (fecha_desde) where.fecha[Op.gte] = fecha_desde;
      if (fecha_hasta) where.fecha[Op.lte] = fecha_hasta;
    }

    console.log("▶ listarMovimientosProveedor.where:", JSON.stringify(where));

    const movimientos = await MovimientoCtaCteProveedor.findAll({
      where,
      order: [["fecha", "ASC"], ["id", "ASC"]],
      logging: (sql) => console.log("SQL listarMovimientosProveedor:\n", sql),
    });

    console.log("▶ movimientos.length:", movimientos.length);

    let cargos = 0, abonos = 0;
    const list = movimientos.map((m) => {
      const row = m.get({ plain: true });
      const importe = Number(row.importe || 0);
      const tipo = (row.tipo || "").toLowerCase();
      if (tipo === "cargo") cargos += importe;
      else if (tipo === "abono") abonos += importe;

      return {
        id: row.id,
        fecha: row.fecha,
        fecha_pago: row.fecha_pago,
        tipo: row.tipo,
        importe,
        descripcion: row.descripcion,
        origen_tipo: row.origen_tipo,
        origen_id: row.origen_id,
        comprobanteegreso_id: row.comprobanteegreso_id,
        ordenpago_id: row.ordenpago_id,
        anulado: row.anulado,
        empresa_id: row.empresa_id,
      };
    });

    const saldo = cargos - abonos;
    console.log("▶ totales => cargos:", cargos, " abonos:", abonos, " saldo:", saldo);

    return res.json({ movimientos: list, totales: { cargos, abonos, saldo } });
  } catch (err) {
    console.error("❌ listarMovimientosProveedor ERROR:", err);
    return res.status(500).json({ error: err.message || "No se pudo obtener los movimientos" });
  }
};

// GET /movimientos-cta-cte-proveedor/cargos-abiertos
// Compatibilidad:
// - con proveedor_id => igual que antes
// - sin proveedor_id  => trae todos (filtrables por empresa/fecha) + paginación
export const listarCargosAbiertosCtaCteProveedor = async (req, res) => {
  try {
    // Filtros
    const {
      proveedor_id,        // opcional ahora
      empresa_id,          // opcional
      desde,               // opcional (YYYY-MM-DD)
      hasta,               // opcional (YYYY-MM-DD)
      page = 1,            // opcional (paginación server-side)
      page_size = 200,     // opcional
    } = req.query;

    const pageNum = Math.max(1, Number(page) || 1);
    const pageSizeNum = Math.min(1000, Math.max(1, Number(page_size) || 200)); // techo defensivo

    // 1) WHERE base: sólo CARGOS no anulados
    const where = {
      tipo: "cargo",
      anulado: { [Op.not]: true },
    };
    if (empresa_id) where.empresa_id = empresa_id;
    if (proveedor_id) where.proveedor_id = proveedor_id;
    if (desde || hasta) {
      where.fecha = {};
      if (desde) where.fecha[Op.gte] = desde;
      if (hasta) where.fecha[Op.lte] = hasta;
    }

    // 2) Traer CARGOS (sin saldo aún). No aplico limit acá porque debo filtrar por saldo>0 luego.
    //    (Si esto fuera masivo, se puede resolver con subquery agregada en SQL; mantenemos claridad primero.)
    const cargos = await MovimientoCtaCteProveedor.findAll({
      where,
      order: [["fecha", "ASC"], ["id", "ASC"]],
      attributes: [
        "id",
        "fecha",
        "fecha_pago",
        "descripcion",
        "importe",
        "proveedor_id",
        "empresa_id",
        "comprobanteegreso_id",
        "origen_tipo",
        "origen_id",
        "formapago_id",
        "categoriaegreso_id",
        "sucursal_id",
      ],
    });

    if (cargos.length === 0) return res.json({ rows: [], total: 0, page: pageNum, page_size: pageSizeNum });

    const cargoIds = cargos.map(c => c.id);

    // 3) Sumas aplicadas por cargo
    const aplicaciones = await MovCtaCteProvAplic.findAll({
      attributes: [
        "cargo_id",
        [sequelize.fn("SUM", sequelize.col("importe")), "aplicado"],
      ],
      where: { cargo_id: { [Op.in]: cargoIds } },
      group: ["cargo_id"],
    });
    const aplicadoPorCargo = {};
    for (const a of aplicaciones) {
      aplicadoPorCargo[a.cargo_id] = Number(a.get("aplicado") || 0);
    }

    // 4) Cargar comprobantes (nro + ordenpago_id) para los cargos que lo tengan
    const compIds = [...new Set(cargos.map(c => c.comprobanteegreso_id).filter(Boolean))];
    const comps = compIds.length
      ? await ComprobanteEgreso.findAll({
        attributes: ["id", "nrocomprobante", "ordenpago_id"],
        where: { id: { [Op.in]: compIds } },
      })
      : [];
    const compById = Object.fromEntries(comps.map(c => [c.id, c]));

    // 5) Armar filas con SALDO y filtrar saldo>0
    const withSaldo = cargos.map(c => {
      const aplicado = aplicadoPorCargo[c.id] || 0;
      const saldo = Number(c.importe || 0) - aplicado;
      const comp = c.comprobanteegreso_id ? compById[c.comprobanteegreso_id] : null;
      return {
        id: c.id,
        fecha: c.fecha,
        descripcion: c.descripcion,
        importe: Number(c.importe || 0),
        aplicado,
        saldo,
        proveedor_id: c.proveedor_id,
        empresa_id: c.empresa_id,
        fecha_pago: c.fecha_pago || null,       // 👈 para UI de situación financiera
        formapago_id: c.formapago_id || null,   // 👈 “forma de pago futura” (informativa)
        comprobanteegreso_id: c.comprobanteegreso_id || null,
        comprobante_nro: comp?.nrocomprobante || null,
        ordenpago_id: comp?.ordenpago_id ?? null,
        origen_tipo: c.origen_tipo,
        origen_id: c.origen_id,
        categoriaegreso_id:
          c.categoriaegreso_id || null,

        sucursal_id:
          c.sucursal_id || null,
      };
    }).filter(x => x.saldo > 0);

    // Orden final (por fecha asc / id asc), luego aplicamos paginación:
    withSaldo.sort((a, b) =>
      String(a.fecha || "").localeCompare(String(b.fecha || "")) || Number(a.id) - Number(b.id)
    );

    const total = withSaldo.length;

    // 6) Paginación server-side (sin romper compatibilidad: si tu front viejo no usa page/page_size, igual funciona)
    const start = (pageNum - 1) * pageSizeNum;
    const rows = withSaldo.slice(start, start + pageSizeNum);

    // Respuesta:
    // - Si tu front viejo esperaba "[]", puede usar ".rows" ahora sin problema (o adaptá en el front nuevo)
    return res.json({
      rows,
      total,
      page: pageNum,
      page_size: pageSizeNum,
      // Para totales agregados si más adelante los querés acá:
      // total_saldo: withSaldo.reduce((acc, r) => acc + r.saldo, 0),
    });

  } catch (err) {
    return res.status(500).json({ error: err.message || "Error listando cargos abiertos" });
  }
};


export const aplicarAbonoCtaCteProveedor = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const {
      empresa_id,
      proveedor_id,
      fecha,
      descripcion,
      aplicaciones = [],          // [{ cargo_id, importe }]
      incluirNumerosComp = true,
      pagos = [],                 // [{ medio, monto, ... }]
      // ordenpago_id: IGNORADO explícitamente según la nueva regla
    } = req.body || {};

    if (!empresa_id) throw new Error("empresa_id requerido");
    if (!proveedor_id) throw new Error("proveedor_id requerido");
    if (!Array.isArray(aplicaciones) || aplicaciones.length === 0)
      throw new Error("Debe enviar aplicaciones [{ cargo_id, importe }].");

    // ============ 1) CARGOS y validaciones de saldo ============
    const cargoIds = [...new Set(aplicaciones.map(a => Number(a.cargo_id)).filter(Boolean))];

    const cargos = await MovimientoCtaCteProveedor.findAll({
      where: {
        id: { [Op.in]: cargoIds },
        proveedor_id,
        empresa_id,
        tipo: "cargo",
        anulado: { [Op.not]: true },
      },
      lock: t.LOCK.UPDATE,
      transaction: t,
    });
    if (cargos.length !== cargoIds.length) {
      throw new Error("Alguno de los cargos no existe o no pertenece al proveedor/empresa.");
    }

    const aplicacionesExistentes = await MovCtaCteProvAplic.findAll({
      where: { cargo_id: { [Op.in]: cargoIds } },
      transaction: t,
    });
    const aplicadoPorCargo = {};
    for (const a of aplicacionesExistentes) {
      aplicadoPorCargo[a.cargo_id] = (aplicadoPorCargo[a.cargo_id] || 0) + Number(a.importe || 0);
    }

    const cargoById = Object.fromEntries(cargos.map(c => [c.id, c]));
    let totalAplicar = 0;
    for (const a of aplicaciones) {
      const cargo = cargoById[Number(a.cargo_id)];
      const importe = Number(a.importe || 0);
      if (!cargo || importe <= 0) throw new Error("Aplicación inválida.");
      const yaAplicado = aplicadoPorCargo[cargo.id] || 0;
      const saldo = Number(cargo.importe || 0) - yaAplicado;
      if (importe > saldo + 0.0001) {
        throw new Error(`La aplicación al cargo #${cargo.id} (${importe}) excede su saldo (${saldo}).`);
      }
      totalAplicar += importe;
    }
    if (totalAplicar <= 0) throw new Error("Total a aplicar inválido.");

    // ============ 2) Datos proveedor y comprobantes ============
    const proveedor = await Proveedor.findByPk(proveedor_id, {
      attributes: ["id", "nombre"],
      transaction: t,
    });
    const provNombre = proveedor?.nombre || `Proveedor ${proveedor_id}`;

    const compIdsAll = cargos.map(c => c.comprobanteegreso_id).filter(Boolean);
    const compIdsUnicos = [...new Set(compIdsAll)];
    const compIdUnico = compIdsUnicos.length === 1 ? compIdsUnicos[0] : null;

    let nrosComp = [];
    let compById = {};
    if (compIdsUnicos.length > 0) {
      const comps = await ComprobanteEgreso.findAll({
        attributes: ["id", "nrocomprobante"],
        where: { id: { [Op.in]: compIdsUnicos } },
        transaction: t,
      });
      compById = Object.fromEntries(comps.map(c => [c.id, (c.nrocomprobante || c.id)]));
      const etiquetas = [];
      for (const a of aplicaciones) {
        const compId = cargoById[a.cargo_id]?.comprobanteegreso_id;
        if (compId) etiquetas.push(compById[compId]);
      }
      nrosComp = [...new Set(etiquetas.filter(Boolean))];
    }

    const etiquetaComp = nrosComp.length ? ` · Nro Comp: ${nrosComp.join(", ")}` : "";
    const descPagoBase = `Pago cta cte ${provNombre}${etiquetaComp}`;

    // ============ 3) Descripción base ============
    let descFinalBase = (descripcion || "").trim();
    if (!descFinalBase) {
      descFinalBase = incluirNumerosComp && nrosComp.length
        ? `Abono Comp: ${nrosComp.join(", ")}`
        : "Abono en cuenta corriente de proveedor";
    }

    if (
      Array.isArray(pagos) &&
      pagos.length > 0
    ) {

      const etiquetasPagos =
        pagos.map(
          (p) => {

            const medio =
              String(
                p.medio || ""
              ).toLowerCase();


            let medioTxt =
              medio;

            if (
              medio === "caja" ||
              /efectivo/i.test(medio)
            ) {
              medioTxt =
                "Efectivo";
            } else if (
              medio === "transferencia" ||
              /transfer/i.test(medio)
            ) {
              medioTxt =
                "Transferencia";
            } else if (
              medio === "echeq" ||
              /e-?\s*cheq/i.test(medio)
            ) {
              medioTxt =
                "eCheq";
            } else if (
              medio === "tarjeta" ||
              /tarjeta/i.test(medio)
            ) {
              medioTxt =
                "Tarjeta";
            }


            /*
             * Si proviene de un Pago Programado,
             * lo dejamos expresamente identificado.
             */
            const esPagoProgramado =
              p?.existing_ref &&
              String(
                p.existing_ref.tipo || ""
              ).toLowerCase() ===
              "pago_programado";


            if (esPagoProgramado) {
              return `Pago Programado - ${medioTxt}`;
            }


            return medioTxt;
          }
        );


      const formasTxt =
        [
          ...new Set(
            etiquetasPagos
          ),
        ].join(", ");


      descFinalBase +=
        ` · Pago con: ${formasTxt}`;
    }

    const hoy = new Date().toISOString().slice(0, 10);
    const fechaAbono = fecha || hoy;

    // ============ 3.5) Validar pagos y CREAR OP NUEVA ============
    let totalPagosPreview = 0;
    let fechaPagoAbono = null;

    if (Array.isArray(pagos) && pagos.length > 0) {
      for (const p of pagos) {
        const medio = String(p.medio || "").toLowerCase();
        if (medio === "ctacte" || /cta\.?\s*cte|cuenta\s*corriente/i.test(medio)) {
          throw new Error("El medio 'ctacte' no está permitido como forma de pago aquí.");
        }
        const monto = Number(p.monto || 0);
        if (monto <= 0) throw new Error("Monto de pago inválido.");
        totalPagosPreview += monto;
      }
      fechaPagoAbono = pagos[0].fecha || fechaAbono;

      if (totalPagosPreview < totalAplicar - 0.0001) {
        throw new Error(`La suma de pagos (${totalPagosPreview.toFixed(2)}) no alcanza el total a aplicar (${totalAplicar.toFixed(2)}).`);
      }
    }

    // ============================================================
    // 3.6) RESOLVER ORDEN DE PAGO
    // ============================================================
    //
    // REGLA:
    //
    // A) Si todos los pagos son NUEVOS:
    //    creamos una OP nueva.
    //
    // B) Si todos los pagos son movimientos financieros EXISTENTES:
    //    NO creamos otra OP.
    //    Reutilizamos la OP del movimiento existente.
    //
    // C) Pago Programado PENDIENTE:
    //    conserva el comportamiento actual y utiliza una OP nueva
    //    para registrar esta aplicación.
    //
    // ============================================================

    let ordenPagoIdToUse =
      null;


    const pagosConExistingRef =
      (pagos || []).filter(
        (p) =>
          !!p?.existing_ref
      );


    const todosSonExistentes =
      pagos.length > 0 &&
      pagosConExistingRef.length ===
      pagos.length;


    const todosSonMovimientosFinancierosExistentes =
      todosSonExistentes &&
      pagos.every(
        (p) => {

          const tipo =
            String(
              p?.existing_ref?.tipo || ""
            )
              .trim()
              .toLowerCase();


          return [
            "banco",
            "movimiento_banco",
            "movimientobancotesoreria",

            "caja",
            "movimiento_caja",
            "movimientocajatesoreria",

            "echeq",
            "echeq_emitido",
            "echeqemitido",
          ].includes(
            tipo
          );
        }
      );


    if (
      todosSonMovimientosFinancierosExistentes
    ) {

      /*
       * No creamos una nueva OP.
       *
       * La OP se resolverá desde el movimiento
       * financiero existente cuando lo carguemos
       * en la sección siguiente.
       */

      ordenPagoIdToUse =
        null;

    } else if (
      Array.isArray(pagos) &&
      pagos.length > 0
    ) {

      const nuevaOP =
        await OrdenPago.create(
          {
            empresa_id,

            proveedor_id,

            fecha:
              fechaPagoAbono ||
              fechaAbono,

            total:
              Number(
                totalPagosPreview.toFixed(2)
              ),

            estado:
              "aplicada",

            origen:
              "abono_ctacte",

            descripcion:
              descFinalBase?.slice(
                0,
                250
              ) || null,

            comprobanteegreso_id:
              compIdUnico,
          },
          {
            transaction: t,
          }
        );


      ordenPagoIdToUse =
        nuevaOP.id;
    }

    // ============ 4) Registrar FORMAS DE PAGO ================================
    //
    // REGLA:
    //
    // A) Pago NUEVO:
    //    crea el movimiento financiero real.
    //
    // B) PagoProgramado EXISTENTE:
    //    NO se acredita.
    //    NO crea movimiento Banco/Caja/eCheq.
    //    Continúa en estado "pendiente".
    //    Solamente queda asociado a esta aplicación.
    //
    // ==========================================================================

    let totalPagos = 0;

    const pagosCreados = {
      caja: [],
      banco: [],
      echeq: [],
      tarjeta: [],
    };

    const pagosInfo = [];

    /*
     * Guardamos los PagoProgramado utilizados.
     *
     * Después los utilizaremos para dejar trazabilidad
     * en los ABONOS de Cta.Cte.
     */
    const pagosProgramadosUsados = [];


    if (
      Array.isArray(pagos) &&
      pagos.length > 0
    ) {

      for (const p of pagos) {

        const medio =
          String(p.medio || "")
            .toLowerCase();

        const monto =
          Number(p.monto || 0);

        const fechaPago =
          p.fecha || fechaAbono;


        if (!(monto > 0)) {
          throw new Error(
            "Monto de pago inválido."
          );
        }


        // ============================================================
        // PAGO PROGRAMADO EXISTENTE
        // ============================================================

        if (p?.existing_ref) {
          const tipoExisting =
            String(
              p.existing_ref.tipo || ""
            )
              .trim()
              .toLowerCase();


          const existingId =
            Number(
              p.existing_ref.id
            );


          if (!existingId) {
            throw new Error(
              "Movimiento existente inválido."
            );
          }


          // ============================================================
          // MOVIMIENTO BANCO EXISTENTE
          // ============================================================

          const esMovimientoBancoExistente =
            [
              "banco",
              "movimiento_banco",
              "movimientobancotesoreria",
            ].includes(
              tipoExisting
            );


          if (esMovimientoBancoExistente) {

            const movBanco =
              await MovimientoBancoTesoreria.findByPk(
                existingId,
                {
                  transaction: t,
                  lock: t.LOCK.UPDATE,
                }
              );


            if (!movBanco) {
              throw new Error(
                `Movimiento bancario #${existingId} no encontrado.`
              );
            }


            if (
              movBanco.anulado === true
            ) {
              throw new Error(
                `El movimiento bancario #${existingId} está anulado.`
              );
            }


            if (
              String(
                movBanco.tipo || ""
              ).toLowerCase() !==
              "egreso"
            ) {
              throw new Error(
                `El movimiento bancario #${existingId} no es un egreso.`
              );
            }


            if (
              Number(
                movBanco.proveedor_id
              ) !==
              Number(
                proveedor_id
              )
            ) {
              throw new Error(
                `El movimiento bancario #${existingId} pertenece a otro proveedor.`
              );
            }


            const montoMovimiento =
              Number(
                movBanco.monto || 0
              );


            if (!(montoMovimiento > 0)) {
              throw new Error(
                `El movimiento bancario #${existingId} tiene un monto inválido.`
              );
            }


            if (
              Math.abs(
                montoMovimiento -
                monto
              ) > 0.0001
            ) {
              throw new Error(
                `El monto del movimiento bancario #${existingId} ($${montoMovimiento.toFixed(2)}) no coincide con el monto seleccionado ($${monto.toFixed(2)}).`
              );
            }



            /*
             * MUY IMPORTANTE:
             *
             * El movimiento bancario YA EXISTE.
             *
             * NO creamos otro MovimientoBancoTesoreria.
             * Solamente lo utilizamos como pago real
             * para esta aplicación de Cta.Cte.
             */

            pagosCreados.banco.push(
              movBanco
            );


            pagosInfo.push({
              formapago_id:
                p.formapago_id ||
                movBanco.formapago_id ||
                null,

              tipoMovimiento:
                "MovimientoBancoTesoreria",

              movimiento_id:
                movBanco.id,
              monto:
                montoMovimiento,
              ordenpago_id:
                movBanco.ordenpago_id ||
                null,
            });


            totalPagos +=
              montoMovimiento;


            continue;
          }

          // ============================================================
          // MOVIMIENTO CAJA EXISTENTE
          // ============================================================

          const esMovimientoCajaExistente =
            [
              "caja",
              "movimiento_caja",
              "movimientocajatesoreria",
            ].includes(
              tipoExisting
            );


          if (esMovimientoCajaExistente) {

            const movCaja =
              await MovimientoCajaTesoreria.findByPk(
                existingId,
                {
                  transaction: t,
                  lock: t.LOCK.UPDATE,
                }
              );


            if (!movCaja) {
              throw new Error(
                `Movimiento de caja #${existingId} no encontrado.`
              );
            }


            if (
              movCaja.anulado === true
            ) {
              throw new Error(
                `El movimiento de caja #${existingId} está anulado.`
              );
            }


            if (
              String(
                movCaja.tipo || ""
              ).toLowerCase() !==
              "egreso"
            ) {
              throw new Error(
                `El movimiento de caja #${existingId} no es un egreso.`
              );
            }


            if (
              Number(
                movCaja.proveedor_id
              ) !==
              Number(
                proveedor_id
              )
            ) {
              throw new Error(
                `El movimiento de caja #${existingId} pertenece a otro proveedor.`
              );
            }


            const montoMovimiento =
              Number(
                movCaja.monto || 0
              );


            if (!(montoMovimiento > 0)) {
              throw new Error(
                `El movimiento de caja #${existingId} tiene un monto inválido.`
              );
            }


            if (
              Math.abs(
                montoMovimiento -
                monto
              ) > 0.0001
            ) {
              throw new Error(
                `El monto del movimiento de caja #${existingId} ($${montoMovimiento.toFixed(2)}) no coincide con el monto seleccionado ($${monto.toFixed(2)}).`
              );
            }


            /*
             * Si el movimiento ya posee una OP,
             * reutilizamos esa misma Orden de Pago.
             */
            /*
         * El MovimientoCajaTesoreria ya posee su propia
         * Orden de Pago de origen.
         *
         * Al aplicar varios movimientos financieros existentes
         * a una misma deuda, NO exigimos que pertenezcan
         * a la misma Orden de Pago.
         *
         * Tampoco reasignamos ordenPagoIdToUse, porque esta
         * aplicación puede estar compuesta por movimientos
         * provenientes de distintas OP.
         */

            /*
             * El movimiento de Caja YA EXISTE.
             *
             * NO generamos otro egreso de Caja.
             * Solamente lo utilizamos para aplicar
             * el pago real a la Cta.Cte.
             */

            pagosCreados.caja.push(
              movCaja
            );


            pagosInfo.push({
              formapago_id:
                p.formapago_id ||
                movCaja.formapago_id ||
                null,

              tipoMovimiento:
                "MovimientoCajaTesoreria",

              movimiento_id:
                movCaja.id,
              monto:
                montoMovimiento,
              ordenpago_id:
                movCaja.ordenpago_id ||
                null,

            });


            totalPagos +=
              montoMovimiento;


            continue;
          }

          // ============================================================
          // ECHEQ EXISTENTE
          // ============================================================

          const esEcheqExistente =
            [
              "echeq",
              "echeq_emitido",
              "echeqemitido",
            ].includes(
              tipoExisting
            );


          if (esEcheqExistente) {

            const echeq =
              await EcheqEmitido.findByPk(
                existingId,
                {
                  transaction: t,
                  lock: t.LOCK.UPDATE,
                }
              );


            if (!echeq) {
              throw new Error(
                `eCheq #${existingId} no encontrado.`
              );
            }


            if (
              echeq.anulado === true
            ) {
              throw new Error(
                `El eCheq #${existingId} está anulado.`
              );
            }


            /*
             * Evitamos reutilizar un eCheq que ya haya
             * terminado en un estado incompatible.
             */
            if (
              [
                "anulado",
                "rechazado",
                "cancelado",
              ].includes(
                String(
                  echeq.estado || ""
                ).toLowerCase()
              )
            ) {
              throw new Error(
                `El eCheq #${existingId} se encuentra en estado ${echeq.estado}.`
              );
            }


            if (
              Number(
                echeq.proveedor_id
              ) !==
              Number(
                proveedor_id
              )
            ) {
              throw new Error(
                `El eCheq #${existingId} pertenece a otro proveedor.`
              );
            }


            const montoMovimiento =
              Number(
                echeq.importe || 0
              );


            if (!(montoMovimiento > 0)) {
              throw new Error(
                `El eCheq #${existingId} tiene un importe inválido.`
              );
            }


            if (
              Math.abs(
                montoMovimiento -
                monto
              ) > 0.0001
            ) {
              throw new Error(
                `El importe del eCheq #${existingId} ($${montoMovimiento.toFixed(2)}) no coincide con el monto seleccionado ($${monto.toFixed(2)}).`
              );
            }


            /*
             * El eCheq YA EXISTE.
             *
             * NO generamos otro EcheqEmitido.
             * Solamente utilizamos el existente para
             * aplicar el pago a la Cta.Cte.
             */

            pagosCreados.echeq.push(
              echeq
            );


            pagosInfo.push({
              formapago_id:
                p.formapago_id ||
                echeq.formapago_id ||
                null,

              tipoMovimiento:
                "EcheqEmitido",

              movimiento_id:
                echeq.id,

              monto:
                montoMovimiento,
              ordenpago_id:
                echeq.ordenpago_id ||
                null,
            });


            totalPagos +=
              montoMovimiento;


            continue;
          }

          // ============================================================
          // PAGO PROGRAMADO EXISTENTE
          // ============================================================

          if (
            tipoExisting !==
            "pago_programado"
          ) {
            throw new Error(
              `Movimiento existente no soportado: ${p.existing_ref.tipo}`
            );
          }


          /*
           * Bloqueamos el programado para impedir
           * que dos operaciones lo utilicen simultáneamente.
           */
          const programado =
            await PagoProgramadoTesoreria.findByPk(
              existingId,
              {
                transaction: t,
                lock: t.LOCK.UPDATE,
              }
            );


          if (!programado) {
            throw new Error(
              `Pago programado #${existingId} no encontrado.`
            );
          }


          if (
            programado.estado !==
            "pendiente"
          ) {
            throw new Error(
              `El pago programado #${programado.id} se encuentra en estado ${programado.estado}.`
            );
          }


          if (
            Number(programado.proveedor_id) !==
            Number(proveedor_id)
          ) {
            throw new Error(
              `El pago programado #${programado.id} pertenece a otro proveedor.`
            );
          }


          if (
            programado.comprobanteegreso_id
          ) {
            throw new Error(
              `El pago programado #${programado.id} ya está asociado a un comprobante.`
            );
          }


          /*
           * Un anticipo programado tiene su propio flujo.
           */
          if (
            programado.tipo === "anticipo"
          ) {
            throw new Error(
              `El pago programado #${programado.id} es un anticipo. Debe utilizarse mediante "Usar anticipo existente".`
            );
          }


          const montoProgramado =
            Number(
              programado.monto || 0
            );


          if (!(montoProgramado > 0)) {
            throw new Error(
              `El pago programado #${programado.id} tiene un monto inválido.`
            );
          }


          /*
           * Por ahora no permitimos aplicación parcial
           * del PagoProgramado.
           */
          if (
            Math.abs(
              montoProgramado -
              monto
            ) > 0.0001
          ) {
            throw new Error(
              `El monto del pago programado #${programado.id} ($${montoProgramado.toFixed(2)}) no coincide con el monto seleccionado ($${monto.toFixed(2)}).`
            );
          }


          const formaPagoFinal =
            p.formapago_id
              ? Number(p.formapago_id)
              : (
                programado.formapago_id
                  ? Number(programado.formapago_id)
                  : null
              );


          /*
           * MUY IMPORTANTE:
           *
           * NO creamos:
           * - MovimientoBancoTesoreria
           * - MovimientoCajaTesoreria
           * - EcheqEmitido
           *
           * NO modificamos:
           * - estado
           * - fecha_acreditacion
           * - movimiento_tipo
           * - movimiento_id
           *
           * El compromiso sigue PENDIENTE.
           *
           * Solamente lo asociamos a esta operación.
           */
          await programado.update(
            {
              ordenpago_id:
                ordenPagoIdToUse || null,

              comprobanteegreso_id:
                compIdUnico || null,

              formapago_id:
                formaPagoFinal,
            },
            {
              transaction: t,
            }
          );


          pagosProgramadosUsados.push({
            id:
              programado.id,

            monto:
              montoProgramado,

            formapago_id:
              formaPagoFinal,

            comprobanteegreso_id:
              compIdUnico || null,
          });


          pagosInfo.push({
            formapago_id:
              formaPagoFinal,

            tipoMovimiento:
              "PagoProgramadoTesoreria",

            movimiento_id:
              programado.id,
            monto:
              montoProgramado,
          });


          /*
           * Sí cuenta para cancelar la deuda de Cta.Cte.,
           * aunque todavía NO sea salida financiera real.
           */
          totalPagos +=
            montoProgramado;


          continue;
        }


        // ============================================================
        // PAGO NUEVO — CAJA
        // ============================================================

        if (
          medio === "caja" ||
          /caja|efectivo/i.test(medio)
        ) {

          if (!p.caja_id) {
            throw new Error(
              "caja_id requerido para pago en caja"
            );
          }


          const mov =
            await MovimientoCajaTesoreria.create(
              {
                tipo: "egreso",

                descripcion:
                  p.detalle ||
                  descPagoBase,

                monto,

                fecha:
                  fechaPago,

                caja_id:
                  p.caja_id,

                empresa_id,

                formapago_id:
                  p.formapago_id ||
                  null,

                referencia_id:
                  ordenPagoIdToUse,

                referencia_tipo:
                  "OrdenPago",

                observaciones:
                  p.observaciones ||
                  null,

                categoriaegreso_id:
                  p.categoriaegreso_id ||
                  null,

                imputacioncontable_id:
                  p.imputacioncontable_id ||
                  null,

                ordenpago_id:
                  ordenPagoIdToUse,

                proveedor_id,

                comprobanteegreso_id:
                  compIdUnico,
              },
              {
                transaction: t,
              }
            );


          pagosCreados.caja.push(mov);

          pagosInfo.push({
            formapago_id:
              p.formapago_id || null,

            tipoMovimiento:
              "MovimientoCajaTesoreria",

            movimiento_id:
              mov.id,

            monto,
          });

          totalPagos += monto;

          continue;
        }


        // ============================================================
        // PAGO NUEVO — TRANSFERENCIA
        // ============================================================

        if (
          medio === "transferencia" ||
          /transfer/i.test(medio)
        ) {

          if (!p.banco_id) {
            throw new Error(
              "banco_id requerido para transferencia"
            );
          }


          const mov =
            await MovimientoBancoTesoreria.create(
              {
                tipo: "egreso",

                descripcion:
                  p.detalle ||
                  `${descPagoBase} por transferencia`,

                monto,

                fecha:
                  fechaPago,

                banco_id:
                  p.banco_id,

                empresa_id,

                formapago_id:
                  p.formapago_id ||
                  null,

                referencia_id:
                  ordenPagoIdToUse,

                referencia_tipo:
                  "OrdenPago",

                observaciones:
                  p.observaciones ||
                  null,

                ordenpago_id:
                  ordenPagoIdToUse,

                proveedor_id,

                comprobanteegreso_id:
                  compIdUnico,
              },
              {
                transaction: t,
              }
            );


          pagosCreados.banco.push(mov);

          pagosInfo.push({
            formapago_id:
              p.formapago_id || null,

            tipoMovimiento:
              "MovimientoBancoTesoreria",

            movimiento_id:
              mov.id,
            monto,
          });

          totalPagos += monto;

          continue;
        }


        // ============================================================
        // PAGO NUEVO — ECHEQ
        // ============================================================

        if (
          medio === "echeq" ||
          /e-?\s*cheq|echeq/i.test(medio)
        ) {

          if (!p.banco_id) {
            throw new Error(
              "banco_id requerido para eCheq"
            );
          }

          if (!p.fecha_vencimiento) {
            throw new Error(
              "fecha_vencimiento requerida para eCheq"
            );
          }

          if (
            new Date(p.fecha_vencimiento) <
            new Date(fechaPago)
          ) {
            throw new Error(
              "fecha_vencimiento no puede ser anterior a la fecha de emisión"
            );
          }


          const ch =
            await EcheqEmitido.create(
              {
                comprobanteegreso_id:
                  compIdUnico,

                proveedor_id,

                empresa_id,

                numero_echeq:
                  p.numero_echeq ||
                  null,

                banco_id:
                  p.banco_id,

                fecha_emision:
                  fechaPago,

                fecha_vencimiento:
                  p.fecha_vencimiento,

                importe:
                  monto,

                estado:
                  "emitido",

                ordenpago_id:
                  ordenPagoIdToUse,

                referencia_id:
                  ordenPagoIdToUse,

                referencia_tipo:
                  "OrdenPago",
              },
              {
                transaction: t,
              }
            );


          pagosCreados.echeq.push(ch);

          pagosInfo.push({
            formapago_id:
              p.formapago_id || null,

            tipoMovimiento:
              "EcheqEmitido",

            movimiento_id:
              ch.id,

            monto
          });

          totalPagos += monto;

          continue;
        }


        // ============================================================
        // PAGO NUEVO — TARJETA
        // ============================================================

        if (
          medio === "tarjeta" ||
          /tarjeta/i.test(medio)
        ) {

          if (!p.tipotarjeta_id) {
            throw new Error(
              "tipotarjeta_id requerido"
            );
          }

          if (!p.marcatarjeta_id) {
            throw new Error(
              "marcatarjeta_id requerido"
            );
          }


          const pt =
            await PagoTarjetaCredito.create(
              {
                fecha:
                  fechaPago,

                importe:
                  monto,

                comprobanteegreso_id:
                  compIdUnico,

                empresa_id,

                proveedor_id,

                tipotarjeta_id:
                  p.tipotarjeta_id ||
                  null,

                marcatarjeta_id:
                  p.marcatarjeta_id ||
                  null,

                cupon_numero:
                  p.cupon_numero ||
                  null,

                planpago_id:
                  p.planpago_id ||
                  null,

                concepto:
                  p.detalle ||
                  `${descPagoBase} con tarjeta`,

                observaciones:
                  p.observaciones ||
                  null,

                estado:
                  "pendiente",

                ordenpago_id:
                  ordenPagoIdToUse,

                referencia_id:
                  ordenPagoIdToUse,

                referencia_tipo:
                  "OrdenPago",
              },
              {
                transaction: t,
              }
            );


          pagosCreados.tarjeta.push(pt);

          pagosInfo.push({
            formapago_id:
              p.formapago_id || null,

            tipoMovimiento:
              "PagoTarjetaCredito",

            movimiento_id:
              pt.id,

            monto,
          });

          totalPagos += monto;

          continue;
        }


        throw new Error(
          `Medio de pago no soportado: ${p.medio}`
        );
      }


      if (
        totalPagos <
        totalAplicar - 0.0001
      ) {
        throw new Error(
          `La suma de pagos (${totalPagos.toFixed(2)}) no alcanza el total a aplicar (${totalAplicar.toFixed(2)}).`
        );
      }
    }

    // ============ 5) Referencia única si hubo un solo movimiento ============
    const pagosFlat = [
      ...pagosCreados.caja.map(m => ({
        tipo: "MovimientoCajaTesoreria",
        id: m.id,
      })),

      ...pagosCreados.banco.map(m => ({
        tipo: "MovimientoBancoTesoreria",
        id: m.id,
      })),

      ...pagosCreados.echeq.map(m => ({
        tipo: "EcheqEmitido",
        id: m.id,
      })),

      ...pagosCreados.tarjeta.map(m => ({
        tipo: "PagoTarjetaCredito",
        id: m.id,
      })),

      ...pagosProgramadosUsados.map(p => ({
        tipo: "PagoProgramadoTesoreria",
        id: p.id,
      })),
    ];
    let refTipo = null, refId = null;
    if (pagosFlat.length === 1) {
      refTipo = pagosFlat[0].tipo;
      refId = pagosFlat[0].id;
    }

    // ============ 6) Resolver formapago_id del ABONO según pagos ============
    const unicosFormaPago = [...new Set(pagosInfo.map(x => x.formapago_id).filter(Boolean))];
    const resolvedFormaPagoId =
      unicosFormaPago.length === 1
        ? unicosFormaPago[0]
        : (pagosInfo.find(x => x.formapago_id)?.formapago_id || null);
    // ============================================================
    // 7) DISTRIBUIR LOS PAGOS ENTRE LOS CARGOS
    //    Y CREAR ABONO + APLICACIÓN POR CADA PORCIÓN
    // ============================================================
    //
    // REGLA:
    //
    // Cada ABONO debe conservar la referencia EXACTA
    // al movimiento financiero que lo originó.
    //
    // Ejemplo:
    //
    // Cargo $300
    //
    // Caja #10  $100
    // Caja #20  $200
    //
    // genera:
    //
    // ABONO $100 → MovimientoCajaTesoreria #10
    // ABONO $200 → MovimientoCajaTesoreria #20
    //
    // Si un mismo pago alcanza a dos cargos:
    //
    // Pago $150
    //
    // Cargo A $100
    // Cargo B $50
    //
    // genera dos ABONOS, ambos referenciando
    // al mismo movimiento financiero.
    //
    // ============================================================


    const abonosCreados =
      [];


    /*
     * ------------------------------------------------------------
     * 7.1) AGRUPAR LAS APLICACIONES POR CARGO
     * ------------------------------------------------------------
     *
     * Conservamos el orden recibido.
     *
     * Esto también evita problemas si por algún motivo
     * el frontend enviara dos líneas correspondientes
     * al mismo cargo.
     */

    const aplicacionesPorCargo =
      new Map();


    for (
      const aplicacion
      of aplicaciones
    ) {

      const cargoId =
        Number(
          aplicacion.cargo_id
        );

      const importe =
        Number(
          aplicacion.importe ||
          0
        );


      if (
        !cargoId ||
        !(importe > 0)
      ) {
        continue;
      }


      if (
        !aplicacionesPorCargo.has(
          cargoId
        )
      ) {

        aplicacionesPorCargo.set(
          cargoId,
          0
        );
      }


      aplicacionesPorCargo.set(
        cargoId,

        Number(
          (
            aplicacionesPorCargo.get(
              cargoId
            ) +
            importe
          ).toFixed(2)
        )
      );
    }


    /*
     * ------------------------------------------------------------
     * 7.2) PREPARAR LOS PAGOS CON SALDO DISPONIBLE
     * ------------------------------------------------------------
     *
     * Cada pago conserva:
     *
     * - tipo de movimiento;
     * - id del movimiento;
     * - forma de pago;
     * - monto original;
     * - saldo todavía no distribuido.
     */

    const pagosParaDistribuir =
      pagosInfo.map(
        (pago) => {

          const montoPago =
            Number(
              pago.monto ||
              0
            );


          return {
            ...pago,

            monto:
              montoPago,

            saldoDisponible:
              montoPago,
          };
        }
      );


    /*
     * Defensa:
     *
     * Todos los pagos utilizados en esta operación
     * deben tener monto informado.
     */

    for (
      const pago
      of pagosParaDistribuir
    ) {

      if (
        !(pago.monto > 0)
      ) {

        throw new Error(
          `No se pudo determinar el monto del movimiento ${pago.tipoMovimiento || "desconocido"} #${pago.movimiento_id || "?"}.`
        );
      }
    }


    /*
     * ------------------------------------------------------------
     * 7.3) FUNCIÓN PARA DESCRIPCIÓN DEL ABONO
     * ------------------------------------------------------------
     */

    const descripcionAbonoPorPago = (
      pagoInfo,
      nroCompTxt
    ) => {

      /*
       * Si el usuario escribió una descripción manual,
       * la respetamos.
       */
      if (descripcion) {
        return descFinalBase;
      }


      const tipoMovimiento =
        String(
          pagoInfo.tipoMovimiento ||
          ""
        )
          .trim()
          .toLowerCase();


      let medioTxt =
        null;


      if (
        tipoMovimiento ===
        "movimientobancotesoreria"
      ) {

        medioTxt =
          "Transferencia";

      } else if (
        tipoMovimiento ===
        "movimientocajatesoreria"
      ) {

        medioTxt =
          "Efectivo";

      } else if (
        tipoMovimiento ===
        "echeqemitido"
      ) {

        medioTxt =
          "eCheq";

      } else if (
        tipoMovimiento ===
        "pagotarjetacredito"
      ) {

        medioTxt =
          "Tarjeta";

      } else if (
        tipoMovimiento ===
        "pagoprogramadotesoreria"
      ) {

        /*
         * Intentamos recuperar el medio previsto
         * desde el pago original recibido.
         */
        const pagoOriginal =
          pagos.find(
            (p) =>
              Number(
                p?.existing_ref?.id ||
                0
              ) ===
              Number(
                pagoInfo.movimiento_id
              ) &&
              String(
                p?.existing_ref?.tipo ||
                ""
              )
                .trim()
                .toLowerCase() ===
              "pago_programado"
          );


        const medioOriginal =
          String(
            pagoOriginal?.medio ||
            ""
          )
            .trim()
            .toLowerCase();


        if (
          medioOriginal === "caja" ||
          /efectivo/i.test(
            medioOriginal
          )
        ) {

          medioTxt =
            "Efectivo";

        } else if (
          medioOriginal === "transferencia" ||
          /transfer/i.test(
            medioOriginal
          )
        ) {

          medioTxt =
            "Transferencia";

        } else if (
          medioOriginal === "echeq" ||
          /e-?\s*cheq/i.test(
            medioOriginal
          )
        ) {

          medioTxt =
            "eCheq";

        } else if (
          medioOriginal === "tarjeta" ||
          /tarjeta/i.test(
            medioOriginal
          )
        ) {

          medioTxt =
            "Tarjeta";

        } else {

          medioTxt =
            "Sin medio";
        }


        return nroCompTxt
          ? `Pago programado - ${medioTxt} - Comp: ${nroCompTxt}`
          : `Pago programado - ${medioTxt}`;
      }


      if (medioTxt) {

        return nroCompTxt
          ? `Pago acreditado - ${medioTxt} - Comp: ${nroCompTxt}`
          : `Pago acreditado - ${medioTxt}`;
      }


      return nroCompTxt
        ? `Abono Comp: ${nroCompTxt}`
        : "Abono en cuenta corriente de proveedor";
    };


    /*
     * ------------------------------------------------------------
     * 7.4) DISTRIBUCIÓN PAGO → CARGO
     * ------------------------------------------------------------
     */

    let indicePago =
      0;


    for (
      const [
        cargoId,
        importeCargoOriginal
      ]
      of aplicacionesPorCargo.entries()
    ) {

      const cargo =
        cargoById[
        cargoId
        ];


      if (!cargo) {
        throw new Error(
          `Cargo #${cargoId} no encontrado durante la distribución del pago.`
        );
      }


      const compId =
        cargo.comprobanteegreso_id ||
        null;


      const nroCompTxt =
        compId
          ? (
            compById[compId] ||
            compId
          )
          : null;


      let saldoCargo =
        Number(
          importeCargoOriginal ||
          0
        );


      /*
       * Mientras este cargo todavía tenga saldo
       * por cubrir, consumimos pagos.
       */
      while (
        saldoCargo >
        0.0001
      ) {

        /*
         * Avanzamos sobre pagos ya consumidos.
         */
        while (
          indicePago <
          pagosParaDistribuir.length &&
          pagosParaDistribuir[
            indicePago
          ].saldoDisponible <=
          0.0001
        ) {

          indicePago++;
        }


        if (
          indicePago >=
          pagosParaDistribuir.length
        ) {

          throw new Error(
            `No existen pagos suficientes para completar la aplicación al cargo #${cargoId}.`
          );
        }


        const pagoActual =
          pagosParaDistribuir[
          indicePago
          ];


        /*
         * La porción que aplicamos es el menor valor entre:
         *
         * - lo que falta cubrir del cargo;
         * - lo que todavía queda disponible del pago.
         */

        const importePorcion =
          Number(
            Math.min(
              saldoCargo,
              pagoActual.saldoDisponible
            ).toFixed(2)
          );


        if (
          !(importePorcion > 0)
        ) {

          throw new Error(
            "No se pudo determinar un importe válido para distribuir el pago."
          );
        }


        const descAbono =
          descripcionAbonoPorPago(
            pagoActual,
            nroCompTxt
          );


        /*
         * IMPORTANTE:
         *
         * Este ABONO referencia exactamente
         * al movimiento que financia ESTA porción.
         */

        const abono =
          await MovimientoCtaCteProveedor.create(
            {
              proveedor_id,

              empresa_id,

              fecha:
                fechaAbono,

              fecha_pago:
                fechaPagoAbono,

              descripcion:
                descAbono,

              tipo:
                "abono",

              importe:
                importePorcion,

              origen_tipo:
                "AplicacionCtaCte",

              origen_id:
                0,

              comprobanteegreso_id:
                compId,

              anulado:
                false,

              /*
               * Si se trata de pagos NUEVOS creados dentro
               * de este mismo flujo puede existir una OP común.
               *
               * Si son movimientos financieros EXISTENTES,
               * ordenPagoIdToUse permanece null.
               */
              ordenpago_id:
                ordenPagoIdToUse ||
                null,

              /*
               * TRAZABILIDAD INDIVIDUAL.
               */
              referencia_tipo:
                pagoActual.tipoMovimiento,

              referencia_id:
                pagoActual.movimiento_id,

              formapago_id:
                pagoActual.formapago_id ||
                null,
            },
            {
              transaction: t,
            }
          );


        /*
         * Creamos inmediatamente la aplicación
         * correspondiente a ESTA porción.
         */

        await MovCtaCteProvAplic.create(
          {
            empresa_id,

            proveedor_id,

            abono_id:
              abono.id,

            cargo_id:
              cargoId,

            importe:
              importePorcion,
          },
          {
            transaction: t,
          }
        );


        abonosCreados.push({
          id:
            abono.id,

          cargo_id:
            cargoId,

          comprobanteegreso_id:
            compId,

          importe:
            importePorcion,

          referencia_tipo:
            pagoActual.tipoMovimiento,

          referencia_id:
            pagoActual.movimiento_id,
        });


        /*
         * Reducimos ambos saldos.
         */

        saldoCargo =
          Number(
            (
              saldoCargo -
              importePorcion
            ).toFixed(2)
          );


        pagoActual.saldoDisponible =
          Number(
            (
              pagoActual.saldoDisponible -
              importePorcion
            ).toFixed(2)
          );
      }
    }

    // ============================================================
    // 9) SALDO A FAVOR
    // ============================================================
    //
    // REGLA:
    //
    // Si estamos utilizando un movimiento financiero EXISTENTE,
    // el importe total del movimiento debe quedar completamente
    // aplicado a los cargos seleccionados.
    //
    // NO generamos automáticamente un "Saldo a favor por abono
    // manual" con la diferencia.
    //
    // Para pagos NUEVOS conservamos el comportamiento anterior.
    // ============================================================

    if (
      totalPagos >
      totalAplicar + 0.0001
    ) {

      const exceso =
        Number(
          (
            totalPagos -
            totalAplicar
          ).toFixed(2)
        );


      if (
        todosSonMovimientosFinancierosExistentes
      ) {

        throw new Error(
          `El movimiento existente es de $${totalPagos.toFixed(2)}, pero sólo se aplicaron $${totalAplicar.toFixed(2)}. Debe aplicar el importe completo del movimiento.`
        );
      }


      /*
       * Para pagos NUEVOS mantenemos el comportamiento
       * actual de generar saldo a favor.
       */
      await MovimientoCtaCteProveedor.create(
        {
          proveedor_id,

          empresa_id,

          fecha:
            fechaAbono,

          fecha_pago:
            fechaPagoAbono,

          descripcion:
            "Saldo a favor por abono manual",

          tipo:
            "abono",

          importe:
            exceso,

          origen_tipo:
            "AplicacionCtaCte",

          origen_id:
            0,

          comprobanteegreso_id:
            compIdUnico,

          anulado:
            false,

          ordenpago_id:
            ordenPagoIdToUse ||
            null,

          referencia_tipo:
            refTipo,

          referencia_id:
            refId,

          formapago_id:
            resolvedFormaPagoId,
        },
        {
          transaction: t,
        }
      );
    }


    // ============================================================
    // 9.5) ACTUALIZAR OP DE MOVIMIENTOS FINANCIEROS EXISTENTES
    // ============================================================
    //
    // Cuando un movimiento existente de Caja/Banco/eCheq
    // se aplica a uno o varios comprobantes:
    //
    // 1 comprobante:
    //   estado = aplicada
    //   comprobanteegreso_id = ID del comprobante
    //
    // varios comprobantes:
    //   estado = aplicada
    //   comprobanteegreso_id = null
    //
    // Las observaciones originales se conservan y se agregan
    // los números de comprobantes relacionados.
    // ============================================================

    const ordenesPagoExistentesUsadas =
      [
        ...new Set(
          pagosInfo
            .filter(
              (pago) =>
                pago.ordenpago_id &&
                [
                  "MovimientoCajaTesoreria",
                  "MovimientoBancoTesoreria",
                  "EcheqEmitido",
                  "PagoTarjetaCredito",
                ].includes(
                  pago.tipoMovimiento
                )
            )
            .map(
              (pago) =>
                Number(
                  pago.ordenpago_id
                )
            )
            .filter(Boolean)
        ),
      ];


    for (
      const ordenPagoId
      of ordenesPagoExistentesUsadas
    ) {

      const ordenPago =
        await OrdenPago.findByPk(
          ordenPagoId,
          {
            transaction: t,
            lock: t.LOCK.UPDATE,
          }
        );


      if (!ordenPago) {
        continue;
      }


      /*
       * Buscamos únicamente los movimientos utilizados
       * en ESTA operación que pertenecen a esta OP.
       */
      const movimientosDeEstaOP =
        pagosInfo.filter(
          (pago) =>
            Number(
              pago.ordenpago_id
            ) ===
            Number(
              ordenPagoId
            )
        );


      /*
       * A partir de esos movimientos buscamos TODOS
       * sus ABONOS activos.
       *
       * De esta forma no dependemos solamente de los
       * comprobantes de la operación actual.
       */
      const comprobanteIdsSet =
        new Set();


      for (
        const pagoInfo
        of movimientosDeEstaOP
      ) {

        const abonosMovimiento =
          await MovimientoCtaCteProveedor.findAll(
            {
              where: {
                tipo:
                  "abono",

                anulado: {
                  [Op.not]:
                    true,
                },

                referencia_tipo:
                  pagoInfo.tipoMovimiento,

                referencia_id:
                  pagoInfo.movimiento_id,
              },

              attributes: [
                "comprobanteegreso_id",
              ],

              transaction: t,
            }
          );


        for (
          const abonoMovimiento
          of abonosMovimiento
        ) {

          if (
            abonoMovimiento.comprobanteegreso_id
          ) {

            comprobanteIdsSet.add(
              Number(
                abonoMovimiento.comprobanteegreso_id
              )
            );
          }
        }
      }


      const comprobanteIds =
        [
          ...comprobanteIdsSet,
        ];


      /*
       * Recuperamos los números de comprobante
       * para incorporarlos a observaciones.
       */
      let numerosComprobantes =
        [];


      if (
        comprobanteIds.length >
        0
      ) {

        const comprobantesOP =
          await ComprobanteEgreso.findAll(
            {
              where: {
                id: {
                  [Op.in]:
                    comprobanteIds,
                },
              },

              attributes: [
                "id",
                "nrocomprobante",
              ],

              transaction: t,
            }
          );


        numerosComprobantes =
          comprobantesOP.map(
            (comp) =>
              comp.nrocomprobante ||
              comp.id
          );
      }


      /*
       * Preservamos las observaciones originales.
       *
       * Si ya existía un agregado nuestro
       * " · Comp: ...", primero lo quitamos para
       * reconstruirlo y evitar duplicaciones.
       */
      const observacionesActuales =
        String(
          ordenPago.observaciones ||
          ""
        );


      const observacionesBase =
        observacionesActuales
          .replace(
            /\s*·\s*Comp:\s*.*$/i,
            ""
          )
          .trim();


      const textoComprobantes =
        numerosComprobantes.length
          ? `Comp: ${numerosComprobantes.join(", ")}`
          : "";


      const observacionesFinales =
        [
          observacionesBase,
          textoComprobantes,
        ]
          .filter(Boolean)
          .join(
            " · "
          ) ||
        null;


      /*
       * Una OP sólo puede guardar un comprobanteegreso_id
       * cuando existe exactamente un comprobante asociado.
       *
       * Con varios comprobantes permanece NULL.
       */
      const comprobanteegresoIdOP =
        comprobanteIds.length === 1
          ? comprobanteIds[0]
          : null;


      await ordenPago.update(
        {
          estado:
            comprobanteIds.length > 0
              ? "aplicada"
              : "pendiente_aplicacion",

          comprobanteegreso_id:
            comprobanteegresoIdOP,

          observaciones:
            observacionesFinales,
        },
        {
          transaction: t,
        }
      );
    }

    // ============ 10) Recalcular COMPROBANTES afectados ============

    const compIdsAfectados =
      [
        ...new Set(
          aplicaciones
            .map(
              (a) => {

                const cargo =
                  cargoById[
                  Number(
                    a.cargo_id
                  )
                  ];

                return Number(
                  cargo?.comprobanteegreso_id ||
                  0
                );
              }
            )
            .filter(Boolean)
        ),
      ];


    /*
     * IMPORTANTE:
     *
     * Nunca modificamos saldo/estado manualmente aquí.
     *
     * La aplicación puede provenir de:
     *
     * - Caja real
     * - Banco real
     * - eCheq
     * - Tarjeta
     * - Anticipo real
     * - PagoProgramadoTesoreria PENDIENTE
     *
     * Solamente recalcularComprobanteEgreso conoce
     * qué debe considerarse pago financiero real.
     */

    for (
      const compId
      of compIdsAfectados
    ) {

      await recalcularComprobanteEgreso(
        compId,
        t
      );
    }

    await t.commit();
    return res.status(201).json({
      ok: true,
      abonos: abonosCreados,              // <<<<< ahora devolvemos todos los abonos creados (uno por cargo)
      totalAplicado: totalAplicar,
      pagosCreados,
      ordenpago_id: ordenPagoIdToUse || null,
      comprobantesActualizados: compIdsAfectados || [],
    });

  } catch (err) {
    await t.rollback();
    return res.status(400).json({ error: err.message || "No se pudo aplicar el abono" });
  }
};


export const anularAplicacionAbonoCtaCteProveedor = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const {
      abono_id,
      empresa_id,
      proveedor_id,
      borrarFisicamente = false,
    } = req.body || {};

    if (!abono_id) {
      throw new Error("abono_id requerido");
    }

    // 1) Buscar el abono
    const abono = await MovimientoCtaCteProveedor.findByPk(abono_id, {
      transaction: t,
      lock: t.LOCK.UPDATE,
    });

    if (!abono) {
      throw new Error(`Abono #${abono_id} inexistente`);
    }
    if ((abono.tipo || "").toLowerCase() !== "abono") {
      throw new Error(`El movimiento #${abono_id} no es un abono`);
    }
    if (abono.anulado) {
      // Ya está anulado: devolvemos 200 idempotente
      return res.status(200).json({ ok: true, already: true, mensaje: "El abono ya estaba anulado." });
    }
    if (abono.origen_tipo !== "AplicacionCtaCte") {
      // Para evitar anular abonos de OP (OrdenPago) por este flujo
      throw new Error("Este abono no fue generado por AplicacionCtaCte");
    }

    if (empresa_id && Number(empresa_id) !== Number(abono.empresa_id)) {
      throw new Error("empresa_id no coincide con el abono");
    }
    if (proveedor_id && Number(proveedor_id) !== Number(abono.proveedor_id)) {
      throw new Error("proveedor_id no coincide con el abono");
    }

    // 2) Traer aplicaciones de ese abono (qué cargos afecta)
    const aplicaciones = await MovCtaCteProvAplic.findAll({
      where: { abono_id: abono.id },
      transaction: t,
      lock: t.LOCK.UPDATE,
    });

    const cargoIdsAfectados = [...new Set(aplicaciones.map(a => a.cargo_id))];

    // 3) Borrar aplicaciones (al borrarlas, el saldo de esos cargos vuelve a su estado previo)
    if (aplicaciones.length > 0) {
      await MovCtaCteProvAplic.destroy({
        where: { abono_id: abono.id },
        transaction: t,
      });
    }

    // 4) Anular (o borrar) el abono
    if (borrarFisicamente) {
      await abono.destroy({ transaction: t });
    } else {
      await abono.update({ anulado: true }, { transaction: t });
    }

    // 5) (Opcional) devolver cargos afectados con su saldo recalculado
    let cargosDetallados = [];
    if (cargoIdsAfectados.length > 0) {
      const cargos = await MovimientoCtaCteProveedor.findAll({
        where: { id: { [Op.in]: cargoIdsAfectados } },
        transaction: t,
      });

      // Recalcular aplicado por cargo (luego del borrado)
      const aplicacionesRestantes = await MovCtaCteProvAplic.findAll({
        where: { cargo_id: { [Op.in]: cargoIdsAfectados } },
        transaction: t,
      });
      const aplicadoPorCargo = {};
      for (const a of aplicacionesRestantes) {
        aplicadoPorCargo[a.cargo_id] = (aplicadoPorCargo[a.cargo_id] || 0) + Number(a.importe || 0);
      }

      // Si querés enriquecer con nro de comprobante:
      const compIds = [...new Set(cargos.map(c => c.comprobanteegreso_id).filter(Boolean))];
      const comps = compIds.length
        ? await ComprobanteEgreso.findAll({
          attributes: ["id", "nrocomprobante"],
          where: { id: { [Op.in]: compIds } },
          transaction: t,
        })
        : [];
      const compById = Object.fromEntries(comps.map(c => [c.id, c.nrocomprobante || c.id]));

      cargosDetallados = cargos.map(c => {
        const aplicado = aplicadoPorCargo[c.id] || 0;
        const saldo = Number(c.importe || 0) - aplicado;
        return {
          id: c.id,
          fecha: c.fecha,
          descripcion: c.descripcion,
          importe: Number(c.importe || 0),
          aplicado,
          saldo,
          comprobanteegreso_id: c.comprobanteegreso_id || null,
          comprobante_nro: c.comprobanteegreso_id ? (compById[c.comprobanteegreso_id] || null) : null,
          origen_tipo: c.origen_tipo,
          origen_id: c.origen_id,
        };
      });
    }

    await t.commit();
    return res.status(200).json({
      ok: true,
      abono_anulado: abono_id,
      borrarFisicamente,
      cargos_afectados: cargosDetallados,
    });
  } catch (err) {
    await t.rollback();
    return res.status(400).json({ error: err.message || "No se pudo anular el abono" });
  }
};

// POST /movimientos-cta-cte-proveedor/aplicar-anticipo
// body: {
//   empresa_id: number,
//   proveedor_id: number,
//   abono_id: number,                      // anticipo ya existente (tipo 'abono')
//   aplicaciones: [{ cargo_id, importe }], // si omitís 'importe', aplicamos automático (min(saldoCargo, saldoAnticipo))
//   incluirNumerosComp?: boolean           // default true (para descripción si luego querés loguear algo)
// }
export const aplicarAnticipoExistenteCtaCte = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const {
      empresa_id,
      proveedor_id,
      abono_id,
      aplicaciones = [],
      incluirNumerosComp = true,
    } = req.body || {};

    if (!empresa_id) throw new Error("empresa_id requerido");
    if (!proveedor_id) throw new Error("proveedor_id requerido");
    if (!abono_id) throw new Error("abono_id requerido");
    if (!Array.isArray(aplicaciones) || aplicaciones.length === 0)
      throw new Error("Debe enviar aplicaciones [{ cargo_id, importe? }]");

    const EPS = 0.0001;
    const toMoney = (x) => Math.round((Number(x) || 0) * 100) / 100;

    // 1) Traer el ABONO (anticipo) y validar
    const abono = await MovimientoCtaCteProveedor.findByPk(abono_id, {
      transaction: t,
      lock: t.LOCK.UPDATE,
    });
    if (!abono) throw new Error(`Abono #${abono_id} inexistente`);
    if ((abono.tipo || "").toLowerCase() !== "abono") {
      throw new Error("El movimiento indicado no es un abono");
    }
    if (abono.anulado) throw new Error("El abono está anulado");
    if (
      Number(abono.empresa_id) !== Number(empresa_id) ||
      Number(abono.proveedor_id) !== Number(proveedor_id)
    ) {
      throw new Error("El abono no pertenece a la empresa/proveedor indicado");
    }

    // 2) Saldo disponible del abono
    const prevAplic = await MovCtaCteProvAplic.findAll({
      where: { abono_id: abono.id },
      transaction: t,
    });
    const yaAplicado = prevAplic.reduce((a, r) => a + toMoney(r.importe), 0);
    const abonoImporte = toMoney(abono.importe || 0);
    let saldoAnticipo = toMoney(abonoImporte - yaAplicado);

    if (saldoAnticipo <= EPS) {
      await t.commit();
      return res.status(200).json({
        ok: true,
        mensaje: "El anticipo no tiene saldo disponible.",
        abono_id,
        saldoAnticipo: toMoney(saldoAnticipo),
        aplicacionesRealizadas: [],
      });
    }

    // 3) Traer CARGOS y validar
    const cargoIds = [...new Set(aplicaciones.map(a => Number(a.cargo_id)).filter(Boolean))];
    if (cargoIds.length === 0) throw new Error("No se recibieron cargos válidos");

    const cargos = await MovimientoCtaCteProveedor.findAll({
      where: {
        id: { [Op.in]: cargoIds },
        empresa_id,
        proveedor_id,
        tipo: "cargo",
        anulado: { [Op.not]: true },
      },
      transaction: t,
      lock: t.LOCK.UPDATE,
    });
    if (cargos.length !== cargoIds.length) {
      throw new Error("Alguno de los cargos no existe o no pertenece al proveedor/empresa.");
    }

    // aplicado existente por cargo
    const aplicRestantes = await MovCtaCteProvAplic.findAll({
      where: { cargo_id: { [Op.in]: cargoIds } },
      transaction: t,
    });
    const aplicadoPorCargo = {};
    for (const a of aplicRestantes) {
      aplicadoPorCargo[a.cargo_id] =
        toMoney((aplicadoPorCargo[a.cargo_id] || 0) + toMoney(a.importe));
    }

    const cargoById = Object.fromEntries(cargos.map(c => [c.id, c]));
    const aplicacionesHechas = [];
    let totalAplicadoAhora = 0;

    // 4) Aplicar anticipo respetando saldo
    for (const reqApp of aplicaciones) {
      if (saldoAnticipo <= EPS) break;
      const cargoId = Number(reqApp.cargo_id);
      const cargo = cargoById[cargoId];
      if (!cargo) throw new Error(`Cargo #${cargoId} inválido`);

      const importeCargo = toMoney(cargo.importe || 0);
      const yaAp = aplicadoPorCargo[cargoId] || 0;
      const saldoCargo = toMoney(importeCargo - yaAp);
      if (saldoCargo <= EPS) continue;

      const pedido = reqApp.importe != null ? toMoney(reqApp.importe) : Math.min(saldoCargo, saldoAnticipo);
      if (pedido <= EPS) continue;
      if (pedido - saldoCargo > EPS) throw new Error(`La aplicación al cargo #${cargoId} excede su saldo`);

      const aplicar = Math.min(pedido, saldoCargo, saldoAnticipo);
      if (aplicar <= EPS) continue;

      await MovCtaCteProvAplic.create({
        empresa_id,
        proveedor_id,
        abono_id: abono.id,
        cargo_id: cargoId,
        importe: aplicar,
      }, { transaction: t });

      aplicacionesHechas.push({ cargo_id: cargoId, aplicado: aplicar });
      totalAplicadoAhora = toMoney(totalAplicadoAhora + aplicar);
      saldoAnticipo = toMoney(saldoAnticipo - aplicar);
      aplicadoPorCargo[cargoId] =
        toMoney((aplicadoPorCargo[cargoId] || 0) + aplicar);
    }

    if (aplicacionesHechas.length === 0) {
      await t.commit();
      return res.status(200).json({
        ok: true,
        mensaje: "No se realizaron aplicaciones (posible saldo anticipo insuficiente, cargos sin saldo, o importes 0).",
        abono_id,
        saldoAnticipo: toMoney(saldoAnticipo),
        aplicacionesRealizadas: [],
      });
    }

    // 5) Actualizar comprobantes afectados (saldo/estado)
    const aplicadoPorComprobante = {};
    for (const { cargo_id, aplicado } of aplicacionesHechas) {
      const compId = cargoById[cargo_id]?.comprobanteegreso_id;
      if (!compId) continue;
      aplicadoPorComprobante[compId] =
        toMoney((aplicadoPorComprobante[compId] || 0) + aplicado);
    }

    const compIdsAfectados = Object.keys(aplicadoPorComprobante).map(Number);

    // Vincular el ABONO al comprobante si quedó uno solo afectado
    if (compIdsAfectados.length === 1) {
      await abono.update(
        { comprobanteegreso_id: compIdsAfectados[0] },
        { transaction: t }
      );
    }

    if (compIdsAfectados.length > 0) {
      const comps = await ComprobanteEgreso.findAll({
        where: { id: { [Op.in]: compIdsAfectados }, proveedor_id, empresa_id },
        transaction: t,
        lock: t.LOCK.UPDATE,
      });

      for (const comp of comps) {
        const aplicado = aplicadoPorComprobante[comp.id] || 0;
        const saldoActual = toMoney(comp.saldo || 0);
        const totalComp = toMoney(comp.total || 0);

        let nuevoSaldo = toMoney(saldoActual - aplicado);
        if (Math.abs(nuevoSaldo) < EPS) nuevoSaldo = 0;
        nuevoSaldo = Math.max(0, nuevoSaldo);

        let nuevoEstado = "impaga";
        if (nuevoSaldo === 0) nuevoEstado = "pagada";
        else if (nuevoSaldo < totalComp - EPS) nuevoEstado = "parcial";

        const patch = { saldo: nuevoSaldo };
        if ("estadopago" in comp.dataValues) patch.estadopago = nuevoEstado;
        if ("estado" in comp.dataValues) patch.estado = nuevoEstado;

        await comp.update(patch, { transaction: t });
      }
    }

    // 5.5) Vincular OP y MOVIMIENTOS (Caja/Banco/Tarjeta/eCheq) + marcar OP aplicada
    const opId = abono.ordenpago_id ? Number(abono.ordenpago_id) : null;
    const patchMov = { proveedor_id: proveedor_id };
    if (compIdsAfectados.length === 1) {
      patchMov.comprobanteegreso_id = compIdsAfectados[0];
    }

    if (opId) {
      // OP => aplicada; si quedó un solo comp, setearlo en OP
      const patchOP = { estado: "aplicada" };
      if (compIdsAfectados.length === 1) {
        patchOP.comprobanteegreso_id = compIdsAfectados[0];
      }
      await OrdenPago.update(patchOP, { where: { id: opId }, transaction: t });

      // Movimientos asociados a esa OP (Caja, Banco, Tarjeta)
      await MovimientoCajaTesoreria.update(
        patchMov,
        { where: { ordenpago_id: opId }, transaction: t }
      );
      await MovimientoBancoTesoreria.update(
        patchMov,
        { where: { ordenpago_id: opId }, transaction: t }
      );
      await PagoTarjetaCredito.update(
        patchMov,
        { where: { ordenpago_id: opId }, transaction: t }
      );

      // ✅ eCheq emitidos asociados a la OP
      await EcheqEmitido.update(
        patchMov,
        { where: { ordenpago_id: opId }, transaction: t }
      );
    }

    // 5.6) Si el ABONO apunta DIRECTAMENTE a una forma de pago única, reflejar vínculo
    if (
      compIdsAfectados.length === 1 &&
      abono.referencia_tipo &&
      abono.referencia_id
    ) {
      const compIdUnico = compIdsAfectados[0];
      const refTipo = String(abono.referencia_tipo || "").toLowerCase();

      if (refTipo === "pagotarjetacredito") {
        await PagoTarjetaCredito.update(
          { proveedor_id, comprobanteegreso_id: compIdUnico },
          { where: { id: abono.referencia_id }, transaction: t }
        );
      } else if (refTipo === "movimientocajatesoreria") {
        await MovimientoCajaTesoreria.update(
          { proveedor_id, comprobanteegreso_id: compIdUnico },
          { where: { id: abono.referencia_id }, transaction: t }
        );
      } else if (refTipo === "movimientobancotesoreria") {
        await MovimientoBancoTesoreria.update(
          { proveedor_id, comprobanteegreso_id: compIdUnico },
          { where: { id: abono.referencia_id }, transaction: t }
        );
      } else if (refTipo === "echeqemitido") {

        // vínculo directo con eCheq puntual
        await EcheqEmitido.update(
          {
            proveedor_id,
            comprobanteegreso_id: compIdUnico,
          },
          {
            where: {
              id: abono.referencia_id,
            },
            transaction: t,
          }
        );

      } else if (refTipo === "pagoprogramadotesoreria") {

        // ========================================================
        // ANTICIPO PROGRAMADO
        //
        // El ABONO fue creado por PagoProgramadoTesoreria.
        // Al aplicarlo a un único comprobante debemos reflejar
        // también ese vínculo en el pago programado.
        //
        // IMPORTANTE:
        // esto NO acredita el pago.
        // Sólo indica que el compromiso futuro ya pertenece
        // a este ComprobanteEgreso.
        // ========================================================

        const pagoProgramado =
          await PagoProgramadoTesoreria.findByPk(
            abono.referencia_id,
            {
              transaction: t,
              lock: t.LOCK.UPDATE,
            }
          );


        if (!pagoProgramado) {
          throw new Error(
            `PagoProgramadoTesoreria #${abono.referencia_id} no encontrado`
          );
        }


        if (
          Number(pagoProgramado.empresa_id) !==
          Number(empresa_id) ||
          Number(pagoProgramado.proveedor_id) !==
          Number(proveedor_id)
        ) {
          throw new Error(
            "El pago programado no pertenece a la empresa/proveedor indicado"
          );
        }


        if (
          String(pagoProgramado.tipo || "")
            .trim()
            .toLowerCase() !== "anticipo"
        ) {
          throw new Error(
            "El PagoProgramadoTesoreria asociado no corresponde a un anticipo"
          );
        }


        await pagoProgramado.update(
          {
            comprobanteegreso_id:
              compIdUnico,
          },
          {
            transaction: t,
          }
        );
      }
    }

    await t.commit();
    return res.status(201).json({
      ok: true,
      mensaje: "Anticipo aplicado correctamente.",
      abono_id,
      totalAplicado: totalAplicadoAhora,
      saldoAnticipo: toMoney(saldoAnticipo),
      aplicacionesRealizadas: aplicacionesHechas,
      comprobantesActualizados: compIdsAfectados,
      ordenpago_actualizada: abono.ordenpago_id || null,
      vinculo_movimientos:
        abono.ordenpago_id
          ? (compIdsAfectados.length === 1 ? "proveedor + 1 comprobante" : "solo proveedor")
          : (abono.referencia_tipo ? `vínculo directo a ${abono.referencia_tipo}` : "sin OP"),
    });

  } catch (err) {
    await t.rollback();
    return res.status(400).json({ error: err.message || "No se pudo aplicar el anticipo" });
  }
};



export const anularAplicacionAnticipoExistenteCtaCte = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const {
      empresa_id,
      proveedor_id,
      abono_id,
      cargo_ids, // opcional
    } = req.body || {};

    if (!empresa_id) throw new Error("empresa_id requerido");
    if (!proveedor_id) throw new Error("proveedor_id requerido");
    if (!abono_id) throw new Error("abono_id requerido");

    const EPS = 0.0001;
    const toMoney = (x) => Math.round((Number(x) || 0) * 100) / 100;

    // 1) Traer y validar ABONO
    const abono = await MovimientoCtaCteProveedor.findByPk(abono_id, {
      transaction: t,
      lock: t.LOCK.UPDATE,
    });
    if (!abono) throw new Error(`Abono #${abono_id} inexistente`);
    if ((abono.tipo || "").toLowerCase() !== "abono") {
      throw new Error("El movimiento indicado no es un abono");
    }
    if (abono.anulado) throw new Error("El abono está anulado");
    if (Number(abono.empresa_id) !== Number(empresa_id) ||
      Number(abono.proveedor_id) !== Number(proveedor_id)) {
      throw new Error("El abono no pertenece a la empresa/proveedor indicado");
    }

    // 2) Buscar aplicaciones del abono (filtradas por cargo_ids si vino)
    const whereApps = { abono_id: abono.id };
    if (Array.isArray(cargo_ids) && cargo_ids.length > 0) {
      whereApps.cargo_id = { [Op.in]: cargo_ids.map(Number) };
    }

    const apps = await MovCtaCteProvAplic.findAll({ where: whereApps, transaction: t, lock: t.LOCK.UPDATE });
    if (apps.length === 0) {
      await t.commit();
      return res.status(200).json({
        ok: true,
        mensaje: "No hay aplicaciones para anular con los filtros indicados.",
        abono_id,
        aplicacionesRevertidas: [],
      });
    }

    // 3) Agrupar importe a revertir por cargo
    const revertirPorCargo = {};
    for (const a of apps) {
      revertirPorCargo[a.cargo_id] = toMoney((revertirPorCargo[a.cargo_id] || 0) + toMoney(a.importe));
    }
    const cargoIds = Object.keys(revertirPorCargo).map(Number);

    // 4) Traer cargos para conocer comprobante_id y totales
    const cargos = await MovimientoCtaCteProveedor.findAll({
      where: {
        id: { [Op.in]: cargoIds },
        empresa_id,
        proveedor_id,
        tipo: "cargo",
        anulado: { [Op.not]: true },
      },
      transaction: t,
      lock: t.LOCK.UPDATE,
    });
    const cargoById = Object.fromEntries(cargos.map(c => [c.id, c]));

    // 5) Borrar aplicaciones seleccionadas
    await MovCtaCteProvAplic.destroy({ where: whereApps, transaction: t });

    // 6) Actualizar COMPROBANTES afectados (sumar lo revertido al saldo)
    const revertidoPorComp = {};
    for (const cargoId of cargoIds) {
      const cargo = cargoById[cargoId];
      if (!cargo) continue;
      const compId = cargo.comprobanteegreso_id;
      if (!compId) continue;
      revertidoPorComp[compId] = toMoney((revertidoPorComp[compId] || 0) + revertirPorCargo[cargoId]);
    }

    const compIds = Object.keys(revertidoPorComp).map(Number);
    if (compIds.length > 0) {
      const comps = await ComprobanteEgreso.findAll({
        where: { id: { [Op.in]: compIds }, proveedor_id, empresa_id },
        transaction: t,
        lock: t.LOCK.UPDATE,
      });

      for (const comp of comps) {
        const devuelto = toMoney(revertidoPorComp[comp.id] || 0);
        const saldoActual = toMoney(comp.saldo || 0);
        const totalComp = toMoney(comp.total || 0);

        // Sumar lo revertido al saldo del comprobante, cap a total
        let nuevoSaldo = toMoney(saldoActual + devuelto);
        if (nuevoSaldo > totalComp) nuevoSaldo = totalComp;
        if (Math.abs(nuevoSaldo) < EPS) nuevoSaldo = 0;

        let nuevoEstado = "impaga";
        if (nuevoSaldo === 0) nuevoEstado = "pagada";
        else if (nuevoSaldo < totalComp - EPS) nuevoEstado = "parcial";

        const patch = { saldo: nuevoSaldo };
        if ("estadopago" in comp.dataValues) patch.estadopago = nuevoEstado;
        if ("estado" in comp.dataValues) patch.estado = nuevoEstado;

        await comp.update(patch, { transaction: t });
      }
    }

    // ============================================================
    // 6.5) SI EL ABONO PROVIENE DE UN PAGO PROGRAMADO,
    //      REVISAR SI DEBE DESVINCULARSE DEL COMPROBANTE
    // ============================================================

    const refTipoAbono =
      String(
        abono.referencia_tipo || ""
      )
        .trim()
        .toLowerCase();


    if (
      refTipoAbono === "pagoprogramadotesoreria" &&
      abono.referencia_id
    ) {

      /*
       * Después de eliminar las aplicaciones seleccionadas,
       * comprobamos qué aplicaciones conserva este ABONO.
       */

      const aplicacionesRestantes =
        await MovCtaCteProvAplic.findAll({
          where: {
            abono_id: abono.id,
          },

          transaction: t,
        });


      const cargosRestantesIds = [
        ...new Set(
          aplicacionesRestantes
            .map(a => Number(a.cargo_id))
            .filter(Boolean)
        ),
      ];


      let comprobantesRestantes =
        [];


      if (cargosRestantesIds.length) {

        const cargosRestantes =
          await MovimientoCtaCteProveedor.findAll({
            where: {
              id: {
                [Op.in]:
                  cargosRestantesIds,
              },
            },

            attributes: [
              "id",
              "comprobanteegreso_id",
            ],

            transaction: t,
          });


        comprobantesRestantes = [
          ...new Set(
            cargosRestantes
              .map(
                c =>
                  Number(
                    c.comprobanteegreso_id ||
                    0
                  )
              )
              .filter(Boolean)
          ),
        ];
      }


      /*
       * Regla:
       *
       * 0 comprobantes:
       *   el anticipo vuelve a quedar libre.
       *
       * 1 comprobante:
       *   continúa vinculado a ese comprobante.
       *
       * >1:
       *   no podemos representar un único comprobante_id,
       *   por lo tanto dejamos NULL.
       */

      const nuevoComprobanteId =
        comprobantesRestantes.length === 1
          ? comprobantesRestantes[0]
          : null;


      await abono.update(
        {
          comprobanteegreso_id:
            nuevoComprobanteId,
        },

        {
          transaction: t,
        }
      );


      await PagoProgramadoTesoreria.update(
        {
          comprobanteegreso_id:
            nuevoComprobanteId,
        },

        {
          where: {
            id:
              abono.referencia_id,
          },

          transaction: t,
        }
      );
    }

    // 7) Recalcular saldo disponible del ABONO (no se toca el abono; solo se “libera” su cupo)
    const remApps = await MovCtaCteProvAplic.findAll({
      where: { abono_id: abono.id },
      transaction: t,
    });
    const aplicadoRestante = remApps.reduce((a, r) => a + toMoney(r.importe), 0);
    const saldoAnticipo = toMoney(toMoney(abono.importe || 0) - aplicadoRestante);

    await t.commit();
    return res.status(200).json({
      ok: true,
      mensaje: "Aplicaciones del anticipo anuladas correctamente.",
      abono_id,
      aplicacionesRevertidas: apps.map(a => ({ cargo_id: a.cargo_id, importe: toMoney(a.importe) })),
      saldoAnticipo,
      comprobantesActualizados: compIds,
    });

  } catch (err) {
    await t.rollback();
    return res.status(400).json({ error: err.message || "No se pudo anular la aplicación del anticipo" });
  }
};

export const listarAbonosDisponibles = async (req, res) => {
  try {
    const { empresa_id, proveedor_id, desde, hasta } = req.query || {};
    console.log("▶ [abonos-disponibles] query raw:", req.query);

    // Validaciones mínimas
    if (!empresa_id || !proveedor_id) {
      console.log("✋ Faltan empresa_id/proveedor_id", { empresa_id, proveedor_id });
      return res.status(400).json({ error: "empresa_id y proveedor_id requeridos" });
    }

    const whereAbonos = {
      empresa_id: Number(empresa_id),
      proveedor_id: Number(proveedor_id),
      tipo: "abono",
      anulado: { [Op.not]: true },
    };
    if (desde || hasta) {
      whereAbonos.fecha = {};
      if (desde) whereAbonos.fecha[Op.gte] = desde;
      if (hasta) whereAbonos.fecha[Op.lte] = hasta;
    }

    console.log("▶ [abonos-disponibles] whereAbonos:", JSON.stringify(whereAbonos));

    const abonos = await MovimientoCtaCteProveedor.findAll({
      where: whereAbonos,
      attributes: ["id", "fecha", "descripcion", "importe"],
      order: [["fecha", "ASC"], ["id", "ASC"]],
      logging: (sql) => console.log("SQL abonosDisponibles:\n", sql),
    });

    console.log("▶ [abonos-disponibles] abonos count:", abonos.length);
    if (abonos.length) {
      console.log("▶ [abonos-disponibles] sample[0]:", abonos[0]?.get?.({ plain: true }));
    }

    if (abonos.length === 0) {
      return res.json({ rows: [], total: 0 });
    }

    const abonoIds = abonos.map(a => a.id);

    // Suma de aplicaciones por abono
    const apps = await MovCtaCteProvAplic.findAll({
      attributes: ["abono_id", [fn("SUM", col("importe")), "aplicado"]],
      where: { abono_id: { [Op.in]: abonoIds } },
      group: ["abono_id"],
      logging: (sql) => console.log("SQL appsPorAbono:\n", sql),
    });

    const aplicadoPorAbono = {};
    for (const a of apps) {
      const abId = a.get("abono_id");
      const aplicado = Number(a.get("aplicado") || 0);
      aplicadoPorAbono[abId] = aplicado;
    }
    console.log("▶ [abonos-disponibles] aplicadoPorAbono keys:", Object.keys(aplicadoPorAbono).length);

    const rows = abonos.map(a => {
      const plain = a.get({ plain: true });
      const aplicado = Number(aplicadoPorAbono[plain.id] || 0);
      const importe = Number(plain.importe || 0);
      const saldo = Math.round((importe - aplicado) * 100) / 100;
      return {
        id: plain.id,
        fecha: plain.fecha,
        descripcion: plain.descripcion,
        importe,
        aplicado,
        saldo,
      };
    }).filter(r => r.saldo > 0);

    console.log("▶ [abonos-disponibles] rows con saldo > 0:", rows.length);
    if (rows.length) console.log("▶ [abonos-disponibles] first row:", rows[0]);

    return res.json({ rows, total: rows.length });
  } catch (err) {
    console.error("❌ [abonos-disponibles] ERROR:", err);
    return res.status(500).json({ error: err.message || "Error listando anticipos disponibles" });
  }
};