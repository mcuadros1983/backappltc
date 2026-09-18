// controllers/tesoreria/movimientoBancoTesoreriaController.js
import { Op } from "sequelize";
import { sequelize } from "../../config/database.js";
import MovimientoBancoTesoreria from "../../models/tesoreria/movimientobancotesoreria.js";
import MovimientoCtaCteProveedor from "../../models/tesoreria/movimientoctacteproveedor.js";
import OrdenPago from "../../models/tesoreria/ordendepago.js";
import CategoriaEgreso from "../../models/tesoreria/categoriaEgreso.js";
import Banco from "../../models/comun/banco.js";
import Proveedor from "../../models/comun/proveedor.js";
import Proyecto from "../../models/comun/proyecto.js";
import Cliente from "../../models/gmedias/clienteModel.js";
import CuentaCorriente from "../../models/gmedias/cuentaCorrienteModel.js";
import Cobranza from "../../models/gmedias/cobranzaModel.js";
import DetalleCobranza from "../../models/gmedias/detalleCobranzaModel.js";
import MovimientoCajaTesoreria from "../../models/tesoreria/movimientocajatesoreria.js";
import GastoEstimadoPago from "../../models/tesoreria/gastoestimadopago.js";
import GastoEstimadoInstancia from "../../models/tesoreria/gastoestimadoinstancia.js";
import MovimientoCtaCteProveedorAplic from "../../models/tesoreria/movimientoctacteproveedoraplicacion.js";
import ComprobanteEgreso from "../../models/iva/comprobanteegreso.js";
import xlsx from "xlsx";
import EcheqEmitido from "../../models/tesoreria/pagoecheq.js";
import PagoSueldoEmpleado from "../../models/sueldoempleado/pagosueldoempleado.js";
import PagoTarjetaCredito from "../../models/tesoreria/pagotarjetacredito.js"
import AdelantoEmpleado from "../../models/sueldoempleado/adelantoempleado.js";
import PagoProgramadoTesoreria
  from "../../models/tesoreria/PagoProgramadoTesoreria.js";
import {
  recalcularComprobanteEgreso,
} from "./helpers/recalcularComprobanteEgreso.js";
import FormaPagoTesoreria from "../../models/comun/formapagotesoreria.js";
import CategoriaIngreso from "../../models/tesoreria/categoriaIngreso.js";
/* ===================== CRUD BÁSICO ===================== */

export const crearMovimientoBancoTesoreria = async (req, res) => {
  try {
    // Si viene idempotency_key, devolvemos el existente
    if (req.body?.idempotency_key) {
      const existente = await MovimientoBancoTesoreria.findOne({
        where: { idempotency_key: req.body.idempotency_key },
      });
      if (existente) {
        return res.status(200).json({ ok: true, reutilizado: true, movimiento: existente });
      }
    }

    const mov = await MovimientoBancoTesoreria.create(req.body);
    return res.status(201).json(mov);
  } catch (error) {
    return res.status(500).json({
      error: "Error al crear movimiento bancario",
      detalle: error.message,
    });
  }
};

export const listarMovimientosBancoTesoreria = async (req, res) => {
  try {
    const { fecha_desde, fecha_hasta, banco_id, includeAnulados = "0", empresa_id } = req.query || {};

    const toISO = (d) => {
      if (!d) return d;
      const m = /^(\d{2})-(\d{2})-(\d{4})$/.exec(String(d));
      return m ? `${m[3]}-${m[2]}-${m[1]}` : d;
    };
    const fDesde = toISO(fecha_desde);
    const fHasta = toISO(fecha_hasta);

    const where = {};
    if (banco_id) where.banco_id = Number(banco_id);
    if (empresa_id) where.empresa_id = Number(empresa_id);
    if (includeAnulados !== "1") where.anulado = false;
    if (fDesde || fHasta) {
      where.fecha = {};
      if (fDesde) where.fecha[Op.gte] = fDesde;
      if (fHasta) where.fecha[Op.lte] = fHasta;
    }

    const movimientos = await MovimientoBancoTesoreria.findAll({
      where,
      order: [["fecha", "ASC"], ["id", "ASC"]],
    });

    return res.json(movimientos);
  } catch (error) {
    return res.status(500).json({ error: "Error al listar movimientos bancarios", detalle: error.message });
  }
};

export const obtenerMovimientoBancoTesoreriaPorId = async (req, res) => {
  try {
    const mov = await MovimientoBancoTesoreria.findByPk(req.params.id);
    if (!mov) return res.status(404).json({ error: "Movimiento bancario no encontrado" });
    return res.json(mov);
  } catch (error) {
    return res.status(500).json({ error: "Error al obtener movimiento bancario", detalle: error.message });
  }
};

export const actualizarMovimientoBancoTesoreria = async (req, res) => {
  try {
    const mov = await MovimientoBancoTesoreria.findByPk(req.params.id);
    if (!mov) return res.status(404).json({ error: "Movimiento bancario no encontrado" });
    await mov.update(req.body);
    return res.json(mov);
  } catch (error) {
    return res.status(500).json({ error: "Error al actualizar movimiento bancario", detalle: error.message });
  }
};

