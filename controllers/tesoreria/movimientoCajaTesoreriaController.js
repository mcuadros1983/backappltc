import { Op } from "sequelize";
import MovimientoCajaTesoreria from "../../models/tesoreria/movimientocajatesoreria.js";
import MovimientoCtaCteProveedor from "../../models/tesoreria/movimientoctacteproveedor.js";
import OrdenPago from "../../models/tesoreria/ordendepago.js";
import MovimientoBancoTesoreria from "../../models/tesoreria/movimientobancotesoreria.js";
import { sequelize } from "../../config/database.js";
import Cliente from "../../models/gmedias/clienteModel.js";
import CuentaCorriente from "../../models/gmedias/cuentaCorrienteModel.js";
import Cobranza from "../../models/gmedias/cobranzaModel.js";
import DetalleCobranza from "../../models/gmedias/detalleCobranzaModel.js";
import ComprobanteEgreso from "../../models/iva/comprobanteegreso.js";
import GastoEstimadoPago from "../../models/tesoreria/gastoestimadopago.js";
import GastoEstimadoInstancia from "../../models/tesoreria/gastoestimadoinstancia.js";
import MovimientoCtaCteProveedorAplic from "../../models/tesoreria/movimientoctacteproveedoraplicacion.js";
import PagoTarjetaCredito from "../../models/tesoreria/pagotarjetacredito.js";
import EcheqEmitido from "../../models/tesoreria/pagoecheq.js";
import RetiroTesoreria from "../../models/tesoreria/retirotesoreria.js";
import PagoSueldoEmpleado from "../../models/sueldoempleado/pagosueldoempleado.js";
import PagoProgramadoTesoreria
  from "../../models/tesoreria/PagoProgramadoTesoreria.js";
// import PagoProgramadoTesoreria from "../../models/tesoreria/PagoProgramadoTesoreria.js";
import {
  recalcularComprobanteEgreso,
} from "./helpers/recalcularComprobanteEgreso.js";

const norm = (s) => String(s || "").trim().toLowerCase();

/**
 * POST /movimientos-caja-tesoreria/ingresos/cobranza-clientes
 * Body esperado:
 * {
 *   empresa_id: number,
 *   caja_id: number,
 *   clienteId: number,
 *   fecha: "YYYY-MM-DD" (opcional; default hoy),
 *   descripcion: string,
 *   montoTotal: number,
 *   proyecto_id?: number,
 *   categoriaingreso_id?: number,
 *   observaciones?: string,
 *   formacobro_id?: number,        // id de forma "Caja/Efectivo". Si no viene, se intenta resolver por descripción (opcional)
 *   idempotencyKey?: string,       // recomendado
 *
 *   // opcional: múltiples detalles
 *   detallesCobranza?: [{ monto: number, fecha?: "YYYY-MM-DD" }, ...]
 * }
 */
export const registrarIngresoCobranzaClientes = async (req, res, next) => {
  const t = await sequelize.transaction();
  try {
    const {
      empresa_id,
      caja_id,
      clienteId,
      fecha,
      descripcion,
      montoTotal,
      proyecto_id = null,
      categoriaingreso_id = null,
      observaciones = null,
      formacobro_id = null,
      idempotencyKey = null,
      detallesCobranza = [],
    } = req.body || {};

    // ===== Validaciones mínimas
    if (!empresa_id || !caja_id) {
      await t.rollback();
      return res.status(400).json({ error: "empresa_id y caja_id son requeridos" });
    }
    if (!clienteId) {
      await t.rollback();
      return res.status(400).json({ error: "clienteId es requerido" });
    }
    const monto = Number(montoTotal);
    if (!Number.isFinite(monto) || monto <= 0) {
      await t.rollback();
      return res.status(400).json({ error: "Monto inválido" });
    }
    if (!descripcion?.trim()) {
      await t.rollback();
      return res.status(400).json({ error: "descripcion es requerida" });
    }

    // ===== Idempotencia (opcional)
    if (idempotencyKey) {
      const existente = await MovimientoCajaTesoreria.findOne({
        where: { idempotency_key: idempotencyKey, tipo: "ingreso" },
        transaction: t,
        lock: t.LOCK.UPDATE,
      });
      if (existente) {
        await t.commit();
        return res.json({ ok: true, reused: true, movimiento: existente });
      }
    }

    // ===== Cliente + CC (lock para concurrencia)
    const cliente = await Cliente.findByPk(clienteId, { transaction: t, lock: t.LOCK.UPDATE });
    if (!cliente) {
      await t.rollback();
      return res.status(404).json({ error: "Cliente no encontrado" });
    }

    const [cc] = await CuentaCorriente.findOrCreate({
      where: { cliente_id: cliente.id },
      defaults: { cliente_id: cliente.id, saldoActual: 0, fecha: fecha || sequelize.literal("CURRENT_DATE") },
      transaction: t,
      lock: t.LOCK.UPDATE,
    });

    // ===== Resolver formacobro_id (si no viene)
    let formaCobroId = formacobro_id ?? null;

    // Si no hay modelo de formas de pago, exigimos que venga en el body:
    if (!formaCobroId) {
      await t.rollback();
      return res.status(400).json({ error: "formacobro_id es requerido (forma de cobro Caja/Efectivo)" });
    }

    // ===== 1) Crear MovimientoCajaTesoreria (INGRESO)
    const movimiento = await MovimientoCajaTesoreria.create(
      {
        tipo: "ingreso",
        descripcion: `COBRANZA - ${cliente.razonsocial || cliente.nombre || "Cliente #" + cliente.id}`,
        monto,
        fecha: fecha || sequelize.literal("CURRENT_DATE"),
        caja_id,
        formapago_id: formaCobroId,
        referencia_id: null,            // se setea luego si querés
        referencia_tipo: "Cobranza",
        observaciones: observaciones || null,
        categoriaegreso_id: null,
        categoriaingreso_id: categoriaingreso_id || null,
        imputacioncontable_id: null,    // si tenés lógica para derivar, podés setear acá
        idempotency_key: idempotencyKey || null,
        proyecto_id: proyecto_id || null,
        ordenpago_id: null,
      },
      { transaction: t }
    );

    let movCtaCte = null;

if (egreso.generar_abono_ctacte === true) {

  movCtaCte =
    await MovimientoCtaCteProveedor.create(
      {
        proveedor_id:
          Number(egreso.proveedor_id),

        empresa_id:
          Number(empresa_id),

        fecha,

        fecha_pago:
          fecha,

        descripcion:
          `Pago disponible desde Caja OP #${orden.id}`,

        tipo:
          "abono",

        importe:
          monto,

        origen_tipo:
          "OrdenPago",

        origen_id:
          orden.id,

        comprobanteegreso_id:
          null,

        anulado:
          false,

        ordenpago_id:
          orden.id,

        referencia_tipo:
          "MovimientoCajaTesoreria",

        referencia_id:
          movimiento.id,

        formapago_id:
          egreso.formapago_id || null,
      },
      {
        transaction: t,
      }
    );
}
    // ===== 2) Crear Cobranza vinculada a CC y al movimiento de caja
    const cobranza = await Cobranza.create(
      {
        monto_total: monto,
        descripcion_cobro: descripcion?.trim(),
        forma_cobro: "Efectivo", // o "efectivo", purely descriptivo
        fecha: fecha || sequelize.literal("CURRENT_DATE"),
        formacobro_id: formaCobroId,
        movimiento_id: movimiento.id,
        cuentaCorriente_id: cc.id,
      },
      { transaction: t }
    );

    // Opcional: actualizar referencia del movimiento con el id de la cobranza (si te sirve).
    await movimiento.update(
      { referencia_id: cobranza.id, referencia_tipo: "Cobranza" },
      { transaction: t }
    );

    // ===== 3) Detalle(s) de Cobranza
    if (Array.isArray(detallesCobranza) && detallesCobranza.length > 0) {
      for (const det of detallesCobranza) {
        const md = Number(det?.monto ?? 0);
        if (!Number.isFinite(md) || md <= 0) {
          await t.rollback();
          return res.status(400).json({ error: "Monto de detalle inválido" });
        }
        await DetalleCobranza.create(
          {
            cobranza_id: cobranza.id,
            monto_total: md,
            fecha: det?.fecha || fecha || sequelize.literal("CURRENT_DATE"),
          },
          { transaction: t }
        );
      }
    } else {
      // Detalle único por el total
      await DetalleCobranza.create(
        {
          cobranza_id: cobranza.id,
          monto_total: monto,
          fecha: fecha || sequelize.literal("CURRENT_DATE"),
        },
        { transaction: t }
      );
    }

    // ===== 4) Descontar saldo de la cuenta corriente (pago de cliente ↓ saldo)
    await cc.decrement("saldoActual", { by: monto, transaction: t });
    await cc.reload({ transaction: t });

    await t.commit();

    return res.json({
      ok: true,
      movimiento,
      cobranza,
      cuentaCorriente: { id: cc.id, saldoActual: cc.saldoActual },
      movCtaCte
    });
  } catch (err) {
    await t.rollback();
    next(err);
  }
};

