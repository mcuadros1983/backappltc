import Ingreso from "../../models/gmedias/ingresoModel.js";
import Orden from "../../models/gmedias/ordenModel.js";
import Producto from "../../models/gmedias/productoModel.js";
import Sucursal from "../../models/gmedias/sucursalModel.js";
import { actualizarDatosProducto } from "./productosController.js";
import { sequelize } from "../../config/database.js";
import { Op } from "sequelize";

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
        sumaKg += producto.kg;
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
    const { products, peso_total, cantidad_total, selectedBranchId, fecha } = req.body;

    // Crear la orden sin iniciar una transacción explícita
    const nuevaOrden = await Orden.create({
      peso_total,
      cantidad_total,
      sucursal_id: selectedBranchId,
      fecha:fecha,
    });

    const orden_id = nuevaOrden.id;

    // Actualizar los productos y el ingreso asociado sin usar transacción explícita
    const productosActualizados = await Promise.all(
      products.map(async (product) => {
        const tropa = product.tropa || 0;

        const producto = await Producto.findByPk(product.id);
        if (producto && producto.ingreso_id !== null) {
          const ingreso = await Ingreso.findByPk(producto.ingreso_id);
          if (ingreso) {
            ingreso.peso_total -= producto.kg;
            ingreso.peso_total += product.kg;
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
          tropa
        );
      })
    );

    res.json({ nuevaOrden, productosActualizados });
  } catch (error) {
    next(error);
  }
};

const obenerProductosOrden = async (req, res, next) => {
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
          if (ingreso) {
            ingreso.peso_total -= product.kg; // Restar el peso del producto
            await ingreso.save();
          }
          // Actualizar el producto con los nuevos valores
          return await actualizarDatosProducto(
            product.id,
            null,
            18,
            null,
            null,
            0,
            0
          );
        } else {
          // Si la categoría del producto no es porcino, simplemente actualiza el producto sin modificar el ingreso
          return await actualizarDatosProducto(
            product.id,
            null,
            18,
            null,
            null
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
    orden.peso_total = orden.peso_total - producto.kg;
    orden.cantidad_total = orden.cantidad_total - 1;

    if (orden.cantidad_total == 0) {
      await orden.destroy();
    } else {
      await orden.save();
    }

    if (producto.categoria_producto === "porcino") {
      producto.kg = 0;
    }
    producto.orden_id = null;
    producto.sucursal_id = 18;
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

export {
  obtenerOrdenes,
  obtenerOrdenesFiltradas,
  obtenerOrden,
  crearOrden,
  obenerProductosOrden,
  actualizarOrden,
  eliminarOrden,
  eliminarProductoOrden,
  fetchOrderCreatedAt,
};
