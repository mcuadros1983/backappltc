// controllers/comun/frigorificoController.js
import Frigorifico from "../../models/comun/frigorifico.js";

// Crear nuevo frigorífico
export const crearFrigorifico = async (req, res) => {
  try {
    const frigorifico = await Frigorifico.create(req.body);
    res.status(201).json(frigorifico);
  } catch (error) {
    if (error.name === "SequelizeUniqueConstraintError") {
      return res.status(400).json({ error: "El CUIT ya está registrado" });
    }
    res.status(500).json({ error: "Error al crear el frigorífico" });
  }
};

// Listar todos los frigoríficos
export const listarFrigorificos = async (req, res) => {
  try {
    const frigorificos = await Frigorifico.findAll();
    res.status(200).json(frigorificos);
  } catch (error) {
    res.status(500).json({ error: "Error al listar los frigoríficos" });
  }
};

// Obtener frigorífico por ID
export const obtenerFrigorificoPorId = async (req, res) => {
  try {
    const frigorifico = await Frigorifico.findByPk(req.params.id);
    if (!frigorifico) {
      return res.status(404).json({ error: "Frigorífico no encontrado" });
    }
    res.status(200).json(frigorifico);
  } catch (error) {
    res.status(500).json({ error: "Error al obtener el frigorífico" });
  }
};

// Actualizar frigorífico por ID
export const actualizarFrigorifico = async (req, res) => {
  try {
    const frigorifico = await Frigorifico.findByPk(req.params.id);
    if (!frigorifico) {
      return res.status(404).json({ error: "Frigorífico no encontrado" });
    }
    await frigorifico.update(req.body);
    res.status(200).json(frigorifico);
  } catch (error) {
    if (error.name === "SequelizeUniqueConstraintError") {
      return res.status(400).json({ error: "El CUIT ya está registrado por otro frigorífico" });
    }
    res.status(500).json({ error: "Error al actualizar el frigorífico" });
  }
};

// Eliminar frigorífico por ID
export const eliminarFrigorifico = async (req, res) => {
  try {
    const frigorifico = await Frigorifico.findByPk(req.params.id);
    if (!frigorifico) {
      return res.status(404).json({ error: "Frigorífico no encontrado" });
    }
    await frigorifico.destroy();
    res.status(200).json({ mensaje: "Frigorífico eliminado correctamente" });
  } catch (error) {
    res.status(500).json({ error: "Error al eliminar el frigorífico" });
  }
};
