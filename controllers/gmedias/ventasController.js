// ventasController.js

import { Venta } from "../../models/gmedias/ventaModel.js";
import Cliente from "../../models/gmedias/clienteModel.js";
import FormaPago from "../../models/gmedias/formaPagoModel.js";
import Producto from "../../models/gmedias/productoModel.js";
import Ingreso from "../../models/gmedias/ingresoModel.js"; // Agregamos el modelo de Ingreso
import { actualizarDatosProducto } from "./productosController.js";
import CuentaCorriente from "../../models/gmedias/cuentaCorrienteModel.js";
import DetalleCuentaCorriente from "../../models/gmedias/detalleCuentaCorrienteModel.js";
import {
  actualizarCuentaCorrienteIdCliente,
  crearCuentaCorriente,
  obtenerCuentaCorrientePorIdCliente,
} from "./cuentasCorrientesController.js";
import { crearDetalleCuentaCorriente } from "./detallesCuentasCorrientesController.js";

const obtenerVentasPorCliente = async (req, res, next) => {
  const { clienteId } = req.params;

  try {
    const ventas = await Venta.findAll({
      where: { cliente_id: clienteId },
      include: [
        {
          model: Producto,
          as: "productos",
        },
        {
          model: FormaPago,
          as: "formaPago",
          attributes: ["tipo"],
        },
      ],
    });

    res.json(ventas);
  } catch (error) {
    next(error);
  }
};

const obtenerVentas = async (req, res, next) => {
  try {
    const ventas = await Venta.findAll({
      include: [
        {
          model: Cliente,
          attributes: ["id", "nombre"], // Puedes seleccionar solo los atributos que necesitas
        },
        {
          model: FormaPago,
          attributes: ["tipo"],
        },
        {
          model: Producto,
          as: "productos", // Asegúrate de que el alias coincida con el utilizado en el frontend
          attributes: [
            "id",
            "codigo_de_barra",
            "num_media",
            "precio",
            "kg",
            "tropa",
            "sucursal_id",
          ],
        },
      ],
    });

    res.json(ventas);
  } catch (error) {
    next(error);
  }
};

const obtenerVentaPorId = async (req, res, next) => {
  const ventaId = req.params.ventaId;

  try {
    const venta = await Venta.findByPk(ventaId, {
      include: [
        Cliente,
        FormaPago,
        {
          model: Producto,
          as: "productos", // Especifica el alias definido en el modelo
        },
      ],
    });

    if (!venta) {
      return res.status(404).json({
        message: "Venta no encontrada",
      });
    }

    res.json(venta);
  } catch (error) {
    next(error);
  }
};

const crearVenta = async (req, res, next) => {
  const {
    cantidad_total,
    peso_total,
    cliente_id,
    formaPago_id,
    productos,
    fecha,
  } = req.body;
  try {
    // Calcular el monto total de la venta (suma de productos: peso por precio)
    const montoTotal = productos.reduce((total, producto) => {
      return total + producto.kg * producto.precio;
    }, 0);

    // Manejo de cuenta corriente si la forma de pago es "cuenta corriente"
    if (formaPago_id == 2) {
      let cuentaCorriente = await obtenerCuentaCorrientePorIdCliente(
        cliente_id
      );

      if (!cuentaCorriente) {
        cuentaCorriente = await crearCuentaCorriente(cliente_id, montoTotal);
      } else {
        await actualizarCuentaCorrienteIdCliente(cliente_id, montoTotal);
      }

      await crearDetalleCuentaCorriente(cuentaCorriente.id, montoTotal);
    }

    // Crear la venta normal
    const nuevaVenta = await Venta.create({
      cantidad_total,
      peso_total,
      monto_total: montoTotal,
      cliente_id,
      formaPago_id,
      fecha,
    });

    // Actualizar datos de productos y manejar el peso_total del ingreso
    const productosActualizados = await Promise.all(
      productos.map(async (product) => {
        const tropa = product.tropa || 0;

        // Buscar el producto en la base de datos
        const producto = await Producto.findByPk(product.id);
        if (producto && producto.ingreso_id !== null) {
          // Buscar el ingreso asociado al producto
          const ingreso = await Ingreso.findByPk(producto.ingreso_id);
          if (ingreso) {
            // Convertir peso_total a número (manejar NaN con un valor predeterminado de 0)
            let pesoTotalActual = parseFloat(ingreso.peso_total) || 0;
            const kgAnterior = parseFloat(producto.kg) || 0;
            const kgNuevo = parseFloat(product.kg) || 0;

            // Restar el peso anterior y sumar el nuevo peso
            pesoTotalActual -= Number(kgAnterior);
            pesoTotalActual += Number(kgNuevo);

            // Actualizar el peso_total en el ingreso
            ingreso.peso_total = pesoTotalActual.toString();

            // Guardar los cambios en el ingreso
            await ingreso.save();
          }
        }

        // Actualizar los datos del producto con la nueva venta
        return await actualizarDatosProducto(
          product.id,
          null, // No hay orden_id para ventas
          null, // No se cambia sucursal_id
          cliente_id,
          nuevaVenta.id, // Asociar el producto con la venta
          product.precio,
          product.kg,
          tropa,
          fecha
        );
      })
    );

    res.json({ nuevaVenta, productosActualizados });
  } catch (error) {
    next(error);
  }
};

