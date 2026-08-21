import { Op } from "sequelize";

import ComprobanteEgreso
  from "../../../models/iva/comprobanteegreso.js";


import MovimientoCajaTesoreria
  from "../../../models/tesoreria/movimientocajatesoreria.js";

import MovimientoBancoTesoreria
  from "../../../models/tesoreria/movimientobancotesoreria.js";

import MovimientoCtaCteProveedor
  from "../../../models/tesoreria/movimientoctacteproveedor.js";

import MovCtaCteProvAplic
  from "../../../models/tesoreria/movimientoctacteproveedoraplicacion.js";

import PagoTarjetaCredito
  from "../../../models/tesoreria/pagotarjetacredito.js";

import EcheqEmitido
  from "../../../models/tesoreria/pagoecheq.js";


const EPS = 0.0001;


/**
 * Recalcula el saldo y estado de pago de un ComprobanteEgreso
 * tomando únicamente pagos REALES.
 *
 * Un PagoProgramadoTesoreria pendiente NO entra aquí.
 */
export async function recalcularComprobanteEgreso(
  compId,
  transaction
) {

  const id = Number(compId || 0);

  if (!id) {
    return null;
  }


  const comp =
    await ComprobanteEgreso.findByPk(
      id,
      {
        transaction,
      }
    );


  if (!comp) {
    return null;
  }


  /*
   * IMPORTANTE:
   *
   * emitirComprobanteEgreso utiliza montoreal como base
   * cuando existe. Mantenemos exactamente ese criterio.
   */
  const total =
    Number(comp.total || 0);

  const montoReal =
    Number(comp.montoreal || 0);

  const totalBase =
    montoReal > 0
      ? montoReal
      : total;


  // =========================================================
  // PAGOS REALES DIRECTOS
  // =========================================================

  const [
    movimientosCaja,
    movimientosBanco,
    pagosTarjeta,
    echeqs,
  ] = await Promise.all([

    MovimientoCajaTesoreria.findAll({
      where: {
        comprobanteegreso_id: id,

        anulado: {
          [Op.not]: true,
        },
      },

      transaction,
    }),


    MovimientoBancoTesoreria.findAll({
      where: {
        comprobanteegreso_id: id,

        anulado: {
          [Op.not]: true,
        },
      },

      transaction,
    }),


    PagoTarjetaCredito.findAll({
      where: {
        comprobanteegreso_id: id,

        anulado: {
          [Op.not]: true,
        },
      },

      transaction,
    }),


    EcheqEmitido.findAll({
      where: {
        comprobanteegreso_id: id,

        anulado: {
          [Op.not]: true,
        },
      },

      transaction,
    }),
  ]);


  const pagosDirectos =

    movimientosCaja.reduce(
      (acc, r) =>
        acc + Number(r.monto || 0),
      0
    )

    +

    movimientosBanco.reduce(
      (acc, r) =>
        acc + Number(r.monto || 0),
      0
    )

    +

    pagosTarjeta.reduce(
      (acc, r) =>
        acc + Number(r.importe || 0),
      0
    )

    +

    echeqs.reduce(
      (acc, r) =>
        acc + Number(r.importe || 0),
      0
    );


  // =========================================================
  // APLICACIONES DE ABONOS A CARGOS DEL COMPROBANTE
  // =========================================================

  const cargos =
    await MovimientoCtaCteProveedor.findAll({
      where: {
        comprobanteegreso_id: id,

        tipo:
          "cargo",

        anulado: {
          [Op.not]: true,
        },
      },

      attributes: [
        "id",
      ],

      transaction,
    });


  const cargoIds =
    cargos.map(
      (c) => c.id
    );


  let aplicadoAbonos = 0;


  if (cargoIds.length > 0) {

    const aplicaciones =
      await MovCtaCteProvAplic.findAll({
        where: {
          cargo_id: {
            [Op.in]: cargoIds,
          },
        },

        attributes: [
          "importe",
        ],

        transaction,
      });


    aplicadoAbonos =
      aplicaciones.reduce(
        (acc, a) =>
          acc +
          Number(a.importe || 0),
        0
      );
  }


  // =========================================================
  // TOTAL REALMENTE PAGADO
  // =========================================================

  const pagadoReal =
    pagosDirectos +
    aplicadoAbonos;


  const saldo =
    Math.max(
      0,
      Number(
        (
          totalBase -
          pagadoReal
        ).toFixed(2)
      )
    );


  let estadoComp =
    "impaga";


  if (
    Math.abs(saldo) <= EPS
  ) {

    estadoComp =
      "pagada";

  } else if (
    pagadoReal > EPS
  ) {

    estadoComp =
      "parcial";
  }


  const patch = {
    saldo,
  };


  if (
    Object.prototype.hasOwnProperty.call(
      comp.dataValues,
      "estadopago"
    )
  ) {

    patch.estadopago =
      estadoComp;
  }


  /*
   * Solamente actualizamos "estado" si realmente
   * forma parte del modelo.
   */
  if (
    Object.prototype.hasOwnProperty.call(
      comp.dataValues,
      "estado"
    )
  ) {

    patch.estado =
      estadoComp;
  }


  await comp.update(
    patch,
    {
      transaction,
    }
  );


  return {
    comprobante:
      comp,

    totalBase,

    pagosDirectos,

    aplicadoAbonos,

    pagadoReal,

    saldo,

    estado:
      estadoComp,
  };
}