import { Op } from "sequelize";
import { sequelize } from "../../config/database.js";

import AjusteComprobanteEgreso
    from "../../models/tesoreria/ajusteComprobanteEgreso.js";

import ComprobanteEgreso
    from "../../models/iva/comprobanteegreso.js";

import MovimientoCtaCteProveedor
    from "../../models/tesoreria/movimientoctacteproveedor.js";

import MovCtaCteProvAplic
    from "../../models/tesoreria/movimientoctacteproveedoraplicacion.js";

import MovimientoCajaTesoreria
    from "../../models/tesoreria/movimientocajatesoreria.js";

import MovimientoBancoTesoreria
    from "../../models/tesoreria/movimientobancotesoreria.js";

import EcheqEmitido
    from "../../models/tesoreria/pagoecheq.js";

import PagoTarjetaCredito
    from "../../models/tesoreria/pagotarjetacredito.js";

import OrdenPago
    from "../../models/tesoreria/ordendepago.js";

import FormaPagoTesoreria
    from "../../models/comun/formapagotesoreria.js";

import { recalcularComprobanteEgreso }
    from "./helpers/recalcularComprobanteEgreso.js";


const EPS = 0.009;

const N = (value) =>
    Number(value) || 0;


const hoy = () =>
    new Date()
        .toISOString()
        .slice(0, 10);


/*
 * ================================================================
 * TOTAL FINANCIERO DEL COMPROBANTE
 * ================================================================
 *
 * totalBase
 * + ajustes aumenta
 * - ajustes disminuye
 *
 * Los ajustes fiscales NO modifican comp.total/montoreal.
 * ================================================================
 */

async function calcularTotalFinanciero(
    comp,
    trx
) {

    const totalComp =
        N(comp.total);

    const totalLCD =
        N(comp.montoreal);

    const totalBase =
        totalLCD > 0
            ? totalLCD
            : totalComp;


    const ajustes =
        await AjusteComprobanteEgreso.findAll({
            where: {
                comprobanteegreso_id:
                    comp.id,

                anulado: false,
            },

            transaction: trx,
        });


    let aumenta = 0;
    let disminuye = 0;


    for (const ajuste of ajustes) {

        const tipo =
            String(
                ajuste.tipo || ""
            )
                .trim()
                .toLowerCase();


        if (tipo === "aumenta") {

            aumenta +=
                N(ajuste.importe);

        } else if (
            tipo === "disminuye"
        ) {

            disminuye +=
                N(ajuste.importe);
        }
    }


    const totalFinanciero =
        Number(
            (
                totalBase +
                aumenta -
                disminuye
            ).toFixed(2)
        );


    return Math.max(
        0,
        totalFinanciero
    );
}


/*
 * ================================================================
 * PAGOS REALES DEL COMPROBANTE
 * ================================================================
 *
 * Caja
 * Banco
 * eCheq
 * Tarjeta
 * aplicaciones de ABONOS sobre cargos del comprobante
 *
 * El CARGO de Cta.Cte. NO es pago real.
 * ================================================================
 */

// async function calcularPagadoReal(
//   compId,
//   trx
// ) {

//   const [
//     caja,
//     banco,
//     echeqs,
//     tarjetas,
//     cargos,
//   ] =
//     await Promise.all([

//       MovimientoCajaTesoreria.findAll({
//         where: {
//           comprobanteegreso_id:
//             compId,

//           [Op.or]: [
//             { anulado: false },
//             { anulado: null },
//           ],
//         },

//         transaction: trx,
//       }),


//       MovimientoBancoTesoreria.findAll({
//         where: {
//           comprobanteegreso_id:
//             compId,

//           [Op.or]: [
//             { anulado: false },
//             { anulado: null },
//           ],
//         },

//         transaction: trx,
//       }),


//       EcheqEmitido.findAll({
//         where: {
//           comprobanteegreso_id:
//             compId,

//           anulado: false,

//           estado: {
//             [Op.notIn]: [
//               "anulado",
//               "rechazado",
//             ],
//           },
//         },

//         transaction: trx,
//       }),


//       PagoTarjetaCredito.findAll({
//         where: {
//           comprobanteegreso_id:
//             compId,

//           anulado: false,

//           estado: {
//             [Op.notIn]: [
//               "rechazado",
//             ],
//           },
//         },

//         transaction: trx,
//       }),


//       MovimientoCtaCteProveedor.findAll({
//         where: {
//           comprobanteegreso_id:
//             compId,

