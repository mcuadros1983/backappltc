import ComprobanteEgreso from "../../models/iva/comprobanteegreso.js";
import MovimientoCajaTesoreria from "../../models/tesoreria/movimientocajatesoreria.js"
import MovimientoBancoTesoreria from "../../models/tesoreria/movimientobancotesoreria.js";
import EcheqEmitido from "../../models/tesoreria/pagoecheq.js";
import PagoTarjetaCredito from "../../models/tesoreria/pagotarjetacredito.js";
import MovimientoCtaCteProveedor from "../../models/tesoreria/movimientoctacteproveedor.js";
import OrdenPago from "../../models/tesoreria/ordendepago.js";
import { sequelize } from "../../config/database.js"; // <-- importa la instancia

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
  try {
    const item = await ComprobanteEgreso.findByPk(req.params.id);
    if (!item) return res.status(404).json({ error: 'Comprobante de egreso no encontrado' });
    await item.update(req.body);
    res.status(200).json(item);
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar el comprobante de egreso' });
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
