import VentasAnuladas from "../../models/rinde/ventaAnuladoModel.js";
import VentasTotal from "../../models/rinde/ventaTotalModel.js";
import VentasCliente from "../../models/rinde/ventaClienteModel.js";
import VentasDescuento from "../../models/rinde/ventaDescuentoModel.js";
import VentasArticulo from "../../models/rinde/ventaArticuloModel.js";
import VentaTotal from "../../models/rinde/ventaTotalModel.js";
import { Op } from "sequelize";
import ArticuloPrecioTabla from "../../models/tablas/articuloPrecioModel.js";
import ArticuloTabla from "../../models/tablas/articuloModel.js";
import { sequelize } from "../../config/database.js"; // Importa la conexión a la base de datos

const obtenerVentasTotales = async (req, res, next) => {
  try {
    const ventasTotales = await VentasTotal.findAll();
    res.json(ventasTotales);
  } catch (error) {
    next(error);
  }
};

// const obtenerVentasFiltradas = async (req, res, next) => {
//   try {
//     const { fechaDesde, fechaHasta, sucursalId } = req.body;
//     // Define los filtros para la consulta
//     const filters = {
//       fecha: {
//         [Op.between]: [fechaDesde, fechaHasta],
//       },
//     };

//     // Si se proporciona el ID de sucursal, agrega el filtro por sucursal
//     if (sucursalId) {
//       filters.sucursal_id = sucursalId;
//     }
//     // Realiza la consulta a la base de datos
//     const ventasFiltradas = await VentaTotal.findAll({ where: filters });
//     res.json(ventasFiltradas);
//   } catch (error) {
//     next(error);
//   }
// };

// import { Op } from 'sequelize';
// import VentaTotal from '../models/VentaTotal';
// import VentaArticulo from '../models/VentaArticulo';

// const obtenerVentasFiltradas = async (req, res, next) => {
//   try {
//     const { fechaDesde, fechaHasta, sucursalId } = req.body;

//     // Define los filtros para la consulta de ventas totales
//     const filters = {
//       fecha: {
//         [Op.between]: [fechaDesde, fechaHasta],
//       },
//     };

//     // Si se proporciona el ID de sucursal, agrega el filtro por sucursal
//     if (sucursalId) {
//       filters.sucursal_id = sucursalId;
//     }

//     // Realiza la consulta a la base de datos para obtener las ventas totales
//     const ventasFiltradas = await VentaTotal.findAll({ where: filters });
//     console.log("ventasfiltradas----------------", ventasFiltradas);

//     // Agrupa y suma las ventas por fecha y sucursal
//     const ventasAgrupadas = {};
//     ventasFiltradas.forEach((venta) => {
//       const key = `${venta.fecha}-${venta.sucursal_id}`;
//       if (!ventasAgrupadas[key]) {
//         ventasAgrupadas[key] = {
//           ...venta.dataValues,
//           monto: parseFloat(venta.dataValues.monto),
//         };
//       } else {
//         ventasAgrupadas[key].monto += parseFloat(venta.dataValues.monto);
//       }
//     });

//     // Convierte el objeto de ventas agrupadas a un array
//     const ventasAgrupadasArray = Object.values(ventasAgrupadas);
//     console.log("ventasAgrupadasArray", ventasAgrupadasArray);

//     // Define los filtros para la consulta de VentaArticulo
//     const articuloFilters = {
//       ...filters,
//       articuloCodigo: {
//         [Op.in]: ["1005", "1012", "1011"],
//       },
//     };

//     // Realiza la consulta a la base de datos para obtener los artículos específicos
//     const ventasConArticulos = await VentasArticulo.findAll({
//       where: articuloFilters,
//     });
//     console.log("ventasConArticulos", ventasConArticulos);

//     // Prepara un mapa para mantener los montos a restar por fecha
//     const montosARestarPorFecha = {};

//     // Calcula el monto a restar por fecha
//     ventasConArticulos.forEach((venta) => {
//       if (!montosARestarPorFecha[venta.fecha]) {
//         montosARestarPorFecha[venta.fecha] = 0;
//       }
//       montosARestarPorFecha[venta.fecha] += venta.cantidad * venta.monto_lista;
//     });
//     console.log("montosARestarPorFecha", montosARestarPorFecha);

