import { sequelize } from "../../config/database.js";
import InventarioMovimientoInterno from "../../models/rinde/inventarioMovimientoInternoModel.js";
import Inventario from "../../models/rinde/inventarioModel.js";
import InventarioArticulo from "../../models/rinde/inventarioArticuloModel.js";
import InventarioInventarioArticulo from "../../models/rinde/inventarioInventarioArticuloModel.js";
import { Op } from "sequelize";
import ArticuloPrecioTabla from "../../models/tablas/articuloPrecioModel.js";
import ArticuloTabla from "../../models/tablas/articuloModel.js";
import Rinde from "../../models/rinde/rindeModel.js";
import Formula from "../../models/rinde/formulaModel.js";
import FormulaArticulo from "../../models/rinde/formulaArticuloModel.js";
import FormulaFormulaArticulo from "../../models/rinde/formulaFormulaArticuloModel.js";
import Orden from "../../models/gmedias/ordenModel.js";
import Sucursal from "../../models/gmedias/sucursalModel.js";
import Producto from "../../models/gmedias/productoModel.js";
import { obtenerCantidadPorArticulo } from "./ventasRindeController.js";
import ArticuloPorcentajetabla from "../../models/tablas/articuloPorcentajeModel.js";
import VentaArticulo from "../../models/rinde/ventaArticuloModel.js";
import AjusteRinde from "../../models/rinde/ajusteRindeModel.js";

const obtenerMovimientosFiltrados = async (req, res, next) => {
  try {
    const { fechaDesde, fechaHasta, sucursalId } = req.body;

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

    // Consultar los movimientos internos desde la base de datos
    const movimientos = await InventarioMovimientoInterno.findAll({
      where: filters,
    });

    // Retornar los movimientos como respuesta
    res.status(200).json(movimientos);
  } catch (error) {
    console.error("Error al listar los movimientos filtrados:", error);
    next(error);
  }
};

const obtenerMontoMovimientosFiltrados = async (req, res, next) => {
  try {
    const { fechaDesde, fechaHasta, sucursalId } = req.body;

    // console.log("req.boyd", req.body)

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

    // console.log("filters", filters)

    // Consultar los movimientos internos desde la base de datos
    const movimientos = await InventarioMovimientoInterno.findAll({
      where: filters,
    });

    // Mapa para almacenar el precio de cada artículo
    const preciosArticulos = new Map();

    // Recorrer los movimientos para calcular el total
    let montoTotalMovimientos = 0;

    for (const movimiento of movimientos) {
      // Obtener el precio del artículo desde el mapa si ya fue buscado antes
      let precioArticulo = preciosArticulos.get(movimiento.articulocodigo);

      // Si no se ha buscado antes, buscarlo en la base de datos y almacenarlo en el mapa
      if (!precioArticulo) {
        const precio = await buscarPrecioArticulo(movimiento.articulocodigo);
        if (precio) {
          preciosArticulos.set(movimiento.articulocodigo, precio);
          precioArticulo = precio;
        }
      }

      // Si se encuentra el precio del artículo, calcular el monto del movimiento
      if (precioArticulo) {
        const cantidad = parseFloat(movimiento.cantidad);
        const tipoMovimiento = movimiento.tipo.toLowerCase();

        // Restar la cantidad para movimientos de entrada y sumarla para movimientos de salida
        if (tipoMovimiento === "entrada") {
          montoTotalMovimientos -= cantidad * precioArticulo;
        } else if (tipoMovimiento === "salida") {
          montoTotalMovimientos += cantidad * precioArticulo;
        }
      }
    }

    // Retornar el monto total de los movimientos como respuesta
    res.status(200).json({ montoTotalMovimientos });
  } catch (error) {
    console.error("Error al listar los movimientos filtrados:", error);
    next(error);
  }
};

const obtenerUltimoIdMovimiento = async () => {
  try {
    // Consulta utilizando Sequelize para obtener el último ID de todos los movimientos
    const resultado = await InventarioMovimientoInterno.findOne({
      attributes: [[sequelize.fn("MAX", sequelize.col("id")), "id"]],
    });

    // Obtener el último ID de movimiento
    const ultimoIdMovimiento = resultado ? resultado.id : null;

    return ultimoIdMovimiento;
  } catch (error) {
    console.error("Error al obtener el último ID de movimiento:", error);
    throw error;
  }
};

// Función para buscar el precio de un artículo en la base de datos
async function buscarPrecioArticulo(articuloCodigo) {
  try {
    // Buscar el precio del artículo en la tabla de precios de artículos (ArticuloPrecioTabla)
    const precioArticulo = await ArticuloPrecioTabla.findOne({
      include: [
        {
          model: ArticuloTabla,
          where: {
            codigobarra: articuloCodigo,
          },
        },
      ],
    });

    // Retornar el precio del artículo si se encuentra
    return precioArticulo ? parseFloat(precioArticulo.precio) : null;
  } catch (error) {
    console.error("Error al buscar el precio del artículo:", error);
    return null;
  }
}

const eliminarMovimientoInterno = async (req, res, next) => {
  try {
    const { movimientoId } = req.params;

    // Buscar el movimiento interno por su ID
    const movimiento = await InventarioMovimientoInterno.findByPk(movimientoId);

    // Verificar si el movimiento existe
    if (!movimiento) {
      return res
        .status(404)
        .json({ message: "Movimiento interno no encontrado" });
    }

    // Eliminar el movimiento interno de la base de datos
    await movimiento.destroy();

    // Devolver una respuesta exitosa
    res
      .status(200)
      .json({ message: "Movimiento interno eliminado exitosamente" });
  } catch (error) {
    console.error("Error al eliminar el movimiento interno:", error);
    next(error);
  }
};

