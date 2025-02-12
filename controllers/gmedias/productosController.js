// productosController.js

import Producto from "../../models/gmedias/productoModel.js";
import { Op } from "sequelize";
import Orden from "../../models/gmedias/ordenModel.js";
import Cliente from "../../models/gmedias/clienteModel.js";
import Sucursal from "../../models/gmedias/sucursalModel.js";
import Ingreso from "../../models/gmedias/ingresoModel.js";
import xlsx from "xlsx"; // Importa la librería para leer archivos Excel
import fs from "fs"; // Importa el módulo fs para manipulación de archivos
import { Venta } from "../../models/gmedias/ventaModel.js";
import CuentaCorriente from "../../models/gmedias/cuentaCorrienteModel.js";
import DetalleCuentaCorriente from "../../models/gmedias/detalleCuentaCorrienteModel.js";
import ProductoId from "../../models/gmedias/productoIdModel.js";
import {
  crearCuentaCorriente,
  obtenerCuentaCorrientePorIdCliente,
  actualizarCuentaCorrienteIdCliente,
} from "./cuentasCorrientesController.js";
import { crearDetalleCuentaCorriente } from "./detallesCuentasCorrientesController.js";
import generarCodigoDeBarras from "../../utils/codigoDeBarra.js";
import verificarYReemplazarVacios from "../../utils/manipularObjetos.js";

const obtenerProductos = async (req, res, next) => {
  try {
    const productos = await Producto.findAll({
      include: [
        {
          model: Cliente,
          attributes: ["nombre"], // Puedes seleccionar solo los atributos que necesitas
        },
        {
          model: Sucursal,
          attributes: ["nombre"],
        },
      ],
    });
    res.json(productos);
  } catch (error) {
    next(error);
  }
};

const obtenerProductosPorFecha = async (req, res, next) => {
  try {
    const { fechaDesde, fechaHasta } = req.body;
    console.log("productos fecha2", fechaDesde, fechaHasta)

    // Validar que las fechas estén presentes
    if (!fechaDesde || !fechaHasta) {
      return res.status(400).json({
        mensaje: "Por favor, proporciona las fechas 'fechaDesde' y 'fechaHasta'.",
      });
    }

    // Buscar productos dentro del rango de fechas
    const productos = await Producto.findAll({
      
      where: {
        fecha: {
          [Op.between]: [fechaDesde, fechaHasta],
        },
      },
      include: [
        {
          model: Cliente,
          attributes: ["nombre"], // Puedes seleccionar solo los atributos que necesitas
        },
        {
          model: Sucursal,
          attributes: ["nombre"],
        },
      ],
    });
    console.log("productos", productos)

    res.json(productos);
  } catch (error) {
    next(error);
  }
};

const obtenerProductoPorId = async (req, res, next) => {
  const { productoId } = req.params;

  try {
    const producto = await Producto.findByPk(productoId, {
      // include: [DetalleVenta],
    });

    if (!producto) {
      return res.status(404).json({ mensaje: "Producto no encontrado" });
    }

    res.json(producto);
  } catch (error) {
    next(error);
  }
};

const obtenerProductoCodigoBarra = async (req, res, next) => {
  const { barcode } = req.params;

  try {
    const product = await Producto.findOne({
      where: { codigo_de_barra: barcode },
    });
    res.json(product);
  } catch (error) {
    next(error);
  }
};

const obtenerProductoNumMedia = async (req, res, next) => {
  const { nummedia } = req.params;

  try {
    const product = await Producto.findOne({
      where: { num_media: nummedia },
    });
    res.json(product);
  } catch (error) {
    next(error);
  }
};

const obtenerProductosCodigoBarra = async (req, res, next) => {
  const { barcode } = req.params;

  try {
    const products = await Producto.findAll({
      where: { codigo_de_barra: barcode },
    });
    res.json(products);
  } catch (error) {
    next(error);
  }
};