//     // Resta el monto calculado de las ventas totales agrupadas por la fecha correspondiente
//     ventasAgrupadasArray.forEach((venta) => {
//       if (montosARestarPorFecha[venta.fecha]) {
//         venta.monto -= montosARestarPorFecha[venta.fecha];
//       }
//     });

//     console.log("ventasFiltradasFinal", ventasAgrupadasArray);

//     res.json(ventasAgrupadasArray);
//   } catch (error) {
//     next(error);
//   }
// };

const obtenerVentasFiltradas = async (req, res, next) => {
  try {
    const { fechaDesde, fechaHasta, sucursalId } = req.body;

    // Define los filtros para la consulta de ventas totales
    const filters = {
      fecha: {
        [Op.between]: [fechaDesde, fechaHasta],
      },
    };

    // Si se proporciona el ID de sucursal, agrega el filtro por sucursal
    if (sucursalId) {
      filters.sucursal_id = sucursalId;
    }

    // Realiza la consulta a la base de datos para obtener las ventas totales
    const ventasFiltradas = await VentaTotal.findAll({ where: filters });
    // console.log("ventasfiltradas----------------", ventasFiltradas);

    // Agrupa y suma las ventas por fecha y sucursal
    const ventasAgrupadas = {};
    ventasFiltradas.forEach((venta) => {
      const key = `${venta.fecha}-${venta.sucursal_id}`;
      if (!ventasAgrupadas[key]) {
        ventasAgrupadas[key] = {
          ...venta.dataValues,
          monto: parseFloat(venta.dataValues.monto),
        };
      } else {
        ventasAgrupadas[key].monto += parseFloat(venta.dataValues.monto);
      }
    });

    // Convierte el objeto de ventas agrupadas a un array
    const ventasAgrupadasArray = Object.values(ventasAgrupadas);
    // console.log("ventasAgrupadasArray", ventasAgrupadasArray);

    // Define los filtros para la consulta de VentaArticulo
    const articuloFilters = {
      ...filters,
      articuloCodigo: {
        [Op.in]: ["1005", "1012", "1011"],
      },
    };

    // Realiza la consulta a la base de datos para obtener los artículos específicos
    const ventasConArticulos = await VentasArticulo.findAll({
      where: articuloFilters,
    });
    // console.log("ventasConArticulos", ventasConArticulos);

    // Prepara un mapa para mantener los montos a restar por fecha y sucursal
    const montosARestarPorFechaYSucursal = {};

    // Calcula el monto a restar por fecha y sucursal
    ventasConArticulos.forEach((venta) => {
      const key = `${venta.fecha}-${venta.sucursal_id}`;
      if (!montosARestarPorFechaYSucursal[key]) {
        montosARestarPorFechaYSucursal[key] = 0;
      }
      montosARestarPorFechaYSucursal[key] += venta.cantidad * venta.monto_lista;
    });
    // console.log("montosARestarPorFechaYSucursal", montosARestarPorFechaYSucursal);

    // Resta el monto calculado de las ventas totales agrupadas por la fecha y sucursal correspondiente
    ventasAgrupadasArray.forEach((venta) => {
      const key = `${venta.fecha}-${venta.sucursal_id}`;
      if (montosARestarPorFechaYSucursal[key]) {
        venta.monto -= montosARestarPorFechaYSucursal[key];
      }
    });

    // console.log("ventasFiltradasFinal", ventasAgrupadasArray);

    res.json(ventasAgrupadasArray);
  } catch (error) {
    next(error);
  }
};

const obtenerUltimoIdTablaPorSucursal = async (
  nombreTabla,
  nombreColumna,
  sucursalId
) => {
  // console.log("datos", nombreTabla, nombreColumna, sucursalId);
  try {
    // Consulta utilizando Sequelize para obtener el último ID de la tabla para la sucursal dada
    const ultimoId = await nombreTabla.findOne({
      attributes: [[sequelize.fn("MAX", sequelize.col(nombreColumna)), "id"]],
      where: {
        sucursal_id: sucursalId,
      },
    });
    // console.log("ultimoId", ultimoId);
    return ultimoId ? ultimoId.id : null;
  } catch (error) {
    console.error(
      `Error al obtener el último ID de ${nombreTabla}.${nombreColumna} por sucursal ${sucursalId}:`,
      error
    );
    throw error;
  }
};