const crearMovimientoInterno = async (req, res, next) => {
  try {
    // Obtener los movimientos internos desde el cuerpo de la solicitud
    const movimientos = Array.isArray(req.body) ? req.body : [req.body];
    // console.log("movimentos", movimientos[0]);

    // Obtener el último ID de movimiento
    const ultimoIdMovimiento = await obtenerUltimoIdMovimiento();
    // console.log("ultimo", ultimoIdMovimiento);

    // Filtrar los movimientos para mantener solo aquellos que tienen un ID mayor que el último ID de movimiento
    const movimientosParaCrear = movimientos.filter(
      (movimiento) => movimiento.id > ultimoIdMovimiento
    );

    // Crear los movimientos internos en la base de datos
    const nuevosMovimientos = await InventarioMovimientoInterno.bulkCreate(
      movimientosParaCrear
    );

    // Retornar los nuevos movimientos internos creados como respuesta
    res.status(201).json(nuevosMovimientos);
  } catch (error) {
    console.error("Error al crear los movimientos internos:", error);
    next(error);
  }
};

const crearInventario = async (req, res, next) => {
  try {
    // Obtener los datos del cuerpo de la solicitud
    const inventarios = req.body;

    // Array para almacenar los nuevos inventarios creados
    const nuevosInventarios = [];

    // Procesar cada inventario
    for (const inventario of inventarios) {
      const { anio, fecha, mes, total, sucursal_id, usuario_id, articulos } =
        inventario;

      // Verificar si ya existe un inventario para el mes, año y sucursal indicados
      const inventarioExistente = await Inventario.findOne({
        where: {
          anio: anio,
          mes: mes,
          sucursal_id: sucursal_id,
        },
      });

      if (inventarioExistente) {
        return res.status(400).json({
          message:
            "Ya existe un inventario para el mes y el año indicado en la sucursal especificada.",
        });
      }

      // Crear el inventario en la base de datos
      const nuevoInventario = await Inventario.create({
        // id,
        anio,
        fecha,
        mes,
        total,
        sucursal_id,
        usuario_id,
      });

      // Verificar si hay articulos
      if (articulos && articulos.length > 0) {
        // Crear los artículos asociados al inventario y sus relaciones con la tabla intermedia
        const articulosPromises = articulos.map(async (articulo) => {
          const nuevoArticulo = await InventarioArticulo.create({
            articulocodigo: articulo.articulocodigo,
            articulodescripcion: articulo.articulodescripcion,
            cantidadpeso: articulo.cantidadpeso,
            precio: 0,
            inventario_id: nuevoInventario.id, // Asociar el artículo al inventario recién creado
          });
          // Crear la relación con la tabla intermedia
          await InventarioInventarioArticulo.create({
            inventario_id: nuevoInventario.id,
            ventasarticulos_id: nuevoArticulo.id,
          });
        });

        // Esperar a que todas las promesas de creación de artículos se completen
        await Promise.all(articulosPromises);
      }

      // Agregar el nuevo inventario al array
      nuevosInventarios.push(nuevoInventario);
    }

    // Enviar una respuesta exitosa
    res.status(201).json({
      message: "Inventarios creados exitosamente",
      inventarios: nuevosInventarios,
    });
  } catch (error) {
    console.error("Error al crear los inventarios:", error);
    next(error);
  }
};

const listarInventarios = async (req, res, next) => {
  try {
    // Consultar todos los inventarios desde la base de datos
    const inventarios = await Inventario.findAll();
    // Retornar los inventarios como respuesta
    res.status(200).json(inventarios);
  } catch (error) {
    console.error("Error al listar los inventarios:", error);
    next(error);
  }
};

const obtenerInventarios = async (req, res, next) => {
  try {
    // Consultar todos los inventarios desde la base de datos
    const inventarios = await Inventario.findAll({
      include: [
        {
          model: InventarioArticulo,
          through: {
            model: InventarioInventarioArticulo,
            attributes: [], // No queremos obtener los atributos de la tabla intermedia
          },
        },
      ],
    });

    // Retornar los inventarios como respuesta
    res.status(200).json(inventarios);
  } catch (error) {
    console.error("Error al listar los inventarios:", error);
    next(error);
  }
};

const obtenerInventariosFiltrados = async (req, res, next) => {
  try {
    let { sucursalId } = req.body;
    let { fechaDesde, fechaHasta, mes, anio } = req.body;

    let filters = {};

    if (mes) {
      filters.mes = mes;
    }

    if (anio) {
      filters.anio = anio;
    }

    // Si se proporciona el ID de sucursal, agrega el filtro por sucursal
    if (sucursalId) {
      filters.sucursal_id = sucursalId;
    }

    // Si se proporciona la fecha de inicio y la fecha de fin, agrega el filtro por fecha
    if (fechaDesde && fechaHasta) {
      // Convertir las fechas a objetos Date
      // const fechaInicio = new Date(fechaDesde);
      // const fechaFin = new Date(fechaHasta);

      // Incrementar la fecha final en un día para que incluya el rango completo
      // fechaFin.setDate(fechaFin.getDate() + 1);

      // Agregar el filtro de fecha al objeto de filtros
      filters.fecha = {
        [Op.between]: [fechaDesde, fechaHasta],
      };
    }

    // Consultar todos los inventarios desde la base de datos con los filtros definidos
    const inventarios = await Inventario.findAll({
      include: [
        {
          model: InventarioArticulo,
          through: {
            model: InventarioInventarioArticulo,
            attributes: [], // No queremos obtener los atributos de la tabla intermedia
          },
        },
      ],
      where: filters,
    });

    // Retornar los inventarios como respuesta
    res.status(200).json(inventarios);
  } catch (error) {
    console.error("Error al listar los inventarios filtrados:", error);
    next(error);
  }
};

