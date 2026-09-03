import ComprobanteEgreso from "../../models/iva/comprobanteegreso.js";
import MovimientoCajaTesoreria from "../../models/tesoreria/movimientocajatesoreria.js"
import MovimientoBancoTesoreria from "../../models/tesoreria/movimientobancotesoreria.js";
import EcheqEmitido from "../../models/tesoreria/pagoecheq.js";
import PagoTarjetaCredito from "../../models/tesoreria/pagotarjetacredito.js";
import MovimientoCtaCteProveedor from "../../models/tesoreria/movimientoctacteproveedor.js";
import OrdenPago from "../../models/tesoreria/ordendepago.js";
import { sequelize } from "../../config/database.js"; // <-- importa la instancia
import MovCtaCteProvAplic
  from "../../models/tesoreria/MovimientoCtaCteProveedorAplicacion.js";

// Crear nuevo comprobante de egreso
export const crearComprobanteEgreso = async (req, res) => {
  try {
    const nuevo = await ComprobanteEgreso.create(req.body);
    res.status(201).json(nuevo);
  } catch (error) {
    res.status(500).json({ error: 'Error al crear comprobante de egreso', detalle: error.message });
  }
};

// // Listar todos
// export const listarComprobantesEgreso = async (req, res) => {
//   try {
//     const lista = await ComprobanteEgreso.findAll();
//     res.status(200).json(lista);
//   } catch (error) {
//     res.status(500).json({ error: 'Error al listar comprobantes de egreso' });
//   }
// };

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

