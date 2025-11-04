// server/controllers/proyeccion/proyeccionFeriadoController.js
import ProyeccionFeriado from "../../models/proyeccion/ProyeccionFeriado.js";

export const proyeccionFeriadoController = {
  async list(req, res) {
    try {
      const rows = await ProyeccionFeriado.findAll({
        order: [["fecha", "ASC"]],
      });
      res.json(rows);
    } catch (err) {
      console.error("Error listando feriados:", err);
      res.status(500).json({ error: "Error listando feriados" });
    }
  },

  async create(req, res) {
    try {
      const { fecha, descripcion, factor_multiplicador, sucursal_id, activo } =
        req.body;

      const row = await ProyeccionFeriado.create({
        fecha,
        descripcion,
        factor_multiplicador,
        sucursal_id,
        activo,
      });

      res.json(row);
    } catch (err) {
      console.error("Error creando feriado:", err);
      res.status(500).json({ error: "Error creando feriado" });
    }
  },

  async update(req, res) {
    try {
      const { id } = req.params;
      const row = await ProyeccionFeriado.findByPk(id);
      if (!row) return res.status(404).json({ error: "No encontrado" });

      const { fecha, descripcion, factor_multiplicador, sucursal_id, activo } =
        req.body;

      await row.update({
        fecha,
        descripcion,
        factor_multiplicador,
        sucursal_id,
        activo,
      });

      res.json(row);
    } catch (err) {
      console.error("Error actualizando feriado:", err);
      res.status(500).json({ error: "Error actualizando feriado" });
    }
  },

  async remove(req, res) {
    try {
      const { id } = req.params;
      const row = await ProyeccionFeriado.findByPk(id);
      if (!row) return res.status(404).json({ error: "No encontrado" });

      await row.destroy();
      res.json({ ok: true });
    } catch (err) {
      console.error("Error eliminando feriado:", err);
      res.status(500).json({ error: "Error eliminando feriado" });
    }
  },
};