const obtenerProductosVenta = async (req, res, next) => {
  const { id } = req.params;
  try {
    const productos = await Producto.findAll({
      where: { venta_id: id },
    });

    res.json(productos);
  } catch (error) {
    next(error);
  }
};

const actualizarVenta = async (req, res, next) => {
  const ventaId = req.params.ventaId;
  const { clienteId, formaPagoId /*, productos (no se usa aquí)*/ } = req.body;

  // console.log("Datos recibidos:", { clienteId, formaPagoId });

  try {
    const venta = await Venta.findByPk(ventaId);
    if (!venta) {
      return res.status(404).json({ message: "Venta no encontrada" });
    }

    // Guardar valores previos
    const totalAnterior = Number(venta.monto_total || 0);
    const formaPagoAnterior = venta.formaPago_id;

    // 1) Recalcular SIEMPRE el total desde los productos actuales en DB
    const productosDeVenta = await Producto.findAll({ where: { venta_id: ventaId } });

    const nuevoTotal = productosDeVenta.reduce((acc, p) => {
      const precio = Number(p?.precio ?? 0);
      const kg = Number(p?.kg ?? 0);
      if (!Number.isFinite(precio) || !Number.isFinite(kg)) return acc;
      return acc + precio * kg;
    }, 0);

    // Normalizar
    venta.monto_total = Number(nuevoTotal) || 0;

    // 2) Si cambia el CLIENTE
    if (clienteId && clienteId !== venta.cliente_id) {
      // Actualizar cliente_id en productos de la venta
      await Producto.update(
        { cliente_id: clienteId },
        { where: { venta_id: ventaId } }
      );

      // Si la forma de pago ANTERIOR era 2 (cta cte), mover saldo del cliente anterior al nuevo
      if (formaPagoAnterior === 2) {
        const montoVentaNum = Number(venta.monto_total) || 0;
        await actualizarCuentaCorrienteIdClienteNuevo(clienteId, montoVentaNum);
        await actualizarCuentaCorrienteIdClienteAnterior(venta.cliente_id, montoVentaNum);
      }

      // Actualizar cliente en venta
      venta.cliente_id = clienteId;
    }

    // 3) Si cambia la FORMA DE PAGO
    if (formaPagoId && formaPagoId !== formaPagoAnterior) {
      const nuevoTotalNum = Number(venta.monto_total) || 0;

      if (formaPagoId == 2 && formaPagoAnterior != 2) {
        // otra → 2 : sumar el NUEVO total
        await actualizarCuentaCorrienteIdClienteNuevo(venta.cliente_id, nuevoTotalNum);
      } else if (formaPagoAnterior == 2 && formaPagoId != 2) {
        // 2 → otra : restar el TOTAL ANTERIOR (lo asentado hasta ahora)
        const totalAnteriorNum = Number(totalAnterior) || 0;
        await actualizarCuentaCorrienteIdClienteAnterior(venta.cliente_id, totalAnteriorNum);
      }

      // Actualizar forma de pago en venta
      venta.formaPago_id = formaPagoId;
    }

    // 4) Si NO cambió la forma de pago y ya era 2, aplicar DELTA (nuevo - anterior)
    if ((formaPagoId === undefined || formaPagoId === formaPagoAnterior) && formaPagoAnterior == 2) {
      const delta = Number(venta.monto_total || 0) - Number(totalAnterior || 0);
      if (delta !== 0) {
        const deltaNum = Number(delta) || 0;

        const cuentaCorriente = await CuentaCorriente.findOne({
          where: { cliente_id: venta.cliente_id },
        });

        if (cuentaCorriente) {
          let detalle = await DetalleCuentaCorriente.findOne({
            where: { cuentaCorriente_id: cuentaCorriente.id },
          });

          if (!detalle) {
            // si no hay detalle, creamos uno con el delta
            await DetalleCuentaCorriente.create({
              cuentaCorriente_id: cuentaCorriente.id,
              monto: deltaNum,
            });
          } else {
            detalle.monto = Number(detalle.monto || 0) + deltaNum;
            await detalle.save();
          }

          cuentaCorriente.saldoActual = Number(cuentaCorriente.saldoActual || 0) + deltaNum;
          await cuentaCorriente.save();
        } else if (deltaNum > 0) {
          // no existe la cta cte y delta es positivo: crearla
          const nueva = await crearCuentaCorriente(venta.cliente_id, 0);
          await crearDetalleCuentaCorriente(nueva.id, deltaNum);
          nueva.saldoActual = Number(nueva.saldoActual || 0) + deltaNum;
          await nueva.save();
        }
        // si deltaNum < 0 y no existe cuenta, no creamos una negativa
      }
    }

    // 5) Guardar venta
    await venta.save();

    return res.json({ message: "Venta actualizada correctamente" });
  } catch (error) {
    console.error("Error en actualizarVenta:", error);
    return next(error);
  }
};

