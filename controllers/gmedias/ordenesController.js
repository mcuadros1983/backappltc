import Ingreso from "../../models/gmedias/ingresoModel.js";
import Orden from "../../models/gmedias/ordenModel.js";
import Producto from "../../models/gmedias/productoModel.js";
import Sucursal from "../../models/gmedias/sucursalModel.js";
import { actualizarDatosProducto } from "./productosController.js";
import { sequelize } from "../../config/database.js";
import { Op } from "sequelize";
import xlsx from "xlsx"; // Importa la librería para leer archivos Excel
import fs from "fs"; // Importa el módulo fs para manipulación de archivos

const obtenerOrdenes = async (req, res, next) => {
  try {
    const ordenes = await Orden.findAll({
      include: [
        {
          model: Sucursal,
          attributes: ["id", "nombre"], // Incluir solo las columnas necesarias de la sucursal
        },
        {
          model: Producto,
          attributes: [
            "id",
            "subcategoria",
            "codigo_de_barra",
            "num_media",
            "precio",
            "kg",
            "tropa",
          ],
        },
      ],
    });

    res.json(ordenes);
  } catch (error) {
    next(error);
  }
};

const obtenerOrdenesFiltradas = async (req, res, next) => {
  try {
    const { fechaDesde, fechaHasta, sucursalId, categoria, subcategoria } =
      req.body;

    // Define los filtros para la consulta
    const filters = {
      fecha: {
        [Op.between]: [fechaDesde, fechaHasta],
      },
    };

    // Si se proporciona el ID de sucursal, agrega el filtro por sucursal
    if (sucursalId) {
      filters.sucursal_id = sucursalId;
    }

    if (categoria) {
      filters.categoria = categoria;
    }

    if (subcategoria) {
      filters["$Productos.subcategoria$"] = subcategoria;
    }

    // Consultar las órdenes desde la base de datos
    const ordenes = await Orden.findAll({
      include: [
        {
          model: Sucursal,
          attributes: ["id", "nombre"],
        },
        {
          model: Producto,
          attributes: [
            "id",
            "subcategoria",
            "codigo_de_barra",
            "num_media",
            "precio",
            "kg",
            "tropa",
          ],
          as: "Productos", // Alias para la asociación
        },
      ],
      where: filters,
    });
    // console.log("ordenes", ordenes);

    // Calcular la suma de los campos 'kg' de los productos de las órdenes
    let sumaKg = 0;
    let productos = [];
    ordenes.forEach((orden) => {
      productos = [...productos, ...orden.Productos];
      orden.Productos.forEach((producto) => {
        sumaKg += Number(producto.kg);
      });
    });

    // Retornar los productos y la suma de los kg como respuesta
    res.status(200).json({ productos, sumaKg });
  } catch (error) {
    console.error("Error al obtener las órdenes filtradas:", error);
    next(error);
  }
};

const obtenerOrden = async (req, res, next) => {
  const { id } = req.params;
  try {
    const orden = await Orden.findOne({
      where: { id },
    });
    if (!orden) {
      return res.status(404).json({
        message: "Orden no encontrada",
      });
    }
    res.json(orden);
  } catch (error) {
    next(error);
  }
};
const crearOrden = async (req, res, next) => {
  try {
    const { products, peso_total, cantidad_total, selectedBranchId, fecha } =
      req.body;

    // Crear la orden sin iniciar una transacción explícita
    const nuevaOrden = await Orden.create({
      peso_total,
      cantidad_total,
      sucursal_id: selectedBranchId,
      fecha: fecha,
    });

    const orden_id = nuevaOrden.id;

    // Actualizar los productos y el ingreso asociado sin usar transacción explícita
    const productosActualizados = await Promise.all(
      products.map(async (product) => {
        const tropa = product.tropa || 0;

        const producto = await Producto.findByPk(product.id);
        if (producto && producto.ingreso_id !== null) {
          const ingreso = await Ingreso.findByPk(producto.ingreso_id);
          // console.log("ingreso", ingreso)
          if (ingreso) {
            // Convertir peso_total a número (manejar NaN con un valor predeterminado de 0)
            let pesoTotalActual = parseFloat(ingreso.peso_total) || 0;
            const kgAnterior = parseFloat(producto.kg) || 0;
            const kgNuevo = parseFloat(product.kg) || 0;

            console.log("Peso total actual:", pesoTotalActual);
            console.log("Peso del producto anterior (kg):", kgAnterior);
            console.log("Peso del producto nuevo (kg):", kgNuevo);

            // Realizar la suma y resta
            pesoTotalActual -= Number(kgAnterior);
            pesoTotalActual += Number(kgNuevo);

            // Actualizar el ingreso con el nuevo peso_total
            ingreso.peso_total = pesoTotalActual.toString(); // Guardar como string si la base lo requiere
            console.log("Peso total actualizado:", ingreso.peso_total);

            // Guardar los cambios
            await ingreso.save();
          }
        }

        return await actualizarDatosProducto(
          product.id,
          orden_id,
          selectedBranchId,
          null,
          null,
          product.precio,
          product.kg,
          tropa,
          fecha
        );
      })
    );

    res.json({ nuevaOrden, productosActualizados });
  } catch (error) {
    next(error);
  }
};

