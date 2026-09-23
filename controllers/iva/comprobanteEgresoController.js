import ComprobanteEgreso from "../../models/iva/comprobanteegreso.js";
import MovimientoCajaTesoreria from "../../models/tesoreria/movimientocajatesoreria.js"
import MovimientoBancoTesoreria from "../../models/tesoreria/movimientobancotesoreria.js";
import EcheqEmitido from "../../models/tesoreria/pagoecheq.js";
import PagoTarjetaCredito from "../../models/tesoreria/pagotarjetacredito.js";
import MovimientoCtaCteProveedor from "../../models/tesoreria/movimientoctacteproveedor.js";
import MovimientoCtaCteProveedorAplic
  from "../../models/tesoreria/movimientoctacteproveedoraplicacion.js";
import OrdenPago from "../../models/tesoreria/ordendepago.js";
import PagoProgramadoTesoreria
  from "../../models/tesoreria/PagoProgramadoTesoreria.js";
import { sequelize } from "../../config/database.js"; // <-- importa la instancia
import GastoEstimado from "../../models/tesoreria/gastoestimado.js";
import GastoEstimadoInstancia from "../../models/tesoreria/gastoestimadoinstancia.js";
import GastoEstimadoPago from "../../models/tesoreria/gastoestimadopago.js";
import { Op, } from "sequelize";
import Hacienda from "../../models/gmedia/hacienda.js";
import AjusteComprobanteEgreso
  from "../../models/tesoreria/ajusteComprobanteEgreso.js";
import {
  recalcularComprobanteEgreso,
} from "../tesoreria/helpers/recalcularComprobanteEgreso.js";
function validarDatosFiscalesComprobante(data = {}) {

  const ivaEspecial =
    Number(
      data.iva_especial || 0
    );

  const ivaEspecialPorcentaje =
    Number(
      data.iva_especial_porcentaje || 0
    );

  if (
    ivaEspecial > 0 &&
    ivaEspecialPorcentaje <= 0
  ) {
    throw new Error(
      "Debe indicar el porcentaje correspondiente al IVA especial"
    );
  }

  if (
    ivaEspecialPorcentaje > 0 &&
    ivaEspecial <= 0
  ) {
    throw new Error(
      "Debe indicar el importe correspondiente al IVA especial"
    );
  }
}

// Crear nuevo comprobante de egreso
export const crearComprobanteEgreso = async (req, res) => {
  try {

    validarDatosFiscalesComprobante(
      req.body
    );

    const nuevo =
      await ComprobanteEgreso.create(
        req.body
      );

    res.status(201).json(
      nuevo
    );

  } catch (error) {

    res.status(500).json({
      error:
        "Error al crear comprobante de egreso",
      detalle:
        error.message,
    });
  }
};

// Listar todos
export const listarComprobantesEgreso = async (req, res) => {
  try {
    const { empresa_id } = req.query; // ← viene desde el frontend (?empresa_id=)
    const where = {};
    if (empresa_id) where.empresa_id = empresa_id;

    const lista = await ComprobanteEgreso.findAll({ where });
    res.status(200).json(lista);
  } catch (error) {
    console.error("Error al listar comprobantes de egreso:", error);
    res.status(500).json({ error: "Error al listar comprobantes de egreso" });
  }
};

// Obtener por ID
export const obtenerComprobanteEgresoPorId = async (req, res) => {
  try {
    const item = await ComprobanteEgreso.findByPk(req.params.id);
    if (!item) return res.status(404).json({ error: 'Comprobante de egreso no encontrado' });
    res.status(200).json(item);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener el comprobante de egreso' });
  }
};

export const actualizarComprobanteEgreso = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const id = Number(req.params.id);
    const comp = await ComprobanteEgreso.findByPk(id, { transaction: t });
    if (!comp) {
      await t.rollback();
      return res.status(404).json({ error: 'Comprobante de egreso no encontrado' });
    }

    // Separar campos especiales del resto
    const body = req.body || {};

    const pagosProgramadosDesasociar =
      Array.isArray(
        body.pagos_programados_desasociar
      )
        ? [
          ...new Set(
            body.pagos_programados_desasociar
              .map(Number)
              .filter(Boolean)
          ),
        ]
        : [];

    validarDatosFiscalesComprobante({
      iva_especial:
        Object.prototype.hasOwnProperty.call(
          body,
          "iva_especial"
        )
          ? body.iva_especial
          : comp.iva_especial,

      iva_especial_porcentaje:
        Object.prototype.hasOwnProperty.call(
          body,
          "iva_especial_porcentaje"
        )
          ? body.iva_especial_porcentaje
          : comp.iva_especial_porcentaje,
    });

    const hasHaciendaInBody = Object.prototype.hasOwnProperty.call(body, "hacienda_id");
    const nuevoHaciendaId = hasHaciendaInBody
      ? (body.hacienda_id ? Number(body.hacienda_id) : null)
      : (comp.hacienda_id ?? null);
    const viejoHaciendaId = comp.hacienda_id ? Number(comp.hacienda_id) : null;

    // 1) Actualizar resto de campos del comprobante (sin tocar hacienda_id todavía)
    const {
      hacienda_id,
      pagos_programados_desasociar,
      ...rest
    } = body;

    if (Object.keys(rest).length) {
      await comp.update(
        rest,
        {
          transaction: t,
        }
      );
    }

    // 2) Si el body NO trae hacienda_id,
    // no hacemos nada con la relación Hacienda.
    // El controller continúa porque puede haber
    // otras operaciones especiales, como
    // desasociar Pagos Programados.

    // 3) Si cambió la hacienda, sincronizar espejo en "Hacienda"
    const cambioHacienda =
      hasHaciendaInBody &&
      (viejoHaciendaId || null) !==
      (nuevoHaciendaId || null);

    if (cambioHacienda) {
      // 3.1) Desvincular anterior (si había y estaba efectivamente atada a este comp)
      if (viejoHaciendaId) {
        const hacVieja = await Hacienda.findByPk(viejoHaciendaId, { transaction: t });
        if (hacVieja && Number(hacVieja.comprobante_id) === comp.id) {
          await hacVieja.update({ comprobante_id: null }, { transaction: t });
        }
      }

      // 3.2) Vincular nueva (si viene)
      if (nuevoHaciendaId) {
        const hacNueva = await Hacienda.findByPk(nuevoHaciendaId, { transaction: t });
        if (!hacNueva) throw new Error('Hacienda nueva no encontrada');

        // Evitar pisar una hacienda tomada por otro comprobante
        if (hacNueva.comprobante_id && Number(hacNueva.comprobante_id) !== comp.id) {
          throw new Error('La Hacienda ya está vinculada a otro comprobante');
        }

        await hacNueva.update({ comprobante_id: comp.id }, { transaction: t });
      }
    }

    // 4) Actualizar el campo hacienda_id del comprobante (refleja lo que quedó en Hacienda)
    if (hasHaciendaInBody) {
      await comp.update({ hacienda_id: nuevoHaciendaId }, { transaction: t });
    }

    // ============================================================
    // 5) DESASOCIAR PAGOS PROGRAMADOS DEL COMPROBANTE
    // ============================================================

    if (
      pagosProgramadosDesasociar.length > 0
    ) {

      /*
       * Buscamos TODOS los cargos de Cta.Cte.
       * pertenecientes a este comprobante.
       */
      const cargosComprobante =
        await MovimientoCtaCteProveedor.findAll({
          where: {
            tipo:
              "cargo",

            comprobanteegreso_id:
              comp.id,

            anulado: {
              [Op.not]:
                true,
            },
          },

          attributes: [
            "id",
          ],

          transaction: t,
          lock: t.LOCK.UPDATE,
        });


      const cargoIds =
        cargosComprobante
          .map(
            (cargo) =>
              Number(cargo.id)
          )
          .filter(Boolean);


      if (cargoIds.length === 0) {
        throw new Error(
          "El comprobante no posee cargos de Cuenta Corriente asociados."
        );
      }

      /*
       * Guardamos todos los comprobantes que
       * deberán recalcularse.
       */
      const comprobantesAfectados =
        new Set();


      /*
       * Procesamos cada Pago Programado solicitado.
       */
      for (
        const pagoProgramadoId
        of pagosProgramadosDesasociar
      ) {

        const pagoProgramado =
          await PagoProgramadoTesoreria.findByPk(
            pagoProgramadoId,
            {
              transaction: t,
              lock: t.LOCK.UPDATE,
            }
          );


        if (!pagoProgramado) {
          throw new Error(
            `No se encontró el Pago Programado #${pagoProgramadoId}.`
          );
        }


        /*
         * Solamente un Pago Programado pendiente
         * puede desasociarse.
         */
        if (
          String(
            pagoProgramado.estado || ""
          )
            .trim()
            .toLowerCase() !==
          "pendiente"
        ) {
          throw new Error(
            `El Pago Programado #${pagoProgramadoId} ya no está pendiente y no puede desasociarse.`
          );
        }


        /*
         * Buscamos TODOS los ABONOS activos
         * correspondientes a este Pago Programado.
         */
        const abonosProgramado =
          await MovimientoCtaCteProveedor.findAll({
            where: {
              tipo:
                "abono",

              referencia_tipo:
                "PagoProgramadoTesoreria",

              referencia_id:
                pagoProgramadoId,

              anulado: {
                [Op.not]:
                  true,
              },
            },

            attributes: [
              "id",
            ],

            transaction: t,
            lock: t.LOCK.UPDATE,
          });


        const abonoIds =
          abonosProgramado
            .map(
              (abono) =>
                Number(abono.id)
            )
            .filter(Boolean);


        if (abonoIds.length === 0) {
          throw new Error(
            `El Pago Programado #${pagoProgramadoId} no posee abonos pendientes asociados.`
          );
        }


        /*
         * Primero verificamos que el Pago Programado
         * realmente esté relacionado con ESTE
         * comprobante.
         *
         * Esto evita que desde este endpoint se mande
         * arbitrariamente el ID de otro Pago Programado.
         */
        const aplicacionesEsteComprobante =
          await MovimientoCtaCteProveedorAplic.findAll({
            where: {
              abono_id: {
                [Op.in]:
                  abonoIds,
              },

              cargo_id: {
                [Op.in]:
                  cargoIds,
              },
            },

            attributes: [
              "id",
            ],

            transaction: t,
            lock: t.LOCK.UPDATE,
          });


        if (
          aplicacionesEsteComprobante.length === 0
        ) {
          throw new Error(
            `El Pago Programado #${pagoProgramadoId} no está aplicado a este comprobante.`
          );
        }


        /*
         * Una vez validado el origen de la operación,
         * buscamos TODAS las aplicaciones del PP,
         * independientemente del comprobante.
         */
        const aplicacionesTodas =
          await MovimientoCtaCteProveedorAplic.findAll({
            where: {
              abono_id: {
                [Op.in]:
                  abonoIds,
              },
            },

            attributes: [
              "id",
              "abono_id",
              "cargo_id",
              "importe",
            ],

            transaction: t,
            lock: t.LOCK.UPDATE,
          });


        /*
         * Identificamos todos los CARGOS afectados.
         */
        const todosCargoIds =
          [
            ...new Set(
              aplicacionesTodas
                .map(
                  (aplicacion) =>
                    Number(
                      aplicacion.cargo_id
                    )
                )
                .filter(Boolean)
            ),
          ];


        /*
         * A partir de esos cargos obtenemos todos
         * los comprobantes afectados.
         */
        if (
          todosCargoIds.length > 0
        ) {

          const cargosAfectados =
            await MovimientoCtaCteProveedor.findAll({
              where: {
                id: {
                  [Op.in]:
                    todosCargoIds,
                },

                tipo:
                  "cargo",
              },

              attributes: [
                "id",
                "comprobanteegreso_id",
              ],

              transaction: t,
              lock: t.LOCK.UPDATE,
            });


          for (
            const cargo
            of cargosAfectados
          ) {

            const comprobanteId =
              Number(
                cargo.comprobanteegreso_id ||
                0
              );

            if (comprobanteId) {
              comprobantesAfectados.add(
                comprobanteId
              );
            }
          }
        }


        /*
         * DESASOCIACIÓN GLOBAL
         *
         * Eliminamos TODAS las aplicaciones
         * correspondientes al Pago Programado.
         */
        for (
          const aplicacion
          of aplicacionesTodas
        ) {

          await aplicacion.destroy({
            transaction: t,
          });
        }


        /*
         * Como acabamos de eliminar TODAS las
         * aplicaciones del Pago Programado,
         * sus ABONOS quedan sin aplicación.
         *
         * Los anulamos.
         */
        for (
          const abono
          of abonosProgramado
        ) {

          await abono.update(
            {
              anulado:
                true,
            },
            {
              transaction: t,
            }
          );
        }


        /*
         * Quitamos también la asociación directa
         * que pudiera tener el Pago Programado.
         *
         * NO eliminamos el Pago Programado.
         * Sigue pendiente y vuelve a quedar disponible.
         */
        if (
          pagoProgramado.comprobanteegreso_id
        ) {

          await pagoProgramado.update(
            {
              comprobanteegreso_id:
                null,
            },
            {
              transaction: t,
            }
          );
        }
      }


      /*
       * Recalculamos TODOS los comprobantes
       * que estaban afectados por los PP
       * desasociados.
       */
      for (
        const comprobanteId
        of comprobantesAfectados
      ) {

        await recalcularComprobanteEgreso(
          comprobanteId,
          t
        );
      }
    }

    await t.commit();
    return res.status(200).json(comp);
  } catch (error) {
    await t.rollback();
    console.error('❌ actualizarComprobanteEgreso:', error);
    return res.status(500).json({ error: error.message || 'Error al actualizar el comprobante de egreso' });
  }
};