/**
 * Suma `montoVenta` a la cuenta corriente del cliente (crear si no existe).
 * También impacta el detalle.
 */
const actualizarCuentaCorrienteIdClienteNuevo = async (cliente_id, montoVenta) => {
  const monto = Number(montoVenta) || 0;

  const cuentaCorriente = await CuentaCorriente.findOne({ where: { cliente_id } });

  if (!cuentaCorriente) {
    const nuevaCuentaCorriente = await crearCuentaCorriente(cliente_id, monto);
    await crearDetalleCuentaCorriente(nuevaCuentaCorriente.id, monto);
    // asegurar saldoActual numérico
    nuevaCuentaCorriente.saldoActual = Number(nuevaCuentaCorriente.saldoActual || 0);
    await nuevaCuentaCorriente.save();
    return;
  }

  // Detalle
  let detalle = await DetalleCuentaCorriente.findOne({
    where: { cuentaCorriente_id: cuentaCorriente.id },
  });

  if (!detalle) {
    await crearDetalleCuentaCorriente(cuentaCorriente.id, monto);
  } else {
    detalle.monto = Number(detalle.monto || 0) + monto;
    await detalle.save();
  }

  cuentaCorriente.saldoActual = Number(cuentaCorriente.saldoActual || 0) + monto;
  await cuentaCorriente.save();
};

/**
 * Resta `montoVenta` de la cuenta corriente del cliente (si existe).
 * También impacta el detalle.
 */
const actualizarCuentaCorrienteIdClienteAnterior = async (cliente_id, montoVenta) => {
  const monto = Number(montoVenta) || 0;

  const cuentaCorriente = await CuentaCorriente.findOne({ where: { cliente_id } });
  if (!cuentaCorriente) {
    // No hay cuenta; nada que restar
    return;
  }

  let detalle = await DetalleCuentaCorriente.findOne({
    where: { cuentaCorriente_id: cuentaCorriente.id },
  });

  if (!detalle) {
    // Si no hay detalle, crear con valor negativo
    await crearDetalleCuentaCorriente(cuentaCorriente.id, -monto);
  } else {
    detalle.monto = Number(detalle.monto || 0) - monto;
    await detalle.save();
  }

  cuentaCorriente.saldoActual = Number(cuentaCorriente.saldoActual || 0) - monto;
  await cuentaCorriente.save();
};