const obtenerMontoInventariosFiltrados = async (req, res, next) => {
  try {
    let { sucursalId } = req.body;
    let { fechaDesde, fechaHasta } = req.body;

    let filters = {};

    // Si se proporciona el ID de sucursal, agrega el filtro por sucursal
    if (sucursalId) {
      filters.sucursal_id = sucursalId;
    }

    // Si se proporciona la fecha de inicio y la fecha de fin, agrega el filtro por fecha
    if (fechaDesde && fechaHasta) {
      // Convertir las fechas a objetos Date
      // const fechaInicio = new Date(fechaDesde);
      // const fechaFin = new Date(fechaHasta);

      // Incrementar la fecha final en un día para que incluya el rango completo
      // fechaFin.setDate(fechaFin.getDate() + 1);

      // Agregar el filtro de fecha al objeto de filtros
      filters.fecha = {
        [Op.between]: [fechaDesde, fechaHasta],
      };
    }

    // Consultar todos los inventarios desde la base de datos con los filtros definidos
    const inventarios = await Inventario.findAll({
      include: [
        {
          model: InventarioArticulo,
          through: {
            model: InventarioInventarioArticulo,
            attributes: [], // No queremos obtener los atributos de la tabla intermedia
          },
        },
      ],
      where: filters,
    });

    // Calcular el monto total de cada inventario
    for (const inventario of inventarios) {
      let montoTotalInventario = 0;
      for (const inventarioArticulo of inventario.Inventario_articulos) {
        const precioArticulo = await buscarPrecioArticulo(
          inventarioArticulo.articulocodigo
        );
        if (precioArticulo !== null) {
          // Si se encuentra el precio, calcular el monto del artículo y sumarlo al total del inventario
          montoTotalInventario +=
            precioArticulo * inventarioArticulo.cantidadpeso;
        }
      }
      // Agregar el monto total al objeto del inventario
      inventario.total = montoTotalInventario / 1.4;
    }
    //    console.log("inventarios", inventarios);

    // Retornar los inventarios como respuesta
    res.status(200).json(inventarios);
  } catch (error) {
    console.error("Error al listar los inventarios filtrados:", error);
    next(error);
  }
};

// const obtenerMontoInventariosFiltrados = async (req, res, next) => {
//   try {
//     let { sucursalId } = req.body;
//     let { fechaDesde, fechaHasta } = req.body;
//     const subcategoriasExcluidas = [9, 13, 16, 17];

//     let filters = {};

//     // Filtros por sucursal
//     if (sucursalId) {
//       filters.sucursal_id = sucursalId;
//     }

//     // Filtros por fecha
//     if (fechaDesde && fechaHasta) {
//       const fechaInicio = new Date(fechaDesde);
//       const fechaFin = new Date(fechaHasta);
//       fechaFin.setDate(fechaFin.getDate() + 1);
//       filters.fecha = {
//         [Op.between]: [fechaInicio, fechaFin],
//       };
//     }

//     // Consultar todos los inventarios con los filtros definidos
//     const inventarios = await Inventario.findAll({
//       where: filters,
//       include: [{
//         model: InventarioArticulo,
//         through: {
//           model: InventarioInventarioArticulo,
//           attributes: []
//         }
//       }]
//     });

//     // Calcular el monto total de cada inventario, excluyendo ciertas subcategorías
//     for (const inventario of inventarios) {
//       let montoTotalInventario = 0;
//       for (const inventarioArticulo of inventario.Inventario_articulos) {
//         // Obtener detalles del artículo usando la API
//         const response = await fetch(`http://localhost:4000/obtenerarticulos/${inventarioArticulo.articulocodigo}`);
//         const articulo = await response.json();

//         // Continuar si el artículo está en una subcategoría excluida
//         if (subcategoriasExcluidas.includes(articulo.subcategoria_id)) {
//           continue;
//         }

//         // Sumar el precio * cantidad si el artículo no está excluido
//         if (articulo.precio !== null) {
//           montoTotalInventario += articulo.precio * inventarioArticulo.cantidadpeso;
//         }
//       }
//       // Agregar el monto total al objeto del inventario
//       inventario.total = montoTotalInventario;
//     }

//     // Enviar la respuesta con los inventarios
//     res.status(200).json(inventarios);
//   } catch (error) {
//     console.error("Error al listar los inventarios filtrados:", error);
//     next(error);
//   }
// };

const listarInventariosArticulos = async (req, res, next) => {
  try {
    // Obtener el ID del inventario desde la solicitud
    const { inventarioId } = req.params;

    // Consultar los artículos del inventario específico
    const inventario = await Inventario.findByPk(inventarioId, {
      include: [
        { model: InventarioArticulo, through: InventarioInventarioArticulo },
      ],
    });

    ///console.log("inventarioarticulos", inventario.Inventario_articulos);

    if (!inventario) {
      return res.status(404).json({ message: "Inventario no encontrado" });
    }

    // Retornar los artículos del inventario como respuesta
    res.json(inventario.Inventario_articulos);
  } catch (error) {
    console.error("Error al obtener los artículos del inventario:", error);
    next(error);
  }
};

const eliminarInventario = async (req, res, next) => {
  try {
    // Obtener el ID del inventario desde la solicitud
    const { inventarioId } = req.params;

    // Obtener los IDs de los artículos asociados al inventario
    const articulosIds = await InventarioInventarioArticulo.findAll({
      where: { inventario_id: parseInt(inventarioId) },
      attributes: ["ventasarticulos_id"], // Obtener solo los IDs de los artículos
      raw: true,
    });
    const idsToDelete = articulosIds.map((item) => item.ventasarticulos_id);

    // Eliminar los registros de la tabla intermedia
    await InventarioInventarioArticulo.destroy({
      where: { inventario_id: inventarioId },
    });

    // Eliminar los artículos del inventario
    await InventarioArticulo.destroy({
      where: { id: idsToDelete }, // Eliminar por los IDs obtenidos
    });

    // Eliminar el inventario
    await Inventario.destroy({
      where: { id: inventarioId },
    });

    // Enviar una respuesta exitosa
    res.json({ message: "Inventario eliminado exitosamente" });
  } catch (error) {
    console.error("Error al eliminar el inventario:", error);
    next(error);
  }
};

// const crearRinde = async (req, res, next) => {
//   try {
//     // Extraer los datos del cuerpo de la solicitud
//     const {
//       fechaDesde,
//       fechaHasta,
//       mes,
//       anio,
//       sucursal_id,
//       totalVentas,
//       totalMovimientos,
//       totalInventarioInicial,
//       totalInventarioFinal,
//       ingresoEsperadoNovillo,
//       ingresoEsperadoVaca,
//       ingresoEsperadoCerdo,
//       totalKgNovillo,
//       totalKgVaca,
//       totalKgCerdo,
//       rinde,
//       datosAjuste,
//     } = req.body;

