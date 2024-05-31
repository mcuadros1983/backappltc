import Cupon from "../../models/caja/cuponModel.js";
import Retiro from "../../models/caja/retiroModel.js";
import Sueldo from "../../models/caja/sueldoModel.js";
import Vale from "../../models/caja/valeModel.js";
import Ingreso from "../../models/caja/ingresoModel.js";
import Vtactacte from "../../models/caja/vtactacteModel.js";
import Cobranzactacte from "../../models/caja/cobranzactacteModel.js";
import Gasto from "../../models/caja/gastoModel.js";
import { Op } from "sequelize";
import { sequelize } from "../../config/database.js";
import ClienteTabla from "../../models/tablas/clienteModel.js";
import Caja from "../../models/caja/cajaModel.js";
import Cierre from "../../models/caja/cierreModel.js";
import { format } from "date-fns";

const obtenerCajas = async (req, res, next) => {
  try {
    // Consultar todos los gastos desde la base de datos
    const cajas = await Caja.findAll();

    // Retornar los gastos como respuesta
    res.status(200).json(cajas);
  } catch (error) {
    console.error("Error al obtener las cajas:", error);
    next(error);
  }
};

const obtenerCajasPorCajaId = async (req, res, next) => {
  try {
    const { caja_id } = req.body;
    const caja = await Caja.findByPk(caja_id);
    res.status(200).json(caja);
  } catch (error) {
    console.error("Error al obtener la caja por caja ID:", error);
    next(error);
  }
};

const obtenerCajasFiltrados = async (req, res, next) => {
  try {
    const { fechaDesde, fechaHasta, sucursalId } = req.body;
    // Define los filtros para la consulta
    const filters = {
      fechainicio: {
        [Op.between]: [fechaDesde, fechaHasta],
      },
    };

    // Si se proporciona el ID de sucursal, agrega el filtro por sucursal
    if (sucursalId) {
      filters.sucursal_id = sucursalId;
    }

    // Realiza la consulta a la base de datos
    const cajassFiltrados = await Caja.findAll({ where: filters });

    res.json(cajassFiltrados);
  } catch (error) {
    next(error);
  }
};

const crearCajas = async (req, res, next) => {
  try {
    // Obtener los datos de las cajas desde el cuerpo de la solicitud
    const cajasData = req.body;

    // Filtrar los datos para omitir los que ya existen en la base de datos
    const cajasFiltradas = await Promise.all(
      cajasData.map(async (caja) => {
        // const fechaFormatoDateOnly = format(new Date(caja.fecha), 'yyyy-MM-dd'); // Asegurar formato DATEONLY
        const existeCaja = await Caja.findOne({
          where: {
            cajaId: caja.id,
            sucursal_id: caja.sucursal_id,
            // fecha:fechaFormatoDateOnly
          },
        });
        return existeCaja ? null : caja;
      })
    );

    // Eliminar los elementos nulos del array
    const cajasParaCrear = cajasFiltradas.filter((caja) => caja !== null);

    // Iterar sobre los datos de las cajas y asignar el id como cajaId
    const cajasConId = cajasParaCrear.map((caja) => ({
      ...caja,
      cajaId: caja.id, // Asignamos el valor del id existente como cajaId
      id: undefined, // Dejar el campo id undefined para que la base de datos lo genere automáticamente
    }));

    // Crear las cajas en la base de datos
    const nuevasCajas = await Caja.bulkCreate(cajasConId);

    // Retornar los nuevos gastos creados como respuesta
    res.status(201).json(nuevasCajas);
  } catch (error) {
    console.error("Error al crear las cajas:", error);
    next(error);
  }
};

// Controlador para obtener todos los gastos
const obtenerGastos = async (req, res, next) => {
  try {
    // Consultar todos los gastos desde la base de datos
    const gastos = await Gasto.findAll();

    // Retornar los gastos como respuesta
    res.status(200).json(gastos);
  } catch (error) {
    console.error("Error al obtener los gastos:", error);
    next(error);
  }
};

const obtenerGastosPorCajaId = async (req, res, next) => {
  try {
    const { caja_id } = req.body;
    const gasto = await Gasto.findOne({ where: { caja_id } });
    res.status(200).json(gasto);
  } catch (error) {
    console.error("Error al obtener el gasto por caja ID:", error);
    next(error);
  }
};

const obtenerGastosFiltrados = async (req, res, next) => {
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
    const gastosFiltrados = await Gasto.findAll({ where: filters });

    res.json(gastosFiltrados);
  } catch (error) {
    next(error);
  }
};

// const crearGastos = async (req, res, next) => {
//   try {
//     const gastosData = req.body;

//     // Filtrar los datos para omitir los que ya existen en la base de datos
//     const gastosFiltrados = await Promise.all(
//       gastosData.map(async (gasto) => {
//         const fechaFormatoDateOnly = format(
//           new Date(gasto.fecha),
//           "yyyy-MM-dd"
//         ); // Asegurar formato DATEONLY
//         const existeGasto = await Gasto.findOne({
//           where: {
//             gastoId: gasto.id,
//             sucursal_id: gasto.sucursal_id,
//             fecha: fechaFormatoDateOnly, // Comprobar si ya existe un gasto con la misma fecha
//           },
//         });
//         return existeGasto ? null : gasto;
//       })
//     );

//     // Eliminar los elementos nulos del array
//     const gastosParaCrear = gastosFiltrados.filter((gasto) => gasto !== null);

//     // Modificar los datos de los gastos para asignar gasto.id a gastoId
//     const gastosConId = gastosParaCrear.map((gasto) => ({
//       ...gasto,
//       gastoId: gasto.id, // Asignar gasto.id a gastoId
//       id: undefined, // Dejar el campo id undefined para que la base de datos lo genere automáticamente
//     }));

//     // Crear los gastos en la base de datos
//     const nuevosGastos = await Gasto.bulkCreate(gastosConId);

//     res.status(201).json(nuevosGastos);
//   } catch (error) {
//     console.error("Error al crear los gastos:", error);
//     next(error);
//   }
// };