export const eliminarMovimientoBancoTesoreria = async (req, res) => {
  const t = await sequelize.transaction();
  const t0 = Date.now();
  console.log("🧹 [Banco] eliminarMovimientoBancoTesoreria — TX START");

  // === Helper para recalcular saldo/estado de un ComprobanteEgreso ===
  async function recalcComprobanteEgreso(compId, trx) {
    const EPS_REC = 0.0001;
    const comp = await ComprobanteEgreso.findByPk(compId, { transaction: trx });
    if (!comp) return;

    const totalComp =
      Number(comp.montoreal || 0) > 0
        ? Number(comp.montoreal)
        : Number(comp.total || 0);

    const [
      cajaComp,
      bancoComp,
      tarjetaComp,
      echeqComp
    ] = await Promise.all([

      MovimientoCajaTesoreria.findAll({
        where: {
          comprobanteegreso_id: compId,
          [Op.or]: [
            { anulado: false },
            { anulado: null },
          ],
        },
        transaction: trx,
      }),

      MovimientoBancoTesoreria.findAll({
        where: {
          comprobanteegreso_id: compId,
          [Op.or]: [
            { anulado: false },
            { anulado: null },
          ],
        },
        transaction: trx,
      }),

      PagoTarjetaCredito?.findAll?.({
        where: {
          comprobanteegreso_id: compId,
          anulado: false,
          estado: {
            [Op.notIn]: [
              "rechazado",
            ],
          },
        },
        transaction: trx,
      }) || [],

      EcheqEmitido?.findAll?.({
        where: {
          comprobanteegreso_id: compId,
          anulado: false,
          estado: {
            [Op.notIn]: [
              "anulado",
              "rechazado",
            ],
          },
        },
        transaction: trx,
      }) || [],
    ]);

    const pagosDirectos =
      (cajaComp || []).reduce((a, r) => a + Number(r.monto || 0), 0) +
      (bancoComp || []).reduce((a, r) => a + Number(r.monto || 0), 0) +
      (tarjetaComp || []).reduce((a, r) => a + Number(r.importe || 0), 0) +
      (echeqComp || []).reduce((a, r) => a + Number(r.importe || 0), 0);

    const cargosComp = await MovimientoCtaCteProveedor.findAll({
      where: {
        comprobanteegreso_id: compId,
        tipo: "cargo",
        [Op.or]: [
          { anulado: false },
          { anulado: null },
        ],
      },
      attributes: ["id"],
      transaction: trx,
    });
    const cargoIds = cargosComp.map(c => c.id);

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
    if (Math.abs(saldo) <= EPS_REC) estadoComp = "pagada";
    else if (pagadoReal > EPS_REC && saldo > EPS_REC) estadoComp = "parcial";

    const patch = { saldo };
    if (Object.prototype.hasOwnProperty.call(comp.dataValues, "estadopago")) patch.estadopago = estadoComp;
    if (Object.prototype.hasOwnProperty.call(comp.dataValues, "estado")) patch.estado = estadoComp;

    await comp.update(patch, { transaction: trx });
    console.log("[recalcComprobanteEgreso/banco]", { compId, totalComp, pagosDirectos, aplicadoAbonos, saldo, estadoComp });
  }



  async function actualizarFormaPagoActualComprobante(compId, trx) {

    const comp = await ComprobanteEgreso.findByPk(
      compId,
      {
        transaction: trx,
        lock: trx.LOCK.UPDATE,
      }
    );

    if (!comp) return;

    /*
     * ============================================================
     * 1. Buscar los efectos financieros que actualmente
     *    siguen vinculados al comprobante.
     * ============================================================
     */

    const [
      movimientosCaja,
      movimientosBanco,
      echeqs,
      tarjetas,
      cargosCtaCte,
    ] = await Promise.all([

      MovimientoCajaTesoreria.findAll({
        where: {
          comprobanteegreso_id: compId,
          [Op.or]: [
            { anulado: false },
            { anulado: null },
          ],
        },
        attributes: [
          "id",
          "formapago_id",
        ],
        transaction: trx,
      }),

      MovimientoBancoTesoreria.findAll({
        where: {
          comprobanteegreso_id: compId,
          [Op.or]: [
            { anulado: false },
            { anulado: null },
          ],
        },
        attributes: [
          "id",
          "formapago_id",
        ],
        transaction: trx,
      }),

      EcheqEmitido.findAll({
        where: {
          comprobanteegreso_id: compId,
          anulado: false,
          estado: {
            [Op.notIn]: [
              "anulado",
              "rechazado",
            ],
          },
        },
        attributes: [
          "id",
        ],
        transaction: trx,
      }),

      PagoTarjetaCredito.findAll({
        where: {
          comprobanteegreso_id: compId,
          anulado: false,
          estado: {
            [Op.notIn]: [
              "rechazado",
            ],
          },
        },
        attributes: [
          "id",
        ],
        transaction: trx,
      }),

      MovimientoCtaCteProveedor.findAll({
        where: {
          comprobanteegreso_id: compId,
          tipo: "cargo",
          [Op.or]: [
            { anulado: false },
            { anulado: null },
          ],
        },
        attributes: [
          "id",
        ],
        transaction: trx,
      }),
    ]);

    /*
     * ============================================================
     * 2. Buscar catálogo de formas de pago.
     *
     * No hardcodeamos IDs.
     * ============================================================
     */

    const formasCatalogo =
      await FormaPagoTesoreria.findAll({
        transaction: trx,
      });

    const buscarFormaPorDescripcion = (
      descripcion
    ) => {

      const buscada =
        String(descripcion || "")
          .trim()
          .toUpperCase();

      return formasCatalogo.find(
        fp =>
          String(fp.descripcion || "")
            .trim()
            .toUpperCase() === buscada
      ) || null;
    };

    const formaEcheq =
      buscarFormaPorDescripcion("ECHEQ");

    const formaTarjetaCredito =
      buscarFormaPorDescripcion(
        "TARJETA CREDITO"
      );

    const formaCtaCte =
      buscarFormaPorDescripcion(
        "CTA CTE"
      );

    /*
     * ============================================================
     * 3. Construir las formas de pago que siguen existiendo.
     * ============================================================
     */

    const formasPagoActuales =
      new Set();

    /*
     * Caja y Banco YA tienen formapago_id,
     * por lo tanto usamos directamente el valor registrado.
     */

    const agregarFormaRegistrada = (
      registros
    ) => {

      for (const registro of registros || []) {

        const formaPagoId =
          Number(
            registro.formapago_id || 0
          );

        if (formaPagoId) {

          formasPagoActuales.add(
            formaPagoId
          );
        }
      }
    };

    agregarFormaRegistrada(
      movimientosCaja
    );

    agregarFormaRegistrada(
      movimientosBanco
    );

    /*
     * eCheq no posee formapago_id.
     * Su propia existencia determina el medio.
     */

    if (echeqs.length > 0) {

      if (!formaEcheq) {
        throw new Error(
          'No se encontró la forma de pago "ECHEQ".'
        );
      }

      formasPagoActuales.add(
        Number(formaEcheq.id)
      );
    }

    /*
     * PagoTarjetaCredito tampoco posee formapago_id.
     *
     * Este modelo corresponde al pago con tarjeta de crédito.
     */

    if (tarjetas.length > 0) {

      if (!formaTarjetaCredito) {
        throw new Error(
          'No se encontró la forma de pago "TARJETA CREDITO".'
        );
      }

      formasPagoActuales.add(
        Number(
          formaTarjetaCredito.id
        )
      );
    }

    /*
     * Si existe un CARGO activo asociado al comprobante,
     * existe una porción pendiente en Cuenta Corriente.
     */

    if (cargosCtaCte.length > 0) {

      if (!formaCtaCte) {
        throw new Error(
          'No se encontró la forma de pago "CTA CTE".'
        );
      }

      formasPagoActuales.add(
        Number(formaCtaCte.id)
      );
    }

    /*
     * ============================================================
     * 4. Determinar el encabezado.
     *
     * 0 medios  -> NULL
     * 1 medio   -> ese medio
     * >1 medios -> NULL = VARIOS
     * ============================================================
     */

    const idsFormas =
      [...formasPagoActuales];

    const nuevaFormaPagoId =
      idsFormas.length === 1
        ? idsFormas[0]
        : null;

    console.log(
      "💳 Actualizando forma de pago actual del comprobante:",
      {
        comprobante_id:
          compId,

        movimientos_caja:
          movimientosCaja.length,

        movimientos_banco:
          movimientosBanco.length,

        echeqs:
          echeqs.length,

        tarjetas:
          tarjetas.length,

        cargos_ctacte:
          cargosCtaCte.length,

        formas_detectadas:
          idsFormas,

        formapago_anterior:
          comp.formapago_id,

        formapago_nuevo:
          nuevaFormaPagoId,
      }
    );

    await comp.update(
      {
        formapago_id:
          nuevaFormaPagoId,
      },
      {
        transaction: trx,
      }
    );
  }

  try {
    const id = Number(req.params.id || 0);
    if (!id) throw new Error("ID inválido");

    const mov = await MovimientoBancoTesoreria.findByPk(id, { transaction: t, lock: t.LOCK.UPDATE });
    if (!mov) throw new Error("Movimiento bancario no encontrado");

    const refPagoProgramado =
      String(
        mov.referencia_tipo || ""
      )
        .trim()
        .toLowerCase();

    // ============================================================
    // PAGO PROGRAMADO ACREDITADO
    // → REVERTIR ACREDITACIÓN
    // ============================================================

    if (
      refPagoProgramado === "pagoprogramadotesoreria" &&
      mov.referencia_id
    ) {

      console.log(
        "📅 Revirtiendo acreditación de PAGO PROGRAMADO desde BANCO:",
        mov.referencia_id
      );


      // ============================================================
      // 1. BUSCAR PAGO PROGRAMADO
      // ============================================================

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


      if (
        String(
          pagoProgramado.estado || ""
        )
          .trim()
          .toLowerCase() !==
        "acreditado"
      ) {
        throw new Error(
          `El pago programado asociado se encuentra en estado ${pagoProgramado.estado}.`
        );
      }


      if (
        String(
          pagoProgramado.medio || ""
        )
          .trim()
          .toLowerCase() !==
        "banco"
      ) {
        throw new Error(
          "El PagoProgramadoTesoreria asociado no corresponde a un pago por banco."
        );
      }


      if (
        pagoProgramado.movimiento_id &&
        Number(
          pagoProgramado.movimiento_id
        ) !==
        Number(mov.id)
      ) {
        throw new Error(
          "El movimiento bancario no coincide con el movimiento registrado en el PagoProgramadoTesoreria."
        );
      }


      // ============================================================
      // 2. LOCALIZAR LOS ABONOS QUE AL ACREDITAR
      //    PASARON A APUNTAR AL MOVIMIENTO BANCARIO
      // ============================================================

      const abonosProgramado =
        await MovimientoCtaCteProveedor.findAll({
          where: {
            tipo:
              "abono",

            referencia_tipo:
              "MovimientoBancoTesoreria",

            referencia_id:
              mov.id,

            anulado: {
              [Op.not]:
                true,
            },
          },

          transaction: t,
          lock: t.LOCK.UPDATE,
        });


      /*
       * Estos IDs son fundamentales.
       *
       * Las aplicaciones NO se eliminan.
       * Las necesitamos para saber a qué comprobantes
       * está aplicado este PagoProgramado.
       */
      const abonoIds =
        abonosProgramado
          .map(
            (abono) =>
              Number(abono.id)
          )
          .filter(Boolean);


      // ============================================================
      // 3. RECUPERAR TODOS LOS COMPROBANTES AFECTADOS
      // ============================================================

      const comprobantesAfectados =
        new Set();


      /*
       * Asociación directa, si existe.
       */
      if (
        pagoProgramado.comprobanteegreso_id
      ) {

        comprobantesAfectados.add(
          Number(
            pagoProgramado.comprobanteegreso_id
          )
        );
      }


      if (mov.comprobanteegreso_id) {

        comprobantesAfectados.add(
          Number(
            mov.comprobanteegreso_id
          )
        );
      }


      /*
       * Asociaciones mediante Cta.Cte.
       */
      if (abonoIds.length > 0) {

        const aplicaciones =
          await MovimientoCtaCteProveedorAplic.findAll({
            where: {
              abono_id: {
                [Op.in]:
                  abonoIds,
              },
            },

            attributes: [
              "cargo_id",
            ],

            transaction: t,
          });


        const cargoIds =
          [
            ...new Set(
              aplicaciones
                .map(
                  (aplicacion) =>
                    Number(
                      aplicacion.cargo_id
                    )
                )
                .filter(Boolean)
            ),
          ];


        if (cargoIds.length > 0) {

          const cargos =
            await MovimientoCtaCteProveedor.findAll({
              where: {
                id: {
                  [Op.in]:
                    cargoIds,
                },

                tipo:
                  "cargo",

                anulado: {
                  [Op.not]:
                    true,
                },
              },

              attributes: [
                "id",
                "comprobanteegreso_id",
              ],

              transaction: t,
            });


          for (const cargo of cargos) {

            if (
              cargo.comprobanteegreso_id
            ) {

              comprobantesAfectados.add(
                Number(
                  cargo.comprobanteegreso_id
                )
              );
            }
          }
        }
      }


      // ============================================================
      // 4. RESTAURAR LOS ABONOS
      //    MOVIMIENTO REAL → PAGO PROGRAMADO
      // ============================================================
      const medioPagoProgramadoDescripcion =
        String(
          pagoProgramado.medio || ""
        )
          .trim()
          .toLowerCase() === "caja"
          ? "Efectivo"
          : String(
            pagoProgramado.medio || ""
          )
            .trim()
            .toLowerCase() === "echeq"
            ? "eCheq"
            : String(
              pagoProgramado.medio || ""
            )
              .trim()
              .toLowerCase() === "banco"
              ? "Transferencia/Banco"
              : "No especificado";


      const descripcionPagoProgramado =
        String(
          pagoProgramado.descripcion || ""
        ).trim();

      for (
        const abono
        of abonosProgramado
      ) {

        await abono.update(
          {
            referencia_tipo:
              "PagoProgramadoTesoreria",

            referencia_id:
              pagoProgramado.id,

            /*
             * Vuelve a ser compromiso pendiente.
             */
            fecha_pago:
              null,

            descripcion:
              `Pago programado pendiente #${pagoProgramado.id}` +
              (
                descripcionPagoProgramado
                  ? ` - ${descripcionPagoProgramado}`
                  : ""
              ) +
              ` · Pago acordado con: ${medioPagoProgramadoDescripcion}`,

            /*
             * Conservamos la FP acordada del programado.
             */
            formapago_id:
              pagoProgramado.formapago_id ||
              abono.formapago_id ||
              null,
          },
          {
            transaction: t,
          }
        );
      }


      // ============================================================
      // 5. ELIMINAR MOVIMIENTO FINANCIERO REAL
      // ============================================================

      await mov.destroy({
        transaction: t,
      });


      // ============================================================
      // 6. PAGO PROGRAMADO
      //    ACREDITADO → PENDIENTE
      // ============================================================

      await pagoProgramado.update(
        {
          estado:
            "pendiente",

          fecha_acreditacion:
            null,

          movimiento_tipo:
            null,

          movimiento_id:
            null,
        },
        {
          transaction: t,
        }
      );


      // ============================================================
      // 7. RECALCULAR TODOS LOS COMPROBANTES AFECTADOS
      // ============================================================

      const resultadosComprobantes =
        [];


      for (
        const comprobanteId
        of comprobantesAfectados
      ) {

        /*
         * IMPORTANTE:
         *
         * Utilizamos el helper central que ya modificamos
         * para distinguir:
         *
         * - abono real;
         * - PagoProgramado pendiente.
         *
         * Un programado pendiente NO cuenta como pago real.
         */
        const resultado =
          await recalcularComprobanteEgreso(
            comprobanteId,
            t
          );


        /*
         * Reconstruimos además la FP actual
         * del encabezado del comprobante.
         */
        await actualizarFormaPagoActualComprobante(
          comprobanteId,
          t
        );


        resultadosComprobantes.push(
          resultado
        );
      }


      // ============================================================
      // 8. COMMIT
      // ============================================================

      await t.commit();


      return res.json({
        ok:
          true,

        mensaje:
          "Acreditación del Pago Programado revertida. El movimiento bancario fue eliminado y el Pago Programado volvió a estado pendiente.",

        pagoProgramado_id:
          pagoProgramado.id,

        pagoProgramado_estado:
          "pendiente",

        comprobantes_afectados:
          [
            ...comprobantesAfectados,
          ],

        comprobantes:
          resultadosComprobantes,
      });
    }

    const EPS = 0.009;
    const tipo = String(mov.tipo || "").toLowerCase(); // ingreso | egreso
    const refTipoRaw = String(mov.referencia_tipo || "");
    const refTipo = refTipoRaw.toLowerCase();

    // ⬇️ Sueldos
    const isPagoSueldoBanco = refTipo === "pagosueldoempleado";
    const isAdelantoBanco = refTipo === "adelantoempleado";

    console.log("🔎 Movimiento:", {
      id: mov.id,
      tipo,
      refTipoRaw,
      refTipo,
      monto: Number(mov.monto || 0),
      fecha: mov.fecha,
      empresa_id: mov.empresa_id,
      banco_id: mov.banco_id,
      referencia_id: mov.referencia_id,
      ordenpago_id: mov.ordenpago_id,
      comprobanteegreso_id: mov.comprobanteegreso_id,
      proveedor_id: mov.proveedor_id,
    });


    // ==================== 0) Revertir aplicaciones a Gasto Estimado ====================
    console.log("🔧 Paso 0: Revirtiendo GastoEstimadoPago vinculados al movimiento…");
    const pagosGE = await GastoEstimadoPago.findAll({
      where: { referencia_tipo: "MovimientoBancoTesoreria", referencia_id: mov.id },
      transaction: t,
      lock: t.LOCK.UPDATE,
    });
    console.log(`   • GastoEstimadoPago encontrados: ${pagosGE.length}`);

    if (pagosGE.length) {
      const byInstancia = new Map();
      for (const pg of pagosGE) {
        const instId = Number(pg.gastoestimado_instancia_id || 0);
        const aplicado = Number(pg.monto_aplicado || 0);
        console.log("     - Eliminando GastoEstimadoPago#", pg.id, "inst:", instId, "aplicado:", aplicado);
        if (instId) byInstancia.set(instId, (byInstancia.get(instId) || 0) + aplicado);
        await pg.destroy({ transaction: t });
      }

      for (const [instId] of byInstancia) {
        console.log(`   • Recalculando GastoEstimadoInstancia #${instId}`);
        const inst = await GastoEstimadoInstancia.findByPk(instId, { transaction: t, lock: t.LOCK.UPDATE });
        if (!inst) continue;
        const restantes = await GastoEstimadoPago.findAll({ where: { gastoestimado_instancia_id: instId }, transaction: t });
        const newPagado = (restantes || []).reduce((acc, p) => acc + Number(p.monto_aplicado || 0), 0);
        const base = Number(inst.monto_real ?? inst.monto_estimado ?? 0);
        const nuevoSaldo = Math.max(0, base - newPagado);
        let estado = inst.estado;
        if (newPagado <= EPS) estado = "pendiente";
        else if (nuevoSaldo <= EPS) estado = "pagado";
        else estado = "parcial";
        await inst.update({ monto_pagado: newPagado, estado }, { transaction: t });
      }
    }

    // ==================== 1) INGRESOS ====================
    if (tipo === "ingreso") {
      console.log("🟢 Paso 1: Rama INGRESOS");

      // A) Cobranza Banco
      if (refTipo === "cobranzabanco" && mov.referencia_id) {
        console.log("   • Caso A: CobranzaBanco ref_id:", mov.referencia_id);

        const cobranza = await Cobranza.findByPk(mov.referencia_id, { transaction: t, lock: t.LOCK.UPDATE });
        if (!cobranza) {
          console.log("   ⚠️ Cobranza no encontrada. Se elimina solo el movimiento.");
          await mov.destroy({ transaction: t });
          if (t && !t.finished) await t.commit();
          console.log("✅ COMMIT (ingreso/cobranza inexistente)");
          return res.json({ ok: true, mensaje: "Movimiento bancario eliminado (cobranza no encontrada)." });
        }

        const detalles = await DetalleCobranza.findAll({
          where: { cobranza_id: cobranza.id },
          transaction: t,
          lock: t.LOCK.UPDATE,
        });
        console.log(`   • Detalles de cobranza: ${detalles.length}`);

        const totalDetalles = (detalles || []).reduce((acc, d) => acc + Number(d.monto_total || 0), 0);
        const totalARevertir = totalDetalles || Number(mov.monto || 0);

        const cc = await CuentaCorriente.findByPk(cobranza.cuentaCorriente_id, { transaction: t, lock: t.LOCK.UPDATE });
        if (cc) await cc.increment("saldoActual", { by: totalARevertir, transaction: t });

        if (detalles.length) await DetalleCobranza.destroy({ where: { cobranza_id: cobranza.id }, transaction: t });
        await cobranza.destroy({ transaction: t });
        await mov.destroy({ transaction: t });

        if (t && !t.finished) await t.commit();
        console.log("✅ COMMIT (ingreso/cobranza)");
        return res.json({ ok: true, mensaje: "Cobranza bancaria revertida y movimiento eliminado." });
      }

      // B) Ingreso varios
      if (refTipo === "ingresobancovarios") {
        console.log("   • Caso B: IngresoBancoVarios simple");
        await mov.destroy({ transaction: t });
        if (t && !t.finished) await t.commit();
        console.log("✅ COMMIT (ingreso/varios)");
        return res.json({ ok: true, mensaje: "Ingreso bancario eliminado." });
      }

      // C) Genérico
      console.log("   • Caso C: Ingreso genérico");
      await mov.destroy({ transaction: t });
      if (t && !t.finished) await t.commit();
      console.log("✅ COMMIT (ingreso/genérico)");
      return res.json({ ok: true, mensaje: "Movimiento bancario (ingreso) eliminado." });
    }

    // ==================== 2) EGRESOS ====================
    if (tipo === "egreso") {
      console.log("🔴 Paso 2: Rama EGRESOS");

      // 2.A) Pago de sueldo
      if (isPagoSueldoBanco) {
        console.log("🧾 [Banco] Pago de Sueldo");
        const pagoId = Number(mov.referencia_id || 0);
        if (!pagoId) {
          await mov.destroy({ transaction: t });
          if (t && !t.finished) await t.commit();
          return res.json({ ok: true, mensaje: "Movimiento bancario eliminado (referencia de pago sueldos inválida)." });
        }

        const pago = await PagoSueldoEmpleado.findByPk(pagoId, { transaction: t, lock: t.LOCK.UPDATE });
        if (!pago) {
          await mov.destroy({ transaction: t });
          if (t && !t.finished) await t.commit();
          return res.json({ ok: true, mensaje: "Movimiento bancario eliminado (PagoSueldoEmpleado no encontrado)." });
        }

        await pago.destroy({ transaction: t });
        await mov.destroy({ transaction: t });
        if (t && !t.finished) await t.commit();
        return res.json({ ok: true, mensaje: "Pago de sueldo y movimiento bancario eliminados correctamente." });
      }

      // 2.B) Adelanto de sueldo
      if (isAdelantoBanco) {
        console.log("🧾 [Banco] Adelanto de Sueldo");
        const adelantoId = Number(mov.referencia_id || 0);
        if (!adelantoId) {
          await mov.destroy({ transaction: t });
          if (t && !t.finished) await t.commit();
          return res.json({ ok: true, mensaje: "Movimiento bancario eliminado (referencia de adelanto inválida)." });
        }
        const adelanto = await AdelantoEmpleado.findByPk(adelantoId, { transaction: t, lock: t.LOCK.UPDATE });
        if (!adelanto) {
          await mov.destroy({ transaction: t });
          if (t && !t.finished) await t.commit();
          return res.json({ ok: true, mensaje: "Movimiento bancario eliminado (AdelantoEmpleado no encontrado)." });
        }
        await adelanto.destroy({ transaction: t });
        await mov.destroy({ transaction: t });
        if (t && !t.finished) await t.commit();
        return res.json({ ok: true, mensaje: "Adelanto y movimiento bancario eliminados correctamente." });
      }

      // ============================================================
      // ECHEQ ACREDITADO → REVERTIR ACREDITACIÓN BANCARIA
      // ============================================================

      if (
        refTipo === "echeqemitido" &&
        mov.referencia_id
      ) {

        console.log(
          "   • ECHEQ acreditado → revertir:",
          mov.referencia_id
        );


        const ech =
          await EcheqEmitido.findByPk(
            mov.referencia_id,
            {
              transaction: t,
              lock: t.LOCK.UPDATE,
            }
          );


        /*
         * El movimiento bancario declara expresamente que
         * proviene de un EcheqEmitido.
         *
         * Si el eCheq no existe, tenemos una inconsistencia
         * de integridad y no debemos continuar.
         */
        if (!ech) {
          throw new Error(
            `No se encontró el EcheqEmitido #${mov.referencia_id} asociado al movimiento bancario.`
          );
        }


        /*
         * Tampoco debemos eliminar silenciosamente el
         * movimiento bancario de un eCheq ya anulado.
         */
        if (ech.anulado) {
          throw new Error(
            "El eCheq asociado se encuentra anulado. No se puede revertir automáticamente su acreditación bancaria."
          );
        }


        /*
         * El estado esperado es "acreditado".
         *
         * Si tiene otro estado, detenernos evita modificar
         * una cadena financiera inconsistente.
         */
        if (
          String(ech.estado || "")
            .trim()
            .toLowerCase() !== "acreditado"
        ) {
          throw new Error(
            `El eCheq asociado se encuentra en estado "${ech.estado}". Se esperaba estado "acreditado".`
          );
        }


        /*
         * ========================================================
         * 1. EL ECHEQ VUELVE A ESTADO EMITIDO
         * ========================================================
         *
         * IMPORTANTE:
         *
         * NO anulamos el eCheq.
         * NO tocamos el PagoProgramadoTesoreria.
         * NO tocamos el ComprobanteEgreso.
         * NO tocamos la OrdenPago.
         *
         * Solamente estamos revirtiendo su impacto bancario.
         */

        await ech.update(
          {
            estado:
              "emitido",
          },
          {
            transaction: t,
          }
        );


        /*
         * ========================================================
         * 2. ELIMINAR MOVIMIENTO BANCARIO
         * ========================================================
         */

        await mov.destroy({
          transaction: t,
        });


        /*
         * ========================================================
         * 3. COMMIT
         * ========================================================
         */

        if (
          t &&
          !t.finished
        ) {
          await t.commit();
        }


        return res.json({
          ok:
            true,

          mensaje:
            "Acreditación bancaria del eCheq revertida. El eCheq volvió a estado emitido.",

          echeq:
            ech,
        });
      }

      // 🔁 PRIORIDAD: Orden de Pago
      if ((refTipo === "ordenpago" || refTipoRaw === "OrdenPago") && mov.ordenpago_id) {
        console.log("   • Egreso con OrdenPago — ordenpago_id:", mov.ordenpago_id);

        const orden = await OrdenPago.findByPk(mov.ordenpago_id, { transaction: t, lock: t.LOCK.UPDATE });

        // ============================================================
        // 1) BUSCAR TODOS LOS ABONOS ASOCIADOS AL MOVIMIENTO
        // ============================================================

        const compIdsAfectados =
          new Set();


        const abonosDirectos =
          await MovimientoCtaCteProveedor.findAll({
            where: {
              referencia_tipo:
                "MovimientoBancoTesoreria",

              referencia_id:
                mov.id,

              tipo:
                "abono",

              anulado: {
                [Op.not]:
                  true,
              },
            },

            transaction: t,
            lock: t.LOCK.UPDATE,
          });


        console.log(
          "     · Abonos DIRECTOS:",
          abonosDirectos.map(
            (a) => a.id
          )
        );


        /*
         * Si existe al menos un ABONO directamente
         * relacionado con este MovimientoBancoTesoreria,
         * significa que el movimiento fue aplicado
         * a Cta.Cte.
         */
        const tieneAbonosDirectos =
          abonosDirectos.length > 0;


        /*
         * Sólo buscamos por OP como fallback cuando
         * NO encontramos relaciones directas.
         */
        let abonoViaOP =
          null;


        if (
          !tieneAbonosDirectos &&
          orden
        ) {

          abonoViaOP =
            await MovimientoCtaCteProveedor.findOne({
              where: {
                ordenpago_id:
                  orden.id,

                tipo:
                  "abono",

                anulado: {
                  [Op.not]:
                    true,
                },
              },

              transaction: t,
              lock: t.LOCK.UPDATE,
            });


          console.log(
            "     · Abono via OP:",
            abonoViaOP
              ? abonoViaOP.id
              : "—"
          );
        }


        /*
         * Sólo habrá que generar un CARGO de reversión
         * si el movimiento NO estaba aplicado mediante
         * ABONOS directos.
         */
        let debeCrearCargo =
          !tieneAbonosDirectos;


        // ============================================================
        // 1.1) ELIMINAR TODOS LOS ABONOS DIRECTOS
        // ============================================================

        if (
          tieneAbonosDirectos
        ) {

          const abonoIds =
            abonosDirectos
              .map(
                (abono) =>
                  Number(abono.id)
              )
              .filter(Boolean);


          /*
           * Primero recogemos los comprobantes que
           * figuran directamente en cada ABONO.
           */
          for (
            const abono
            of abonosDirectos
          ) {

            const compFromAbono =
              Number(
                abono.comprobanteegreso_id ||
                0
              );


            if (compFromAbono) {

              compIdsAfectados.add(
                compFromAbono
              );
            }
          }


          /*
           * Recuperamos TODAS las aplicaciones de
           * TODOS los ABONOS.
           */
          const appls =
            await MovimientoCtaCteProveedorAplic.findAll({
              where: {
                abono_id: {
                  [Op.in]:
                    abonoIds,
                },
              },

              transaction: t,
              lock: t.LOCK.UPDATE,
            });


          /*
           * También recuperamos los comprobantes
           * a través de los CARGOS.
           */
          if (appls.length > 0) {

            const cargoIds =
              [
                ...new Set(
                  appls
                    .map(
                      (a) =>
                        Number(
                          a.cargo_id
                        )
                    )
                    .filter(Boolean)
                ),
              ];


            if (cargoIds.length > 0) {

              const cargos =
                await MovimientoCtaCteProveedor.findAll({
                  where: {
                    id: {
                      [Op.in]:
                        cargoIds,
                    },
                  },

                  attributes: [
                    "id",
                    "comprobanteegreso_id",
                  ],

                  transaction: t,
                });


              for (
                const cargo
                of cargos
              ) {

                const compId =
                  Number(
                    cargo.comprobanteegreso_id ||
                    0
                  );


                if (compId) {

                  compIdsAfectados.add(
                    compId
                  );
                }
              }
            }


            /*
             * Eliminamos TODAS las aplicaciones.
             */
            await MovimientoCtaCteProveedorAplic.destroy({
              where: {
                abono_id: {
                  [Op.in]:
                    abonoIds,
                },
              },

              transaction: t,
            });
          }


          /*
           * Finalmente eliminamos TODOS los ABONOS
           * relacionados directamente con el movimiento.
           */
          await MovimientoCtaCteProveedor.destroy({
            where: {
              id: {
                [Op.in]:
                  abonoIds,
              },
            },

            transaction: t,
          });
        }

        // 1.2) si sólo hay abono vía OP, limpiarlo/ajustarlo y recolectar comprobantes
        if (
          !tieneAbonosDirectos &&
          abonoViaOP
        ) {
          const compFromAbono = Number(abonoViaOP.comprobanteegreso_id || 0);
          if (compFromAbono) compIdsAfectados.add(compFromAbono);

          const appls = await MovimientoCtaCteProveedorAplic.findAll({
            where: { abono_id: abonoViaOP.id },
            transaction: t,
            lock: t.LOCK.UPDATE,
          });
          if (appls.length) {
            const cargoIds = [...new Set(appls.map(a => Number(a.cargo_id)).filter(Boolean))];
            if (cargoIds.length) {
              const cargos = await MovimientoCtaCteProveedor.findAll({
                where: { id: { [Op.in]: cargoIds } },
                attributes: ["id", "comprobanteegreso_id"],
                transaction: t,
              });
              for (const cg of cargos) {
                const cid = Number(cg.comprobanteegreso_id || 0);
                if (cid) compIdsAfectados.add(cid);
              }
            }
            await MovimientoCtaCteProveedorAplic.destroy({ where: { abono_id: abonoViaOP.id }, transaction: t });
          }

          const nuevoImporteAbono = Math.max(0, Number((Number(abonoViaOP.importe || 0) - Number(mov.monto || 0)).toFixed(2)));
          if (nuevoImporteAbono <= EPS) {
            await abonoViaOP.destroy({ transaction: t });
          } else {
            await abonoViaOP.update({ importe: nuevoImporteAbono }, { transaction: t });
          }
        }

        // 2) Eliminar el movimiento de banco
        await mov.destroy({ transaction: t });

        // 2.1) (CONDICIONAL) Crear CARGO sólo si NO hubo abono directo
        if (mov.comprobanteegreso_id && debeCrearCargo) {
          const compCargo = await ComprobanteEgreso.findByPk(mov.comprobanteegreso_id, { transaction: t, lock: t.LOCK.UPDATE });
          if (compCargo) {
            const descCtaCte = `Reversión pago bancario de comp. ${compCargo.nrocomprobante ?? compCargo.id}`;
            const fechaCtaCte_OP = mov.fecha || new Date().toISOString().slice(0, 10);
            await MovimientoCtaCteProveedor.create(
              {
                proveedor_id: compCargo.proveedor_id || mov.proveedor_id || null,
                empresa_id: compCargo.empresa_id || mov.empresa_id || null,
                fecha: fechaCtaCte_OP,
                fecha_pago: null,
                descripcion: descCtaCte,
                tipo: "cargo",
                importe: Number(mov.monto || 0),
                origen_tipo: "ComprobanteEgreso",
                origen_id: compCargo.id,
                comprobanteegreso_id: compCargo.id,
                anulado: false,
                ordenpago_id: null,
                formapago_id: null,
              },
              { transaction: t }
            );
            compIdsAfectados.add(Number(compCargo.id)); // aseguramos recálculo
          }

        }


        // 3) Ajustar / eliminar la OP
        if (orden) {
          const newTotal = Math.max(0, Number((Number(orden.total || 0) - Number(mov.monto || 0)).toFixed(2)));
          if (newTotal <= EPS) {
            await orden.destroy({ transaction: t });
          } else {
            await orden.update({ total: newTotal, estado: "pendiente_aplicacion" }, { transaction: t });
          }
        }

        // ============================================================
        // 4) RECALCULAR TODOS LOS COMPROBANTES AFECTADOS
        // ============================================================

        if (
          compIdsAfectados.size > 0
        ) {

          console.log(
            "🧾 Comprobantes afectados por eliminación de Banco:",
            [
              ...compIdsAfectados,
            ]
          );


          for (
            const compId
            of compIdsAfectados
          ) {

            /*
             * Utilizamos el helper CENTRAL.
             *
             * Es el mismo utilizado por la reversión
             * de PagoProgramadoTesoreria.
             */
            await recalcularComprobanteEgreso(
              compId,
              t
            );


            /*
             * Reconstruimos además la forma de pago
             * actual del encabezado.
             */
            await actualizarFormaPagoActualComprobante(
              compId,
              t
            );
          }
        }

        if (t && !t.finished) await t.commit();
        console.log("✅ COMMIT (egreso/OP prioritario)");
        return res.json({ ok: true, mensaje: "Movimiento bancario eliminado y efectos (OP/abono/aplicaciones) revertidos." });
      }

      // --- A) Pago directo de comprobante (solo si NO hay OP) ---
      if (mov.comprobanteegreso_id) {
        console.log("   • Pago directo de ComprobanteEgreso — compId:", mov.comprobanteegreso_id);

        const compIdsAfectados = new Set();

        // 0) Buscar ABONOS vinculados a ESTE movimiento y recolectar comprobantes
        const abonosVinc = await MovimientoCtaCteProveedor.findAll({
          where: {
            tipo: "abono",
            empresa_id: mov.empresa_id,
            anulado: { [Op.not]: true },
            [Op.or]: [
              { referencia_tipo: "MovimientoBancoTesoreria", referencia_id: mov.id },
              { referencia_tipo: "MovimientoCajaTesoreria", referencia_id: mov.id }, // por si hay herencias/migraciones
            ],
          },
          transaction: t,
          lock: t.LOCK.UPDATE,
        });

        // Si hay abono DIRECTO al mov banco, NO crear CARGO
        const hadAbonoDirect = abonosVinc.some(
          a => String(a.referencia_tipo).toLowerCase() === "movimientobancotesoreria" && Number(a.referencia_id) === Number(mov.id)
        );
        let debeCrearCargo = !hadAbonoDirect;

        if (abonosVinc.length) {
          const abonoIds = abonosVinc.map(a => a.id);

          // recolecto comp del propio abono
          for (const a of abonosVinc) {
            const cFromAbono = Number(a.comprobanteegreso_id || 0);
            if (cFromAbono) compIdsAfectados.add(cFromAbono);
          }

          // Borrar aplicaciones (y recolectar comp de cargos)
          const appls = await MovimientoCtaCteProveedorAplic.findAll({
            where: { abono_id: { [Op.in]: abonoIds } },
            attributes: ["id", "cargo_id", "importe"],
            transaction: t,
          });
          if (appls.length) {
            const cargoIds = [...new Set(appls.map(a => Number(a.cargo_id)).filter(Boolean))];
            if (cargoIds.length) {
              const cargos = await MovimientoCtaCteProveedor.findAll({
                where: { id: { [Op.in]: cargoIds } },
                attributes: ["id", "comprobanteegreso_id"],
                transaction: t,
              });
              for (const cg of cargos) {
                const cid = Number(cg.comprobanteegreso_id || 0);
                if (cid) compIdsAfectados.add(cid);
              }
            }
            await MovimientoCtaCteProveedorAplic.destroy({ where: { abono_id: { [Op.in]: abonoIds } }, transaction: t });
          }

          // Borrar abonos
          await MovimientoCtaCteProveedor.destroy({ where: { id: { [Op.in]: abonoIds } }, transaction: t });
        }

        // 1) Traer el comprobante
        const comp = await ComprobanteEgreso.findByPk(mov.comprobanteegreso_id, { transaction: t, lock: t.LOCK.UPDATE });



        // 2) Eliminar el movimiento
        await mov.destroy({ transaction: t });

        // 2.bis) (CONDICIONAL) Generar CARGO sólo si NO hubo abono directo
        if (comp && debeCrearCargo) {
          const descCtaCte = `Reversión pago bancario de comp. ${comp.nrocomprobante ?? comp.id}`;
          const fechaCtaCte = mov.fecha || comp.fechacomprobante || new Date().toISOString().slice(0, 10);
          const montoDelMov = Number(mov.monto || 0);

          await MovimientoCtaCteProveedor.create(
            {
              proveedor_id: comp.proveedor_id || mov.proveedor_id || null,
              empresa_id: comp.empresa_id || mov.empresa_id || null,
              fecha: fechaCtaCte,
              fecha_pago: null,
              descripcion: descCtaCte,
              tipo: "cargo",
              importe: montoDelMov,
              origen_tipo: "ComprobanteEgreso",
              origen_id: comp.id,
              comprobanteegreso_id: comp.id,
              anulado: false,
              ordenpago_id: null,
              formapago_id: null,
            },
            { transaction: t }
          );
          compIdsAfectados.add(Number(comp.id));
        } else if (comp) {
          compIdsAfectados.add(Number(comp.id));
        }


        // 3) Recalcular TODOS los comprobantes afectados.
        // Además reconstruimos la forma de pago actual.
        if (compIdsAfectados.size > 0) {

          for (const compId of compIdsAfectados) {

            await recalcComprobanteEgreso(
              compId,
              t
            );

            await actualizarFormaPagoActualComprobante(
              compId,
              t
            );
          }
        }

        if (t && !t.finished) await t.commit();
        console.log("✅ COMMIT (egreso/pago directo comp)");
        return res.json({
          ok: true,
          mensaje: "Movimiento eliminado; abonos/aplicaciones depurados, CARGO condicional y comprobantes recalculados.",
        });
      }

      // --- D) Egreso sin OP/comp ---
      console.log("   • Caso D: Egreso sin OP ni Comprobante (baja simple)");
      await mov.destroy({ transaction: t });
      if (t && !t.finished) await t.commit();
      console.log("✅ COMMIT (egreso/simple)");
      return res.json({ ok: true, mensaje: "Movimiento bancario (egreso) eliminado." });
    }

    // ==================== 3) DESCONOCIDO ====================
    console.log("⚪ Paso 3: Tipo desconocido → baja genérica");
    await mov.destroy({ transaction: t });
    if (t && !t.finished) await t.commit();
    console.log("✅ COMMIT (genérico)");
    return res.json({ ok: true, mensaje: "Movimiento bancario eliminado (tipo genérico)." });

  } catch (error) {
    console.error("❌ eliminarMovimientoBancoTesoreria — ERROR:", error);
    try {
      if (t && !t.finished) {
        await t.rollback();
        console.log("↩️ ROLLBACK ejecutado");
      } else {
        console.log("↩️ TX ya finalizada; no se ejecuta rollback");
      }
    } catch (rbErr) {
      console.error("⚠️ Error en rollback:", rbErr);
    }
    return res.status(400).json({ error: error.message || "No se pudo eliminar el movimiento bancario" });
  } finally {
    console.log("🧹 [Banco] eliminarMovimientoBancoTesoreria — FIN", { elapsedMs: Date.now() - t0 });
  }
};