//     // Función para formatear un valor numérico a dos decimales
//     const formatToTwoDecimals = (value) => {
//       if (value && !isNaN(value)) {
//         return parseFloat(value).toFixed(2);
//       }
//       return 0; // Si el valor no existe o no es un número, retornar null
//     };

//     // Formatear los campos numéricos para que tengan solo dos decimales
//     const formattedTotalVentas = formatToTwoDecimals(totalVentas);
//     const formattedTotalMovimientos = formatToTwoDecimals(totalMovimientos);
//     const formattedTotalInventarioInicial = formatToTwoDecimals(
//       totalInventarioInicial
//     );
//     const formattedTotalInventarioFinal =
//       formatToTwoDecimals(totalInventarioFinal);
//     const formattedRinde = formatToTwoDecimals(rinde);

//     // Crear el registro de Rinde en la base de datos
//     const nuevoRinde = await Rinde.create({
//       fechaDesde,
//       fechaHasta,
//       mes,
//       anio,
//       sucursal_id,
//       totalVentas: formattedTotalVentas,
//       totalMovimientos: formattedTotalMovimientos,
//       totalInventarioInicial: formattedTotalInventarioInicial,
//       totalInventarioFinal: formattedTotalInventarioFinal,
//       ingresoEsperadoNovillo,
//       ingresoEsperadoVaca,
//       ingresoEsperadoCerdo,
//       totalKgNovillo,
//       totalKgVaca,
//       totalKgCerdo,
//       rinde: formattedRinde,
//     });

//     if (datosAjuste) {
//       const AjusteRinde = await AjusteRinde.create(datosAjuste);
//     }

//     // Responder con el nuevo registro creado
//     res
//       .status(201)
//       .json({ mensaje: "Rinde creado satisfactoriamente", rinde: nuevoRinde });
//   } catch (error) {
//     // Manejar los errores y responder con un mensaje de error
//     console.error("Error al crear el registro de Rinde:", error);
//     next(error);
//   }
// };

const crearRinde = async (req, res, next) => {
  try {
    const {
      fechaDesde,
      fechaHasta,
      mes,
      anio,
      sucursal_id,
      totalVentas,
      totalMovimientos,
      totalInventarioInicial,
      totalInventarioFinal,
      ingresoEsperadoNovillo,
      ingresoEsperadoVaca,
      ingresoEsperadoCerdo,
      totalKgNovillo,
      totalKgVaca,
      totalKgCerdo,
      rinde,
      datosAjuste,
    } = req.body;

    const formatToTwoDecimals = (value) => {
      if (value && !isNaN(value)) {
        return parseFloat(value).toFixed(2);
      }
      return 0;
    };

    const formattedTotalVentas = formatToTwoDecimals(totalVentas);
    const formattedTotalMovimientos = formatToTwoDecimals(totalMovimientos);
    const formattedTotalInventarioInicial = formatToTwoDecimals(
      totalInventarioInicial
    );
    const formattedTotalInventarioFinal =
      formatToTwoDecimals(totalInventarioFinal);
    const formattedRinde = formatToTwoDecimals(rinde);

    const nuevoRinde = await Rinde.create({
      fechaDesde,
      fechaHasta,
      mes,
      anio,
      sucursal_id,
      totalVentas: formattedTotalVentas,
      totalMovimientos: formattedTotalMovimientos,
      totalInventarioInicial: formattedTotalInventarioInicial,
      totalInventarioFinal: formattedTotalInventarioFinal,
      ingresoEsperadoNovillo,
      ingresoEsperadoVaca,
      ingresoEsperadoCerdo,
      totalKgNovillo,
      totalKgVaca,
      totalKgCerdo,
      rinde: formattedRinde,
    });

    // Verifica si hay ajustes a crear y si el array no está vacío
    if (datosAjuste && Array.isArray(datosAjuste) && datosAjuste.length > 0) {
      const ajustesPromesas = datosAjuste.map(async (ajuste) => {
        return AjusteRinde.create({
          ...ajuste,
          rinde_id: nuevoRinde.id,
        });
      });

      await Promise.all(ajustesPromesas);
    }

    res
      .status(201)
      .json({ mensaje: "Rinde creado satisfactoriamente", rinde: nuevoRinde });
  } catch (error) {
    console.error("Error al crear el registro de Rinde:", error);
    next(error);
  }
};

const obtenerRindes = async (req, res, next) => {
  try {
    // Obtener los registros de Rinde filtrados por sucursal_id
    const rindes = await Rinde.findAll();

    // Responder con los registros de Rinde obtenidos
    res.status(200).json({ rindes });
  } catch (error) {
    // Manejar los errores y responder con un mensaje de error
    console.error("Error al obtener los registros de Rinde:", error);
    next(error);
  }
};

// Controlador para obtener los registros de Rinde filtrados por sucursal_id
const obtenerRindePorSucursalMesAnio = async (req, res, next) => {
  try {
    let { sucursalId } = req.body;
    let { mes } = req.body;
    let { anio } = req.body;

    let filters = {};

    // Si se proporciona el ID de sucursal, agrega el filtro por sucursal
    if (sucursalId) {
      filters.sucursal_id = sucursalId;
    }

    if (mes) {
      filters.mes = mes;
    }

    if (anio) {
      filters.anio = anio;
    }

    // Obtener los registros de Rinde filtrados por sucursal_id
    const rindes = await Rinde.findAll({
      where: filters,
    });

    // Responder con los registros de Rinde obtenidos
    res.status(200).json({ rindes });
  } catch (error) {
    // Manejar los errores y responder con un mensaje de error
    console.error(
      "Error al obtener los registros de Rinde filtrados por sucursal_id:",
      error
    );
    next(error);
  }
};

const eliminarRinde = async (req, res, next) => {
  try {
    // Obtener el ID del RINDE desde la solicitud
    const { rindeId } = req.params;

    // Eliminar el RINDE
    await Rinde.destroy({
      where: { id: rindeId },
    });

    // Enviar una respuesta exitosa
    res.json({ message: "Rinde eliminado exitosamente" });
  } catch (error) {
    console.error("Error al eliminar el Rinde:", error);
    next(error);
  }
};

