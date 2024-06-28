import Cliente from "../../models/gmedias/clienteModel.js";
import { Venta } from "../../models/gmedias/ventaModel.js";
// import DetalleVenta from "../models/detalleVentaModel.js";
import CuentaCorriente from "../../models/gmedias/cuentaCorrienteModel.js";
import DetalleCuenta from "../../models/gmedias/detalleCuentaCorrienteModel.js";
import respuesta from "../../utils/respuesta.js";
import Producto from "../../models/gmedias/productoModel.js";
import Cobranza from "../../models/gmedias/cobranzaModel.js";
import DetalleCuentaCorriente from "../../models/gmedias/detalleCuentaCorrienteModel.js";

const obtenerClientes = async (req, res, next) => {
  try {
    const clientes = await Cliente.findAll({
      include: [
        {
          model: CuentaCorriente,
          as: "cuentaCorriente",
          include: [
            {
              model: Cobranza, // Agrega la relación con Cobranza
              as: "cobranzas", // Alias para Cobranza
            },
          ],
        },
      ],
    });
    res.json(clientes);
  } catch (error) {
    next(error);
  }
};

const obtenerClientePorId = async (req, res, next) => {
  const clienteId = req.params.clienteId;

  try {
    const cliente = await Cliente.findByPk(clienteId, {
      include: [
        { model: Venta, as: "ventas" },
        { model: CuentaCorriente, as: "cuentaCorriente" },
      ],
    });

    if (!cliente) {
      return respuesta.error(res, "Cliente no encontrado", 404);
    }

    res.json(cliente);
  } catch (error) {
    // respuesta.error(res, error.message);
    next(error);
  }
};

const obtenerVentasDeCliente = async (req, res, next) => {
  const clienteId = req.params.clienteId;

  try {
    const ventas = await Venta.findAll({
      where: { clienteId },
      include: [Producto],
    });

    res.json(ventas);
  } catch (error) {
    next(error);
  }
};

const obtenerCuentaCorrienteDeCliente = async (req, res, next) => {
  const clienteId = req.params.clienteId;

  try {
    const cuentaCorriente = await CuentaCorriente.findOne({
      where: { clienteId },
      include: [DetalleCuenta],
    });

    res.json(cuentaCorriente);
  } catch (error) {
    next(error);
  }
};

// const crearCliente = async (req, res, next) => {
//   const { nombre, margen } = req.body;

//   try {
//     const nuevoCliente = margen
//       ? await Cliente.create({ nombre, margen })
//       : await Cliente.create({ nombre });
//     res.json(nuevoCliente);
//   } catch (error) {
//     next(error);
//   }
// };

const crearCliente = async (req, res, next) => {
  try {
    // Crear el nuevo cliente utilizando los datos del cuerpo de la solicitud
    const nuevoCliente = await Cliente.create(req.body);

    // Enviar la respuesta con el nuevo cliente creado
    res.json(nuevoCliente);
  } catch (error) {
    next(error);
  }
};

const actualizarCliente = async (req, res, next) => {
  const clienteId = req.params.clienteId;
  const { nombre } = req.body;

  try {
    const cliente = await Cliente.findByPk(clienteId);

    if (!cliente) {
      return respuesta.error(res, "Cliente no encontrado", 404);
    }

    cliente.nombre = nombre;
    await cliente.save();

    res.json(cliente);
  } catch (error) {
    next(error);
  }
};

const eliminarCliente = async (req, res, next) => {
  const clienteId = req.params.clienteId;

  try {
    const cliente = await Cliente.findByPk(clienteId);

    if (!cliente) {
      return respuesta.error(res, "Cliente no encontrado", 404);
    }

    // Verificar si hay ventas asociadas al cliente
    const ventasAsociadas = await Venta.findOne({
      where: { cliente_id: clienteId },
    });

    if (ventasAsociadas) {
      return respuesta.error(
        res,
        "No se puede eliminar el cliente. Hay ventas asociadas.",
        400
      );
    }

    const cuentaCorriente = await CuentaCorriente.findOne({
      where: { cliente_id: clienteId },
    });

    if (cuentaCorriente) {
      return respuesta.error(
        res,
        "No se puede eliminar el cliente. Hay operaciones asociadas al cliente.",
        400
      );
    }

    await cliente.destroy();

    res.sendStatus(204);
  } catch (error) {
    next(error);
  }
};

export {
  obtenerClientes,
  obtenerClientePorId,
  obtenerVentasDeCliente,
  obtenerCuentaCorrienteDeCliente,
  crearCliente,
  actualizarCliente,
  eliminarCliente,
};