// Crear movimiento de caja
export const crearMovimientoCajaTesoreria = async (req, res) => {
  try {
    const movimiento = await MovimientoCajaTesoreria.create(req.body);
    res.status(201).json(movimiento);
  } catch (error) {
    res.status(500).json({
      error: "Error al crear el movimiento de caja de tesorería",
      detalle: error.message,
    });
  }
};

export const listarMovimientosCajaTesoreria = async (req, res) => {
  try {
    const {
      fecha_desde,
      fecha_hasta,
      caja_id,
      includeAnulados = "0",
    } = req.query || {};

    // Normaliza fechas dd-mm-YYYY a YYYY-MM-DD si llegaran así
    const toISO = (d) => {
      if (!d) return d;
      const m = /^(\d{2})-(\d{2})-(\d{4})$/.exec(String(d));
      return m ? `${m[3]}-${m[2]}-${m[1]}` : d;
    };
    const fDesde = toISO(fecha_desde);
    const fHasta = toISO(fecha_hasta);

    const where = {};

    if (caja_id) where.caja_id = Number(caja_id);
    if (includeAnulados !== "1") where.anulado = false;

    if (fDesde || fHasta) {
      where.fecha = {};
      if (fDesde) where.fecha[Op.gte] = fDesde;
      if (fHasta) where.fecha[Op.lte] = fHasta;
    }

    // Log útil para depurar
    console.log("▶ listarMovimientosCajaTesoreria.where:", where);

    const movimientos = await MovimientoCajaTesoreria.findAll({
      where,
      order: [["fecha", "ASC"], ["id", "ASC"]],
    });

    return res.status(200).json(movimientos);
  } catch (error) {
    console.error("❌ Error al obtener los movimientos de caja:", error);
    return res.status(500).json({
      error: "Error al obtener los movimientos de caja de tesorería",
      detalle: error.message,
    });
  }
};

// Obtener movimiento por ID
export const obtenerMovimientoCajaTesoreriaPorId = async (req, res) => {
  try {
    const movimiento = await MovimientoCajaTesoreria.findByPk(req.params.id);
    if (!movimiento) {
      return res.status(404).json({ error: "Movimiento de caja no encontrado" });
    }
    res.status(200).json(movimiento);
  } catch (error) {
    res.status(500).json({
      error: "Error al obtener el movimiento de caja de tesorería",
      detalle: error.message,
    });
  }
};

// Actualizar movimiento
export const actualizarMovimientoCajaTesoreria = async (req, res) => {
  try {
    const movimiento = await MovimientoCajaTesoreria.findByPk(req.params.id);
    if (!movimiento) {
      return res.status(404).json({ error: "Movimiento de caja no encontrado" });
    }
    await movimiento.update(req.body);
    res.status(200).json(movimiento);
  } catch (error) {
    res.status(500).json({
      error: "Error al actualizar el movimiento de caja de tesorería",
      detalle: error.message,
    });
  }
};

/**
 * DELETE /movimientos-caja-tesoreria/:id
 * Elimina un MovimientoCajaTesoreria contemplando:
 *  - Pagos mixtos de comprobante (SOLO eliminar caja, crear cargo en CtaCte, recalcular estado de comp, ajustar OP)
 *  - Depósitos bancarios (eliminar caja + pareja bancaria + ajustar/eliminar OP)
 *  - Limpieza de aplicaciones a gasto estimado (pagos + recalculo de instancia)
 *  - Limpieza de CtaCte proveedor vinculada al movimiento (y sus aplicaciones)
 */

