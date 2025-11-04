// controllers/iva/libroIVAController.js
import { sequelize } from "../../config/database.js";
import LibroIVA from "../../models/iva/libroiva.js";

// Crear
export const crearLibroIVA = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { mes, anio, empresa_id } = req.body;

    if (empresa_id === undefined || empresa_id === null) {
      await t.rollback();
      return res
        .status(400)
        .json({ error: "Debe especificar empresa_id para crear el Libro IVA." });
    }

    const existente = await LibroIVA.findOne({
      where: { mes, anio, empresa_id },
      transaction: t,
    });
    if (existente) {
      await t.rollback();
      return res
        .status(400)
        .json({ error: "Ya existe un Libro IVA para ese mes, año y empresa." });
    }

    const nuevo = await LibroIVA.create(req.body, { transaction: t });

    await t.commit();
    return res.status(201).json(nuevo);
  } catch (error) {
    await t.rollback();
    console.error("❌ crearLibroIVA:", error);
    return res
      .status(500)
      .json({ error: "Error al crear el Libro IVA", detalle: error.message });
  }
};

// Listar (solo lectura)
export const listarLibrosIVA = async (req, res) => {
  try {
    const { empresa_id } = req.query;
    const where = {};

    if (empresa_id !== undefined) {
      where.empresa_id = empresa_id === "null" ? null : empresa_id;
    }

    const lista = await LibroIVA.findAll({ where });
    return res.status(200).json(lista);
  } catch (error) {
    console.error("❌ listarLibrosIVA:", error);
    return res
      .status(500)
      .json({ error: "Error al listar Libros IVA", detalle: error.message });
  }
};

// Obtener por ID (solo lectura)
export const obtenerLibroIVAPorId = async (req, res) => {
  try {
    const item = await LibroIVA.findByPk(req.params.id);
    if (!item) return res.status(404).json({ error: "Libro IVA no encontrado" });
    return res.status(200).json(item);
  } catch (error) {
    console.error("❌ obtenerLibroIVAPorId:", error);
    return res.status(500).json({ error: "Error al obtener el Libro IVA" });
  }
};

// Actualizar
export const actualizarLibroIVA = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const item = await LibroIVA.findByPk(req.params.id, {
      transaction: t,
      lock: t.LOCK.UPDATE,
    });
    if (!item) {
      await t.rollback();
      return res.status(404).json({ error: "Libro IVA no encontrado" });
    }

    await item.update(req.body, { transaction: t });

    await t.commit();
    return res.status(200).json(item);
  } catch (error) {
    await t.rollback();
    console.error("❌ actualizarLibroIVA:", error);
    return res
      .status(500)
      .json({ error: "Error al actualizar el Libro IVA", detalle: error.message });
  }
};

// Eliminar (hard delete)
export const eliminarLibroIVA = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const item = await LibroIVA.findByPk(req.params.id, {
      transaction: t,
      lock: t.LOCK.UPDATE,
    });
    if (!item) {
      await t.rollback();
      return res.status(404).json({ error: "Libro IVA no encontrado" });
    }

    await item.destroy({ transaction: t });

    await t.commit();
    return res.status(200).json({ mensaje: "Libro IVA eliminado correctamente" });
  } catch (error) {
    await t.rollback();
    console.error("❌ eliminarLibroIVA:", error);
    return res
      .status(500)
      .json({ error: "Error al eliminar el Libro IVA", detalle: error.message });
  }
};
