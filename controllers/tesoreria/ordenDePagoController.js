import { Op } from "sequelize";
import { sequelize } from "../../config/database.js";
import OrdenPago from "../../models/tesoreria/ordendepago.js";
import MovimientoCajaTesoreria from "../../models/tesoreria/movimientocajatesoreria.js";
import MovimientoBancoTesoreria from "../../models/tesoreria/movimientobancotesoreria.js";
import EcheqEmitido from "../../models/tesoreria/pagoecheq.js";
import PagoTarjetaCredito from "../../models/tesoreria/pagotarjetacredito.js";
import MovimientoCtaCteProveedor from "../../models/tesoreria/movimientoctacteproveedor.js";
import ComprobanteEgreso from "../../models/iva/comprobanteegreso.js";
import CategoriaEgreso from "../../models/tesoreria/categoriaEgreso.js"; // <- ajustá la ruta si difiere


export const registrarAnticipoProveedor = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { empresa_id, proveedor_id, pagos = [], fecha, observaciones, idempotencyKey } = req.body;

    if (!empresa_id) throw new Error("empresa_id requerido");
    if (!proveedor_id) throw new Error("proveedor_id requerido para anticipo");
    if (!Array.isArray(pagos) || pagos.length === 0) throw new Error("Debe enviar al menos un pago");

    const EPS = 0.009;
    const normaliza = (n) => Number(n) || 0;
    const medioDe = (p) => String(p.medio || p.medio_label || "").toLowerCase(); // por si viene distinto

    // Función para detectar medio a partir de formapago_id si no viene "medio"
    const inferirMedio = (p) => {
      if (p.medio) return medioDe(p);
      const desc = String(p.formapago_desc || p.formapago || "").toLowerCase();
      if (/caja|efectivo/.test(desc)) return "caja";
      if (/transfer|bancaria|cbu|alias/.test(desc)) return "transferencia";
      if (/e-?\s*cheq|echeq/.test(desc)) return "echeq";
      if (/tarjeta|cr[eé]dito|d[eé]bito/.test(desc)) return "tarjeta";
      return "";
    };

    const fechaOP = fecha || new Date().toISOString().slice(0, 10);

    // total desembolsado (efectivo hoy)
    const esEfectivoAhora = (m) => ["caja", "transferencia", "echeq", "tarjeta"].includes(m);
    const sumaPagosEfectivos = pagos.reduce((acc, p) => {
      const m = inferirMedio(p);
      return esEfectivoAhora(m) ? acc + normaliza(p.monto) : acc;
    }, 0);

    if (sumaPagosEfectivos <= 0) throw new Error("Importe total del anticipo inválido");

    // Idempotencia: si ya existe devolvémoslo
    if (idempotencyKey) {
      const ya = await OrdenPago.findOne({ where: { idempotency_key: idempotencyKey }, transaction: t });
      if (ya) { await t.commit(); return res.status(200).json({ ok: true, reutilizado: true, ordenpago: ya }); }
    }

    // 1) Orden de pago independiente (por asignar)
    const orden = await OrdenPago.create({
      empresa_id,
      proveedor_id,
      comprobanteegreso_id: null,
      fecha: fechaOP,
      total: sumaPagosEfectivos,
      estado: "pendiente_aplicacion",   // 👈 CLAVE
      numero: null,
      observaciones: observaciones || null,
      origen: "anticipo",
      idempotency_key: idempotencyKey || null,
    }, { transaction: t });

    // 2) Registrar desembolsos por medio
    for (const p of pagos) {
      const monto = normaliza(p.monto);
      if (monto <= 0) throw new Error("Monto de pago inválido");
      const fechaPago = p.fecha || fechaOP;
      const medio = inferirMedio(p);

      if (medio === "caja") {
        if (!p.caja_id) throw new Error("caja_id requerido para pago en caja");
        // opcional: derivar imputación desde la categoría
        let imputacion = p.imputacioncontable_id || null;
        if (!imputacion && p.categoriaegreso_id) {
          const cat = await CategoriaEgreso.findByPk(p.categoriaegreso_id, { transaction: t });
          if (cat?.imputacioncontable_id) imputacion = cat.imputacioncontable_id;
        }

        await MovimientoCajaTesoreria.create({
          empresa_id, tipo: "egreso",
          descripcion: p.detalle || `Anticipo a proveedor #${proveedor_id}`,
          monto, fecha: fechaPago, caja_id: p.caja_id,
          formapago_id: p.formapago_id || null,
          referencia_id: orden.id, referencia_tipo: "OrdenPago",
          observaciones: p.observaciones || null,
          anulado: false, ordenpago_id: orden.id,
          categoriaegreso_id: p.categoriaegreso_id || null,
          imputacioncontable_id: imputacion || null,
          idempotency_key: p.idempotency_key || null,
        }, { transaction: t });
        continue;
      }

      if (medio === "transferencia") {
        if (!p.banco_id) throw new Error("banco_id requerido para transferencia");
        await MovimientoBancoTesoreria.create({
          tipo: "egreso",
          descripcion: p.detalle || `Anticipo a proveedor #${proveedor_id} por transferencia`,
          monto, fecha: fechaPago, banco_id: p.banco_id, empresa_id,
          formapago_id: p.formapago_id || null,
          referencia_id: orden.id, referencia_tipo: "OrdenPago",
          observaciones: p.observaciones || null,
          ordenpago_id: orden.id,
        }, { transaction: t });
        continue;
      }

      if (medio === "echeq") {
        if (!p.banco_id) throw new Error("banco_id requerido para eCheq");
        if (!p.fecha_vencimiento) throw new Error("fecha_vencimiento requerido para eCheq");
        await EcheqEmitido.create({
          comprobanteegreso_id: null, proveedor_id, empresa_id,
          numero_echeq: p.numero_echeq || null, banco_id: p.banco_id,
          fecha_emision: fechaPago, fecha_vencimiento: p.fecha_vencimiento,
          importe: monto, estado: "emitido", ordenpago_id: orden.id,
        }, { transaction: t });
        continue;
      }

      if (medio === "tarjeta") {
        if (!p.tipotarjeta_id) throw new Error("tipotarjeta_id requerido");
        if (!p.marcatarjeta_id) throw new Error("marcatarjeta_id requerido");
        await PagoTarjetaCredito.create({
          fecha: fechaPago, importe: monto,
          comprobanteegreso_id: null, empresa_id, proveedor_id,
          tipotarjeta_id: p.tipotarjeta_id, marcatarjeta_id: p.marcatarjeta_id,
          cupon_numero: p.cupon_numero || null, planpago_id: p.planpago_id || null,
          concepto: p.detalle || `Anticipo a proveedor #${proveedor_id} con tarjeta`,
          observaciones: p.observaciones || null, estado: "pendiente", ordenpago_id: orden.id,
        }, { transaction: t });
        continue;
      }

      throw new Error(`Medio de pago no soportado para anticipo`);
    }

    // 3) Cta Cte Proveedor: registrar un "pago" (anticipo)
    await MovimientoCtaCteProveedor.create({
      proveedor_id, empresa_id,
      fecha: fechaOP,
      descripcion: `Anticipo proveedor - OP #${orden.id}`,
      tipo: "pago",                 // 👈 disminuye deuda / genera saldo a favor
      importe: sumaPagosEfectivos,
      origen_tipo: "OrdenPago",
      origen_id: orden.id,
      comprobanteegreso_id: null,
      anulado: false,
      ordenpago_id: orden.id,
    }, { transaction: t });

    await t.commit();
    return res.status(201).json({ ok: true, ordenpago: orden });
  } catch (error) {
    await t.rollback();
    console.error("❌ registrarAnticipoProveedor:", error);
    return res.status(400).json({ error: error.message || "No se pudo registrar el anticipo" });
  }
};