//           tipo:
//             "cargo",

//           [Op.or]: [
//             { anulado: false },
//             { anulado: null },
//           ],
//         },

//         transaction: trx,
//       }),
//     ]);


//   const pagosDirectos =
//     caja.reduce(
//       (acc, row) =>
//         acc + N(row.monto),
//       0
//     )
//     +
//     banco.reduce(
//       (acc, row) =>
//         acc + N(row.monto),
//       0
//     )
//     +
//     echeqs.reduce(
//       (acc, row) =>
//         acc + N(row.importe),
//       0
//     )
//     +
//     tarjetas.reduce(
//       (acc, row) =>
//         acc + N(row.importe),
//       0
//     );


//   const cargoIds =
//     cargos
//       .map(c => Number(c.id))
//       .filter(Boolean);


//   let aplicadoAbonos = 0;


//   if (cargoIds.length) {

//     const aplicaciones =
//       await MovCtaCteProvAplic.findAll({
//         where: {
//           cargo_id: {
//             [Op.in]:
//               cargoIds,
//           },
//         },

//         transaction: trx,
//       });


//     aplicadoAbonos =
//       aplicaciones.reduce(
//         (acc, row) =>
//           acc +
//           N(row.importe),
//         0
//       );
//   }


//   return {
//     pagosDirectos,
//     aplicadoAbonos,

//     pagadoReal:
//       Number(
//         (
//           pagosDirectos +
//           aplicadoAbonos
//         ).toFixed(2)
//       ),
//   };
// }


/*
 * ================================================================
 * FORMA CTA CTE
 * ================================================================
 */

async function obtenerFormaCtaCte(
    trx
) {

    const formas =
        await FormaPagoTesoreria.findAll({
            transaction: trx,
        });


    return formas.find(
        forma => {

            const descripcion =
                String(
                    forma.descripcion || ""
                )
                    .trim()
                    .toUpperCase();

            return (
                descripcion === "CTA CTE" ||
                descripcion === "CTA. CTE." ||
                descripcion === "CUENTA CORRIENTE"
            );
        }
    ) || null;
}


/*
 * ================================================================
 * SINCRONIZAR CTA CTE CON LA OBLIGACIÓN
 * ================================================================
 *
 * OPCIÓN A:
 *
 * La Cta.Cte. absorbe automáticamente la diferencia.
 *
 * La deuda que debe quedar representada por Cta.Cte. es:
 *
 * total financiero - pagos directos
 *
 * Si ya existen aplicaciones sobre el cargo, jamás podemos reducir
 * el cargo por debajo de lo aplicado.
 * ================================================================
 */