const crearFormula = async (req, res, next) => {
  try {
    // Obtener los datos del cuerpo de la solicitud
    const { articulo_id, codigo, descripcion, articulos } = req.body;

    // Crear la fórmula en la base de datos
    const nuevaFormula = await Formula.create({
      codigobarraformula: codigo,
      articuloformula_id: articulo_id,
      descripcionformula: descripcion,
    });

    // Crear los artículos asociados a la fórmula y sus relaciones con la tabla intermedia
    const articulosPromises = articulos.map(async (articulo) => {
      const nuevoArticulo = await FormulaArticulo.create({
        articulo_id: articulo.articulo_id,
        codigobarra: articulo.codigo,
        cantidad: parseFloat(articulo.cantidad),
        descripcion: articulo.descripcion,
      });
      // Crear la relación con la tabla intermedia
      await FormulaFormulaArticulo.create({
        formula_id: nuevaFormula.id,
        formulasarticulos_id: nuevoArticulo.id,
      });
    });

    // Esperar a que todas las promesas de creación de artículos se completen
    await Promise.all(articulosPromises);

    // Enviar una respuesta exitosa
    res.status(201).json({
      message: "Fórmula creada exitosamente",
      formula: nuevaFormula,
    });
  } catch (error) {
    console.error("Error al crear la fórmula:", error);
    next(error);
  }
};

const obtenerFormulas = async (req, res, next) => {
  try {
    // Obtener todas las fórmulas
    const formulas = await Formula.findAll({
      include: {
        model: FormulaArticulo,
        through: FormulaFormulaArticulo,
      },
    });
    res.json(formulas);
  } catch (error) {
    console.error("Error al obtener las fórmulas:", error);
    next(error);
  }
};

const eliminarFormula = async (req, res, next) => {
  try {
    const { formulaId } = req.params;

    // Buscar la fórmula por su ID
    const formula = await Formula.findByPk(formulaId);

    // Si la fórmula no existe, retornar un error 404
    if (!formula) {
      return res.status(404).json({ message: "La fórmula no fue encontrada." });
    }

    // Eliminar los artículos asociados a la fórmula
    await FormulaFormulaArticulo.destroy({
      where: { formula_id: formula.id },
    });

    // Eliminar la fórmula
    await Formula.destroy({
      where: { id: formula.id },
    });

    // Enviar una respuesta exitosa
    res.status(200).json({
      message:
        "La fórmula y sus relaciones asociadas han sido eliminadas exitosamente.",
    });
  } catch (error) {
    console.error("Error al eliminar la fórmula:", error);
    next(error);
  }
};

const obtenerFormulaPorId = async (req, res, next) => {
  try {
    const { formulaId } = req.params;

    // Buscar la fórmula por su ID incluyendo sus artículos asociados
    const formula = await Formula.findByPk(formulaId, {
      include: {
        model: FormulaArticulo,
        through: FormulaFormulaArticulo,
        // as: "formulaArticulos",
      },
    });

    // Si la fórmula no existe, retornar un error 404
    if (!formula) {
      return res.status(404).json({ message: "La fórmula no fue encontrada." });
    }

    // Enviar una respuesta exitosa con la fórmula y sus artículos asociados
    res.json(formula);
  } catch (error) {
    console.error("Error al obtener la fórmula:", error);
    next(error);
  }
};

const editarFormula = async (req, res, next) => {
  try {
    const { formulaId } = req.params;
    const { articulo_id, descripcion, articulos } = req.body;

    // Buscar la fórmula por su ID
    const formula = await Formula.findByPk(formulaId);

    // Si la fórmula no existe, retornar un error 404
    if (!formula) {
      return res.status(404).json({ message: "La fórmula no fue encontrada." });
    }

    // Actualizar la fórmula
    await Formula.update(
      { articulo_id, descripcion },
      { where: { formulaId } }
    );

    // Eliminar las relaciones de la fórmula con los artículos actuales
    await FormulaFormulaArticulo.destroy({
      where: { formula_id: formulaId },
    });

    // Crear las nuevas relaciones con los artículos actualizados
    const articulosPromises = articulos.map(async (articulo) => {
      const nuevoArticulo = await FormulaArticulo.create({
        articulo_id: articulo.articulo_id,
        codigobarra: articulo.codigobarra,
        cantidad: articulo.cantidad,
        descripcion: articulo.descripcion,
      });
      // Crear la relación con la tabla intermedia
      await FormulaFormulaArticulo.create({
        formula_id: formula.id,
        formulasarticulos_id: nuevoArticulo.id,
      });
    });

    // Esperar a que todas las promesas de creación de artículos se completen
    await Promise.all(articulosPromises);

    // Enviar una respuesta exitosa
    res.status(200).json({
      message:
        "La fórmula y sus relaciones asociadas han sido actualizadas exitosamente.",
    });
  } catch (error) {
    console.error("Error al editar la fórmula:", error);
    next(error);
  }
};

const obtenerSumaKgMediasPorSubcategoria = async (
  fechaDesde,
  fechaHasta,
  sucursalId
) => {
  try {
    // Convertir las fechas a objetos Date
    // const fechaInicio = new Date(fechaDesde);
    // const fechaFin = new Date(fechaHasta);

    // Incrementar la fecha final en un día para que incluya el rango completo
    // fechaFin.setDate(fechaFin.getDate() + 1);

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

    // Obtener las órdenes filtradas
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

    // Calcular la suma de los campos 'kg' de los productos agrupados por subcategoría
    const sumaKgPorSubcategoria = {};
    ordenes.forEach((orden) => {
      orden.Productos.forEach((producto) => {
        if (!sumaKgPorSubcategoria[producto.subcategoria]) {
          sumaKgPorSubcategoria[producto.subcategoria] = 0;
        }
        sumaKgPorSubcategoria[producto.subcategoria] += producto.kg;
      });
    });
    // Convertir el objeto a un arreglo de objetos con la estructura deseada
    const resultado = Object.keys(sumaKgPorSubcategoria).map((categoria) => ({
      subcategoria: categoria,
      cantidad: sumaKgPorSubcategoria[categoria],
    }));
    // Retornar el resultado
    return resultado;
  } catch (error) {
    console.error("Error al obtener el stock por subcategoría:", error);
  }
};

