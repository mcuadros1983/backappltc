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
        const existeCaja = await Caja.findOne({
          where: {
            cajaId: caja.id,
            sucursal_id: caja.sucursal_id,
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

const crearGastos = async (req, res, next) => {
  try {
    const gastosData = req.body;

    // Filtrar los datos para omitir los que ya existen en la base de datos
    const gastosFiltrados = await Promise.all(
      gastosData.map(async (gasto) => {
        const existeGasto = await Gasto.findOne({
          where: {
            gastoId: gasto.id,
            sucursal_id: gasto.sucursal_id,
          },
        });
        return existeGasto ? null : gasto;
      })
    );

    // Eliminar los elementos nulos del array
    const gastosParaCrear = gastosFiltrados.filter((gasto) => gasto !== null);

    // Modificar los datos de los gastos para asignar gasto.id a gastoId
    const gastosConId = gastosParaCrear.map((gasto) => ({
      ...gasto,
      gastoId: gasto.id, // Asignar gasto.id a gastoId
      id: undefined, // Dejar el campo id undefined para que la base de datos lo genere automáticamente
    }));

    // Crear los gastos en la base de datos
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

const crearRetiros = async (req, res, next) => {
  try {
    // Obtener los datos de los retiros desde el cuerpo de la solicitud
    const retirosData = req.body;

    // Filtrar los datos para omitir los que ya existen en la base de datos
    const retirosFiltrados = await Promise.all(
      retirosData.map(async (retiro) => {
        const existeRetiro = await Retiro.findOne({
          where: {
            retiroId: retiro.id,
            sucursal_id: retiro.sucursal_id,
          },
        });
        return existeRetiro ? null : retiro;
      })
    );

    // Eliminar los elementos nulos del array
    const retirosParaCrear = retirosFiltrados.filter(
      (retiro) => retiro !== null
    );

    // Iterar sobre los datos de las retiros y asignar el id como retiroId
    const retirosConId = retirosParaCrear.map((retiro) => ({
      ...retiro,
      retiroId: retiro.id, // Asignar el valor del id existente como retiroId
      id: undefined, // Dejar el campo id undefined para que la base de datos lo genere automáticamente
    }));

    // Crear los retiros en la base de datos
    const nuevosRetiros = await Retiro.bulkCreate(retirosConId);

    // Retornar los nuevos retiros creados como respuesta
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

const crearVales = async (req, res, next) => {
  try {
    // Obtener los datos de los vales desde el cuerpo de la solicitud
    const valesData = req.body;

    // Filtrar los datos para omitir los que ya existen en la base de datos
    const valesFiltrados = await Promise.all(
      valesData.map(async (vale) => {
        const existeVale = await Vale.findOne({
          where: {
            valeId: vale.id,
            sucursal_id: vale.sucursal_id,
          },
        });
        return existeVale ? null : vale;
      })
    );

    // Eliminar los elementos nulos del array
    const valesParaCrear = valesFiltrados.filter((vale) => vale !== null);

    // Iterar sobre los datos de los vales y asignar el id como valeId
    const valesConId = valesParaCrear.map((vale) => ({
      ...vale,
      valeId: vale.id, // Asignar el valor del id existente como valeId
      id: undefined, // Dejar el campo id undefined para que la base de datos lo genere automáticamente
    }));

    // Crear los vales en la base de datos
    const nuevosVales = await Vale.bulkCreate(valesConId);

    // Retornar los nuevos vales creados como respuesta
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

    // Realiza la consulta a la base de datos
    const cuponesFiltrados = await Cupon.findAll({ where: filters });

    res.json(cuponesFiltrados);
  } catch (error) {
    next(error);
  }
};

// Controlador para crear múltiples cupones
const crearCupones = async (req, res, next) => {
  try {
    // Obtener los datos de los cupones desde el cuerpo de la solicitud
    const cuponesData = req.body;

    // Filtrar los datos para omitir los que ya existen en la base de datos
    const cuponesFiltrados = await Promise.all(
      cuponesData.map(async (cupon) => {
        const existeCupon = await Cupon.findOne({
          where: {
            cuponId: cupon.id,
            sucursal_id: cupon.sucursal_id,
          },
        });
        return existeCupon ? null : cupon;
      })
    );

    // Eliminar los elementos nulos del array
    const cuponesParaCrear = cuponesFiltrados.filter((cupon) => cupon !== null);

    // Iterar sobre los datos de los cupones y asignar el id como cuponId
    const cuponesConId = cuponesParaCrear.map((cupon) => ({
      ...cupon,
      cuponId: cupon.id, // Asignar el valor del id existente como cuponId
      id: undefined, // Dejar el campo id undefined para que la base de datos lo genere automáticamente
    }));

    // Crear los cupones en la base de datos
    const nuevosCupones = await Cupon.bulkCreate(cuponesConId);

    // Retornar los nuevos cupones creados como respuesta
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

// Controlador para crear múltiples sueldos
const crearSueldos = async (req, res, next) => {
  try {
    // Obtener los datos de los sueldos desde el cuerpo de la solicitud
    const sueldosData = req.body;

    // Filtrar los datos para omitir los que ya existen en la base de datos
    const sueldosFiltrados = await Promise.all(
      sueldosData.map(async (sueldo) => {
        const existeSueldo = await Sueldo.findOne({
          where: {
            sueldoId: sueldo.id,
            sucursal_id: sueldo.sucursal_id,
          },
        });
        return existeSueldo ? null : sueldo;
      })
    );

    // Eliminar los elementos nulos del array
    const sueldosParaCrear = sueldosFiltrados.filter(
      (sueldo) => sueldo !== null
    );

    // Iterar sobre los datos de los sueldos y asignar el id como sueldoId
    const sueldosConId = sueldosParaCrear.map((sueldo) => ({
      ...sueldo,
      sueldoId: sueldo.id, // Asignar el valor del id existente como sueldoId
      id: undefined, // Dejar el campo id undefined para que la base de datos lo genere automáticamente
    }));

    // Crear los sueldos en la base de datos
    const nuevosSueldos = await Sueldo.bulkCreate(sueldosConId);

    // Retornar los nuevos sueldos creados como respuesta
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

// Controlador para crear múltiples ingresos
const crearIngresos = async (req, res, next) => {
  try {
    // Obtener los datos de los ingresos desde el cuerpo de la solicitud
    const ingresosData = req.body;

    // Filtrar los datos para omitir los que ya existen en la base de datos
    const ingresosFiltrados = await Promise.all(
      ingresosData.map(async (ingreso) => {
        const existeIngreso = await Ingreso.findOne({
          where: {
            ingresoId: ingreso.id,
            sucursal_id: ingreso.sucursal_id,
          },
        });
        return existeIngreso ? null : ingreso;
      })
    );

    // Eliminar los elementos nulos del array
    const ingresosParaCrear = ingresosFiltrados.filter(
      (ingreso) => ingreso !== null
    );

    // Iterar sobre los datos de los ingresos y asignar el id como ingresoId
    const ingresosConId = ingresosParaCrear.map((ingreso) => ({
      ...ingreso,
      ingresoId: ingreso.id, // Asignar el valor del id existente como ingresoId
      id: undefined, // Dejar el campo id undefined para que la base de datos lo genere automáticamente
    }));

    // Crear los ingresos en la base de datos
    const nuevosIngresos = await Ingreso.bulkCreate(ingresosConId);

    // Retornar los nuevos ingresos creados como respuesta
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

    // Convertir las fechas a objetos Date
    const fechaInicio = new Date(fechaDesde);
    const fechaFin = new Date(fechaHasta);

    // Incrementar la fecha final en un día para que incluya el rango completo
    fechaFin.setDate(fechaFin.getDate() + 1);

    // Define los filtros para la consulta
    const filters = {
      fecha: {
        [Op.between]: [fechaInicio, fechaFin],
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

// Controlador para crear múltiples ventas a cuenta corriente
const crearVtasctasctes = async (req, res, next) => {
  try {
    // Obtener los datos de las ventas a cuenta corriente desde el cuerpo de la solicitud
    const vtasctasctesData = req.body;

    // Filtrar los datos para omitir los que ya existen en la base de datos
    const vtasctasctesFiltradas = await Promise.all(
      vtasctasctesData.map(async (venta) => {
        const existeVenta = await Vtactacte.findOne({
          where: {
            vtactacteId: venta.id,
            sucursal_id: venta.sucursal_id,
          },
        });
        return existeVenta ? null : venta;
      })
    );

    // Eliminar los elementos nulos del array
    const vtasctasctesParaCrear = vtasctasctesFiltradas.filter(
      (venta) => venta !== null
    );

    // Iterar sobre los datos de las ventas a cuenta corriente y asignar el id como ventaId
    const ventasConId = vtasctasctesParaCrear.map((venta) => ({
      ...venta,
      ventaId: venta.id, // Asignar el valor del id existente como ventaId
      id: undefined, // Dejar el campo id undefined para que la base de datos lo genere automáticamente
    }));

    // Crear las ventas a cuenta corriente en la base de datos
    const nuevasVtasctasctes = await Vtactacte.bulkCreate(ventasConId);

    // Retornar las nuevas ventas a cuenta corriente creadas como respuesta
    res.status(201).json(nuevasVtasctasctes);
  } catch (error) {
    console.error("Error al crear las ventas a cuenta corriente:", error);
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
const crearCobranzasctasctes = async (req, res, next) => {
  try {
    // Obtener los datos de las cobranzas a cuenta corriente desde el cuerpo de la solicitud
    const cobranzasctasctesData = req.body;

    // Filtrar los datos para omitir los que ya existen en la base de datos
    const cobranzasctasctesFiltradas = await Promise.all(cobranzasctasctesData.map(async (cobranza) => {
      const existeCobranza = await Cobranzactacte.findOne({
        where: {
          cobranzaId: cobranza.id,
          sucursal_id: cobranza.sucursal_id
        }
      });
      return existeCobranza ? null : cobranza;
    }));

    // Eliminar los elementos nulos del array
    const cobranzasctasctesParaCrear = cobranzasctasctesFiltradas.filter(cobranza => cobranza !== null);

    // Iterar sobre los datos de las cobranzas a cuenta corriente y asignar el id como cobranzaId
    const cobranzasConId = cobranzasctasctesParaCrear.map((cobranza) => ({
      ...cobranza,
      cobranzaId: cobranza.id, // Asignar el valor del id existente como cobranzaId
      id: undefined, // Dejar el campo id undefined para que la base de datos lo genere automáticamente
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

async function obtenerSaldosCuentaCorriente() {
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

    return saldos;
  } catch (error) {
    console.error("Error al obtener los saldos de cuenta corriente:", error);
    throw error;
  }
}

const obtenerDetalleDeCajaPorFechaYSucursal = async (req, res, next) => {
  const { fechaDesde, fechaHasta, sucursalId } = req.body;
  // Convertir las fechas a objetos Date
  const fechaInicio = new Date(fechaDesde);
  const fechaFin = new Date(fechaHasta);

  // Incrementar la fecha final en un día para que incluya el rango completo
  fechaFin.setDate(fechaFin.getDate() + 1);

  try {
    const cajas = await Caja.findAll({
      where: {
        fechainicio: {
          [Op.between]: [fechaInicio, fechaFin],
        },
        sucursal_id: sucursalId,
      },
      include: [
        Cobranzactacte,
        Cupon,
        Gasto,
        Ingreso,
        Retiro,
        Sueldo,
        Vale,
        Vtactacte,
      ],
      attributes: [
        "id",
        "cajafinal",
        "cajainicial",
        "fechafin",
        "fechainicio",
        "sucursal_id",
        "usuario_id",
        [
          sequelize.literal(
            '(SELECT SUM("Cobranzactacte"."importe") FROM "Cobranzactacte" WHERE "Cobranzactacte"."caja_id" = "Caja"."id")'
          ),
          "totalCobranzas",
        ],
        [
          sequelize.literal(
            '(SELECT SUM("Cupon"."importecupon") FROM "Cupon" WHERE "Cupon"."caja_id" = "Caja"."id")'
          ),
          "totalCupones",
        ],
        [
          sequelize.literal(
            '(SELECT SUM("Gasto"."importe") FROM "Gasto" WHERE "Gasto"."caja_id" = "Caja"."id")'
          ),
          "totalGastos",
        ],
        [
          sequelize.literal(
            '(SELECT SUM("Ingreso"."importe") FROM "Ingreso" WHERE "Ingreso"."caja_id" = "Caja"."id")'
          ),
          "totalIngresos",
        ],
        [
          sequelize.literal(
            '(SELECT SUM("Retiro"."importe") FROM "Retiro" WHERE "Retiro"."caja_id" = "Caja"."id")'
          ),
          "totalRetiros",
        ],
        [
          sequelize.literal(
            '(SELECT SUM("Sueldo"."importe") FROM "Sueldo" WHERE "Sueldo"."caja_id" = "Caja"."id")'
          ),
          "totalSueldos",
        ],
        [
          sequelize.literal(
            '(SELECT SUM("Vale"."importecupon") FROM "Vale" WHERE "Vale"."caja_id" = "Caja"."id")'
          ),
          "totalVales",
        ],
        [
          sequelize.literal(
            '(SELECT SUM("Vtactacte"."importe") FROM "Vtactacte" WHERE "Vtactacte"."caja_id" = "Caja"."id")'
          ),
          "totalVtactactes",
        ],
      ],
      group: [
        "Caja.id",
        "Caja.cajafinal",
        "Caja.cajainicial",
        "Caja.fechafin",
        "Caja.fechainicio",
        "Caja.sucursal_id",
        "Caja.usuario_id",
        "Cobranzactacte.id", // Agregar la columna a la cláusula GROUP BY
        "Cupon.id",
        "Gasto.id",
        "Ingreso.id",
        "Retiro.id",
        "Sueldo.id",
        "Vale.id",
        "Vtactacte.id",
      ],
    });

    res.json(cajas);
  } catch (error) {
    console.error(error);
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
  obtenerDetalleDeCajaPorFechaYSucursal,
};