const eliminarVenta = async (req, res, next) => {
  const { ventaId } = req.params;

  try {
    const venta = await Venta.findByPk(ventaId);

    if (!venta) {
      return res.status(404).json({
        message: "Venta no encontrada",
      });
    }

    // Obtener todos los productos asociados a la venta
    const productosAsociados = await Producto.findAll({
      where: { venta_id: venta.id }, // Ajusta según tu lógica de asociación
    });

    // Actualizar saldo cuenta corriente
    const cliente = await Cliente.findByPk(venta.cliente_id, {
      include: [
        { model: Venta, as: "ventas" },
        { model: CuentaCorriente, as: "cuentaCorriente" },
      ],
    });

    if (venta.formaPago_id == 2) {
      // Obtener la cuenta corriente asociada a la venta
      const cuentaCorriente = await CuentaCorriente.findOne({
        where: { cliente_id: venta.cliente_id },
      });

      if (!cuentaCorriente) {
        return res
          .status(404)
          .json({ mensaje: "Cuenta corriente no encontrada" });
      }
      // Obtener el detalle de la cuenta corriente asociado a la venta
      const detalleCuentaCorriente = await DetalleCuentaCorriente.findOne({
        where: { cuentaCorriente_id: cuentaCorriente.id },
      });

      if (!detalleCuentaCorriente) {
        return res
          .status(404)
          .json({ mensaje: "Detalle de cuenta corriente no encontrado" });
      }
      // Descontar el peso viejo del producto y monto de la venta
      cuentaCorriente.saldoActual =
        cuentaCorriente.saldoActual - venta.monto_total;
      detalleCuentaCorriente.monto =
        detalleCuentaCorriente.monto - venta.monto_total;

      await cuentaCorriente.save();
      await detalleCuentaCorriente.save();
    }

    await venta.destroy();

    // Para cada producto asociado a la venta:
    // - Si es PORCINO => lo eliminamos directamente
    // - Si es BOVINO  => volvemos a stock (misma lógica de siempre)
    const tareas = productosAsociados.map(async (producto) => {
      if (producto.categoria_producto === "porcino") {
        // Eliminar definitivamente el producto porcino generado para la venta
        await Producto.destroy({ where: { id: producto.id } });
        return;
      }

      // Lógica BOVINO (se conserva): volver a stock/ajustar datos
      await actualizarDatosProducto(
        producto.id,                      // producto_id
        null,                             // orden_id
        producto.ingreso_id === null ? 32 : 18, // sucursal_id (32 si no tiene ingreso, 18 si sí)
        null,                             // cliente_id
        null,                             // venta_id (quitamos vínculo a la venta)
        0,                                // precio (lo dejamos en 0)
        producto.kg ? producto.kg : 0,    // kg
        producto.tropa ? producto.tropa : null, // tropa
        producto.fecha                    // fecha (preservamos)
      );
    });

    await Promise.all(tareas);
    res.sendStatus(204);
  } catch (error) {
    next(error);
  }
};


// const eliminarVenta = async (req, res, next) => {
//   const { ventaId } = req.params;

//   try {
//     const venta = await Venta.findByPk(ventaId);

//     if (!venta) {
//       return res.status(404).json({
//         message: "Venta no encontrada",
//       });
//     }

//     // Obtener todos los productos asociados a la venta
//     const productosAsociados = await Producto.findAll({
//       where: { venta_id: venta.id }, // Ajusta según tu lógica de asociación
//     });

//     // Actualizar saldo cuenta corriente
//     const cliente = await Cliente.findByPk(venta.cliente_id, {
//       include: [
//         { model: Venta, as: "ventas" },
//         { model: CuentaCorriente, as: "cuentaCorriente" },
//       ],
//     });

//     if (venta.formaPago_id == 2) {
//       // Obtener la cuenta corriente asociada a la venta
//       const cuentaCorriente = await CuentaCorriente.findOne({
//         where: { cliente_id: venta.cliente_id },
//       });

