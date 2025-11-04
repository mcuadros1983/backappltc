// controllers/conciliacion/registroBancoController.js
import ConciliacionRegistroBanco from "../../models/conciliacion/registrobanco.js";

// Crear nuevo registro de banco
export const crearRegistroBanco = async (req, res) => {
  try {
    const registro = await ConciliacionRegistroBanco.create(req.body);
    res.status(201).json(registro);
  } catch (error) {
    res.status(500).json({ error: "Error al crear el registro bancario" });
  }
};

// Listar todos los registros
export const listarRegistrosBanco = async (req, res) => {
  try {
    const registros = await ConciliacionRegistroBanco.findAll();
    res.status(200).json(registros);
  } catch (error) {
    res.status(500).json({ error: "Error al listar los registros bancarios" });
  }
};

// Obtener un registro por ID
export const obtenerRegistroBancoPorId = async (req, res) => {
  try {
    const registro = await ConciliacionRegistroBanco.findByPk(req.params.id);
    if (!registro) {
      return res.status(404).json({ error: "Registro bancario no encontrado" });
    }
    res.status(200).json(registro);
  } catch (error) {
    res.status(500).json({ error: "Error al obtener el registro bancario" });
  }
};

// Actualizar un registro por ID
export const actualizarRegistroBanco = async (req, res) => {
  try {
    const registro = await ConciliacionRegistroBanco.findByPk(req.params.id);
    if (!registro) {
      return res.status(404).json({ error: "Registro bancario no encontrado" });
    }
    await registro.update(req.body);
    res.status(200).json(registro);
  } catch (error) {
    res.status(500).json({ error: "Error al actualizar el registro bancario" });
  }
};

// Eliminar un registro por ID
export const eliminarRegistroBanco = async (req, res) => {
  try {
    const registro = await ConciliacionRegistroBanco.findByPk(req.params.id);
    if (!registro) {
      return res.status(404).json({ error: "Registro bancario no encontrado" });
    }
    await registro.destroy();
    res.status(200).json({ mensaje: "Registro bancario eliminado correctamente" });
  } catch (error) {
    res.status(500).json({ error: "Error al eliminar el registro bancario" });
  }
};