const crearGastos = async (req, res, next) => {
  try {
    const gastosData = req.body;
    const fechasFormateadas = gastosData.map(gasto => ({
      ...gasto,
      fecha: format(new Date(gasto.fecha), "yyyy-MM-dd") // Asegurar formato DATEONLY
    }));

    // Obtiene todos los gastos que podrían ser duplicados en una única consulta
    const posiblesDuplicados = await Gasto.findAll({
      where: {
        [Op.or]: fechasFormateadas.map(gasto => ({
          gastoId: gasto.id,
          sucursal_id: gasto.sucursal_id,
          fecha: gasto.fecha
        }))
      }
    });

    // Crear un conjunto de claves de duplicados para comparación rápida
    const duplicadosSet = new Set(posiblesDuplicados.map(gasto => `${gasto.gastoId}-${gasto.sucursal_id}-${gasto.fecha}`));

    // Filtrar los gastos para omitir los que ya existen en la base de datos
    const gastosParaCrear = fechasFormateadas.filter(gasto => {
      const clave = `${gasto.id}-${gasto.sucursal_id}-${gasto.fecha}`;
      return !duplicadosSet.has(clave);
    });

    // Preparar gastos con los campos correctos para la inserción
    const gastosConId = gastosParaCrear.map(gasto => ({
      ...gasto,
      gastoId: gasto.id, // Asignar gasto.id a gastoId
      id: undefined // Dejar el campo id undefined para que la base de datos lo genere automáticamente
    }));

    // Crear los gastos en la base de datos usando bulkCreate
    const nuevosGastos = await Gasto.bulkCreate(gastosConId);

    res.status(201).json(nuevosGastos);
  } catch (error) {
    console.error("Error al crear los gastos:", error);
    next(error);
  }
};

// Controlador para obtener todos los retiros
const obtenerRetiros = async (req, res, next) => {
  try {
    // Obtener todos los retiros desde la base de datos
    const retiros = await Retiro.findAll();

    // Retornar los retiros como respuesta
    res.status(200).json(retiros);
  } catch (error) {
    console.error("Error al obtener los retiros:", error);
    next(error);
  }
};

const obtenerRetirosPorCajaId = async (req, res, next) => {
  try {
    const { caja_id } = req.body;
    const retiro = await Retiro.findOne({ where: { caja_id } });
    res.status(200).json(retiro);
  } catch (error) {
    console.error("Error al obtener el retiro por caja ID:", error);
    next(error);
  }
};

// Controlador para obtener retiros filtrados
const obtenerRetirosFiltrados = async (req, res, next) => {
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
    const retirosFiltrados = await Retiro.findAll({ where: filters });

    res.json(retirosFiltrados);
  } catch (error) {
    next(error);
  }
};

// const crearRetiros = async (req, res, next) => {
//   try {
//     // Obtener los datos de los retiros desde el cuerpo de la solicitud
//     const retirosData = req.body;

//     // Filtrar los datos para omitir los que ya existen en la base de datos
//     const retirosFiltrados = await Promise.all(
//       retirosData.map(async (retiro) => {
//         const fechaFormatoDateOnly = format(
//           new Date(retiro.fecha),
//           "yyyy-MM-dd"
//         ); // Asegurar formato DATEONLY
//         const existeRetiro = await Retiro.findOne({
//           where: {
//             retiroId: retiro.id,
//             sucursal_id: retiro.sucursal_id,
//             fecha: fechaFormatoDateOnly,
//           },
//         });
//         return existeRetiro ? null : retiro;
//       })
//     );

//     // Eliminar los elementos nulos del array
//     const retirosParaCrear = retirosFiltrados.filter(
//       (retiro) => retiro !== null
//     );

//     // Iterar sobre los datos de las retiros y asignar el id como retiroId
//     const retirosConId = retirosParaCrear.map((retiro) => ({
//       ...retiro,
//       retiroId: retiro.id, // Asignar el valor del id existente como retiroId
//       id: undefined, // Dejar el campo id undefined para que la base de datos lo genere automáticamente
//     }));

//     // Crear los retiros en la base de datos
//     const nuevosRetiros = await Retiro.bulkCreate(retirosConId);

//     // Retornar los nuevos retiros creados como respuesta
//     res.status(201).json(nuevosRetiros);
//   } catch (error) {
//     console.error("Error al crear los retiros:", error);
//     next(error);
//   }
// };

const crearRetiros = async (req, res, next) => {
  try {
    const retirosData = req.body;

    const fechasFormateadas = retirosData.map(retiro => ({
      ...retiro,
      fecha: format(new Date(retiro.fecha), "yyyy-MM-dd")
    }));

    // Obtiene todos los retiros que podrían ser duplicados en una única consulta
    const posiblesDuplicados = await Retiro.findAll({
      where: {
        [Op.or]: fechasFormateadas.map(retiro => ({
          retiroId: retiro.id,
          sucursal_id: retiro.sucursal_id,
          fecha: retiro.fecha
        }))
      }
    });

    const duplicadosSet = new Set(posiblesDuplicados.map(retiro => `${retiro.retiroId}-${retiro.sucursal_id}-${retiro.fecha}`));

    const retirosParaCrear = fechasFormateadas.filter(retiro => {
      const clave = `${retiro.id}-${retiro.sucursal_id}-${retiro.fecha}`;
      return !duplicadosSet.has(clave);
    });

    const retirosConId = retirosParaCrear.map(retiro => ({
      ...retiro,
      retiroId: retiro.id,
      id: undefined
    }));

    // Crear los retiros en la base de datos usando bulkCreate para eficiencia
    const nuevosRetiros = await Retiro.bulkCreate(retirosConId);

    res.status(201).json(nuevosRetiros);
  } catch (error) {
    console.error("Error al crear los retiros:", error);
    next(error);
  }
};


// Controlador para obtener todos los vales
const obtenerVales = async (req, res, next) => {
  try {
    // Obtener todos los vales desde la base de datos
    const vales = await Vale.findAll();

    // Retornar los vales como respuesta
    res.status(200).json(vales);
  } catch (error) {
    console.error("Error al obtener los vales:", error);
    next(error);
  }
};

const obtenerValesPorCajaId = async (req, res, next) => {
  try {
    const { caja_id } = req.body;
    const vale = await Vale.findOne({ where: { caja_id } });
    res.status(200).json(vale);
  } catch (error) {
    console.error("Error al obtener el vale por caja ID:", error);
    next(error);
  }
};

// Controlador para obtener vales filtrados
const obtenerValesFiltrados = async (req, res, next) => {
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
    const valesFiltrados = await Vale.findAll({ where: filters });

    res.json(valesFiltrados);
  } catch (error) {
    next(error);
  }
};

// const crearVales = async (req, res, next) => {
//   try {
//     // Obtener los datos de los vales desde el cuerpo de la solicitud
//     const valesData = req.body;

//     // Filtrar los datos para omitir los que ya existen en la base de datos
//     const valesFiltrados = await Promise.all(
//       valesData.map(async (vale) => {
//         const fechaFormatoDateOnly = format(new Date(vale.fecha), "yyyy-MM-dd"); // Asegurar formato DATEONLY
//         const existeVale = await Vale.findOne({
//           where: {
//             valeId: vale.id,
//             sucursal_id: vale.sucursal_id,
//             fecha: fechaFormatoDateOnly,
//           },
//         });
//         return existeVale ? null : vale;
//       })
//     );