/* ===================== EGRESOS VARIOS (BANCO) ===================== */
/**
 * POST /movimientos-banco-tesoreria/egresos-independientes
 * Crea:
 *  - OrdenPago (pendiente_aplicacion)
 *  - MovimientoBancoTesoreria (egreso) asociado a la OP
 */
export const registrarEgresoBancoIndependiente = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { empresa_id, idempotencyKey, egreso } = req.body;

    if (!empresa_id) throw new Error("empresa_id requerido");
    if (!egreso || typeof egreso !== "object") throw new Error("Datos de egreso inválidos");

    const N = (n) => Number(n) || 0;
    const fecha = egreso.fecha || new Date().toISOString().slice(0, 10);
    const monto = N(egreso.monto);

    if (!(monto > 0)) throw new Error("Monto inválido");
    if (!egreso.banco_id) throw new Error("banco_id requerido");
    if (!egreso.descripcion) throw new Error("descripcion requerida");
    if (!egreso.proveedor_id) throw new Error("proveedor_id requerido para egresos varios");
    if (!egreso.categoriaegreso_id) throw new Error("categoriaegreso_id requerido");

    // Derivar imputación desde categoría
    let imputacion = egreso.imputacioncontable_id || null;
    if (!imputacion && egreso.categoriaegreso_id) {
      const cat = await CategoriaEgreso.findByPk(egreso.categoriaegreso_id, { transaction: t });
      if (cat?.imputacioncontable_id) imputacion = cat.imputacioncontable_id;
    }
    if (!imputacion) throw new Error("imputacioncontable_id requerido (directo o derivado de la categoría)");

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

    // 1) OP pendiente de aplicación
    const orden = await OrdenPago.create(
      {
        empresa_id,
        proveedor_id: egreso.proveedor_id,
        comprobanteegreso_id: null,
        fecha,
        total: monto,
        estado: "pendiente_aplicacion",
        numero: null,
        observaciones: egreso.observaciones || null,
        origen: "egreso_varios_banco",
        idempotency_key: idempotencyKey || null,
      },
      { transaction: t }
    );

    // 2) Movimiento Banco (EGRESO) — con categoría, imputación e idempotencia
    const movimiento = await MovimientoBancoTesoreria.create(
      {
        empresa_id,
        tipo: "egreso",
        descripcion: egreso.descripcion,
        monto,
        fecha,
        banco_id: egreso.banco_id,
        formapago_id: egreso.formapago_id || null,
        referencia_id: orden.id,
        referencia_tipo: "OrdenPago",
        observaciones: egreso.observaciones || null,
        anulado: false,
        ordenpago_id: orden.id,

        proyecto_id:
          egreso.proyecto_id
            ? Number(egreso.proyecto_id)
            : null,

        categoriaegreso_id:
          egreso.categoriaegreso_id || null,

        imputacioncontable_id:
          imputacion || null,

        idempotency_key:
          idempotencyKey || null,

        proveedor_id:
          egreso.proveedor_id,
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
              `Pago disponible desde Banco OP #${orden.id}`,

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
              "MovimientoBancoTesoreria",

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

    await t.commit();
    return res.status(201).json({
      ok: true,
      mensaje: "Egreso bancario registrado. Orden de pago pendiente de aplicación creada.",
      ordenpago: orden,
      movimiento: movimiento,            // 👈 igual que Caja
      movimientoBanco: movimiento,       // (temporal, por compatibilidad)
      movCtaCte,
    });
  } catch (error) {
    await t.rollback();
    console.error("❌ registrarEgresoBancoIndependiente:", error);
    return res.status(400).json({ error: error.message || "No se pudo registrar el egreso bancario" });
  }
};