//       if (!cuentaCorriente) {
//         return res
//           .status(404)
//           .json({ mensaje: "Cuenta corriente no encontrada" });
//       }
//       // Obtener el detalle de la cuenta corriente asociado a la venta
//       const detalleCuentaCorriente = await DetalleCuentaCorriente.findOne({
//         where: { cuentaCorriente_id: cuentaCorriente.id },
//       });

//       if (!detalleCuentaCorriente) {
//         return res
//           .status(404)
//           .json({ mensaje: "Detalle de cuenta corriente no encontrado" });
//       }
//       // Descontar el peso viejo del producto y monto de la venta
//       cuentaCorriente.saldoActual =
//         cuentaCorriente.saldoActual - venta.monto_total;
//       detalleCuentaCorriente.monto =
//         detalleCuentaCorriente.monto - venta.monto_total;

//       await cuentaCorriente.save();
//       await detalleCuentaCorriente.save();
//     }

//     await venta.destroy();

//     // Actualizar la propiedad sucursal_id en cada producto asociado
//     const actualizarProductos = productosAsociados.map(async (producto) => {
//       if (
//         producto.ingreso_id !== null &&
//         producto.categoria_producto == "porcino"
//       ) {
//         const ingreso = await Ingreso.findByPk(producto.ingreso_id);
//         // Actualizar el producto con los nuevos valores
//         await actualizarDatosProducto(
//           producto.id,
//           null,
//           producto.ingreso_id === null ? 32 : 18,
//           null,
//           null,
//           producto.precio ? producto.precio : 0,
//           producto.kg ? producto.kg : 0,
//           producto.tropa ? producto.tropa : null,
//           producto.fecha
//         );
//       } else {
//         // Si la categoría del producto no es porcino, simplemente actualiza el producto sin modificar el ingreso
//         await actualizarDatosProducto(
//           producto.id, // o el valor correspondiente para producto_id
//           null, // o el valor correspondiente para orden_id
//           producto.ingreso_id === null ? 32 : 18, // Cambiar a 32 si ingreso_id es null
//           // 18, // o el valor correspondiente para sucursal_id
//           null, // o el valor correspondiente para cliente_id
//           null, // o el valor correspondiente para venta_id
//           (producto.precio = 0), // o el valor correspondiente para precio
//           producto.kg ? producto.kg : 0,
//           producto.tropa ? producto.tropa : null,
//           producto.fecha

//           // producto_id,
//           // orden_id,
//           // sucursal_id,
//           // cliente_id,
//           // venta_id,
//           // precio,
//           // kg,
//           // tropa
//         );
//       }
//     });

//     // Esperar a que todas las actualizaciones se completen antes de responder
//     await Promise.all(actualizarProductos);

//     res.sendStatus(204);
//   } catch (error) {
//     next(error);
//   }
// };

// const actualizarProductoEnVenta = async (req, res, next) => {
//   const ventaId = req.params.ventaId;
//   const { productoId, nuevoProducto } = req.body;

//   try {
//     const venta = await Venta.findByPk(ventaId);
//     if (!venta) return res.status(404).json({ mensaje: "Venta no encontrada" });

//     const producto = await Producto.findOne({
//       where: { id: productoId, venta_id: ventaId }
//     });
//     if (!producto) return res.status(404).json({ mensaje: "Producto no encontrado en la venta" });

//     const ingreso = await Ingreso.findByPk(producto.ingreso_id);
//     if (!ingreso) return res.status(404).json({ mensaje: "Ingreso no encontrado" });

//     // Asegurarse de que las operaciones sean con números
//     ingreso.peso_total = Number(ingreso.peso_total) - Number(producto.kg);
//     venta.monto_total = Number(venta.monto_total) - Number(producto.precio) * Number(producto.kg);

//     if (venta.formaPago_id === 2) {
//       const cuentaCorriente = await CuentaCorriente.findOne({ where: { cliente_id: venta.cliente_id } });
//       if (!cuentaCorriente) return res.status(404).json({ mensaje: "Cuenta corriente no encontrada" });