//     // Eliminar los elementos nulos del array
//     const valesParaCrear = valesFiltrados.filter((vale) => vale !== null);

//     // Iterar sobre los datos de los vales y asignar el id como valeId
//     const valesConId = valesParaCrear.map((vale) => ({
//       ...vale,
//       valeId: vale.id, // Asignar el valor del id existente como valeId
//       id: undefined, // Dejar el campo id undefined para que la base de datos lo genere automáticamente
//     }));

//     // Crear los vales en la base de datos
//     const nuevosVales = await Vale.bulkCreate(valesConId);

//     // Retornar los nuevos vales creados como respuesta
//     res.status(201).json(nuevosVales);
//   } catch (error) {
//     console.error("Error al crear los vales:", error);
//     next(error);
//   }
// };

const crearVales = async (req, res, next) => {
  try {
    const valesData = req.body;

    const fechasFormateadas = valesData.map(vale => ({
      ...vale,
      fecha: format(new Date(vale.fecha), "yyyy-MM-dd")
    }));

    // Obtiene todos los vales que podrían ser duplicados en una única consulta
    const posiblesDuplicados = await Vale.findAll({
      where: {
        [Op.or]: fechasFormateadas.map(vale => ({
          valeId: vale.id,
          sucursal_id: vale.sucursal_id,
          fecha: vale.fecha
        }))
      }
    });

    const duplicadosSet = new Set(posiblesDuplicados.map(vale => `${vale.valeId}-${vale.sucursal_id}-${vale.fecha}`));

    const valesParaCrear = fechasFormateadas.filter(vale => {
      const clave = `${vale.id}-${vale.sucursal_id}-${vale.fecha}`;
      return !duplicadosSet.has(clave);
    });

    const valesConId = valesParaCrear.map(vale => ({
      ...vale,
      valeId: vale.id, // Asignar el valor del id existente como valeId
      id: undefined // Dejar el campo id undefined para que la base de datos lo genere automáticamente
    }));

    // Crear los vales en la base de datos usando bulkCreate para eficiencia
    const nuevosVales = await Vale.bulkCreate(valesConId);

    res.status(201).json(nuevosVales);
  } catch (error) {
    console.error("Error al crear los vales:", error);
    next(error);
  }
};


// Controlador para obtener todos los cupones
const obtenerCupones = async (req, res, next) => {
  try {
    const cupones = await Cupon.findAll();
    res.status(200).json(cupones);
  } catch (error) {
    console.error("Error al obtener los cupones:", error);
    next(error);
  }
};

const obtenerCuponesPorCajaId = async (req, res, next) => {
  try {
    const { caja_id } = req.body;
    const cupon = await Cupon.findOne({ where: { caja_id } });
    res.status(200).json(cupon);
  } catch (error) {
    console.error("Error al obtener el cupon por caja ID:", error);
    next(error);
  }
};

// Controlador para obtener cupones filtrados
const obtenerCuponesFiltrados = async (req, res, next) => {
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
    // console.log("filters", filters);
    // Realiza la consulta a la base de datos
    const cuponesFiltrados = await Cupon.findAll({ where: filters });

    res.json(cuponesFiltrados);
  } catch (error) {
    next(error);
  }
};

// Controlador para crear múltiples cupones
// const crearCupones = async (req, res, next) => {
//   try {
//     // Obtener los datos de los cupones desde el cuerpo de la solicitud
//     const cuponesData = req.body;

//     // Filtrar los datos para omitir los que ya existen en la base de datos
//     const cuponesFiltrados = await Promise.all(
//       cuponesData.map(async (cupon) => {
//         const fechaFormatoDateOnly = format(
//           new Date(cupon.fecha),
//           "yyyy-MM-dd"
//         );
//          // Asegurar formato DATEONLY
//         const existeCupon = await Cupon.findOne({
//           where: {
//             cuponId: cupon.id,
//             sucursal_id: cupon.sucursal_id,
//             fecha: fechaFormatoDateOnly,
//           },
//         });
//         return existeCupon ? null : cupon;
//       })
//     );

//     // Eliminar los elementos nulos del array
//     const cuponesParaCrear = cuponesFiltrados.filter((cupon) => cupon !== null);

//     // Iterar sobre los datos de los cupones y asignar el id como cuponId
//     const cuponesConId = cuponesParaCrear.map((cupon) => ({
//       ...cupon,
//       cuponId: cupon.id, // Asignar el valor del id existente como cuponId
//       id: undefined, // Dejar el campo id undefined para que la base de datos lo genere automáticamente
//     }));

//     // Crear los cupones en la base de datos
//     const nuevosCupones = await Cupon.bulkCreate(cuponesConId);

//     // Retornar los nuevos cupones creados como respuesta
//     res.status(201).json(nuevosCupones);
//   } catch (error) {
//     console.error("Error al crear los cupones:", error);
//     next(error);
//   }
// };

const crearCupones = async (req, res, next) => {
  try {
    const cuponesData = req.body;
    const fechasFormateadas = cuponesData.map(cupon => ({
      ...cupon,
      fecha: format(new Date(cupon.fecha), "yyyy-MM-dd")
    }));

    // Obtiene todos los cupones que podrían ser duplicados en una única consulta
    const posiblesDuplicados = await Cupon.findAll({
      where: {
        [Op.or]: fechasFormateadas.map(cupon => ({
          cuponId: cupon.id,
          sucursal_id: cupon.sucursal_id,
          fecha: cupon.fecha
        }))
      }
    });

    const duplicadosSet = new Set(posiblesDuplicados.map(cupon => `${cupon.cuponId}-${cupon.sucursal_id}-${cupon.fecha}`));

    const cuponesParaCrear = fechasFormateadas.filter(cupon => {
      const clave = `${cupon.id}-${cupon.sucursal_id}-${cupon.fecha}`;
      return !duplicadosSet.has(clave);
    });

    const nuevosCupones = await Cupon.bulkCreate(cuponesParaCrear.map(cupon => ({
      ...cupon,
      cuponId: cupon.id,
      id: undefined
    })));

    res.status(201).json(nuevosCupones);
  } catch (error) {
    console.error("Error al crear los cupones:", error);
    next(error);
  }
};


// Controlador para obtener todos los sueldos
const obtenerSueldos = async (req, res, next) => {
  try {
    const sueldos = await Sueldo.findAll();
    res.status(200).json(sueldos);
  } catch (error) {
    console.error("Error al obtener los sueldos:", error);
    next(error);
  }
};

const obtenerSueldosPorCajaId = async (req, res, next) => {
  try {
    const { caja_id } = req.body;
    const sueldo = await Sueldo.findOne({ where: { caja_id } });
    res.status(200).json(sueldo);
  } catch (error) {
    console.error("Error al obtener el sueldo por caja ID:", error);
    next(error);
  }
};