export const eliminarMovimientoCajaTesoreria = async (req, res) => {
  const t = await sequelize.transaction();
  const EPS = 0.0001;

  // Helper robusto para recalcular saldo/estado de un ComprobanteEgreso
  async function recalcComprobanteEgreso(compId, trx) {
    const comp = await ComprobanteEgreso.findByPk(compId, { transaction: trx });
    if (!comp) return;

    const totalComp = Number(comp.total || 0);

    // Pagos directos remanentes (caja, banco, tarjeta, eCheq)
    const [cajaComp, bancoComp, tarjetaComp, echeqComp] = await Promise.all([
      // MovimientoCajaTesoreria.findAll({ where: { comprobanteegreso_id: compId }, transaction: trx }),
      // MovimientoBancoTesoreria.findAll({ where: { comprobanteegreso_id: compId }, transaction: trx }),
      MovimientoCajaTesoreria.findAll({
        where: {
          comprobanteegreso_id: compId,
          anulado: { [Op.not]: true },
        },
        transaction: trx,
      }),

      MovimientoBancoTesoreria.findAll({
        where: {
          comprobanteegreso_id: compId,
          anulado: { [Op.not]: true },
        },
        transaction: trx,
      }),

      // si usas pagos con tarjeta ligados al comprobante:
      PagoTarjetaCredito?.findAll?.({ where: { comprobanteegreso_id: compId, anulado: { [Op.not]: true } }, transaction: trx }) || [],
      // si usas eCheqs ligados al comprobante:
      EcheqEmitido?.findAll?.({ where: { comprobanteegreso_id: compId, anulado: { [Op.not]: true } }, transaction: trx }) || [],
    ]);

    const pagosDirectos =
      (cajaComp || []).reduce((a, r) => a + Number(r.monto || 0), 0) +
      (bancoComp || []).reduce((a, r) => a + Number(r.monto || 0), 0) +
      (tarjetaComp || []).reduce((a, r) => a + Number(r.importe || 0), 0) +
      (echeqComp || []).reduce((a, r) => a + Number(r.importe || 0), 0);

    // Abonos aplicados remanentes
    const cargosComp = await MovimientoCtaCteProveedor.findAll({
      where: { comprobanteegreso_id: compId, tipo: "cargo", anulado: { [Op.not]: true } },
      attributes: ["id"],
      transaction: trx,
    });
    const cargoIds = cargosComp.map((c) => c.id);

    let aplicadoAbonos = 0;
    if (cargoIds.length) {
      const applsRest = await MovimientoCtaCteProveedorAplic.findAll({
        where: { cargo_id: { [Op.in]: cargoIds } },
        attributes: ["importe"],
        transaction: trx,
      });
      aplicadoAbonos = (applsRest || []).reduce((acc, a) => acc + Number(a.importe || 0), 0);
    }

    const pagadoReal = pagosDirectos + aplicadoAbonos;
    const saldo = Math.max(0, Number((totalComp - pagadoReal).toFixed(2)));

    let estadoComp = "impaga";
    if (Math.abs(saldo) <= EPS) estadoComp = "pagada";
    else if (pagadoReal > EPS && saldo > EPS) estadoComp = "parcial";

    const patchComp = { saldo };
    if ("estadopago" in comp.dataValues) patchComp.estadopago = estadoComp;
    if ("estado" in comp.dataValues) patchComp.estado = estadoComp;

    await comp.update(patchComp, { transaction: trx });

    console.log("[recalcComprobanteEgreso]", { compId, totalComp, pagosDirectos, aplicadoAbonos, pagadoReal, saldo, estadoComp });
  }

  try {
    const id = Number(req.params.id || 0);
    if (!id) throw new Error("ID inválido");

    console.log("🗑️ Iniciando eliminación de MovimientoCajaTesoreria ID:", id);

    // 1) Traer el movimiento de caja
    const mov = await MovimientoCajaTesoreria.findByPk(id, { transaction: t });
    if (!mov) throw new Error("Movimiento de caja no encontrado");

    console.log("🔎 Movimiento:", {
      id: mov.id,
      tipo: mov.tipo,
      monto: mov.monto,
      fecha: mov.fecha,
      empresa_id: mov.empresa_id,
      caja_id: mov.caja_id,
      referencia_tipo: mov.referencia_tipo,
      referencia_id: mov.referencia_id,
      ordenpago_id: mov.ordenpago_id,
      comprobanteegreso_id: mov.comprobanteegreso_id,
      categoriaegreso_id: mov.categoriaegreso_id,
      proveedor_id: mov.proveedor_id,
    });

    // === Banderas normalizadas ===
    const ref = String(mov.referencia_tipo || "").trim().toLowerCase();
    const hasComp = !!mov.comprobanteegreso_id;
    const hasOP = !!mov.ordenpago_id;
    const provIsNull = mov.proveedor_id === null || mov.proveedor_id === undefined;
    const provExists = !!mov.proveedor_id;

    // ============================================================
    // PAGO PROGRAMADO YA ACREDITADO
    // ============================================================

    if (ref === "pagoprogramadotesoreria" && mov.referencia_id) {

      console.log(
        "📅 Caso PAGO PROGRAMADO ACREDITADO desde CAJA:",
        mov.referencia_id
      );

      const pagoProgramado =
        await PagoProgramadoTesoreria.findByPk(
          mov.referencia_id,
          {
            transaction: t,
            lock: t.LOCK.UPDATE,
          }
        );

      if (!pagoProgramado) {
        throw new Error(
          "No se encontró el PagoProgramadoTesoreria asociado al movimiento."
        );
      }

      if (pagoProgramado.estado !== "acreditado") {
        throw new Error(
          `El pago programado asociado se encuentra en estado ${pagoProgramado.estado}.`
        );
      }

      if (
        String(pagoProgramado.medio || "")
          .trim()
          .toLowerCase() !== "caja"
      ) {
        throw new Error(
          "El PagoProgramadoTesoreria asociado no corresponde a un pago por caja."
        );
      }

      const comprobanteId =
        mov.comprobanteegreso_id ||
        pagoProgramado.comprobanteegreso_id ||
        null;


      // ============================================================
      // SI ERA ANTICIPO A PROVEEDOR
      // ============================================================

      if (
        String(pagoProgramado.tipo || "").toLowerCase() === "anticipo" &&
        pagoProgramado.movimiento_ctacte_id
      ) {

        const abono =
          await MovimientoCtaCteProveedor.findByPk(
            pagoProgramado.movimiento_ctacte_id,
            {
              transaction: t,
              lock: t.LOCK.UPDATE,
            }
          );

        if (abono) {

          // ========================================================
          // Buscar aplicaciones realizadas con este anticipo
          // ========================================================

          const aplicaciones =
            await MovimientoCtaCteProveedorAplic.findAll({
              where: {
                abono_id: abono.id,
              },
              transaction: t,
              lock: t.LOCK.UPDATE,
            });


          // ========================================================
          // Guardar comprobantes que deberán recalcularse
          // ========================================================

          const comprobantesARecalcular =
            new Set();


          if (aplicaciones.length) {

            const cargoIds = [
              ...new Set(
                aplicaciones
                  .map(a => Number(a.cargo_id))
                  .filter(Boolean)
              ),
            ];


            if (cargoIds.length) {

              const cargos =
                await MovimientoCtaCteProveedor.findAll({
                  where: {
                    id: {
                      [Op.in]: cargoIds,
                    },
                  },

                  attributes: [
                    "id",
                    "comprobanteegreso_id",
                  ],

                  transaction: t,
                });


              for (const cargo of cargos) {

                const compId =
                  Number(
                    cargo.comprobanteegreso_id || 0
                  );

                if (compId) {
                  comprobantesARecalcular.add(
                    compId
                  );
                }
              }
            }


            // ======================================================
            // Eliminar aplicaciones del anticipo
            // ======================================================

            await MovimientoCtaCteProveedorAplic.destroy({
              where: {
                abono_id: abono.id,
              },
              transaction: t,
            });
          }


          // ========================================================
          // Si el propio abono estaba asociado a un comprobante
          // también debemos recalcularlo
          // ========================================================

          if (abono.comprobanteegreso_id) {

            comprobantesARecalcular.add(
              Number(
                abono.comprobanteegreso_id
              )
            );
          }


          // ========================================================
          // Eliminar ABONO de Cta.Cte.
          // ========================================================

          await abono.destroy({
            transaction: t,
          });


          // ========================================================
          // Recalcular comprobantes afectados
          // ========================================================

          for (
            const compId
            of comprobantesARecalcular
          ) {

            await recalcComprobanteEgreso(
              compId,
              t
            );
          }
        }
      }

      // ============================================================
      // ELIMINAR MOVIMIENTO REAL DE CAJA
      // ============================================================

      await mov.destroy({
        transaction: t,
      });


      // ============================================================
      // ANULAR PAGO PROGRAMADO
      //
      // IMPORTANTE:
      // NO vuelve a pendiente.
      // NO recreamos el compromiso futuro.
      // ============================================================

      await pagoProgramado.update(
        {
          estado: "anulado",

          movimiento_tipo: null,
          movimiento_id: null,

          fecha_acreditacion: null,
        },
        {
          transaction: t,
        }
      );


      // ============================================================
      // RECALCULAR COMPROBANTE
      // ============================================================

      let resultadoComprobante = null;

      if (comprobanteId) {

        resultadoComprobante =
          await recalcularComprobanteEgreso(
            comprobanteId,
            t
          );
      }


      await t.commit();


      return res.json({
        ok: true,

        mensaje:
          pagoProgramado.tipo === "anticipo"
            ? "Pago programado acreditado eliminado. Se eliminó el movimiento de caja y el anticipo de cuenta corriente."
            : "Pago programado acreditado eliminado. Se eliminó el movimiento de caja.",

        pagoProgramado_id:
          pagoProgramado.id,

        comprobante:
          resultadoComprobante,
      });
    }

    // 1) Pago de Comprobante
    const isPagoDeComprobante = hasComp && (ref === "comprobanteegreso" || ref === "ordenpago");

    // 2) Depósito
    const isDeposito = !hasComp && ref === "ordenpago" && hasOP && provIsNull;

    // 3) Retiro sucursal
    const isRetiroSucursal = ref === "retirosucursal";

    // 4) Egreso Varios (con proveedor, sin comp)
    const isEgresoVarios = !hasComp && ref === "ordenpago" && hasOP && provExists;

    // Sueldos
    const isPagoSueldoCaja = ref === "pagosueldoempleado";
    const isAdelantoCaja = ref === "adelantoempleado";

    // set de comprobantes a recalcular (de aplicaciones y/o del propio abono)  // (NUEVO)
    const compIdsFromAnticipoAplic = new Set();

    // 2) Eliminar aplicaciones a gasto estimado que referencian al movimiento
    console.log("🔎 Buscando GastoEstimadoPago referenciando al movimiento...");
    const pagosGE = await GastoEstimadoPago.findAll({
      where: { referencia_tipo: "MovimientoCajaTesoreria", referencia_id: mov.id },
      transaction: t,
    });

    if (pagosGE.length) {
      console.log(`🧹 Se eliminarán ${pagosGE.length} GastoEstimadoPago`);
      const byInstancia = new Map();
      for (const pg of pagosGE) {
        const instId = Number(pg.gastoestimado_instancia_id || 0);
        const aplicado = Number(pg.monto_aplicado || 0);
        if (instId) {
          if (!byInstancia.has(instId)) byInstancia.set(instId, 0);
          byInstancia.set(instId, byInstancia.get(instId) + aplicado);
        }
        await pg.destroy({ transaction: t });
      }

      // Recalcular instancias
      for (const [instId] of byInstancia) {
        const inst = await GastoEstimadoInstancia.findByPk(instId, { transaction: t });
        if (!inst) continue;

        const restantes = await GastoEstimadoPago.findAll({
          where: { gastoestimado_instancia_id: instId },
          transaction: t,
        });
        const newPagado = (restantes || []).reduce((acc, p) => acc + Number(p.monto_aplicado || 0), 0);

        const base = Number(inst.monto_real ?? inst.monto_estimado ?? 0);
        const nuevoSaldo = Math.max(0, base - newPagado);
        let estado = inst.estado;

        if (newPagado <= EPS) estado = "pendiente";
        else if (nuevoSaldo <= EPS) estado = "pagado";
        else estado = "parcial";

        console.log(`♻️ Recalculando instancia #${instId} => pagado=${newPagado}, estado=${estado}`);
        await inst.update({ monto_pagado: newPagado, estado }, { transaction: t });
      }
    }

    // ⚠️ IMPORTANTE: si es pago de comprobante, NO limpiar acá los mov_ctacte_proveedor,
    // porque la rama "💳 Caso PAGO DE COMPROBANTE" maneja el abono y sus aplicaciones.
    if (!isPagoDeComprobante) {
      // 3) Limpiar mov_ctacte_proveedor relacionados al movimiento (y sus aplicaciones)
      console.log("🔎 Buscando MovimientoCtaCteProveedor referenciando al movimiento...");
      const ctacteRefs = await MovimientoCtaCteProveedor.findAll({
        where: { referencia_tipo: "MovimientoCajaTesoreria", referencia_id: mov.id },
        transaction: t,
      });

      if (ctacteRefs.length) {
        console.log(`🧹 Se eliminarán ${ctacteRefs.length} movimientos de CtaCteProveedor vinculados al movimiento`);
        for (const c of ctacteRefs) {
          const abonoId = c.id;

          // (NUEVO) si el ABONO mismo tiene comprobante, lo recolectamos para recalcular
          const compIdFromAbono = Number(c.comprobanteegreso_id || 0);      // (NUEVO)
          if (compIdFromAbono) compIdsFromAnticipoAplic.add(compIdFromAbono); // (NUEVO)

          if (MovimientoCtaCteProveedorAplic) {
            // Traigo aplicaciones del abono para detectar cargos y de allí sus comprobantes
            const appls = await MovimientoCtaCteProveedorAplic.findAll({
              where: { abono_id: abonoId },
              transaction: t,
            });
            if (appls.length) {
              const cargoIds = [...new Set(appls.map((a) => Number(a.cargo_id)).filter(Boolean))];
              if (cargoIds.length) {
                const cargosDeAppl = await MovimientoCtaCteProveedor.findAll({
                  where: { id: { [Op.in]: cargoIds } },
                  attributes: ["id", "comprobanteegreso_id"],
                  transaction: t,
                });
                for (const cg of cargosDeAppl) {
                  const compId = Number(cg.comprobanteegreso_id || 0);
                  if (compId) compIdsFromAnticipoAplic.add(compId);
                }
              }

              console.log(`    🗑️ Eliminando ${appls.length} aplicaciones (mov_ctacte_proveedor_aplic) del abono #${abonoId}`);
              for (const a of appls) {
                await a.destroy({ transaction: t });
              }
            }
          }

          await c.destroy({ transaction: t });
        }
      }
    }

    // 🔁 Helper local para recalcular todos los comprobantes recolectados  // (NUEVO)
    const recalcRecolectados = async () => {
      if (compIdsFromAnticipoAplic.size > 0) {
        console.log("♻️ Recalculando comprobantes recolectados:", [...compIdsFromAnticipoAplic]);
        for (const compId of compIdsFromAnticipoAplic) {
          await recalcComprobanteEgreso(compId, t);
        }
      }
    };

    // 3.5) 🚩 Caso RETIRO DE SUCURSAL
    if (isRetiroSucursal) {
      console.log("🏧 Caso RETIRO DE SUCURSAL: eliminar sobres (RetiroTesoreria) y luego el movimiento de caja…");

      const whereSobres = { movimiento_id: mov.id };
      const cantSobres = await RetiroTesoreria.count({ where: whereSobres, transaction: t });
      if (cantSobres > 0) {
        console.log(`🗑️ Eliminando ${cantSobres} sobres de RetiroTesoreria asociados al movimiento #${mov.id}`);
        await RetiroTesoreria.destroy({ where: whereSobres, transaction: t });
      } else {
        console.log("ℹ️ No se encontraron sobres para este movimiento (ya estaban eliminados).");
      }

      // Eliminar el movimiento de caja
      console.log("🗑️ Eliminando MovimientoCajaTesoreria (retiro de sucursal)...");
      await mov.destroy({ transaction: t });

      // (NUEVO) Recalcular si quedaron comprobantes detectados
      await recalcRecolectados();

      await t.commit();
      console.log("✅ Eliminación completada (retiro de sucursal).");
      return res.json({
        ok: true,
        mensaje: "Retiros eliminados y movimiento de caja borrado (retiro de sucursal).",
        sobres_eliminados: cantSobres,
      });
    }

    // 3.6) 👷 Pago de sueldo
    if (isPagoSueldoCaja) {
      console.log("🧾 Caso PAGO DE SUELDO (CAJA): eliminar PagoSueldoEmpleado + movimiento de caja…");

      const pagoId = Number(mov.referencia_id || 0);
      if (!pagoId) {
        console.warn("⚠️ Movimiento tiene referencia_tipo=PagoSueldoEmpleado pero referencia_id vacío. Se elimina solo el movimiento.");
        await mov.destroy({ transaction: t });

        await recalcRecolectados(); // (NUEVO)

        await t.commit();
        return res.json({ ok: true, mensaje: "Movimiento de caja eliminado (referencia de pago sueldos inválida)." });
      }

      const pago = await PagoSueldoEmpleado.findByPk(pagoId, { transaction: t });
      if (!pago) {
        console.warn(`⚠️ PagoSueldoEmpleado #${pagoId} no encontrado. Se elimina solo el movimiento.`);
        await mov.destroy({ transaction: t });

        await recalcRecolectados(); // (NUEVO)

        await t.commit();
        return res.json({ ok: true, mensaje: "Movimiento de caja eliminado (PagoSueldoEmpleado no encontrado)." });
      }

      await pago.destroy({ transaction: t });
      await mov.destroy({ transaction: t });

      await recalcRecolectados(); // (NUEVO)

      await t.commit();
      console.log("✅ Eliminación completada (Pago de sueldo por CAJA).");
      return res.json({
        ok: true,
        mensaje: "Pago de sueldo y movimiento de caja eliminados correctamente.",
        detalle: { pago_id: pagoId, movimiento_id: mov.id },
      });
    }

    // 3.7) 👷 Adelanto de sueldo
    if (isAdelantoCaja) {
      console.log("🧾 Caso ADELANTO DE SUELDO (CAJA): eliminar AdelantoEmpleado + movimiento de caja…");

      const adelantoId = Number(mov.referencia_id || 0);
      if (!adelantoId) {
        console.warn("⚠️ Movimiento tiene referencia_tipo=AdelantoEmpleado pero referencia_id vacío. Se elimina solo el movimiento.");
        await mov.destroy({ transaction: t });

        await recalcRecolectados(); // (NUEVO)

        await t.commit();
        return res.json({ ok: true, mensaje: "Movimiento de caja eliminado (referencia de adelanto inválida)." });
      }

      const adelanto = await AdelantoEmpleado.findByPk(adelantoId, { transaction: t });
      if (!adelanto) {
        console.warn(`⚠️ AdelantoEmpleado #${adelantoId} no encontrado. Se elimina solo el movimiento.`);
        await mov.destroy({ transaction: t });

        await recalcRecolectados(); // (NUEVO)

        await t.commit();
        return res.json({ ok: true, mensaje: "Movimiento de caja eliminado (AdelantoEmpleado no encontrado)." });
      }

      await adelanto.destroy({ transaction: t });
      await mov.destroy({ transaction: t });

      await recalcRecolectados(); // (NUEVO)

      await t.commit();
      console.log("✅ Eliminación completada (Adelanto por CAJA).");
      return res.json({
        ok: true,
        mensaje: "Adelanto y movimiento de caja eliminados correctamente.",
        detalle: { adelanto_id: adelantoId, movimiento_id: mov.id },
      });
    }

    // 4) 💳 Pago de comprobante (maneja su propio abono)
    if (isPagoDeComprobante) {
      console.log("💳 Caso PAGO DE COMPROBANTE: eliminar caja y recalcular estado del comprobante…");

      const comp = await ComprobanteEgreso.findByPk(mov.comprobanteegreso_id, { transaction: t });
      if (!comp) throw new Error("Comprobante asociado no encontrado");

      const orden = mov.ordenpago_id ? await OrdenPago.findByPk(mov.ordenpago_id, { transaction: t }) : null;

      const montoDelMov = Number(mov.monto || 0);

      // 4.1 Eliminar movimiento de caja
      console.log("🗑️ Eliminando MovimientoCajaTesoreria (pago efectivo del comprobante)...");
      await mov.destroy({ transaction: t });

      // 4.2 Verificar si existe un ABONO en CtaCte vinculado a este movimiento de CAJA
      let debeCrearCargo = true;

      const abonoRef = await MovimientoCtaCteProveedor.findOne({
        where: {
          referencia_tipo: "MovimientoCajaTesoreria",
          referencia_id: id, // ← id del mov borrado
          tipo: "abono",
          anulado: { [Op.not]: true },
        },
        transaction: t,
      });

      if (abonoRef) {
        // Eliminar aplicaciones del abono
        const appls = await MovimientoCtaCteProveedorAplic.findAll({
          where: { abono_id: abonoRef.id },
          transaction: t,
        });
        if (appls.length) {
          await MovimientoCtaCteProveedorAplic.destroy({
            where: { abono_id: abonoRef.id },
            transaction: t,
          });
        }

        // Eliminar el abono
        await abonoRef.destroy({ transaction: t });

        // Como existía ABONO referenciado a este movimiento, NO creamos CARGO nuevo
        debeCrearCargo = false;
      }

      // 4.3 Recalcular el comprobante desde cero (robusto)
      await recalcComprobanteEgreso(comp.id, t);

      // 4.4 (condicional) Crear CARGO solo si no había abono ligado al movimiento
      if (debeCrearCargo) {
        const descCtaCte = `Reversión pago en caja de comp. ${comp.nrocomprobante ?? comp.id}`;
        const fechaCtaCte = mov.fecha || comp.fechacomprobante || new Date().toISOString().slice(0, 10);

        await MovimientoCtaCteProveedor.create(
          {
            proveedor_id: comp.proveedor_id || mov.proveedor_id || null,
            empresa_id: comp.empresa_id || mov.empresa_id || null,
            fecha: fechaCtaCte,
            fecha_pago: fechaCtaCte,
            descripcion: descCtaCte,
            tipo: "cargo",
            importe: montoDelMov,
            origen_tipo: "ComprobanteEgreso",
            origen_id: comp.id,
            comprobanteegreso_id: comp.id,
            anulado: false,
            ordenpago_id: null,
            formapago_id: mov.formapago_id || comp.formapago_id || null,
          },
          { transaction: t }
        );
      }

      // 4.5 Ajustar/eliminar Orden de Pago
      if (orden) {
        const newTotal = Math.max(0, Number(orden.total || 0) - montoDelMov);
        if (Math.abs(Number(orden.total || 0) - montoDelMov) <= EPS) {
          console.log("   🗑️ Eliminando Orden de Pago (quedó en cero por la baja del efectivo)...");
          await orden.destroy({ transaction: t });
          if (Number(comp.ordenpago_id || 0) === Number(orden.id)) {
            await comp.update({ ordenpago_id: null }, { transaction: t });
          }
        } else {
          console.log(`   ➤ Orden total: ${orden.total} ⇒ ${newTotal}`);
          await orden.update({ total: newTotal }, { transaction: t });
        }
      }

      await t.commit();
      console.log("✅ Eliminación completada (pago de comprobante).");
      return res.json({ ok: true, mensaje: "Movimiento de caja eliminado y comprobante recalculado." });
    }

    // 4.5) 💼 Anticipo (OP origen 'anticipo')
    let handledAnticipo = false;
    try {
      if (ref === "ordenpago" && hasOP && !isPagoDeComprobante) {
        const ordenAnt = await OrdenPago.findByPk(mov.ordenpago_id, { transaction: t });
        if (ordenAnt && String(ordenAnt.origen || "").toLowerCase() === "anticipo") {
          handledAnticipo = true;
          console.log("💼 Detectado caso ANTICIPO: OP", ordenAnt.id);

          // 1) Eliminar el movimiento de caja (efectivo del anticipo)
          const montoDelMov = Number(mov.monto || 0);
          const compVincMov = Number(mov.comprobanteegreso_id || 0) || null;
          console.log("🗑️ Eliminando MovimientoCajaTesoreria (anticipo)...");
          await mov.destroy({ transaction: t });

          // 2) Ajustar / eliminar la OP de anticipo
          const newTotalOP = Math.max(0, Number(ordenAnt.total || 0) - montoDelMov);
          let opFueEliminada = false;

          if (Math.abs(Number(ordenAnt.total || 0) - montoDelMov) <= EPS) {
            console.log("   🗑️ Eliminando Orden de Pago (quedó en cero por la baja del anticipo)...");
            await ordenAnt.destroy({ transaction: t });
            opFueEliminada = true;
          } else {
            const patchOP = { total: newTotalOP, estado: "pendiente_aplicacion" };
            await ordenAnt.update(patchOP, { transaction: t });
          }

          // 3) Recalcular comprobantes afectados
          if (compVincMov) compIdsFromAnticipoAplic.add(compVincMov);

          await recalcRecolectados(); // (NUEVO)

          await t.commit();
          console.log("✅ Eliminación completada (anticipo).");
          return res.json({
            ok: true,
            mensaje: "Anticipo eliminado, aplicaciones revertidas y comprobantes recalculados.",
            ordenpago_eliminada: opFueEliminada,
            comprobantes_recalculados: Array.from(compIdsFromAnticipoAplic),
          });
        }
      }
    } catch (e) {
      console.warn("⚠️ Error manejando rama ANTICIPO (se continuará con el flujo normal):", e);
    }

    // 5) 🏦 Depósito (sin proveedor)
    if (isDeposito) {
      console.log("🏦 Caso DEPÓSITO: eliminar caja + pareja bancaria asociada a la misma Orden de Pago…");

      const orden = await OrdenPago.findByPk(mov.ordenpago_id, { transaction: t });
      if (!orden) {
        console.warn("⚠️ Orden de pago asociada al depósito no encontrada. Se elimina solo el movimiento de caja.");
      }

      const parejaBanco = orden
        ? await MovimientoBancoTesoreria.findOne({
          where: {
            referencia_tipo: "OrdenPago",
            referencia_id: orden.id,
            comprobanteegreso_id: { [Op.or]: [null, 0] },
            tipo: "ingreso",
          },
          transaction: t,
        })
        : null;

      if (parejaBanco) {
        console.log("🗑️ Eliminando pareja bancaria del depósito:", parejaBanco.id);
        await parejaBanco.destroy({ transaction: t });
      } else {
        console.log("ℹ️ No se encontró pareja bancaria para este depósito (puede haber sido borrada antes).");
      }

      console.log("🗑️ Eliminando MovimientoCajaTesoreria (depósito)...");
      await mov.destroy({ transaction: t });

      if (orden) {
        const montoDelMov = Number(mov.monto || 0);
        const newTotal = Math.max(0, Number(orden.total || 0) - montoDelMov);

        if (Math.abs(Number(orden.total || 0) - montoDelMov) <= EPS) {
          console.log("   🗑️ Eliminando Orden de Pago (quedó en cero por la baja del depósito)...");
          await orden.destroy({ transaction: t });
        } else {
          console.log(`   ➤ Orden total: ${orden.total} ⇒ ${newTotal}`);
          await orden.update({ total: newTotal }, { transaction: t });
        }
      }

      await recalcRecolectados(); // (NUEVO)

      await t.commit();
      console.log("✅ Eliminación completada (depósito).");
      return res.json({ ok: true, mensaje: "Depósito eliminado correctamente." });
    }

    // 5.1) 🧾 Egreso varios (con proveedor, sin comp)
    if (isEgresoVarios) {
      console.log("🧾 Caso EGRESO VARIOS: eliminar movimiento de caja + ajustar/eliminar OP (NO tocar banco).");

      const orden = await OrdenPago.findByPk(mov.ordenpago_id, { transaction: t });
      if (!orden) {
        console.warn("⚠️ Orden de pago asociada no encontrada. Se elimina solo el movimiento de caja.");
      }

      // Eliminar movimiento de caja
      console.log("🗑️ Eliminando MovimientoCajaTesoreria (egreso varios)...");
      await mov.destroy({ transaction: t });

      // Ajustar/eliminar OP
      if (orden) {
        const montoDelMov = Number(mov.monto || 0);
        const newTotal = Math.max(0, Number(orden.total || 0) - montoDelMov);

        if (Math.abs(Number(orden.total || 0) - montoDelMov) <= EPS) {
          console.log("   🗑️ Eliminando Orden de Pago (quedó en cero por la baja del egreso varios)...");
          await orden.destroy({ transaction: t });
        } else {
          console.log(`   ➤ Orden total: ${orden.total} ⇒ ${newTotal}`);
          await orden.update({ total: newTotal }, { transaction: t });
        }
      }

      await recalcRecolectados(); // (NUEVO)

      await t.commit();
      console.log("✅ Eliminación completada (egreso varios).");
      return res.json({ ok: true, mensaje: "Egreso varios eliminado correctamente." });
    }

    // 6) Genérico
    console.log("📄 Caso genérico (egreso independiente): se elimina el movimiento y se ajustan vínculos simples.");
    await mov.destroy({ transaction: t });

    // Recalcular comprobantes recolectados por abonos/aplicaciones (si los hubo)  // (NUEVO)
    await recalcRecolectados();

    // Defensa: si por cualquier motivo había comprobante asociado al mov, recalc
    if (mov.comprobanteegreso_id) {
      await recalcComprobanteEgreso(Number(mov.comprobanteegreso_id), t);
    }

    await t.commit();
    console.log("✅ Eliminación completada (genérico).");
    return res.json({ ok: true, mensaje: "Movimiento de caja eliminado." });
  } catch (error) {
    await t.rollback();
    console.error("❌ eliminarMovimientoCajaTesoreria:", error);
    return res.status(400).json({ error: error.message || "No se pudo eliminar el movimiento de caja" });
  }
};