/* ===================== ANTICIPO A PROVEEDORES (BANCO) ===================== */
/**
 * POST /movimientos-banco-tesoreria/anticiposaproveedores
 * Crea:
 *  - OrdenPago (pendiente_aplicacion)
 *  - MovimientosBancoTesoreria (egresos) por cada pago (medio=banco)
 *  - MovimientoCtaCteProveedor (abono)
 */
export const registrarAnticipoProveedorBanco = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const {
      empresa_id,
      proveedor_id,
      fecha,                 // opcional
      observaciones,
      pagos = [],            // [{ medio:"banco", banco_id, monto, fecha, detalle, categoriaegreso_id, imputacioncontable_id?, formapago_id?, idempotency_key? }]
      idempotencyKey,
    } = req.body;

    if (!empresa_id) throw new Error("empresa_id requerido");
    if (!proveedor_id) throw new Error("proveedor_id requerido");
    if (!Array.isArray(pagos) || pagos.length === 0) throw new Error("Debe enviar al menos un pago");

    const N = (n) => Number(n) || 0;
    const medioOf = (p) => String(p.medio || "").toLowerCase();

    // validar pagos medio=banco + derivar imputación
    let total = 0;
    for (const p of pagos) {
      const medio = medioOf(p);
      const monto = N(p.monto);
      if (!(monto > 0)) throw new Error("Monto de pago inválido");
      if (medio !== "banco") throw new Error("En anticipos por banco, el medio debe ser 'banco'");
      if (!p.banco_id) throw new Error("banco_id requerido en pagos por banco");

      if (!p.imputacioncontable_id) {
        if (!p.categoriaegreso_id) throw new Error("categoriaegreso_id requerido en pagos");
        const cat = await CategoriaEgreso.findByPk(p.categoriaegreso_id, { transaction: t });
        if (!cat) throw new Error("La categoría indicada no existe");
        if (!cat.imputacioncontable_id) throw new Error("La categoría no tiene imputación contable asociada");
        p.imputacioncontable_id = cat.imputacioncontable_id;
      }
      total += monto;
    }

    if (!(total > 0)) throw new Error("Importe total inválido");

    // Idempotencia por OP
    if (idempotencyKey) {
      const opExistente = await OrdenPago.findOne({
        where: { idempotency_key: idempotencyKey },
        transaction: t,
      });
      if (opExistente) {
        const movBanco = await MovimientoBancoTesoreria.findAll({
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
          movimientosBanco: movBanco,
          movCtaCte: ctaCte || null,
        });
      }
    }
    console.log("paso1")
    const fechaOP = fecha || pagos.find((p) => p.fecha)?.fecha || new Date().toISOString().slice(0, 10);

    console.log("paso2")
    // 1) OP pendiente
    const orden = await OrdenPago.create(
      {
        empresa_id,
        proveedor_id: Number(proveedor_id),

        proyecto_id:
          pagos[0]?.proyecto_id
            ? Number(pagos[0].proyecto_id)
            : null,

        comprobanteegreso_id: null,
        fecha: fechaOP,
        total,
        estado: "pendiente_aplicacion",
        numero: null,
        observaciones: observaciones || null,
        origen: "anticipo_banco",
        idempotency_key: idempotencyKey || null,
      },
      { transaction: t }
    );

    // 2) Movimientos BANCO (EGRESOS) — con categoría, imputación e idempotencia por pago
    const movsBanco = [];
    for (let i = 0; i < pagos.length; i++) {
      const p = pagos[i];
      const fechaPago = p.fecha || fechaOP;

      // Traer el proveedor para mostrar su nombre en la descripción
      const prov = await Proveedor.findByPk(proveedor_id, {
        attributes: ["id", "nombre"],
        transaction: t,
      });
      const provNombre =
        prov?.nombre?.trim() ||
        `Proveedor #${proveedor_id}`;

      console.log("paso3")
      const mov = await MovimientoBancoTesoreria.create(
        {
          empresa_id,
          proveedor_id,
          tipo: "egreso",
          descripcion: p.detalle || `Anticipo a ${provNombre}`, // 👈 acá usamos el nombre
          monto: N(p.monto),
          fecha: fechaPago,
          banco_id: p.banco_id,
          formapago_id: p.formapago_id || null,
          referencia_id: orden.id,
          referencia_tipo: "OrdenPago",
          observaciones: p.observaciones || null,
          anulado: false,
          ordenpago_id: orden.id,

          proyecto_id:
            p.proyecto_id
              ? Number(p.proyecto_id)
              : null,

          categoriaegreso_id:
            p.categoriaegreso_id || null,

          imputacioncontable_id:
            p.imputacioncontable_id || null,

          idempotency_key:
            p.idempotency_key ||
            (idempotencyKey
              ? `${idempotencyKey}#${i}`
              : null),
        },
        { transaction: t }
      );
      movsBanco.push(mov);
    }

    console.log("paso4")
    // 3) Cta Cte (ABONO)
    const movCtaCte = await MovimientoCtaCteProveedor.create(
      {
        proveedor_id,
        empresa_id,
        fecha: fechaOP,
        fecha_pago: fechaOP,
        descripcion: `Anticipo proveedor desde Banco OP #${orden.id}`,
        tipo: "abono", // 👈 importante
        importe: total,
        origen_tipo: "OrdenPago",
        origen_id: orden.id,
        comprobanteegreso_id: null,
        anulado: false,
        ordenpago_id: orden.id,
        referencia_tipo: "MovimientoBancoTesoreria",   // 👈 agregar
        referencia_id: movsBanco[0]?.id || null,      // 👈 si hay varios pagos, podés
        formapago_id: movsBanco[0]?.formapago_id || null,
      },
      { transaction: t }
    );

    await t.commit();
    return res.status(201).json({
      ok: true,
      mensaje: "Anticipo por banco registrado. OP creada y aplicado a Cta Cte.",
      ordenpago: orden,
      movimientosBanco: movsBanco,
      movCtaCte,
    });
  } catch (error) {
    await t.rollback();
    console.error("❌ registrarAnticipoProveedorBanco:", error);
    return res.status(400).json({ error: error.message || "No se pudo registrar el anticipo por banco" });
  }
};