// Controlador para obtener sueldos filtrados
const obtenerSueldosFiltrados = async (req, res, next) => {
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
    const sueldosFiltrados = await Sueldo.findAll({ where: filters });

    res.json(sueldosFiltrados);
  } catch (error) {
    next(error);
  }
};

// // Controlador para crear múltiples sueldos
// const crearSueldos = async (req, res, next) => {
//   try {
//     // Obtener los datos de los sueldos desde el cuerpo de la solicitud
//     const sueldosData = req.body;

//     // Filtrar los datos para omitir los que ya existen en la base de datos
//     const sueldosFiltrados = await Promise.all(
//       sueldosData.map(async (sueldo) => {
//         const fechaFormatoDateOnly = format(
//           new Date(sueldo.fecha),
//           "yyyy-MM-dd"
//         ); // Asegurar formato DATEONLY
//         const existeSueldo = await Sueldo.findOne({
//           where: {
//             sueldoId: sueldo.id,
//             sucursal_id: sueldo.sucursal_id,
//             fecha: fechaFormatoDateOnly,
//           },
//         });
//         return existeSueldo ? null : sueldo;
//       })
//     );

//     // Eliminar los elementos nulos del array
//     const sueldosParaCrear = sueldosFiltrados.filter(
//       (sueldo) => sueldo !== null
//     );

//     // Iterar sobre los datos de los sueldos y asignar el id como sueldoId
//     const sueldosConId = sueldosParaCrear.map((sueldo) => ({
//       ...sueldo,
//       sueldoId: sueldo.id, // Asignar el valor del id existente como sueldoId
//       id: undefined, // Dejar el campo id undefined para que la base de datos lo genere automáticamente
//     }));

//     // Crear los sueldos en la base de datos
//     const nuevosSueldos = await Sueldo.bulkCreate(sueldosConId);

//     // Retornar los nuevos sueldos creados como respuesta
//     res.status(201).json(nuevosSueldos);
//   } catch (error) {
//     console.error("Error al crear los sueldos:", error);
//     next(error);
//   }
// };

const crearSueldos = async (req, res, next) => {
  try {
    const sueldosData = req.body;

    const fechasFormateadas = sueldosData.map(sueldo => ({
      ...sueldo,
      fecha: format(new Date(sueldo.fecha), "yyyy-MM-dd")
    }));

    // Obtener todos los sueldos que podrían ser duplicados en una sola consulta
    const posiblesDuplicados = await Sueldo.findAll({
      where: {
        [Op.or]: fechasFormateadas.map(sueldo => ({
          sueldoId: sueldo.id,
          sucursal_id: sueldo.sucursal_id,
          fecha: sueldo.fecha
        }))
      }
    });

    const duplicadosSet = new Set(posiblesDuplicados.map(sueldo => `${sueldo.sueldoId}-${sueldo.sucursal_id}-${sueldo.fecha}`));

    const sueldosParaCrear = fechasFormateadas.filter(sueldo => {
      const clave = `${sueldo.id}-${sueldo.sucursal_id}-${sueldo.fecha}`;
      return !duplicadosSet.has(clave);
    });

    const sueldosConId = sueldosParaCrear.map(sueldo => ({
      ...sueldo,
      sueldoId: sueldo.id,
      id: undefined
    }));

    // Crear los sueldos en la base de datos utilizando bulkCreate para eficiencia
    const nuevosSueldos = await Sueldo.bulkCreate(sueldosConId);

    res.status(201).json(nuevosSueldos);
  } catch (error) {
    console.error("Error al crear los sueldos:", error);
    next(error);
  }
};


// Controlador para obtener todos los ingresos
const obtenerIngresos = async (req, res, next) => {
  try {
    const ingresos = await Ingreso.findAll();
    res.status(200).json(ingresos);
  } catch (error) {
    console.error("Error al obtener los ingresos:", error);
    next(error);
  }
};

const obtenerIngresosPorCajaId = async (req, res, next) => {
  try {
    const { caja_id } = req.body;
    const ingreso = await Ingreso.findOne({ where: { caja_id } });
    res.status(200).json(ingreso);
  } catch (error) {
    console.error("Error al obtener el ingreso por caja ID:", error);
    next(error);
  }
};

// Controlador para obtener ingresos filtrados
const obtenerIngresosFiltrados = async (req, res, next) => {
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
    const ingresosFiltrados = await Ingreso.findAll({ where: filters });

    res.json(ingresosFiltrados);
  } catch (error) {
    next(error);
  }
};

// // Controlador para crear múltiples ingresos
// const crearIngresos = async (req, res, next) => {
//   try {
//     // Obtener los datos de los ingresos desde el cuerpo de la solicitud
//     const ingresosData = req.body;

//     // Filtrar los datos para omitir los que ya existen en la base de datos
//     const ingresosFiltrados = await Promise.all(
//       ingresosData.map(async (ingreso) => {
//         const fechaFormatoDateOnly = format(
//           new Date(ingreso.fecha),
//           "yyyy-MM-dd"
//         ); // Asegurar formato DATEONLY
//         const existeIngreso = await Ingreso.findOne({
//           where: {
//             ingresoId: ingreso.id,
//             sucursal_id: ingreso.sucursal_id,
//             fecha: fechaFormatoDateOnly,
//           },
//         });
//         return existeIngreso ? null : ingreso;
//       })
//     );

//     // Eliminar los elementos nulos del array
//     const ingresosParaCrear = ingresosFiltrados.filter(
//       (ingreso) => ingreso !== null
//     );

//     // Iterar sobre los datos de los ingresos y asignar el id como ingresoId
//     const ingresosConId = ingresosParaCrear.map((ingreso) => ({
//       ...ingreso,
//       ingresoId: ingreso.id, // Asignar el valor del id existente como ingresoId
//       id: undefined, // Dejar el campo id undefined para que la base de datos lo genere automáticamente
//     }));

//     // Crear los ingresos en la base de datos
//     const nuevosIngresos = await Ingreso.bulkCreate(ingresosConId);

//     // Retornar los nuevos ingresos creados como respuesta
//     res.status(201).json(nuevosIngresos);
//   } catch (error) {
//     console.error("Error al crear los ingresos:", error);
//     next(error);
//   }
// };