export const eliminarComprobanteEgreso = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const id = Number(req.params.id || 0);
    if (!id) throw new Error("ID inválido");

    // 1) Traer comprobante con lock
    const comp = await ComprobanteEgreso.findByPk(id, { transaction: t, lock: t.LOCK.UPDATE });
    if (!comp) {
      await t.rollback();
      return res.status(404).json({ error: "Comprobante de egreso no encontrado" });
    }

    // 2) Validar estado IMPAGA
    const estado = String(comp.estadopago ?? comp.estado ?? "").trim().toLowerCase();
    if (estado !== "impaga") {
      await t.rollback();
      return res.status(400).json({ error: "Sólo se puede eliminar un comprobante en estado IMPAGA" });
    }

    const compId = comp.id;

    // 2.1) 🔗 Desvincular Hacienda (si hubiera)
    // a) por referencia directa en el comprobante
    if (comp.hacienda_id) {
      const hac = await Hacienda.findByPk(comp.hacienda_id, { transaction: t, lock: t.LOCK.UPDATE });
      if (hac && Number(hac.comprobante_id) === compId) {
        await hac.update({ comprobante_id: null }, { transaction: t });
      }
    }
    // b) defensa: cualquier Hacienda que apunte a este comprobante
    const [haciendasDesvinculadas] = await Hacienda.update(
      { comprobante_id: null },
      { where: { comprobante_id: compId }, transaction: t }
    );

    // 2.2) Eliminar ajustes asociados al comprobante
    await AjusteComprobanteEgreso.destroy({
      where: {
        comprobanteegreso_id:
          compId,
      },

      transaction: t,
    });

    // 2.3) Liberar pagos programados pendientes vinculados al comprobante
    //
    // Un PagoProgramadoTesoreria pendiente todavía NO representa
    // un desembolso financiero real.
    //
    // Si eliminamos el comprobante, el compromiso debe volver a quedar
    // disponible para poder asociarse posteriormente a otro comprobante.
    //
    // También contemplamos anticipos programados que tengan asociado
    // un MovimientoCtaCteProveedor mediante movimiento_ctacte_id.

    const todosPagosProgramadosVinculados =
      await PagoProgramadoTesoreria.findAll({
        where: {
          comprobanteegreso_id:
            compId,
        },

        transaction:
          t,

        lock:
          t.LOCK.UPDATE,
      });


    const pagosProgramadosNoPendientes =
      todosPagosProgramadosVinculados.filter(
        pago =>
          String(
            pago.estado ||
            ""
          )
            .trim()
            .toLowerCase() !==
          "pendiente"
      );


    if (
      pagosProgramadosNoPendientes.length
    ) {

      throw new Error(
        "No se puede eliminar el comprobante porque tiene uno o más pagos programados que ya no se encuentran pendientes. Primero debe revertirse o resolver esos pagos."
      );
    }


    const pagosProgramadosVinculados =
      todosPagosProgramadosVinculados;


    for (const pagoProgramado of pagosProgramadosVinculados) {

      /*
       * Si el pago programado tiene un movimiento de cuenta corriente
       * asociado (caso típico: anticipo programado), NO lo eliminamos.
       *
       * Simplemente quitamos la asociación con este comprobante.
       *
       * Conservamos:
       * - referencia_tipo
       * - referencia_id
       * - proveedor
       * - importe
       * - estado
       * - ordenpago_id
       *
       * porque siguen perteneciendo al compromiso programado.
       */
      if (pagoProgramado.movimiento_ctacte_id) {

        const movCtaCte =
          await MovimientoCtaCteProveedor.findByPk(
            pagoProgramado.movimiento_ctacte_id,
            {
              transaction: t,
              lock: t.LOCK.UPDATE,
            }
          );


        if (
          movCtaCte &&
          Number(movCtaCte.comprobanteegreso_id) === Number(compId)
        ) {

          await movCtaCte.update(
            {
              comprobanteegreso_id: null,
            },
            {
              transaction: t,
            }
          );
        }
      }


      /*
       * El compromiso vuelve a quedar disponible.
       *
       * NO tocamos:
       * - estado
       * - monto
       * - fecha_programada
       * - medio
       * - banco_id
       * - caja_id
       * - echeq_fecha_vencimiento
       * - movimiento_ctacte_id
       * - ordenpago_id
       */
      /*
      * Si el PagoProgramado estaba utilizando la misma OP
      * que pertenece al comprobante que vamos a eliminar,
      * también debemos liberar esa referencia.
      *
      * Si conserva una OP distinta, no la tocamos.
      */

      const usaOrdenDelComprobante =
        comp.ordenpago_id &&
        pagoProgramado.ordenpago_id &&
        Number(pagoProgramado.ordenpago_id) ===
        Number(comp.ordenpago_id);


      await pagoProgramado.update(
        {
          comprobanteegreso_id:
            null,

          ...(usaOrdenDelComprobante
            ? {
              ordenpago_id:
                null,
            }
            : {}),
        },
        {
          transaction: t,
        }
      );
    }


    // 3) Eliminar cargos de CtaCte del comprobante
    //
    // Antes de eliminarlos verificamos que ninguno tenga
    // aplicaciones de abonos.
    //
    // No debemos destruir un cargo que ya esté alcanzado por
    // MovimientoCtaCteProveedorAplic, porque dejaríamos
    // aplicaciones huérfanas y perderíamos trazabilidad.

    const cargos =
      await MovimientoCtaCteProveedor.findAll({
        where: {
          comprobanteegreso_id:
            compId,

          tipo:
            "cargo",
        },

        attributes: [
          "id",
        ],

        transaction:
          t,

        lock:
          t.LOCK.UPDATE,
      });


    const cargoIds =
      cargos.map(
        c => Number(c.id)
      );


    if (cargoIds.length) {

      const aplicacionExistente =
        await MovimientoCtaCteProveedorAplic.findOne({
          where: {
            cargo_id: {
              [Op.in]:
                cargoIds,
            },
          },

          transaction:
            t,

          lock:
            t.LOCK.UPDATE,
        });


      if (aplicacionExistente) {

        throw new Error(
          "No se puede eliminar el comprobante porque su deuda de cuenta corriente tiene pagos aplicados. Primero debe desaplicar esos pagos."
        );
      }


      await MovimientoCtaCteProveedor.destroy({
        where: {
          id: {
            [Op.in]:
              cargoIds,
          },
        },

        transaction:
          t,
      });
    }

    // 4) Eliminar Orden de Pago si existe
    if (comp.ordenpago_id) {
      const op = await OrdenPago.findByPk(comp.ordenpago_id, { transaction: t, lock: t.LOCK.UPDATE });
      if (op) {
        await op.destroy({ transaction: t });
      }
    }

    // 5) Eliminar el comprobante
    await comp.destroy({ transaction: t });

    await t.commit();
    return res.status(200).json({
      mensaje:
        "Comprobante de egreso y vínculos eliminados correctamente",

      eliminado: {
        comprobanteegreso_id:
          compId,

        ordenpago_id:
          comp.ordenpago_id || null,

        cargos_eliminados:
          cargoIds.length,

        haciendas_desvinculadas:
          haciendasDesvinculadas,

        pagos_programados_liberados:
          pagosProgramadosVinculados.length,
      },
    });
  } catch (error) {
    await t.rollback();
    console.error("❌ eliminarComprobanteEgreso:", error);
    return res.status(500).json({ error: error.message || "Error al eliminar el comprobante de egreso" });
  }
};



// ==== Helpers locales para Gasto Estimado (con transacción) ====