/**
 * POST /ordenes-pago
 */
export const crearOrdenPago = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const {
      empresa_id,
      comprobanteegreso_id,
      proveedor_id = null,
      fecha = null,
      total = null,
      estado = "emitida",
      numero = null,
      observaciones = null,
    } = req.body || {};

    if (!empresa_id) throw new Error("empresa_id es requerido");
    // if (!comprobanteegreso_id) throw new Error("comprobanteegreso_id es requerido");
    if (total == null) throw new Error("total es requerido");
    if (Number(total) < 0) throw new Error("total no puede ser negativo");

    const hoy = new Date().toISOString().slice(0, 10);

    const orden = await OrdenPago.create(
      {
        empresa_id,
        comprobanteegreso_id,
        proveedor_id,
        fecha: fecha || hoy,
        total: Number(total),
        estado: estado || "emitida",
        numero,
        observaciones,
      },
      { transaction: t }
    );

    await t.commit();
    return res.status(201).json({ ok: true, orden });
  } catch (error) {
    await t.rollback();
    console.error("❌ crearOrdenPago:", error);
    return res.status(400).json({ error: error.message || "No se pudo crear la orden de pago" });
  }
};

/**
 * GET /ordenes-pago
 * Soporta filtros por:
 *  - empresa_id
 *  - proveedor_id
 *  - comprobanteegreso_id
 *  - estado
 *  - fecha_desde / fecha_hasta (YYYY-MM-DD)
 *  - numero (búsqueda parcial)
 */
export const listarOrdenesPago = async (req, res) => {
  try {
    const {
      empresa_id,
      proveedor_id,
      comprobanteegreso_id,
      estado,
      fecha_desde,
      fecha_hasta,
      numero,
    } = req.query || {};

    const where = {};

    if (empresa_id) where.empresa_id = Number(empresa_id);
    if (proveedor_id) where.proveedor_id = Number(proveedor_id);
    if (comprobanteegreso_id) where.comprobanteegreso_id = Number(comprobanteegreso_id);
    if (estado) where.estado = estado;

    // Rango de fechas
    if (fecha_desde || fecha_hasta) {
      where.fecha = {};
      if (fecha_desde) where.fecha[Op.gte] = fecha_desde;
      if (fecha_hasta) where.fecha[Op.lte] = fecha_hasta;
    }

    // Búsqueda por número
    if (numero && String(numero).trim() !== "") {
      where.numero = { [Op.like]: `%${String(numero).trim()}%` };
    }

    const ordenes = await OrdenPago.findAll({
      where,
      order: [["id", "DESC"]],
    });

    return res.json(ordenes);
  } catch (error) {
    console.error("❌ listarOrdenesPago:", error);
    return res.status(400).json({ error: error.message || "No se pudieron listar las órdenes de pago" });
  }
};

/**
 * GET /ordenes-pago/:id
 */