/* ===================== IMPORTACIÓN DESDE EXCEL - CONCILIACIÓN BANCARIA ===================== */
/**
 * POST /movimientos-banco-tesoreria/importar-excel
 *
 * FormData:
 * - file
 * - empresa_id
 * - banco_id
 *
 * Columnas esperadas:
 * - fecha
 * - descripcion
 * - monto
 * - tipo              -> "ingreso" | "egreso"
 * - proveedor
 * - categoria
 * - proyecto
 * - observaciones     -> opcional
 *
 * IMPORTANTE:
 * Esta importación corresponde exclusivamente a movimientos
 * utilizados para conciliación bancaria.
 *
 * Por lo tanto:
 * - NO genera OrdenPago.
 * - NO genera movimientos de Cuenta Corriente.
 * - NO genera cobranzas.
 * - NO genera comprobantes.
 * - NO genera ningún otro efecto financiero.
 *
 * Cada fila crea ÚNICAMENTE un MovimientoBancoTesoreria.
 */
export const importarMovimientosBancoExcel = async (req, res) => {

  try {

    const empresa_id =
      Number(req.body?.empresa_id);

    const banco_id =
      Number(req.body?.banco_id);


    // ============================================================
    // 1. VALIDACIONES GENERALES
    // ============================================================

    if (!empresa_id) {

      return res.status(400).json({
        error: "empresa_id es requerido.",
      });
    }


    if (!banco_id) {

      return res.status(400).json({
        error: "banco_id es requerido.",
      });
    }


    /*
     * El banco se selecciona UNA SOLA VEZ en el frontend
     * y se aplica a todas las filas importadas.
     */

    const banco =
      await Banco.findOne({
        where: {
          id: banco_id,
          empresa_id,
        },
      });


    if (!banco) {

      return res.status(400).json({
        error:
          "El banco no existe o no pertenece a la empresa indicada.",
      });
    }


    if (!req.file?.buffer) {

      return res.status(400).json({
        error:
          "Debe adjuntar un archivo Excel en el campo 'file'.",
      });
    }


    // ============================================================
    // 2. LEER EXCEL
    // ============================================================

    const wb =
      xlsx.read(
        req.file.buffer,
        {
          type: "buffer",
        }
      );


    const ws =
      wb.Sheets[
      wb.SheetNames[0]
      ];


    const rowsRaw =
      xlsx.utils.sheet_to_json(
        ws,
        {
          defval: "",
        }
      );


    if (!rowsRaw.length) {

      return res.status(400).json({
        error:
          "El Excel no contiene filas.",
      });
    }


    // ============================================================
    // 3. NORMALIZADORES
    // ============================================================

    const norm = (s) =>
      String(s || "")
        .trim()
        .toLowerCase();


    const toISODate = (v) => {

      const raw =
        String(v || "").trim();


      if (!raw) {
        return null;
      }


      /*
       * Serial de Excel.
       */

      if (
        !Number.isNaN(Number(raw)) &&
        Number(raw) > 25569
      ) {

        const d =
          new Date(
            Math.round(
              (Number(raw) - 25569) *
              86400 *
              1000
            )
          );


        return d
          .toISOString()
          .slice(0, 10);
      }


      /*
       * DD/MM/YYYY
       * DD-MM-YYYY
       */

      const m1 =
        /^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/
          .exec(raw);


      if (m1) {

        const dd =
          m1[1].padStart(2, "0");

        const mm =
          m1[2].padStart(2, "0");

        const yyyy =
          m1[3];


        return `${yyyy}-${mm}-${dd}`;
      }


      /*
       * YYYY-MM-DD
       */

      const m2 =
        /^(\d{4})-(\d{1,2})-(\d{1,2})$/
          .exec(raw);


      if (m2) {

        const yyyy =
          m2[1];

        const mm =
          m2[2].padStart(2, "0");

        const dd =
          m2[3].padStart(2, "0");


        return `${yyyy}-${mm}-${dd}`;
      }


      /*
       * Fallback.
       */

      const d =
        new Date(raw);


      if (!isNaN(d.getTime())) {

        return d
          .toISOString()
          .slice(0, 10);
      }


      return null;
    };


    const toNumber = (v) => {

      if (typeof v === "number") {
        return Number.isFinite(v)
          ? v
          : NaN;
      }

      let s =
        String(v ?? "")
          .trim()
          .replace(/\s/g, "");

      if (!s) {
        return NaN;
      }

      // Permitir valores monetarios pegados como "$ 1.500,50"
      s =
        s.replace(/[$]/g, "");

      const tienePunto =
        s.includes(".");

      const tieneComa =
        s.includes(",");


      // ============================================================
      // CASO 1: tiene punto Y coma
      //
      // El separador que aparece último se considera decimal.
      //
      // 1.500,50  -> 1500.50
      // 1,500.50  -> 1500.50
      // ============================================================

      if (
        tienePunto &&
        tieneComa
      ) {

        const ultimoPunto =
          s.lastIndexOf(".");

        const ultimaComa =
          s.lastIndexOf(",");


        if (
          ultimaComa >
          ultimoPunto
        ) {

          // Formato argentino:
          // 1.500,50

          s =
            s
              .replace(/\./g, "")
              .replace(",", ".");

        } else {

          // Formato internacional:
          // 1,500.50

          s =
            s.replace(/,/g, "");
        }

      } else if (tieneComa) {

        // ==========================================================
        // CASO 2: solamente coma
        //
        // 150000,50 -> decimal
        // 1,500     -> miles
        // ==========================================================

        const partes =
          s.split(",");


        if (
          partes.length === 2 &&
          partes[1].length === 3
        ) {

          s =
            partes.join("");

        } else {

          s =
            s.replace(",", ".");
        }

      } else if (tienePunto) {

        // ==========================================================
        // CASO 3: solamente punto
        //
        // 150000.50 -> decimal
        // 1.500     -> miles
        // ==========================================================

        const partes =
          s.split(".");


        if (
          partes.length === 2 &&
          partes[1].length === 3
        ) {

          s =
            partes.join("");

        }
        // Si no tiene exactamente 3 decimales,
        // dejamos el punto como separador decimal.
      }


      const n =
        Number(s);


      return Number.isFinite(n)
        ? n
        : NaN;
    };


    // ============================================================
    // 4. CATÁLOGOS
    // ============================================================

    const proveedores =
      await Proveedor.findAll();

    const clientes =
      await Cliente.findAll();

    const categoriasEgreso =
      await CategoriaEgreso.findAll();

    const categoriasIngreso =
      await CategoriaIngreso.findAll();

    const proyectos =
      await Proyecto.findAll();


    /*
     * Proveedores.
     *
     * Conservamos las tres formas que utiliza también
     * el frontend:
     *
     * - razonsocial
     * - nombre
     * - descripcion
     */

    const proveedorMap =
      new Map();


    for (const p of proveedores) {

      [
        p.razonsocial,
        p.nombre,
        p.descripcion,
      ].forEach((k) => {

        const key =
          norm(k);


        if (
          key &&
          !proveedorMap.has(key)
        ) {

          proveedorMap.set(
            key,
            p
          );
        }
      });
    }

    /*
     * Clientes.
     */

    const clienteMap =
      new Map();


    for (const c of clientes) {

      [
        c.razonsocial,
        c.razon_social,
        c.nombre,
        c.descripcion,
      ].forEach((k) => {

        const key =
          norm(k);


        if (
          key &&
          !clienteMap.has(key)
        ) {

          clienteMap.set(
            key,
            c
          );
        }
      });
    }

    /*
     * Categorías.
     */

    // ============================================================
    // CATEGORÍAS DE EGRESO
    // ============================================================

    const categoriaEgresoMap =
      new Map();

    for (const c of categoriasEgreso) {

      const key =
        norm(c.nombre);

      if (key) {

        categoriaEgresoMap.set(
          key,
          c
        );
      }
    }


    // ============================================================
    // CATEGORÍAS DE INGRESO
    // ============================================================

    const categoriaIngresoMap =
      new Map();

    for (const c of categoriasIngreso) {

      const key =
        norm(c.nombre);

      if (key) {

        categoriaIngresoMap.set(
          key,
          c
        );
      }
    }


    /*
     * Proyectos.
     */

    const proyectoMap =
      new Map();


    for (const pr of proyectos) {

      [
        pr.descripcion,
        pr.nombre,
      ].forEach((k) => {

        const key =
          norm(k);


        if (
          key &&
          !proyectoMap.has(key)
        ) {

          proyectoMap.set(
            key,
            pr
          );
        }
      });
    }


    // ============================================================
    // 5. LOCALIZAR COLUMNAS
    // ============================================================

    const keyOf = (
      row,
      ...cands
    ) => {

      const keys =
        Object.keys(row);

      const wanted =
        cands.map(norm);


      for (const k of keys) {

        if (
          wanted.includes(
            norm(k)
          )
        ) {

          return k;
        }
      }


      return null;
    };


    // ============================================================
    // 6. VALIDAR Y PREPARAR TODAS LAS FILAS
    // ============================================================

    const errores = [];


    const parsed =
      rowsRaw.map(
        (row, idx0) => {

          /*
           * +2 porque:
           *
           * fila 1 = encabezado Excel
           * fila 2 = primer movimiento
           */

          const idx =
            idx0 + 2;


          const kFecha =
            keyOf(
              row,
              "fecha"
            );


          const kTipo =
            keyOf(
              row,
              "tipo"
            );


          const kDesc =
            keyOf(
              row,
              "descripcion",
              "descripción",
              "concepto"
            );


          const kMonto =
            keyOf(
              row,
              "monto",
              "importe",
              "total"
            );


          const kEntidad =
            keyOf(
              row,
              "entidad",
              "proveedor"
            );

          const kCat =
            keyOf(
              row,
              "categoria",
              "categoría"
            );


          const kProy =
            keyOf(
              row,
              "proyecto"
            );


          const kObs =
            keyOf(
              row,
              "observaciones",
              "obs"
            );


          const fecha =
            toISODate(
              row[kFecha]
            );


          const tipo =
            norm(
              row[kTipo]
            );


          const descripcion =
            String(
              row[kDesc] || ""
            ).trim();


          const monto =
            toNumber(
              row[kMonto]
            );


          const entidadNombre =
            norm(
              row[kEntidad]
            );


          const categoriaNombre =
            norm(
              row[kCat]
            );


          const proyectoNombre =
            norm(
              row[kProy]
            );


          const observaciones =
            String(
              row[kObs] || ""
            ).trim() || null;


          // ======================================================
          // VALIDACIONES DE LA FILA
          // ======================================================

          const filaErrores =
            [];


          if (!fecha) {

            filaErrores.push(
              "Fecha inválida o ausente."
            );
          }


          /*
           * AHORA la importación admite ambos tipos.
           */

          if (
            tipo !== "ingreso" &&
            tipo !== "egreso"
          ) {

            filaErrores.push(
              'Tipo inválido. Debe ser "ingreso" o "egreso".'
            );
          }


          if (!descripcion) {

            filaErrores.push(
              "Descripción requerida."
            );
          }


          if (
            !Number.isFinite(monto) ||
            monto <= 0
          ) {

            filaErrores.push(
              "Monto inválido (> 0)."
            );
          }


          if (!entidadNombre) {

            filaErrores.push(
              "Entidad requerida."
            );
          }


          if (!categoriaNombre) {

            filaErrores.push(
              "Categoría requerida."
            );
          }


          if (!proyectoNombre) {

            filaErrores.push(
              "Proyecto requerido."
            );
          }


          // ======================================================
          // ENTIDAD
          //
          // ingreso → cliente
          // egreso  → proveedor
          // ======================================================

          let proveedor =
            null;

          let cliente =
            null;


          if (tipo === "egreso") {

            proveedor =
              entidadNombre
                ? proveedorMap.get(
                  entidadNombre
                )
                : null;


            if (!proveedor) {

              filaErrores.push(
                `Proveedor no encontrado: "${row[kEntidad] || ""}".`
              );
            }
          }


          if (tipo === "ingreso") {

            cliente =
              entidadNombre
                ? clienteMap.get(
                  entidadNombre
                )
                : null;


            if (!cliente) {

              filaErrores.push(
                `Cliente no encontrado: "${row[kEntidad] || ""}".`
              );
            }
          }


          let categoriaegreso_id =
            null;

          let categoriaingreso_id =
            null;

          let imputacioncontable_id =
            null;


          // ======================================================
          // EGRESO
          // ======================================================

          if (tipo === "egreso") {

            const categoria =
              categoriaNombre
                ? categoriaEgresoMap.get(
                  categoriaNombre
                )
                : null;


            if (!categoria) {

              filaErrores.push(
                "Categoría de egreso no encontrada."
              );

            } else {

              categoriaegreso_id =
                categoria.id;

              imputacioncontable_id =
                categoria.imputacioncontable_id ||
                null;


              if (!imputacioncontable_id) {

                filaErrores.push(
                  "La categoría de egreso no tiene imputación contable asociada."
                );
              }
            }
          }


          // ======================================================
          // INGRESO
          // ======================================================

          if (tipo === "ingreso") {

            const categoria =
              categoriaNombre
                ? categoriaIngresoMap.get(
                  categoriaNombre
                )
                : null;


            if (!categoria) {

              filaErrores.push(
                "Categoría de ingreso no encontrada."
              );

            } else {

              categoriaingreso_id =
                categoria.id;
            }
          }

          // ======================================================
          // RESOLVER PROYECTO
          // ======================================================

          const proyecto =
            proyectoNombre
              ? proyectoMap.get(
                proyectoNombre
              )
              : null;


          if (!proyecto) {

            filaErrores.push(
              "Proyecto no encontrado."
            );
          }


          if (filaErrores.length) {

            errores.push({
              fila: idx,
              errores:
                filaErrores,
            });
          }


          return {

            idx,

            fecha,

            /*
             * MUY IMPORTANTE:
             * conservamos el tipo real de la fila.
             */

            tipo,

            descripcion,

            monto,

            observaciones,

            banco_id,

            proveedor_id:
              tipo === "egreso"
                ? (proveedor?.id || null)
                : null,

            cliente_id:
              tipo === "ingreso"
                ? (cliente?.id || null)
                : null,

            categoriaegreso_id,

            categoriaingreso_id,

            imputacioncontable_id,

            proyecto_id:
              proyecto?.id ||
              null,
          };
        }
      );


    /*
     * Si existe aunque sea una fila inválida,
     * NO registramos absolutamente nada.
     */

    if (errores.length) {

      return res.status(400).json({
        error:
          "Validación fallida. Corrija los datos e intente nuevamente.",

        detalles:
          errores,
      });
    }


    // ============================================================
    // 7. CREAR MOVIMIENTOS PARA CONCILIACIÓN
    // ============================================================

    const t =
      await sequelize.transaction();


    try {

      const resultados =
        [];


      for (const r of parsed) {

        /*
         * IMPORTANTE:
         *
         * Este flujo NO crea:
         *
         * - OrdenPago
         * - MovimientoCtaCteProveedor
         * - Cobranza
         * - Comprobante
         * - ningún otro registro auxiliar
         *
         * ÚNICAMENTE MovimientoBancoTesoreria.
         */

        const mov =
          await MovimientoBancoTesoreria.create(
            {
              empresa_id,

              tipo:
                r.tipo,

              descripcion:
                r.descripcion,

              monto:
                r.monto,

              fecha:
                r.fecha,

              banco_id:
                r.banco_id,

              formapago_id:
                null,

              referencia_id:
                null,

              referencia_tipo:
                null,

              observaciones:
                r.observaciones,

              anulado:
                false,

              ordenpago_id:
                null,

              categoriaegreso_id:
                r.categoriaegreso_id,

              categoriaingreso_id:
                r.categoriaingreso_id,

              imputacioncontable_id:
                r.imputacioncontable_id,

              proyecto_id:
                r.proyecto_id,

              /*
               * La entidad queda registrada directamente
               * en el movimiento:
               *
               * ingreso → cliente_id
               * egreso  → proveedor_id
               */

              proveedor_id:
                r.proveedor_id,

              cliente_id:
                r.cliente_id,
            },
            {
              transaction: t,
            }
          );


        resultados.push({
          movimiento_id:
            mov.id,

          tipo:
            r.tipo,
        });
      }


      // ==========================================================
      // 8. COMMIT
      // ==========================================================

      await t.commit();


      return res.status(201).json({
        ok:
          true,

        creados:
          resultados.length,

        resultados,
      });


    } catch (errTx) {

      await t.rollback();


      console.error(
        "❌ importarMovimientosBancoExcel (TX):",
        errTx
      );


      return res.status(500).json({
        error:
          "Error al crear movimientos en base",

        detalle:
          errTx.message,
      });
    }


  } catch (error) {

    console.error(
      "❌ importarMovimientosBancoExcel:",
      error
    );


    return res.status(500).json({
      error:
        "Error al procesar el archivo Excel",

      detalle:
        error.message,
    });
  }
};