const obtenerKgsPorProductoUltimoInventario = async (
  sucursalId,
  inventarioId
) => {
  try {
    // Filtrar el último inventario por sucursal ID
    const ultimoInventario = await Inventario.findOne({
      where: { sucursal_id: sucursalId, id: inventarioId },
      // order: [["fecha", "DESC"]],
      include: [
        {
          model: InventarioArticulo,
          through: {
            model: InventarioInventarioArticulo,
            attributes: [],
          },
          attributes: [
            "id",
            "articulocodigo",
            "articulodescripcion",
            "cantidadpeso",
          ],
        },
      ],
    });

    if (!ultimoInventario) {
      console.log(
        "No se encontró un inventario para la sucursal especificada."
      );
      return [];
    }

    const articulosInventario = ultimoInventario.Inventario_articulos;

    // Obtener los códigos de barra de los artículos del último inventario
    const codigosInventario = articulosInventario.map(
      (articulo) => articulo.articulocodigo
    );

    // Obtener las fórmulas que corresponden a los artículos del inventario
    const formulas = await Formula.findAll({
      where: {
        codigobarraformula: codigosInventario,
      },
      include: {
        model: FormulaArticulo,
        through: {
          model: FormulaFormulaArticulo,
          attributes: [],
        },
        attributes: ["codigobarra", "descripcion", "cantidad"],
      },
      attributes: ["codigobarraformula", "descripcionformula"],
    });

    // Crear un mapa para almacenar los detalles de las fórmulas
    const detallesFormulasMap = new Map();

    formulas.forEach((formula) => {
      const detallesFormula = formula.formulaarticulos.map((detalle) => ({
        codigo: detalle.codigobarra,
        descripcion: detalle.descripcion,
        cantidad:
          (detalle.cantidad / 100) *
          articulosInventario.find(
            (articulo) => articulo.articulocodigo === formula.codigobarraformula
          ).cantidadpeso,
      }));
      detallesFormulasMap.set(formula.codigobarraformula, detallesFormula);
    });

    // Filtrar los artículos del inventario que no están en ninguna fórmula
    const articulosNoFormula = articulosInventario.filter(
      (articulo) => !detallesFormulasMap.has(articulo.articulocodigo)
    );

    // Crear el conjunto completo de productos finales
    const productosFinalesMap = new Map();

    articulosNoFormula.forEach((articulo) => {
      const { articulocodigo, articulodescripcion, cantidadpeso } = articulo;
      if (productosFinalesMap.has(articulocodigo)) {
        productosFinalesMap.set(articulocodigo, {
          codigo: articulocodigo,
          descripcion: articulodescripcion,
          cantidad:
            parseFloat(productosFinalesMap.get(articulocodigo).cantidad) +
            parseFloat(cantidadpeso),
        });
      } else {
        productosFinalesMap.set(articulocodigo, {
          codigo: articulocodigo,
          descripcion: articulodescripcion,
          cantidad: parseFloat(cantidadpeso),
        });
      }
    });

    detallesFormulasMap.forEach((detallesFormula, codigoFormula) => {
      detallesFormula.forEach((detalle) => {
        const { codigo, descripcion, cantidad } = detalle;
        if (productosFinalesMap.has(codigo)) {
          productosFinalesMap.set(codigo, {
            codigo: codigo,
            descripcion: descripcion,
            cantidad: productosFinalesMap.get(codigo).cantidad + cantidad,
          });
        } else {
          productosFinalesMap.set(codigo, {
            codigo: codigo,
            descripcion: descripcion,
            cantidad: cantidad,
          });
        }
      });
    });

    // Convertir el mapa a un array
    const productosFinales = Array.from(productosFinalesMap.values());

    return productosFinales;
  } catch (error) {
    console.error(
      "Error al obtener los kg por producto del último inventario:",
      error
    );
    throw error;
  }
};