const crearIngresos = async (req, res, next) => {
  try {
    const ingresosData = req.body;

    const fechasFormateadas = ingresosData.map(ingreso => ({
      ...ingreso,
      fecha: format(new Date(ingreso.fecha), "yyyy-MM-dd")
    }));

    // Obtiene todos los ingresos que podrían ser duplicados en una única consulta
    const posiblesDuplicados = await Ingreso.findAll({
      where: {
        [Op.or]: fechasFormateadas.map(ingreso => ({
          ingresoId: ingreso.id,
          sucursal_id: ingreso.sucursal_id,
          fecha: ingreso.fecha
        }))
      }
    });

    const duplicadosSet = new Set(posiblesDuplicados.map(ingreso => `${ingreso.ingresoId}-${ingreso.sucursal_id}-${ingreso.fecha}`));

    const ingresosParaCrear = fechasFormateadas.filter(ingreso => {
      const clave = `${ingreso.id}-${ingreso.sucursal_id}-${ingreso.fecha}`;
      return !duplicadosSet.has(clave);
    });

    const ingresosConId = ingresosParaCrear.map(ingreso => ({
      ...ingreso,
      ingresoId: ingreso.id,
      id: undefined
    }));

    // Crear los ingresos en la base de datos utilizando bulkCreate para eficiencia
    const nuevosIngresos = await Ingreso.bulkCreate(ingresosConId);

    res.status(201).json(nuevosIngresos);
  } catch (error) {
    console.error("Error al crear los ingresos:", error);
    next(error);
  }
};


// Controlador para obtener todas las ventas a cuenta corriente
const obtenerVtasctasctes = async (req, res, next) => {
  try {
    const vtasctasctes = await Vtactacte.findAll();
    res.status(200).json(vtasctasctes);
  } catch (error) {
    console.error("Error al obtener las ventas a cuenta corriente:", error);
    next(error);
  }
};

const obtenerVtasctasctesPorCajaId = async (req, res, next) => {
  try {
    const { caja_id } = req.body;
    const vtactacte = await Vtactacte.findOne({ where: { caja_id } });
    res.status(200).json(vtactacte);
  } catch (error) {
    console.error(
      "Error al obtener la venta a cuenta corriente por caja ID:",
      error
    );
    next(error);
  }
};

// Controlador para obtener ventas a cuenta corriente filtradas
const obtenerVtasctasctesFiltradas = async (req, res, next) => {
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
    const vtasctasctesFiltradas = await Vtactacte.findAll({ where: filters });

    res.json(vtasctasctesFiltradas);
  } catch (error) {
    next(error);
  }
};

// // Controlador para crear múltiples ventas a cuenta corriente
// const crearVtasctasctes = async (req, res, next) => {
//   try {
//     // Obtener los datos de las ventas a cuenta corriente desde el cuerpo de la solicitud
//     const vtasctasctesData = req.body;
//     // console.log("vtas", vtasctasctesData);

//     // Verificar si todos los objetos en el array no tienen `id`
//     const todosSinId = vtasctasctesData.every((venta) => !venta.id);

//     if (todosSinId) {
//       // Si todos los objetos no tienen `id`, hacer bulkCreate directamente
//       const nuevasVtasctasctes = await Vtactacte.bulkCreate(vtasctasctesData);
//       return res.status(201).json(nuevasVtasctasctes);
//     } else {
//       // Filtrar los datos para omitir los que ya existen en la base de datos
//       const vtasctasctesFiltradas = await Promise.all(
//         vtasctasctesData.map(async (venta) => {
//           const fechaFormatoDateOnly = format(
//             new Date(venta.fecha),
//             "yyyy-MM-dd"
//           ); // Asegurar formato DATEONLY
//           const existeVenta = await Vtactacte.findOne({
//             where: {
//               vtactacteId: venta.id,
//               sucursal_id: venta.sucursal_id,
//               fecha: fechaFormatoDateOnly,
//             },
//           });
//           return existeVenta ? null : venta;
//         })
//       );

//       // Eliminar los elementos nulos del array
//       const vtasctasctesParaCrear = vtasctasctesFiltradas.filter(
//         (venta) => venta !== null
//       );

//       // Iterar sobre los datos de las ventas a cuenta corriente y asignar el id como ventaId
//       const ventasConId = vtasctasctesParaCrear.map((venta) => ({
//         ...venta,
//         vtactacteId: venta.id, // Asignar el valor del id existente como ventaId
//         id: undefined, // Dejar el campo id undefined para que la base de datos lo genere automáticamente
//       }));

//       // Crear las ventas a cuenta corriente en la base de datos
//       const nuevasVtasctasctes = await Vtactacte.bulkCreate(ventasConId);

//       // Retornar las nuevas ventas a cuenta corriente creadas como respuesta
//       return res.status(201).json(nuevasVtasctasctes);
//     }
//   } catch (error) {
//     console.error("Error al crear las ventas a cuenta corriente:", error);
//     next(error);
//   }
// };

const crearVtasctasctes = async (req, res, next) => {
  try {
    const vtasctasctesData = req.body;
    // console.log("vtas", vtasctasctesData);

    // Verificar si todos los objetos en el array no tienen `id`
    const todosSinId = vtasctasctesData.every((venta) => !venta.id);

    if (todosSinId) {
      // Si todos los objetos no tienen `id`, hacer bulkCreate directamente
      const nuevasVtasctasctes = await Vtactacte.bulkCreate(vtasctasctesData);
      return res.status(201).json(nuevasVtasctasctes);
    } else {
      // Preparar datos y realizar una única consulta para identificar duplicados
      const fechasFormateadas = vtasctasctesData.map(venta => ({
        ...venta,
        fecha: format(new Date(venta.fecha), "yyyy-MM-dd")
      }));

      const posiblesDuplicados = await Vtactacte.findAll({
        where: {
          [Op.or]: fechasFormateadas.map(venta => ({
            vtactacteId: venta.id,
            sucursal_id: venta.sucursal_id,
            fecha: venta.fecha
          }))
        }
      });

      const duplicadosSet = new Set(posiblesDuplicados.map(venta => `${venta.vtactacteId}-${venta.sucursal_id}-${venta.fecha}`));

      const vtasctasctesParaCrear = fechasFormateadas.filter(venta => {
        const clave = `${venta.id}-${venta.sucursal_id}-${venta.fecha}`;
        return !duplicadosSet.has(clave);
      });

      const ventasConId = vtasctasctesParaCrear.map(venta => ({
        ...venta,
        vtactacteId: venta.id,
        id: undefined
      }));

      // Crear las ventas a cuenta corriente en la base de datos
      const nuevasVtasctasctes = await Vtactacte.bulkCreate(ventasConId);

      // Retornar las nuevas ventas a cuenta corriente creadas como respuesta
      return res.status(201).json(nuevasVtasctasctes);
    }
  } catch (error) {
    console.error("Error al crear las ventas a cuenta corriente:", error);
    next(error);
  }
};


