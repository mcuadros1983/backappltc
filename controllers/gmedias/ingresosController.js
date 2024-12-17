// ingresosController.js

import Ingreso from "../../models/gmedias/ingresoModel.js";
import Producto from "../../models/gmedias/productoModel.js";
import { crearProducto } from "./productosController.js";
import { actualizarDatosProducto } from "./productosController.js";
import respuesta from "../../utils/respuesta.js";
import ProductoId from "../../models/gmedias/productoIdModel.js";

const obtenerIngresos = async (req, res, next) => {
  // console.log("buscando ingresos")
  try {
    const ingresos = await Ingreso.findAll();
    // Si no hay ingresos, devolvemos una respuesta con un array vacío
    if (!ingresos || ingresos.length === 0) {
      return res.json([]);
    }

    res.json(ingresos);
  } catch (error) {
    next(error);
  }
};

const obtenerIngreso = async (req, res, next) => {
  const { id } = req.params;
  try {
    const ingreso = await Ingreso.findOne({
      where: { id },
    });
    if (!ingreso) {
      return res.json({
        message: "Ingreso no encontrado",
      });
    }
    res.json(ingreso);
  } catch (error) {
    next(error);
  }
};

const crearIngreso = async (req, res, next) => {
  const { products, cantidad_total, peso_total, categoria, fecha } = req.body;
// console.log("datos", products, cantidad_total, peso_total, categoria)
  try {
    // Verificar si se recibieron productos
    if (!products || !Array.isArray(products) || products.length === 0) {
      return res
        .status(400)
        .json({ error: "No se recibieron productos válidos" });
    }

    const nuevoIngreso = await Ingreso.create({
      cantidad_total,
      peso_total,
      categoria_ingreso: categoria,
      fecha:fecha,
    });
    const ingreso_id = nuevoIngreso.id;

    const productosCreados = await Promise.all(
      products.map(async (producto) => {
        try {
          const productoCreado = await Producto.create({
            categoria_producto: categoria,
            codigo_de_barra: producto.codigo_de_barra,
            num_media: producto.num_media,
            precio: producto.precio,
            kg: producto.kg,
            tropa: producto.tropa,
            ingreso_id,
          });

          const nuevoProductoId = await ProductoId.create({
            id: productoCreado.id,
            // productoId: nuevoProducto.id,
          });

          return productoCreado;
        } catch (error) {
          console.error("Error al procesar producto:", producto, error);
          throw error; // Propaga el error para manejarlo en el bloque catch de Promise.all
        }
      })
    );

    res.json({ nuevoIngreso, productos: productosCreados });
  } catch (error) {
    next(error);
  }
};

const obtenerProductosIngreso = async (req, res, next) => {
  const { id } = req.params;
  try {
    const productos = await Producto.findAll({
      where: { ingreso_id: id },
    });
    const productosOrdenados = productos.sort((a, b) => a.id - b.id);
    res.json(productosOrdenados);
  } catch (error) {
    next(error);
  }
};

const actualizarIngreso = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { cantidad_total } = req.body;

    const ingreso = await Ingreso.findByPk(id);
    ingreso.cantidad_total = cantidad_total;

    await ingreso.save();
    res.json(ingreso);
  } catch (error) {
    next(error);
  }
};

const eliminarIngreso = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Verificar si alguno de los productos cumple con las condiciones
    const productosEnIngreso = await Producto.findAll({
      where: { ingreso_id: id },
    });

    const productoInvalido = productosEnIngreso.find(
      (producto) =>
        producto.sucursal_id !== 18 ||
        producto.cliente_id !== null ||
        producto.orden_id !== null ||
        producto.venta_id !== null
    );

    if (productoInvalido) {
      return res.status(400).json({
        mensaje:
          "No se puede eliminar el ingreso, porque uno de los productos contenidos en este ingreso ya salió del stock",
      });
    }

    // Si no hay productos que cumplan las condiciones, proceder con la eliminación
    await Ingreso.destroy({
      where: { id },
    });

    res.json({ mensaje: "Ingreso eliminado con éxito" });
  } catch (error) {
    next(error);
  }
};

export {
  obtenerIngresos,
  obtenerIngreso,
  crearIngreso,
  obtenerProductosIngreso,
  actualizarIngreso,
  eliminarIngreso,
};