const crearVentaTotal = async (req, res, next) => {
  try {
    // Extraer los datos del cuerpo de la solicitud
    const ventasTotales = req.body;
    // Validar si se recibieron datos
    if (!Array.isArray(ventasTotales)) {
      return res
        .status(400)
        .json({ error: "Los datos deben estar en formato de matriz." });
    }

    // Obtener el último ID de la tabla VentaTotal para la sucursal correspondiente
    const ultimoId = await obtenerUltimoIdTablaPorSucursal(
      VentaTotal,
      "cierreventa_id",
      ventasTotales[0].sucursal_id
    );
    // console.log("ultimo", ultimoId);

    // Mapear los datos para prepararlos para la inserción
    const nuevasVentasTotalesBulk = ventasTotales.map((venta) => {
      const { id, fecha } = venta.data;
      const { monto_total, sucursal_id } = venta;

      // Verificar si el ID actual es mayor que el último ID en la tabla
      if (id > ultimoId) {
        return {
          fecha: fecha,
          cierreventa_id: id,
          monto: parseFloat(monto_total),
          sucursal_id: parseInt(sucursal_id),
        };
      } else {
        // Si el ID actual es menor o igual al último ID, retornar null para excluirlo de la creación
        return null;
      }
    });

    // Filtrar los elementos nulos del array
    const nuevasVentasTotalesFiltradas = nuevasVentasTotalesBulk.filter(
      (venta) => venta !== null
    );

    // console.log("nuevasVentasTotalesFiltradas", nuevasVentasTotalesFiltradas);

    // Insertar las nuevas ventas totales en la base de datos en lotes (bulk)
    const nuevasVentasTotales = await VentaTotal.bulkCreate(
      nuevasVentasTotalesFiltradas
    );

    // Enviar las nuevas ventas totales creadas como respuesta
    res.status(201).json(nuevasVentasTotales);
  } catch (error) {
    // Manejar errores
    console.error("Error al crear las ventas totales:", error);
    next(error);
  }
};

const obtenerVentasAnuladas = async (req, res, next) => {
  try {
    const ventasAnuladas = await VentasAnuladas.findAll();
    res.json(ventasAnuladas);
  } catch (error) {
    next(error);
  }
};

const obtenerVentasAnuladasFiltradas = async (req, res, next) => {
  try {
    const { fechaDesde, fechaHasta, sucursalId } = req.body;
    // console.log("reqbody--", fechaDesde, fechaHasta, sucursalId);
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
    // Realiza la consulta a la base de datos
    const ventasAnuladasFiltradas = await VentasAnuladas.findAll({
      where: filters,
    });

    res.json(ventasAnuladasFiltradas);
  } catch (error) {
    next(error);
  }
};

const crearVentasAnuladas = async (req, res, next) => {
  try {
    // Obtener las ventas anuladas del cuerpo de la solicitud
    const ventasAnuladas = req.body;

    // Validar si se recibieron datos en formato de matriz
    if (!Array.isArray(ventasAnuladas)) {
      return res
        .status(400)
        .json({ error: "Los datos deben estar en formato de matriz." });
    }

    // Obtener el último ID de la tabla VentasAnuladas para la sucursal correspondiente
    const ultimoId = await obtenerUltimoIdTablaPorSucursal(
      VentasAnuladas,
      "ventaanuladoId",
      ventasAnuladas[0].sucursal_id
    );

    // Iterar sobre las ventas anuladas y asignar el id existente como ventaanuladoId
    const ventasAnuladasConId = ventasAnuladas.map((venta) => ({
      ...venta,
      ventaanuladoId: venta.id, // Asignamos el valor del id existente como ventaanuladoId
      id: null, // Dejar el campo id undefined para que la base de datos lo genere automáticamente
    }));

    // Mapear los datos para prepararlos para la inserción
    const nuevasVentasAnuladasBulk = ventasAnuladasConId
      .map((ventaAnulada) => {
        // Verificar si el ID actual es mayor que el último ID en la tabla
        if (ventaAnulada.ventaanuladoId > ultimoId) {
          return {
            id: ventaAnulada.id,
            ventaanuladoId: ventaAnulada.ventaanuladoId,
            fecha: ventaAnulada.fecha,
            monto: parseFloat(ventaAnulada.monto),
            numeroticket: ventaAnulada.numeroticket,
            sucursal_id: parseInt(ventaAnulada.sucursal_id),
          };
        } else {
          // Si el ID actual es menor o igual al último ID, retornar null para excluirlo de la creación
          return null;
        }
      })
      .filter((ventaAnulada) => ventaAnulada !== null);

    // Insertar las nuevas ventas anuladas en la base de datos en lotes (bulk)
    const nuevasVentasAnuladas = await VentasAnuladas.bulkCreate(
      nuevasVentasAnuladasBulk
    );

    console.log("Registros de Ventas Anuladas creados exitosamente.");

    // Enviar las nuevas ventas anuladas creadas como respuesta
    res.status(201).json(nuevasVentasAnuladas);
  } catch (error) {
    // Manejar errores
    console.error("Error al crear los registros de Ventas Anuladas:", error);
    next(error);
  }
};