//       const detalleCuentaCorriente = await DetalleCuentaCorriente.findOne({ where: { cuentaCorriente_id: cuentaCorriente.id } });
//       if (!detalleCuentaCorriente) return res.status(404).json({ mensaje: "Detalle de cuenta corriente no encontrado" });

//       // Actualizar cuenta corriente y detalle
//       cuentaCorriente.saldoActual = Number(cuentaCorriente.saldoActual) - Number(producto.precio) * Number(producto.kg);
//       detalleCuentaCorriente.monto = Number(detalleCuentaCorriente.monto) - Number(producto.precio) * Number(producto.kg);

//       cuentaCorriente.saldoActual += Number(nuevoProducto.precio) * Number(nuevoProducto.kg);
//       detalleCuentaCorriente.monto += Number(nuevoProducto.precio) * Number(nuevoProducto.kg);

//       await cuentaCorriente.save();
//       await detalleCuentaCorriente.save();
//     }

//     // Actualizar producto
//     producto.precio = Number(nuevoProducto.precio);
//     producto.kg = Number(nuevoProducto.kg);
//     producto.tropa = nuevoProducto.tropa;

//     // Ajustar valores nuevos del ingreso y venta
//     ingreso.peso_total += Number(nuevoProducto.kg);
//     venta.peso_total += Number(nuevoProducto.kg);
//     venta.monto_total += Number(nuevoProducto.precio) * Number(nuevoProducto.kg);

//     // Guardar cambios
//     await producto.save();
//     await ingreso.save();
//     await venta.save();

//     res.json({ producto, ingreso, venta });
//   } catch (error) {
//     console.error("Error en actualizarProductoEnVenta:", error);
//     res.status(500).json({ mensaje: "Error interno del servidor", error: error.message });
//   }
// };

const actualizarProductoEnVenta = async (req, res, next) => {
  const ventaId = req.params.ventaId;
  const { productoId, nuevoProducto } = req.body;

  try {
    const venta = await Venta.findByPk(ventaId);
    if (!venta) {
      console.log("Venta no encontrada");
      return res.status(404).json({ mensaje: "Venta no encontrada" });
    }
    console.log("Venta encontrada:", venta);

    const producto = await Producto.findOne({
      where: { id: productoId, venta_id: ventaId },
    });
    if (!producto) {
      console.log("Producto no encontrado en la venta");
      return res
        .status(404)
        .json({ mensaje: "Producto no encontrado en la venta" });
    }
    console.log("Producto encontrado:", producto);

    let ingreso = null;

    // Verificar si el producto tiene asociado un ingreso
    if (producto.ingreso_id) {
      ingreso = await Ingreso.findByPk(producto.ingreso_id);
      if (!ingreso) {
        console.log(
          "Ingreso no encontrado para el producto con ingreso_id:",
          producto.ingreso_id
        );
        return res.status(404).json({ mensaje: "Ingreso no encontrado" });
      }
      console.log("Ingreso encontrado:", ingreso);

      // Ajustar valores del ingreso
      ingreso.peso_total = Number(ingreso.peso_total) - Number(producto.kg);
    } else {
      console.log(
        "El producto no tiene un ingreso asociado. Saltando ajustes en ingreso."
      );
    }

    // Ajustar valores de la venta
    venta.monto_total =
      Number(venta.monto_total) - Number(producto.precio) * Number(producto.kg);

    if (venta.formaPago_id === 2) {
      console.log("Venta con forma de pago en cuenta corriente");
      const cuentaCorriente = await CuentaCorriente.findOne({
        where: { cliente_id: venta.cliente_id },
      });
      if (!cuentaCorriente) {
        console.log("Cuenta corriente no encontrada");
        return res
          .status(404)
          .json({ mensaje: "Cuenta corriente no encontrada" });
      }
      console.log("Cuenta corriente encontrada:", cuentaCorriente);

      const detalleCuentaCorriente = await DetalleCuentaCorriente.findOne({
        where: { cuentaCorriente_id: cuentaCorriente.id },
      });
      if (!detalleCuentaCorriente) {
        console.log("Detalle de cuenta corriente no encontrado");
        return res
          .status(404)
          .json({ mensaje: "Detalle de cuenta corriente no encontrado" });
      }
      console.log(
        "Detalle cuenta corriente encontrado:",
        detalleCuentaCorriente
      );

      // Actualizar cuenta corriente y detalle
      cuentaCorriente.saldoActual =
        Number(cuentaCorriente.saldoActual) -
        Number(producto.precio) * Number(producto.kg);
      detalleCuentaCorriente.monto =
        Number(detalleCuentaCorriente.monto) -
        Number(producto.precio) * Number(producto.kg);

      cuentaCorriente.saldoActual +=
        Number(nuevoProducto.precio) * Number(nuevoProducto.kg);
      detalleCuentaCorriente.monto +=
        Number(nuevoProducto.precio) * Number(nuevoProducto.kg);

      console.log(
        "Cuenta corriente y detalle ajustados tras nuevo producto:",
        cuentaCorriente,
        detalleCuentaCorriente
      );

      await cuentaCorriente.save();
      await detalleCuentaCorriente.save();
    }

    // Actualizar producto
    producto.precio = Number(nuevoProducto.precio);
    producto.kg = Number(nuevoProducto.kg);
    producto.tropa = nuevoProducto.tropa;
    console.log("Producto actualizado con nuevos valores:", producto);

    // Ajustar valores nuevos de la venta
    venta.peso_total += Number(nuevoProducto.kg);
    venta.monto_total +=
      Number(nuevoProducto.precio) * Number(nuevoProducto.kg);

    console.log("Venta ajustada tras nuevo producto:", venta);

    // Guardar cambios
    await producto.save();
    if (ingreso) {
      ingreso.peso_total += Number(nuevoProducto.kg);
      await ingreso.save();
      console.log("Ingreso actualizado:", ingreso);
    }
    await venta.save();

    res.json({ producto, ingreso, venta });
  } catch (error) {
    console.error("Error en actualizarProductoEnVenta:", error);
    res
      .status(500)
      .json({ mensaje: "Error interno del servidor", error: error.message });
  }
};

