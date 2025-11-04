// controllers/comun/categoriaAnimalController.js
import { sequelize } from "../../config/database.js";
import CategoriaAnimal from "../../models/comun/categoriaanimal.js";

/* =========================
   Crear nueva categoría de animal
   ========================= */
export const crearCategoriaAnimal = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const categoria = await CategoriaAnimal.create(req.body, { transaction: t });
    await t.commit();
    return res.status(201).json(categoria);
  } catch (error) {
    await t.rollback();
    console.error("❌ crearCategoriaAnimal:", error);
    return res
      .status(500)
      .json({ error: "Error al crear la categoría de animal" });
  }
};

/* =========================
   Listar todas las categorías de animal (solo lectura)
   ========================= */
export const listarCategoriasAnimal = async (req, res) => {
  try {
    const categorias = await CategoriaAnimal.findAll();
    return res.status(200).json(categorias);
  } catch (error) {
    console.error("❌ listarCategoriasAnimal:", error);
    return res
      .status(500)
      .json({ error: "Error al listar las categorías de animal" });
  }
};

/* =========================
   Obtener categoría de animal por ID (solo lectura)
   ========================= */
export const obtenerCategoriaAnimalPorId = async (req, res) => {
  try {
    const categoria = await CategoriaAnimal.findByPk(req.params.id);
    if (!categoria) {
      return res
        .status(404)
        .json({ error: "Categoría de animal no encontrada" });
    }
    return res.status(200).json(categoria);
  } catch (error) {
    console.error("❌ obtenerCategoriaAnimalPorId:", error);
    return res
      .status(500)
      .json({ error: "Error al obtener la categoría de animal" });
  }
};

/* =========================
   Actualizar categoría de animal por ID
   ========================= */
export const actualizarCategoriaAnimal = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const categoria = await CategoriaAnimal.findByPk(req.params.id, {
      transaction: t,
      lock: t.LOCK.UPDATE,
    });
    if (!categoria) {
      await t.rollback();
      return res
        .status(404)
        .json({ error: "Categoría de animal no encontrada" });
    }

    await categoria.update(req.body, { transaction: t });
    await t.commit();
    return res.status(200).json(categoria);
  } catch (error) {
    await t.rollback();
    console.error("❌ actualizarCategoriaAnimal:", error);
    return res
      .status(500)
      .json({ error: "Error al actualizar la categoría de animal" });
  }
};

/* =========================
   Eliminar categoría de animal por ID (hard delete)
   ========================= */
export const eliminarCategoriaAnimal = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const categoria = await CategoriaAnimal.findByPk(req.params.id, {
      transaction: t,
      lock: t.LOCK.UPDATE,
    });
    if (!categoria) {
      await t.rollback();
      return res
        .status(404)
        .json({ error: "Categoría de animal no encontrada" });
    }

    await categoria.destroy({ transaction: t });
    await t.commit();
    return res
      .status(200)
      .json({ mensaje: "Categoría de animal eliminada correctamente" });
  } catch (error) {
    await t.rollback();
    console.error("❌ eliminarCategoriaAnimal:", error);
    return res
      .status(500)
      .json({ error: "Error al eliminar la categoría de animal" });
  }
};