const obtenerProductosFiltradosSucursalFecha = async (req, res, next) => {
  const { branchId, startDate, endDate } = req.params;

  try {
    const conditions = {
      sucursal_id: branchId,
    };

    if (startDate && endDate) {
      conditions.fecha = {
        ...(startDate && { $gte: new Date(startDate) }),
        ...(endDate && { $lte: new Date(endDate) }),
      };
    }

    const filteredProducts = await Producto.findAll({
      include: [
        {
          model: Orden,
          where: conditions,
        },
      ],
    });

    res.json(filteredProducts);
  } catch (error) {
    next(error);
  }
};

const crearProducto = async (req, res, next) => {
  const { codigo_de_barra, num_media, precio, kg, tropa } = req.body;

  try {
    // Crear el producto
    const nuevoProducto = await Producto.create({
      codigo_de_barra,
      num_media,
      precio,
      kg,
      tropa,
    });

    // Crear el registro en productoId con el id del producto creado
    const nuevoProductoId = await ProductoId.create({
      id: nuevoProducto.id,
      // productoId: nuevoProducto.id,
    });

    res.json(nuevoProducto);
  } catch (error) {
    next(error);
  }
};

const actualizarProducto = async (req, res, next) => {
  const productoId = req.params.productoId;
  const {
    categoria_producto,
    subcategoria,
    orden_id,
    sucursal_id,
    cliente_id,
    venta_id,
    codigo_de_barra,
    num_media,
    garron,
    precio,
    costo,
    kg,
    tropa,
  } = req.body;

  try {
    // Obtener el producto
    const producto = await Producto.findByPk(productoId);
    if (!producto) {
      return res.status(404).json({ mensaje: "Producto no encontrado" });
    }

    // Obtener el producto original de la base de datos
    const productoOriginal = producto.toJSON();

    const cambios = {};
    for (const key in req.body) {
      if (key !== "createdAt" && key !== "updatedAt") {
        if (
          productoOriginal.hasOwnProperty(key) &&
          req.body[key] !== productoOriginal[key]
        ) {
          const numericValue = parseFloat(req.body[key]);
          if (!isNaN(numericValue)) {
            cambios[key] = numericValue;
          } else {
            cambios[key] = req.body[key];
          }
        }
      }
    }

    // Si hay cambios en el peso (kg), validar si el producto tiene un ingreso asociado
    if (cambios.kg && producto.ingreso_id) {
      const ingreso = await Ingreso.findByPk(producto.ingreso_id);
      if (!ingreso) {
        console.log(
          "El producto tiene un ingreso_id, pero no se encontró el ingreso"
        );
        return res.status(404).json({ mensaje: "Ingreso no encontrado" });
      }

      // Ajustar el peso total del ingreso
      ingreso.peso_total =
        Number(ingreso.peso_total) - Number(producto.kg) + Number(cambios.kg);
      await ingreso.save();
    } else if (cambios.kg) {
      console.log("El producto no tiene un ingreso asociado. Saltando ajustes en ingreso.");
    }

    if (producto.orden_id || producto.venta_id) {
      if (producto.orden_id) {
        const orden = await Orden.findByPk(producto.orden_id);

        if (cambios.kg) {
          orden.peso_total =
            Number(orden.peso_total) - Number(producto.kg) + Number(cambios.kg);
          await orden.save();
        }

        if (cambios.sucursal_id) {
          orden.sucursal_id = cambios.sucursal_id;
          await orden.save();
        }
      }
      if (producto.venta_id) {
        const venta = await Venta.findByPk(producto.venta_id);

        let ctacte = "";
        let detalleCtacte = "";
        ctacte = await CuentaCorriente.findOne({
          cliente_id: producto.cliente_id,
        });

        if (ctacte) {
          detalleCtacte = await DetalleCuentaCorriente.findOne({
            cuentaCorriente_id: ctacte.id,
          });
        }

        if (cambios.kg && cambios.precio) {
          venta.peso_total =
            Number(venta.peso_total) - Number(producto.kg) + Number(cambios.kg);
          venta.monto_total =
            Number(venta.monto_total) -
            Number(producto.kg) * Number(producto.precio) +
            Number(cambios.kg) * Number(cambios.precio);
          await venta.save();

          if (ctacte) {
            const montoAnterior = Number(producto.kg) * Number(producto.precio);
            const montoNuevo =
              Number(cambios.kg) * Number(cambios.precio);
            ctacte.saldoActual =
              Number(ctacte.saldoActual) - montoAnterior + montoNuevo;
            detalleCtacte.monto =
              Number(detalleCtacte.monto) - montoAnterior + montoNuevo;
            await ctacte.save();
            await detalleCtacte.save();
          }
        } else if (cambios.kg) {
          venta.peso_total =
            Number(venta.peso_total) - Number(producto.kg) + Number(cambios.kg);
          const montoNuevo = Number(cambios.kg) * Number(producto.precio);
          venta.monto_total =
            Number(venta.monto_total) -
            Number(producto.kg) * Number(producto.precio) +
            montoNuevo;
          await venta.save();

          if (ctacte) {
            const montoAnterior = Number(producto.kg) * Number(producto.precio);
            const montoNuevo =
              Number(cambios.kg) * Number(producto.precio);
            ctacte.saldoActual =
              Number(ctacte.saldoActual) - montoAnterior + montoNuevo;
            detalleCtacte.monto =
              Number(detalleCtacte.monto) - montoAnterior + montoNuevo;
            await ctacte.save();
            await detalleCtacte.save();
          }
        } else if (cambios.precio) {
          const montoNuevo = Number(producto.kg) * Number(cambios.precio);
          venta.monto_total =
            Number(venta.monto_total) -
            Number(producto.kg) * Number(producto.precio) +
            montoNuevo;
          await venta.save();

          if (ctacte) {
            const montoAnterior = Number(producto.kg) * Number(producto.precio);
            const montoNuevo =
              Number(producto.kg) * Number(cambios.precio);
            ctacte.saldoActual =
              Number(ctacte.saldoActual) - montoAnterior + montoNuevo;
            detalleCtacte.monto =
              Number(detalleCtacte.monto) - montoAnterior + montoNuevo;
            await ctacte.save();
            await detalleCtacte.save();
          }
        }
      }
    }

    function checkAndReplaceEmpty(obj) {
      const newObj = {};
      for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
          if (obj[key] === "") {
            newObj[key] = null;
          } else {
            newObj[key] = obj[key];
          }
        }
      }
      return newObj;
    }

    const newData = {
      categoria_producto,
      subcategoria,
      orden_id,
      sucursal_id,
      cliente_id,
      venta_id,
      codigo_de_barra,
      num_media,
      garron,
      precio,
      costo,
      kg,
      tropa,
    };

    const newDataProcessed = checkAndReplaceEmpty(newData);
    producto.set(newDataProcessed);
    await producto.save();

    res.json(producto);
  } catch (error) {
    console.error("Error en actualizarProducto:", error);
    next(error);
  }
};

