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
import VentasPorUsuario from "../../models/rinde/ventasPorUsuarioModel.js";
import VentasArticulosKgPorUsuario from "../../models/rinde/ventasArticulosKgUsuarioModel.js";
import CantidadTicketPorUsuario from "../../models/rinde/cantidadTicketPorUsuarioModel.js";

const obtenerVentasTotales = async (req, res, next) => {
  try {
    const ventasTotales = await VentasTotal.findAll();
    res.json(ventasTotales);
  } catch (error) {
    next(error);
  }
};

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
      montosARestarPorFechaYSucursal[key] += Number(venta.cantidad) * Number(venta.monto_lista);
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

// const crearVentaTotal = async (req, res, next) => {
//   try {
//     // Extraer los datos del cuerpo de la solicitud
//     const ventasTotales = req.body;
//     console.log("req.body.ventas", req.body)
//     // Validar si se recibieron datos
//     if (!Array.isArray(ventasTotales)) {
//       return res
//         .status(400)
//         .json({ error: "Los datos deben estar en formato de matriz." });
//     }

//     // Obtener el último ID de la tabla VentaTotal para la sucursal correspondiente
//     const ultimoId = await obtenerUltimoIdTablaPorSucursal(
//       VentaTotal,
//       "cierreventa_id",
//       ventasTotales[0].sucursal_id
//     );
//     // console.log("ultimo", ultimoId);

//     // Mapear los datos para prepararlos para la inserción
//     const nuevasVentasTotalesBulk = ventasTotales.map((venta) => {
//       const { id, fecha } = venta.data;
//       const { monto_total, sucursal_id } = venta;

//       // Verificar si el ID actual es mayor que el último ID en la tabla
//       if (id > ultimoId) {
//         return {
//           fecha: fecha,
//           cierreventa_id: id,
//           monto: parseFloat(monto_total),
//           sucursal_id: parseInt(sucursal_id),
//         };
//       } else {
//         // Si el ID actual es menor o igual al último ID, retornar null para excluirlo de la creación
//         return null;
//       }
//     });

//     // Filtrar los elementos nulos del array
//     const nuevasVentasTotalesFiltradas = nuevasVentasTotalesBulk.filter(
//       (venta) => venta !== null
//     );

//     // console.log("nuevasVentasTotalesFiltradas", nuevasVentasTotalesFiltradas);

//     // Insertar las nuevas ventas totales en la base de datos en lotes (bulk)
//     const nuevasVentasTotales = await VentaTotal.bulkCreate(
//       nuevasVentasTotalesFiltradas
//     );

//     // Enviar las nuevas ventas totales creadas como respuesta
//     res.status(201).json(nuevasVentasTotales);
//   } catch (error) {
//     // Manejar errores
//     console.error("Error al crear las ventas totales:", error);
//     next(error);
//   }
// };