export const obtenerOrdenPagoPorId = async (req, res) => {
  try {
    const { id } = req.params;
    const orden = await OrdenPago.findByPk(id);
    if (!orden) return res.status(404).json({ error: "Orden de pago no encontrada" });
    return res.json(orden);
  } catch (error) {
    console.error("❌ obtenerOrdenPagoPorId:", error);
    return res.status(400).json({ error: error.message || "No se pudo obtener la orden de pago" });
  }
};

export const obtenerPagosDeOrden = async (req, res) => {
  try {
    const ordenId = Number(req.params.id);
    if (!ordenId) {
      return res.status(400).json({ error: "ID de orden inválido" });
    }

    // Si querés incluir anuladas: /ordenes-pago/:id/pagos?includeAnuladas=1
    const includeAnuladas = String(req.query.includeAnuladas || "0") === "1";

    // Caja / Efectivo
    const caja = await MovimientoCajaTesoreria.findAll({
      where: { ordenpago_id: ordenId },
      order: [["fecha", "ASC"], ["id", "ASC"]],
    });

    // Banco / Transferencias
    const banco = await MovimientoBancoTesoreria.findAll({
      where: { ordenpago_id: ordenId },
      order: [["fecha", "ASC"], ["id", "ASC"]],
    });

    // eCheq (si no se piden anuladas, filtramos estado !== 'anulado')
    const whereEcheq = { ordenpago_id: ordenId };
    if (!includeAnuladas) {
      whereEcheq.estado = { [Op.ne]: "anulado" };
    }
    const echeq = await EcheqEmitido.findAll({
      where: whereEcheq,
      order: [["fecha_emision", "ASC"], ["id", "ASC"]],
    });

    // Tarjeta
    const tarjeta = await PagoTarjetaCredito.findAll({
      where: { ordenpago_id: ordenId },
      order: [["fecha", "ASC"], ["id", "ASC"]],
    });

    // Cuenta Corriente Proveedor (si no se piden anuladas, anulado = false)
    const whereCtaCte = { ordenpago_id: ordenId };
    if (!includeAnuladas) {
      whereCtaCte.anulado = false;
    }
    const ctacte = await MovimientoCtaCteProveedor.findAll({
      where: whereCtaCte,
      order: [["fecha", "ASC"], ["id", "ASC"]],
    });

    return res.json({ caja, banco, echeq, tarjeta, ctacte });
  } catch (err) {
    console.error("❌ obtenerPagosDeOrden:", err);
    return res
      .status(500)
      .json({ error: "No se pudo obtener los pagos de la orden" });
  }
};

/**
 * PUT /ordenes-pago/:id
 */
export const actualizarOrdenPago = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { id } = req.params;

    const orden = await OrdenPago.findByPk(id, { transaction: t, lock: t.LOCK.UPDATE });
    if (!orden) {
      await t.rollback();
      return res.status(404).json({ error: "Orden de pago no encontrada" });
    }

    // Campos permitidos para update
    const {
      empresa_id,
      comprobanteegreso_id,
      proveedor_id,
      fecha,
      total,
      estado,
      numero,
      observaciones,
    } = req.body || {};

    const payload = {};

    if (empresa_id !== undefined) payload.empresa_id = empresa_id;
    if (comprobanteegreso_id !== undefined) payload.comprobanteegreso_id = comprobanteegreso_id;
    if (proveedor_id !== undefined) payload.proveedor_id = proveedor_id;
    if (fecha !== undefined) payload.fecha = fecha;
    if (total !== undefined) {
      if (Number(total) < 0) throw new Error("total no puede ser negativo");
      payload.total = Number(total);
    }
    if (estado !== undefined) payload.estado = estado;
    if (numero !== undefined) payload.numero = numero;
    if (observaciones !== undefined) payload.observaciones = observaciones;

    await orden.update(payload, { transaction: t });

    await t.commit();
    return res.json({ ok: true, orden });
  } catch (error) {
    await t.rollback();
    console.error("❌ actualizarOrdenPago:", error);
    return res.status(400).json({ error: error.message || "No se pudo actualizar la orden de pago" });
  }
};

/**
 * DELETE /ordenes-pago/:id
 */
export const eliminarOrdenPago = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { id } = req.params;
    const orden = await OrdenPago.findByPk(id, { transaction: t, lock: t.LOCK.UPDATE });
    if (!orden) {
      await t.rollback();
      return res.status(404).json({ error: "Orden de pago no encontrada" });
    }

    await orden.destroy({ transaction: t });
    await t.commit();
    return res.json({ ok: true });
  } catch (error) {
    await t.rollback();
    console.error("❌ eliminarOrdenPago:", error);
    return res.status(400).json({ error: error.message || "No se pudo eliminar la orden de pago" });
  }
};

/**
 * GET /ordenes-pago/proveedor/:proveedorId/comprobantes-impagos?empresa_id=...
 * Devuelve comprobantes del proveedor con saldo > 0 (impagos / parciales).
 */
export const listarComprobantesImpagosProveedor = async (req, res) => {
  try {
    const proveedorId = Number(req.params.proveedorId);
    if (!proveedorId) return res.status(400).json({ error: "proveedorId inválido" });

    const empresa_id = req.query.empresa_id ? Number(req.query.empresa_id) : null;

    const where = {
      proveedor_id: proveedorId,
      saldo: { [Op.gt]: 0 },
    };
    if (empresa_id) where.empresa_id = empresa_id;

    const list = await ComprobanteEgreso.findAll({
      where,
      order: [["fechacomprobante", "ASC"], ["id", "ASC"]],
      attributes: ["id", "nrocomprobante", "fechacomprobante", "total", "saldo", "empresa_id", "ordenpago_id"],
    });

    return res.json(list);
  } catch (err) {
    console.error("❌ listarComprobantesImpagosProveedor:", err);
    return res.status(500).json({ error: "No se pudieron obtener los comprobantes impagos" });
  }
};