// ============================================================
// IMPORTAR MOVIMIENTOS DESDE GRILLA
// ============================================================

export const importarMovimientosBancoGrilla = async (req, res) => {

  try {

    const empresa_id =
      Number(req.body?.empresa_id);

    const banco_id =
      Number(req.body?.banco_id);

    const movimientos =
      Array.isArray(req.body?.movimientos)
        ? req.body.movimientos
        : [];


    // ============================================================
    // 1. VALIDACIONES GENERALES
    // ============================================================

    if (!empresa_id) {

      return res.status(400).json({
        error: "empresa_id es requerido.",
      });
    }


    if (!banco_id) {

      return res.status(400).json({
        error: "banco_id es requerido.",
      });
    }


    if (!movimientos.length) {

      return res.status(400).json({
        error: "Debe enviar al menos un movimiento.",
      });
    }


    const banco =
      await Banco.findOne({
        where: {
          id: banco_id,
          empresa_id,
        },
      });


    if (!banco) {

      return res.status(400).json({
        error:
          "El banco no existe o no pertenece a la empresa indicada.",
      });
    }


    // ============================================================
    // 2. NORMALIZADORES
    // ============================================================

    const norm = (s) =>
      String(s || "")
        .trim()
        .toLowerCase();


    const toISODate = (v) => {

      const raw =
        String(v || "").trim();

      if (!raw) {
        return null;
      }


      // DD/MM/YYYY o DD-MM-YYYY

      const m1 =
        /^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/
          .exec(raw);

      if (m1) {

        const dd =
          m1[1].padStart(2, "0");

        const mm =
          m1[2].padStart(2, "0");

        const yyyy =
          m1[3];

        return `${yyyy}-${mm}-${dd}`;
      }


      // YYYY-MM-DD

      const m2 =
        /^(\d{4})-(\d{1,2})-(\d{1,2})$/
          .exec(raw);

      if (m2) {

        const yyyy =
          m2[1];

        const mm =
          m2[2].padStart(2, "0");

        const dd =
          m2[3].padStart(2, "0");

        return `${yyyy}-${mm}-${dd}`;
      }


      return null;
    };


    const toNumber = (v) => {

      if (typeof v === "number") {
        return Number.isFinite(v)
          ? v
          : NaN;
      }

      let s =
        String(v ?? "")
          .trim()
          .replace(/\s/g, "");

      if (!s) {
        return NaN;
      }

      // Permitir valores monetarios pegados como "$ 1.500,50"
      s =
        s.replace(/[$]/g, "");

      const tienePunto =
        s.includes(".");

      const tieneComa =
        s.includes(",");


      // ============================================================
      // CASO 1: tiene punto Y coma
      //
      // El separador que aparece último se considera decimal.
      //
      // 1.500,50  -> 1500.50
      // 1,500.50  -> 1500.50
      // ============================================================

      if (
        tienePunto &&
        tieneComa
      ) {

        const ultimoPunto =
          s.lastIndexOf(".");

        const ultimaComa =
          s.lastIndexOf(",");


        if (
          ultimaComa >
          ultimoPunto
        ) {

          // Formato argentino:
          // 1.500,50

          s =
            s
              .replace(/\./g, "")
              .replace(",", ".");

        } else {

          // Formato internacional:
          // 1,500.50

          s =
            s.replace(/,/g, "");
        }

      } else if (tieneComa) {

        // ==========================================================
        // CASO 2: solamente coma
        //
        // 150000,50 -> decimal
        // 1,500     -> miles
        // ==========================================================

        const partes =
          s.split(",");


        if (
          partes.length === 2 &&
          partes[1].length === 3
        ) {

          s =
            partes.join("");

        } else {

          s =
            s.replace(",", ".");
        }

      } else if (tienePunto) {

        // ==========================================================
        // CASO 3: solamente punto
        //
        // 150000.50 -> decimal
        // 1.500     -> miles
        // ==========================================================

        const partes =
          s.split(".");


        if (
          partes.length === 2 &&
          partes[1].length === 3
        ) {

          s =
            partes.join("");

        }
        // Si no tiene exactamente 3 decimales,
        // dejamos el punto como separador decimal.
      }


      const n =
        Number(s);


      return Number.isFinite(n)
        ? n
        : NaN;
    };


    // ============================================================
    // 3. CATÁLOGOS
    // ============================================================

    const proveedores =
      await Proveedor.findAll();

    const clientes =
      await Cliente.findAll();

    const categoriasEgreso =
      await CategoriaEgreso.findAll();

    const categoriasIngreso =
      await CategoriaIngreso.findAll();

    const proyectos =
      await Proyecto.findAll();


    const proveedorMap =
      new Map();


    for (const p of proveedores) {

      [
        p.razonsocial,
        p.nombre,
        p.descripcion,
      ].forEach((k) => {

        const key =
          norm(k);

        if (
          key &&
          !proveedorMap.has(key)
        ) {

          proveedorMap.set(
            key,
            p
          );
        }
      });
    }

    const clienteMap =
      new Map();


    for (const c of clientes) {

      [
        c.razonsocial,
        c.razon_social,
        c.nombre,
        c.descripcion,
      ].forEach((k) => {

        const key =
          norm(k);

        if (
          key &&
          !clienteMap.has(key)
        ) {

          clienteMap.set(
            key,
            c
          );
        }
      });
    }

    const categoriaEgresoMap =
      new Map();

    for (const c of categoriasEgreso) {

      const key =
        norm(c.nombre);

      if (key) {

        categoriaEgresoMap.set(
          key,
          c
        );
      }
    }


    const categoriaIngresoMap =
      new Map();

    for (const c of categoriasIngreso) {

      const key =
        norm(c.nombre);

      if (key) {

        categoriaIngresoMap.set(
          key,
          c
        );
      }
    }

    const proyectoMap =
      new Map();


    for (const pr of proyectos) {

      [
        pr.descripcion,
        pr.nombre,
      ].forEach((k) => {

        const key =
          norm(k);

        if (
          key &&
          !proyectoMap.has(key)
        ) {

          proyectoMap.set(
            key,
            pr
          );
        }
      });
    }


    // ============================================================
    // 4. VALIDAR Y PREPARAR FILAS
    // ============================================================

    const errores = [];


    const parsed =
      movimientos.map(
        (row, idx0) => {

          /*
           * En la grilla no existe encabezado.
           * Primera fila = 1.
           */

          const idx =
            idx0 + 1;


          const fecha =
            toISODate(
              row?.fecha
            );


          const tipo =
            norm(
              row?.tipo
            );


          const descripcion =
            String(
              row?.descripcion || ""
            ).trim();


          const monto =
            toNumber(
              row?.monto
            );


          const entidadNombre =
            norm(
              row?.entidad
            );


          const categoriaNombre =
            norm(
              row?.categoria
            );


          const proyectoNombre =
            norm(
              row?.proyecto
            );


          const observaciones =
            String(
              row?.observaciones || ""
            ).trim() || null;


          // ======================================================
          // VALIDACIONES
          // ======================================================

          const filaErrores =
            [];


          if (!fecha) {

            filaErrores.push(
              "Fecha inválida o ausente."
            );
          }


          if (
            tipo !== "ingreso" &&
            tipo !== "egreso"
          ) {

            filaErrores.push(
              'Tipo inválido. Debe ser "ingreso" o "egreso".'
            );
          }


          if (!descripcion) {

            filaErrores.push(
              "Descripción requerida."
            );
          }


          if (
            !Number.isFinite(monto) ||
            monto <= 0
          ) {

            filaErrores.push(
              "Monto inválido (> 0)."
            );
          }


          if (!entidadNombre) {

            filaErrores.push(
              "Entidad requerida."
            );
          }

          if (!categoriaNombre) {

            filaErrores.push(
              "Categoría requerida."
            );
          }


          if (!proyectoNombre) {

            filaErrores.push(
              "Proyecto requerido."
            );
          }


          // ======================================================
          // ENTIDAD
          //
          // ingreso → cliente
          // egreso  → proveedor
          // ======================================================

          let proveedor =
            null;

          let cliente =
            null;


          if (tipo === "egreso") {

            proveedor =
              entidadNombre
                ? proveedorMap.get(
                  entidadNombre
                )
                : null;


            if (!proveedor) {

              filaErrores.push(
                `Proveedor no encontrado: "${row?.entidad || ""}".`
              );
            }
          }


          if (tipo === "ingreso") {

            cliente =
              entidadNombre
                ? clienteMap.get(
                  entidadNombre
                )
                : null;


            if (!cliente) {

              filaErrores.push(
                `Cliente no encontrado: "${row?.entidad || ""}".`
              );
            }
          }


          // ======================================================
          // CATEGORÍA
          // ======================================================

          let categoriaegreso_id =
            null;

          let categoriaingreso_id =
            null;

          let imputacioncontable_id =
            null;


          // ======================================================
          // EGRESO
          // ======================================================

          if (tipo === "egreso") {

            const categoria =
              categoriaNombre
                ? categoriaEgresoMap.get(
                  categoriaNombre
                )
                : null;


            if (!categoria) {

              filaErrores.push(
                "Categoría de egreso no encontrada."
              );

            } else {

              categoriaegreso_id =
                categoria.id;

              imputacioncontable_id =
                categoria.imputacioncontable_id ||
                null;


              if (!imputacioncontable_id) {

                filaErrores.push(
                  "La categoría de egreso no tiene imputación contable asociada."
                );
              }
            }
          }


          // ======================================================
          // INGRESO
          // ======================================================

          if (tipo === "ingreso") {

            const categoria =
              categoriaNombre
                ? categoriaIngresoMap.get(
                  categoriaNombre
                )
                : null;


            if (!categoria) {

              filaErrores.push(
                "Categoría de ingreso no encontrada."
              );

            } else {

              categoriaingreso_id =
                categoria.id;
            }
          }


          // ======================================================
          // PROYECTO
          // ======================================================

          const proyecto =
            proyectoNombre
              ? proyectoMap.get(
                proyectoNombre
              )
              : null;


          if (!proyecto) {

            filaErrores.push(
              "Proyecto no encontrado."
            );
          }


          if (filaErrores.length) {

            errores.push({
              fila: idx,
              errores: filaErrores,
            });
          }


          return {

            idx,

            fecha,

            tipo,

            descripcion,

            monto,

            observaciones,

            banco_id,

            proveedor_id:
              tipo === "egreso"
                ? (proveedor?.id || null)
                : null,

            cliente_id:
              tipo === "ingreso"
                ? (cliente?.id || null)
                : null,

            categoriaegreso_id,

            categoriaingreso_id,

            imputacioncontable_id,

            proyecto_id:
              proyecto?.id ||
              null,
          };
        }
      );


    /*
     * Atomicidad:
     * si UNA fila falla, no grabamos ninguna.
     */

    if (errores.length) {

      return res.status(400).json({
        error:
          "Validación fallida. Corrija los datos e intente nuevamente.",

        detalles:
          errores,
      });
    }


    // ============================================================
    // 5. CREAR SOLAMENTE MOVIMIENTOS BANCARIOS
    // ============================================================

    const t =
      await sequelize.transaction();


    try {

      const resultados =
        [];


      for (const r of parsed) {

        /*
         * Este flujo de conciliación crea ÚNICAMENTE:
         *
         * MovimientoBancoTesoreria
         *
         * No crea OP, cuenta corriente, cobranza,
         * comprobantes ni ningún otro registro.
         */

        const mov =
          await MovimientoBancoTesoreria.create(
            {
              empresa_id,

              tipo:
                r.tipo,

              descripcion:
                r.descripcion,

              monto:
                r.monto,

              fecha:
                r.fecha,

              banco_id:
                r.banco_id,

              proveedor_id:
                r.proveedor_id,

              cliente_id:
                r.cliente_id,

              proyecto_id:
                r.proyecto_id,

              categoriaegreso_id:
                r.categoriaegreso_id,

              categoriaingreso_id:
                r.categoriaingreso_id,

              imputacioncontable_id:
                r.imputacioncontable_id,

              formapago_id:
                null,

              referencia_id:
                null,

              referencia_tipo:
                null,

              ordenpago_id:
                null,

              comprobanteegreso_id:
                null,

              comprobanteingreso_id:
                null,

              observaciones:
                r.observaciones,

              anulado:
                false,
            },
            {
              transaction: t,
            }
          );


        resultados.push({
          movimiento_id:
            mov.id,

          tipo:
            r.tipo,
        });
      }


      await t.commit();


      return res.status(201).json({
        ok: true,

        creados:
          resultados.length,

        resultados,
      });


    } catch (errTx) {

      await t.rollback();


      console.error(
        "❌ importarMovimientosBancoGrilla (TX):",
        errTx
      );


      return res.status(500).json({
        error:
          "Error al crear movimientos en base",

        detalle:
          errTx.message,
      });
    }


  } catch (error) {

    console.error(
      "❌ importarMovimientosBancoGrilla:",
      error
    );


    return res.status(500).json({
      error:
        "Error al procesar la grilla",

      detalle:
        error.message,
    });
  }
};
/**
 * POST /movimientos-banco-tesoreria/ingresos/varios
 * Crea un movimiento bancario (ingreso) genérico (no asociado a clientes)
 */