const eliminarProductoVenta = async (req, res, next) => {
  try {
    const { productId } = req.body;

    // Buscar el producto por su ID
    const producto = await Producto.findByPk(productId);
    // Verificar si la orden existe
    if (!producto) {
      return res.status(404).json({ message: "el producto no existe" });
    }
    // Buscar la venta por su ID
    const venta = await Venta.findByPk(producto.venta_id);
    // Verificar si la venta existe
    if (!venta) {
      return res.status(404).json({ message: "La venta no existe" });
    }
    venta.peso_total = venta.peso_total - producto.kg;
    venta.cantidad_total = venta.cantidad_total - 1;
    venta.monto_total = venta.monto_total - producto.kg * producto.precio;

    if (venta.formaPago_id == 2) {
      // Obtener la cuenta corriente asociada a la venta
      const cuentaCorriente = await CuentaCorriente.findOne({
        where: { cliente_id: venta.cliente_id },
      });

      if (!cuentaCorriente) {
        return res
          .status(404)
          .json({ mensaje: "Cuenta corriente no encontrada" });
      }
      // Obtener el detalle de la cuenta corriente asociado a la venta
      const detalleCuentaCorriente = await DetalleCuentaCorriente.findOne({
        where: { cuentaCorriente_id: cuentaCorriente.id },
      });

      if (!detalleCuentaCorriente) {
        return res
          .status(404)
          .json({ mensaje: "Detalle de cuenta corriente no encontrado" });
      }
      // Descontar el peso viejo del producto y monto de la venta
      cuentaCorriente.saldoActual =
        cuentaCorriente.saldoActual - producto.precio * producto.kg;
      detalleCuentaCorriente.monto =
        detalleCuentaCorriente.monto - producto.precio * producto.kg;

      await cuentaCorriente.save();
      await detalleCuentaCorriente.save();
    }

    if (venta.cantidad_total == 0) {
      await venta.destroy();
    } else {
      await venta.save();
    }

    // Si el producto es porcino, lo eliminamos directamente
    if (producto.categoria_producto === "porcino") {
      await producto.destroy();
      return res.json({ message: "Producto porcino eliminado correctamente" });
    }


    // if (producto.categoria_producto == "porcino") {
    //   producto.kg = 0;
    // }
    producto.venta_id = null;
    producto.cliente_id = null;
    // console.log("sucursal_id-------, producto")
    producto.sucursal_id = producto.ingreso_id ? 18 : 32;
    await producto.save();

    res.json(venta);
  } catch (error) {
    next(error);
  }
};

