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
          attributes: ["id","nombre"], // Puedes seleccionar solo los atributos que necesitas
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

// const crearVenta = async (req, res, next) => {
//   const { cantidad_total, peso_total, cliente_id, formaPago_id, productos } =
//     req.body;
//   try {
//     let nuevaVenta;
//     let productosActualizados;

//     // Calcular el monto total de la venta (suma de productos: peso por precio)
//     const montoTotal = productos.reduce((total, producto) => {
//       return total + producto.kg * producto.precio;
//     }, 0);


//     if (formaPago_id == 2) {

//       let cuentaCorriente = await obtenerCuentaCorrientePorIdCliente(
//         cliente_id
//       );
//       // console.log("recepcion", cuentaCorriente);

//       if (!cuentaCorriente) {
//         cuentaCorriente = await crearCuentaCorriente(cliente_id, montoTotal);
//       } else {
//         // Actualizar el saldo en la cuenta corriente

//         await actualizarCuentaCorrienteIdCliente(cliente_id, montoTotal);
//       }

//       // Crear el detalle de la cuenta corriente

//       await crearDetalleCuentaCorriente(cuentaCorriente.id, montoTotal);
//     }

//     // Crear la venta normal
  
//     nuevaVenta = await Venta.create({
//       cantidad_total,
//       peso_total,
//       monto_total: montoTotal,
//       cliente_id,
//       formaPago_id,
//     });

//     // Actualizar datos de productos
//     productosActualizados = await Promise.all(
//       productos.map(async (product) => {
//         // Buscar el producto para obtener el ingreso_id
//         const producto = await Producto.findByPk(product.id);
//         // Actualizar el campo peso_total del ingreso asociado al producto
//         if (producto && producto.ingreso_id !== null) {
//           const ingreso = await Ingreso.findByPk(producto.ingreso_id);
//           if (ingreso) {
//             ingreso.peso_total = ingreso.peso_total - producto.kg + product.kg; // Restar el peso del producto anterior
//             //ingreso.peso_total = ingreso.peso_total + product.kg; // Sumar el peso del nuevo producto
//             await ingreso.save();
//           }
//         }

//         return await actualizarDatosProducto(
//           product.id,
//           null, // o el valor correspondiente para orden_id
//           null, // o el valor correspondiente para sucursal_id
//           cliente_id,
//           nuevaVenta.id,
//           product.precio,
//           product.kg,
//           product.tropa
//         );
//       })
//     );


//     res.json({ nuevaVenta, productosActualizados });
//   } catch (error) {
//     next(error);
//   }
// };