async function recomputarInstanciaTx(instanciaId, t) {
  const inst = await GastoEstimadoInstancia.findByPk(instanciaId, { transaction: t });
  if (!inst) return null;

  const pagos = await GastoEstimadoPago.findAll({
    where: { gastoestimado_instancia_id: instanciaId },
    transaction: t
  });
  const total = pagos.reduce((a, p) => a + Number(p.monto_aplicado || 0), 0);

  inst.monto_pagado = total;

  const base = Number((inst.monto_real ?? inst.monto_estimado) ?? 0);
  let estado = "pendiente";
  if (total > 0 && total < base) estado = "parcial";
  if (total >= base && base > 0) estado = "pagado";

  const hoy = new Date().toISOString().slice(0, 10);
  if (estado !== "pagado" && inst.fecha_vencimiento < hoy) {
    estado = "vencido";
  }
  inst.estado = estado;

  await inst.save({ transaction: t });
  return { instancia: inst, totalAplicado: total };
}

function daysInMonth(year, month) { return new Date(year, month, 0).getDate(); }
function clampDay(day, year, month) {
  const mdays = daysInMonth(year, month);
  if (!day) return mdays;
  return Math.max(1, Math.min(day, mdays));
}
function parsePeriodo(p) { const [y, m] = String(p).split("-").map(n => parseInt(n, 10)); return { y, m }; }
function nextPeriodoStr(p) { const { y, m } = parsePeriodo(p); let ny = y, nm = m + 1; if (nm > 12) { nm = 1; ny = y + 1; } return `${ny}-${String(nm).padStart(2, "0")}`; }

async function ensureNextMonthlyInstanceTx(instancia, { totalAplicado } = {}, t) {
  try {
    const plant = await GastoEstimado.findByPk(instancia.gastoestimado_id, { transaction: t });
    if (!plant) return { created: false };
    if (plant.activo === false) return { created: false };
    if (plant.periodicidad !== "mensual") return { created: false };

    const nextPeriodo = nextPeriodoStr(instancia.periodo);
    const { y, m } = parsePeriodo(nextPeriodo);
    const dia = clampDay(plant.dia_vencimiento_default || 0, y, m);
    const fecha_vencimiento = new Date(y, m - 1, dia).toISOString().slice(0, 10);

    const montoBase =
      totalAplicado != null
        ? Number(totalAplicado || 0)
        : Number(instancia.monto_real ?? instancia.monto_estimado ?? 0);

    const [next, created] = await GastoEstimadoInstancia.findOrCreate({
      where: { gastoestimado_id: plant.id, periodo: nextPeriodo },
      defaults: {
        gastoestimado_id: plant.id,
        empresa_id: plant.empresa_id,
        proveedor_id: plant.proveedor_id,
        categoriaegreso_id: plant.categoriaegreso_id,
        sucursal_id: plant.sucursal_id,
        tipocomprobante_id: plant.tipocomprobante_id ?? null,
        formapago_id: plant.formapago_id ?? null,
        descripcion: plant.descripcion,
        periodo: nextPeriodo,
        fecha_vencimiento,
        monto_estimado: montoBase,
        monto_real: null,
        monto_pagado: 0,
        estado: "pendiente",
        created_from: "rollover",
        observaciones: plant.observaciones || null,
      },
      transaction: t,
    });

    return { created, next };
  } catch (e) {
    console.error("ensureNextMonthlyInstanceTx error:", e);
    return { created: false };
  }
}

async function aplicarPagoAInstanciaTx({
  instanciaId,
  referencia_tipo,
  referencia_id,
  formapago_id = null,
  fecha_aplicacion,
  monto_aplicado,
  observaciones = null,
  cancelar_renovacion = false,
  empresa_id = null,
  proveedor_id = null,
}, t) {

  const inst = await GastoEstimadoInstancia.findByPk(instanciaId, { transaction: t });
  if (!inst) throw new Error("Instancia no encontrada");
  if (inst.anulado) throw new Error("Instancia anulada");

  // (Opcional, pero consistente con tu modelo) Alinear empresa/proveedor si vienen
  if (empresa_id && inst.empresa_id && Number(empresa_id) !== Number(inst.empresa_id)) {
    throw new Error("La instancia no pertenece a la empresa indicada");
  }
  if (proveedor_id && inst.proveedor_id && Number(proveedor_id) !== Number(inst.proveedor_id)) {
    throw new Error("La instancia no pertenece al proveedor indicado");
  }

  const pago = await GastoEstimadoPago.create({
    gastoestimado_instancia_id: instanciaId,
    referencia_tipo,
    referencia_id,
    formapago_id: formapago_id ?? null,
    fecha_aplicacion,
    monto_aplicado,
    observaciones: observaciones ?? null,
  }, { transaction: t });

  const resync = await recomputarInstanciaTx(instanciaId, t);

  let plantillaActualizada = null;
  if (cancelar_renovacion) {
    try {
      const plant = await GastoEstimado.findByPk(resync.instancia.gastoestimado_id, { transaction: t });
      if (plant && plant.periodicidad === "mensual" && plant.activo !== false) {
        await plant.update({ activo: false }, { transaction: t });
        plantillaActualizada = { id: plant.id, activo: plant.activo, periodicidad: plant.periodicidad };
      }
    } catch (e) {
      console.error("Desactivar plantilla por cancelar_renovacion:", e);
    }
  }

  let rollover = { created: false };
  if (!cancelar_renovacion && resync?.instancia?.estado === "pagado") {
    rollover = await ensureNextMonthlyInstanceTx(resync.instancia, { totalAplicado: resync.totalAplicado }, t);
  }

  return {
    pago,
    ...resync,
    next_instance_created: Boolean(rollover.created),
    next_instance: rollover.next || null,
    plantilla_actualizada: plantillaActualizada,
  };
}