const actualizarDatosProducto = async (
  producto_id,
  orden_id,
  sucursal_id,
  cliente_id,
  venta_id,
  precio,
  kg,
  tropa
) => {
  try {
    // Verificar si la categoría del producto es "porcino"
    const producto = await Producto.findByPk(producto_id);
    const newData = {
      // categoria_producto,
      orden_id,
      sucursal_id,
      cliente_id,
      venta_id,
      precio,
      kg,
      tropa,
    };
    producto.set(newData);

    await producto.save();
    return producto;
  } catch (error) {
    console.log(error);
  }
};

// const eliminarProducto = async (req, res, next) => {
//   const productoId = req.params.productoId;

//   try {
//     const producto = await Producto.findByPk(productoId);

//     if (!producto) {
//       return res.status(404).json({ mensaje: "Producto no encontrado" });
//     }

//     if (
//       producto.sucursal_id !== 18 ||
//       producto.orden_id !== null ||
//       producto.cliente_id !== null ||
//       producto.venta_id !== null
//     ) {
//       return res.status(400).json({
//         mensaje: "Producto no se puede eliminar, ya que ha salido del stock",
//       });
//     }

//     // Obtener el ingreso asociado al producto
//     const ingreso = await Ingreso.findByPk(producto.ingreso_id);

//     if (!ingreso) {
//       return res.status(404).json({ mensaje: "Ingreso no encontrado" });
//     }

//     // Verificar si este producto es el único en el ingreso
//     const productosEnIngreso = await Producto.findAll({
//       where: { ingreso_id: ingreso.id },
//     });

