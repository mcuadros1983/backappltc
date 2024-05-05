// productosController.js

import Producto from "../../models/gmedias/productoModel.js";

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
  // const { nombre, precio } = req.body;
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
      // Excluir createdAt y updatedAt
      if (key !== "createdAt" && key !== "updatedAt") {
        if (
          productoOriginal.hasOwnProperty(key) &&
          req.body[key] !== productoOriginal[key]
        ) {
          // Verificar si el valor es numérico antes de asignarlo a cambios
          const numericValue = parseFloat(req.body[key]);
          // Verificar si el valor numérico es un número válido
          if (!isNaN(numericValue)) {
            cambios[key] = numericValue;
          } else {
            // Si el valor no es numérico, lo asignamos tal cual
            cambios[key] = req.body[key];
          }
        }
      }
    }

    // Obtener el ingreso asociado al producto
    if (cambios.kg) {
      const ingreso = await Ingreso.findByPk(producto.ingreso_id);
      if (!ingreso) {
        return res.status(404).json({ mensaje: "Ingreso no encontrado" });
      }

      ingreso.peso_total = ingreso.peso_total - producto.kg + cambios.kg;
      await ingreso.save();
    }

    if (producto.orden_id || producto.venta_id) {
      if (producto.orden_id) {
        // Obtener la orden asociada al producto
        const orden = await Orden.findByPk(producto.orden_id);

        if (cambios.kg) {
          // Si se está modificando el campo 'kg', actualizar 'peso_total' en la orden
          orden.peso_total = orden.peso_total - producto.kg + cambios.kg;
          await orden.save();
        }

        if (cambios.sucursal_id) {
          // Si se está modificando el campo 'kg', actualizar 'peso_total' en la orden
          orden.sucursal_id = cambios.sucursal_id;
          await orden.save();
        }
      }
      if (producto.venta_id) {
        // Obtener la venta asociada al producto
        const venta = await Venta.findByPk(producto.venta_id);

        // Obtener la ctacte asociada a la venta
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
          // Ajustamos las ventas
          venta.peso_total = venta.peso_total - producto.kg + cambios.kg;
          venta.monto_total =
            venta.monto_total -
            producto.kg * producto.precio +
            cambios.kg * cambios.precio;
          await venta.save();

          // Ajustamos la cta cte y el detalle si existe
          if (ctacte) {
            const montoAnterior = producto.kg * producto.precio;
            const montoNuevo = cambios.kg * cambios.precio;
            ctacte.saldoActual =
              ctacte.saldoActual - montoAnterior + montoNuevo;
            detalleCtacte.monto =
              detalleCtacte.monto - montoAnterior + montoNuevo;
            await ctacte.save();
            await detalleCtacte.save();
          }
        } else if (cambios.kg) {
          // Ajustamos las ventas
          venta.peso_total = venta.peso_total - producto.kg + cambios.kg;
          const montoNuevo = cambios.kg * producto.precio;
          venta.monto_total =
            venta.monto_total - producto.kg * producto.precio + montoNuevo;
          await venta.save();

          // Ajustamos la cta cte y el detalle si existe
          if (ctacte) {
            const montoAnterior = producto.kg * producto.precio;
            const montoNuevo = cambios.kg * producto.precio;
            ctacte.saldoActual =
              ctacte.saldoActual - montoAnterior + montoNuevo;
            detalleCtacte.monto =
              detalleCtacte.monto - montoAnterior + montoNuevo;
            await ctacte.save();
            await detalleCtacte.save();
          }
        } else if (cambios.precio) {
          // Ajustamos las ventas
          const montoNuevo = producto.kg * cambios.precio;
          venta.monto_total =
            venta.monto_total - producto.kg * producto.precio + montoNuevo;
          await venta.save();

          // Ajustamos la cta cte y el detalle si existe
          if (ctacte) {
            const montoAnterior = producto.kg * producto.precio;
            const montoNuevo = producto.kg * cambios.precio;
            ctacte.saldoActual =
              ctacte.saldoActual - montoAnterior + montoNuevo;
            detalleCtacte.monto =
              detalleCtacte.monto - montoAnterior + montoNuevo;
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
          // Verificar si el valor es vacío
          if (obj[key] === "") {
            newObj[key] = null; // Asignar null si el valor es vacío
          } else {
            newObj[key] = obj[key]; // Mantener el valor original si no es vacío
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
    next(error);
  }
};


const actualizarDatosProducto = async (
  // categoria_producto,
  producto_id,
  orden_id,
  sucursal_id,
  cliente_id,
  // orden_id = null,
  // sucursal_id = null,
  // cliente_id = null,
  venta_id,
  precio,
  kg,
  tropa
  // detalleVenta_id,
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

const eliminarProducto = async (req, res, next) => {
  const productoId = req.params.productoId;

  try {
    const producto = await Producto.findByPk(productoId);

    if (!producto) {
      return res.status(404).json({ mensaje: "Producto no encontrado" });
    }

    if (
      producto.sucursal_id !== 18 ||
      producto.orden_id !== null ||
      producto.cliente_id !== null ||
      producto.venta_id !== null
    ) {
      return res.status(400).json({
        mensaje: "Producto no se puede eliminar, ya que ha salido del stock",
      });
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
  console.log("datosexcel", req.body);

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
      return res
        .status(400)
        .json({ mensaje: "No se ha subido ningún archivo." });
    }

    // Lee el archivo Excel
    const workbook = xlsx.readFile(req.file.path);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const data = xlsx.utils.sheet_to_json(sheet);

    // Obtiene los datos adicionales del cuerpo de la solicitud
    const { operacion, destino, formaPago } = req.body;

    // Calcula la cantidad total de productos
    const cantidad_total = data.length;

    // Calcula el peso total sumando los pesos de todos los productos
    const peso_total = data.reduce((total, row) => {
      if (row.kg) {
        return total + parseFloat(row.kg);
      } else {
        return total;
      }
    }, 0);

    const categoria = data[0].categoria;

    // Crea el ingreso
    const nuevoIngreso = await Ingreso.create({
      cantidad_total,
      peso_total,
      categoria_ingreso: categoria,
    });

    // Obtiene el ID del ingreso creado
    const ingreso_id = nuevoIngreso.id;

    // Consulta el último valor de id en ProductoId
    const lastProductId = await ProductoId.findOne({
      order: [["id", "DESC"]],
    });

    let lastId = 0;
    if (lastProductId) {
      lastId = lastProductId.id;
    }

    // Itera sobre los datos del archivo Excel
    const productosCreados = await Promise.all(
      data.map(async (row, index) => {
        try {
          // Incrementa el último id para el nuevo producto
          const newId = lastUsedId + index + 1;

          const { codigo_de_barra, num_media } = generarCodigoDeBarras(
            categoria,
            newId
          );

          // Aplica la lógica de checkAndReplaceEmpty
          const newData = verificarYReemplazarVacios({
            categoria_producto: row.categoria,
            // orden_id: row.orden_id,
            // sucursal_id: row.sucursal_id,
            // cliente_id: row.cliente_id,
            // venta_id: row.venta_id,
            ingreso_id,
            codigo_de_barra,
            num_media,
            garron: row.garron,
            precio: row.precio,
            costo: row.costo,
            kg: row.kg,
            tropa: row.tropa,
          });

          // Crea un nuevo producto asociado al ingreso
          const productoCreado = await Producto.create({
            ...newData,
            ingreso_id,
          });

          // Crear el registro en productoId con el id del producto creado
          const nuevoProductoId = await ProductoId.create({
            id: productoCreado.id,
            // productoId: nuevoProducto.id,
          });

          // Actualiza el lastUsedId con el último ID creado
          lastUsedId = productoCreado.id;

          return productoCreado;
        } catch (error) {
          console.error("Error al procesar producto desde Excel:", row, error);
          throw error; // Propaga el error para manejarlo en el bloque catch de Promise.all
        }
      })
    );

    // Elimina el archivo cargado después de procesarlo
    fs.unlinkSync(req.file.path);

    // Crea la venta u orden según el tipo
    if (operacion === "venta") {
      // Calcula el monto total de la venta (suma de productos: peso por precio)
      const montoTotal = productosCreados.reduce((total, producto) => {
        return total + producto.kg * producto.precio;
      }, 0);

      // Crea la venta
      if (formaPago == 2) {
        // Lógica para cuenta corriente
        // Crea o actualiza la cuenta corriente
        let cuentaCorriente = await obtenerCuentaCorrientePorIdCliente(destino);
        if (!cuentaCorriente) {
          cuentaCorriente = await crearCuentaCorriente(destino, montoTotal);
        } else {
          await actualizarCuentaCorrienteIdCliente(destino, montoTotal);
        }
        // Crea el detalle de la cuenta corriente
        await crearDetalleCuentaCorriente(cuentaCorriente.id, montoTotal);
      }

      // Crea la venta
      const nuevaVenta = await Venta.create({
        cantidad_total: cantidad_total,
        peso_total: peso_total, // Esto puede requerir ajustes dependiendo de la lógica de tu aplicación
        monto_total: montoTotal,
        cliente_id: destino,
        formaPago_id: formaPago,
      });

      console.log("venta --------------", nuevaVenta);

      // Actualiza los productos con el id de la venta
      const productosActualizados = await Promise.all(
        productosCreados.map(async (producto) => {
          producto.venta_id = nuevaVenta.id;
          producto.cliente_id = destino;
          producto.sucursal_id = null;
          return await producto.save();
        })
      );
    } else if (operacion === "orden") {
      // Crea la orden
      const nuevaOrden = await Orden.create({
        peso_total,
        cantidad_total,
        sucursal_id: destino,
      });

      // Actualiza los productos con el id de la orden
      const productosActualizados = await Promise.all(
        productosCreados.map(async (producto) => {
          producto.orden_id = nuevaOrden.id;
          producto.sucursal_id = destino;
          return await producto.save();
        })
      );
    }
    // Devuelve una respuesta exitosa con el nuevo ingreso y los productos creados
    return res.status(200).json({
      mensaje:
        "Los productos han sido creados correctamente desde el archivo Excel.",
      nuevoIngreso,
      productos: productosCreados,
    });
  } catch (error) {
    console.error("Error al crear productos desde Excel:", error);
    return res.status(500).json({
      mensaje: "Error al crear productos desde el archivo Excel.",
    });
  }
};

// Función para actualizar productos desde un archivo Excel
const actualizarProductosDesdeExcel = async (req, res, next) => {
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

    // Itera sobre los datos del archivo Excel
    for (const row of data) {
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

      // Busca el producto en la base de datos por su código de barras
      const producto = await Producto.findOne({
        where: { num_media: num_media },
      });

      if (producto) {
        // Busca el ingreso asociado al producto
        const ingreso = await Ingreso.findOne({
          where: { id: producto.ingreso_id },
        });

        // console.log("ingreso", ingreso, producto.kg, kg);
        if (kg !== undefined) {
          // Actualiza el peso total del ingreso
          ingreso.peso_total -= producto.kg; // Resta el peso del producto anterior
          ingreso.peso_total += kg; // Suma el peso del nuevo producto

          // Guarda los cambios en el ingreso
          await ingreso.save();
        }

        // Busca la orden asociada al producto
        if (producto.orden_id !== null && kg != undefined) {
          const orden = await Orden.findOne({
            where: { id: producto.orden_id },
          });

          // Actualiza el peso total del ingreso
          orden.peso_total -= producto.kg; // Resta el peso del producto anterior
          orden.peso_total += kg; // Suma el peso del nuevo producto

          // Guarda los cambios en el ingreso
          await orden.save();
        }

        // Busca la venta asociada al producto
        if (producto.venta_id !== null && kg !== undefined) {
          const venta = await Venta.findOne({
            where: { id: producto.venta_id },
          });
          if (venta) {
            // Actualiza el peso total del ingreso
            venta.peso_total -= producto.kg; // Resta el peso del producto anterior
            venta.monto_total -= producto.kg * producto.precio;
            venta.peso_total += kg; // Suma el peso del nuevo producto
            venta.monto_total += kg * precio;

            // Guarda los cambios en el ingreso
            await venta.save();
          }

          if (venta.formaPago_id == 2) {
            // Busca la ctacte asociada a la venta
            const ctacte = await CuentaCorriente.findOne({
              where: { cliente_id: venta.cliente_id },
            });
            // Actualiza el peso total del ingreso
            ctacte.saldoActual -= producto.kg * producto.precio;
            ctacte.saldoActual += kg * precio;

            // Guarda los cambios en el ingreso
            await ctacte.save();

            // Busca detallecuentacorriente asociada a la cuentacorrietne
            const detalleCtacte = await DetalleCuentaCorriente.findOne({
              where: { cuentaCorriente_id: ctacte.id },
            });
            // Actualiza el peso total del ingreso
            detalleCtacte.monto -= producto.kg * producto.precio;
            detalleCtacte.monto += kg * precio;

            // Guarda los cambios en el ingreso
            await detalleCtacte.save();
          }
        }

        if (garron) producto.garron = garron;
        if (precio) producto.precio = precio;
        if (costo) producto.costo = costo;
        if (kg) producto.kg = kg;
        if (tropa) producto.tropa = tropa;

        // Guarda los cambios en la base de datos
        await producto.save();
      }
    }

    // Elimina el archivo cargado después de procesarlo
    fs.unlinkSync(req.file.path);

    // Devuelve una respuesta exitosa
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
  console.log("categoria----------", req.body)
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
  obtenerProductoPorId,
  obtenerProductoCodigoBarra,
  obtenerProductosFiltradosSucursalFecha,
  crearProducto,
  actualizarDatosProducto,
  actualizarProducto,
  eliminarProducto,
  procesarDesdeExcel,
  generarCodigos
};
