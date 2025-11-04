// controllers/conciliacion/cuentaController.js
import ConciliacionCuenta from "../../models/conciliacion/cuenta.js";

// Crear nueva cuenta de conciliación
export const crearCuenta = async (req, res) => {
  try {
    const cuenta = await ConciliacionCuenta.create(req.body);
    res.status(201).json(cuenta);
  } catch (error) {
    res.status(500).json({ error: "Error al crear la cuenta de conciliación" });
  }
};

// Listar todas las cuentas
export const listarCuentas = async (req, res) => {
  try {
    const cuentas = await ConciliacionCuenta.findAll();
    res.status(200).json(cuentas);
  } catch (error) {
    res.status(500).json({ error: "Error al listar las cuentas de conciliación" });
  }
};

// Obtener una cuenta por ID
export const obtenerCuentaPorId = async (req, res) => {
  try {
    const cuenta = await ConciliacionCuenta.findByPk(req.params.id);
    if (!cuenta) {
      return res.status(404).json({ error: "Cuenta de conciliación no encontrada" });
    }
    res.status(200).json(cuenta);
  } catch (error) {
    res.status(500).json({ error: "Error al obtener la cuenta de conciliación" });
  }
};

// Actualizar una cuenta por ID
export const actualizarCuenta = async (req, res) => {
  try {
    const cuenta = await ConciliacionCuenta.findByPk(req.params.id);
    if (!cuenta) {
      return res.status(404).json({ error: "Cuenta de conciliación no encontrada" });
    }
    await cuenta.update(req.body);
    res.status(200).json(cuenta);
  } catch (error) {
    res.status(500).json({ error: "Error al actualizar la cuenta de conciliación" });
  }
};

// Eliminar una cuenta por ID
export const eliminarCuenta = async (req, res) => {
  try {
    const cuenta = await ConciliacionCuenta.findByPk(req.params.id);
    if (!cuenta) {
      return res.status(404).json({ error: "Cuenta de conciliación no encontrada" });
    }
    await cuenta.destroy();
    res.status(200).json({ mensaje: "Cuenta eliminada correctamente" });
  } catch (error) {
    res.status(500).json({ error: "Error al eliminar la cuenta de conciliación" });
  }
};