//     if (productosEnIngreso.length === 1) {
//       // Si es el único, eliminar el ingreso
//       await ingreso.destroy();
//       return res.json({ mensaje: "Ingreso eliminado con éxito" });
//     } else {
//       // Si no es el único, actualizar la cantidad_total y peso_total del ingreso
//       ingreso.cantidad_total -= 1; // Restar 1 a la cantidad_total (puedes ajustar según tu lógica)
//       ingreso.peso_total -= producto.kg; // Restar el peso del producto eliminado
//       await ingreso.save();
//     }

//     // Eliminar el producto
//     await producto.destroy();

//     res.json({ mensaje: "Producto eliminado con éxito" });
//   } catch (error) {
//     next(error);
//   }
// };

const eliminarProducto = async (req, res, next) => {
  const productoId = req.params.productoId;

  try {
    const producto = await Producto.findByPk(productoId);

    if (!producto) {
      return res.status(404).json({ mensaje: "Producto no encontrado" });
    }

    if (
      (producto.sucursal_id !== 18 && producto.sucursal_id !== 32) ||
      producto.orden_id !== null ||
      producto.cliente_id !== null ||
      producto.venta_id !== null
    ) {
      return res.status(400).json({
        mensaje: "Producto no se puede eliminar, ya que ha salido del stock",
      });
    }

    // Verificar si el producto tiene un ingreso asociado
    if (!producto.ingreso_id) {
      // Si no hay ingreso asociado, simplemente eliminar el producto
      await producto.destroy();
      return res.json({ mensaje: "Producto eliminado con éxito" });
    }

    // Obtener el ingreso asociado al producto
    const ingreso = await Ingreso.findByPk(producto.ingreso_id);

    if (!ingreso) {
      return res.status(404).json({ mensaje: "Ingreso no encontrado" });
    }

    // Verificar si este producto es el único en el ingreso
    const productosEnIngreso = await Producto.findAll({
      where: { ingreso_id: ingreso.id },
    });

    if (productosEnIngreso.length === 1) {
      // Si es el único, eliminar el ingreso
      await ingreso.destroy();
      return res.json({ mensaje: "Ingreso eliminado con éxito" });
    } else {
      // Si no es el único, actualizar la cantidad_total y peso_total del ingreso
      ingreso.cantidad_total -= 1; // Restar 1 a la cantidad_total (puedes ajustar según tu lógica)
      ingreso.peso_total -= producto.kg; // Restar el peso del producto eliminado
      await ingreso.save();
    }

    // Eliminar el producto
    await producto.destroy();

    res.json({ mensaje: "Producto eliminado con éxito" });
  } catch (error) {
    next(error);
  }
};


const procesarDesdeExcel = async (req, res, next) => {
  // console.log("datosexcel", req, req.body);

  try {
    if (!req.file) {
      return res
        .status(400)
        .json({ mensaje: "No se ha subido ningún archivo." });
    }

    // Lee el archivo Excel
    const workbook = xlsx.readFile(req.file.path);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const data = xlsx.utils.sheet_to_json(sheet);

    // Obtiene el tipo de procesamiento desde la solicitud
    const { tipo } = req.body;

    // Verifica el tipo y llama a la función correspondiente
    if (tipo === "crear") {
      await crearProductosDesdeExcel(req, res, next, data);
    } else if (tipo === "actualizar") {
      await actualizarProductosDesdeExcel(req, res, next, data);
    } else {
      return res
        .status(400)
        .json({ mensaje: "Tipo de procesamiento no válido." });
    }
  } catch (error) {
    console.error("Error al procesar desde Excel:", error);
    return res.status(500).json({
      mensaje: "Error al procesar desde el archivo Excel.",
    });
  }
};

let lastUsedId = 0;

