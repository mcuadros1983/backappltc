// ingresosController.js

import Ingreso from "../../models/gmedias/ingresoModel.js";
import Producto from "../../models/gmedias/productoModel.js";
import { crearProducto } from "./productosController.js";
import { actualizarDatosProducto } from "./productosController.js";
import respuesta from "../../utils/respuesta.js";
import ProductoId from "../../models/gmedias/productoIdModel.js";
import { sequelize } from "../../config/database.js";
const obtenerIngresos = async (req, res, next) => {
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

// const crearIngreso = async (req, res, next) => {
//   const { products, cantidad_total, peso_total, categoria, fecha } = req.body;
//   console.log("productos", products)
//   try {
//     // Verificar si se recibieron productos
//     if (!products || !Array.isArray(products) || products.length === 0) {
//       return res
//         .status(400)
//         .json({ error: "No se recibieron productos válidos" });
//     }

//     const nuevoIngreso = await Ingreso.create({
//       cantidad_total,
//       peso_total,
//       categoria_ingreso: categoria,
//       fecha: fecha,
//     });
//     const ingreso_id = nuevoIngreso.id;

//     const productosCreados = await Promise.all(
//       products.map(async (producto) => {
//         try {
//           // Verificar si el producto ya existe con el num_media
//           const productoExistente = await Producto.findOne({
//             where: {
//               num_media: String(producto.num_media),
//             },
//           });

//           if (productoExistente && productoExistente.sucursal_id === 32) {
//             // Actualizar solo los campos que no sean nulos o vacíos
//             productoExistente.ingreso_id = ingreso_id;
//             productoExistente.sucursal_id = 18;
//             productoExistente.categoria_producto = producto.categoria_producto || productoExistente.categoria_producto;
//             productoExistente.codigo_de_barra = producto.codigo_de_barra || productoExistente.codigo_de_barra;
//             productoExistente.num_media = producto.num_media || productoExistente.num_media;
//             productoExistente.precio = producto.precio !== null && producto.precio !== undefined ? producto.precio : productoExistente.precio;
//             productoExistente.kg = producto.kg !== null && producto.kg !== undefined ? producto.kg : productoExistente.kg;
//             productoExistente.tropa = producto.tropa || productoExistente.tropa;
//             await productoExistente.save();
//             return productoExistente;
//           } else {
//             // Crear un nuevo producto si no existe
//             const productoCreado = await Producto.create({
//               categoria_producto: categoria,
//               subcategoria: producto.subcategoria,
//               codigo_de_barra: producto.codigo_de_barra,
//               num_media: producto.num_media,
//               precio: producto.precio,
//               kg: producto.kg,
//               tropa: producto.tropa,
//               ingreso_id,
//             });

//             await ProductoId.create({
//               id: productoCreado.id,
//             });

//             return productoCreado;
//           }
//         } catch (error) {
//           console.error("Error al procesar producto:", producto, error);
//           throw error; // Propaga el error para manejarlo en el bloque catch de Promise.all
//         }
//       })
//     );

//     res.json({ nuevoIngreso, productos: productosCreados });
//   } catch (error) {
//     next(error);
//   }
// };

const crearIngreso = async (req, res, next) => {
  const { products, categoria, fecha } = req.body;

  let transaction;

  try {
    if (!Array.isArray(products) || products.length === 0) {
      return res.status(400).json({
        error: "No se recibieron productos válidos",
      });
    }

    // Verificar números de media repetidos dentro del mismo ingreso
    const numerosMedia = products.map((producto) =>
      String(producto.num_media ?? "").trim()
    );

    if (numerosMedia.some((numero) => !numero)) {
      return res.status(400).json({
        error: "Todos los productos deben tener número de media",
      });
    }

    if (new Set(numerosMedia).size !== numerosMedia.length) {
      return res.status(400).json({
        error: "Existen números de media duplicados en el ingreso",
      });
    }

    transaction = await sequelize.transaction();

    // Crear el ingreso inicialmente sin totales definitivos
    const nuevoIngreso = await Ingreso.create(
      {
        cantidad_total: products.length,
        peso_total: 0,
        categoria_ingreso: categoria,
        fecha,
      },
      { transaction }
    );

    const ingreso_id = nuevoIngreso.id;

    const productosProcesados = [];
    let pesoTotalReal = 0;

    for (const producto of products) {
      const numMedia = String(producto.num_media).trim();

      // Buscar media res existente
      const productoExistente = await Producto.findOne({
        where: {
          num_media: numMedia,
        },
        transaction,
        lock: transaction.LOCK.UPDATE,
      });

      let productoFinal;

      if (productoExistente) {
        // Si existe, solamente puede ingresar desde sucursal 32
        if (Number(productoExistente.sucursal_id) !== 32) {
          const error = new Error(
            `La media res ${numMedia} ya existe en la sucursal ` +
            `${productoExistente.sucursal_id}. No se puede ingresar nuevamente.`
          );

          error.status = 409;
          throw error;
        }

        // IMPORTANTE:
        // No modificar los datos originales del producto.
        // Solamente actualizar la información operativa del ingreso.

        productoExistente.ingreso_id = ingreso_id;
        productoExistente.sucursal_id = 18;

        await productoExistente.save({ transaction });

        productoFinal = productoExistente;

      } else {
        // Si no existe, crear el producto con los datos del frontend
        productoFinal = await Producto.create(
          {
            categoria_producto: categoria,
            subcategoria: producto.subcategoria,
            codigo_de_barra: producto.codigo_de_barra,
            num_media: numMedia,
            precio: producto.precio,
            kg: producto.kg,
            tropa: producto.tropa,
            ingreso_id,
          },
          { transaction }
        );

        await ProductoId.create(
          {
            id: productoFinal.id,
          },
          { transaction }
        );
      }

      // Sumar siempre el peso real del producto procesado
      const kgReal = Number(productoFinal.kg);

      if (!Number.isFinite(kgReal) || kgReal <= 0) {
        const error = new Error(
          `La media res ${numMedia} no tiene un peso válido`
        );

        error.status = 400;
        throw error;
      }

      pesoTotalReal += kgReal;
      productosProcesados.push(productoFinal);
    }

    // Actualizar totales utilizando los productos reales
    nuevoIngreso.cantidad_total = productosProcesados.length;
    nuevoIngreso.peso_total = pesoTotalReal;

    await nuevoIngreso.save({ transaction });

    // Confirmar todas las operaciones
    await transaction.commit();
    transaction = null;

    return res.json({
      nuevoIngreso,
      productos: productosProcesados,
    });

  } catch (error) {
    if (transaction) {
      await transaction.rollback();
    }

    if (error.status) {
      return res.status(error.status).json({
        error: error.message,
      });
    }

    console.error("Error en crearIngreso:", error);
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

    // Procesar productos según la categoría
    await Promise.all(
      productosEnIngreso.map(async (producto) => {
        producto.sucursal_id = 32;
        await producto.save();
      })
    );

    // Eliminar el ingreso
    await Ingreso.destroy({
      where: { id },
    });

    res.json({
      mensaje:
        "Ingreso eliminado con éxito. Los productos relacionados han sido procesados según su categoría.",
    });
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