const obtenerProductosOrden = async (req, res, next) => {
  const { id } = req.params;
  try {
    const productos = await Producto.findAll({
      where: { orden_id: id },
    });

    res.json(productos);
  } catch (error) {
    next(error);
  }
};

const actualizarOrden = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { sucursal_id, fecha } = req.body;

    // Buscar la orden por su ID
    const orden = await Orden.findByPk(id);

    // Verificar si la orden existe
    if (!orden) {
      return res.status(404).json({ message: "La orden no existe" });
    }

    if (fecha) {
      orden.fecha = fecha;
    }

    // Actualizar la propiedad sucursal_id de la orden
    orden.sucursal_id = sucursal_id;

    // Guardar la orden actualizada
    await orden.save();

    // Actualizar la propiedad sucursal_id de los productos asociados a la orden
    const productos = await Producto.findAll({ where: { orden_id: orden.id } });
    await Promise.all(
      productos.map(async (producto) => {
        producto.sucursal_id = sucursal_id;
        await producto.save();
      })
    );

    res.json(orden);
  } catch (error) {
    next(error);
  }
};

const eliminarOrden = async (req, res, next) => {
  try {
    const { id } = req.params;
    const productos = await Producto.findAll({
      where: { orden_id: id },
    });

    const productosActualizados = await Promise.all(
      productos.map(async (product) => {
        // Buscar el producto para obtener el ingreso_id
        const producto = await Producto.findByPk(product.id);

        // Verificar si el producto y el ingreso existen y si la categoría del producto es porcino
        if (
          producto &&
          producto.ingreso_id !== null &&
          producto.categoria_producto == "porcino"
        ) {
          const ingreso = await Ingreso.findByPk(producto.ingreso_id);
          // if (ingreso) {
          //   ingreso.peso_total -= product.kg; // Restar el peso del producto
          //   await ingreso.save();
          // }
          // Actualizar el producto con los nuevos valores
          return await actualizarDatosProducto(
            product.id,
            null,
            product.ingreso_id === null ? 32 : 18,
            null,
            null,
            product.precio ? product.precio : 0,
            product.kg ? product.kg : 0,
            product.tropa ? product.tropa : 0,
            product.fecha

            // producto_id,
            // orden_id,
            // sucursal_id,
            // cliente_id,
            // venta_id,
            // precio,
            // kg,
            // tropa
          );
        } else {
          // Si la categoría del producto no es porcino, simplemente actualiza el producto sin modificar el ingreso
          return await actualizarDatosProducto(
            product.id,
            null,
            producto.ingreso_id === null ? 32 : 18,
            null,
            null,
            product.precio ? product.precio : 0,
            product.kg ? product.kg : 0,
            product.tropa ? product.tropa : 0,
            product.fecha

          );
        }
      })
    );

    // Eliminar la orden después de actualizar los productos
    await Orden.destroy({
      where: { id },
    });

    // Respuesta de éxito indicando que la orden se eliminó correctamente
    res.sendStatus(204);
  } catch (error) {
    next(error);
  }
};

const eliminarProductoOrden = async (req, res, next) => {
  try {
    // const { id } = req.params;
    const { productId } = req.body;
    // Buscar el producto por su ID
    const producto = await Producto.findByPk(productId);

    // Verificar si la orden existe
    if (!producto) {
      return res.status(404).json({ message: "el producto no existe" });
    }

    // Buscar la orden por su ID
    const orden = await Orden.findByPk(producto.orden_id);

    // Verificar si la orden existe
    if (!orden) {
      return res.status(404).json({ message: "La orden no existe" });
    }
    orden.peso_total = Number(orden.peso_total) - Number(producto.kg);
    orden.cantidad_total = Number(orden.cantidad_total) - 1;

    if (orden.cantidad_total == 0) {
      await orden.destroy();
    } else {
      await orden.save();
    }

    if (producto.categoria_producto === "porcino") {
      producto.kg = 0;
    }
    producto.orden_id = null;
    producto.sucursal_id = producto.ingreso_id ? 18 : 32;
    await producto.save();

    res.json(orden);
  } catch (error) {
    next(error);
  }
};

const fetchOrderCreatedAt = async (req, res) => {
  const { ordenId } = req.params;

  try {
    // Buscar la venta en la base de datos por el ID de la sucursal
    const orden = await Orden.findOne({ where: { id: ordenId } });

    if (!orden) {
      // Manejar el caso si la venta no se encuentra
      return null;
    }

    // Devolver la fecha de creación de la venta
    res.json(orden.fecha);
  } catch (error) {
    console.error("Error al obtener la fecha de creación de la orden:", error);
    throw error;
  }
};