const crearProductosDesdeExcel = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ mensaje: "No se ha subido ningún archivo." });
    }

    // Lee el archivo Excel
    const workbook = xlsx.readFile(req.file.path);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const data = xlsx.utils.sheet_to_json(sheet);

    // Obtiene los datos adicionales del cuerpo de la solicitud
    const { operacion, destino, formaPago,fechaOperacion } = req.body;

    if (operacion === "romaneo") {
      // Procesar productos para la operación "Romaneo"
      const productosProcesados = await Promise.all(
        data.map(async (row) => {
          // console.log("row", row)
          try {
            // Verificar si el producto ya existe
            const productoExistente = await Producto.findOne({
              where: { num_media: String(row.num_media) },
            });

            if (productoExistente) {
              console.log(`El producto con num_media ${row.num_media} ya existe.`);
              return null; // Saltar si ya existe
            }

            // Crear el producto con la sucursal_id fija
            const nuevoProducto = await Producto.create({
              categoria_producto: row.categoria,
              subcategoria: row.subcategoria,
              num_media: row.num_media,
              garron: row.garron,
              precio: row.precio,
              costo: row.costo,
              kg: row.kg,
              tropa: row.tropa,
              sucursal_id: 32, // Sucursal fija para romaneo
            });

            return nuevoProducto;
          } catch (error) {
            console.error(
              `Error al procesar el producto con num_media ${row.num_media}:`,
              error
            );
            throw error;
          }
        })
      );

      // Filtrar productos creados correctamente
      const productosCreados = productosProcesados.filter(
        (producto) => producto !== null
      );

      // Eliminar el archivo cargado
      fs.unlinkSync(req.file.path);

      // Responder con los productos creados
      return res.status(200).json({
        mensaje: "Los productos han sido procesados correctamente en Romaneo.",
        productos: productosCreados,
      });
    }

    // Para operaciones diferentes de "romaneo"
    const productosCreados = await Promise.all(
      data.map(async (row) => {
        try {
          // Buscar el producto existente por num_media
          let producto = await Producto.findOne({ where: { num_media: String(row.num_media) } });

          if (!producto) {
            // Si no existe, crear el producto
            producto = await Producto.create({
              categoria_producto: row.categoria,
              subcategoria: row.subcategoria,
              num_media: row.num_media,
              garron: row.garron,
              precio: row.precio,
              costo: row.costo,
              kg: row.kg,
              tropa: row.tropa,
              sucursal_id: null, // Sucursal será asignada más adelante
            });
          }

          return producto;
        } catch (error) {
          console.error("Error al procesar producto desde Excel:", row, error);
          throw error;
        }
      })
    );

    // Elimina el archivo cargado después de procesarlo
    fs.unlinkSync(req.file.path);

    if (operacion === "venta") {
      const cliente = await Cliente.findByPk(destino);
      console.log("cliente", cliente);
    
      // Verificar y calcular precio si es necesario
      productosCreados.forEach((producto) => {
        if (!producto.precio || producto.precio === 0) {
          if (cliente?.margen && producto?.costo) {
            const margen = 1 + (Number(cliente.margen) / 100);
            const costo = Number(producto.costo);
            producto.precio = margen * costo;
          } else {
            producto.precio = 0; // O alguna lógica alternativa si falta margen o costo
          }
        }
      });
    
      // Calcula el monto total de la venta (suma de productos: peso por precio)
      const montoTotal = productosCreados.reduce((total, producto) => {
        return Number(total) + Number(producto.kg) * Number(producto.precio);
      }, 0);
    
      // Manejar cuenta corriente si la forma de pago es cuenta corriente
      if (formaPago == 2) {
        let cuentaCorriente = await obtenerCuentaCorrientePorIdCliente(destino);
        if (!cuentaCorriente) {
          cuentaCorriente = await crearCuentaCorriente(destino, montoTotal);
        } else {
          await actualizarCuentaCorrienteIdCliente(destino, montoTotal);
        }
    
        // Crear el detalle de la cuenta corriente
        await crearDetalleCuentaCorriente(cuentaCorriente.id, montoTotal);
      }
    
      // Crea la venta
      const nuevaVenta = await Venta.create({
        fecha:fechaOperacion,
        cantidad_total: productosCreados.length,
        // peso_total: productosCreados.reduce((total, p) => total + p.kg, 0),
        peso_total: productosCreados.reduce((total, p) => total + Number(p.kg || 0), 0),
        monto_total: montoTotal,
        cliente_id: destino,
        formaPago_id: formaPago,
      });
    
      // Asocia los productos a la venta
      await Promise.all(
        productosCreados.map(async (producto) => {
          producto.venta_id = nuevaVenta.id;
          producto.cliente_id = destino;
          producto.sucursal_id = null;
          await producto.save();
        })
      );
    } else if (operacion === "orden") {
      // Crea la orden
      const nuevaOrden = await Orden.create({
        fecha:fechaOperacion,
        // peso_total: productosCreados.reduce((total, p) => Number(total) + Number(p.kg), 0),
        peso_total: productosCreados.reduce((total, p) => total + Number(p.kg || 0), 0),
        cantidad_total: productosCreados.length,
        sucursal_id: destino,
      });

      // Asocia los productos a la orden
      await Promise.all(
        productosCreados.map(async (producto) => {
          producto.orden_id = nuevaOrden.id;
          producto.sucursal_id = destino;
          await producto.save();
        })
      );
    }

    // Devuelve una respuesta exitosa con los productos creados
    return res.status(200).json({
      mensaje: "Los productos han sido procesados correctamente desde el archivo Excel.",
      productos: productosCreados,
    });
  } catch (error) {
    console.error("Error al crear productos desde Excel:", error);
    return res.status(500).json({
      mensaje: "Error al crear productos desde el archivo Excel.",
    });
  }
};