const obtenerKgPorProductoMovimientosFiltrados = async (
  fechaDesde,
  fechaHasta,
  sucursalId
) => {
  try {
    // Convertir las fechas a objetos Date
    // const fechaInicio = new Date(fechaDesde);
    // const fechaFin = new Date(fechaHasta);

    // Incrementar la fecha final en un día para que incluya el rango completo
    // fechaFin.setDate(fechaFin.getDate() + 1);

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

    // Obtener los movimientos de inventario filtrados por fecha y sucursal
    const movimientos = await InventarioMovimientoInterno.findAll({
      where: filters,
    });

    // Procesar los movimientos para obtener el saldo final de cada producto
    const saldoProductos = movimientos.reduce((acumulador, movimiento) => {
      // Verificar si el producto ya está en el acumulador
      const index = acumulador.findIndex(
        (item) => item.codigo === movimiento.articulocodigo
      );

      // Calcular la cantidad para agregar al acumulador
      const cantidad =
        movimiento.tipo === "salida"
          ? -parseInt(movimiento.cantidad)
          : parseInt(movimiento.cantidad);

      // Si el producto ya está en el acumulador, sumar la cantidad
      // Si no, agregarlo al acumulador con su cantidad correspondiente
      if (index !== -1) {
        acumulador[index].cantidad += cantidad;
      } else {
        acumulador.push({
          codigo: movimiento.articulocodigo,
          descripcion: movimiento.articulodescripcion,
          cantidad: cantidad,
        });
      }

      return acumulador;
    }, []);

    // Obtener los códigos de barra de los productos del saldo
    const codigosProductos = saldoProductos.map((producto) => producto.codigo);

    // Obtener las fórmulas que corresponden a los productos del saldo
    const formulas = await Formula.findAll({
      where: {
        codigobarraformula: codigosProductos,
      },
      include: {
        model: FormulaArticulo,
        through: {
          model: FormulaFormulaArticulo,
          attributes: [],
        },
        attributes: ["codigobarra", "descripcion", "cantidad"],
      },
      attributes: ["codigobarraformula", "descripcionformula"],
    });
    // Crear un mapa para almacenar los detalles de las fórmulas
    const detallesFormulasMap = new Map();

    formulas.forEach((formula) => {
      const detallesFormula = formula.formulaarticulos.map((detalle) => ({
        codigo: detalle.codigobarra,
        descripcion: detalle.descripcion,
        cantidad:
          (parseFloat(detalle.cantidad) / 100) *
          saldoProductos.find(
            (movimiento) => movimiento.codigo === formula.codigobarraformula
          ).cantidad,
      }));
      detallesFormulasMap.set(formula.codigobarraformula, detallesFormula);
    });
    // Filtrar los artículos del movimiento que no están en ninguna fórmula
    const articulosNoFormula = saldoProductos.filter(
      (producto) => !detallesFormulasMap.has(producto.codigo)
    );
    // Crear el conjunto completo de productos finales
    const productosFinalesMap = new Map();

    articulosNoFormula.forEach((producto) => {
      const { codigo, descripcion, cantidad } = producto;
      if (productosFinalesMap.has(codigo)) {
        productosFinalesMap.set(codigo, {
          codigo: codigo,
          descripcion: descripcion,
          cantidad:
            parseFloat(productosFinalesMap.get(codigo).cantidad) +
            parseFloat(cantidad),
        });
      } else {
        productosFinalesMap.set(codigo, {
          codigo: codigo,
          descripcion: descripcion,
          cantidad: parseFloat(cantidad),
        });
      }
    });
    detallesFormulasMap.forEach((detallesFormula) => {
      detallesFormula.forEach((detalle) => {
        const { codigo, descripcion, cantidad } = detalle;
        if (productosFinalesMap.has(codigo)) {
          productosFinalesMap.set(codigo, {
            codigo: codigo,
            descripcion: descripcion,
            cantidad: productosFinalesMap.get(codigo).cantidad + cantidad,
          });
        } else {
          productosFinalesMap.set(codigo, {
            codigo: codigo,
            descripcion: descripcion,
            cantidad: cantidad,
          });
        }
      });
    });
    // Convertir el mapa a un array
    const productosFinales = Array.from(productosFinalesMap.values());

    return productosFinales;
  } catch (error) {
    console.error(
      "Error al obtener los kg por producto de los movimientos:",
      error
    );
    throw error; // Propagar el error para manejarlo en el llamador
  }
};

const obtenerKgPorArticuloVendido = async (
  fechaDesde,
  fechaHasta,
  sucursalId
) => {
  try {
    // Define los filtros para la consulta de VentasArticulo
    const filters = {
      fecha: {
        [Op.between]: [fechaDesde, fechaHasta],
      },
    };

    // Si se proporciona el ID de sucursal, agrega el filtro por sucursal
    if (sucursalId) {
      filters.sucursal_id = sucursalId;
    }

    // Realiza la consulta a la base de datos para obtener las ventas de artículos
    const ventasArticulos = await VentaArticulo.findAll({
      where: filters,
    });
    // Objeto para almacenar la cantidad por cada artículo
    const cantidadesPorArticulo = {};
    // Recorre las ventas de artículos para calcular la cantidad total por artículo
    for (const ventaArticulo of ventasArticulos) {
      // Convertir ventaArticulo.articuloCodigo a string
      const articuloCodigoString = ventaArticulo.articuloCodigo.toString();
      // Busca el artículo en la tabla de artículos (ArticuloTabla) para obtener la descripción
      const articulo = await ArticuloTabla.findOne({
        where: {
          codigobarra: articuloCodigoString,
        },
      });
      // Si el artículo existe y tiene una descripción
      if (articulo && articulo.descripcion) {
        const descripcion = articulo.descripcion;
        // Si el artículo ya existe en el objeto de cantidades, se suma la cantidad
        if (cantidadesPorArticulo[articuloCodigoString]) {
          cantidadesPorArticulo[articuloCodigoString].cantidad += parseFloat(
            ventaArticulo.cantidad
          );
        } else {
          // Si no existe, se crea una nueva entrada en el objeto
          cantidadesPorArticulo[articuloCodigoString] = {
            codigo: articuloCodigoString,
            descripcion: descripcion,
            cantidad: parseFloat(ventaArticulo.cantidad),
          };
        }
      }
    }
    // Obtener los códigos de barra de los productos del saldo
    const codigosProductos = Object.keys(cantidadesPorArticulo);
    // Obtener las fórmulas que corresponden a los productos del saldo
    const formulas = await Formula.findAll({
      where: {
        codigobarraformula: codigosProductos,
      },
      include: {
        model: FormulaArticulo,
        through: {
          model: FormulaFormulaArticulo,
          attributes: [],
        },
        attributes: ["codigobarra", "descripcion", "cantidad"],
      },
      attributes: ["codigobarraformula", "descripcionformula"],
    });
    // Crear un mapa para almacenar los detalles de las fórmulas
    const detallesFormulasMap = new Map();

    formulas.forEach((formula) => {
      const detallesFormula = formula.formulaarticulos.map((detalle) => ({
        codigo: detalle.codigobarra,
        descripcion: detalle.descripcion,
        cantidad:
          (parseFloat(detalle.cantidad) / 100) *
          cantidadesPorArticulo[formula.codigobarraformula].cantidad,
      }));
      detallesFormulasMap.set(formula.codigobarraformula, detallesFormula);
    });
    // Filtrar los artículos de las ventas que no están en ninguna fórmula
    const articulosNoFormula = ventasArticulos.filter(
      (ventaArticulo) => !detallesFormulasMap.has(ventaArticulo.articuloCodigo)
    );
    // Crear el conjunto completo de productos finales
    const productosFinalesMap = new Map();

    articulosNoFormula.forEach((ventaArticulo) => {
      const { articuloCodigo, articuloDescripcion, cantidad } = ventaArticulo;
      if (productosFinalesMap.has(articuloCodigo.toString())) {
        productosFinalesMap.set(articuloCodigo, {
          codigo: articuloCodigo,
          descripcion: articuloDescripcion,
          cantidad:
            parseFloat(productosFinalesMap.get(articuloCodigo).cantidad) +
            parseFloat(cantidad),
        });
      } else {
        productosFinalesMap.set(articuloCodigo, {
          codigo: articuloCodigo,
          descripcion: articuloDescripcion,
          cantidad: parseFloat(cantidad),
        });
      }
    });
    detallesFormulasMap.forEach((detallesFormula) => {
      detallesFormula.forEach((detalle) => {
        const { codigo, descripcion, cantidad } = detalle;
        if (productosFinalesMap.has(codigo)) {
          productosFinalesMap.set(codigo, {
            codigo: codigo,
            descripcion: descripcion,
            cantidad: productosFinalesMap.get(codigo).cantidad + cantidad,
          });
        } else {
          productosFinalesMap.set(codigo, {
            codigo: codigo,
            descripcion: descripcion,
            cantidad: cantidad,
          });
        }
      });
    });
    // Convertir el mapa a un array
    const productosFinales = Array.from(productosFinalesMap.values());

    // Retorna el conjunto completo de productos finales
    return productosFinales;
  } catch (error) {
    console.error(
      "Error al obtener las cantidades por artículos y aplicar las fórmulas:",
      error
    );
    throw error; // Propagar el error para manejarlo en el llamador
  }
};

