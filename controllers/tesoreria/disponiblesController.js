// controllers/tesoreria/disponiblesController.js
import { Op } from "sequelize";
import MovimientoCajaTesoreria from "../../models/tesoreria/movimientocajatesoreria.js";
import MovimientoBancoTesoreria from "../../models/tesoreria/movimientobancotesoreria.js";
import EcheqEmitido from "../../models/tesoreria/pagoecheq.js";
import PagoTarjetaCredito from "../../models/tesoreria/pagotarjetacredito.js";
import MovimientoCtaCteProveedor from "../../models/tesoreria/movimientoctacteproveedor.js";
import PagoProgramadoTesoreria
  from "../../models/tesoreria/PagoProgramadoTesoreria.js";

function parseDateRange({ desde, hasta }) {
  const where = {};
  if (desde) where[Op.gte] = desde;
  if (hasta) where[Op.lte] = hasta;
  return Object.keys(where).length ? where : null;
}

// ============================================================
// MOVIMIENTOS YA UTILIZADOS EN CTA. CTE.
// ============================================================
//
// Un movimiento financiero deja de estar disponible cuando
// existe al menos un ABONO ACTIVO que lo referencia.
//
// NO utilizamos empresa_id.
//
// Tampoco dependemos de comprobanteegreso_id del movimiento,
// porque un mismo movimiento puede haberse aplicado a uno
// o varios comprobantes mediante Cta.Cte.
// ============================================================

async function obtenerIdsYaUtilizados(
  referenciaTipo,
  ids
) {

  const idsNormalizados =
    [
      ...new Set(
        (ids || [])
          .map(
            (id) =>
              Number(id)
          )
          .filter(Boolean)
      ),
    ];


  if (
    idsNormalizados.length === 0
  ) {
    return new Set();
  }


  const abonos =
    await MovimientoCtaCteProveedor.findAll({
      where: {
        tipo:
          "abono",

        anulado: {
          [Op.not]:
            true,
        },

        referencia_tipo:
          referenciaTipo,

        referencia_id: {
          [Op.in]:
            idsNormalizados,
        },
      },

      attributes: [
        "referencia_id",
      ],

      raw:
        true,
    });


  return new Set(
    abonos
      .map(
        (abono) =>
          Number(
            abono.referencia_id
          )
      )
      .filter(Boolean)
  );
}