const actualizarProductosDesdeExcel = async (req, res, next) => {
  try {
    if (!req.file) {
      console.log("No se ha subido ningún archivo.");
      return res.status(400).json({ mensaje: "No se ha subido ningún archivo." });
    }

    console.log("Archivo recibido:", req.file.path);

    // Lee el archivo Excel
    const workbook = xlsx.readFile(req.file.path);
    const sheetName = workbook.SheetNames[0];
    console.log("Hoja seleccionada:", sheetName);
    const sheet = workbook.Sheets[sheetName];
    const data = xlsx.utils.sheet_to_json(sheet);

    console.log("Datos procesados desde el archivo Excel:", data);

    // Itera sobre los datos del archivo Excel
    for (const [index, row] of data.entries()) {
      console.log(`Procesando fila ${index + 1}:`, row);

      const {
        categoria_producto,
        subcategoria,
        codigo_de_barra,
        num_media,
        garron,
        precio,
        costo,
        kg,
        tropa,
      } = row;

      console.log("Valores extraídos:", {
        categoria_producto,
        subcategoria,
        codigo_de_barra,
        num_media,
        garron,
        precio,
        costo,
        kg,
        tropa,
      });

      if (!num_media) {
        console.log(`Fila ${index + 1} omitida: falta 'num_media'.`);
        continue;
      }

      // Busca el producto en la base de datos por su número de media
      const producto = await Producto.findOne({
        where: { num_media: String(num_media) }, // Asegúrate de que sea un string
      });

      if (producto) {
        console.log(`Producto encontrado para 'num_media' ${num_media}:`, producto);

        // Validar si existe un ingreso asociado al producto
        if (producto.ingreso_id) {
          console.log("Producto tiene un ingreso asociado:", producto.ingreso_id);

          const ingreso = await Ingreso.findOne({
            where: { id: producto.ingreso_id },
          });

          if (ingreso) {
            console.log("Ingreso encontrado:", ingreso);
            if (kg !== undefined) {
              console.log(
                `Actualizando peso del ingreso. Peso anterior: ${ingreso.peso_total}, Producto.kg: ${producto.kg}, Nuevo kg: ${kg}`
              );

              ingreso.peso_total -= Number(producto.kg);
              ingreso.peso_total += Number(kg);

              await ingreso.save();
              console.log("Ingreso actualizado:", ingreso);
            }
          } else {
            console.log("Ingreso no encontrado para ID:", producto.ingreso_id);
          }
        } else {
          console.log("El producto no tiene un ingreso asociado.");
        }

        // Resto de las actualizaciones (orden, venta, producto, etc.)
        if (producto.orden_id !== null && kg !== undefined) {
          const orden = await Orden.findOne({
            where: { id: producto.orden_id },
          });

          if (orden) {
            console.log("Orden encontrada:", orden);
            console.log(
              `Actualizando peso de la orden. Peso anterior: ${orden.peso_total}, Producto.kg: ${producto.kg}, Nuevo kg: ${kg}`
            );

            orden.peso_total -= Number(producto.kg);
            orden.peso_total += Number(kg);

            await orden.save();
            console.log("Orden actualizada:", orden);
          }
        }

        if (producto.venta_id !== null && kg !== undefined) {
          const venta = await Venta.findOne({
            where: { id: producto.venta_id },
          });

          if (venta) {
            console.log("Venta encontrada:", venta);

            venta.peso_total -= Number(producto.kg);
            venta.monto_total -= Number(producto.kg) * Number(producto.precio);
            venta.peso_total += Number(kg);
            venta.monto_total += Number(kg) * Number(precio);

            await venta.save();
            console.log("Venta actualizada:", venta);

            if (venta.formaPago_id == 2) {
              const ctacte = await CuentaCorriente.findOne({
                where: { cliente_id: venta.cliente_id },
              });

              if (ctacte) {
                console.log("Cuenta corriente encontrada:", ctacte);

                ctacte.saldoActual -=
                  Number(producto.kg) * Number(producto.precio);
                ctacte.saldoActual += Number(kg) * Number(precio);

                await ctacte.save();
                console.log("Cuenta corriente actualizada:", ctacte);

                const detalleCtacte = await DetalleCuentaCorriente.findOne({
                  where: { cuentaCorriente_id: ctacte.id },
                });

                if (detalleCtacte) {
                  console.log("Detalle de cuenta corriente encontrado:", detalleCtacte);

                  detalleCtacte.monto -=
                    Number(producto.kg) * Number(producto.precio);
                  detalleCtacte.monto += Number(kg) * Number(precio);

                  await detalleCtacte.save();
                  console.log("Detalle de cuenta corriente actualizado:", detalleCtacte);
                }
              }
            }
          }
        }

        if (categoria_producto) producto.categoria_producto = categoria_producto;
        if (subcategoria) producto.subcategoria = subcategoria;
        if (garron) producto.garron = garron;
        if (precio) producto.precio = precio;
        if (costo) producto.costo = costo;
        if (kg) producto.kg = kg;
        if (tropa) producto.tropa = tropa;

        await producto.save();
        console.log(`Producto actualizado:`, producto);
      } else {
        console.log(`Producto no encontrado para 'num_media': ${num_media}`);
      }
    }

    // Elimina el archivo cargado después de procesarlo
    fs.unlinkSync(req.file.path);
    console.log("Archivo eliminado tras procesamiento:", req.file.path);

    return res.status(200).json({
      mensaje:
        "Los productos han sido actualizados correctamente desde el archivo Excel.",
    });
  } catch (error) {
    console.error("Error al actualizar productos desde Excel:", error);
    return res.status(500).json({
      mensaje: "Error al actualizar productos desde el archivo Excel.",
    });
  }
};