export const emitirComprobanteEgreso = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { empresa_id, idempotencyKey, comprobante, pagos } = req.body;

    if (!empresa_id) throw new Error("empresa_id requerido");
    if (
      !comprobante ||
      typeof comprobante !== "object"
    ) {
      throw new Error(
        "Datos de comprobante inválidos"
      );
    }

    validarDatosFiscalesComprobante(
      comprobante
    );

    const ivaEspecial =
      Number(comprobante.iva_especial || 0);

    const ivaEspecialPorcentaje =
      Number(
        comprobante.iva_especial_porcentaje || 0
      );

    if (
      ivaEspecial > 0 &&
      ivaEspecialPorcentaje <= 0
    ) {
      throw new Error(
        "Debe indicar el porcentaje correspondiente al IVA especial"
      );
    }

    if (
      ivaEspecialPorcentaje > 0 &&
      ivaEspecial <= 0
    ) {
      throw new Error(
        "Debe indicar el importe correspondiente al IVA especial"
      );
    }


    if (!Array.isArray(pagos) || pagos.length === 0) throw new Error("Debe enviar al menos una forma de pago");

    // const totalComp = Number(comprobante.total || 0);
    // if (totalComp <= 0) throw new Error("Total del comprobante inválido");
    const totalComp = Number(comprobante.total || 0);
    const totalLCD = Number(comprobante.montoreal || 0);
    // Si montoreal está presente (>0), lo usamos como base (LCD); si no, usamos total
    const totalBase = totalLCD > 0 ? totalLCD : totalComp;
    if (totalBase <= 0) throw new Error("Total del comprobante inválido");

    const EPS = 0.009;

    const normaliza = (n) =>
      Number(n) || 0;

    const medioDe = (p) =>
      String(p.medio || "")
        .trim()
        .toLowerCase();


    /*
     * ============================================================
     * AJUSTES DEL COMPROBANTE
     * ============================================================
     *
     * Visualmente llegan dentro de pagos con:
     *
     * medio: "ajuste"
     *
     * pero NO son desembolsos.
     *
     * aumenta:
     *   incrementa la obligación.
     *
     * disminuye:
     *   reduce la obligación.
     * ============================================================
     */

    const pagosAjuste =
      pagos.filter(
        p => medioDe(p) === "ajuste"
      );

    const pagosFinancieros =
      pagos.filter(
        p => medioDe(p) !== "ajuste"
      );


    let totalAjustesAumentan = 0;
    let totalAjustesDisminuyen = 0;


    for (const p of pagosAjuste) {

      const tipoAjuste =
        String(
          p.tipo_ajuste ||
          p.tipo ||
          ""
        )
          .trim()
          .toLowerCase();


      if (
        ![
          "aumenta",
          "disminuye",
        ].includes(tipoAjuste)
      ) {

        throw new Error(
          'El ajuste debe indicar tipo "aumenta" o "disminuye".'
        );
      }


      const importeAjuste =
        normaliza(
          p.monto ??
          p.importe
        );


      if (!(importeAjuste > 0)) {

        throw new Error(
          "El importe del ajuste debe ser mayor a cero."
        );
      }


      if (
        !String(
          p.concepto || ""
        ).trim()
      ) {

        throw new Error(
          "El ajuste debe indicar un concepto."
        );
      }


      if (
        tipoAjuste === "aumenta"
      ) {

        totalAjustesAumentan +=
          importeAjuste;

      } else {

        totalAjustesDisminuyen +=
          importeAjuste;
      }
    }


    const totalFinanciero =
      Number(
        (
          totalBase +
          totalAjustesAumentan -
          totalAjustesDisminuyen
        ).toFixed(2)
      );


    if (
      totalFinanciero < -EPS
    ) {

      throw new Error(
        "Los ajustes disminuyen el comprobante por encima de su total."
      );
    }


    /*
     * Un resultado dentro de la tolerancia
     * se considera cero.
     */

    const totalFinancieroFinal =
      Math.abs(totalFinanciero) <= EPS
        ? 0
        : totalFinanciero;


    /*
     * Solamente estos medios representan
     * desembolsos reales inmediatos.
     */

    const esEfectivoAhora = (m) => {

      const v =
        String(m || "")
          .trim()
          .toLowerCase();

      return [
        "caja",
        "transferencia",
        "banco",
        "echeq",
        "tarjeta",
      ].includes(v);
    };


    const sumaTotalPagos =
      pagosFinancieros.reduce(
        (acc, p) =>
          acc +
          normaliza(p.monto),
        0
      );


    const sumaPagosEfectivosDeclarados =
      pagosFinancieros
        .filter(
          p =>
            String(
              p?.existing_ref?.tipo ||
              ""
            )
              .trim()
              .toLowerCase() !==
            "pago_programado" &&
            esEfectivoAhora(
              medioDe(p)
            )
        )
        .reduce(
          (acc, p) =>
            acc +
            normaliza(p.monto),
          0
        );

    /*
     * Las formas de pago reales deben cubrir
     * exactamente el total financiero resultante.
     */

    if (
      sumaTotalPagos -
      totalFinancieroFinal >
      EPS
    ) {

      throw new Error(
        "La suma de las formas de pago supera el total financiero del comprobante."
      );
    }


    if (
      totalFinancieroFinal -
      sumaTotalPagos >
      EPS
    ) {

      throw new Error(
        "La suma de las formas de pago no alcanza el total financiero del comprobante."
      );
    }


    if (
      sumaPagosEfectivosDeclarados -
      totalFinancieroFinal >
      EPS
    ) {

      throw new Error(
        "La suma de pagos efectivos supera el total financiero del comprobante."
      );
    }

    // Header: seteo de formapago_id e imputación
    // const formapagoHeader =
    //   typeof comprobante.formapago_id === "number"
    //     ? comprobante.formapago_id
    //     : (pagos.length === 1 ? Number(pagos[0].formapago_id || 0) || null : null);

    /*
    * Para determinar la forma de pago ACTUAL del comprobante
    * excluimos los PagoProgramadoTesoreria pendientes.
    *
    * Un pago programado es todavía un compromiso,
    * no una forma de pago materializada.
    */
    const pagosHeader =
      pagosFinancieros.filter(
        p =>
          String(
            p?.existing_ref?.tipo ||
            ""
          )
            .trim()
            .toLowerCase() !==
          "pago_programado"
      );


    const formasHeader =
      [
        ...new Set(
          pagosHeader
            .map(
              p =>
                Number(
                  p.formapago_id ||
                  0
                )
            )
            .filter(Boolean)
        ),
      ];


    const formapagoHeader =
      formasHeader.length === 1
        ? formasHeader[0]
        : null;


    let imputacionHeader =
      comprobante.imputacioncontable_id ??
      null;


    if (!imputacionHeader) {

      for (
        const p
        of pagosFinancieros
      ) {

        if (
          p.imputacioncontable_id
        ) {

          imputacionHeader =
            p.imputacioncontable_id;

          break;
        }


        if (
          p.categoriaegreso_id
        ) {

          const cat =
            await CategoriaEgreso.findByPk(
              p.categoriaegreso_id,
              {
                transaction: t,
              }
            );


          if (
            cat?.imputacioncontable_id
          ) {

            imputacionHeader =
              cat.imputacioncontable_id;

            break;
          }
        }
      }
    }


    if (!imputacionHeader) {

      throw new Error(
        "imputacioncontable_id requerido en el comprobante"
      );
    }

    // if (!imputacionHeader) throw new Error("imputacioncontable_id requerido en el comprobante");

    // 1) Crear Comprobante
    const comp = await ComprobanteEgreso.create(
      {
        ...comprobante,
        empresa_id,
        estadopago: "impaga",
        // saldo: totalComp,
        // saldo: totalBase,
        saldo: totalFinancieroFinal,
        formapago_id: formapagoHeader,
        imputacioncontable_id: imputacionHeader,
      },
      { transaction: t }
    );

    // 2) Crear Orden de Pago inicial
    const fechaOrden = comp.fechapago || comp.fechacomprobante || new Date().toISOString().slice(0, 10);
    const orden = await OrdenPago.create(
      {
        empresa_id,
        comprobanteegreso_id: comp.id,
        proveedor_id: comprobante.proveedor_id || null,
        fecha: fechaOrden,
        // total: totalComp,
        // total: totalBase,
        total: totalFinancieroFinal,
        estado: "emitida",
        numero: null,
        observaciones: comprobante.observaciones || null,
      },
      { transaction: t }
    );

    // Setear orden en el comprobante
    await comp.update({ ordenpago_id: orden.id }, { transaction: t });

    /*
 * ============================================================
 * CREAR AJUSTES
 * ============================================================
 */

    const ajustesCreados = [];


    for (const p of pagosAjuste) {

      const tipoAjuste =
        String(
          p.tipo_ajuste ||
          p.tipo
        )
          .trim()
          .toLowerCase();


      const importeAjuste =
        normaliza(
          p.monto ??
          p.importe
        );


      const ajuste =
        await AjusteComprobanteEgreso.create(
          {
            comprobanteegreso_id:
              comp.id,

            empresa_id:
              empresa_id,

            proveedor_id:
              comprobante.proveedor_id ||
              null,

            fecha:
              p.fecha ||
              comp.fechacomprobante ||
              new Date()
                .toISOString()
                .slice(0, 10),

            tipo:
              tipoAjuste,

            concepto:
              String(
                p.concepto
              ).trim(),

            importe:
              importeAjuste,

            detalle:
              p.detalle ||
              null,

            observaciones:
              p.observaciones ||
              null,

            referencia_tipo:
              p.referencia_tipo ||
              null,

            referencia_id:
              p.referencia_id ||
              null,

            anulado:
              false,
          },

          {
            transaction: t,
          }
        );


      ajustesCreados.push(
        ajuste
      );
    }

    // === NUEVO: si vino hacienda_id, vincularla al comprobante creado ===
    if (comprobante.hacienda_id) {
      const hacId = Number(comprobante.hacienda_id);
      // (opcional) validaciones de existencia/estado/empresa/proveedor
      const hac = await Hacienda.findByPk(hacId, { transaction: t });
      if (!hac) throw new Error("Hacienda no encontrada");
      // Ejemplos de validaciones opcionales:
      // if (hac.empresa_id && Number(hac.empresa_id) !== Number(empresa_id)) throw new Error("Hacienda de otra empresa");
      // if (comprobante.proveedor_id && hac.proveedor_id && Number(hac.proveedor_id) !== Number(comprobante.proveedor_id)) throw new Error("Hacienda de otro proveedor");
      // if (hac.estado && hac.estado !== 'disponible') throw new Error("Hacienda no disponible");

      await hac.update(
        {
          comprobante_id: comp.id,
          // estado: 'usada', // opcional, si manejan estados
        },
        { transaction: t }
      );
    }

    // Helpers para existing_ref
    async function findExisting(ref, trx) {
      const tipo = String(ref?.tipo || "").toLowerCase();
      const id = Number(ref?.id || 0);
      if (!id) throw new Error("existing_ref.id inválido");

      switch (tipo) {
        case "caja":
          return { tipo, row: await MovimientoCajaTesoreria.findByPk(id, { transaction: trx }) };
        case "banco":
          return { tipo, row: await MovimientoBancoTesoreria.findByPk(id, { transaction: trx }) };
        case "echeq":
          return { tipo, row: await EcheqEmitido.findByPk(id, { transaction: trx }) };
        case "tarjeta":
          return { tipo, row: await PagoTarjetaCredito.findByPk(id, { transaction: trx }) };
        case "ctacte":
          return {
            tipo,
            row: await MovimientoCtaCteProveedor.findByPk(
              id,
              { transaction: trx }
            ),
          };

        case "pago_programado":
          return {
            tipo,
            row: await PagoProgramadoTesoreria.findByPk(
              id,
              {
                transaction: trx,
                lock: trx.LOCK.UPDATE,
              }
            ),
          };

        default:
          throw new Error(
            `existing_ref.tipo no soportado: ${tipo}`
          );
      }
    }

    function getMontoFechaDeExisting(tipo, row) {
      switch (tipo) {
        case "caja":
          return {
            monto: Number(row.monto || 0),
            fecha: row.fecha,
          };

        case "banco":
          return {
            monto: Number(row.monto || 0),
            fecha: row.fecha,
          };

        case "echeq":
          return {
            monto: Number(row.importe || 0),
            fecha: row.fecha_emision,
          };

        case "tarjeta":
          return {
            monto: Number(row.importe || 0),
            fecha: row.fecha,
          };

        case "ctacte":
          return {
            monto: Number(row.importe || 0),
            fecha: row.fecha,
          };

        case "pago_programado":
          return {
            monto: Number(row.monto || 0),
            fecha: row.fecha_programada,
          };

        default:
          return {
            monto: 0,
            fecha: null,
          };
      }
    }
    // 3) Aplicar pagos
    let sumaEfectivosReal = 0;

    // for (const p of pagos) {
    for (const p of pagosFinancieros) {
      const medio = medioDe(p);
      const monto = normaliza(p.monto);
      const fechaPagoEntrada = p.fecha || comp.fechapago || comp.fechacomprobante;

      const cancelarRenov = Boolean(p?.gastoestimado?.cancelar_renovacion);
      const instanciaId = Number(p?.gastoestimado?.instancia_id || 0);
      const obsPago = p.detalle || `Pago comp. ${comp.nrocomprobante}`;

      // No permitir aplicar una instancia de gasto estimado
      // cuando la fila utiliza un movimiento existente.
      if (
        p.existing_ref &&
        p?.gastoestimado?.aplicar
      ) {
        throw new Error(
          "No se puede asociar a una instancia cuando el pago usa un registro existente"
        );
      }

      // ------- Existing_ref -------
      if (p.existing_ref) {
        const found = await findExisting(p.existing_ref, t);
        if (!found?.row) throw new Error(`No se encontró registro existente (tipo=${found?.tipo})`);

        const r = found.row;

        // Validaciones: que no esté ya vinculado a otro comp
        if (r.comprobanteegreso_id) throw new Error(`El registro existente #${r.id} ya está aplicado a un comprobante`);
        if (empresa_id && r.empresa_id && Number(r.empresa_id) !== Number(empresa_id)) {
          throw new Error(`Empresa no coincide en el registro existente #${r.id}`);
        }
        if (comprobante?.proveedor_id && r.proveedor_id && Number(r.proveedor_id) !== Number(comprobante.proveedor_id)) {
          throw new Error(`Proveedor no coincide en el registro existente #${r.id}`);
        }

        const { monto: usedMonto } = getMontoFechaDeExisting(found.tipo, r);

        // ============================================================
        // NUEVO:
        // Detectar si el registro de Cta.Cte. seleccionado corresponde
        // a un ANTICIPO PROGRAMADO todavía pendiente de acreditación.
        // ============================================================

        /*
 * ============================================================
 * PAGO PROGRAMADO DIRECTO
 * ============================================================
 *
 * Un PagoProgramadoTesoreria pendiente es solamente un
 * compromiso de pago.
 *
 * Al asociarlo al comprobante:
 *
 * - NO se acredita.
 * - NO crea MovimientoCajaTesoreria.
 * - NO crea MovimientoBancoTesoreria.
 * - NO crea EcheqEmitido.
 * - NO suma a sumaEfectivosReal.
 *
 * Solamente queda vinculado al comprobante.
 * ============================================================
 */

        if (found.tipo === "pago_programado") {

          const estadoProgramado =
            String(r.estado || "")
              .trim()
              .toLowerCase();

          if (estadoProgramado !== "pendiente") {
            throw new Error(
              `El pago programado #${r.id} no está pendiente`
            );
          }

          if (
            r.comprobanteegreso_id &&
            Number(r.comprobanteegreso_id) !== Number(comp.id)
          ) {
            throw new Error(
              `El pago programado #${r.id} ya está asociado a otro comprobante`
            );
          }

          if (
            empresa_id &&
            r.empresa_id &&
            Number(r.empresa_id) !== Number(empresa_id)
          ) {
            throw new Error(
              `El pago programado #${r.id} pertenece a otra empresa`
            );
          }

          if (
            comprobante.proveedor_id &&
            r.proveedor_id &&
            Number(r.proveedor_id) !==
            Number(comprobante.proveedor_id)
          ) {
            throw new Error(
              `El pago programado #${r.id} pertenece a otro proveedor`
            );
          }

          /*
           * Defensa importante:
           *
           * El importe elegido en la forma de pago debe coincidir
           * con el compromiso seleccionado.
           */
          if (
            Math.abs(
              Number(usedMonto) -
              Number(monto)
            ) > EPS
          ) {
            throw new Error(
              `El importe del pago programado #${r.id} no coincide con el importe seleccionado`
            );
          }

          /*
           * Vinculamos solamente el compromiso.
           *
           * Conservamos:
           * - estado = pendiente
           * - ordenpago_id original
           * - medio
           * - fecha_programada
           * - banco/caja
           * - datos futuros del eCheq
           */
          await r.update(
            {
              comprobanteegreso_id: comp.id,
            },
            {
              transaction: t,
            }
          );

          /*
           * MUY IMPORTANTE:
           *
           * NO hacemos:
           *
           * sumaEfectivosReal += usedMonto;
           *
           * porque todavía no existe desembolso.
           */
          continue;
        }

        let pagoProgramado = null;

        if (found.tipo === "ctacte") {

          const refTipoCta =
            String(r.referencia_tipo || "")
              .trim()
              .toLowerCase();

          /*
           * Cuando creamos el anticipo programado dejamos:
           *
           * referencia_tipo = "PagoProgramadoTesoreria"
           * referencia_id   = pagoProgramado.id
           */
          if (
            refTipoCta ===
            "pagoprogramadotesoreria"
          ) {

            const pagoProgramadoId =
              Number(r.referencia_id || 0);

            if (!pagoProgramadoId) {
              throw new Error(
                `El anticipo #${r.id} indica PagoProgramadoTesoreria pero no tiene referencia_id`
              );
            }

            pagoProgramado =
              await PagoProgramadoTesoreria.findByPk(
                pagoProgramadoId,
                {
                  transaction: t,
                  lock: t.LOCK.UPDATE,
                }
              );

            if (!pagoProgramado) {
              throw new Error(
                `No se encontró PagoProgramadoTesoreria #${pagoProgramadoId}`
              );
            }

            if (
              String(pagoProgramado.estado || "")
                .toLowerCase() !== "pendiente"
            ) {
              throw new Error(
                `El pago programado #${pagoProgramado.id} no está pendiente`
              );
            }

            if (
              pagoProgramado.comprobanteegreso_id
            ) {
              throw new Error(
                `El pago programado #${pagoProgramado.id} ya está asociado a otro comprobante`
              );
            }

            if (
              Number(pagoProgramado.proveedor_id) !==
              Number(comprobante.proveedor_id)
            ) {
              throw new Error(
                "El anticipo programado pertenece a otro proveedor"
              );
            }
          }
        }

        // Vincular
        const attrs = r.constructor?.rawAttributes || {};
        const hasAttr = (name) => Object.prototype.hasOwnProperty.call(attrs, name);
        const compRef = `Pago Comprobante Nro ${String(comp.nrocomprobante ?? "").trim()}`.trim();

        const patch = {
          comprobanteegreso_id:
            comp.id,
        };

        /*
         * Registros normales:
         * comportamiento histórico.
         */
        if (!pagoProgramado) {

          patch.ordenpago_id =
            orden.id;
        }

        /*
         * Anticipo programado:
         *
         * conserva ordenpago_id original porque pertenece
         * al compromiso creado antes del comprobante.
         */

        /*
         * Para registros normales mantenemos el comportamiento actual.
         *
         * Para un anticipo proveniente de PagoProgramadoTesoreria
         * NO cambiamos referencia_tipo/referencia_id.
         *
         * Esa referencia es necesaria para conservar:
         *
         * MovimientoCtaCteProveedor
         *          ↓
         * PagoProgramadoTesoreria
         */
        if (!pagoProgramado) {

          if (hasAttr("referencia_tipo")) {
            patch.referencia_tipo =
              "ComprobanteEgreso";
          }

          if (hasAttr("referencia_id")) {
            patch.referencia_id =
              comp.id;
          }
        }

        // Si el registro existente fuese de ctacte y se pasa formapago_id, lo preservamos
        if (found.tipo === "ctacte" && hasAttr("formapago_id") && p.formapago_id) {
          patch.formapago_id = Number(p.formapago_id);
        }

        ["concepto", "descripcion", "observacion", "observaciones"].forEach((f) => {
          if (hasAttr(f)) {
            patch[f] = compRef;
          }
        });

        await r.update(patch, { transaction: t });

        // ============================================================
        // NUEVO:
        // Si el anticipo pertenece a PagoProgramadoTesoreria,
        // vinculamos también el compromiso al comprobante.
        // ============================================================

        if (pagoProgramado) {

          await pagoProgramado.update(
            {
              comprobanteegreso_id:
                comp.id,

              /*
               * IMPORTANTE:
               *
               * NO reemplazamos ordenpago_id.
               *
               * PagoProgramadoTesoreria conserva la OP que se
               * generó originalmente al crear el compromiso.
               *
               * El comprobante conserva su propia OrdenPago.
               */
            },
            {
              transaction: t,
            }
          );
        }

        if (esEfectivoAhora(found.tipo)) {
          sumaEfectivosReal += usedMonto;
        }
        continue;
      }

      // ------- Camino clásico (crear registros nuevos) -------
      if (monto <= 0) throw new Error("Monto de pago inválido");
      const fechaPago = fechaPagoEntrada;

      // Caja
      if (medio === "caja") {
        if (!p.categoriaegreso_id) throw new Error("categoriaegreso_id es requerida para pagos en caja");
        if (!p.caja_id) throw new Error("caja_id faltante en pago de caja");

        const mov = await MovimientoCajaTesoreria.create(
          {
            tipo: "egreso",
            descripcion: p.detalle || `Pago comp. ${comp.nrocomprobante}`,
            monto,
            fecha: fechaPago,
            caja_id: p.caja_id,
            empresa_id,
            formapago_id: p.formapago_id || null,
            referencia_id: comp.id,
            referencia_tipo: "ComprobanteEgreso",
            observaciones: null,
            categoriaegreso_id: p.categoriaegreso_id || null,
            imputacioncontable_id: p.imputacioncontable_id || imputacionHeader || null,
            ordenpago_id: orden.id,
            comprobanteegreso_id: comp.id || null,
            proveedor_id: comprobante.proveedor_id || null,
            fecha_recepcion:fechaPago,
          },
          { transaction: t }
        );

        sumaEfectivosReal += monto;

        if (instanciaId) {
          await aplicarPagoAInstanciaTx({
            instanciaId,
            referencia_tipo: "MovimientoCajaTesoreria",
            referencia_id: mov.id,
            formapago_id: p.formapago_id || null,
            fecha_aplicacion: fechaPagoEntrada,
            monto_aplicado: monto,
            observaciones: obsPago,
            cancelar_renovacion: cancelarRenov,
            empresa_id,
            proveedor_id: comprobante.proveedor_id || null,
          }, t);
        }
        continue;
      }

      // Transferencia / Banco
      if (medio === "transferencia" || medio === "banco") {
        if (!p.banco_id) throw new Error("banco_id es requerido para pago por transferencia");

        const mov = await MovimientoBancoTesoreria.create(
          {
            tipo: "egreso",
            descripcion: p.detalle || `Pago comp. ${comp.nrocomprobante} por transferencia`,
            monto,
            fecha: fechaPago,
            banco_id: p.banco_id,
            empresa_id,
            formapago_id: p.formapago_id || null,
            referencia_id: comp.id,
            referencia_tipo: "ComprobanteEgreso",
            observaciones: p.observaciones || null,
            ordenpago_id: orden.id,
            comprobanteegreso_id: comp.id,
            proveedor_id: comprobante.proveedor_id || null,
          },
          { transaction: t }
        );

        sumaEfectivosReal += monto;

        if (instanciaId) {
          await aplicarPagoAInstanciaTx({
            instanciaId,
            referencia_tipo: "MovimientoBancoTesoreria",
            referencia_id: mov.id,
            formapago_id: p.formapago_id || null,
            fecha_aplicacion: fechaPagoEntrada,
            monto_aplicado: monto,
            observaciones: obsPago,
            cancelar_renovacion: cancelarRenov,
            empresa_id,
            proveedor_id: comprobante.proveedor_id || null,
          }, t);
        }
        continue;
      }

      // eCheq
      if (medio === "echeq") {
        if (!p.banco_id) throw new Error("banco_id es requerido para eCheq");
        if (!p.fecha_vencimiento) throw new Error("fecha_vencimiento es requerida para eCheq");
        const fechaEmision = fechaPago;
        const fechaVto = p.fecha_vencimiento;
        if (new Date(fechaVto) < new Date(fechaEmision)) {
          throw new Error("fecha_vencimiento no puede ser anterior a la fecha de emisión del eCheq");
        }

        const cheq = await EcheqEmitido.create(
          {
            comprobanteegreso_id: comp.id,
            proveedor_id: comprobante.proveedor_id || null,
            empresa_id,
            numero_echeq: p.numero_echeq || null,
            banco_id: p.banco_id,
            fecha_emision: fechaEmision,
            fecha_vencimiento: fechaVto,
            importe: monto,
            estado: "emitido",
            ordenpago_id: orden.id,
          },
          { transaction: t }
        );

        sumaEfectivosReal += monto;

        if (instanciaId) {
          await aplicarPagoAInstanciaTx({
            instanciaId,
            referencia_tipo: "EcheqEmitido",
            referencia_id: cheq.id,
            formapago_id: p.formapago_id || null,
            fecha_aplicacion: fechaPagoEntrada,
            monto_aplicado: monto,
            observaciones: obsPago,
            cancelar_renovacion: cancelarRenov,
            empresa_id,
            proveedor_id: comprobante.proveedor_id || null,
          }, t);
        }
        continue;
      }

      // Tarjeta
      if (medio === "tarjeta") {
        if (!p.tipotarjeta_id) throw new Error("tipotarjeta_id es requerido para pago con tarjeta");
        if (!p.marcatarjeta_id) throw new Error("marcatarjeta_id es requerido para pago con tarjeta");

        const tar = await PagoTarjetaCredito.create(
          {
            fecha: fechaPago,
            importe: monto,
            comprobanteegreso_id: comp.id,
            empresa_id,
            proveedor_id: comprobante.proveedor_id || null,
            tipotarjeta_id: p.tipotarjeta_id || null,
            marcatarjeta_id: p.marcatarjeta_id || null,
            cupon_numero: p.cupon_numero || null,
            planpago_id: p.planpago_id || null,
            concepto: p.detalle || `Pago comp. ${comp.nrocomprobante} con tarjeta`,
            observaciones: null,
            estado: "pendiente",
            ordenpago_id: orden.id,
          },
          { transaction: t }
        );

        sumaEfectivosReal += monto;

        if (instanciaId) {
          await aplicarPagoAInstanciaTx({
            instanciaId,
            referencia_tipo: "PagoTarjetaCredito",
            referencia_id: tar.id,
            formapago_id: p.formapago_id || null,
            fecha_aplicacion: fechaPagoEntrada,
            monto_aplicado: monto,
            observaciones: obsPago,
            cancelar_renovacion: cancelarRenov,
            empresa_id,
            proveedor_id: comprobante.proveedor_id || null,
          }, t);
        }
        continue;
      }

      // Cuenta Corriente (CARGO)  ⟵ AQUÍ GUARDAMOS formapago_id (nuevo campo informativo)
      if (medio === "ctacte") {
        if (!comprobante.proveedor_id) {
          throw new Error("proveedor_id es requerido para movimiento de cuenta corriente");
        }

        await MovimientoCtaCteProveedor.create(
          {
            proveedor_id: comprobante.proveedor_id,
            empresa_id,
            fecha: fechaPago || comp.fechacomprobante,
            fecha_pago: p.fecha_pago || null,
            descripcion: p.detalle || `Comp. ${comp.nrocomprobante} a cuenta corriente`,
            tipo: "cargo",
            importe: monto,
            origen_tipo: "ComprobanteEgreso",
            origen_id: comp.id,
            comprobanteegreso_id: comp.id,
            anulado: false,
            ordenpago_id: orden.id,
            formapago_id: p.formapago_id || null,   // 👈 NUEVO: forma de pago prevista (informativa)
          },
          { transaction: t }
        );
        // ctacte no suma a efectivos
        continue;
      }

      throw new Error(`Medio de pago no soportado: ${medio}`);
    }

    // 4) Estado final del comprobante/orden usando la suma REAL de desembolsos
    // const saldo = Math.max(0, totalComp - sumaEfectivosReal);
    // const saldo = Math.max(0, totalBase - sumaEfectivosReal);
    const saldo =
      Math.max(
        0,
        Number(
          (
            totalFinancieroFinal -
            sumaEfectivosReal
          ).toFixed(2)
        )
      );
    let estadoComp = "impaga";
    if (Math.abs(saldo) <= EPS) estadoComp = "pagada";
    else if (sumaEfectivosReal > EPS) estadoComp = "parcial";

    await comp.update({ saldo, estadopago: estadoComp }, { transaction: t });

    let estadoOrden = "emitida";
    if (estadoComp === "pagada") estadoOrden = "aplicada";
    else if (estadoComp === "parcial") estadoOrden = "parcial";

    await orden.update({ estado: estadoOrden }, { transaction: t });

    await t.commit();
    // return res.status(201).json({ ok: true, comprobante: comp, ordenpago: orden });
    return res.status(201).json({
      ok: true,
      comprobante: comp,
      ordenpago: orden,
      ajustes: ajustesCreados,
    });
  } catch (error) {
    await t.rollback();
    console.error("❌ emitirComprobanteEgreso:", error);
    return res.status(400).json({ error: error.message || "No se pudo emitir el comprobante" });
  }
};