const crearVentaTotal = async (req, res, next) => {
  try {
    const ventasTotales = req.body;
    if (!Array.isArray(ventasTotales)) {
      return res
        .status(400)
        .json({ error: "Los datos deben estar en formato de matriz." });
    }

    const sucursalId = ventasTotales[0].sucursal_id;

    // Traer todos los cierres existentes para esa sucursal
    const cierresExistentes = await VentaTotal.findAll({
      where: { sucursal_id: sucursalId },
      attributes: ['cierreventa_id', 'fecha'],
      raw: true,
    });

    // Crear un mapa para búsqueda rápida: { cierreventa_id: fechaISO }
    const mapaCierres = new Map();
    cierresExistentes.forEach(({ cierreventa_id, fecha }) => {
      try {
        const fechaObj = new Date(fecha);
        const fechaISO = fechaObj.toISOString().split("T")[0];
        mapaCierres.set(cierreventa_id, fechaISO);
      } catch (e) {
        console.warn(`Fecha inválida encontrada en la base: ${fecha}`);
        mapaCierres.set(cierreventa_id, null);
      }
    });

    // Mapear y filtrar solo ventas nuevas o con fecha distinta
    const nuevasVentasTotales = ventasTotales
      .map((venta) => {
        const { id, fecha } = venta.data;
        const { monto_total, sucursal_id } = venta;

        let fechaISO = null;
        try {
          fechaISO = new Date(fecha).toISOString().split("T")[0];
        } catch (e) {
          console.warn(`Fecha inválida recibida en el body: ${fecha}`);
          return null;
        }

        const fechaExistente = mapaCierres.get(id);
        const yaExisteMismoDia = fechaExistente === fechaISO;

        if (!fechaExistente || !yaExisteMismoDia) {
          return {
            fecha: fecha,
            cierreventa_id: id,
            monto: parseFloat(monto_total),
            sucursal_id: parseInt(sucursal_id),
          };
        }
        return null;
      })
      .filter((venta) => venta !== null);

    if (nuevasVentasTotales.length === 0) {
      return res.status(200).json({ mensaje: "No hay nuevas ventas para insertar." });
    }

    const ventasCreadas = await VentaTotal.bulkCreate(nuevasVentasTotales);
    res.status(201).json(ventasCreadas);
  } catch (error) {
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

// const crearVentasAnuladas = async (req, res, next) => {
//   try {
//     // Obtener las ventas anuladas del cuerpo de la solicitud
//     const ventasAnuladas = req.body;

//     // Validar si se recibieron datos en formato de matriz
//     if (!Array.isArray(ventasAnuladas)) {
//       return res
//         .status(400)
//         .json({ error: "Los datos deben estar en formato de matriz." });
//     }

//     // Obtener el último ID de la tabla VentasAnuladas para la sucursal correspondiente
//     const ultimoId = await obtenerUltimoIdTablaPorSucursal(
//       VentasAnuladas,
//       "ventaanuladoId",
//       ventasAnuladas[0].sucursal_id
//     );

//     // Iterar sobre las ventas anuladas y asignar el id existente como ventaanuladoId
//     const ventasAnuladasConId = ventasAnuladas.map((venta) => ({
//       ...venta,
//       ventaanuladoId: venta.id, // Asignamos el valor del id existente como ventaanuladoId
//       id: null, // Dejar el campo id undefined para que la base de datos lo genere automáticamente
//     }));

//     // Mapear los datos para prepararlos para la inserción
//     const nuevasVentasAnuladasBulk = ventasAnuladasConId
//       .map((ventaAnulada) => {
//         // Verificar si el ID actual es mayor que el último ID en la tabla
//         if (ventaAnulada.ventaanuladoId > ultimoId) {
//           return {
//             id: ventaAnulada.id,
//             ventaanuladoId: ventaAnulada.ventaanuladoId,
//             fecha: ventaAnulada.fecha,
//             monto: parseFloat(ventaAnulada.monto),
//             numeroticket: ventaAnulada.numeroticket,
//             sucursal_id: parseInt(ventaAnulada.sucursal_id),
//           };
//         } else {
//           // Si el ID actual es menor o igual al último ID, retornar null para excluirlo de la creación
//           return null;
//         }
//       })
//       .filter((ventaAnulada) => ventaAnulada !== null);

//     // Insertar las nuevas ventas anuladas en la base de datos en lotes (bulk)
//     const nuevasVentasAnuladas = await VentasAnuladas.bulkCreate(
//       nuevasVentasAnuladasBulk
//     );

//     console.log("Registros de Ventas Anuladas creados exitosamente.");

//     // Enviar las nuevas ventas anuladas creadas como respuesta
//     res.status(201).json(nuevasVentasAnuladas);
//   } catch (error) {
//     // Manejar errores
//     console.error("Error al crear los registros de Ventas Anuladas:", error);
//     next(error);
//   }
// };

const crearVentasAnuladas = async (req, res, next) => {
  try {
    const ventasAnuladas = req.body;

    if (!Array.isArray(ventasAnuladas)) {
      return res
        .status(400)
        .json({ error: "Los datos deben estar en formato de matriz." });
    }

    const sucursalId = ventasAnuladas[0].sucursal_id;

    // Traer los registros existentes para esa sucursal
    const anuladasExistentes = await VentasAnuladas.findAll({
      where: { sucursal_id: sucursalId },
      attributes: ['ventaanuladoId', 'fecha'],
      raw: true,
    });

    // Crear un mapa para buscar por ID+fecha
    const mapaAnuladas = new Map();
    anuladasExistentes.forEach(({ ventaanuladoId, fecha }) => {
      try {
        const fechaISO = new Date(fecha).toISOString().split("T")[0];
        mapaAnuladas.set(`${ventaanuladoId}_${fechaISO}`, true);
      } catch (e) {
        console.warn(`Fecha inválida en BD para ventaanuladoId ${ventaanuladoId}`);
      }
    });

    // Preparar nuevas ventas anuladas
    const nuevasVentasAnuladas = ventasAnuladas
      .map((venta) => {
        const ventaanuladoId = venta.id;
        let fechaISO = null;
        try {
          fechaISO = new Date(venta.fecha).toISOString().split("T")[0];
        } catch (e) {
          console.warn(`Fecha inválida recibida para ventaanuladoId ${venta.id}`);
          return null;
        }

        const clave = `${ventaanuladoId}_${fechaISO}`;
        if (!mapaAnuladas.has(clave)) {
          return {
            id: null, // para autoincrement
            ventaanuladoId: ventaanuladoId,
            fecha: venta.fecha,
            monto: parseFloat(venta.monto),
            numeroticket: venta.numeroticket,
            sucursal_id: parseInt(venta.sucursal_id),
          };
        }

        return null;
      })
      .filter((venta) => venta !== null);

    if (nuevasVentasAnuladas.length === 0) {
      return res.status(200).json({ mensaje: "No hay nuevas ventas anuladas para insertar." });
    }

    const insertadas = await VentasAnuladas.bulkCreate(nuevasVentasAnuladas);
    console.log("Registros de Ventas Anuladas creados exitosamente.");
    res.status(201).json(insertadas);
  } catch (error) {
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

// const crearVentasConDescuento = async (req, res, next) => {
//   try {
//     const ventasConDescuento = req.body; // Suponiendo que las ventas con descuento vienen en req.body
//     // console.log("descuento", ventasConDescuento)

//     // Validar si se recibieron datos
//     if (!Array.isArray(ventasConDescuento)) {
//       return res
//         .status(400)
//         .json({ error: "Los datos deben estar en formato de matriz." });
//     }

//     // Obtener el último ID de la tabla VentasAnuladas para la sucursal correspondiente
//     const ultimoId = await obtenerUltimoIdTablaPorSucursal(
//       VentasDescuento,
//       "ventadescuentoId",
//       ventasConDescuento[0].sucursal_id
//     );
//     // console.log("ultimo", ultimoId);

//     // Iterar sobre los datos de las cajas y asignar el id como cajaId
//     const ventasConDescuentoConId = ventasConDescuento.map((venta) => ({
//       ...venta,
//       ventadescuentoId: venta.id, // Asignamos el valor del id existente como cajaId
//       id: null, // Dejar el campo id undefined para que la base de datos lo genere automáticamente
//     }));

//     // Mapear los datos para prepararlos para la inserción
//     const nuevasVentasConDescuentoBulk = ventasConDescuentoConId
//       .map((venta) => {
//         // Verificar si el ID actual es mayor que el último ID en la tabla
//         if (venta.ventadescuentoId > ultimoId) {
//           return {
//             id: venta.id,
//             ventadescuentoId: venta.ventadescuentoId,
//             fecha: venta.fecha,
//             descuento: parseFloat(venta.descuento),
//             monto: parseFloat(venta.monto),
//             numeroticket: venta.numeroticket,
//             sucursal_id: parseInt(venta.sucursal_id),
//           };
//         } else {
//           // Si el ID actual es menor o igual al último ID, retornar null para excluirlo de la creación
//           return null;
//         }
//       })
//       .filter((venta) => venta !== null);

//     // Insertar las nuevas ventas con descuento en la base de datos en lotes (bulk)
//     const nuevasVentasConDescuento = await VentasDescuento.bulkCreate(
//       nuevasVentasConDescuentoBulk
//     );

//     console.log("Registros de Ventas con Descuento creados exitosamente.");
//     // Enviar las nuevas ventas con descuento creadas como respuesta
//     res.status(201).json(nuevasVentasConDescuento);
//   } catch (error) {
//     console.error(
//       "Error al crear los registros de Ventas con Descuento:",
//       error
//     );
//     next(error);
//   }
// };


const crearVentasConDescuento = async (req, res, next) => {
  try {
    const ventasConDescuento = req.body;

    if (!Array.isArray(ventasConDescuento)) {
      return res
        .status(400)
        .json({ error: "Los datos deben estar en formato de matriz." });
    }

    const sucursalId = ventasConDescuento[0].sucursal_id;

    // Buscar registros existentes en la base para esa sucursal
    const descuentosExistentes = await VentasDescuento.findAll({
      where: { sucursal_id: sucursalId },
      attributes: ['ventadescuentoId', 'fecha'],
      raw: true,
    });

    // Crear mapa: { ventadescuentoId_fechaISO => true }
    const mapaDescuentos = new Map();
    descuentosExistentes.forEach(({ ventadescuentoId, fecha }) => {
      try {
        const fechaISO = new Date(fecha).toISOString().split("T")[0];
        mapaDescuentos.set(`${ventadescuentoId}_${fechaISO}`, true);
      } catch (e) {
        console.warn(`Fecha inválida en BD para ventadescuentoId ${ventadescuentoId}`);
      }
    });

    // Preparar nuevas ventas con descuento
    const nuevasVentasConDescuento = ventasConDescuento
      .map((venta) => {
        const ventadescuentoId = venta.id;
        let fechaISO = null;
        try {
          fechaISO = new Date(venta.fecha).toISOString().split("T")[0];
        } catch (e) {
          console.warn(`Fecha inválida recibida para ventadescuentoId ${venta.id}`);
          return null;
        }

        const clave = `${ventadescuentoId}_${fechaISO}`;
        if (!mapaDescuentos.has(clave)) {
          return {
            id: null,
            ventadescuentoId: ventadescuentoId,
            fecha: venta.fecha,
            descuento: parseFloat(venta.descuento),
            monto: parseFloat(venta.monto),
            numeroticket: venta.numeroticket,
            sucursal_id: parseInt(venta.sucursal_id),
          };
        }
        return null;
      })
      .filter((venta) => venta !== null);

    if (nuevasVentasConDescuento.length === 0) {
      return res.status(200).json({ mensaje: "No hay nuevas ventas con descuento para insertar." });
    }

    const insertadas = await VentasDescuento.bulkCreate(nuevasVentasConDescuento);
    console.log("Registros de Ventas con Descuento creados exitosamente.");
    res.status(201).json(insertadas);
  } catch (error) {
    console.error("Error al crear los registros de Ventas con Descuento:", error);
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

// const crearVentasPorCliente = async (req, res, next) => {
//   try {
//     const ventasPorClienteData = req.body;

//     // Validar los datos recibidos
//     if (!Array.isArray(ventasPorClienteData)) {
//       throw new Error(
//         "Los datos de ventas por cliente deben ser proporcionados en forma de array."
//       );
//     }

//     for (const venta of ventasPorClienteData) {
//       if (
//         typeof venta !== "object" ||
//         !venta.cliente ||
//         !venta.fecha ||
//         !venta.total_monto ||
//         !venta.sucursal_id
//       ) {
//         throw new Error(
//           "Los datos de cada venta por cliente deben incluir los campos 'cliente', 'fecha', 'total_monto' y 'sucursal_id'."
//         );
//       }
//     }

//     // Obtener el último ID de la tabla VentasAnuladas para la sucursal correspondiente
//     const ultimoId = await obtenerUltimoIdTablaPorSucursal(
//       VentasCliente,
//       "cierreventas_id",
//       ventasPorClienteData[0].sucursal_id
//     );

//     // Mapear los datos para prepararlos para la inserción
//     const ventasPorClienteBulk = ventasPorClienteData
//       .map((venta) => {
//         // Verificar si el ID actual es mayor que el último ID en la tabla
//         if (venta.cierreventas_id > ultimoId) {
//           return {
//             cierreventas_id: venta.cierreventas_id,
//             cliente: venta.cliente,
//             fecha: venta.fecha,
//             monto: parseFloat(venta.total_monto),
//             sucursal_id: venta.sucursal_id,
//           };
//         } else {
//           // Si el ID actual es menor o igual al último ID, retornar null para excluirlo de la creación
//           return null;
//         }
//       })
//       .filter((venta) => venta !== null);

//     // Realizar la inserción en lotes (batch)
//     const nuevasVentasPorCliente = await VentasCliente.bulkCreate(
//       ventasPorClienteBulk
//     );

//     console.log("Registros de VentaCliente creados exitosamente.");
//     res.status(201).json(nuevasVentasPorCliente);
//   } catch (error) {
//     console.error(
//       "Error al crear los registros de VentaCliente:",
//       error.message
//     );
//     res.status(400).json({ error: error.message });
//     next(error);
//   }
// };


const crearVentasPorCliente = async (req, res, next) => {
  try {
    const ventasPorClienteData = req.body;

    if (!Array.isArray(ventasPorClienteData)) {
      throw new Error("Los datos deben ser proporcionados en forma de array.");
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
          "Cada venta debe incluir: cliente, fecha, total_monto y sucursal_id."
        );
      }
    }

    const sucursalId = ventasPorClienteData[0].sucursal_id;

    // Obtener registros existentes de la sucursal
    const ventasExistentes = await VentasCliente.findAll({
      where: { sucursal_id: sucursalId },
      attributes: ["cierreventas_id", "fecha"],
      raw: true,
    });

    // Crear mapa de existencia: cierreventas_id + fechaISO
    const mapaVentas = new Map();
    ventasExistentes.forEach(({ cierreventas_id, fecha }) => {
      try {
        const fechaISO = new Date(fecha).toISOString().split("T")[0];
        mapaVentas.set(`${cierreventas_id}_${fechaISO}`, true);
      } catch (e) {
        console.warn(`Fecha inválida en BD para cierreventas_id ${cierreventas_id}`);
      }
    });

    // Filtrar e insertar solo nuevas ventas (id+fecha no repetido)
    const ventasPorClienteBulk = ventasPorClienteData
      .map((venta) => {
        const cierreventas_id = venta.cierreventas_id;
        let fechaISO = null;
        try {
          fechaISO = new Date(venta.fecha).toISOString().split("T")[0];
        } catch (e) {
          console.warn(`Fecha inválida en body para cierreventas_id ${cierreventas_id}`);
          return null;
        }

        const clave = `${cierreventas_id}_${fechaISO}`;
        if (!mapaVentas.has(clave)) {
          return {
            cierreventas_id: cierreventas_id,
            cliente: venta.cliente,
            fecha: venta.fecha,
            monto: parseFloat(venta.total_monto),
            sucursal_id: parseInt(venta.sucursal_id),
          };
        }
        return null;
      })
      .filter((venta) => venta !== null);

    if (ventasPorClienteBulk.length === 0) {
      return res.status(200).json({ mensaje: "No hay nuevas ventas para insertar." });
    }

    const nuevasVentasPorCliente = await VentasCliente.bulkCreate(ventasPorClienteBulk);

    console.log("Registros de VentaCliente creados exitosamente.");
    res.status(201).json(nuevasVentasPorCliente);
  } catch (error) {
    console.error("Error al crear los registros de VentaCliente:", error.message);
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
        montoTotalVenta += Number(cantidad) * Number(precio);
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

// const crearVentasConArticulo = async (req, res, next) => {
//   try {
//     const ventas = req.body;

//     // Validar si se recibieron datos
//     if (!Array.isArray(ventas)) {
//       return res
//         .status(400)
//         .json({ error: "Los datos deben estar en formato de matriz." });
//     }

//     // Obtener el último ID de la tabla VentasAnuladas para la sucursal correspondiente
//     const ultimoId = await obtenerUltimoIdTablaPorSucursal(
//       VentasArticulo,
//       "ventaarticuloId",
//       ventas[0].sucursal_id
//     );
//     // console.log("ultimo------------------", ultimoId);

//     const ventasConId = ventas.map((venta) => ({
//       ...venta,
//       ventaarticuloId: venta.id, // Asignamos el valor del id existente como cajaId
//       id: null, // Dejar el campo id undefined para que la base de datos lo genere automáticamente
//     }));

//     // Filtrar los datos para excluir aquellos con ventaarticuloId menor o igual a ultimoId
//     const nuevasVentasConArticuloBulk = ventasConId
//       .filter(venta => venta.ventaarticuloId > ultimoId)
//       .map((venta) => ({
//         id: venta.id,
//         ventaarticuloId: venta.ventaarticuloId,
//         fecha: venta.fecha,
//         sucursal_id: venta.sucursal_id,
//         articuloCodigo: venta.codigo,
//         articuloDescripcion: venta.descripcion,
//         cantidad: parseFloat(venta.cantidad.toFixed(3)),
//         monto_lista: venta.preciolista,
//       }));

//     // console.log("ventasbul", nuevasVentasConArticuloBulk);

//     // Insertar las nuevas ventas con artículo en la base de datos en lotes (bulk)
//     const nuevasVentasConArticulo = await VentasArticulo.bulkCreate(
//       nuevasVentasConArticuloBulk
//     );

//     console.log("Registros de VentaArticulo creados exitosamente.");
//     // Enviar las nuevas ventas con artículo creadas como respuesta
//     res.status(201).json(nuevasVentasConArticulo);
//   } catch (error) {
//     console.error("Error al crear los registros de VentaArticulo:", error);
//     next(error);
//   }
// };

const crearVentasConArticulo = async (req, res, next) => {
  try {
    const ventas = req.body;

    if (!Array.isArray(ventas)) {
      return res
        .status(400)
        .json({ error: "Los datos deben estar en formato de matriz." });
    }

    const sucursalId = ventas[0].sucursal_id;

    // Obtener registros existentes para esa sucursal
    const ventasExistentes = await VentasArticulo.findAll({
      where: { sucursal_id: sucursalId },
      attributes: ["ventaarticuloId", "fecha"],
      raw: true,
    });

    // Crear mapa de combinación ID + fecha
    const mapaVentas = new Map();
    ventasExistentes.forEach(({ ventaarticuloId, fecha }) => {
      try {
        const fechaISO = new Date(fecha).toISOString().split("T")[0];
        mapaVentas.set(`${ventaarticuloId}_${fechaISO}`, true);
      } catch (e) {
        console.warn(`Fecha inválida en BD para ventaarticuloId ${ventaarticuloId}`);
      }
    });

    // Armar array de nuevas ventas que no estén duplicadas por ID+fecha
    const nuevasVentasConArticuloBulk = ventas
      .map((venta) => {
        const ventaarticuloId = venta.id;
        let fechaISO = null;

        try {
          fechaISO = new Date(venta.fecha).toISOString().split("T")[0];
        } catch (e) {
          console.warn(`Fecha inválida recibida para ventaarticuloId ${venta.id}`);
          return null;
        }

        const clave = `${ventaarticuloId}_${fechaISO}`;
        if (!mapaVentas.has(clave)) {
          return {
            id: null,
            ventaarticuloId: ventaarticuloId,
            fecha: venta.fecha,
            sucursal_id: venta.sucursal_id,
            articuloCodigo: venta.codigo,
            articuloDescripcion: venta.descripcion,
            cantidad: parseFloat(venta.cantidad.toFixed(3)),
            monto_lista: venta.preciolista,
          };
        }
        return null;
      })
      .filter((venta) => venta !== null);

    if (nuevasVentasConArticuloBulk.length === 0) {
      return res.status(200).json({ mensaje: "No hay nuevas ventas con artículo para insertar." });
    }

    const nuevasVentasConArticulo = await VentasArticulo.bulkCreate(nuevasVentasConArticuloBulk);
    console.log("Registros de VentaArticulo creados exitosamente.");
    res.status(201).json(nuevasVentasConArticulo);
  } catch (error) {
    console.error("Error al crear los registros de VentaArticulo:", error);
    next(error);
  }
};

// Función para obtener la fecha del último registro para una sucursal específica
const obtenerUltimaFechaRegistroPorSucursal = async (sucursalId) => {
  try {
    const ultimoRegistro = await VentasPorUsuario.findOne({
      attributes: [[sequelize.fn("MAX", sequelize.col("fecha")), "ultimaFecha"]],
      where: { sucursal_id: sucursalId }
    });

    return ultimoRegistro ? ultimoRegistro.dataValues.ultimaFecha : null;
  } catch (error) {
    console.error("Error al obtener la fecha del último registro por sucursal:", error);
    throw error;
  }
};

// const crearVentasPorUsuario = async (req, res, next) => {
//   try {
//     const ventasPorUsuarioData = req.body;

//     // Validar los datos recibidos
//     if (!Array.isArray(ventasPorUsuarioData)) {
//       throw new Error("Los datos de ventas por usuario deben ser proporcionados en forma de array.");
//     }

//     // Obtener la sucursal_id de los datos
//     const sucursalId = ventasPorUsuarioData[0].sucursal_id;

//     // Obtener la fecha del último registro para la sucursal específica
//     const ultimaFecha = await obtenerUltimaFechaRegistroPorSucursal(sucursalId);

//     // Filtrar los datos para incluir solo los registros posteriores a la última fecha
//     const nuevasVentasPorUsuario = ventasPorUsuarioData.filter(venta => new Date(venta.fecha) > new Date(ultimaFecha));

//     // Mapear los datos para prepararlos para la inserción
//     const ventasPorUsuarioBulk = nuevasVentasPorUsuario.map((venta) => ({
//       fecha: venta.fecha,
//       sucursal_id: venta.sucursal_id,
//       total_monto: parseFloat(venta.total_monto),
//       usuario_id: venta.usuario_id,
//     }));

//     // Insertar los nuevos registros en la base de datos en lotes (bulk)
//     const nuevasVentasPorUsuarioCreadas = await VentasPorUsuario.bulkCreate(ventasPorUsuarioBulk);

//     console.log("Registros de VentasPorUsuario creados exitosamente.");
//     res.status(201).json(nuevasVentasPorUsuarioCreadas);
//   } catch (error) {
//     console.error("Error al crear los registros de VentasPorUsuario:", error);
//     res.status(400).json({ error: error.message });
//     next(error);
//   }
// };

const crearVentasPorUsuario = async (req, res, next) => {
  try {
    const ventasPorUsuarioData = req.body;

    if (!Array.isArray(ventasPorUsuarioData)) {
      throw new Error("Los datos de ventas por usuario deben ser proporcionados en forma de array.");
    }

    const sucursalId = ventasPorUsuarioData[0].sucursal_id;

    // Traer registros existentes de esa sucursal
    const registrosExistentes = await VentasPorUsuario.findAll({
      where: { sucursal_id: sucursalId },
      attributes: ["fecha", "usuario_id"],
      raw: true,
    });

    // Crear un mapa con clave: fechaISO_usuarioId
    const mapaExistentes = new Map();
    registrosExistentes.forEach(({ fecha, usuario_id }) => {
      try {
        const fechaISO = new Date(fecha).toISOString().split("T")[0];
        mapaExistentes.set(`${fechaISO}_${usuario_id}`, true);
      } catch (e) {
        console.warn(`Fecha inválida en BD para usuario_id ${usuario_id}`);
      }
    });

    // Filtrar datos que no existan aún
    const ventasPorUsuarioBulk = ventasPorUsuarioData
      .map((venta) => {
        let fechaISO = null;
        try {
          fechaISO = new Date(venta.fecha).toISOString().split("T")[0];
        } catch (e) {
          console.warn(`Fecha inválida en body para usuario_id ${venta.usuario_id}`);
          return null;
        }

        const clave = `${fechaISO}_${venta.usuario_id}`;
        if (!mapaExistentes.has(clave)) {
          return {
            fecha: venta.fecha,
            sucursal_id: venta.sucursal_id,
            total_monto: parseFloat(venta.total_monto),
            usuario_id: venta.usuario_id,
          };
        }
        return null;
      })
      .filter((venta) => venta !== null);

    if (ventasPorUsuarioBulk.length === 0) {
      return res.status(200).json({ mensaje: "No hay nuevas ventas por usuario para insertar." });
    }

    const nuevasVentasPorUsuarioCreadas = await VentasPorUsuario.bulkCreate(ventasPorUsuarioBulk);

    console.log("Registros de VentasPorUsuario creados exitosamente.");
    res.status(201).json(nuevasVentasPorUsuarioCreadas);
  } catch (error) {
    console.error("Error al crear los registros de VentasPorUsuario:", error);
    res.status(400).json({ error: error.message });
    next(error);
  }
};

// Función para obtener la fecha del último registro para una sucursal específica
const obtenerUltimaFechaRegistroPorSucursalPorUsuario = async (sucursalId) => {
  try {
    const ultimoRegistro = await VentasArticulosKgPorUsuario.findOne({
      attributes: [[sequelize.fn("MAX", sequelize.col("fecha")), "ultimaFecha"]],
      where: { sucursal_id: sucursalId }
    });

    return ultimoRegistro ? ultimoRegistro.dataValues.ultimaFecha : null;
  } catch (error) {
    console.error("Error al obtener la fecha del último registro por sucursal:", error);
    throw error;
  }
};

// const crearVentasArticulosKgPorUsuario = async (req, res, next) => {
//   try {
//     const ventasArticulosData = req.body;

//     // Validar los datos recibidos
//     if (!Array.isArray(ventasArticulosData)) {
//       throw new Error("Los datos de ventas de artículos por usuario deben ser proporcionados en forma de array.");
//     }

//     // Obtener la sucursal_id de los datos
//     const sucursalId = ventasArticulosData[0].sucursal_id;

//     // Obtener la fecha del último registro para la sucursal específica
//     const ultimaFecha = await obtenerUltimaFechaRegistroPorSucursalPorUsuario(sucursalId);

//     // console.log("ventasArticulosData", ventasArticulosData)

//     // Filtrar los datos para incluir solo los registros posteriores a la última fecha
//     const nuevasVentasArticulos = ventasArticulosData.filter(venta => new Date(venta.fecha) > new Date(ultimaFecha));

//     // console.log("nuevasventas", nuevasVentasArticulos)

//     // Agrupar los artículos por articulocodigo y sumar total_cantidadpeso
//     const articulosAgrupados = {};

//     nuevasVentasArticulos.forEach((venta) => {
//       const fecha = venta.fecha;
//       const sucursal_id = venta.sucursal_id;
//       const usuario_id = venta.usuario_id;

//       venta.articulos.forEach((articulo) => {
//         const key = `${fecha}-${sucursal_id}-${usuario_id}-${articulo.articulocodigo}`;

//         if (!articulosAgrupados[key]) {
//           articulosAgrupados[key] = {
//             articulocodigo: articulo.articulocodigo,
//             total_cantidadpeso: 0,
//             fecha,
//             sucursal_id,
//             usuario_id,
//           };
//         }

//         articulosAgrupados[key].total_cantidadpeso += parseFloat(articulo.total_cantidadpeso);
//       });
//     });

//     // Convertir el objeto de artículos agrupados a un array
//     const ventasArticulosBulk = Object.values(articulosAgrupados);
//     // console.log("ventasarticulos", ventasArticulosBulk)
//     // Insertar los nuevos registros en la base de datos en lotes (bulk)
//     const nuevasVentasArticulosCreadas = await VentasArticulosKgPorUsuario.bulkCreate(ventasArticulosBulk);

//     console.log("Registros de VentasArticulosKgPorUsuario creados exitosamente.");
//     res.status(201).json(nuevasVentasArticulosCreadas);
//   } catch (error) {
//     console.error("Error al crear los registros de VentasArticulosKgPorUsuario:", error);
//     res.status(400).json({ error: error.message });
//     next(error);
//   }
// };

const crearVentasArticulosKgPorUsuario = async (req, res, next) => {
  try {
    const ventasArticulosData = req.body;

    if (!Array.isArray(ventasArticulosData)) {
      throw new Error("Los datos deben ser proporcionados en forma de array.");
    }

    const sucursalId = ventasArticulosData[0].sucursal_id;

    // Obtener todos los registros existentes de esa sucursal
    const registrosExistentes = await VentasArticulosKgPorUsuario.findAll({
      where: { sucursal_id: sucursalId },
      attributes: ["fecha", "sucursal_id", "usuario_id", "articulocodigo"],
      raw: true,
    });

    // Crear mapa con claves únicas: fechaISO-sucursal-usuario-articulo
    const mapaExistentes = new Map();
    registrosExistentes.forEach(({ fecha, sucursal_id, usuario_id, articulocodigo }) => {
      try {
        const fechaISO = new Date(fecha).toISOString().split("T")[0];
        const clave = `${fechaISO}-${sucursal_id}-${usuario_id}-${articulocodigo}`;
        mapaExistentes.set(clave, true);
      } catch (e) {
        console.warn(`Fecha inválida en BD para usuario ${usuario_id} - artículo ${articulocodigo}`);
      }
    });

    // Agrupar los artículos y sumar cantidad
    const articulosAgrupados = {};

    ventasArticulosData.forEach((venta) => {
      const fechaISO = new Date(venta.fecha).toISOString().split("T")[0];
      const { sucursal_id, usuario_id } = venta;

      venta.articulos.forEach((articulo) => {
        const clave = `${fechaISO}-${sucursal_id}-${usuario_id}-${articulo.articulocodigo}`;

        // Solo si no existe en base
        if (!mapaExistentes.has(clave)) {
          if (!articulosAgrupados[clave]) {
            articulosAgrupados[clave] = {
              articulocodigo: articulo.articulocodigo,
              total_cantidadpeso: 0,
              fecha: venta.fecha,
              sucursal_id,
              usuario_id,
            };
          }
          articulosAgrupados[clave].total_cantidadpeso += parseFloat(articulo.total_cantidadpeso);
        }
      });
    });

    const ventasArticulosBulk = Object.values(articulosAgrupados);

    if (ventasArticulosBulk.length === 0) {
      return res.status(200).json({ mensaje: "No hay nuevas ventas de artículos para insertar." });
    }

    const nuevasVentasArticulosCreadas = await VentasArticulosKgPorUsuario.bulkCreate(ventasArticulosBulk);

    console.log("Registros de VentasArticulosKgPorUsuario creados exitosamente.");
    res.status(201).json(nuevasVentasArticulosCreadas);
  } catch (error) {
    console.error("Error al crear los registros de VentasArticulosKgPorUsuario:", error);
    res.status(400).json({ error: error.message });
    next(error);
  }
};

const obtenerVentasPorUsuarioFiltradas = async (req, res, next) => {
  try {
    const { fechaDesde, fechaHasta, sucursalId } = req.body;

    const filters = {
      fecha: {
        [Op.between]: [fechaDesde, fechaHasta],
      },
    };

    if (sucursalId) {
      filters.sucursal_id = sucursalId;
    }

    const ventasFiltradas = await VentasPorUsuario.findAll({ where: filters });
    
    res.json(ventasFiltradas);
  } catch (error) {
    console.error("Error al obtener las ventas por usuario filtradas:", error);
    next(error);
  }
};

const obtenerKgPorUsuarioFiltradas = async (req, res, next) => {
  try {
    const { fechaDesde, fechaHasta, sucursalId } = req.body;

    const filters = {
      fecha: {
        [Op.between]: [fechaDesde, fechaHasta],
      },
      articulocodigo: {
        [Op.notIn]: ["1005", "1012", "1011"],
      },
    };

    if (sucursalId) {
      filters.sucursal_id = sucursalId;
    }

    const ventasFiltradas = await VentasArticulosKgPorUsuario.findAll({ where: filters });

    // Agrupar los datos por fecha, usuario y sucursal
    const agrupados = ventasFiltradas.reduce((acc, venta) => {
      const key = `${venta.fecha}-${venta.usuario_id}-${venta.sucursal_id}`;
      if (!acc[key]) {
        acc[key] = {
          fecha: venta.fecha,
          usuario_id: venta.usuario_id,
          sucursal_id: venta.sucursal_id,
          total_kg: 0,
        };
      }
      acc[key].total_kg += parseFloat(venta.total_cantidadpeso);
      return acc;
    }, {});

    const ventasAgrupadas = Object.values(agrupados);

    res.json({ ventasFiltradas, ventasAgrupadas });
  } catch (error) {
    console.error("Error al obtener las ventas en kg por usuario filtradas:", error);
    next(error);
  }
};

const obtenerKgPorSucursalFiltradas = async (req, res, next) => {
  try {
    const { fechaDesde, fechaHasta } = req.body;

    const filters = {
      fecha: {
        [Op.between]: [fechaDesde, fechaHasta],
      },
      articulocodigo: {
        [Op.notIn]: ["1005", "1012", "1011"],
      },
    };

    const ventasFiltradas = await VentasArticulosKgPorUsuario.findAll({
      where: filters,
      attributes: [
        'fecha',
        'sucursal_id',
        'articulocodigo',
        [sequelize.fn('SUM', sequelize.col('total_cantidadpeso')), 'total_cantidadpeso']
      ],
      group: ['fecha', 'sucursal_id', 'articulocodigo']
    });

    // Agrupar los datos por fecha y sucursal
    const agrupados = ventasFiltradas.reduce((acc, venta) => {
      const key = `${venta.fecha}-${venta.sucursal_id}`;
      if (!acc[key]) {
        acc[key] = {
          fecha: venta.fecha,
          sucursal_id: venta.sucursal_id,
          total_kg: 0,
        };
      }
      acc[key].total_kg += parseFloat(venta.total_cantidadpeso);
      return acc;
    }, {});

    const ventasAgrupadas = Object.values(agrupados);

    res.json({ ventasFiltradas, ventasAgrupadas });
  } catch (error) {
    console.error("Error al obtener las ventas en kg por sucursal filtradas:", error);
    next(error);
  }
};

// const crearCantidadTicketPorUsuario = async (req,res,next) => {
//   try {

//     const cantidadPorUsuario = req.body;
//     // console.log("cantidadporusuario", req.body)

//     // Validar los datos recibidos
//     if (!Array.isArray(cantidadPorUsuario)) {
//       throw new Error("Los datos de ventas por usuario deben ser proporcionados en forma de array.");
//     }

//     // Obtener la sucursal_id de los datos
//     const sucursalId = cantidadPorUsuario[0].sucursal_id;

  
//     const ultimoRegistro = await CantidadTicketPorUsuario.findOne({
//       attributes: [[sequelize.fn("MAX", sequelize.col("fecha")), "ultimaFecha"]],
//       where: { sucursal_id: sucursalId }
//     });

//     // console.log("ultimoregistro", ultimoRegistro)

//     const ultimaFecha = ultimoRegistro.dataValues.ultimaFecha
//     const nuevasVentasPorUsuario = cantidadPorUsuario.filter(venta => new Date(venta.fecha) > new Date(ultimaFecha));
//     // console.log("nuevasventas", nuevasVentasPorUsuario)
//     // Mapear los datos para prepararlos para la inserción
//     const ventasPorUsuarioBulk = nuevasVentasPorUsuario.map((venta) => ({
//       fecha: venta.fecha,
//       sucursal_id: venta.sucursal_id,
//       total_monto: parseFloat(venta.monto_total),
//       usuario_id: venta.usuario_id,
//       cantidad: venta.cantidad,
//     }));

//     // Insertar los nuevos registros en la base de datos en lotes (bulk)
//     const nuevasCantidadPorUsuario = await CantidadTicketPorUsuario.bulkCreate(ventasPorUsuarioBulk);

//     console.log("Registros de CantidadTicketPorUsuario creados exitosamente.");
//     res.status(201).json(nuevasCantidadPorUsuario);
//   } catch (error) {
//     console.error("Error al crear los registros de CantidadTicketPorUsuario:", error);
//     throw error;
//   }
// };

const crearCantidadTicketPorUsuario = async (req, res, next) => {
  try {
    const cantidadPorUsuario = req.body;

    if (!Array.isArray(cantidadPorUsuario)) {
      throw new Error("Los datos deben ser proporcionados en forma de array.");
    }

    const sucursalId = cantidadPorUsuario[0].sucursal_id;

    // Obtener todos los registros existentes para esa sucursal
    const registrosExistentes = await CantidadTicketPorUsuario.findAll({
      where: { sucursal_id: sucursalId },
      attributes: ["fecha", "usuario_id"],
      raw: true,
    });

    // Crear mapa para verificar existencia por fecha y usuario_id
    const mapaExistentes = new Map();
    registrosExistentes.forEach(({ fecha, usuario_id }) => {
      try {
        const fechaISO = new Date(fecha).toISOString().split("T")[0];
        const clave = `${fechaISO}_${usuario_id}`;
        mapaExistentes.set(clave, true);
      } catch (e) {
        console.warn(`Fecha inválida en BD para usuario_id ${usuario_id}`);
      }
    });

    // Filtrar solo registros nuevos que no existen ya por fecha + usuario
    const ventasPorUsuarioBulk = cantidadPorUsuario
      .map((venta) => {
        let fechaISO = null;
        try {
          fechaISO = new Date(venta.fecha).toISOString().split("T")[0];
        } catch (e) {
          console.warn(`Fecha inválida en body para usuario_id ${venta.usuario_id}`);
          return null;
        }

        const clave = `${fechaISO}_${venta.usuario_id}`;
        if (!mapaExistentes.has(clave)) {
          return {
            fecha: venta.fecha,
            sucursal_id: venta.sucursal_id,
            total_monto: parseFloat(venta.monto_total),
            usuario_id: venta.usuario_id,
            cantidad: venta.cantidad,
          };
        }
        return null;
      })
      .filter((venta) => venta !== null);

    if (ventasPorUsuarioBulk.length === 0) {
      return res.status(200).json({ mensaje: "No hay nuevos registros para insertar." });
    }

    const nuevasCantidadPorUsuario = await CantidadTicketPorUsuario.bulkCreate(ventasPorUsuarioBulk);

    console.log("Registros de CantidadTicketPorUsuario creados exitosamente.");
    res.status(201).json(nuevasCantidadPorUsuario);
  } catch (error) {
    console.error("Error al crear los registros de CantidadTicketPorUsuario:", error);
    next(error);
  }
};


const obtenerCantidadTicketPorUsuario = async (req, res, next) => {
  try {
    const { fechaDesde, fechaHasta, sucursalId, usuarioId } = req.body;

    const filters = {
      fecha: {
        [Op.between]: [fechaDesde, fechaHasta],
      },
    };

    if (sucursalId) {
      filters.sucursal_id = sucursalId;
    }

    if (usuarioId) {
      filters.usuario_id = usuarioId;
    }

    const cantidadesTicketFiltrados = await CantidadTicketPorUsuario.findAll({ where: filters });
    // const cantidadesTicketFiltrados = await CantidadTicketPorUsuario.findAll();
    // console.log("cantidades", cantidadesTicketFiltrados)
    
    res.json(cantidadesTicketFiltrados);
  } catch (error) {
    console.error("Error al obtener la cantidad de ticket por usuario filtradas:", error);
    next(error);
  }
};

const obtenerCantidadDiasConVentas = async (req, res, next) => {
  try {
    const { fechaDesde, fechaHasta, sucursalId } = req.body;

    const filters = {
      fecha: {
        [Op.between]: [fechaDesde, fechaHasta],
      },
    };

    if (sucursalId) {
      filters.sucursal_id = sucursalId;
    }

    const diasConVentas = await VentaTotal.findAll({
      attributes: [
        [sequelize.fn("DATE", sequelize.col("fecha")), "fecha"],
      ],
      where: filters,
      group: ["fecha"],
    });

    res.json({ diasConVentas: diasConVentas.length });
  } catch (error) {
    console.error("Error al obtener cantidad de días con ventas:", error);
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
  obtenerUltimaFechaRegistroPorSucursal,
  crearVentasPorUsuario,
  obtenerUltimaFechaRegistroPorSucursalPorUsuario,
  crearVentasArticulosKgPorUsuario,
  obtenerVentasPorUsuarioFiltradas,
  obtenerKgPorUsuarioFiltradas,
  obtenerKgPorSucursalFiltradas,
  crearCantidadTicketPorUsuario,
  obtenerCantidadTicketPorUsuario,
  obtenerCantidadDiasConVentas
};