const eliminarVtasctasctes = async (req, res, next) => {
  const { id } = req.params; // Extraer el id de la URL

  try {
    // Buscar la venta a cuenta corriente por ID para verificar que existe
    const venta = await Vtactacte.findByPk(id);
    if (!venta) {
      return res
        .status(404)
        .json({ message: "Venta a cuenta corriente no encontrada" });
    }

    // Eliminar la venta a cuenta corriente
    await venta.destroy();
    res
      .status(200)
      .json({ message: "Venta a cuenta corriente eliminada exitosamente" });
  } catch (error) {
    console.error("Error al eliminar la venta a cuenta corriente:", error);
    next(error);
  }
};

const obtenerCobranzasctasctesPorCajaId = async (req, res, next) => {
  try {
    const { caja_id } = req.body;
    const cobranzactacte = await Cobranzactacte.findOne({ where: { caja_id } });
    res.status(200).json(cobranzactacte);
  } catch (error) {
    console.error(
      "Error al obtener la cobranza a cuenta corriente por caja ID:",
      error
    );
    next(error);
  }
};

// Controlador para obtener todas las cobranzas a cuenta corriente
const obtenerCobranzasctasctes = async (req, res, next) => {
  try {
    const cobranzasctasctes = await Cobranzactacte.findAll();
    res.status(200).json(cobranzasctasctes);
  } catch (error) {
    console.error("Error al obtener las cobranzas a cuenta corriente:", error);
    next(error);
  }
};

// Controlador para obtener cobranzas a cuenta corriente filtradas
const obtenerCobranzasctasctesFiltradas = async (req, res, next) => {
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
    const cobranzasctasctesFiltradas = await Cobranzactacte.findAll({
      where: filters,
    });

    res.json(cobranzasctasctesFiltradas);
  } catch (error) {
    next(error);
  }
};

// Controlador para crear múltiples cobranzas a cuenta corriente
// const crearCobranzasctasctes = async (req, res, next) => {
//   try {
//     // Obtener los datos de las cobranzas a cuenta corriente desde el cuerpo de la solicitud
//     const cobranzasctasctesData = req.body;

//     // Filtrar los datos para omitir los que ya existen en la base de datos
//     const cobranzasctasctesFiltradas = await Promise.all(
//       cobranzasctasctesData.map(async (cobranza) => {
//         const fechaFormatoDateOnly = format(
//           new Date(cobranza.fecha),
//           "yyyy-MM-dd"
//         ); // Asegurar formato DATEONLY
//         const existeCobranza = await Cobranzactacte.findOne({
//           where: {
//             cobranzaId: cobranza.id,
//             sucursal_id: cobranza.sucursal_id,
//             fecha: fechaFormatoDateOnly,
//           },
//         });
//         return existeCobranza ? null : cobranza;
//       })
//     );

//     // Eliminar los elementos nulos del array
//     const cobranzasctasctesParaCrear = cobranzasctasctesFiltradas.filter(
//       (cobranza) => cobranza !== null
//     );

//     // Iterar sobre los datos de las cobranzas a cuenta corriente y asignar el id como cobranzaId
//     const cobranzasConId = cobranzasctasctesParaCrear.map((cobranza) => ({
//       ...cobranza,
//       cobranzaId: cobranza.id, // Asignar el valor del id existente como cobranzaId
//       id: undefined, // Dejar el campo id undefined para que la base de datos lo genere automáticamente
//     }));

//     // Crear las cobranzas a cuenta corriente en la base de datos
//     const nuevasCobranzasctasctes = await Cobranzactacte.bulkCreate(
//       cobranzasConId
//     );

//     // Retornar las nuevas cobranzas a cuenta corriente creadas como respuesta
//     res.status(201).json(nuevasCobranzasctasctes);
//   } catch (error) {
//     console.error("Error al crear las cobranzas a cuenta corriente:", error);
//     next(error);
//   }
// };

const crearCobranzasctasctes = async (req, res, next) => {
  try {
    const cobranzasctasctesData = req.body;

    const fechasFormateadas = cobranzasctasctesData.map(cobranza => ({
      ...cobranza,
      fecha: format(new Date(cobranza.fecha), "yyyy-MM-dd")
    }));

    // Obtiene todas las cobranzas que podrían ser duplicadas en una única consulta
    const posiblesDuplicados = await Cobranzactacte.findAll({
      where: {
        [Op.or]: fechasFormateadas.map(cobranza => ({
          cobranzaId: cobranza.id,
          sucursal_id: cobranza.sucursal_id,
          fecha: cobranza.fecha
        }))
      }
    });

    const duplicadosSet = new Set(posiblesDuplicados.map(cobranza => `${cobranza.cobranzaId}-${cobranza.sucursal_id}-${cobranza.fecha}`));

    const cobranzasctasctesParaCrear = fechasFormateadas.filter(cobranza => {
      const clave = `${cobranza.id}-${cobranza.sucursal_id}-${cobranza.fecha}`;
      return !duplicadosSet.has(clave);
    });

    const cobranzasConId = cobranzasctasctesParaCrear.map(cobranza => ({
      ...cobranza,
      cobranzaId: cobranza.id, // Asignar el valor del id existente como cobranzaId
      id: undefined // Dejar el campo id undefined para que la base de datos lo genere automáticamente
    }));

    // Crear las cobranzas a cuenta corriente en la base de datos
    const nuevasCobranzasctasctes = await Cobranzactacte.bulkCreate(cobranzasConId);

    // Retornar las nuevas cobranzas a cuenta corriente creadas como respuesta
    res.status(201).json(nuevasCobranzasctasctes);
  } catch (error) {
    console.error("Error al crear las cobranzas a cuenta corriente:", error);
    next(error);
  }
};


async function obtenerSaldosCuentaCorriente(req, res, next) {
  try {
    const ventas = await Vtactacte.findAll({
      attributes: [
        "cliente_id",
        [sequelize.fn("SUM", sequelize.col("importe")), "ventas"],
      ],
      group: ["Vtactacte.cliente_id", "Clientetabla.id"],
      include: [
        {
          model: ClienteTabla,
          attributes: [],
        },
      ],
    });

    const cobranzas = await Cobranzactacte.findAll({
      attributes: [
        "cliente_id",
        [sequelize.fn("SUM", sequelize.col("importe")), "cobranzas"],
      ],
      group: ["Cobranzactacte.cliente_id", "Clientetabla.id"],
      include: [
        {
          model: ClienteTabla,
          attributes: [],
        },
      ],
    });
    // console.log("datos", ventas, cobranzas)
    // Calcular el saldo restando las cobranzas de las ventas
    const saldos = ventas.map((venta) => {
      const cobranza = cobranzas.find(
        (cobranza) => cobranza.cliente_id === venta.cliente_id
      );
      const saldo =
        parseInt(venta.dataValues.ventas) -
        parseInt(cobranza ? cobranza.dataValues.cobranzas : 0);

      return {
        cliente_id: venta.cliente_id,
        ventas: parseInt(venta.dataValues.ventas),
        cobranzas: cobranza
          ? parseInt(cobranza ? cobranza.dataValues.cobranzas : 0)
          : 0,
        saldo: saldo,
      };
    });

    res.json(saldos);
  } catch (error) {
    console.error("Error al obtener los saldos de cuenta corriente:", error);
    next(error);
  }
}

