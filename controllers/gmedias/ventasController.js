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
          attributes: ["nombre"], // Puedes seleccionar solo los atributos que necesitas
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
  const { cantidad_total, peso_total, cliente_id, formaPago_id, productos } =
    req.body;
  try {
    let nuevaVenta;
    let productosActualizados;

    // Calcular el monto total de la venta (suma de productos: peso por precio)
    const montoTotal = productos.reduce((total, producto) => {
      return total + producto.kg * producto.precio;
    }, 0);


    if (formaPago_id == 2) {

      let cuentaCorriente = await obtenerCuentaCorrientePorIdCliente(
        cliente_id
      );
      // console.log("recepcion", cuentaCorriente);

      if (!cuentaCorriente) {
        cuentaCorriente = await crearCuentaCorriente(cliente_id, montoTotal);
      } else {
        // Actualizar el saldo en la cuenta corriente

        await actualizarCuentaCorrienteIdCliente(cliente_id, montoTotal);
      }

      // Crear el detalle de la cuenta corriente

      await crearDetalleCuentaCorriente(cuentaCorriente.id, montoTotal);
    }

    // Crear la venta normal
  
    nuevaVenta = await Venta.create({
      cantidad_total,
      peso_total,
      monto_total: montoTotal,
      cliente_id,
      formaPago_id,
    });

    // Actualizar datos de productos
    productosActualizados = await Promise.all(
      productos.map(async (product) => {
        // Buscar el producto para obtener el ingreso_id
        const producto = await Producto.findByPk(product.id);
        // Actualizar el campo peso_total del ingreso asociado al producto
        if (producto && producto.ingreso_id !== null) {
          const ingreso = await Ingreso.findByPk(producto.ingreso_id);
          if (ingreso) {
            ingreso.peso_total = ingreso.peso_total - producto.kg + product.kg; // Restar el peso del producto anterior
            //ingreso.peso_total = ingreso.peso_total + product.kg; // Sumar el peso del nuevo producto
            await ingreso.save();
          }
        }

        return await actualizarDatosProducto(
          product.id,
          null, // o el valor correspondiente para orden_id
          null, // o el valor correspondiente para sucursal_id
          cliente_id,
          nuevaVenta.id,
          product.precio,
          product.kg,
          product.tropa
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

  try {
    if (clienteId || formaPagoId) {
      const venta = await Venta.findByPk(ventaId);
      if (!venta) {
        return res.status(404).json({ message: "Venta no encontrada" });
      }

      if (clienteId && clienteId !== venta.cliente_id) {
        // Actualizar cliente_id en los productos de la venta
        await Producto.update(
          { cliente_id: clienteId },
          { where: { venta_id: ventaId } }
        );

        // Actualizar cuenta corriente del cliente
        if (venta.formaPago_id == 2) {
          await actualizarCuentaCorrienteIdClienteNuevo(
            clienteId,
            venta.monto_total
          );
          await actualizarCuentaCorrienteIdClienteAnterior(
            venta.cliente_id,
            venta.monto_total
          );
        }
        venta.cliente_id = clienteId;
      }

      // Lógica para actualizar la forma de pago y la cuenta corriente según la forma de pago seleccionada
      if (formaPagoId && formaPagoId !== venta.formaPago_id) {
        if (formaPagoId == 2) {
          // Si la formaPago es cta cte, se debe sumar al saldo de la cuenta corriente del cliente, si no existe se crea la cuenta corriente
          await actualizarCuentaCorrienteIdClienteNuevo(
            venta.cliente_id,
            venta.monto_total
          );
        } else {
          // Si la formaPago es efectivo, se debe restar al saldo de la cuenta corriente del cliente
          await actualizarCuentaCorrienteIdClienteNuevo(
            venta.cliente_id,
            venta.monto_total
          );
        }
        venta.formaPago_id = formaPagoId;
      }
      await venta.save();
      res.json({ message: "Venta actualizada correctamente" });
    } else {
      res.status(400).json({
        message:
          "Se requieren clienteId o formaPagoId para actualizar la venta",
      });
    }
  } catch (error) {
    next(error);
  }
};

const actualizarCuentaCorrienteIdClienteNuevo = async (
  cliente_id,
  montoVenta
) => {
  try {
    const cuentaCorriente = await CuentaCorriente.findOne({
      where: { cliente_id },
    });

    if (!cuentaCorriente) {
      // Si no existe una cuenta corriente para este cliente, se crea una nueva
      const ctacte = await crearCuentaCorriente(cliente_id, montoVenta);
      await crearDetalleCuentaCorriente(ctacte.id, montoVenta);
    } else {
      // Si existe una cuenta corriente, se actualiza el saldo actual
      const detalleCuentaCorriente = await DetalleCuentaCorriente.findOne({
        where: { cuentaCorriente_id: cuentaCorriente.id },
      });
      detalleCuentaCorriente.monto = detalleCuentaCorriente.monto + montoVenta;
      cuentaCorriente.saldoActual = cuentaCorriente.saldoActual + montoVenta;
      await detalleCuentaCorriente.save();
      await cuentaCorriente.save();
    }
  } catch (error) {
    console.error(error);
  }
};

const actualizarCuentaCorrienteIdClienteAnterior = async (
  cliente_id,
  montoVenta
) => {
  try {
    const cuentaCorriente = await CuentaCorriente.findOne({
      where: { cliente_id },
    });

    if (!cuentaCorriente) {
      // Si no existe una cuenta corriente para este cliente, se crea una nueva
      return res
        .status(404)
        .json({ message: "Cuenta Corriente no encontrada" });
    } else {
      // Si existe una cuenta corriente, se actualiza el saldo actual
      const detalleCuentaCorriente = await DetalleCuentaCorriente.findOne({
        where: { cuentaCorriente_id: cuentaCorriente.id },
      });
      detalleCuentaCorriente.monto = detalleCuentaCorriente.monto - montoVenta;
      cuentaCorriente.saldoActual = cuentaCorriente.saldoActual - montoVenta;
      await detalleCuentaCorriente.save();
      await cuentaCorriente.save();
    }
  } catch (error) {
    console.error(error);
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
        if (ingreso) {
          ingreso.peso_total -= producto.kg; // Restar el peso del producto
          await ingreso.save();
        }
        // Actualizar el producto con los nuevos valores
        await actualizarDatosProducto(producto.id, null, 18, null, null, 0, 0);
      } else {
        // Si la categoría del producto no es porcino, simplemente actualiza el producto sin modificar el ingreso
        await actualizarDatosProducto(
          producto.id, // o el valor correspondiente para producto_id
          null, // o el valor correspondiente para orden_id
          18, // o el valor correspondiente para sucursal_id
          null, // o el valor correspondiente para cliente_id
          null, // o el valor correspondiente para venta_id
          0 // o el valor correspondiente para precio
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

// Controlador para actualizar un producto en una venta
const actualizarProductoEnVenta = async (req, res, next) => {
  const ventaId = req.params.ventaId;
  const { productoId, nuevoProducto, formaPago } = req.body;

  try {
    // Obtener la venta
    const venta = await Venta.findByPk(ventaId);
    if (!venta) {
      return res.status(404).json({ mensaje: "Venta no encontrada" });
    }

    // Obtener todos los productos asociados a la venta
    const productosAsociados = await Producto.findAll({
      where: { venta_id: venta.id }, // Ajusta según tu lógica de asociación
    });

    const producto = productosAsociados.find((p) => p.id == productoId);

    if (!producto) {
      return res
        .status(404)
        .json({ mensaje: "Producto no encontrado en la venta" });
    }

    // Buscar ingreso
    const ingreso = await Ingreso.findOne({
      where: { id: producto.ingreso_id },
    });

    // Descontar el peso viejo del producto y monto de la venta
    ingreso.peso_total = ingreso.peso_total - producto.kg;
    venta.monto_total = venta.monto_total - producto.precio * producto.kg;

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

      // Acutalizar cuenta corriente y detalle
      cuentaCorriente.saldoActual =
        cuentaCorriente.saldoActual + nuevoProducto.precio * nuevoProducto.kg;
      detalleCuentaCorriente.monto =
        detalleCuentaCorriente.monto + nuevoProducto.precio * nuevoProducto.kg;
      await cuentaCorriente.save();
      await detalleCuentaCorriente.save();
    }

    // Actualizar los datos del producto
    producto.precio = nuevoProducto.precio;
    producto.kg = nuevoProducto.kg;
    producto.tropa = nuevoProducto.tropa;

    // Actualizar peso total de ingreso y ventas, y monto_total en ventas
    ingreso.peso_total = ingreso.peso_total + producto.kg;
    venta.peso_total = venta.peso_total + producto.kg;
    venta.monto_total = producto.kg * producto.precio;

    // Guardar los cambios en producto, ingreso y venta
    await producto.save();
    await ingreso.save();
    await venta.save();

    // // Responder con la venta actualizada
    res.json({ producto, ingreso, venta });
  } catch (error) {
    next(error);
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

    if (producto.categoria_producto == "porcino") {
      producto.kg = 0;
    }
    producto.venta_id = null;
    producto.cliente_id = null;
    producto.sucursal_id = 18;
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