const generarCodigos = async (req, res, next) => { 
  // console.log("categoria----------", req.body)
  try {
    const { categoria } = req.body;

    // Consulta el último valor de id en ProductoId
    const lastProductId = await ProductoId.findOne({
      order: [["id", "DESC"]],
    });

    let lastId = 0;
    if (lastProductId) {
      lastId = lastProductId.id;
    }

    // Incrementa el último id para el nuevo producto
    const newId = lastId + 1;

    let codigo_de_barra, num_media;

    if (categoria === "bovino") {
      // Para categoría bovino
      codigo_de_barra = newId.toString().padStart(30, "0");
      num_media = codigo_de_barra.slice(-11);
    } else if (categoria === "porcino") {
      // Para categoría porcino
      codigo_de_barra = newId.toString().padStart(7, "0");
      num_media = codigo_de_barra;
    } else {
      // Categoría desconocida, manejar según tus requisitos
      throw new Error("Categoría desconocida");
    }

    res.json({ codigo_de_barra, num_media });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};


export {
  obtenerProductos,
  obtenerProductosPorFecha,
  obtenerProductoPorId,
  obtenerProductoCodigoBarra,
  obtenerProductoNumMedia,
  obtenerProductosCodigoBarra,
  obtenerProductosFiltradosSucursalFecha,
  crearProducto,
  actualizarDatosProducto,
  actualizarProducto,
  eliminarProducto,
  procesarDesdeExcel,
  generarCodigos
};