async function obtenerSaldosCuentaCorrienteFiltrados(req, res, next) {
  const { sucursalId } = req.body; // Asumiendo que estos datos se envían en los parámetros de la ruta

  try {
    const ventas = await Vtactacte.findAll({
      attributes: [
        "cliente_id",
        [sequelize.fn("SUM", sequelize.col("importe")), "ventas"],
      ],
      where: {
        sucursal_id: sucursalId,
      },
      group: ["Vtactacte.cliente_id", "Clientetabla.id"],
      include: [
        {
          model: ClienteTabla,
          attributes: [],
        },
      ],
    });

    const cobranzas = await Cobranzactacte.findAll({
      attributes: [
        "cliente_id",
        [sequelize.fn("SUM", sequelize.col("importe")), "cobranzas"],
      ],
      where: {
        sucursal_id: sucursalId,
      },
      group: ["Cobranzactacte.cliente_id", "Clientetabla.id"],
      include: [
        {
          model: ClienteTabla,
          attributes: [],
        },
      ],
    });

    const saldos = ventas.map((venta) => {
      const cobranza = cobranzas.find(
        (cob) => cob.cliente_id === venta.cliente_id
      );
      const saldo =
        parseInt(venta.dataValues.ventas) -
        parseInt(cobranza ? cobranza.dataValues.cobranzas : 0);

      return {
        cliente_id: venta.cliente_id,
        sucursal_id: sucursalId, // Incluido el id de sucursal en la respuesta
        ventas: parseInt(venta.dataValues.ventas),
        cobranzas: cobranza
          ? parseInt(cobranza.dataValues.cobranzas)
          : 0,
        saldo: saldo,
      };
    });

    res.json(saldos);
  } catch (error) {
    console.error("Error al obtener los saldos de cuenta corriente filtrados:", error);
    next(error);
  }
}


const obtenerDetalleDeCajaPorFechaYSucursal = async (req, res, next) => {
  const { fechaDesde, fechaHasta, sucursalId } = req.body;

  const filters = {
    fechainicio: {
      [Op.between]: [fechaDesde, fechaHasta],
    },
    ...(sucursalId && { sucursal_id: sucursalId }),
  };

  try {
    const cajas = await Caja.findAll({
      where: filters,
      attributes: [
        "id",
        "cajaId",
        "cajafinal",
        "cajainicial",
        "fechafin",
        "fechainicio",
        "sucursal_id",
        "usuario_id",
      ],
    });

    if (!cajas.length) {
      return res.json([]);
    }

    const detalles = await Promise.all(
      cajas.map(async (caja) => {
        const cajaId = caja.cajaId;
        const sucursalId = caja.sucursal_id;

        // Realizar sumas de cada modelo
        const totalCupones = await Cupon.sum("importecupon", {
          where: { caja_id: cajaId, sucursal_id: sucursalId },
        });
        const totalCobranzas = await Cobranzactacte.sum("importe", {
          where: { caja_id: cajaId, sucursal_id: sucursalId },
        });
        const totalGastos = await Gasto.sum("importe", {
          where: {
            caja_id: cajaId,
            sucursal_id: sucursalId,
            tipodegasto_id: {
              [Op.ne]: 28, // Excluir los gastos donde tipodegasto_id es igual a 28
            },
          },
        });
        const totalIngresos = await Ingreso.sum("importe", {
          where: { caja_id: cajaId, sucursal_id: sucursalId },
        });
        const totalRetiros = await Retiro.sum("importe", {
          where: { caja_id: cajaId, sucursal_id: sucursalId },
        });
        const totalSueldos = await Sueldo.sum("importe", {
          where: { caja_id: cajaId, sucursal_id: sucursalId },
        });
        const totalVales = await Vale.sum("importecupon", {
          where: { caja_id: cajaId, sucursal_id: sucursalId },
        });
        const totalVtactactes = await Vtactacte.sum("importe", {
          where: { caja_id: cajaId, sucursal_id: sucursalId },
        });

        return {
          caja: caja.dataValues,
          totalCupones,
          totalCobranzas,
          totalGastos,
          totalIngresos,
          totalRetiros,
          totalSueldos,
          totalVales,
          totalVtactactes,
        };
      })
    );

    // console.log("detalles", detalles);

    res.json(detalles);
  } catch (error) {
    console.error("Error al obtener los detalles de la caja:", error);
    next(error);
  }
};

// // Crear un nuevo cierre
// const crearCierre = async (req, res, next) => {
//   try {
//     const { fecha, sucursal_id, neto, iva_21, iva_105, total, nro_cierre } =
//       req.body;
//     const nuevoCierre = await Cierre.create({
//       fecha,
//       sucursal_id,
//       neto,
//       iva_21,
//       iva_105,
//       total,
//       nro_cierre,
//     });
//     res.status(201).json(nuevoCierre);
//   } catch (error) {
//     console.error("Error al crear el cierre:", error);
//     next(error);
//   }
// };

// const crearCierre = async (req, res, next) => {
//   try {
//     const { fecha, sucursal_id, neto, iva_21, iva_105, total, nro_cierre } = req.body;
//     console.log("datos", fecha, sucursal_id, neto, iva_21, iva_105, total, nro_cierre)
//     // Verificar si ya existe un cierre con los mismos parámetros
//     const cierreExistente = await Cierre.findOne({
//       where: {
//         fecha,
//         sucursal_id,
//         nro_cierre
//       }
//     });

//     // Si el cierre ya existe, retornar un mensaje y no crear uno nuevo
//     if (cierreExistente) {
//       return res.status(409).json({ message: "El cierre ya existe para la fecha, sucursal y número proporcionados." });
//     }

//     // Crear el nuevo cierre si no existe uno previo
//     const nuevoCierre = await Cierre.create({
//       fecha,
//       sucursal_id,
//       neto,
//       iva_21,
//       iva_105,
//       total,
//       nro_cierre,
//     });

//     res.status(201).json(nuevoCierre);
//   } catch (error) {
//     console.error("Error al crear el cierre:", error);
//     next(error);
//   }
// };