async function sincronizarCargoCtaCte(
    comp,
    totalFinanciero,
    trx
) {

    const compId =
        Number(comp.id);


    const [
        caja,
        banco,
        echeqs,
        tarjetas,
    ] =
        await Promise.all([

            MovimientoCajaTesoreria.findAll({
                where: {
                    comprobanteegreso_id:
                        compId,

                    [Op.or]: [
                        { anulado: false },
                        { anulado: null },
                    ],
                },

                transaction: trx,
            }),


            MovimientoBancoTesoreria.findAll({
                where: {
                    comprobanteegreso_id:
                        compId,

                    [Op.or]: [
                        { anulado: false },
                        { anulado: null },
                    ],
                },

                transaction: trx,
            }),


            EcheqEmitido.findAll({
                where: {
                    comprobanteegreso_id:
                        compId,

                    anulado: false,

                    estado: {
                        [Op.notIn]: [
                            "anulado",
                            "rechazado",
                        ],
                    },
                },

                transaction: trx,
            }),


            PagoTarjetaCredito.findAll({
                where: {
                    comprobanteegreso_id:
                        compId,

                    anulado: false,

                    estado: {
                        [Op.notIn]: [
                            "rechazado",
                        ],
                    },
                },

                transaction: trx,
            }),
        ]);


    const pagosDirectos =
        caja.reduce(
            (acc, row) =>
                acc + N(row.monto),
            0
        )
        +
        banco.reduce(
            (acc, row) =>
                acc + N(row.monto),
            0
        )
        +
        echeqs.reduce(
            (acc, row) =>
                acc + N(row.importe),
            0
        )
        +
        tarjetas.reduce(
            (acc, row) =>
                acc + N(row.importe),
            0
        );


    /*
     * Ésta es la deuda que debe quedar
     * representada en Cta.Cte.
     */

    const deudaCtaCte =
        Number(
            Math.max(
                0,
                totalFinanciero -
                pagosDirectos
            ).toFixed(2)
        );


    const cargos =
        await MovimientoCtaCteProveedor.findAll({
            where: {
                comprobanteegreso_id:
                    compId,

                tipo:
                    "cargo",

                [Op.or]: [
                    { anulado: false },
                    { anulado: null },
                ],
            },

            order: [
                ["id", "ASC"],
            ],

            transaction: trx,
            lock: trx.LOCK.UPDATE,
        });


    /*
     * Sumamos todo lo ya aplicado a los cargos.
     */

    const cargoIds =
        cargos
            .map(c => Number(c.id))
            .filter(Boolean);


    let totalAplicado = 0;


    if (cargoIds.length) {

        const aplicaciones =
            await MovCtaCteProvAplic.findAll({
                where: {
                    cargo_id: {
                        [Op.in]:
                            cargoIds,
                    },
                },

                transaction: trx,
                lock: trx.LOCK.UPDATE,
            });


        totalAplicado =
            aplicaciones.reduce(
                (acc, row) =>
                    acc +
                    N(row.importe),
                0
            );
    }


    /*
     * Regla de seguridad:
     *
     * nunca podemos reducir la deuda por debajo
     * de lo que ya fue aplicado/pagado.
     */

    if (
        deudaCtaCte <
        totalAplicado - EPS
    ) {

        throw new Error(
            `No se puede eliminar el ajuste porque la nueva deuda en Cuenta Corriente sería $${deudaCtaCte.toFixed(2)}, pero ya existen $${totalAplicado.toFixed(2)} aplicados sobre ella.`
        );
    }


    /*
     * ============================================================
     * NO DEBE EXISTIR CARGO
     * ============================================================
     */

    if (
        deudaCtaCte <= EPS
    ) {

        /*
         * Si llegamos hasta acá totalAplicado también
         * necesariamente es cero.
         */

        for (const cargo of cargos) {

            await cargo.destroy({
                transaction: trx,
            });
        }


        return {
            deudaCtaCte: 0,
            cargo_id: null,
        };
    }


    /*
     * ============================================================
     * DEBE EXISTIR CARGO
     * ============================================================
     */

    const formaCtaCte =
        await obtenerFormaCtaCte(
            trx
        );


    if (!formaCtaCte) {

        throw new Error(
            'No se encontró la forma de pago "CTA CTE".'
        );
    }


    /*
     * Normalmente debe existir un único cargo.
     *
     * Si ya existe, lo reutilizamos.
     */

    let cargoPrincipal =
        cargos[0] || null;


    if (!cargoPrincipal) {

        if (!comp.proveedor_id) {

            throw new Error(
                "No se puede generar la deuda en Cuenta Corriente porque el comprobante no tiene proveedor."
            );
        }


        cargoPrincipal =
            await MovimientoCtaCteProveedor.create(
                {
                    proveedor_id:
                        comp.proveedor_id,

                    empresa_id:
                        comp.empresa_id ||
                        null,

                    fecha:
                        comp.fechapago ||
                        comp.fechacomprobante ||
                        hoy(),

                    fecha_pago:
                        null,

                    descripcion:
                        `Ajuste de deuda por modificación de comp. ${comp.nrocomprobante ?? comp.id}`,

                    tipo:
                        "cargo",

                    importe:
                        deudaCtaCte,

                    origen_tipo:
                        "ComprobanteEgreso",

                    origen_id:
                        comp.id,

                    comprobanteegreso_id:
                        comp.id,

                    anulado:
                        false,

                    ordenpago_id:
                        comp.ordenpago_id ||
                        null,

                    formapago_id:
                        formaCtaCte.id,
                },

                {
                    transaction: trx,
                }
            );


        return {
            deudaCtaCte,
            cargo_id:
                cargoPrincipal.id,
        };
    }


    /*
     * Si hay un solo cargo, simplemente
     * actualizamos su importe.
     */

    if (
        cargos.length === 1
    ) {

        await cargoPrincipal.update(
            {
                importe:
                    deudaCtaCte,

                formapago_id:
                    cargoPrincipal.formapago_id ||
                    formaCtaCte.id,
            },

            {
                transaction: trx,
            }
        );


        return {
            deudaCtaCte,
            cargo_id:
                cargoPrincipal.id,
        };
    }


    /*
     * ============================================================
     * DEFENSA: MÁS DE UN CARGO
     * ============================================================
     *
     * No consolidamos automáticamente cargos históricos porque
     * pueden tener aplicaciones asociadas individualmente.
     *
     * En ese caso bloqueamos la operación.
     * ============================================================
     */

    throw new Error(
        "El comprobante tiene más de un cargo activo de Cuenta Corriente. No se puede redistribuir automáticamente el ajuste."
    );
}