export const getComprobanteEgresoDetalle = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const comp = await ComprobanteEgreso.findByPk(id);
    if (!comp) return res.status(404).json({ error: "Comprobante no encontrado" });

    // buscar la orden por dos vías: 1) campo ordenpago_id del comprobante
    // 2) por compatibilidad, la que tenga comprobanteegreso_id
    let orden = null;
    if (comp.ordenpago_id) {
      orden = await OrdenPago.findByPk(comp.ordenpago_id);
    } else {
      orden = await OrdenPago.findOne({ where: { comprobanteegreso_id: comp.id } });
    }

    let pagos = [];

    if (orden?.id) {

      // pagos = await collectPagosOrden(orden.id);

      pagos =
        await collectPagosComprobante(
          comp.id
        );
    }

    /*
     * ============================================================
     * AJUSTES DEL COMPROBANTE
     * ============================================================
     *
     * Los ajustes no forman parte de "pagos".
     * Se consultan directamente por comprobanteegreso_id.
     * ============================================================
     */

    const ajustes =
      await AjusteComprobanteEgreso.findAll({
        where: {
          comprobanteegreso_id:
            comp.id,

          anulado:
            false,
        },

        order: [
          ["fecha", "ASC"],
          ["id", "ASC"],
        ],
      });

    /*
 * ============================================================
 * DETERMINAR SI EL COMPROBANTE PUEDE EDITARSE
 * ============================================================
 *
 * Regla:
 * - sólo puede editarse cuando su situación financiera actual
 *   corresponde íntegramente a Cuenta Corriente;
 * - si existe Caja, Banco/Transferencia, eCheq o Tarjeta
 *   aplicado al comprobante, no puede editarse.
 * ============================================================
 */

    const [
      movimientosCaja,
      movimientosBanco,
      echeqsAplicados,
      tarjetasAplicadas,
      cargoCtaCte,
    ] = await Promise.all([

      MovimientoCajaTesoreria.findOne({
        where: {
          comprobanteegreso_id: comp.id,
          anulado: { [Op.not]: true },
        },
      }),

      MovimientoBancoTesoreria.findOne({
        where: {
          comprobanteegreso_id: comp.id,
          anulado: { [Op.not]: true },
        },
      }),

      EcheqEmitido.findOne({
        where: {
          comprobanteegreso_id: comp.id,
        },
      }),

      PagoTarjetaCredito.findOne({
        where: {
          comprobanteegreso_id: comp.id,
        },
      }),

      MovimientoCtaCteProveedor.findOne({
        where: {
          comprobanteegreso_id: comp.id,
          tipo: "cargo",
          anulado: { [Op.not]: true },
        },
      }),
    ]);
    const tieneOtroMedioPago =
      !!movimientosCaja ||
      !!movimientosBanco ||
      !!echeqsAplicados ||
      !!tarjetasAplicadas;


    /*
     * ============================================================
     * PAGOS PROGRAMADOS VINCULADOS
     * ============================================================
     *
     * IMPORTANTE:
     *
     * Un PagoProgramadoTesoreria NO representa todavía
     * una salida real de dinero.
     *
     * Sin embargo, mientras esté pendiente y asociado al
     * comprobante, el comprobante no debe poder editarse.
     * Primero deberá desvincularse/anularse el compromiso.
     * ============================================================
     */
    /*
     * ============================================================
     * PAGOS PROGRAMADOS VINCULADOS / APLICADOS
     * ============================================================
     *
     * Un PagoProgramadoTesoreria puede llegar al comprobante
     * por dos caminos:
     *
     * 1) Asociación directa:
     *
     *    PagoProgramadoTesoreria.comprobanteegreso_id
     *
     * 2) Aplicación posterior sobre Cta.Cte.:
     *
     *    Comprobante
     *       ↓
     *    CARGO Cta.Cte.
     *       ↓
     *    MovCtaCteProvAplic
     *       ↓
     *    ABONO Cta.Cte.
     *       ↓
     *    referencia_tipo = PagoProgramadoTesoreria
     *    referencia_id   = pagoProgramado.id
     *
     * El segundo caso es fundamental cuando un mismo pago
     * programado fue distribuido entre varios comprobantes.
     * ============================================================
     */


    /*
     * ------------------------------------------------------------
     * 1) PAGOS PROGRAMADOS DIRECTAMENTE VINCULADOS
     * ------------------------------------------------------------
     */

    const pagosProgramadosDirectos =
      await PagoProgramadoTesoreria.findAll({
        where: {
          comprobanteegreso_id:
            comp.id,

          estado:
            "pendiente",
        },

        order: [
          ["fecha_programada", "ASC"],
          ["id", "ASC"],
        ],
      });


    /*
     * ------------------------------------------------------------
     * 2) CARGOS DE CTA. CTE. DEL COMPROBANTE
     * ------------------------------------------------------------
     */

    const cargosCtaCte =
      await MovimientoCtaCteProveedor.findAll({
        where: {
          comprobanteegreso_id:
            comp.id,

          tipo:
            "cargo",

          anulado: {
            [Op.not]:
              true,
          },
        },

        attributes: [
          "id",
          "importe",
        ],
      });


    const cargoIds =
      cargosCtaCte.map(
        cargo =>
          Number(cargo.id)
      );


    /*
     * ------------------------------------------------------------
     * 3) APLICACIONES REALIZADAS SOBRE ESOS CARGOS
     * ------------------------------------------------------------
     */

    let aplicacionesCtaCte = [];


    if (cargoIds.length > 0) {

      aplicacionesCtaCte =
        await MovimientoCtaCteProveedorAplic.findAll({
          where: {
            cargo_id: {
              [Op.in]:
                cargoIds,
            },
          },

          attributes: [
            "id",
            "cargo_id",
            "abono_id",
            "importe",
          ],
        });
    }


    /*
     * ------------------------------------------------------------
     * 4) ABONOS UTILIZADOS
     * ------------------------------------------------------------
     */

    const abonoIds =
      [
        ...new Set(
          aplicacionesCtaCte
            .map(
              aplicacion =>
                Number(
                  aplicacion.abono_id ||
                  0
                )
            )
            .filter(Boolean)
        ),
      ];


    let abonosAplicados = [];


    if (abonoIds.length > 0) {

      abonosAplicados =
        await MovimientoCtaCteProveedor.findAll({
          where: {
            id: {
              [Op.in]:
                abonoIds,
            },

            tipo:
              "abono",

            anulado: {
              [Op.not]:
                true,
            },
          },

          attributes: [
            "id",
            "fecha",
            "fecha_pago",
            "formapago_id",
            "referencia_tipo",
            "referencia_id",
            "descripcion",
          ],
        });
    }


    const abonosById =
      new Map(
        abonosAplicados.map(
          abono => [
            Number(abono.id),
            abono,
          ]
        )
      );

    /*
     * ------------------------------------------------------------
     * PAGOS EFECTIVOS APLICADOS MEDIANTE CTA. CTE.
     * ------------------------------------------------------------
     *
     * Un movimiento financiero puede no tener
     * comprobanteegreso_id porque fue aplicado posteriormente
     * mediante:
     *
     * Movimiento financiero
     *   -> ABONO Cta.Cte.
     *   -> aplicación
     *   -> CARGO
     *   -> comprobante
     *
     * Por eso también debemos considerar las referencias
     * de los ABONOS activos utilizados por este comprobante.
     * ------------------------------------------------------------
     */

    const tiposPagoEfectivoCtaCte =
      new Set([
        "movimientocajatesoreria",
        "movimientobancotesoreria",
        "echeqemitido",
        "pagotarjetacredito",
      ]);


    const tienePagoEfectivoViaCtaCte =
      abonosAplicados.some(
        (abono) => {

          const referenciaTipo =
            String(
              abono.referencia_tipo ||
              ""
            )
              .trim()
              .toLowerCase();

          return tiposPagoEfectivoCtaCte.has(
            referenciaTipo
          );
        }
      );
    /*
     * ------------------------------------------------------------
     * 5) IDENTIFICAR PAGOS PROGRAMADOS DETRÁS DE LOS ABONOS
     * ------------------------------------------------------------
     */

    const programadoIdsAplicados =
      [
        ...new Set(
          abonosAplicados
            .filter(
              abono =>
                String(
                  abono.referencia_tipo ||
                  ""
                )
                  .trim()
                  .toLowerCase() ===
                "pagoprogramadotesoreria"
            )
            .map(
              abono =>
                Number(
                  abono.referencia_id ||
                  0
                )
            )
            .filter(Boolean)
        ),
      ];


    let programadosAplicados = [];


    if (
      programadoIdsAplicados.length > 0
    ) {

      programadosAplicados =
        await PagoProgramadoTesoreria.findAll({
          where: {
            id: {
              [Op.in]:
                programadoIdsAplicados,
            },

            estado:
              "pendiente",
          },

          order: [
            ["fecha_programada", "ASC"],
            ["id", "ASC"],
          ],
        });
    }


    const programadosAplicadosById =
      new Map(
        programadosAplicados.map(
          pago => [
            Number(pago.id),
            pago,
          ]
        )
      );


    /*
     * ------------------------------------------------------------
     * 6) CALCULAR CUÁNTO DE CADA PAGO PROGRAMADO FUE APLICADO
     *    ESPECÍFICAMENTE A ESTE COMPROBANTE
     * ------------------------------------------------------------
     */

    const aplicadoPorProgramado =
      new Map();


    for (
      const aplicacion
      of aplicacionesCtaCte
    ) {

      const abono =
        abonosById.get(
          Number(
            aplicacion.abono_id
          )
        );


      if (!abono) {
        continue;
      }


      const referenciaTipo =
        String(
          abono.referencia_tipo ||
          ""
        )
          .trim()
          .toLowerCase();


      if (
        referenciaTipo !==
        "pagoprogramadotesoreria"
      ) {
        continue;
      }


      const programadoId =
        Number(
          abono.referencia_id ||
          0
        );


      if (
        !programadosAplicadosById.has(
          programadoId
        )
      ) {
        continue;
      }


      const importeAplicado =
        Number(
          aplicacion.importe ||
          0
        );


      aplicadoPorProgramado.set(
        programadoId,

        Number(
          (
            (
              aplicadoPorProgramado.get(
                programadoId
              ) ||
              0
            ) +
            importeAplicado
          ).toFixed(2)
        )
      );
    }


    /*
     * ------------------------------------------------------------
     * 7) NORMALIZAR PAGOS PROGRAMADOS PARA EL FRONTEND
     * ------------------------------------------------------------
     */

    const pagosProgramadosMap =
      new Map();


    /*
     * Asociación directa.
     *
     * En este caso el importe aplicado al comprobante coincide,
     * en principio, con el monto del compromiso.
     */

    for (
      const pago
      of pagosProgramadosDirectos
    ) {

      pagosProgramadosMap.set(
        Number(pago.id),
        {
          ...pago.toJSON(),

          origen_vinculacion:
            "directo",

          monto_aplicado:
            Number(
              pago.monto || 0
            ),
        }
      );
    }


    /*
     * Asociación mediante Cta.Cte.
     *
     * Acá monto_aplicado es exclusivamente la porción
     * correspondiente al comprobante que estamos consultando.
     */

    for (
      const pago
      of programadosAplicados
    ) {

      const pagoId =
        Number(pago.id);


      const existente =
        pagosProgramadosMap.get(
          pagoId
        );


      pagosProgramadosMap.set(
        pagoId,
        {
          ...(existente || pago.toJSON()),

          origen_vinculacion:
            existente
              ? "directo_y_ctacte"
              : "ctacte",

          monto_aplicado:
            Number(
              aplicadoPorProgramado.get(
                pagoId
              ) ||
              existente?.monto_aplicado ||
              0
            ),
        }
      );
    }


    const pagosProgramados =
      Array.from(
        pagosProgramadosMap.values()
      )
        .sort(
          (a, b) => {

            const fa =
              String(
                a.fecha_programada ||
                ""
              );

            const fb =
              String(
                b.fecha_programada ||
                ""
              );


            if (fa === fb) {

              return (
                Number(a.id) -
                Number(b.id)
              );
            }


            return fa.localeCompare(
              fb
            );
          }
        );


    const tienePagoProgramado =
      pagosProgramados.length > 0;

    /*
* Pago efectivo aplicado al comprobante por cualquiera
* de los dos caminos posibles:
*
* 1) asociación directa mediante comprobanteegreso_id;
* 2) aplicación posterior mediante Cta.Cte.
*/

    /*
     * ============================================================
     * DETERMINAR SI EXISTEN PAGOS EFECTIVOS
     * ============================================================
     *
     * Un comprobante queda bloqueado si posee pagos efectivos
     * detectados por cualquiera de estos caminos:
     *
     * 1) movimiento directamente vinculado al comprobante;
     * 2) movimiento aplicado posteriormente mediante Cta.Cte.;
     * 3) pagos efectivos recuperados por collectPagosComprobante().
     *
     * Los Pagos Programados se controlan aparte porque todavía
     * no representan una salida financiera efectiva.
     * ============================================================
     */
    const tienePagosRecolectados =
      Array.isArray(pagos) &&
      pagos.length > 0;


    const tienePagoEfectivo =
      tieneOtroMedioPago ||
      tienePagoEfectivoViaCtaCte ||
      tienePagosRecolectados;

    /*
* ============================================================
* SITUACIÓN ACTUAL DE LA CTA. CTE.
* ============================================================
*/

    const totalCargosCtaCte =
      cargosCtaCte.reduce(
        (acc, cargo) =>
          acc +
          Number(
            cargo.importe || 0
          ),
        0
      );


    const totalAplicadoCtaCte =
      aplicacionesCtaCte.reduce(
        (acc, aplicacion) =>
          acc +
          Number(
            aplicacion.importe || 0
          ),
        0
      );


    const saldoCtaCte =
      Math.max(
        0,
        Number(
          (
            totalCargosCtaCte -
            totalAplicadoCtaCte
          ).toFixed(2)
        )
      );


    const ctaCteTotalmenteCubierta =
      cargoIds.length > 0 &&
      saldoCtaCte <= 0.0001;

    /*
     * ============================================================
     * DETERMINAR SI PUEDE EDITARSE
     * ============================================================
     */

    const puedeEditar =
      !tienePagoEfectivo &&
      !tienePagoProgramado;


    /*
     * ============================================================
     * MOTIVO POR EL CUAL NO PUEDE EDITARSE
     * ============================================================
     */

    let motivoNoEditar = null;

    if (!puedeEditar) {

      if (tienePagoEfectivo) {

        motivoNoEditar =
          "El comprobante tiene una forma de pago efectivizada aplicada.";

      } else if (tienePagoProgramado) {

        motivoNoEditar =
          "El comprobante tiene un pago programado asociado pendiente de efectivización.";

      }
    }

    console.log("\n========================================");
    console.log("🔴 BACKEND getComprobanteEgresoDetalle NUEVO");
    console.log("🔴 comprobante:", comp.id);
    console.log("🔴 pagos.length:", pagos.length);
    console.log("🔴 tieneOtroMedioPago:", tieneOtroMedioPago);
    console.log("🔴 tienePagoEfectivoViaCtaCte:", tienePagoEfectivoViaCtaCte);
    console.log("🔴 tienePagosRecolectados:", tienePagosRecolectados);
    console.log("🔴 tienePagoEfectivo:", tienePagoEfectivo);
    console.log("🔴 tienePagoProgramado:", tienePagoProgramado);
    console.log("🔴 puedeEditar:", puedeEditar);
    console.log("========================================\n");

    return res.json({
      comprobante:
        comp,

      ordenpago:
        orden,

      pagos,

      ajustes,

      pagos_programados:
        pagosProgramados,

      ctacte: {
        total:
          Number(
            totalCargosCtaCte.toFixed(2)
          ),

        aplicado:
          Number(
            totalAplicadoCtaCte.toFixed(2)
          ),

        saldo:
          saldoCtaCte,

        totalmente_cubierta:
          ctaCteTotalmenteCubierta,
      },

      puede_editar:
        puedeEditar,

      motivo_no_editar:
        motivoNoEditar,
    });
  } catch (e) {
    console.error("getComprobanteEgresoDetalle:", e);
    return res.status(400).json({ error: e.message || "No se pudo obtener el detalle" });
  }
};

