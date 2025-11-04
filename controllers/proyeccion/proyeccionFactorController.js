// server/controllers/proyeccion/proyeccionFactorController.js
import ProyeccionFactor from "../../models/proyeccion/ProyeccionFactor.js";

export const proyeccionFactorController = {
  async list(req, res) {
    try {
      const rows = await ProyeccionFactor.findAll({
        order: [["id", "ASC"]],
      });
      res.json(rows);
    } catch (err) {
      console.error("Error listando factores:", err);
      res.status(500).json({ error: "Error listando factores" });
    }
  },

  async create(req, res) {
    try {
      const {
        nombre,
        descripcion,
        dia_inicio_mes,
        dia_fin_mes,
        dias_semana,
        factor_multiplicador,
        sucursal_id,
        activo,
      } = req.body;

      const row = await ProyeccionFactor.create({
        nombre,
        descripcion,
        dia_inicio_mes,
        dia_fin_mes,
        dias_semana,
        factor_multiplicador,
        sucursal_id,
        activo,
      });

      res.json(row);
    } catch (err) {
      console.error("Error creando factor:", err);
      res.status(500).json({ error: "Error creando factor" });
    }
  },

  async update(req, res) {
    try {
      const { id } = req.params;
      const row = await ProyeccionFactor.findByPk(id);
      if (!row) return res.status(404).json({ error: "No encontrado" });

      const {
        nombre,
        descripcion,
        dia_inicio_mes,
        dia_fin_mes,
        dias_semana,
        factor_multiplicador,
        sucursal_id,
        activo,
      } = req.body;

      await row.update({
        nombre,
        descripcion,
        dia_inicio_mes,
        dia_fin_mes,
        dias_semana,
        factor_multiplicador,
        sucursal_id,
        activo,
      });

      res.json(row);
    } catch (err) {
      console.error("Error actualizando factor:", err);
      res.status(500).json({ error: "Error actualizando factor" });
    }
  },

  async remove(req, res) {
    try {
      const { id } = req.params;
      const row = await ProyeccionFactor.findByPk(id);
      if (!row) return res.status(404).json({ error: "No encontrado" });

      await row.destroy();
      res.json({ ok: true });
    } catch (err) {
      console.error("Error eliminando factor:", err);
      res.status(500).json({ error: "Error eliminando factor" });
    }
  },
};