export const registrarEgresoCajaIndependiente = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const {
      empresa_id,
      idempotencyKey,
      egreso,
    } = req.body;

    if (!empresa_id) throw new Error("empresa_id requerido");
    if (!egreso || typeof egreso !== "object") throw new Error("Datos de egreso inválidos");

    const normaliza = (n) => Number(n) || 0;

    const fecha = egreso.fecha || new Date().toISOString().slice(0, 10);
    const monto = normaliza(egreso.monto);
    if (monto <= 0) throw new Error("Monto inválido");
    if (!egreso.caja_id) throw new Error("caja_id requerido");
    if (!egreso.descripcion) throw new Error("descripcion requerida");

    // SIEMPRE se exige proveedor/entidad
    if (!egreso.proveedor_id) throw new Error("proveedor_id requerido para egresos varios");

    // La categoría es la fuente de la imputación contable
    if (!egreso.categoriaegreso_id) {
      throw new Error("categoriaegreso_id requerido");
    }

    // Derivar imputación contable si no viene explícita, usando la categoría
    let imputacion = egreso.imputacioncontable_id || null;
    if (!imputacion && egreso.categoriaegreso_id) {
      const cat = await CategoriaEgreso.findByPk(egreso.categoriaegreso_id, { transaction: t });
      if (cat?.imputacioncontable_id) imputacion = cat.imputacioncontable_id;
    }
    if (!imputacion) throw new Error("imputacioncontable_id requerido (directo o derivado de la categoría)");


    // Idempotencia: si llega un idempotencyKey ya usado, retornamos la orden existente
    if (idempotencyKey) {
      const existente = await OrdenPago.findOne({
        where: { idempotency_key: idempotencyKey },
        transaction: t,
      });
      if (existente) {
        await t.commit();
        return res.status(200).json({ ok: true, reutilizado: true, ordenpago: existente });
      }
    }

    // 1) Crear Orden de Pago "pendiente_aplicacion" (aún sin comprobante)
    const orden = await OrdenPago.create(
      {
        empresa_id,
        proveedor_id: egreso.proveedor_id || null,
        comprobanteegreso_id: null,
        fecha,
        total: monto,
        estado: "pendiente_aplicacion",
        numero: null,
        observaciones: egreso.observaciones || null,
        origen: "egreso_varios",           // <- más explícito
        idempotency_key: idempotencyKey || null,
      },
      { transaction: t }
    );

    // 2) Crear Movimiento de Caja (egreso) vinculado a la Orden
    const movimiento = await MovimientoCajaTesoreria.create(
      {
        empresa_id,
        tipo: "egreso",
        descripcion: egreso.descripcion,
        monto,
        fecha,
        caja_id: egreso.caja_id,
        formapago_id: egreso.formapago_id || null,
        referencia_id: orden.id,
        referencia_tipo: "OrdenPago",
        observaciones: egreso.observaciones || null,
        anulado: false,
        ordenpago_id: orden.id,
        categoriaegreso_id: egreso.categoriaegreso_id || null,
        imputacioncontable_id: imputacion || null,
        idempotency_key: idempotencyKey || null,
        proveedor_id: egreso.proveedor_id || null,
      },
      { transaction: t }
    );

    await t.commit();
    return res.status(201).json({
      ok: true,
      mensaje: "Egreso de caja registrado. Orden de pago pendiente de aplicación creada.",
      ordenpago: orden,
      movimiento,
    });
  } catch (error) {
    await t.rollback();
    console.error("❌ registrarEgresoCajaIndependiente:", error);
    return res.status(400).json({ error: error.message || "No se pudo registrar el egreso de caja" });
  }
};

