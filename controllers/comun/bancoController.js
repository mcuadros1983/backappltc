// controllers/comun/bancoController.js
import { sequelize } from "../../config/database.js";
import Banco from "../../models/comun/banco.js";

/* =========================
   Crear nuevo banco
   ========================= */
export const crearBanco = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const banco = await Banco.create(req.body, { transaction: t });
    await t.commit();
    return res.status(201).json(banco);
  } catch (error) {
    await t.rollback();
    console.error("❌ crearBanco:", error);
    return res.status(500).json({ error: "Error al crear el banco" });
  }
};

/* =========================
   Listar todos los bancos (solo lectura)
   ========================= */
export const listarBancos = async (req, res) => {
  try {
    const bancos = await Banco.findAll();
    return res.status(200).json(bancos);
  } catch (error) {
    console.error("❌ listarBancos:", error);
    return res.status(500).json({ error: "Error al listar los bancos" });
  }
};

/* =========================
   Obtener banco por ID (solo lectura)
   ========================= */
export const obtenerBancoPorId = async (req, res) => {
  try {
    const banco = await Banco.findByPk(req.params.id);
    if (!banco) return res.status(404).json({ error: "Banco no encontrado" });
    return res.status(200).json(banco);
  } catch (error) {
    console.error("❌ obtenerBancoPorId:", error);
    return res.status(500).json({ error: "Error al obtener el banco" });
  }
};

/* =========================
   Actualizar banco por ID
   ========================= */
export const actualizarBanco = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const banco = await Banco.findByPk(req.params.id, {
      transaction: t,
      lock: t.LOCK.UPDATE,
    });
    if (!banco) {
      await t.rollback();
      return res.status(404).json({ error: "Banco no encontrado" });
    }

    await banco.update(req.body, { transaction: t });
    await t.commit();
    return res.status(200).json(banco);
  } catch (error) {
    await t.rollback();
    console.error("❌ actualizarBanco:", error);
    return res.status(500).json({ error: "Error al actualizar el banco" });
  }
};

/* =========================
   Eliminar banco por ID (hard delete)
   ========================= */
export const eliminarBanco = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const banco = await Banco.findByPk(req.params.id, {
      transaction: t,
      lock: t.LOCK.UPDATE,
    });
    if (!banco) {
      await t.rollback();
      return res.status(404).json({ error: "Banco no encontrado" });
    }

    await banco.destroy({ transaction: t });
    await t.commit();
    return res.status(200).json({ mensaje: "Banco eliminado correctamente" });
  } catch (error) {
    await t.rollback();
    console.error("❌ eliminarBanco:", error);
    return res.status(500).json({ error: "Error al eliminar el banco" });
  }
};