/*
 * ================================================================
 * RECALCULAR COMPROBANTE Y OP
 * ================================================================
 */

// async function recalcularDespuesDeAjuste(
//   comp,
//   trx
// ) {

//   const totalFinanciero =
//     await calcularTotalFinanciero(
//       comp,
//       trx
//     );


//   const pagos =
//     await calcularPagadoReal(
//       comp.id,
//       trx
//     );


//   const saldo =
//     Number(
//       Math.max(
//         0,
//         totalFinanciero -
//         pagos.pagadoReal
//       ).toFixed(2)
//     );


//   let estadoComp =
//     "impaga";


//   if (
//     saldo <= EPS
//   ) {

//     estadoComp =
//       "pagada";

//   } else if (
//     pagos.pagadoReal > EPS
//   ) {

//     estadoComp =
//       "parcial";
//   }


//   const patch = {
//     saldo,
//   };


//   if (
//     Object.prototype.hasOwnProperty.call(
//       comp.dataValues,
//       "estadopago"
//     )
//   ) {

//     patch.estadopago =
//       estadoComp;
//   }


//   if (
//     Object.prototype.hasOwnProperty.call(
//       comp.dataValues,
//       "estado"
//     )
//   ) {

//     patch.estado =
//       estadoComp;
//   }


//   await comp.update(
//     patch,
//     {
//       transaction: trx,
//     }
//   );


//   /*
//    * La OP representa la obligación financiera
//    * actual del comprobante.
//    */

//   let orden =
//     null;


//   if (
//     comp.ordenpago_id
//   ) {

//     orden =
//       await OrdenPago.findByPk(
//         comp.ordenpago_id,
//         {
//           transaction: trx,
//           lock: trx.LOCK.UPDATE,
//         }
//       );

//   } else {

//     orden =
//       await OrdenPago.findOne({
//         where: {
//           comprobanteegreso_id:
//             comp.id,
//         },

//         transaction: trx,
//         lock: trx.LOCK.UPDATE,
//       });
//   }


//   if (orden) {

//     let estadoOrden =
//       "emitida";


//     if (
//       estadoComp === "pagada"
//     ) {

//       estadoOrden =
//         "aplicada";

//     } else if (
//       estadoComp === "parcial"
//     ) {

//       estadoOrden =
//         "parcial";
//     }


//     await orden.update(
//       {
//         total:
//           totalFinanciero,

//         estado:
//           estadoOrden,
//       },

//       {
//         transaction: trx,
//       }
//     );
//   }


//   return {
//     totalFinanciero,
//     pagadoReal:
//       pagos.pagadoReal,
//     saldo,
//     estado:
//       estadoComp,
//   };
// }


/*
 * ================================================================
 * LISTAR
 * ================================================================
 */

export const listarAjustesComprobanteEgreso =
    async (req, res) => {

        try {

            const {
                comprobanteegreso_id,
                empresa_id,
                proveedor_id,
                includeAnulados = "0",
            } = req.query || {};


            const where = {};


            if (
                comprobanteegreso_id
            ) {

                where.comprobanteegreso_id =
                    Number(
                        comprobanteegreso_id
                    );
            }


            if (empresa_id) {

                where.empresa_id =
                    Number(
                        empresa_id
                    );
            }


            if (proveedor_id) {

                where.proveedor_id =
                    Number(
                        proveedor_id
                    );
            }


            if (
                includeAnulados !== "1"
            ) {

                where.anulado =
                    false;
            }


            const ajustes =
                await AjusteComprobanteEgreso.findAll({
                    where,

                    order: [
                        ["fecha", "ASC"],
                        ["id", "ASC"],
                    ],
                });


            return res.json(
                ajustes
            );


        } catch (error) {

            console.error(
                "❌ listarAjustesComprobanteEgreso:",
                error
            );


            return res.status(500).json({
                error:
                    error.message ||
                    "No se pudieron listar los ajustes",
            });
        }
    };