const fetchSaleCreatedAt = async (req, res) => {
  const { ventaId } = req.params;

  try {
    // Buscar la venta en la base de datos por el ID de la sucursal
    const venta = await Venta.findOne({ id: ventaId });

    if (!venta) {
      // Manejar el caso si la venta no se encuentra
      return null;
    }

    // Devolver la fecha de creación de la venta
    res.json(venta.fecha);
  } catch (error) {
    console.error("Error al obtener la fecha de creación de la venta:", error);
    throw error;
  }
};

const crearVentaCerdo = async (req, res, next) => {
  const {
    cantidad_total,
    peso_total,
    cliente_id,
    formaPago_id,
    productos,
    fecha,
  } = req.body;

  try {
    // 1. Calcular monto total = sumatoria de (kg * precio)
    //    Recordá que en cerdo precio puede arrancar en 0 y luego lo actualizás.
    const montoTotal = productos.reduce((total, p) => {
      return total + Number(p.kg || 0) * Number(p.precio || 0);
    }, 0);

    // 2. Cuenta corriente si formaPago_id === 2 (idéntico a tu flujo actual)
    if (formaPago_id == 2) {
      let cuentaCorriente = await obtenerCuentaCorrientePorIdCliente(
        cliente_id
      );

      if (!cuentaCorriente) {
        cuentaCorriente = await crearCuentaCorriente(
          cliente_id,
          montoTotal
        );
      } else {
        await actualizarCuentaCorrienteIdCliente(
          cliente_id,
          montoTotal
        );
      }

      await crearDetalleCuentaCorriente(
        cuentaCorriente.id,
        montoTotal
      );
    }

    // 3. Crear la venta
    const nuevaVenta = await Venta.create({
      cantidad_total,
      peso_total,
      monto_total: montoTotal,
      cliente_id,
      formaPago_id,
      fecha,
    });

    // 4. Crear cada producto porcino en la BD
    const productosCreados = await Promise.all(
      productos.map(async (p, idx) => {
        // Generar un codigo_de_barra único sintético para esquivar la UNIQUE constraint
        // IMPORTANTE: num_media se guarda tal cual, porque eso es lo que vos querés ver
        const uniqueCodigoBarra = `${p.num_media || "CERDO"}-${Date.now()}-${idx}`;

        const nuevoProducto = await Producto.create({
          categoria_producto: "porcino",
          subcategoria: "cerdo",

          // num_media real del frontend (ej: "2")
          num_media: p.num_media || "",

          // codigo_de_barra único artificial (para no chocar con UNIQUE)
          codigo_de_barra: uniqueCodigoBarra,

          garron: p.garron || null,

          // precio inicial (capaz luego lo ajustás con "Asignar precio Cerdo")
          precio: p.precio || 0,

          // para cerdo costo va 0 fijo
          costo: 0,

          kg: p.kg || 0,
          tropa: p.tropa || "",

          // en ventas de cerdo este producto ya "salió", así que no está en stock
          // podés dejarlo null o 32 según tu convención de 'ya no está en stock'
          sucursal_id: null,

          fecha: fecha,

          // asociarlo a la venta nueva
          orden_id: null,
          venta_id: nuevaVenta.id,
          cliente_id: cliente_id,

          // cerdo cargado manualmente no viene de ingreso
          ingreso_id: null,
        });

        return nuevoProducto;
      })
    );

    res.json({ nuevaVenta, productosCreados });
  } catch (error) {
    next(error);
  }
};



export {
  obtenerVentasPorCliente,
  obtenerVentas,
  obtenerVentaPorId,
  crearVenta,
  obtenerProductosVenta,
  actualizarVenta,
  eliminarVenta,
  actualizarProductoEnVenta,
  eliminarProductoVenta,
  fetchSaleCreatedAt,
  crearVentaCerdo
};