/**
 * POST /ordenes-pago/emitir
 * body:
 * {
 *   empresa_id, proveedor_id, fecha?, observaciones?,
 *   items: [{ comprobanteegreso_id, monto_aplicado }],
 *   pagos: [
 *     { medio: "caja"|"transferencia"|"echeq"|"tarjeta",
 *       formapago_id?, monto, fecha?, detalle?,
 *       // caja:
 *       caja_id?, categoriaegreso_id?, imputacioncontable_id?,
 *       // transferencia:
 *       banco_id?, referencia?, cbu_alias_destino?, titular_destino?,
 *       // echeq:
 *       banco_id?, numero_echeq?, fecha_vencimiento?,
 *       // tarjeta:
 *       tipotarjeta_id?, marcatarjeta_id?, cupon_numero?, planpago_id?
 *     }, ...
 *   ]
 * }
 *
 * Reglas:
 * - No se acepta medio "ctacte".
 * - sum(pagos.monto) >= sum(items.monto_aplicado) (exceso → saldo a favor CTActe).
 * - Aplica abono por cada item (comprobanteegreso_id).
 * - Actualiza saldo/estado de cada comprobante.
 * - Crea movimientos (caja/banco/echeq/tarjeta) con ordenpago_id.
 */
export const emitirOrdenPago = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const {
      empresa_id,
      proveedor_id,
      fecha,
      observaciones,
      items = [],
      pagos = [],
      ordenpago_id: ordenpagoIdRaw, // 👈 trigger modo SIN ORDEN
    } = req.body || {};

    if (!empresa_id) throw new Error("empresa_id requerido");
    if (!proveedor_id) throw new Error("proveedor_id requerido");
    if (!Array.isArray(pagos) || pagos.length === 0) {
      throw new Error("Debe enviar al menos una forma de pago");
    }

    // No permitir cta cte como "medio" directo
    for (const p of pagos) {
      const medio = String(p.medio || "").toLowerCase();
      if (medio === "ctacte" || /cta\.?\s*cte|cuenta\s*corriente/i.test(medio)) {
        throw new Error("El medio 'cta cte' no está permitido en pagos.");
      }
    }

    const ordenpagoId = ordenpagoIdRaw ? Number(ordenpagoIdRaw) : null;
    const MODO_SIN_ORDEN = !!ordenpagoId;

    // Validación diferencial
    if (!MODO_SIN_ORDEN) {
      if (!Array.isArray(items) || items.length === 0) {
        throw new Error("Debe enviar items con comprobanteegreso_id y monto_aplicado");
      }
    }

    // Particionar pagos según vengan como existing_ref o "nuevos".
    const pagosExisting = [];
    const pagosNuevos = [];
    for (const p of pagos) {
      if (p?.existing_ref?.id && p?.existing_ref?.tipo) {
        if (MODO_SIN_ORDEN) {
          throw new Error("No se permiten existing_ref cuando se envía ordenpago_id (modo sin orden).");
        }
        pagosExisting.push(p);
      } else {
        pagosNuevos.push(p);
      }
    }

    let totalPagos = pagosNuevos.reduce((a, p) => a + Number(p.monto || 0), 0);

    // En modo clásico, el total se completa con importes reales de existing_ref
    if (!MODO_SIN_ORDEN) {
      const sumarImporte = (n) => { totalPagos += Number(n || 0); };

      for (const p of pagosExisting) {
        const tipo = String(p.existing_ref.tipo).toLowerCase();
        const id = Number(p.existing_ref.id);
        if (!id) throw new Error("existing_ref inválido");

        if (tipo === "caja") {
          const mov = await MovimientoCajaTesoreria.findByPk(id, { transaction: t, lock: t.LOCK.UPDATE });
          if (!mov) throw new Error(`Movimiento de caja #${id} inexistente`);
          if (mov.ordenpago_id || mov.referencia_tipo || mov.referencia_id) throw new Error(`Movimiento de caja #${id} ya vinculado`);
          if (Number(mov.empresa_id) !== Number(empresa_id)) throw new Error("Movimiento de caja de otra empresa");
          if ((mov.tipo || "").toLowerCase() !== "egreso") throw new Error("Movimiento de caja no es egreso");
          sumarImporte(mov.monto);
        } else if (tipo === "banco") {
          const mov = await MovimientoBancoTesoreria.findByPk(id, { transaction: t, lock: t.LOCK.UPDATE });
          if (!mov) throw new Error(`Movimiento bancario #${id} inexistente`);
          if (mov.ordenpago_id || mov.referencia_tipo || mov.referencia_id) throw new Error(`Movimiento bancario #${id} ya vinculado`);
          if (Number(mov.empresa_id) !== Number(empresa_id)) throw new Error("Movimiento bancario de otra empresa");
          if ((mov.tipo || "").toLowerCase() !== "egreso") throw new Error("Movimiento bancario no es egreso");
          sumarImporte(mov.monto);
        } else if (tipo === "echeq") {
          const ch = await EcheqEmitido.findByPk(id, { transaction: t, lock: t.LOCK.UPDATE });
          if (!ch) throw new Error(`eCheq #${id} inexistente`);
          if (ch.ordenpago_id) throw new Error(`eCheq #${id} ya vinculado`);
          if (Number(ch.empresa_id) !== Number(empresa_id)) throw new Error("eCheq de otra empresa");
          if ((ch.estado || "").toLowerCase() !== "emitido") throw new Error("eCheq no está en estado 'emitido'");
          sumarImporte(ch.importe);
        } else if (tipo === "tarjeta") {
          const pt = await PagoTarjetaCredito.findByPk(id, { transaction: t, lock: t.LOCK.UPDATE });
          if (!pt) throw new Error(`Pago tarjeta #${id} inexistente`);
          if (pt.ordenpago_id) throw new Error(`Pago tarjeta #${id} ya vinculado`);
          if (Number(pt.empresa_id) !== Number(empresa_id)) throw new Error("Pago tarjeta de otra empresa");
          sumarImporte(pt.importe);
        } else {
          throw new Error(`existing_ref.tipo no soportado: ${tipo}`);
        }
      }

      const totalAplicado = items.reduce((acc, it) => acc + (Number(it.monto_aplicado) || 0), 0);
      if (totalPagos <= 0) throw new Error("Total de pagos inválido");
      if (totalPagos < totalAplicado) {
        throw new Error("Los pagos no alcanzan el total aplicado a comprobantes");
      }
    } else {
      // Modo sin orden: requisitos mínimos
      if (totalPagos <= 0) throw new Error("Total de pagos inválido");
    }

    const fechaOrden = fecha || new Date().toISOString().slice(0, 10);

    // ===================== MODO CLÁSICO =====================
    if (!MODO_SIN_ORDEN) {
      // Verificar comprobantes y saldos
      const compIds = [...new Set(items.map(x => Number(x.comprobanteegreso_id)).filter(Boolean))];
      const comps = await ComprobanteEgreso.findAll({
        where: { id: { [Op.in]: compIds }, proveedor_id, empresa_id },
        transaction: t,
        lock: t.LOCK.UPDATE,
      });
      const byId = {};
      for (const c of comps) byId[c.id] = c;

      for (const it of items) {
        const cid = Number(it.comprobanteegreso_id);
        const monto = Number(it.monto_aplicado || 0);
        if (!cid || monto <= 0) throw new Error("Item inválido");
        const comp = byId[cid];
        if (!comp) throw new Error(`Comprobante ${cid} inexistente o de otra empresa/proveedor`);
        if (Number(comp.saldo || 0) < monto) {
          throw new Error(`El monto aplicado (${monto}) excede el saldo del comprobante ${cid} (${comp.saldo})`);
        }
      }

      const singleCompId = items.length === 1 ? Number(items[0].comprobanteegreso_id) : null;

      // Crear Orden de Pago
      const orden = await OrdenPago.create(
        {
          empresa_id,
          proveedor_id,
          comprobanteegreso_id: singleCompId,
          fecha: fechaOrden,
          total: totalPagos,
          estado: "emitida",
          numero: null,
          observaciones: observaciones || null,
        },
        { transaction: t }
      );

      // Etiqueta descriptiva para pagos
      const uniques = [...new Set(items.map(i => Number(i.comprobanteegreso_id)).filter(Boolean))];
      const compLabel = uniques.length === 0
        ? null
        : (uniques.length === 1
            ? `Comp. ${(byId[uniques[0]]?.nrocomprobante || uniques[0])}`
            : `Varios comprobantes (${uniques.length})`);
      const withComp = (base) => compLabel ? `${base} (${compLabel})` : base;

      // 1) Crear movimientos NUEVOS
      for (const p of pagosNuevos) {
        const medio = String(p.medio || "").toLowerCase();
        const monto = Number(p.monto || 0);
        if (monto <= 0) throw new Error("Monto de pago inválido");
        const fechaPago = p.fecha || fechaOrden;

        if (medio === "caja" || /caja|efectivo/i.test(medio)) {
          if (!p.caja_id) throw new Error("caja_id requerido para pago en caja");
          await MovimientoCajaTesoreria.create({
            tipo: "egreso",
            descripcion: withComp(p.detalle || `Orden de pago #${orden.id}`),
            monto, fecha: fechaPago, caja_id: p.caja_id,
            empresa_id, formapago_id: p.formapago_id || null,
            referencia_id: orden.id, referencia_tipo: "OrdenPago",
            observaciones: p.observaciones || null,
            categoriaegreso_id: p.categoriaegreso_id || null,
            imputacioncontable_id: p.imputacioncontable_id || null,
            ordenpago_id: orden.id,
          }, { transaction: t });
          continue;
        }
        if (medio === "transferencia" || /transfer/i.test(medio)) {
          if (!p.banco_id) throw new Error("banco_id requerido para transferencia");
          await MovimientoBancoTesoreria.create({
            tipo: "egreso",
            descripcion: withComp(p.detalle || `Orden de pago #${orden.id} por transferencia`),
            monto, fecha: fechaPago, banco_id: p.banco_id,
            empresa_id, formapago_id: p.formapago_id || null,
            referencia_id: orden.id, referencia_tipo: "OrdenPago",
            observaciones: p.observaciones || null,
            ordenpago_id: orden.id,
          }, { transaction: t });
          continue;
        }
        if (medio === "echeq" || /e-?\s*cheq|echeq/i.test(medio)) {
          if (!p.banco_id) throw new Error("banco_id requerido para eCheq");
          if (!p.fecha_vencimiento) throw new Error("fecha_vencimiento requerida para eCheq");
          if (new Date(p.fecha_vencimiento) < new Date(fechaPago)) {
            throw new Error("fecha_vencimiento no puede ser anterior a la fecha de emisión");
          }
          await EcheqEmitido.create({
            comprobanteegreso_id: singleCompId || null,
            proveedor_id, empresa_id,
            numero_echeq: p.numero_echeq || null,
            banco_id: p.banco_id,
            fecha_emision: fechaPago,
            fecha_vencimiento: p.fecha_vencimiento,
            importe: monto,
            estado: "emitido",
            ordenpago_id: orden.id,
          }, { transaction: t });
          continue;
        }
        if (medio === "tarjeta" || /tarjeta/i.test(medio)) {
          if (!p.tipotarjeta_id) throw new Error("tipotarjeta_id requerido");
          if (!p.marcatarjeta_id) throw new Error("marcatarjeta_id requerido");
          await PagoTarjetaCredito.create({
            fecha: fechaPago, importe: monto,
            comprobanteegreso_id: singleCompId || null,
            empresa_id, proveedor_id,
            tipotarjeta_id: p.tipotarjeta_id || null,
            marcatarjeta_id: p.marcatarjeta_id || null,
            cupon_numero: p.cupon_numero || null,
            planpago_id: p.planpago_id || null,
            concepto: withComp(p.detalle || `Orden de pago #${orden.id} con tarjeta`),
            observaciones: p.observaciones || null,
            estado: "pendiente",
            ordenpago_id: orden.id,
          }, { transaction: t });
          continue;
        }
        throw new Error(`Medio de pago no soportado: ${p.medio}`);
      }

      // 2) Vincular existing_ref a la orden
      for (const p of pagosExisting) {
        const tipo = String(p.existing_ref.tipo).toLowerCase();
        const id = Number(p.existing_ref.id);
        const descFinal = withComp(p.detalle || `Orden de pago #${orden.id}`);

        if (tipo === "caja") {
          const mov = await MovimientoCajaTesoreria.findByPk(id, { transaction: t, lock: t.LOCK.UPDATE });
          await mov.update({
            ordenpago_id: orden.id,
            referencia_tipo: "OrdenPago",
            referencia_id: orden.id,
            descripcion: descFinal,
          }, { transaction: t });
          continue;
        }
        if (tipo === "banco") {
          const mov = await MovimientoBancoTesoreria.findByPk(id, { transaction: t, lock: t.LOCK.UPDATE });
          await mov.update({
            ordenpago_id: orden.id,
            referencia_tipo: "OrdenPago",
            referencia_id: orden.id,
            observaciones: mov.observaciones || descFinal,
          }, { transaction: t });
          continue;
        }
        if (tipo === "echeq") {
          const ch = await EcheqEmitido.findByPk(id, { transaction: t, lock: t.LOCK.UPDATE });
          await ch.update({
            ordenpago_id: orden.id,
            comprobanteegreso_id: singleCompId || ch.comprobanteegreso_id || null,
          }, { transaction: t });
          continue;
        }
        if (tipo === "tarjeta") {
          const pt = await PagoTarjetaCredito.findByPk(id, { transaction: t, lock: t.LOCK.UPDATE });
          await pt.update({
            ordenpago_id: orden.id,
            comprobanteegreso_id: singleCompId || pt.comprobanteegreso_id || null,
            concepto: pt.concepto || `Orden de pago #${orden.id} con tarjeta`,
          }, { transaction: t });
          continue;
        }
      }

      // 3) Aplicar abonos y actualizar comprobantes
      let totalAplicadoEfectivo = 0;
      for (const it of items) {
        const compId = Number(it.comprobanteegreso_id);
        const monto  = Number(it.monto_aplicado || 0);
        if (monto <= 0) continue;

        const comp = byId[compId];
        const nuevoSaldo = Math.max(0, Number(comp.saldo || 0) - monto);
        let nuevoEstado = comp.estadopago;
        if (nuevoSaldo === 0) nuevoEstado = "pagada";
        else if (nuevoSaldo < comp.total) nuevoEstado = "parcial";
        else nuevoEstado = "impaga";

        await comp.update({ saldo: nuevoSaldo, estadopago: nuevoEstado }, { transaction: t });

        // ⬇️ Incluye el nro de comprobante en la descripción
        await MovimientoCtaCteProveedor.create({
          proveedor_id,
          empresa_id,
          fecha: fechaOrden,
          fecha_pago: fechaOrden,
          descripcion: `Abono por Orden de Pago #${orden.id} (Comp. ${comp.nrocomprobante || comp.id})`,
          tipo: "abono",
          importe: monto,
          origen_tipo: "OrdenPago",
          origen_id: orden.id,
          comprobanteegreso_id: comp.id,
          anulado: false,
          ordenpago_id: orden.id,
        }, { transaction: t });

        totalAplicadoEfectivo += monto;
      }

      // Exceso a favor
      const exceso = Math.max(0, totalPagos - totalAplicadoEfectivo);
      if (exceso > 0) {
        await MovimientoCtaCteProveedor.create({
          proveedor_id,
          empresa_id,
          fecha: fechaOrden,
          fecha_pago: fechaOrden,
          descripcion: `Saldo a favor por Orden de Pago #${orden.id}${compLabel ? ` (${compLabel})` : ""}`,
          tipo: "abono",
          importe: exceso,
          origen_tipo: "OrdenPago",
          origen_id: orden.id,
          comprobanteegreso_id: null,
          anulado: false,
          ordenpago_id: orden.id,
        }, { transaction: t });
      }

      const estadoOrden = (exceso === 0 && totalAplicadoEfectivo > 0) ? "aplicada" : "parcial";
      await orden.update({ estado: estadoOrden, total: totalPagos }, { transaction: t });

      await t.commit();
      return res.status(201).json({ ok: true, ordenpago: orden });
    }

    // ===================== MODO SIN ORDEN =====================
    // Sólo se registran pagos con ordenpago_id = null y sin referencia a OP.
    const creados = { caja: [], banco: [], echeq: [], tarjeta: [] };

    for (const p of pagosNuevos) {
      const medio = String(p.medio || "").toLowerCase();
      const monto = Number(p.monto || 0);
      if (monto <= 0) throw new Error("Monto de pago inválido");
      const fechaPago = p.fecha || fechaOrden;

      if (medio === "caja" || /caja|efectivo/i.test(medio)) {
        if (!p.caja_id) throw new Error("caja_id requerido para pago en caja");
        const mov = await MovimientoCajaTesoreria.create({
          tipo: "egreso",
          descripcion: p.detalle || `Pago a proveedor ${proveedor_id}`,
          monto,
          fecha: fechaPago,
          caja_id: p.caja_id,
          empresa_id,
          formapago_id: p.formapago_id || null,
          referencia_id: null, referencia_tipo: null,
          observaciones: p.observaciones || null,
          categoriaegreso_id: p.categoriaegreso_id || null,
          imputacioncontable_id: p.imputacioncontable_id || null,
          ordenpago_id: null, // 👈 explícitamente null
          proveedor_id,
        }, { transaction: t });
        creados.caja.push(mov);
        continue;
      }

      if (medio === "transferencia" || /transfer/i.test(medio)) {
        if (!p.banco_id) throw new Error("banco_id requerido para transferencia");
        const mov = await MovimientoBancoTesoreria.create({
          tipo: "egreso",
          descripcion: p.detalle || `Pago a proveedor ${proveedor_id} por transferencia`,
          monto,
          fecha: fechaPago,
          banco_id: p.banco_id,
          empresa_id,
          formapago_id: p.formapago_id || null,
          referencia_id: null, referencia_tipo: null,
          observaciones: p.observaciones || null,
          ordenpago_id: null, // 👈
          proveedor_id,
        }, { transaction: t });
        creados.banco.push(mov);
        continue;
      }

      if (medio === "echeq" || /e-?\s*cheq|echeq/i.test(medio)) {
        if (!p.banco_id) throw new Error("banco_id requerido para eCheq");
        if (!p.fecha_vencimiento) throw new Error("fecha_vencimiento requerida para eCheq");
        if (new Date(p.fecha_vencimiento) < new Date(fechaPago)) {
          throw new Error("fecha_vencimiento no puede ser anterior a la fecha de emisión");
        }
        const ch = await EcheqEmitido.create({
          comprobanteegreso_id: null,
          proveedor_id,
          empresa_id,
          numero_echeq: p.numero_echeq || null,
          banco_id: p.banco_id,
          fecha_emision: fechaPago,
          fecha_vencimiento: p.fecha_vencimiento,
          importe: monto,
          estado: "emitido",
          ordenpago_id: null, // 👈
        }, { transaction: t });
        creados.echeq.push(ch);
        continue;
      }

      if (medio === "tarjeta" || /tarjeta/i.test(medio)) {
        if (!p.tipotarjeta_id) throw new Error("tipotarjeta_id requerido");
        if (!p.marcatarjeta_id) throw new Error("marcatarjeta_id requerido");

        const pt = await PagoTarjetaCredito.create({
          fecha: fechaPago,
          importe: monto,
          comprobanteegreso_id: null,
          empresa_id,
          proveedor_id,
          tipotarjeta_id: p.tipotarjeta_id || null,
          marcatarjeta_id: p.marcatarjeta_id || null,
          cupon_numero: p.cupon_numero || null,
          planpago_id: p.planpago_id || null,
          concepto: p.detalle || `Pago a proveedor ${proveedor_id} con tarjeta`,
          observaciones: p.observaciones || null,
          estado: "pendiente",
          ordenpago_id: null, // 👈
        }, { transaction: t });
        creados.tarjeta.push(pt);
        continue;
      }

      throw new Error(`Medio de pago no soportado: ${p.medio}`);
    }

    // Si además vienen ITEMS, aplicamos abonos a cta cte y actualizamos saldos.
    if (Array.isArray(items) && items.length > 0) {
      // Validar que la OP exista y corresponda
      const op = await OrdenPago.findByPk(ordenpagoId, { transaction: t, lock: t.LOCK.UPDATE });
      if (!op) throw new Error(`Orden de pago #${ordenpagoId} inexistente`);
      if (Number(op.empresa_id) !== Number(empresa_id) || Number(op.proveedor_id) !== Number(proveedor_id)) {
        throw new Error(`Orden de pago #${ordenpagoId} no corresponde a la empresa/proveedor enviados`);
      }

      // Verificar comprobantes y saldos
      const compIds = [...new Set(items.map(x => Number(x.comprobanteegreso_id)).filter(Boolean))];
      const comps = await ComprobanteEgreso.findAll({
        where: { id: { [Op.in]: compIds }, proveedor_id, empresa_id },
        transaction: t,
        lock: t.LOCK.UPDATE,
      });
      const byId = {};
      for (const c of comps) byId[c.id] = c;

      for (const it of items) {
        const cid = Number(it.comprobanteegreso_id);
        const monto = Number(it.monto_aplicado || 0);
        if (!cid || monto <= 0) throw new Error("Item inválido");
        const comp = byId[cid];
        if (!comp) throw new Error(`Comprobante ${cid} inexistente o de otra empresa/proveedor`);
        if (Number(comp.saldo || 0) < monto) {
          throw new Error(`El monto aplicado (${monto}) excede el saldo del comprobante ${cid} (${comp.saldo})`);
        }
      }

      const totalAplicado = items.reduce((acc, it) => acc + (Number(it.monto_aplicado) || 0), 0);
      if (totalPagos < totalAplicado) {
        throw new Error("Los pagos no alcanzan el total aplicado a comprobantes");
      }

      // Etiqueta opcional
      const uniques = [...new Set(items.map(i => Number(i.comprobanteegreso_id)).filter(Boolean))];
      const compLabel = uniques.length === 0
        ? null
        : (uniques.length === 1
            ? `Comp. ${(byId[uniques[0]]?.nrocomprobante || uniques[0])}`
            : `Varios comprobantes (${uniques.length})`);

      // Aplicar abonos (con nro de comprobante en descripción) y actualizar saldos
      let totalAplicadoEfectivo = 0;
      for (const it of items) {
        const compId = Number(it.comprobanteegreso_id);
        const monto  = Number(it.monto_aplicado || 0);
        if (monto <= 0) continue;

        const comp = byId[compId];
        const nuevoSaldo = Math.max(0, Number(comp.saldo || 0) - monto);
        let nuevoEstado = comp.estadopago;
        if (nuevoSaldo === 0) nuevoEstado = "pagada";
        else if (nuevoSaldo < comp.total) nuevoEstado = "parcial";
        else nuevoEstado = "impaga";

        await comp.update({ saldo: nuevoSaldo, estadopago: nuevoEstado }, { transaction: t });

        await MovimientoCtaCteProveedor.create({
          proveedor_id,
          empresa_id,
          fecha: fechaOrden,
          fecha_pago: fechaOrden,
          descripcion: `Abono por Orden de Pago #${ordenpagoId} (Comp. ${comp.nrocomprobante || comp.id})`,
          tipo: "abono",
          importe: monto,
          origen_tipo: "OrdenPago",
          origen_id: ordenpagoId,
          comprobanteegreso_id: comp.id,
          anulado: false,
          ordenpago_id: ordenpagoId, // 👈 vinculado a la OP existente
        }, { transaction: t });

        totalAplicadoEfectivo += monto;
      }

      // Exceso → saldo a favor (vinculado a la OP)
      const exceso = Math.max(0, totalPagos - totalAplicadoEfectivo);
      if (exceso > 0) {
        await MovimientoCtaCteProveedor.create({
          proveedor_id,
          empresa_id,
          fecha: fechaOrden,
          fecha_pago: fechaOrden,
          descripcion: `Saldo a favor por Orden de Pago #${ordenpagoId}${compLabel ? ` (${compLabel})` : ""}`,
          tipo: "abono",
          importe: exceso,
          origen_tipo: "OrdenPago",
          origen_id: ordenpagoId,
          comprobanteegreso_id: null,
          anulado: false,
          ordenpago_id: ordenpagoId,
        }, { transaction: t });
      }
    }

    await t.commit();
    return res.status(201).json({ ok: true, pagos_creados: creados });

  } catch (err) {
    await t.rollback();
    console.error("❌ emitirOrdenPago:", err);
    return res.status(400).json({ error: err.message || "No se pudo emitir la orden de pago" });
  }
};