/**
 * PUT /tesoreria/caja/egresos/:ordenpago_id/anular
 * Anula una OrdenPago independiente (y sus movimientos de caja) si aún no fue aplicada a un comprobante.
 */
export const anularEgresoCajaIndependiente = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { ordenpago_id } = req.params;

    const orden = await OrdenPago.findByPk(ordenpago_id, { transaction: t });
    if (!orden) throw new Error("Orden de pago no encontrada");

    if (orden.comprobanteegreso_id) {
      throw new Error("La orden ya fue aplicada a un comprobante y no se puede anular");
    }
    if (orden.estado === "anulada") {
      throw new Error("La orden ya está anulada");
    }

    await orden.update({ estado: "anulada" }, { transaction: t });

    await MovimientoCajaTesoreria.update(
      {
        anulado: true,
        observaciones: sequelize.literal(
          `COALESCE(observaciones,'') || ' | Anulado el ' || CURRENT_DATE`
        ),
      },
      { where: { ordenpago_id }, transaction: t }
    );

    await t.commit();
    return res.json({ ok: true, mensaje: "Orden y movimiento(s) anulados" });
  } catch (error) {
    await t.rollback();
    console.error("❌ anularEgresoCajaIndependiente:", error);
    return res.status(400).json({ error: error.message || "No se pudo anular" });
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

export const registrarAnticipoProveedor = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const {
      empresa_id,
      proveedor_id,
      fecha,                 // opcional (si no, toma la de los pagos o hoy)
      observaciones,
      pagos = [],            // [{ medio: "caja", caja_id, monto, fecha, detalle, categoriaegreso_id, imputacioncontable_id?, formapago_id? }]
      idempotencyKey,
    } = req.body;

    if (!empresa_id) throw new Error("empresa_id requerido");
    if (!proveedor_id) throw new Error("proveedor_id requerido");
    if (!Array.isArray(pagos) || pagos.length === 0) {
      throw new Error("Debe enviar al menos un pago");
    }

    const EPS = 0.009;
    const normaliza = (n) => Number(n) || 0;
    const medioDe = (p) => String(p.medio || "").toLowerCase();
    const esMedioCaja = (m) => m === "caja";

    // Validar y sumar pagos efectivos (por ahora trabajamos con CAJA; queda listo para ampliar)
    let total = 0;
    for (const p of pagos) {
      const medio = medioDe(p);
      const monto = normaliza(p.monto);
      if (!(monto > 0)) throw new Error("Monto de pago inválido");
      if (!esMedioCaja(medio)) {
        throw new Error("Por ahora solo se admite medio 'caja' en anticipos");
      }
      if (!p.caja_id) throw new Error("caja_id requerido para pago en caja");

      // Derivar imputación desde categoría si no vino explícita
      if (!p.imputacioncontable_id) {
        if (!p.categoriaegreso_id) throw new Error("categoriaegreso_id requerido en pagos de caja");
        const cat = await CategoriaEgreso.findByPk(p.categoriaegreso_id, { transaction: t });
        if (!cat) throw new Error("La categoría indicada no existe");
        if (!cat.imputacioncontable_id) throw new Error("La categoría no tiene imputación contable asociada");
        p.imputacioncontable_id = cat.imputacioncontable_id;
      }

      total += monto;
    }
    if (!(total > 0)) throw new Error("Importe total inválido");

    // Idempotencia: si ya existe la OP con esa key, devuelvo lo existente
    if (idempotencyKey) {
      const opExistente = await OrdenPago.findOne({
        where: { idempotency_key: idempotencyKey },
        transaction: t,
      });
      if (opExistente) {
        // Busco auxiliares (mov caja + cta cte) para devolver todo junto
        const movCaja = await MovimientoCajaTesoreria.findAll({
          where: { ordenpago_id: opExistente.id },
          transaction: t,
        });
        const ctaCte = await MovimientoCtaCteProveedor.findOne({
          where: { ordenpago_id: opExistente.id },
          transaction: t,
        });
        await t.commit();
        return res.status(200).json({
          ok: true,
          reutilizado: true,
          ordenpago: opExistente,
          movimientosCaja: movCaja,
          movCtaCte: ctaCte || null,
        });
      }
    }

    // Fecha de la OP: explícita o la primera de pagos o hoy
    const fechaOP =
      fecha ||
      pagos.find((p) => p.fecha)?.fecha ||
      new Date().toISOString().slice(0, 10);

    // 1) Crear Orden de Pago “pendiente_aplicacion”
    const orden = await OrdenPago.create(
      {
        empresa_id,
        proveedor_id,
        comprobanteegreso_id: null,
        fecha: fechaOP,
        total,
        estado: "pendiente_aplicacion", // por asignar a comprobante cuando llegue
        numero: null,
        observaciones: observaciones || null,
        origen: "anticipo_caja",
        idempotency_key: idempotencyKey || null,
      },
      { transaction: t }
    );

    // 2) Crear Movimientos de Caja (uno por pago enviado)
    const movsCaja = [];
    const movsCtaCte = []; // 👈 NUEVO: guardamos los CtaCte por pago

    for (let i = 0; i < pagos.length; i++) {
      const p = pagos[i];
      const fechaPago = p.fecha || fechaOP;

      const mov = await MovimientoCajaTesoreria.create(
        {
          empresa_id,
          tipo: "egreso",
          descripcion: p.detalle || `Anticipo a proveedor #${proveedor_id}`,
          monto: normaliza(p.monto),
          fecha: fechaPago,
          caja_id: p.caja_id,
          formapago_id: p.formapago_id || null,
          referencia_id: orden.id,
          referencia_tipo: "OrdenPago",
          observaciones: p.observaciones || null,
          anulado: false,
          ordenpago_id: orden.id,
          categoriaegreso_id: p.categoriaegreso_id || null,
          imputacioncontable_id: p.imputacioncontable_id || null,
          idempotency_key: p.idempotency_key || (idempotencyKey ? `${idempotencyKey}#${i}` : null),
          proveedor_id,
        },
        { transaction: t }
      );
      movsCaja.push(mov);
      // 3) Movimiento de Cuenta Corriente (tipo "pago")
      const movCtaCte = await MovimientoCtaCteProveedor.create(
        {
          proveedor_id,
          empresa_id,
          fecha: fechaPago,
          fecha_pago: fechaPago,
          descripcion: `Anticipo proveedor desde Caja - OP #${orden.id}`,
          tipo: "abono",                 // disminuye deuda / genera saldo a favor
          importe: normaliza(p.monto),   // 👈 importe del pago individual
          origen_tipo: "OrdenPago",
          origen_id: orden.id,
          comprobanteegreso_id: null,
          anulado: false,
          ordenpago_id: orden.id,
          // 👇 campos que pediste
          referencia_tipo: "MovimientoCajaTesoreria",
          referencia_id: mov.id,
          formapago_id: p.formapago_id || null,
        },
        { transaction: t }
      );
      movsCtaCte.push(movCtaCte);
    }

    await t.commit();
    return res.status(201).json({
      ok: true,
      mensaje: "Anticipo registrado. OP creada y aplicado a Cta Cte.",
      ordenpago: orden,
      movimientosCaja: movsCaja,
      movimientosCtaCte: movsCtaCte, // 👈 devolvemos todos los CtaCte creados
    });
  } catch (error) {
    await t.rollback();
    console.error("❌ registrarAnticipoProveedor:", error);
    return res.status(400).json({ error: error.message || "No se pudo registrar el anticipo" });
  }
};