async function collectPagosOrden(ordenId) {
  const [cajas, bancos, echeqs, tarjetas, ctacte] = await Promise.all([
    MovimientoCajaTesoreria.findAll({ where: { ordenpago_id: ordenId } }),
    MovimientoBancoTesoreria.findAll({ where: { ordenpago_id: ordenId } }),
    EcheqEmitido.findAll({ where: { ordenpago_id: ordenId } }),
    PagoTarjetaCredito.findAll({ where: { ordenpago_id: ordenId } }),
    MovimientoCtaCteProveedor.findAll({ where: { ordenpago_id: ordenId } }),
  ]);

  // Normalizamos para el frontend (un solo array con un "tipo/medio" y campos comunes)
  const norm = [
    ...cajas.map((r) => ({
      id: r.id,
      medio: "caja",
      tabla: "MovimientoCajaTesoreria",
      fecha: r.fecha,
      monto: Number(r.monto || 0),
      detalle: r.descripcion || r.concepto || null,
      formapago_id: r.formapago_id || null,
      caja_id: r.caja_id || null,
    })),
    ...bancos.map((r) => ({
      id: r.id,
      medio: "transferencia", // tu código de emisión lo trata así
      tabla: "MovimientoBancoTesoreria",
      fecha: r.fecha,
      monto: Number(r.monto || 0),
      detalle: r.descripcion || r.concepto || null,
      formapago_id: r.formapago_id || null,
      banco_id: r.banco_id || null,
    })),
    ...echeqs.map((r) => ({
      id: r.id,
      medio: "echeq",
      tabla: "EcheqEmitido",
      fecha: r.fecha_emision,
      fecha_vencimiento: r.fecha_vencimiento,
      monto: Number(r.importe || 0),
      detalle: null,
      banco_id: r.banco_id || null,
      numero_echeq: r.numero_echeq || null,
    })),
    ...tarjetas.map((r) => ({
      id: r.id,
      medio: "tarjeta",
      tabla: "PagoTarjetaCredito",
      fecha: r.fecha,
      monto: Number(r.importe || 0),
      detalle: r.concepto || null,
      tipotarjeta_id: r.tipotarjeta_id || null,
      marcatarjeta_id: r.marcatarjeta_id || null,
      cupon_numero: r.cupon_numero || null,
      planpago_id: r.planpago_id || null,
    })),
    ...ctacte.map((r) => ({
      id: r.id,
      medio: "ctacte",
      tabla: "MovimientoCtaCteProveedor",
      fecha: r.fecha,
      monto: Number(r.importe || 0),
      detalle: r.descripcion || null,
      fecha_pago: r.fecha_pago || null,
      formapago_id: r.formapago_id || null,
    })),
  ];

  // Orden opcional por fecha
  norm.sort((a, b) => String(a.fecha).localeCompare(String(b.fecha)));
  return norm;
}