const obtenerVentasConDescuento = async (req, res, next) => {
  try {
    const ventasDescuento = await VentasDescuento.findAll();
    // Iterar sobre los datos de las cajas y asignar el id como cajaId
    const ventasDescuentoConId = ventasDescuento.map((venta) => ({
      ...venta,
      ventadescuentoId: venta.id, // Asignamos el valor del id existente como cajaId
      id: undefined, // Dejar el campo id undefined para que la base de datos lo genere automáticamente
    }));

    res.json(ventasDescuentoConId);
  } catch (error) {
    next(error);
  }
};

const obtenerVentasConDescuentoFiltradas = async (req, res, next) => {
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

    // Realiza la consulta a la base de datos
    const ventasConDescuentoFiltradas = await VentasDescuento.findAll({
      where: filters,
    });

    res.json(ventasConDescuentoFiltradas);
  } catch (error) {
    next(error);
  }
};

const crearVentasConDescuento = async (req, res, next) => {
  try {
    const ventasConDescuento = req.body; // Suponiendo que las ventas con descuento vienen en req.body
    // console.log("descuento", ventasConDescuento)

    // Validar si se recibieron datos
    if (!Array.isArray(ventasConDescuento)) {
      return res
        .status(400)
        .json({ error: "Los datos deben estar en formato de matriz." });
    }

    // Obtener el último ID de la tabla VentasAnuladas para la sucursal correspondiente
    const ultimoId = await obtenerUltimoIdTablaPorSucursal(
      VentasDescuento,
      "ventadescuentoId",
      ventasConDescuento[0].sucursal_id
    );
    // console.log("ultimo", ultimoId);

    // Iterar sobre los datos de las cajas y asignar el id como cajaId
    const ventasConDescuentoConId = ventasConDescuento.map((venta) => ({
      ...venta,
      ventadescuentoId: venta.id, // Asignamos el valor del id existente como cajaId
      id: null, // Dejar el campo id undefined para que la base de datos lo genere automáticamente
    }));

    // Mapear los datos para prepararlos para la inserción
    const nuevasVentasConDescuentoBulk = ventasConDescuentoConId
      .map((venta) => {
        // Verificar si el ID actual es mayor que el último ID en la tabla
        if (venta.ventadescuentoId > ultimoId) {
          return {
            id: venta.id,
            ventadescuentoId: venta.ventadescuentoId,
            fecha: venta.fecha,
            descuento: parseFloat(venta.descuento),
            monto: parseFloat(venta.monto),
            numeroticket: venta.numeroticket,
            sucursal_id: parseInt(venta.sucursal_id),
          };
        } else {
          // Si el ID actual es menor o igual al último ID, retornar null para excluirlo de la creación
          return null;
        }
      })
      .filter((venta) => venta !== null);

    // Insertar las nuevas ventas con descuento en la base de datos en lotes (bulk)
    const nuevasVentasConDescuento = await VentasDescuento.bulkCreate(
      nuevasVentasConDescuentoBulk
    );

    console.log("Registros de Ventas con Descuento creados exitosamente.");
    // Enviar las nuevas ventas con descuento creadas como respuesta
    res.status(201).json(nuevasVentasConDescuento);
  } catch (error) {
    console.error(
      "Error al crear los registros de Ventas con Descuento:",
      error
    );
    next(error);
  }
};