// Actualizar
export const actualizarComprobanteEgreso = async (req, res) => {
  const t = await sequelize.transaction();

  try {
    const EPS = 0.009;
    const id = Number(req.params.id);

    if (!id) {
      await t.rollback();
      return res.status(400).json({
        error: "ID de comprobante inválido",
      });
    }

    /*
     * ============================================================
     * 1) CARGAR COMPROBANTE CON LOCK
     * ============================================================
     */
    const comp = await ComprobanteEgreso.findByPk(id, {
      transaction: t,
      lock: t.LOCK.UPDATE,
    });

    if (!comp) {
      await t.rollback();

      return res.status(404).json({
        error: "Comprobante de egreso no encontrado",
      });
    }

    /*
     * ============================================================
     * 2) VERIFICAR QUE EL COMPROBANTE HAYA SIDO EMITIDO
     *    100% A CUENTA CORRIENTE
     * ============================================================
     *
     * No confiamos solamente en formapago_id del encabezado.
     *
     * Revisamos los efectos financieros reales creados para
     * el comprobante.
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
          comprobanteegreso_id: comp.id,
        },
        transaction: t,
        lock: t.LOCK.UPDATE,
      }),

      MovimientoBancoTesoreria.findAll({
        where: {
          comprobanteegreso_id: comp.id,
        },
        transaction: t,
        lock: t.LOCK.UPDATE,
      }),

      EcheqEmitido.findAll({
        where: {
          comprobanteegreso_id: comp.id,
        },
        transaction: t,
        lock: t.LOCK.UPDATE,
      }),

      PagoTarjetaCredito.findAll({
        where: {
          comprobanteegreso_id: comp.id,
        },
        transaction: t,
        lock: t.LOCK.UPDATE,
      }),

      MovimientoCtaCteProveedor.findAll({
        where: {
          comprobanteegreso_id: comp.id,
          tipo: "cargo",
          anulado: {
            [Op.not]: true,
          },
        },
        transaction: t,
        lock: t.LOCK.UPDATE,
      }),
    ]);

    /*
     * Si existe cualquier desembolso directo asociado al
     * comprobante, no permitimos modificarlo.
     */
    if (
      movimientosCaja.length > 0 ||
      movimientosBanco.length > 0 ||
      echeqs.length > 0 ||
      tarjetas.length > 0
    ) {
      await t.rollback();

      return res.status(400).json({
        error:
          "No se puede modificar el comprobante porque posee una forma de pago distinta de Cuenta Corriente.",
      });
    }

    /*
     * Una factura 100% Cta.Cte. emitida por este flujo debe tener
     * exactamente un cargo asociado.
     */
    if (cargosCtaCte.length !== 1) {
      await t.rollback();

      return res.status(400).json({
        error:
          cargosCtaCte.length === 0
            ? "No se puede modificar el comprobante porque no posee un cargo de Cuenta Corriente asociado."
            : "No se puede modificar el comprobante porque posee más de un cargo de Cuenta Corriente asociado.",
      });
    }

    const cargo = cargosCtaCte[0];

    /*
     * Comprobamos además que ese cargo sea realmente el generado
     * por el comprobante y no otro movimiento posteriormente
     * relacionado.
     */
    if (
      String(cargo.origen_tipo || "").trim().toLowerCase() !==
      "comprobanteegreso" ||
      Number(cargo.origen_id) !== Number(comp.id)
    ) {
      await t.rollback();

      return res.status(400).json({
        error:
          "El cargo de Cuenta Corriente asociado no corresponde al cargo original del comprobante.",
      });
    }

    /*
     * ============================================================
     * 3) VERIFICAR QUE EL CARGO ORIGINAL REPRESENTE EL 100%
     *    DEL COMPROBANTE
     * ============================================================
     */

    const totalActual = Number(
      Number(comp.montoreal || 0) > 0
        ? comp.montoreal
        : comp.total
    );

    const importeCargoActual = Number(cargo.importe || 0);

    if (Math.abs(importeCargoActual - totalActual) > EPS) {
      await t.rollback();

      return res.status(400).json({
        error:
          "No se puede modificar el comprobante porque no fue registrado íntegramente en Cuenta Corriente.",
      });
    }

    /*
     * ============================================================
     * 4) VALIDACIONES FISCALES DEL NUEVO COMPROBANTE
     * ============================================================
     */

    const body = req.body || {};

    /*
 * ============================================================
 * PROVEEDOR NO MODIFICABLE
 * ============================================================
 *
 * Una vez emitido el comprobante, el proveedor no puede cambiarse.
 * Esto protege el cargo de Cta.Cte., sus aplicaciones y la OP.
 * ============================================================
 */

    if (
      Object.prototype.hasOwnProperty.call(body, "proveedor_id") &&
      Number(body.proveedor_id) !== Number(comp.proveedor_id)
    ) {
      await t.rollback();

      return res.status(400).json({
        error:
          "No se puede modificar el proveedor de un comprobante ya emitido.",
      });
    }

    validarDatosFiscalesComprobante({
      iva_especial:
        Object.prototype.hasOwnProperty.call(body, "iva_especial")
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

    /*
     * ============================================================
     * 5) CALCULAR NUEVO TOTAL FINANCIERO
     * ============================================================
     *
     * Respetamos la misma regla utilizada al emitir:
     *
     * montoreal > 0 ? montoreal : total
     * ============================================================
     */

    const nuevoTotalComprobante =
      Object.prototype.hasOwnProperty.call(body, "total")
        ? Number(body.total || 0)
        : Number(comp.total || 0);

    const nuevoMontoReal =
      Object.prototype.hasOwnProperty.call(body, "montoreal")
        ? Number(body.montoreal || 0)
        : Number(comp.montoreal || 0);

    const nuevoTotalBase =
      nuevoMontoReal > 0
        ? nuevoMontoReal
        : nuevoTotalComprobante;

    if (nuevoTotalBase <= 0) {
      throw new Error(
        "El nuevo total del comprobante debe ser mayor a cero"
      );
    }

    /*
     * ============================================================
     * 6) CALCULAR CUÁNTO DEL CARGO YA FUE PAGADO/APLICADO
     * ============================================================
     */

    const aplicaciones =
      await MovCtaCteProvAplic.findAll({
        where: {
          cargo_id: cargo.id,
        },
        transaction: t,
        lock: t.LOCK.UPDATE,
      });

    const totalAplicado = aplicaciones.reduce(
      (acc, aplicacion) =>
        acc + Number(aplicacion.importe || 0),
      0
    );

    /*
     * Podemos aumentar el importe libremente.
     *
     * Podemos disminuirlo solamente hasta el monto que ya está
     * aplicado.
     */
    if (nuevoTotalBase + EPS < totalAplicado) {
      await t.rollback();

      return res.status(400).json({
        error:
          `No se puede reducir el comprobante a $${nuevoTotalBase.toFixed(2)} porque ya tiene $${totalAplicado.toFixed(2)} aplicados en Cuenta Corriente.`,
      });
    }

    /*
     * ============================================================
     * 7) HACIENDA
     * ============================================================
     */

    const hasHaciendaInBody =
      Object.prototype.hasOwnProperty.call(
        body,
        "hacienda_id"
      );

    const nuevoHaciendaId =
      hasHaciendaInBody
        ? body.hacienda_id
          ? Number(body.hacienda_id)
          : null
        : comp.hacienda_id ?? null;

    const viejoHaciendaId =
      comp.hacienda_id
        ? Number(comp.hacienda_id)
        : null;

    /*
     * ============================================================
     * 8) ACTUALIZAR COMPROBANTE
     * ============================================================
     */

    const {
      hacienda_id,
      ...rest
    } = body;

    if (Object.keys(rest).length) {
      await comp.update(rest, {
        transaction: t,
      });
    }

    /*
     * ============================================================
     * 9) ACTUALIZAR CARGO DE CUENTA CORRIENTE
     * ============================================================
     */

    await cargo.update(
      {
        importe: nuevoTotalBase,

        descripcion:
          `Comp. ${comp.nrocomprobante} a cuenta corriente`,
      },
      {
        transaction: t,
      }
    );

    /*
     * ============================================================
     * 10) ACTUALIZAR ORDEN DE PAGO
     * ============================================================
     */

    let orden = null;

    if (comp.ordenpago_id) {
      orden = await OrdenPago.findByPk(
        comp.ordenpago_id,
        {
          transaction: t,
          lock: t.LOCK.UPDATE,
        }
      );
    }

    if (!orden) {
      orden = await OrdenPago.findOne({
        where: {
          comprobanteegreso_id: comp.id,
        },
        transaction: t,
        lock: t.LOCK.UPDATE,
      });
    }

    if (orden) {
      await orden.update(
        {
          total: nuevoTotalBase,
        },
        {
          transaction: t,
        }
      );
    }

    /*
     * ============================================================
     * 11) RECALCULAR SALDO Y ESTADO SEGÚN APLICACIONES
     * ============================================================
     */

    const nuevoSaldo =
      Math.max(
        0,
        nuevoTotalBase - totalAplicado
      );

    let nuevoEstado = "impaga";

    if (
      totalAplicado > EPS &&
      nuevoSaldo > EPS
    ) {
      nuevoEstado = "parcial";
    }

    if (nuevoSaldo <= EPS) {
      nuevoEstado = "pagada";
    }

    await comp.update(
      {
        saldo: nuevoSaldo,
        estadopago: nuevoEstado,
      },
      {
        transaction: t,
      }
    );

    /*
     * También sincronizamos el estado de la OP.
     */
    if (orden) {
      let estadoOrden = "emitida";

      if (nuevoEstado === "parcial") {
        estadoOrden = "parcial";
      }

      if (nuevoEstado === "pagada") {
        estadoOrden = "aplicada";
      }

      await orden.update(
        {
          estado: estadoOrden,
        },
        {
          transaction: t,
        }
      );
    }

    /*
     * ============================================================
     * 12) SINCRONIZAR HACIENDA
     * ============================================================
     */

    if (hasHaciendaInBody) {
      const cambioHacienda =
        (viejoHaciendaId || null) !==
        (nuevoHaciendaId || null);

      if (cambioHacienda) {

        if (viejoHaciendaId) {
          const hacVieja =
            await Hacienda.findByPk(
              viejoHaciendaId,
              {
                transaction: t,
                lock: t.LOCK.UPDATE,
              }
            );

          if (
            hacVieja &&
            Number(hacVieja.comprobante_id) ===
            Number(comp.id)
          ) {
            await hacVieja.update(
              {
                comprobante_id: null,
              },
              {
                transaction: t,
              }
            );
          }
        }

        if (nuevoHaciendaId) {
          const hacNueva =
            await Hacienda.findByPk(
              nuevoHaciendaId,
              {
                transaction: t,
                lock: t.LOCK.UPDATE,
              }
            );

          if (!hacNueva) {
            throw new Error(
              "Hacienda nueva no encontrada"
            );
          }

          if (
            hacNueva.comprobante_id &&
            Number(hacNueva.comprobante_id) !==
            Number(comp.id)
          ) {
            throw new Error(
              "La Hacienda ya está vinculada a otro comprobante"
            );
          }

          await hacNueva.update(
            {
              comprobante_id: comp.id,
            },
            {
              transaction: t,
            }
          );
        }
      }

      await comp.update(
        {
          hacienda_id: nuevoHaciendaId,
        },
        {
          transaction: t,
        }
      );
    }

    /*
     * ============================================================
     * 13) COMMIT
     * ============================================================
     */

    await t.commit();

    return res.status(200).json({
      ok: true,
      comprobante: comp,
      movimiento_ctacte: cargo,
      ordenpago: orden,
      cuenta_corriente: {
        importe: nuevoTotalBase,
        aplicado: totalAplicado,
        saldo: nuevoSaldo,
      },
    });

  } catch (error) {

    if (!t.finished) {
      await t.rollback();
    }

    console.error(
      "❌ actualizarComprobanteEgreso:",
      error
    );

    return res.status(400).json({
      error:
        error.message ||
        "Error al actualizar el comprobante de egreso",
    });
  }
};

// Eliminar
export const eliminarComprobanteEgreso = async (req, res) => {
  try {
    const item = await ComprobanteEgreso.findByPk(req.params.id);
    if (!item) return res.status(404).json({ error: 'Comprobante de egreso no encontrado' });
    await item.destroy();
    res.status(200).json({ mensaje: 'Comprobante de egreso eliminado correctamente' });
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar el comprobante de egreso' });
  }
};

// export const emitirComprobanteEgreso = async (req, res) => {
//   // console.log("req------------", req.body)
//   const t = await sequelize.transaction();
//   try {
//     const { empresa_id, idempotencyKey, comprobante, pagos } = req.body;

//     if (!empresa_id) throw new Error("empresa_id requerido");
//     if (!comprobante || typeof comprobante !== "object")
//       throw new Error("Datos de comprobante inválidos");
//     if (!Array.isArray(pagos) || pagos.length === 0)
//       throw new Error("Debe enviar al menos una forma de pago");

//     const totalComp = Number(comprobante.total || 0);
//     if (totalComp <= 0) throw new Error("Total del comprobante inválido");

//     // Asegurar que la suma de pagos coincida con el total (si querés permitir parcial, ajustá lógica)
//     const sumaPagos = pagos.reduce((acc, p) => acc + (Number(p.monto) || 0), 0);
//     if (Math.abs(totalComp - sumaPagos) > 0.009) {
//       throw new Error("La suma de las formas de pago no coincide con el total del comprobante");
//     }

//     // (Opcional) Idempotencia: si usás una tabla, validá idempotencyKey acá

//     // const formapagoHeader = comprobante.formapago_id ?? pagos[0]?.formapago_id ?? null;
//     // if (!formapagoHeader) throw new Error("formapago_id requerido en el comprobante");
//     const formapagoHeader =
//       typeof comprobante.formapago_id === "number" ? comprobante.formapago_id : null;

//     let imputacionHeader = comprobante.imputacioncontable_id ?? null;
//     if (!imputacionHeader) {
//       // intentar deducir de pagos
//       for (const p of pagos) {
//         if (p.imputacioncontable_id) { imputacionHeader = p.imputacioncontable_id; break; }
//         if (p.categoriaegreso_id) {
//           const cat = await CategoriaEgreso.findByPk(p.categoriaegreso_id, { transaction: t });
//           if (cat?.imputacioncontable_id) { imputacionHeader = cat.imputacioncontable_id; break; }
//         }
//       }
//     }
//     if (!imputacionHeader) throw new Error("imputacioncontable_id requerido en el comprobante");

//     // 1) Crear comprobante
//     const comp = await ComprobanteEgreso.create(
//       {
//         ...comprobante,
//         empresa_id,
//         estadopago: "impaga",
//         saldo: totalComp,
//       },
//       { transaction: t }
//     );

//     // 2) Aplicar pagos (por ahora implementamos "caja" con atomicidad; los demás medios quedan listos para extender)
//     for (const p of pagos) {
//       const medio = String(p.medio || "").toLowerCase();
//       const monto = Number(p.monto || 0);
//       if (monto <= 0) throw new Error("Monto de pago inválido");

//       const fechaPago = p.fecha || comp.fechapago || comp.fechacomprobante;

//       if (medio === "caja") {
//         // Resolver caja abierta desde contexto del servidor (o de algún service)
//         // Asumimos que un middleware populó req.context.cajaAbierta
//         // const cajaAbierta = req.context?.cajaAbierta;
//         // if (!cajaAbierta?.caja?.id) {
//         //   throw new Error("No hay caja abierta para registrar el egreso de caja");
//         // }
//         // Validación de categoría (si es requerida por tu modelo/negocio)
//         if (!p.categoriaegreso_id) {
//           throw new Error("categoriaegreso_id es requerida para pagos en caja");
//         }

//         let caja_id = p.caja_id ?? null;
//         if (!caja_id) {
//           throw new Error("caja_id faltante en pago de caja");
//         }

//         await MovimientoCajaTesoreria.create(
//           {
//             tipo: "egreso",
//             descripcion: p.detalle || `Pago comp. ${comp.nrocomprobante}`,
//             monto,
//             fecha: fechaPago,
//             caja_id,
//             //caja_id: cajaAbierta.caja.id, // ⚠️ nunca se elige en UI, viene del servidor
//             formapago_id: p.formapago_id || null,
//             referencia_id: comp.id,
//             referencia_tipo: "ComprobanteEgreso",
//             observaciones: null,
//             categoriaegreso_id: p.categoriaegreso_id || null,
//             imputacioncontable_id: p.imputacioncontable_id || imputacionHeader || null,
//           },
//           { transaction: t }
//         );

//         continue;
//       }

//       // === Plantillas para futuros medios (dejar comentado hasta que agregues modelos) ===
//       if (medio === "transferencia") {
//         // Validaciones mínimas
//         if (!p.banco_id) throw new Error("banco_id es requerido para pago por transferencia");

//         await MovimientoBancoTesoreria.create(
//           {
//             tipo: "egreso",
//             descripcion: p.detalle || `Pago comp. ${comp.nrocomprobante} por transferencia`,
//             monto,
//             fecha: fechaPago,
//             banco_id: p.banco_id,
//             empresa_id, // multiempresa
//             formapago_id: p.formapago_id || null,
//             referencia_id: comp.id,
//             referencia_tipo: "ComprobanteEgreso",
//             observaciones: p.observaciones || null
//           },
//           { transaction: t }
//         );

//         continue;
//       }
//       if (medio === "echeq") {
//         // Validaciones mínimas
//         if (!p.banco_id) throw new Error("banco_id es requerido para eCheq");
//         if (!p.fecha_vencimiento) throw new Error("fecha_vencimiento es requerida para eCheq");

//         const fechaEmision = fechaPago; // usamos la misma del pago
//         const fechaVto = p.fecha_vencimiento;

//         // (Opcional, pero recomendable) Validar que vto >= emisión:
//         if (new Date(fechaVto) < new Date(fechaEmision)) {
//           throw new Error("fecha_vencimiento no puede ser anterior a la fecha de emisión del eCheq");
//         }

//         await EcheqEmitido.create(
//           {
//             comprobanteegreso_id: comp.id,
//             proveedor_id: comprobante.proveedor_id || null,
//             empresa_id,

//             numero_echeq: p.numero_echeq || null,   // opcional
//             banco_id: p.banco_id,                   // requerido por el modelo

//             fecha_emision: fechaEmision,
//             fecha_vencimiento: fechaVto,
//             importe: monto,

//             // estado inicial: "emitido" (default del modelo)
//           },
//           { transaction: t }
//         );

//         continue;
//       }

//       // === NUEVO: Pago con TARJETA ===
//       if (medio === "tarjeta") {
//         // Validaciones mínimas (ajustá según tu negocio)
//         if (!p.tipotarjeta_id) throw new Error("tipotarjeta_id es requerido para pago con tarjeta");
//         if (!p.marcatarjeta_id) throw new Error("marcatarjeta_id es requerido para pago con tarjeta");

//         await PagoTarjetaCredito.create(
//           {
//             fecha: fechaPago,
//             importe: monto,

//             comprobanteegreso_id: comp.id,
//             empresa_id,                                   // multiempresa
//             proveedor_id: comprobante.proveedor_id || null, // si corresponde registrar proveedor

//             tipotarjeta_id: p.tipotarjeta_id || null,
//             marcatarjeta_id: p.marcatarjeta_id || null,
//             cupon_numero: p.cupon_numero || null,
//             planpago_id: p.planpago_id || null,

//             concepto: p.detalle || `Pago comp. ${comp.nrocomprobante} con tarjeta`,
//             observaciones: null,

//             // estado inicial: pendiente (por default del modelo)
//           },
//           { transaction: t }
//         );

//         continue;
//       }
//       // if (medio === "ctacte") {
//       //   await MovimientoCtaCteProveedor.create({ ... }, { transaction: t });
//       //   continue;
//       // }

//       // Si llega acá, es un medio no soportado aún
//       throw new Error(`Medio de pago no soportado: ${medio}`);
//     }

//     // 3) Actualizar saldo/estado del comprobante
//     const saldo = Math.max(0, totalComp - sumaPagos);
//     let estado = "impaga";
//     if (saldo === 0) estado = "pagada";
//     else if (saldo < totalComp) estado = "parcial";

//     await comp.update({ saldo, estadopago: estado }, { transaction: t });

//     // 4) Commit
//     await t.commit();
//     return res.status(201).json({ ok: true, comprobante: comp });
//   } catch (error) {
//     await t.rollback();
//     console.error("❌ emitirComprobanteEgreso:", error);
//     return res.status(400).json({ error: error.message || "No se pudo emitir el comprobante" });
//   }
// };

export const emitirComprobanteEgreso = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { empresa_id, idempotencyKey, comprobante, pagos } = req.body;

    if (!empresa_id) throw new Error("empresa_id requerido");
    if (!comprobante || typeof comprobante !== "object") throw new Error("Datos de comprobante inválidos");
    if (!Array.isArray(pagos) || pagos.length === 0) throw new Error("Debe enviar al menos una forma de pago");

    const totalComp = Number(comprobante.total || 0);
    if (totalComp <= 0) throw new Error("Total del comprobante inválido");

    // === NUEVO: sumatorias separadas
    const EPS = 0.009;
    const normaliza = (n) => Number(n) || 0;

    // medio declarado por el front (caja|transferencia|echeq|tarjeta|ctacte)
    const medioDe = (p) => String(p.medio || "").toLowerCase();

    // suma de TODOS los importes enviados (incluye ctacte)
    const sumaTotalImportes = pagos.reduce((acc, p) => acc + normaliza(p.monto), 0);

    // pagos efectivos = los que reducen saldo HOY (excluye ctacte)
    const esEfectivoAhora = (m) => m === "caja" || m === "transferencia" || m === "echeq" || m === "tarjeta";
    const sumaPagosEfectivos = pagos
      .filter((p) => esEfectivoAhora(medioDe(p)))
      .reduce((acc, p) => acc + normaliza(p.monto), 0);

    // Validación: no permitir excedentes
    if (sumaTotalImportes - totalComp > EPS) {
      throw new Error("La suma de importes (incluyendo cuenta corriente) supera el total del comprobante");
    }
    if (sumaPagosEfectivos - totalComp > EPS) {
      throw new Error("La suma de pagos efectivos supera el total del comprobante");
    }

    // Si viene set (único medio), lo respetamos; si hay mix => null
    const formapagoHeader =
      typeof comprobante.formapago_id === "number"
        ? comprobante.formapago_id
        : (pagos.length === 1 ? Number(pagos[0].formapago_id || 0) || null : null);

    // Imputación obligatoria (desde header o derivada)
    let imputacionHeader = comprobante.imputacioncontable_id ?? null;
    if (!imputacionHeader) {
      for (const p of pagos) {
        if (p.imputacioncontable_id) { imputacionHeader = p.imputacioncontable_id; break; }
        if (p.categoriaegreso_id) {
          const cat = await CategoriaEgreso.findByPk(p.categoriaegreso_id, { transaction: t });
          if (cat?.imputacioncontable_id) { imputacionHeader = cat.imputacioncontable_id; break; }
        }
      }
    }
    if (!imputacionHeader) throw new Error("imputacioncontable_id requerido en el comprobante");

    // 1) Comprobante
    const comp = await ComprobanteEgreso.create(
      {
        ...comprobante,
        empresa_id,
        estadopago: "impaga",
        saldo: totalComp,
        formapago_id: formapagoHeader,        // null si hay mix
        imputacioncontable_id: imputacionHeader,
      },
      { transaction: t }
    );

    // 2) Orden de Pago (una por comprobante)
    //    Total de la OP = SOLO pagos efectivos (no incluye ctacte)
    const fechaOrden = comp.fechapago || comp.fechacomprobante || new Date().toISOString().slice(0, 10);
    const orden = await OrdenPago.create(
      {
        empresa_id,
        comprobanteegreso_id: comp.id,
        proveedor_id: comprobante.proveedor_id || null,
        fecha: fechaOrden,
        total: sumaPagosEfectivos,          // <<< solo desembolsos
        estado: "emitida",
        numero: null,
        observaciones: comprobante.observaciones || null,
      },
      { transaction: t }
    );

    // 3) Aplicar pagos (todos referenciados a la orden)
    for (const p of pagos) {
      const medio = medioDe(p);
      const monto = normaliza(p.monto);
      if (monto <= 0) throw new Error("Monto de pago inválido");

      const fechaPago = p.fecha || comp.fechapago || comp.fechacomprobante;

      if (medio === "caja") {
        if (!p.categoriaegreso_id) throw new Error("categoriaegreso_id es requerida para pagos en caja");
        if (!p.caja_id) throw new Error("caja_id faltante en pago de caja");

        await MovimientoCajaTesoreria.create(
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
          },

          { transaction: t }
        );
        continue;
      }

      if (medio === "transferencia") {
        if (!p.banco_id) throw new Error("banco_id es requerido para pago por transferencia");

        await MovimientoBancoTesoreria.create(
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
        continue;
      }

      if (medio === "echeq") {
        if (!p.banco_id) throw new Error("banco_id es requerido para eCheq");
        if (!p.fecha_vencimiento) throw new Error("fecha_vencimiento es requerida para eCheq");
        const fechaEmision = fechaPago;
        const fechaVto = p.fecha_vencimiento;
        if (new Date(fechaVto) < new Date(fechaEmision)) {
          throw new Error("fecha_vencimiento no puede ser anterior a la fecha de emisión del eCheq");
        }

        await EcheqEmitido.create(
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
        continue;
      }

      if (medio === "tarjeta") {
        if (!p.tipotarjeta_id) throw new Error("tipotarjeta_id es requerido para pago con tarjeta");
        if (!p.marcatarjeta_id) throw new Error("marcatarjeta_id es requerido para pago con tarjeta");

        await PagoTarjetaCredito.create(
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
        continue;
      }

      // ✅ Cuenta Corriente: NO descuenta saldo, deja deuda
      if (medio === "ctacte") {
        if (!comprobante.proveedor_id) {
          throw new Error("proveedor_id es requerido para movimiento de cuenta corriente");
        }

        await MovimientoCtaCteProveedor.create(
          {
            proveedor_id: comprobante.proveedor_id,
            empresa_id,
            fecha: fechaPago || comp.fechacomprobante,   // fecha del cargo
            fecha_pago: p.fecha_pago || null,            // opcional (puede ir null)
            descripcion: p.detalle || `Comp. ${comp.nrocomprobante} a cuenta corriente`,
            tipo: "cargo",                                // aumenta deuda
            importe: monto,
            origen_tipo: "ComprobanteEgreso",
            origen_id: comp.id,
            comprobanteegreso_id: comp.id,
            anulado: false,
            ordenpago_id: orden.id,                       // se asocia igual a la orden
          },
          { transaction: t }
        );
        continue;
      }

      throw new Error(`Medio de pago no soportado: ${medio}`);
    }

    // 4) Saldo / estado del comprobante y de la orden (sólo con pagos efectivos)
    const saldo = Math.max(0, totalComp - sumaPagosEfectivos);
    let estadoComp = "impaga";
    if (Math.abs(saldo) <= EPS) {
      // pago total (por redondeo)
      estadoComp = "pagada";
    } else if (sumaPagosEfectivos > EPS) {
      estadoComp = "parcial";
    }

    await comp.update({ saldo, estadopago: estadoComp }, { transaction: t });

    let estadoOrden = "emitida";
    if (estadoComp === "pagada") estadoOrden = "aplicada";
    else if (estadoComp === "parcial") estadoOrden = "parcial";

    await orden.update({ estado: estadoOrden, total: sumaPagosEfectivos }, { transaction: t });

    await t.commit();
    return res.status(201).json({ ok: true, comprobante: comp, ordenpago: orden });
  } catch (error) {
    await t.rollback();
    console.error("❌ emitirComprobanteEgreso:", error);
    return res.status(400).json({ error: error.message || "No se pudo emitir el comprobante" });
  }
};