// async function collectPagosComprobante(comprobanteId) {
//   const [cajas, bancos, echeqs, tarjetas, ctacte] = await Promise.all([
//     MovimientoCajaTesoreria.findAll({ where: { comprobanteegreso_id: comprobanteId } }),
//     MovimientoBancoTesoreria.findAll({ where: { comprobanteegreso_id: comprobanteId } }),
//     EcheqEmitido.findAll({ where: { comprobanteegreso_id: comprobanteId } }),
//     PagoTarjetaCredito.findAll({ where: { comprobanteegreso_id: comprobanteId } }),
//     MovimientoCtaCteProveedor.findAll({ where: { comprobanteegreso_id: comprobanteId } }),
//   ]);

//   // Normalizamos para el frontend (un solo array con un "tipo/medio" y campos comunes)
//   const norm = [
//     ...cajas.map((r) => ({
//       id: r.id,
//       medio: "caja",
//       tabla: "MovimientoCajaTesoreria",
//       fecha: r.fecha,
//       monto: Number(r.monto || 0),
//       detalle: r.descripcion || r.concepto || null,
//       formapago_id: r.formapago_id || null,
//       caja_id: r.caja_id || null,
//     })),
//     ...bancos.map((r) => ({
//       id: r.id,
//       medio: "transferencia",
//       tabla: "MovimientoBancoTesoreria",
//       fecha: r.fecha,
//       monto: Number(r.monto || 0),
//       detalle: r.descripcion || r.concepto || null,
//       formapago_id: r.formapago_id || null,
//       banco_id: r.banco_id || null,
//     })),
//     ...echeqs.map((r) => ({
//       id: r.id,
//       medio: "echeq",
//       tabla: "EcheqEmitido",
//       fecha: r.fecha_emision,
//       fecha_vencimiento: r.fecha_vencimiento,
//       monto: Number(r.importe || 0),
//       detalle: null,
//       banco_id: r.banco_id || null,
//       numero_echeq: r.numero_echeq || null,
//     })),
//     ...tarjetas.map((r) => ({
//       id: r.id,
//       medio: "tarjeta",
//       tabla: "PagoTarjetaCredito",
//       fecha: r.fecha,
//       monto: Number(r.importe || 0),
//       detalle: r.concepto || null,
//       tipotarjeta_id: r.tipotarjeta_id || null,
//       marcatarjeta_id: r.marcatarjeta_id || null,
//       cupon_numero: r.cupon_numero || null,
//       planpago_id: r.planpago_id || null,
//     })),
//   ];