const obtenerCantidadMediasBovino = async (req, res, next) => {
  console.log("obtener cantidades....");
  try {
    const { fechaDesde, fechaHasta, sucursalId } = req.body;

    if (!fechaDesde || !fechaHasta || !sucursalId) {
      return res.status(400).json({ error: "Faltan parámetros requeridos." });
    }

    const ordenes = await Orden.findAll({
      where: {
        fecha: {
          [Op.between]: [fechaDesde, fechaHasta],
        },
        sucursal_id: sucursalId,
      },
      include: [
        {
          model: Producto,
          as: "Productos",
          where: {
            categoria_producto: "bovino",
          },
          attributes: ["num_media"],
        },
      ],
    });

    let sumaMedias = 0;
    ordenes.forEach((orden) => {
      sumaMedias += orden.Productos.length;
    });

    res.json({ cantidadMedias: sumaMedias });
  } catch (error) {
    console.error("Error al obtener cantidad de medias bovino:", error);
    next(error);
  }
};

const obtenerCostoPromedio = async (req, res, next) => {
  try {
    const { fechaDesde, fechaHasta, sucursalId, totalKg } = req.body;

    if (!fechaDesde || !fechaHasta || !sucursalId || !totalKg) {
      return res.status(400).json({ error: "Faltan parámetros requeridos." });
    }

    const ordenes = await Orden.findAll({
      where: {
        fecha: {
          [Op.between]: [fechaDesde, fechaHasta],
        },
        sucursal_id: sucursalId,
      },
      include: [
        {
          model: Producto,
          as: "Productos",
          where: {
            categoria_producto: "bovino",
          },
          attributes: ["kg", "costo"],
        },
      ],
    });

    let sumaCostoTotal = 0;
    ordenes.forEach((orden) => {
      orden.Productos.forEach((producto) => {
        const kg = parseFloat(producto.kg) || 0;
        const costo = parseFloat(producto.costo) || 0;
        sumaCostoTotal += kg * costo;
      });
    });

    const costoPromedio = sumaCostoTotal / parseFloat(totalKg || 1);

    res.json({ costoPromedio });
  } catch (error) {
    console.error("Error al calcular costo promedio:", error);
    next(error);
  }
};

const obtenerCostoVacunoTotal = async (req, res, next) => {
  try {
    const { fechaDesde, fechaHasta, sucursalId } = req.body;

    if (!fechaDesde || !fechaHasta || !sucursalId) {
      return res.status(400).json({ error: "Faltan parámetros requeridos." });
    }

    const ordenes = await Orden.findAll({
      where: {
        fecha: {
          [Op.between]: [fechaDesde, fechaHasta],
        },
        sucursal_id: sucursalId,
      },
      include: [
        {
          model: Producto,
          as: "Productos",
          where: {
            categoria_producto: "bovino",
          },
          attributes: ["kg", "costo"],
        },
      ],
    });

    let costoTotalVacuno = 0;
    ordenes.forEach((orden) => {
      orden.Productos.forEach((producto) => {
        const kg = parseFloat(producto.kg) || 0;
        const costo = parseFloat(producto.costo) || 0;
        costoTotalVacuno += kg * costo;
      });
    });

    res.json({ costoTotalVacuno });
  } catch (error) {
    console.error("Error al obtener costo vacuno total:", error);
    next(error);
  }
};


const obtenerCostoPorcinoTotal = async (req, res, next) => {
  try {
    const { fechaDesde, fechaHasta, sucursalId } = req.body;

    if (!fechaDesde || !fechaHasta || !sucursalId) {
      return res.status(400).json({ error: "Faltan parámetros requeridos." });
    }

    const ordenes = await Orden.findAll({
      where: {
        fecha: {
          [Op.between]: [fechaDesde, fechaHasta],
        },
        sucursal_id: sucursalId,
      },
      include: [
        {
          model: Producto,
          as: "Productos",
          where: {
            categoria_producto: "porcino",
          },
          attributes: ["kg", "costo"],
        },
      ],
    });

    let costoTotalPorcino = 0;
    ordenes.forEach((orden) => {
      orden.Productos.forEach((producto) => {
        const kg = parseFloat(producto.kg) || 0;
        const costo = parseFloat(producto.costo) || 0;
        costoTotalPorcino += kg * costo;
      });
    });

    res.json({ costoTotalPorcino });
  } catch (error) {
    console.error("Error al obtener costo porcino total:", error);
    next(error);
  }
};