export const listarOrdenesPagoLibres = async (req, res) => {
  try {
    const {
      empresa_id,
      proveedor_id,
      fecha_desde,
      fecha_hasta,
      q,
      limit = 50,
      offset = 0,
    } = req.query;

    if (!empresa_id) throw new Error("empresa_id requerido");

    const where = {
      empresa_id,
      estado: "pendiente_aplicacion",
      comprobanteegreso_id: { [Op.is]: null },
    };

    if (proveedor_id) where.proveedor_id = Number(proveedor_id);

    if (fecha_desde || fecha_hasta) {
      where.fecha = {};
      if (fecha_desde) where.fecha[Op.gte] = fecha_desde;
      if (fecha_hasta) where.fecha[Op.lte] = fecha_hasta;
    }

    // Búsqueda simple por texto (opcional)
    if (q) {
      where[Op.or] = [
        { observaciones: { [Op.iLike]: `%${q}%` } },
        { numero: { [Op.iLike]: `%${q}%` } },
      ];
    }

    const ordenes = await OrdenPago.findAll({
      where,
      order: [
        ["fecha", "ASC"],
        ["id", "ASC"],
      ],
      limit: Number(limit),
      offset: Number(offset),
    });

    return res.json({ ok: true, ordenes });
  } catch (error) {
    console.error("❌ listarOrdenesPagoLibres:", error);
    return res.status(400).json({ error: error.message || "No se pudo listar" });
  }
};