export const registrarIngresoBancoVarios = async (req, res, next) => {
  const t = await sequelize.transaction();
  try {
    const {
      empresa_id,
      banco_id,
      fecha,
      descripcion,
      montoTotal,
      proyecto_id = null,
      categoriaingreso_id = null,
      observaciones = null,
      formapago_id = null,      // transferencia, cheque, etc.
      idempotencyKey = null,
    } = req.body || {};

    // Validaciones
    if (!empresa_id || !banco_id) {
      await t.rollback();
      return res.status(400).json({ error: "empresa_id y banco_id son requeridos" });
    }
    if (!descripcion?.trim()) {
      await t.rollback();
      return res.status(400).json({ error: "descripcion es requerida" });
    }
    const monto = Number(montoTotal);
    if (!Number.isFinite(monto) || monto <= 0) {
      await t.rollback();
      return res.status(400).json({ error: "Monto inválido" });
    }

    // Idempotencia opcional
    if (idempotencyKey) {
      const existente = await MovimientoBancoTesoreria.findOne({
        where: { idempotency_key: idempotencyKey, tipo: "ingreso" },
        transaction: t,
        lock: t.LOCK.UPDATE,
      });
      if (existente) {
        await t.commit();
        return res.json({ ok: true, reused: true, movimiento: existente });
      }
    }

    // Crear movimiento (INGRESO)
    const movimiento = await MovimientoBancoTesoreria.create(
      {
        tipo: "ingreso",
        descripcion: descripcion.trim(),
        monto,
        fecha: fecha || sequelize.literal("CURRENT_DATE"),
        banco_id,
        empresa_id,
        formapago_id: formapago_id || null,
        referencia_id: null,
        referencia_tipo: "IngresoBancoVarios",
        observaciones: observaciones || null,
        categoriaegreso_id: null,
        categoriaingreso_id: categoriaingreso_id || null,
        imputacioncontable_id: null,
        idempotency_key: idempotencyKey || null,
        proyecto_id: proyecto_id || null,
        ordenpago_id: null,
        anulado: false,
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

export const registrarIngresoBancoCobranzaClientes = async (req, res, next) => {
  const t = await sequelize.transaction();
  try {
    const {
      empresa_id,
      banco_id,
      clienteId,
      fecha,
      descripcion,
      montoTotal,
      proyecto_id = null,
      categoriaingreso_id = null,
      observaciones = null,
      formapago_id = null,   // transferencia, cheque, etc. (OBLIGATORIO en banco)
      idempotencyKey = null,
      // ❌ detallesCobranza eliminado a pedido
    } = req.body || {};

    // ===== Validaciones mínimas
    if (!empresa_id || !banco_id) {
      await t.rollback();
      return res.status(400).json({ error: "empresa_id y banco_id son requeridos" });
    }
    if (!clienteId) {
      await t.rollback();
      return res.status(400).json({ error: "clienteId es requerido" });
    }
    if (!descripcion?.trim()) {
      await t.rollback();
      return res.status(400).json({ error: "descripcion es requerida" });
    }
    const monto = Number(montoTotal);
    if (!Number.isFinite(monto) || monto <= 0) {
      await t.rollback();
      return res.status(400).json({ error: "Monto inválido" });
    }
    if (!formapago_id) {
      await t.rollback();
      return res.status(400).json({ error: "formapago_id es requerido para ingresos bancarios" });
    }

    // ===== Idempotencia (opcional)
    if (idempotencyKey) {
      const existente = await MovimientoBancoTesoreria.findOne({
        where: { idempotency_key: idempotencyKey, tipo: "ingreso" },
        transaction: t,
        lock: t.LOCK.UPDATE,
      });
      if (existente) {
        await t.commit();
        return res.json({ ok: true, reused: true, movimiento: existente });
      }
    }

    // ===== Cliente (solo para armar la descripción legible)
    const cliente = await Cliente.findByPk(clienteId, { transaction: t, lock: t.LOCK.UPDATE });
    if (!cliente) {
      await t.rollback();
      return res.status(404).json({ error: "Cliente no encontrado" });
    }

    // ===== ÚNICA operación: crear MovimientoBancoTesoreria (INGRESO)
    const movimiento = await MovimientoBancoTesoreria.create(
      {
        tipo: "ingreso",
        descripcion: `INGRESO BANCO - ${cliente.razonsocial || cliente.nombre || `Cliente #${cliente.id}`}: ${descripcion.trim()}`,
        monto,
        fecha: fecha || sequelize.literal("CURRENT_DATE"),
        banco_id,
        empresa_id,
        cliente_id: Number(clienteId),
        formapago_id, // obligatorio en banco
        referencia_id: null,
        referencia_tipo: null, // ya no apuntamos a Cobranza
        observaciones: observaciones || null,
        categoriaegreso_id: null,
        categoriaingreso_id: categoriaingreso_id || null,
        imputacioncontable_id: null,
        idempotency_key: idempotencyKey || null,
        proyecto_id: proyecto_id || null,
        ordenpago_id: null,
        anulado: false,
      },
      { transaction: t }
    );

    await t.commit();
    return res.json({
      ok: true,
      movimiento,
      // opcional: devolvemos datos mínimos del cliente para UI/redirecciones
      cliente: { id: cliente.id, nombre: cliente.nombre, razonsocial: cliente.razonsocial },
    });
  } catch (err) {
    await t.rollback();
    next(err);
  }
};


/**
 * GET /movimientos-banco-tesoreria
 * Filtros: empresa_id?, banco_id?, tipo?, fecha_desde?, fecha_hasta?, includeAnulados?
 */
export const listarMovimientosBanco = async (req, res, next) => {
  try {
    const {
      empresa_id,
      banco_id,
      tipo,
      fecha_desde,
      fecha_hasta,
      includeAnulados = "0",
    } = req.query || {};

    const where = {};
    if (empresa_id) where.empresa_id = Number(empresa_id);
    if (banco_id) where.banco_id = Number(banco_id);
    if (tipo) where.tipo = String(tipo).toLowerCase() === "egreso" ? "egreso" : "ingreso";

    if (fecha_desde || fecha_hasta) {
      where.fecha = {};
      if (fecha_desde) where.fecha[Op.gte] = fecha_desde;
      if (fecha_hasta) where.fecha[Op.lte] = fecha_hasta;
    }
    if (includeAnulados !== "1") where.anulado = false;

    const lista = await MovimientoBancoTesoreria.findAll({
      where,
      order: [["fecha", "ASC"], ["id", "ASC"]],
    });

    return res.json(lista);
  } catch (err) {
    next(err);
  }
};

/**
 * GET /movimientos-banco-tesoreria/:id
 */
export const obtenerMovimientoBancoPorId = async (req, res, next) => {
  try {
    const row = await MovimientoBancoTesoreria.findByPk(req.params.id);
    if (!row) return res.status(404).json({ error: "Movimiento no encontrado" });
    return res.json(row);
  } catch (err) {
    next(err);
  }
};

/**
 * PUT /movimientos-banco-tesoreria/:id
 * Edición básica (descripcion, observaciones, categoriaingreso_id, proyecto_id, anulado)
 * *No* permite cambiar empresa_id/banco_id/tipo/monto en este endpoint (puede hacerse otro específico).
 */
export const actualizarMovimientoBanco = async (req, res, next) => {
  const t = await sequelize.transaction();
  try {
    const row = await MovimientoBancoTesoreria.findByPk(req.params.id, {
      transaction: t,
      lock: t.LOCK.UPDATE,
    });
    if (!row) {
      await t.rollback();
      return res.status(404).json({ error: "Movimiento no encontrado" });
    }

    const {
      descripcion,
      observaciones,
      categoriaingreso_id = null,
      proyecto_id = null,
      anulado = undefined,
    } = req.body || {};

    const updates = {};
    if (descripcion !== undefined) updates.descripcion = String(descripcion || "").trim();
    if (observaciones !== undefined) updates.observaciones = observaciones || null;
    if (categoriaingreso_id !== undefined) updates.categoriaingreso_id = categoriaingreso_id || null;
    if (proyecto_id !== undefined) updates.proyecto_id = proyecto_id || null;
    if (anulado !== undefined) updates.anulado = !!anulado;

    await row.update(updates, { transaction: t });
    await t.commit();
    return res.json({ ok: true, movimiento: row });
  } catch (err) {
    await t.rollback();
    next(err);
  }
};

/**
 * DELETE /movimientos-banco-tesoreria/:id
 * Anula (soft delete) el movimiento. Si necesitás hard delete, cambiá a destroy().
 */
export const anularMovimientoBanco = async (req, res, next) => {
  const t = await sequelize.transaction();
  try {
    const row = await MovimientoBancoTesoreria.findByPk(req.params.id, {
      transaction: t,
      lock: t.LOCK.UPDATE,
    });
    if (!row) {
      await t.rollback();
      return res.status(404).json({ error: "Movimiento no encontrado" });
    }
    await row.update({ anulado: true }, { transaction: t });
    await t.commit();
    return res.json({ ok: true });
  } catch (err) {
    await t.rollback();
    next(err);
  }
};