export const registrarDepositoBancario = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { empresa_id, idempotencyKey, deposito } = req.body;

    if (!empresa_id) throw new Error("empresa_id requerido");
    if (!deposito || typeof deposito !== "object") throw new Error("Datos de depósito inválidos");

    const N = (n) => Number(n) || 0;

    const fecha = deposito.fecha || new Date().toISOString().slice(0, 10);
    const monto = N(deposito.monto);
    if (monto <= 0) throw new Error("Monto inválido");
    if (!deposito.caja_id) throw new Error("caja_id requerido");
    if (!deposito.banco_id) throw new Error("banco_id requerido");
    if (!deposito.descripcion) throw new Error("descripcion requerida");
    if (!deposito.categoriaegreso_id) throw new Error("categoriaegreso_id requerido");

    // Derivar imputación desde categoría (si no viene explícita)
    let imputacion = deposito.imputacioncontable_id || null;
    if (!imputacion && deposito.categoriaegreso_id) {
      const cat = await CategoriaEgreso.findByPk(deposito.categoriaegreso_id, { transaction: t });
      if (cat?.imputacioncontable_id) imputacion = cat.imputacioncontable_id;
    }
    if (!imputacion) throw new Error("imputacioncontable_id requerido (derivado de la categoría)");

    // Idempotencia por OrdenPago
    if (idempotencyKey) {
      const existente = await OrdenPago.findOne({
        where: { idempotency_key: idempotencyKey },
        transaction: t,
      });
      if (existente) {
        await t.commit();
        return res.status(200).json({ ok: true, reutilizado: true, ordenpago: existente });
      }
    }

    // 1) Orden de pago (cerrada: aplicada)
    const orden = await OrdenPago.create(
      {
        empresa_id,
        proveedor_id: deposito.proveedor_id || null, // opcional “entidad”/empresa
        comprobanteegreso_id: null,
        fecha,
        total: monto,
        estado: "aplicada",
        numero: null,
        observaciones: deposito.observaciones || null,
        origen: "deposito_bancario",
        idempotency_key: idempotencyKey || null,
      },
      { transaction: t }
    );

    // 2) Movimiento de Caja (EGRESO)
    const movCaja = await MovimientoCajaTesoreria.create(
      {
        empresa_id,
        tipo: "egreso",
        descripcion: deposito.descripcion || `Depósito bancario a banco #${deposito.banco_id}`,
        monto,
        fecha,
        caja_id: deposito.caja_id,
        formapago_id: deposito.formapago_id || null,
        referencia_id: orden.id,
        referencia_tipo: "OrdenPago",
        observaciones: deposito.observaciones || null,
        anulado: false,
        ordenpago_id: orden.id,
        categoriaegreso_id: deposito.categoriaegreso_id || null,
        imputacioncontable_id: imputacion || null,
        idempotency_key: idempotencyKey || null,
      },
      { transaction: t }
    );

    // 3) Movimiento Banco (INGRESO)
    const movBanco = await MovimientoBancoTesoreria.create(
      {
        tipo: "ingreso",
        descripcion: deposito.descripcion || `Depósito desde caja (OP #${orden.id})`,
        monto,
        fecha,
        banco_id: deposito.banco_id,
        empresa_id,
        formapago_id: deposito.formapago_id || null,
        referencia_id: orden.id,
        referencia_tipo: "OrdenPago",
        observaciones: deposito.observaciones || null,
        anulado: false,
        ordenpago_id: orden.id,
      },
      { transaction: t }
    );

    await t.commit();
    return res.status(201).json({
      ok: true,
      mensaje: "Depósito bancario registrado correctamente.",
      ordenpago: orden,
      movimientoCaja: movCaja,
      movimientoBanco: movBanco,
    });
  } catch (error) {
    await t.rollback();
    console.error("❌ registrarDepositoBancario:", error);
    return res.status(400).json({ error: error.message || "No se pudo registrar el depósito bancario" });
  }
};