const obtenerVentasPorCliente = async (req, res, next) => {
  try {
    const ventasCliente = await VentasCliente.findAll();
    res.json(ventasCliente);
  } catch (error) {
    next(error);
  }
};

const obtenerVentasPorClienteFiltradas = async (req, res, next) => {
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
    // Realiza la consulta a la base de datos
    const ventasPorClienteFiltradas = await VentasCliente.findAll({
      where: filters,
    });

    res.json(ventasPorClienteFiltradas);
  } catch (error) {
    next(error);
  }
};

const crearVentasPorCliente = async (req, res, next) => {
  try {
    const ventasPorClienteData = req.body;

    // Validar los datos recibidos
    if (!Array.isArray(ventasPorClienteData)) {
      throw new Error(
        "Los datos de ventas por cliente deben ser proporcionados en forma de array."
      );
    }

    for (const venta of ventasPorClienteData) {
      if (
        typeof venta !== "object" ||
        !venta.cliente ||
        !venta.fecha ||
        !venta.total_monto ||
        !venta.sucursal_id
      ) {
        throw new Error(
          "Los datos de cada venta por cliente deben incluir los campos 'cliente', 'fecha', 'total_monto' y 'sucursal_id'."
        );
      }
    }

    // Obtener el último ID de la tabla VentasAnuladas para la sucursal correspondiente
    const ultimoId = await obtenerUltimoIdTablaPorSucursal(
      VentasCliente,
      "cierreventas_id",
      ventasPorClienteData[0].sucursal_id
    );

    // Mapear los datos para prepararlos para la inserción
    const ventasPorClienteBulk = ventasPorClienteData
      .map((venta) => {
        // Verificar si el ID actual es mayor que el último ID en la tabla
        if (venta.cierreventas_id > ultimoId) {
          return {
            cierreventas_id: venta.cierreventas_id,
            cliente: venta.cliente,
            fecha: venta.fecha,
            monto: parseFloat(venta.total_monto),
            sucursal_id: venta.sucursal_id,
          };
        } else {
          // Si el ID actual es menor o igual al último ID, retornar null para excluirlo de la creación
          return null;
        }
      })
      .filter((venta) => venta !== null);

    // Realizar la inserción en lotes (batch)
    const nuevasVentasPorCliente = await VentasCliente.bulkCreate(
      ventasPorClienteBulk
    );

    console.log("Registros de VentaCliente creados exitosamente.");
    res.status(201).json(nuevasVentasPorCliente);
  } catch (error) {
    console.error(
      "Error al crear los registros de VentaCliente:",
      error.message
    );
    res.status(400).json({ error: error.message });
    next(error);
  }
};

const obtenerVentasConArticulo = async (req, res, next) => {
  try {
    const ventasArticulo = await VentasArticulo.findAll();
    res.json(ventasArticulo);
  } catch (error) {
    next(error);
  }
};

const obtenerVentasConArticuloFiltradas = async (req, res, next) => {
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
    // Realiza la consulta a la base de datos
    const ventasConArticulos = await VentasArticulo.findAll({ where: filters });

    res.json(ventasConArticulos);
  } catch (error) {
    next(error);
  }
};