//   // Orden opcional por fecha
//   norm.sort((a, b) => String(a.fecha).localeCompare(String(b.fecha)));
//   return norm;
// }

async function collectPagosComprobante(comprobanteId) {
  const [
    cajas,
    bancos,
    echeqs,
    tarjetas,
    abonosCtaCte
  ] = await Promise.all([
    MovimientoCajaTesoreria.findAll({ where: { comprobanteegreso_id: comprobanteId } }),
    MovimientoBancoTesoreria.findAll({ where: { comprobanteegreso_id: comprobanteId } }),
    EcheqEmitido.findAll({ where: { comprobanteegreso_id: comprobanteId } }),
    PagoTarjetaCredito.findAll({ where: { comprobanteegreso_id: comprobanteId } }),
    MovimientoCtaCteProveedor.findAll({
      where: {
        comprobanteegreso_id: comprobanteId,
        tipo: "abono",
        // si 'anulado' puede ser null = no anulado
        anulado: { [Op.not]: true },
      },
    }),
  ]);

  // === Normalización de pagos directos (como tenías)
  const normDirectos = [
    ...cajas.map((r) => ({
      id: r.id,
      medio: "caja",
      tabla: "MovimientoCajaTesoreria",
      fecha: r.fecha,
      monto: Number(r.monto || 0),
      detalle: r.descripcion || r.concepto || null,
      formapago_id: r.formapago_id || null,
      caja_id: r.caja_id || null,
      banco_id: null,
      numero_echeq: null,
      tipotarjeta_id: null,
      marcatarjeta_id: null,
      cupon_numero: null,
      planpago_id: null,
    })),
    ...bancos.map((r) => ({
      id: r.id,
      medio: "transferencia",
      tabla: "MovimientoBancoTesoreria",
      fecha: r.fecha,
      monto: Number(r.monto || 0),
      detalle: r.descripcion || r.concepto || null,
      formapago_id: r.formapago_id || null,
      caja_id: null,
      banco_id: r.banco_id || null,
      numero_echeq: null,
      tipotarjeta_id: null,
      marcatarjeta_id: null,
      cupon_numero: null,
      planpago_id: null,
    })),
    ...echeqs.map((r) => ({
      id: r.id,
      medio: "echeq",
      tabla: "EcheqEmitido",
      fecha: r.fecha_emision,
      fecha_vencimiento: r.fecha_vencimiento,
      monto: Number(r.importe || 0),
      detalle: null,
      formapago_id: null,
      caja_id: null,
      banco_id: r.banco_id || null,
      numero_echeq: r.numero_echeq || null,
      tipotarjeta_id: null,
      marcatarjeta_id: null,
      cupon_numero: null,
      planpago_id: null,
    })),
    ...tarjetas.map((r) => ({
      id: r.id,
      medio: "tarjeta",
      tabla: "PagoTarjetaCredito",
      fecha: r.fecha,
      monto: Number(r.importe || 0),
      detalle: r.concepto || null,
      formapago_id: null,
      caja_id: null,
      banco_id: null,
      numero_echeq: null,
      tipotarjeta_id: r.tipotarjeta_id || null,
      marcatarjeta_id: r.marcatarjeta_id || null,
      cupon_numero: r.cupon_numero || null,
      planpago_id: r.planpago_id || null,
    })),
  ];

  // === Mapa de "movimientos ya vistos" para evitar duplicar abonos que referencian a estos
  const CANON = {
    CAJA: "movimientocajatesoreria",
    BANCO: "movimientobancotesoreria",
    TARJ: "pagotarjetacredito",
    ECHEQ: "echeqemitido",
    OP: "ordenpago",
    NC: "notacredito",
    ABONO: "aplicacionctacte",
  };

  const makeKey = (tipo, id) => `${tipo}:${Number(id) || 0}`;
  const seenRef = new Set();
  cajas.forEach((r) => seenRef.add(makeKey(CANON.CAJA, r.id)));
  bancos.forEach((r) => seenRef.add(makeKey(CANON.BANCO, r.id)));
  tarjetas.forEach((r) => seenRef.add(makeKey(CANON.TARJ, r.id)));
  echeqs.forEach((r) => seenRef.add(makeKey(CANON.ECHEQ, r.id)));

  const canonicalize = (s) => {
    const k = String(s || "").trim().toLowerCase().replace(/\s+/g, "");
    if (!k) return "";
    if (k.includes("movimientocajatesoreria")) return CANON.CAJA;
    if (k.includes("movimientobancotesoreria")) return CANON.BANCO;
    if (k.includes("pagotarjetacredito")) return CANON.TARJ;
    if (k.includes("echeqemitido") || k.includes("echeq")) return CANON.ECHEQ;
    if (k.includes("ordenpago")) return CANON.OP;
    if (k.includes("notacredito")) return CANON.NC;
    if (k.includes("aplicacionctacte") || k.includes("ctacte")) return CANON.ABONO;
    return k; // fallback
  };

  const medioByRefTipo = {
    [CANON.CAJA]: "caja",
    [CANON.BANCO]: "transferencia",
    [CANON.TARJ]: "tarjeta",
    [CANON.ECHEQ]: "echeq",
    [CANON.OP]: "ctacte",
    [CANON.NC]: "nota_credito",
    [CANON.ABONO]: "ctacte",
  };

  // === Filtrar abonos de ctacte que NO dupliquen pagos directos ya listados
  const abonosFiltrados = (abonosCtaCte || [])
    .filter(a => String(a.tipo).toLowerCase() === "abono" && a.anulado !== true)
    .filter(a => {
      const tipo = canonicalize(a.referencia_tipo);
      const rid = Number(a.referencia_id || 0);
      if (!tipo || !rid) return true; // sin referencia directa → mantener
      return !seenRef.has(makeKey(tipo, rid));
    });

  // === Normalizar abonos filtrados
  const normAbonos = abonosFiltrados.map(a => {
    const tipoCanon = canonicalize(a.referencia_tipo);
    const medio = medioByRefTipo[tipoCanon] || "ctacte";
    return {
      id: a.id,
      medio,
      tabla: "MovimientoCtaCteProveedor",
      fecha: a.fecha_pago || a.fecha,
      monto: Number(a.importe || 0),
      detalle: a.descripcion || null,
      formapago_id: a.formapago_id || null,
      // extras opcionales que pueden servir en UI/depuración
      referencia_tipo: a.referencia_tipo || null,
      referencia_id: a.referencia_id || null,
      ordenpago_id: a.ordenpago_id || null,
      caja_id: null,
      banco_id: null,
      numero_echeq: null,
      tipotarjeta_id: null,
      marcatarjeta_id: null,
      cupon_numero: null,
      planpago_id: null,
    };
  });

  // === Mezclar y ordenar por fecha
  const norm = [...normDirectos, ...normAbonos];
  norm.sort((a, b) => String(a.fecha).localeCompare(String(b.fecha)));

  return norm;
}