export async function listarDisponibles(req, res) {
  try {
    const {
      medio,               // caja | transferencia | echeq | tarjeta | ctacte
      proveedor_id,
      desde,
      hasta,
      q,
    } = req.query || {};

    if (!medio) {
      return res.status(400).json({
        error: "medio requerido",
      });
    }

    if (!proveedor_id) {
      return res.status(400).json({
        error: "proveedor_id requerido para buscar pagos disponibles",
      });
    }

    const proveedorId =
      Number(proveedor_id);

    if (!Number.isInteger(proveedorId) || proveedorId <= 0) {
      return res.status(400).json({
        error: "proveedor_id inválido",
      });
    }

    const like =
      q
        ? { [Op.iLike]: `%${q}%` }
        : null;


    /*
     * Un movimiento sólo está disponible si:
     *
     * 1) pertenece al proveedor seleccionado;
     * 2) todavía no está asociado a un comprobante.
     *
     * empresa_id NO interviene en la disponibilidad.
     */
    const baseCommon = {
      proveedor_id:
        proveedorId,

      comprobanteegreso_id:
        null,
    };



    let rows = [];

    switch (String(medio).toLowerCase()) {
      case "caja": {
        const where = {
          ...baseCommon,
          tipo: "egreso",
          anulado: false,
        };

        if (desde || hasta) {
          where.fecha =
            parseDateRange({
              desde,
              hasta,
            });
        }

        if (like) {
          where.descripcion =
            like;
        }


        const movimientos =
          await MovimientoCajaTesoreria.findAll({
            where,

            order: [
              ["fecha", "DESC"],
              ["id", "DESC"],
            ],
          });

        const idsCajaUtilizados =
          await obtenerIdsYaUtilizados(
            "MovimientoCajaTesoreria",

            movimientos.map(
              (movimiento) =>
                movimiento.id
            )
          );


        const movimientosDisponibles =
          movimientos.filter(
            (movimiento) =>
              !idsCajaUtilizados.has(
                Number(
                  movimiento.id
                )
              )
          );

        const movimientosNormalizados =
          movimientosDisponibles.map((r) => ({
            tipo:
              "caja",

            id:
              r.id,

            fecha:
              r.fecha,

            monto:
              Number(r.monto || 0),

            descripcion:
              r.descripcion || null,

            caja_id:
              r.caja_id || null,

            proveedor_id:
              r.proveedor_id || null,
          }));


        /*
         * PAGOS PROGRAMADOS DE CAJA
         *
         * Solamente pendientes.
         * Los acreditados NO aparecen como programados.
         */
        const whereProgramado = {
          estado:
            "pendiente",

          medio:
            "caja",

          comprobanteegreso_id:
            null,
        };


        if (proveedor_id) {
          whereProgramado.proveedor_id =
            Number(proveedor_id);
        }


        if (desde || hasta) {
          whereProgramado.fecha_programada =
            parseDateRange({
              desde,
              hasta,
            });
        }


        const programados =
          await PagoProgramadoTesoreria.findAll({
            where:
              whereProgramado,

            order: [
              ["fecha_programada", "DESC"],
              ["id", "DESC"],
            ],
          });


        const programadosNormalizados =
          programados.map((r) => ({
            tipo:
              "pago_programado",

            id:
              r.id,

            medio:
              "caja",

            fecha:
              r.fecha_programada,

            monto:
              Number(r.monto || 0),

            descripcion:
              `[PROGRAMADO] ${r.descripcion}`,

            caja_id:
              r.caja_id || null,

            proveedor_id:
              r.proveedor_id,

            empresa_id:
              r.empresa_id,

            formapago_id:
              r.formapago_id || null,

            tipo_programado:
              r.tipo,

            estado:
              r.estado,
          }));


        rows = [
          ...movimientosNormalizados,
          ...programadosNormalizados,
        ];


        break;
      }

      case "transferencia": {
        const where = {
          ...baseCommon,
          tipo: "egreso",
          anulado: false,
        };


        if (desde || hasta) {
          where.fecha =
            parseDateRange({
              desde,
              hasta,
            });
        }


        if (like) {
          where.descripcion =
            like;
        }


        const movimientos =
          await MovimientoBancoTesoreria.findAll({
            where,

            order: [
              ["fecha", "DESC"],
              ["id", "DESC"],
            ],
          });

        const idsBancoUtilizados =
          await obtenerIdsYaUtilizados(
            "MovimientoBancoTesoreria",

            movimientos.map(
              (movimiento) =>
                movimiento.id
            )
          );


        const movimientosDisponibles =
          movimientos.filter(
            (movimiento) =>
              !idsBancoUtilizados.has(
                Number(
                  movimiento.id
                )
              )
          );

        const movimientosNormalizados =
          movimientosDisponibles.map((r) => ({
            tipo:
              "banco",

            id:
              r.id,

            fecha:
              r.fecha,

            monto:
              Number(r.monto || 0),

            descripcion:
              r.descripcion || null,

            banco_id:
              r.banco_id || null,

            proveedor_id:
              r.proveedor_id || null,

            empresa_id:
              r.empresa_id || null,
          }));


        /*
         * PAGOS PROGRAMADOS BANCARIOS
         *
         * Solamente pendientes.
         */
        const whereProgramado = {
          estado:
            "pendiente",

          medio:
            "banco",

          comprobanteegreso_id:
            null,
        };


        if (proveedor_id) {
          whereProgramado.proveedor_id =
            Number(proveedor_id);
        }


        if (desde || hasta) {
          whereProgramado.fecha_programada =
            parseDateRange({
              desde,
              hasta,
            });
        }


        const programados =
          await PagoProgramadoTesoreria.findAll({
            where:
              whereProgramado,

            order: [
              ["fecha_programada", "DESC"],
              ["id", "DESC"],
            ],
          });


        const programadosNormalizados =
          programados.map((r) => ({
            tipo:
              "pago_programado",

            id:
              r.id,

            medio:
              "banco",

            fecha:
              r.fecha_programada,

            monto:
              Number(r.monto || 0),

            descripcion:
              `[PROGRAMADO] ${r.descripcion}`,

            banco_id:
              r.banco_id || null,

            proveedor_id:
              r.proveedor_id,

            empresa_id:
              r.empresa_id,

            formapago_id:
              r.formapago_id || null,

            tipo_programado:
              r.tipo,

            estado:
              r.estado,
          }));


        rows = [
          ...movimientosNormalizados,
          ...programadosNormalizados,
        ];


        break;
      }

      case "echeq": {

        /*
         * ============================================================
         * ECHEQS REALES YA EMITIDOS
         * ============================================================
         */

        const where = {
          ...baseCommon,
        };


        if (desde || hasta) {
          where.fecha_emision =
            parseDateRange({
              desde,
              hasta,
            });
        }


        if (like) {
          where.numero_echeq =
            like;
        }


        const echeqs =
          await EcheqEmitido.findAll({
            where,

            order: [
              ["fecha_emision", "DESC"],
              ["id", "DESC"],
            ],
          });
        const idsEcheqUtilizados =
          await obtenerIdsYaUtilizados(
            "EcheqEmitido",

            echeqs.map(
              (echeq) =>
                echeq.id
            )
          );


        const echeqsDisponibles =
          echeqs.filter(
            (echeq) =>
              !idsEcheqUtilizados.has(
                Number(
                  echeq.id
                )
              )
          );

        const echeqsNormalizados =
          echeqsDisponibles.map((r) => ({
            tipo:
              "echeq",

            id:
              r.id,

            medio:
              "echeq",

            fecha:
              r.fecha_emision,

            fecha_emision:
              r.fecha_emision,

            fecha_vencimiento:
              r.fecha_vencimiento,

            monto:
              Number(r.importe || 0),

            banco_id:
              r.banco_id || null,

            numero_echeq:
              r.numero_echeq || null,

            estado:
              r.estado || null,

            proveedor_id:
              r.proveedor_id || null,

            empresa_id:
              r.empresa_id || null,
          }));


        /*
         * ============================================================
         * ECHEQS PROGRAMADOS
         * ============================================================
         *
         * IMPORTANTE:
         *
         * Estos registros todavía NO son EcheqEmitido.
         *
         * Son solamente compromisos pendientes almacenados en
         * PagoProgramadoTesoreria.
         *
         * Por eso devolvemos:
         *
         * tipo = "pago_programado"
         *
         * y NO:
         *
         * tipo = "echeq"
         * ============================================================
         */

        const whereProgramado = {
          estado:
            "pendiente",

          medio:
            "echeq",

          comprobanteegreso_id:
            null,
        };


        if (proveedor_id) {
          whereProgramado.proveedor_id =
            Number(proveedor_id);
        }


        if (desde || hasta) {
          whereProgramado.fecha_programada =
            parseDateRange({
              desde,
              hasta,
            });
        }


        const programados =
          await PagoProgramadoTesoreria.findAll({
            where:
              whereProgramado,

            order: [
              ["fecha_programada", "DESC"],
              ["id", "DESC"],
            ],
          });


        const programadosNormalizados =
          programados.map((r) => ({
            /*
             * Esto es fundamental.
             *
             * FormasPagoEditor utilizará este valor para construir:
             *
             * existing_ref: {
             *   tipo: "pago_programado",
             *   id: ...
             * }
             */
            tipo:
              "pago_programado",

            id:
              r.id,

            medio:
              "echeq",

            /*
             * fecha = fecha del compromiso.
             *
             * También la exponemos como fecha_emision solamente
             * para mantener compatibilidad visual con el editor.
             *
             * NO significa que el eCheq haya sido emitido.
             */
            fecha:
              r.fecha_programada,

            fecha_emision:
              r.fecha_programada,

            fecha_vencimiento:
              r.echeq_fecha_vencimiento ||
              null,

            echeq_fecha_vencimiento:
              r.echeq_fecha_vencimiento ||
              null,

            monto:
              Number(r.monto || 0),

            banco_id:
              r.banco_id || null,

            /*
             * El número todavía no existe.
             *
             * Se ingresará cuando se acredite/materialice
             * efectivamente el eCheq.
             */
            numero_echeq:
              null,

            descripcion:
              `[PROGRAMADO] ${r.descripcion}`,

            proveedor_id:
              r.proveedor_id,

            empresa_id:
              r.empresa_id,

            formapago_id:
              r.formapago_id || null,

            tipo_programado:
              r.tipo,

            estado:
              r.estado,
          }));


        /*
         * Mezclamos:
         *
         * - EcheqEmitido reales disponibles
         * - PagoProgramadoTesoreria pendientes
         */

        rows = [
          ...echeqsNormalizados,
          ...programadosNormalizados,
        ];


        break;
      }

      case "tarjeta": { // PagoTarjetaCredito
        const where = { ...baseCommon };
        if (desde || hasta) where.fecha = parseDateRange({ desde, hasta });
        if (like) where.concepto = like;

        const pagosTarjeta =
          await PagoTarjetaCredito.findAll({
            where,

            order: [
              ["fecha", "DESC"],
              ["id", "DESC"],
            ],
          });


        const idsTarjetaUtilizados =
          await obtenerIdsYaUtilizados(
            "PagoTarjetaCredito",

            pagosTarjeta.map(
              (pago) =>
                pago.id
            )
          );


        const pagosTarjetaDisponibles =
          pagosTarjeta.filter(
            (pago) =>
              !idsTarjetaUtilizados.has(
                Number(
                  pago.id
                )
              )
          );


        rows =
          pagosTarjetaDisponibles.map(
            (r) => ({
              tipo:
                "tarjeta",

              id:
                r.id,

              fecha:
                r.fecha,

              monto:
                Number(
                  r.importe || 0
                ),

              tipotarjeta_id:
                r.tipotarjeta_id ||
                null,

              marcatarjeta_id:
                r.marcatarjeta_id ||
                null,

              cupon_numero:
                r.cupon_numero ||
                null,

              planpago_id:
                r.planpago_id ||
                null,

              estado:
                r.estado ||
                null,

              proveedor_id:
                r.proveedor_id ||
                null,

              empresa_id:
                r.empresa_id ||
                null,
            })
          );
        break;
      }

      case "ctacte": { // MovimientoCtaCteProveedor (cargos)
        const where = { ...baseCommon, tipo: "cargo" };
        if (desde || hasta) where.fecha = parseDateRange({ desde, hasta });
        if (like) where.descripcion = like;

        rows = await MovimientoCtaCteProveedor.findAll({
          where,
          order: [["fecha", "DESC"], ["id", "DESC"]],
        });

        rows = rows.map(r => ({
          tipo: "ctacte",
          id: r.id,
          fecha: r.fecha,
          fecha_pago: r.fecha_pago || null,
          monto: Number(r.importe || 0),
          descripcion: r.descripcion || null,
          proveedor_id: r.proveedor_id || null,
          empresa_id: r.empresa_id || null,
        }));
        break;
      }

      default:
        return res.status(400).json({ error: `medio no soportado: ${medio}` });
    }

    res.json(rows);
  } catch (e) {
    console.error("listarDisponibles", e);
    res.status(500).json({ error: "Error listando movimientos disponibles" });
  }
}