// Función para convertir fechas desde Excel a 'YYYY-MM-DD'
const convertirFechaExcel = (valorFecha) => {
  if (typeof valorFecha === "number") {
    const fechaBase = new Date(1900, 0, 1);
    fechaBase.setDate(fechaBase.getDate() + valorFecha - 2); // Ajuste por bug histórico de Excel
    return fechaBase.toISOString().split("T")[0];
  } else if (typeof valorFecha === "string") {
    const date = new Date(valorFecha);
    if (!isNaN(date)) {
      return date.toISOString().split("T")[0];
    }
  }
  return null;
};

// Función para generar código único de barra / num_media
const generarCodigoUnico = async () => {
  let intento = 0;
  let codigo;
  let existe;

  do {
    const aleatorio = Math.floor(Math.random() * 1000000);
    const tiempo = Date.now();
    codigo = `${tiempo}${aleatorio}`.slice(-13);
    existe = await Producto.findOne({ where: { codigo_de_barra: codigo } });
    intento++;
    if (intento > 10) throw new Error("No se pudo generar un código único");
  } while (existe);

  return codigo;
};

const crearOrdenesDesdeExcel = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ mensaje: "No se ha subido ningún archivo." });
    }

    const { categoria, subcategoria } = req.body;

    if (!categoria || !subcategoria) {
      return res.status(400).json({ mensaje: "Faltan 'categoria' o 'subcategoria' en el body." });
    }

    const workbook = xlsx.readFile(req.file.path);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = xlsx.utils.sheet_to_json(sheet);

    const camposEsperados = ["fecha", "sucursaldestino_codigo", "tropa", "kg", "costo"];
    const errores = [];

    for (let i = 0; i < data.length; i++) {
      const fila = data[i];
      for (const campo of camposEsperados) {
        if (!fila[campo]) {
          errores.push(`Fila ${i + 2} sin campo obligatorio: ${campo}`);
        }
      }
    }

    if (errores.length > 0) {
      if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
      return res.status(400).json({ mensaje: "Errores en el archivo", errores });
    }

    // Agrupar por fecha+codigoSucursal
    const productosPorGrupo = {};
    data.forEach((item) => {
      const fecha = convertirFechaExcel(item.fecha);
      const clave = `${fecha}_${item.sucursaldestino_codigo}`;
      if (!productosPorGrupo[clave]) {
        productosPorGrupo[clave] = [];
      }
      productosPorGrupo[clave].push({ ...item, fechaConvertida: fecha });
    });

    const ordenesCreadas = [];

    for (const clave in productosPorGrupo) {
      const grupo = productosPorGrupo[clave];
      const { fechaConvertida, sucursaldestino_codigo } = grupo[0];
      const codigoSucursal = String(sucursaldestino_codigo).trim();

      const sucursal = await Sucursal.findOne({ where: { codigo: codigoSucursal } });
      if (!sucursal) continue;

      let peso_total = 0;
      const productos = [];

      for (const fila of grupo) {
        const codigo = await generarCodigoUnico();

        const producto = await Producto.create({
          categoria_producto: categoria,
          subcategoria: subcategoria,
          costo: parseFloat(fila.costo),
          kg: parseFloat(fila.kg),
          tropa: fila.tropa.toString(),
          sucursal_id: sucursal.id,
          fecha: fila.fechaConvertida,
          codigo_de_barra: codigo,
          num_media: codigo,
        });

        productos.push(producto);
        peso_total += parseFloat(fila.kg);
      }

      const nuevaOrden = await Orden.create({
        cantidad_total: productos.length,
        peso_total,
        sucursal_id: sucursal.id,
        fecha: grupo[0].fechaConvertida,
      });

      await Promise.all(
        productos.map(async (p) => {
          p.orden_id = nuevaOrden.id;
          await p.save();
        })
      );

      ordenesCreadas.push({
        fecha: grupo[0].fechaConvertida,
        sucursal: sucursal.nombre,
        orden_id: nuevaOrden.id,
        productos: productos.map((p) => p.id),
      });
    }

    if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);

    return res.status(200).json({
      mensaje: "Órdenes y productos creados correctamente.",
      ordenes: ordenesCreadas,
    });

  } catch (error) {
    console.error("Error en crearOrdenesDesdeExcel:", error);
    if (fs.existsSync(req.file?.path)) fs.unlinkSync(req.file.path);
    return res.status(500).json({ mensaje: "Error al procesar archivo Excel." });
  }
};


export {
  obtenerOrdenes,
  obtenerOrdenesFiltradas,
  obtenerOrden,
  crearOrden,
  obtenerProductosOrden,
  actualizarOrden,
  eliminarOrden,
  eliminarProductoOrden,
  fetchOrderCreatedAt,
  obtenerCantidadMediasBovino,
  obtenerCostoPromedio,
  obtenerCostoVacunoTotal,
  obtenerCostoPorcinoTotal,
  crearOrdenesDesdeExcel
};