const obtenerStock = async (req, res, next) => {
  const { fechaDesde, fechaHasta, sucursalId, inventarioId } = req.body;

  try {
    let sumaCantidadesMedias = [];
    const sumaMedias = await obtenerSumaKgMediasPorSubcategoria(
      fechaDesde,
      fechaHasta,
      sucursalId
    );

    if (sumaMedias.length > 0) {
      const articulosPorcentaje = await ArticuloPorcentajetabla.findAll({
        include: [{ model: ArticuloTabla }],
      });

      // Crear un mapa para almacenar las cantidades de cada código de barras
      const codigoBarraCantidadMap = new Map();

      // Calcular las cantidades para cada código de barras
      for (const articuloPorcentaje of articulosPorcentaje) {
        const sumaMediaCorrespondiente = sumaMedias.find(
          (item) => item.subcategoria === articuloPorcentaje.subcategoria
        );

        if (sumaMediaCorrespondiente) {
          const nuevaCantidad =
            sumaMediaCorrespondiente.cantidad *
            (articuloPorcentaje.porcentaje / 100);

          // Agregar la cantidad calculada al mapa, agrupando por código de barras
          const codigoBarra = articuloPorcentaje.Articulotabla.codigobarra;
          const cantidadActual = codigoBarraCantidadMap.get(codigoBarra) || 0;
          codigoBarraCantidadMap.set(
            codigoBarra,
            cantidadActual + nuevaCantidad
          );
        }
      }

      // Convertir el mapa a un array de objetos
      sumaCantidadesMedias = Array.from(
        codigoBarraCantidadMap,
        ([codigo, cantidad]) => ({
          codigo,
          cantidad: cantidad.toFixed(2), // Redondear la cantidad a dos decimales
          descripcion: articulosPorcentaje.find(
            (item) => item.Articulotabla.codigobarra === codigo
          ).Articulotabla.descripcion,
          // Obtenemos la descripción correspondiente al código de barras actual
        })
      );
    }
    const sumaInventario = await obtenerKgsPorProductoUltimoInventario(
      sucursalId,
      inventarioId
    );
    const sumaMovimientos = await obtenerKgPorProductoMovimientosFiltrados(
      fechaDesde,
      fechaHasta,
      sucursalId
    );
    const sumaCantidadesVendidasPorArticulo = await obtenerKgPorArticuloVendido(
      fechaDesde,
      fechaHasta,
      sucursalId
    );

    // Crear un mapa para almacenar las cantidades por código de barras
    const codigoCantidadMap = new Map();

    // Función para sumar cantidades al mapa
    const sumarCantidad = (codigo, cantidad) => {
      const cantidadActual = codigoCantidadMap.get(codigo) || 0;
      codigoCantidadMap.set(codigo, cantidadActual + cantidad);
    };

    // Función para iterar sobre los datos y sumar cantidades al mapa
    const sumarCantidades = (datos) => {
      datos.forEach(({ codigo, cantidad }) => {
        sumarCantidad(codigo, parseFloat(cantidad));
      });
    };

    // Sumar cantidades de todas las fuentes de datos
    sumarCantidades(sumaCantidadesMedias);
    sumarCantidades(sumaInventario);
    sumarCantidades(sumaMovimientos);
    sumarCantidades(sumaCantidadesVendidasPorArticulo);

    // Obtener las descripciones de los productos desde ArticuloTabla
    const descripcionMap = new Map();
    const codigosArticulos = Array.from(codigoCantidadMap.keys());

    if (codigosArticulos.length > 0) {
      const articulos = await ArticuloTabla.findAll({
        where: {
          codigobarra: codigosArticulos,
        },
      });

      articulos.forEach((articulo) => {
        descripcionMap.set(articulo.codigobarra, articulo.descripcion);
      });
    }

    // Convertir el mapa a un array de objetos con la estructura requerida
    const stock = Array.from(codigoCantidadMap, ([codigo, cantidad]) => ({
      codigo,
      cantidad: cantidad.toFixed(2), // Redondear la cantidad a dos decimales
      descripcion: descripcionMap.get(codigo) || "", // Obtener la descripción desde ArticuloTabla
    }));

    // Devolver el stock unificado
    res.status(200).json(stock);
  } catch (error) {
    console.error("Error al obtener el stock:", error);
    next(error);
  }
};

export {
  obtenerMovimientosFiltrados,
  obtenerMontoMovimientosFiltrados,
  eliminarMovimientoInterno,
  crearMovimientoInterno,
  crearInventario,
  listarInventarios,
  obtenerInventarios,
  obtenerInventariosFiltrados,
  obtenerMontoInventariosFiltrados,
  listarInventariosArticulos,
  eliminarInventario,
  crearRinde,
  obtenerRindes,
  obtenerRindePorSucursalMesAnio,
  eliminarRinde,
  crearFormula,
  obtenerFormulas,
  obtenerFormulaPorId,
  eliminarFormula,
  editarFormula,
  obtenerStock,
};