const obtenerMontoVentasConArticuloFiltradas = async (req, res, next) => {
  try {
    const { fechaDesde, fechaHasta, sucursalId, excludedCategories } = req.body;

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
    const ventasMontoConArticulo = await VentasArticulo.findAll({
      where: filters,
    });
    // Inicializa el monto total de la venta
    let montoTotalVenta = 0;
    const cantidades = [];

    // Recorre las ventas de artículos para calcular el monto total
    for (const ventaArticulo of ventasMontoConArticulo) {
      // Convertir ventaArticulo.articuloCodigo a string
      const articuloCodigoString = ventaArticulo.articuloCodigo.toString();

      // Busca el precio del artículo en la tabla de precios de artículos (ArticuloPrecioTabla)
      const precioArticulo = await ArticuloPrecioTabla.findOne({
        include: [
          {
            model: ArticuloTabla,
            where: {
              codigobarra: articuloCodigoString, // Utiliza el valor convertido a string
              subcategoria_id: {
                [Op.notIn]: excludedCategories, // Excluir artículos de estas categorías
              },
            },
          },
        ],
      });
      // Si se encuentra el precio del artículo y no está en una categoría excluida, se multiplica la cantidad de venta por el precio
      if (
        precioArticulo &&
        !excludedCategories.includes(
          precioArticulo.Articulotabla.subcategoria_id
        )
      ) {
        const cantidad = parseFloat(ventaArticulo.cantidad);
        const precio = parseFloat(precioArticulo.precio);
        montoTotalVenta += cantidad * precio;
        cantidades.push(cantidad); // Agregar la cantidad al array
      }
    }
    // Retorna el monto total de la venta
    res.json({ montoTotalVenta });
  } catch (error) {
    next(error);
  }
};

const obtenerCantidadPorArticulo = async (
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
    const ventasArticulos = await VentasArticulo.findAll({
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

    // Convierte el objeto en un array para el retorno
    const cantidadesArray = Object.values(cantidadesPorArticulo);

    // Retorna el objeto con las cantidades por cada artículo
    return cantidadesArray;
  } catch (error) {
    console.error("Error al obtener las cantidades por artículos:", error);
  }
};

const crearVentasConArticulo = async (req, res, next) => {
  try {
    const ventas = req.body;

    // Validar si se recibieron datos
    if (!Array.isArray(ventas)) {
      return res
        .status(400)
        .json({ error: "Los datos deben estar en formato de matriz." });
    }

    // Obtener el último ID de la tabla VentasAnuladas para la sucursal correspondiente
    const ultimoId = await obtenerUltimoIdTablaPorSucursal(
      VentasArticulo,
      "ventaarticuloId",
      ventas[0].sucursal_id
    );
    console.log("ultimo------------------", ultimoId);

    const ventasConId = ventas.map((venta) => ({
      ...venta,
      ventaarticuloId: venta.id, // Asignamos el valor del id existente como cajaId
      id: null, // Dejar el campo id undefined para que la base de datos lo genere automáticamente
    }));

    // Filtrar los datos para excluir aquellos con ventaarticuloId menor o igual a ultimoId
    const nuevasVentasConArticuloBulk = ventasConId
      .filter(venta => venta.ventaarticuloId > ultimoId)
      .map((venta) => ({
        id: venta.id,
        ventaarticuloId: venta.ventaarticuloId,
        fecha: venta.fecha,
        sucursal_id: venta.sucursal_id,
        articuloCodigo: venta.codigo,
        articuloDescripcion: venta.descripcion,
        cantidad: parseFloat(venta.cantidad.toFixed(3)),
        monto_lista: venta.preciolista,
      }));

    console.log("ventasbul", nuevasVentasConArticuloBulk);

    // Insertar las nuevas ventas con artículo en la base de datos en lotes (bulk)
    const nuevasVentasConArticulo = await VentasArticulo.bulkCreate(
      nuevasVentasConArticuloBulk
    );

    console.log("Registros de VentaArticulo creados exitosamente.");
    // Enviar las nuevas ventas con artículo creadas como respuesta
    res.status(201).json(nuevasVentasConArticulo);
  } catch (error) {
    console.error("Error al crear los registros de VentaArticulo:", error);
    next(error);
  }
};

export {
  obtenerVentasTotales,
  obtenerVentasFiltradas,
  crearVentaTotal,
  obtenerVentasAnuladas,
  obtenerVentasAnuladasFiltradas,
  crearVentasAnuladas,
  obtenerVentasConDescuento,
  obtenerVentasConDescuentoFiltradas,
  crearVentasConDescuento,
  obtenerVentasPorCliente,
  obtenerVentasPorClienteFiltradas,
  crearVentasPorCliente,
  obtenerVentasConArticulo,
  obtenerCantidadPorArticulo,
  obtenerVentasConArticuloFiltradas,
  obtenerMontoVentasConArticuloFiltradas,
  crearVentasConArticulo,
};
