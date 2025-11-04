// controllers/comun/empresaController.js
import { sequelize } from "../../config/database.js";
import Empresa from "../../models/comun/empresa.js";

/* =========================
   Crear nueva empresa
   ========================= */
export const crearEmpresa = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const empresa = await Empresa.create(req.body, { transaction: t });
    await t.commit();
    return res.status(201).json(empresa);
  } catch (error) {
    await t.rollback();
    console.error("❌ crearEmpresa:", error);
    if (error.name === "SequelizeUniqueConstraintError") {
      return res.status(400).json({ error: "El CUIT ya está registrado" });
    }
    return res.status(500).json({ error: "Error al crear la empresa" });
  }
};

/* =========================
   Listar todas las empresas (solo lectura)
   ========================= */
export const listarEmpresas = async (req, res) => {
  try {
    const empresas = await Empresa.findAll();
    return res.status(200).json(empresas);
  } catch (error) {
    console.error("❌ listarEmpresas:", error);
    return res.status(500).json({ error: "Error al listar las empresas" });
  }
};

/* =========================
   Obtener empresa por ID (solo lectura)
   ========================= */
export const obtenerEmpresaPorId = async (req, res) => {
  try {
    const empresa = await Empresa.findByPk(req.params.id);
    if (!empresa) {
      return res.status(404).json({ error: "Empresa no encontrada" });
    }
    return res.status(200).json(empresa);
  } catch (error) {
    console.error("❌ obtenerEmpresaPorId:", error);
    return res.status(500).json({ error: "Error al obtener la empresa" });
  }
};

/* =========================
   Actualizar empresa por ID
   ========================= */
export const actualizarEmpresa = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const empresa = await Empresa.findByPk(req.params.id, {
      transaction: t,
      lock: t.LOCK.UPDATE,
    });
    if (!empresa) {
      await t.rollback();
      return res.status(404).json({ error: "Empresa no encontrada" });
    }

    await empresa.update(req.body, { transaction: t });
    await t.commit();
    return res.status(200).json(empresa);
  } catch (error) {
    await t.rollback();
    console.error("❌ actualizarEmpresa:", error);
    if (error.name === "SequelizeUniqueConstraintError") {
      return res
        .status(400)
        .json({ error: "El CUIT ya está registrado por otra empresa" });
    }
    return res.status(500).json({ error: "Error al actualizar la empresa" });
  }
};

/* =========================
   Eliminar empresa por ID (hard delete)
   ========================= */
export const eliminarEmpresa = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const empresa = await Empresa.findByPk(req.params.id, {
      transaction: t,
      lock: t.LOCK.UPDATE,
    });
    if (!empresa) {
      await t.rollback();
      return res.status(404).json({ error: "Empresa no encontrada" });
    }

    await empresa.destroy({ transaction: t });
    await t.commit();
    return res.status(200).json({ mensaje: "Empresa eliminada correctamente" });
  } catch (error) {
    await t.rollback();
    console.error("❌ eliminarEmpresa:", error);
    return res.status(500).json({ error: "Error al eliminar la empresa" });
  }
};