const crearVenta = async (req, res, next) => {
  const { cantidad_total, peso_total, cliente_id, formaPago_id, productos, fecha } = req.body;
  try {
    // Calcular el monto total de la venta (suma de productos: peso por precio)
    const montoTotal = productos.reduce((total, producto) => {
      return total + producto.kg * producto.precio;
    }, 0);

    // Manejo de cuenta corriente si la forma de pago es "cuenta corriente"
    if (formaPago_id == 2) {
      let cuentaCorriente = await obtenerCuentaCorrientePorIdCliente(cliente_id);

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
      fecha
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
          tropa
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
  const { clienteId, formaPagoId, productos } = req.body;

  console.log("Datos recibidos:", { clienteId, formaPagoId, productos });

  try {
    if (!clienteId && !formaPagoId) {
      return res.status(400).json({
        message: "Se requieren clienteId o formaPagoId para actualizar la venta",
      });
    }

    const venta = await Venta.findByPk(ventaId);
    if (!venta) {
      return res.status(404).json({ message: "Venta no encontrada" });
    }

    // Validar clienteId antes de actualizar
    if (clienteId && clienteId !== venta.cliente_id) {
      console.log("Actualizando cliente en productos...");

      try {
        // Actualizar cliente_id en los productos de la venta
        const productosActualizados = await Producto.update(
          { cliente_id: clienteId },
          { where: { venta_id: ventaId } }
        );

        console.log("Productos actualizados:", productosActualizados);

        // Actualizar cuenta corriente del cliente
        if (venta.formaPago_id === 2) {
          await actualizarCuentaCorrienteIdClienteNuevo(
            clienteId,
            venta.monto_total
          );
          await actualizarCuentaCorrienteIdClienteAnterior(
            venta.cliente_id,
            venta.monto_total
          );
        }

        // Actualizar el cliente en la venta
        venta.cliente_id = clienteId;
      } catch (error) {
        console.error("Error en Producto.update:", error);
        return res.status(500).json({
          message: "Error al actualizar los productos de la venta",
          error: error.message,
        });
      }
    }

    // Actualizar forma de pago y cuenta corriente
    if (formaPagoId && formaPagoId !== venta.formaPago_id) {
      console.log("Actualizando forma de pago...");
      if (formaPagoId == 2) {
        // Nueva forma de pago es cuenta corriente, sumar al saldo
        await actualizarCuentaCorrienteIdClienteNuevo(
          venta.cliente_id,
          venta.monto_total
        );
      } else if (venta.formaPago_id == 2) {
        // Forma de pago anterior era cuenta corriente, restar del saldo
        await actualizarCuentaCorrienteIdClienteAnterior(
          venta.cliente_id,
          venta.monto_total
        );
      }

      // Actualizar el campo formaPago_id
      venta.formaPago_id = formaPagoId;
    }

    await venta.save();

    res.json({ message: "Venta actualizada correctamente" });
  } catch (error) {
    console.error("Error en actualizarVenta:", error);
    next(error);
  }
};

// Función auxiliar para actualizar la cuenta corriente del nuevo cliente
const actualizarCuentaCorrienteIdClienteNuevo = async (cliente_id, montoVenta) => {
  try {
    const cuentaCorriente = await CuentaCorriente.findOne({
      where: { cliente_id },
    });

    if (!cuentaCorriente) {
      console.log("Creando nueva cuenta corriente para el cliente...");
      const nuevaCuentaCorriente = await crearCuentaCorriente(cliente_id, montoVenta);
      await crearDetalleCuentaCorriente(nuevaCuentaCorriente.id, montoVenta);
    } else {
      console.log("Actualizando cuenta corriente del cliente...");
      const detalleCuentaCorriente = await DetalleCuentaCorriente.findOne({
        where: { cuentaCorriente_id: cuentaCorriente.id },
      });
      detalleCuentaCorriente.monto += montoVenta;
      cuentaCorriente.saldoActual += montoVenta;

      await detalleCuentaCorriente.save();
      await cuentaCorriente.save();
    }
  } catch (error) {
    console.error("Error en actualizarCuentaCorrienteIdClienteNuevo:", error);
    throw error;
  }
};

// Función auxiliar para actualizar la cuenta corriente del cliente anterior
const actualizarCuentaCorrienteIdClienteAnterior = async (
  cliente_id,
  montoVenta
) => {
  try {
    const cuentaCorriente = await CuentaCorriente.findOne({
      where: { cliente_id },
    });

    if (!cuentaCorriente) {
      console.log("Cuenta corriente no encontrada para el cliente anterior.");
      return;
    }

    console.log("Actualizando cuenta corriente del cliente anterior...");
    const detalleCuentaCorriente = await DetalleCuentaCorriente.findOne({
      where: { cuentaCorriente_id: cuentaCorriente.id },
    });

    detalleCuentaCorriente.monto -= montoVenta;
    cuentaCorriente.saldoActual -= montoVenta;

    await detalleCuentaCorriente.save();
    await cuentaCorriente.save();
  } catch (error) {
    console.error("Error en actualizarCuentaCorrienteIdClienteAnterior:", error);
    throw error;
  }
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

    // Actualizar la propiedad sucursal_id en cada producto asociado
    const actualizarProductos = productosAsociados.map(async (producto) => {
      if (
        producto.ingreso_id !== null &&
        producto.categoria_producto == "porcino"
      ) {
        const ingreso = await Ingreso.findByPk(producto.ingreso_id);
        // Actualizar el producto con los nuevos valores
        await actualizarDatosProducto(producto.id, null, producto.ingreso_id === null ? 32 : 18, null, null, producto.precio ? producto.precio : 0, producto.kg ? producto.kg :0,producto.tropa ? producto.tropa : null,);
      } else {
        // Si la categoría del producto no es porcino, simplemente actualiza el producto sin modificar el ingreso
        await actualizarDatosProducto(
          producto.id, // o el valor correspondiente para producto_id
          null, // o el valor correspondiente para orden_id
          producto.ingreso_id === null ? 32 : 18, // Cambiar a 32 si ingreso_id es null
          // 18, // o el valor correspondiente para sucursal_id
          null, // o el valor correspondiente para cliente_id
          null, // o el valor correspondiente para venta_id
          producto.precio = 0, // o el valor correspondiente para precio
          producto.kg ? producto.kg :0,
          producto.tropa ? producto.tropa : null,


          // producto_id,
          // orden_id,
          // sucursal_id,
          // cliente_id,
          // venta_id,
          // precio,
          // kg,
          // tropa

        );
      }
    });

    // Esperar a que todas las actualizaciones se completen antes de responder
    await Promise.all(actualizarProductos);

    res.sendStatus(204);
  } catch (error) {
    next(error);
  }
};

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
      return res.status(404).json({ mensaje: "Producto no encontrado en la venta" });
    }
    console.log("Producto encontrado:", producto);

    let ingreso = null;

    // Verificar si el producto tiene asociado un ingreso
    if (producto.ingreso_id) {
      ingreso = await Ingreso.findByPk(producto.ingreso_id);
      if (!ingreso) {
        console.log("Ingreso no encontrado para el producto con ingreso_id:", producto.ingreso_id);
        return res.status(404).json({ mensaje: "Ingreso no encontrado" });
      }
      console.log("Ingreso encontrado:", ingreso);

      // Ajustar valores del ingreso
      ingreso.peso_total = Number(ingreso.peso_total) - Number(producto.kg);
    } else {
      console.log("El producto no tiene un ingreso asociado. Saltando ajustes en ingreso.");
    }

    // Ajustar valores de la venta
    venta.monto_total = Number(venta.monto_total) - Number(producto.precio) * Number(producto.kg);

    if (venta.formaPago_id === 2) {
      console.log("Venta con forma de pago en cuenta corriente");
      const cuentaCorriente = await CuentaCorriente.findOne({ where: { cliente_id: venta.cliente_id } });
      if (!cuentaCorriente) {
        console.log("Cuenta corriente no encontrada");
        return res.status(404).json({ mensaje: "Cuenta corriente no encontrada" });
      }
      console.log("Cuenta corriente encontrada:", cuentaCorriente);

      const detalleCuentaCorriente = await DetalleCuentaCorriente.findOne({ where: { cuentaCorriente_id: cuentaCorriente.id } });
      if (!detalleCuentaCorriente) {
        console.log("Detalle de cuenta corriente no encontrado");
        return res.status(404).json({ mensaje: "Detalle de cuenta corriente no encontrado" });
      }
      console.log("Detalle cuenta corriente encontrado:", detalleCuentaCorriente);

      // Actualizar cuenta corriente y detalle
      cuentaCorriente.saldoActual = Number(cuentaCorriente.saldoActual) - Number(producto.precio) * Number(producto.kg);
      detalleCuentaCorriente.monto = Number(detalleCuentaCorriente.monto) - Number(producto.precio) * Number(producto.kg);

      cuentaCorriente.saldoActual += Number(nuevoProducto.precio) * Number(nuevoProducto.kg);
      detalleCuentaCorriente.monto += Number(nuevoProducto.precio) * Number(nuevoProducto.kg);

      console.log("Cuenta corriente y detalle ajustados tras nuevo producto:", cuentaCorriente, detalleCuentaCorriente);

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
    venta.monto_total += Number(nuevoProducto.precio) * Number(nuevoProducto.kg);

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
    res.status(500).json({ mensaje: "Error interno del servidor", error: error.message });
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
    const venta = await Venta.findOne({ id:ventaId });

    if (!venta) {
      // Manejar el caso si la venta no se encuentra
      return null;
    }

    // Devolver la fecha de creación de la venta
    res.json(venta.fecha) ;
  } catch (error) {
    console.error("Error al obtener la fecha de creación de la venta:", error);
    throw error;
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
};