/*
 * ================================================================
 * OBTENER
 * ================================================================
 */

export const obtenerAjusteComprobanteEgresoPorId =
    async (req, res) => {

        try {

            const id =
                Number(
                    req.params.id || 0
                );


            if (!id) {

                return res.status(400).json({
                    error:
                        "ID inválido",
                });
            }


            const ajuste =
                await AjusteComprobanteEgreso.findByPk(
                    id
                );


            if (!ajuste) {

                return res.status(404).json({
                    error:
                        "Ajuste no encontrado",
                });
            }


            return res.json(
                ajuste
            );


        } catch (error) {

            console.error(
                "❌ obtenerAjusteComprobanteEgresoPorId:",
                error
            );


            return res.status(500).json({
                error:
                    error.message ||
                    "No se pudo obtener el ajuste",
            });
        }
    };


/*
 * ================================================================
 * ELIMINAR AJUSTE
 * ================================================================
 *
 * OPCIÓN A:
 *
 * Al desaparecer el ajuste, la Cuenta Corriente
 * absorbe automáticamente la diferencia.
 * ================================================================
 */

export const eliminarAjusteComprobanteEgreso =
    async (req, res) => {

        const t =
            await sequelize.transaction();


        try {

            const id =
                Number(
                    req.params.id || 0
                );


            if (!id) {

                throw new Error(
                    "ID de ajuste inválido"
                );
            }


            /*
             * 1. Buscar ajuste.
             */

            const ajuste =
                await AjusteComprobanteEgreso.findByPk(
                    id,
                    {
                        transaction: t,
                        lock: t.LOCK.UPDATE,
                    }
                );


            if (!ajuste) {

                await t.rollback();

                return res.status(404).json({
                    error:
                        "Ajuste no encontrado",
                });
            }


            if (ajuste.anulado) {

                throw new Error(
                    "El ajuste ya se encuentra anulado."
                );
            }


            /*
             * 2. Bloquear comprobante.
             */

            const comp =
                await ComprobanteEgreso.findByPk(
                    ajuste.comprobanteegreso_id,
                    {
                        transaction: t,
                        lock: t.LOCK.UPDATE,
                    }
                );


            if (!comp) {

                throw new Error(
                    "No se encontró el comprobante asociado al ajuste."
                );
            }


            /*
             * 3. Eliminar ajuste.
             *
             * Todavía estamos dentro de la transacción.
             * Si cualquier validación posterior falla,
             * el rollback lo restaura.
             */

            await ajuste.destroy({
                transaction: t,
            });


            /*
             * 4. Recalcular obligación financiera SIN
             *    el ajuste eliminado.
             */

            const totalFinanciero =
                await calcularTotalFinanciero(
                    comp,
                    t
                );


            /*
             * 5. OPCIÓN A:
             *
             * Cuenta Corriente absorbe la diferencia.
             *
             * Si esto requiere reducir el cargo por debajo
             * de aplicaciones existentes, esta función lanza
             * error y toda la operación vuelve atrás.
             */

            const resultadoCtaCte =
                await sincronizarCargoCtaCte(
                    comp,
                    totalFinanciero,
                    t
                );


            /*
             * 6. Recalcular saldo y estado del comprobante
             * usando el helper general.
             *
             * Este helper ya contempla:
             *
             * totalBase
             * + ajustes aumenta
             * - ajustes disminuye
             * - pagos reales
             * - aplicaciones de Cta.Cte.
             */

            const resultado =
                await recalcularComprobanteEgreso(
                    comp.id,
                    t
                );

            /*
* 6.1) Actualizar Orden de Pago.
*
* La OP representa la obligación financiera
* resultante después de los ajustes.
*/

            let orden = null;


            if (comp.ordenpago_id) {

                orden =
                    await OrdenPago.findByPk(
                        comp.ordenpago_id,
                        {
                            transaction: t,
                            lock: t.LOCK.UPDATE,
                        }
                    );

            } else {

                orden =
                    await OrdenPago.findOne({
                        where: {
                            comprobanteegreso_id:
                                comp.id,
                        },

                        transaction: t,
                        lock: t.LOCK.UPDATE,
                    });
            }


            if (orden) {

                let estadoOrden =
                    "emitida";


                if (
                    resultado.estado ===
                    "pagada"
                ) {

                    estadoOrden =
                        "aplicada";

                } else if (
                    resultado.estado ===
                    "parcial"
                ) {

                    estadoOrden =
                        "parcial";
                }


                await orden.update(
                    {
                        total:
                            resultado.totalFinanciero,

                        estado:
                            estadoOrden,
                    },

                    {
                        transaction: t,
                    }
                );
            }


            /*
             * 7. Reconstruir formapago_id del header.
             *
             * Como la opción A puede crear/eliminar Cta.Cte.,
             * reconstruimos la composición actual.
             */

            const [
                caja,
                banco,
                echeqs,
                tarjetas,
                cargos,
            ] =
                await Promise.all([

                    MovimientoCajaTesoreria.findAll({
                        where: {
                            comprobanteegreso_id:
                                comp.id,

                            [Op.or]: [
                                { anulado: false },
                                { anulado: null },
                            ],
                        },

                        attributes: [
                            "formapago_id",
                        ],

                        transaction: t,
                    }),


                    MovimientoBancoTesoreria.findAll({
                        where: {
                            comprobanteegreso_id:
                                comp.id,

                            [Op.or]: [
                                { anulado: false },
                                { anulado: null },
                            ],
                        },

                        attributes: [
                            "formapago_id",
                        ],

                        transaction: t,
                    }),


                    EcheqEmitido.findAll({
                        where: {
                            comprobanteegreso_id:
                                comp.id,

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

                        transaction: t,
                    }),


                    PagoTarjetaCredito.findAll({
                        where: {
                            comprobanteegreso_id:
                                comp.id,

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

                        transaction: t,
                    }),


                    MovimientoCtaCteProveedor.findAll({
                        where: {
                            comprobanteegreso_id:
                                comp.id,

                            tipo:
                                "cargo",

                            [Op.or]: [
                                { anulado: false },
                                { anulado: null },
                            ],
                        },

                        attributes: [
                            "id",
                        ],

                        transaction: t,
                    }),
                ]);


            const formas =
                await FormaPagoTesoreria.findAll({
                    transaction: t,
                });


            const buscarForma =
                descripcion => {

                    const buscada =
                        String(descripcion || "")
                            .trim()
                            .toUpperCase();

                    return formas.find(
                        f =>
                            String(f.descripcion || "")
                                .trim()
                                .toUpperCase() ===
                            buscada
                    ) || null;
                };


            const ids =
                new Set();


            for (const mov of caja) {

                if (mov.formapago_id) {

                    ids.add(
                        Number(
                            mov.formapago_id
                        )
                    );
                }
            }


            for (const mov of banco) {

                if (mov.formapago_id) {

                    ids.add(
                        Number(
                            mov.formapago_id
                        )
                    );
                }
            }


            if (echeqs.length) {

                const fp =
                    buscarForma("ECHEQ");

                if (fp) {

                    ids.add(
                        Number(fp.id)
                    );
                }
            }


            if (tarjetas.length) {

                const fp =
                    buscarForma(
                        "TARJETA CREDITO"
                    );

                if (fp) {

                    ids.add(
                        Number(fp.id)
                    );
                }
            }


            if (cargos.length) {

                const fp =
                    buscarForma(
                        "CTA CTE"
                    );


                if (fp) {

                    ids.add(
                        Number(fp.id)
                    );
                }
            }


            await comp.update(
                {
                    formapago_id:
                        ids.size === 1
                            ? [...ids][0]
                            : null,
                },

                {
                    transaction: t,
                }
            );


            /*
             * 8. Commit.
             */

            await t.commit();


            return res.json({
                ok: true,

                mensaje:
                    "Ajuste eliminado. La Cuenta Corriente y el comprobante fueron recalculados.",

                ajuste_eliminado_id:
                    id,

                cuenta_corriente:
                    resultadoCtaCte,

                total_financiero:
                    resultado.totalFinanciero,

                pagado_real:
                    resultado.pagadoReal,

                saldo:
                    resultado.saldo,

                estado:
                    resultado.estado,
            });


        } catch (error) {

            try {

                if (
                    t &&
                    !t.finished
                ) {

                    await t.rollback();
                }

            } catch (rollbackError) {

                console.error(
                    "⚠️ Error en rollback:",
                    rollbackError
                );
            }


            console.error(
                "❌ eliminarAjusteComprobanteEgreso:",
                error
            );


            return res.status(400).json({
                error:
                    error.message ||
                    "No se pudo eliminar el ajuste",
            });
        }
    };