const crearCierre = async (req, res, next) => {
  try {
    const cierres = req.body; // El array de objetos cierre
    console.log("datos", cierres);

    const resultados = [];

    for (const { fecha, sucursal_id, neto, iva_21, iva_105, total, nro_cierre } of cierres) {
      // Verificar si ya existe un cierre con los mismos parámetros
      const cierreExistente = await Cierre.findOne({
        where: { fecha, sucursal_id, nro_cierre }
      });

      if (cierreExistente) {
        resultados.push({ error: "El cierre ya existe para la fecha, sucursal y número proporcionados.", fecha, sucursal_id, nro_cierre });
        continue; // Saltar a la siguiente iteración del bucle
      }

      // Crear el nuevo cierre si no existe uno previo
      const nuevoCierre = await Cierre.create({ fecha, sucursal_id, neto, iva_21, iva_105, total, nro_cierre });
      resultados.push(nuevoCierre);
    }

    res.status(201).json(resultados);
  } catch (error) {
    console.error("Error al crear los cierres:", error);
    next(error);
  }
};

// Obtener todos los cierres
const obtenerCierres = async (req, res, next) => {
  try {
    const cierres = await Cierre.findAll();
    res.status(200).json(cierres);
  } catch (error) {
    console.error("Error al obtener los cierres:", error);
    next(error);
  }
};

// Controlador para obtener ingresos filtrados
const obtenerCierresFiltrados = async (req, res, next) => {
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
    const cierresFiltrados = await Cierre.findAll({ where: filters });

    res.json(cierresFiltrados);
  } catch (error) {
    next(error);
  }
};

// Obtener un cierre por ID
const obtenerCierrePorId = async (req, res, next) => {
  try {
    const { id } = req.params;
    const cierre = await Cierre.findByPk(id);
    if (!cierre) {
      res.status(404).json({ message: "Cierre no encontrado" });
    } else {
      res.status(200).json(cierre);
    }
  } catch (error) {
    console.error("Error al obtener el cierre:", error);
    next(error);
  }
};

// Actualizar un cierre
const actualizarCierre = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { fecha, sucursal_id, neto, iva_21, iva_105, total, nro_cierre } =
      req.body;
    const cierreActualizado = await Cierre.update(
      {
        fecha,
        sucursal_id,
        neto,
        iva_21,
        iva_105,
        total,
        nro_cierre,
      },
      {
        where: { id },
      }
    );
    if (cierreActualizado[0] === 0) {
      res.status(404).json({ message: "Cierre no encontrado" });
    } else {
      res.status(200).json({ message: "Cierre actualizado correctamente" });
    }
  } catch (error) {
    console.error("Error al actualizar el cierre:", error);
    next(error);
  }
};

// Eliminar un cierre
const eliminarCierre = async (req, res, next) => {
  try {
    const { id } = req.params;
    const resultado = await Cierre.destroy({
      where: { id },
    });
    if (resultado === 0) {
      res.status(404).json({ message: "Cierre no encontrado" });
    } else {
      res.status(200).json({ message: "Cierre eliminado correctamente" });
    }
  } catch (error) {
    console.error("Error al eliminar el cierre:", error);
    next(error);
  }
};

const crearAjustectacte = async (req, res, next) => {
  try {
    const { descripcion, importe, cliente_id, fecha } = req.body;
    const nuevoAjuste = await Ajustectacte.create({
      descripcion,
      importe,
      cliente_id,
      fecha,
    });
    res.status(201).json(nuevoAjuste);
  } catch (error) {
    console.error("Error al crear el ajuste:", error);
    next(error);
  }
};

const obtenerAjustectacte = async (req, res, next) => {
  try {
    const ajustes = await Ajustectacte.findAll();
    res.status(200).json(ajustes);
  } catch (error) {
    console.error("Error al obtener los ajustes:", error);
    next(error);
  }
};

const obtenerAjustectactePorId = async (req, res, next) => {
  try {
    const { id } = req.params;
    const ajuste = await Ajustectacte.findByPk(id);
    if (!ajuste) {
      res.status(404).send("Ajuste no encontrado");
    } else {
      res.status(200).json(ajuste);
    }
  } catch (error) {
    console.error("Error al obtener el ajuste:", error);
    next(error);
  }
};

const actualizarAjustectacte = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { descripcion, importe, fecha, cliente_id } = req.body;
    const actualizado = await Ajustectacte.update(
      { descripcion, importe, fecha, cliente_id },
      {
        where: { id },
      }
    );
    if (actualizado[0] === 0) {
      res.status(404).send("Ajuste no encontrado");
    } else {
      res.status(200).send("Ajuste actualizado correctamente");
    }
  } catch (error) {
    console.error("Error al actualizar el ajuste:", error);
    next(error);
  }
};

const eliminarAjustectacte = async (req, res, next) => {
  try {
    const { id } = req.params;
    const eliminado = await Ajustectacte.destroy({
      where: { id },
    });
    if (eliminado === 0) {
      res.status(404).send("Ajuste no encontrado");
    } else {
      res.status(200).send("Ajuste eliminado correctamente");
    }
  } catch (error) {
    console.error("Error al eliminar el ajuste:", error);
    next(error);
  }
};
export {
  obtenerCajas,
  obtenerCajasPorCajaId,
  obtenerCajasFiltrados,
  crearCajas,
  obtenerGastos,
  obtenerGastosPorCajaId,
  obtenerGastosFiltrados,
  crearGastos,
  obtenerRetiros,
  obtenerRetirosPorCajaId,
  obtenerRetirosFiltrados,
  crearRetiros,
  obtenerVales,
  obtenerValesPorCajaId,
  obtenerValesFiltrados,
  crearVales,
  obtenerCupones,
  obtenerCuponesPorCajaId,
  obtenerCuponesFiltrados,
  crearCupones,
  obtenerSueldos,
  obtenerSueldosPorCajaId,
  obtenerSueldosFiltrados,
  crearSueldos,
  obtenerIngresos,
  obtenerIngresosPorCajaId,
  obtenerIngresosFiltrados,
  crearIngresos,
  obtenerVtasctasctes,
  obtenerVtasctasctesPorCajaId,
  obtenerVtasctasctesFiltradas,
  crearVtasctasctes,
  obtenerCobranzasctasctes,
  obtenerCobranzasctasctesPorCajaId,
  obtenerCobranzasctasctesFiltradas,
  crearCobranzasctasctes,
  obtenerSaldosCuentaCorriente,
  obtenerSaldosCuentaCorrienteFiltrados,
  obtenerDetalleDeCajaPorFechaYSucursal,
  crearCierre,
  obtenerCierres,
  obtenerCierresFiltrados,
  obtenerCierrePorId,
  actualizarCierre,
  eliminarCierre,
  crearAjustectacte,
  obtenerAjustectacte,
  obtenerAjustectactePorId,
  actualizarAjustectacte,
  eliminarAjustectacte,
};