export const registrarIngresoVarios = async (req, res, next) => {
  const t = await sequelize.transaction();
  try {
    const {
      empresa_id,
      caja_id,
      fecha,
      descripcion,
      montoTotal,
      proyecto_id = null,
      categoriaingreso_id = null,
      observaciones = null,
      formacobro_id = null,    // id de forma "Caja/Efectivo"
      idempotencyKey = null,
    } = req.body || {};

    // Validaciones básicas
    if (!empresa_id || !caja_id) {
      await t.rollback();
      return res.status(400).json({ error: "empresa_id y caja_id son requeridos" });
    }
    const monto = Number(montoTotal);
    if (!Number.isFinite(monto) || monto <= 0) {
      await t.rollback();
      return res.status(400).json({ error: "Monto inválido" });
    }
    if (!descripcion?.trim()) {
      await t.rollback();
      return res.status(400).json({ error: "descripcion es requerida" });
    }
    if (!formacobro_id) {
      await t.rollback();
      return res.status(400).json({ error: "formacobro_id es requerido (Caja/Efectivo)" });
    }

    // Idempotencia (opcional)
    if (idempotencyKey) {
      const existente = await MovimientoCajaTesoreria.findOne({
        where: { idempotency_key: idempotencyKey, tipo: "ingreso" },
        transaction: t,
        lock: t.LOCK.UPDATE,
      });
      if (existente) {
        await t.commit();
        return res.json({ ok: true, reused: true, movimiento: existente });
      }
    }

    // Crear movimiento de caja (INGRESO)
    const movimiento = await MovimientoCajaTesoreria.create(
      {
        tipo: "ingreso",
        descripcion: descripcion.trim(),
        monto,
        fecha: fecha || sequelize.literal("CURRENT_DATE"),
        caja_id,
        formapago_id: formacobro_id,
        referencia_id: null,
        referencia_tipo: "IngresoVarios",
        observaciones: observaciones || null,
        categoriaegreso_id: null,
        categoriaingreso_id: categoriaingreso_id || null,
        imputacioncontable_id: null,  // si luego derivás desde categoría, podés setearlo
        idempotency_key: idempotencyKey || null,
        proyecto_id: proyecto_id || null,
        ordenpago_id: null,
      },
      { transaction: t }
    );

    await t.commit();
    return res.status(201).json({ ok: true, movimiento });
  } catch (err) {
    await t.rollback();
    next(err);
  }
};