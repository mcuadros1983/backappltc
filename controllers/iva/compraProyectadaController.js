import CompraProyectada from "../../models/iva/compraproyectada.js";
import Empresa from "../../models/comun/empresa.js";
import LibroIva from "../../models/iva/libroiva.js";
import PeriodoLiquidacion from "../../models/sueldoempleado/periodoliquidacion.js";
import { Op } from "sequelize";

import Proveedor from "../../models/comun/proveedor.js";

export async function listar(req, res) {
  try {
    const {
      empresa_id,
      periodo_id,
      proveedor_id,
      informada, // "true" | "false"
      desde,     // YYYY-MM-DD
      hasta,     // YYYY-MM-DD
    } = req.query;

    const where = {};
    if (empresa_id) where.empresa_id = Number(empresa_id);
    if (periodo_id) where.periodo_id = Number(periodo_id);
    if (proveedor_id) where.proveedor_id = Number(proveedor_id);
    if (informada !== undefined) where.informada = String(informada).toLowerCase() === "true";

    // ✅ Fecha (DATEONLY) con operadores correctos
    if (desde && hasta) {
      where.fecha = { [Op.between]: [desde, hasta] };
    } else if (desde) {
      where.fecha = { [Op.gte]: desde };
    } else if (hasta) {
      where.fecha = { [Op.lte]: hasta };
    }

    const items = await CompraProyectada.findAll({
      where,
      include: [
        { model: Empresa, as: "empresa", attributes: ["id", "nombrecorto"] },
        { model: LibroIva, as: "libroiva", attributes: ["id", "mes", "anio"] },
        { model: PeriodoLiquidacion, as: "periodo", attributes: ["id", "anio", "mes"] },
        { model: Proveedor, as: "proveedor", attributes: ["id", "nombre"] },
      ],
      order: [["fecha", "ASC"], ["id", "ASC"]],
    });

    res.json(items);
  } catch (err) {
    console.error("listar compra proyectada", err);
    res.status(500).json({ error: "Error listando compras proyectadas" });
  }
}

export async function crear(req, res) {
  try {
    const body = req.body; // espera los campos declarados en el modelo
    const item = await CompraProyectada.create(body);
    res.status(201).json(item);
  } catch (err) {
    console.error("crear compra proyectada", err);
    res.status(500).json({ error: "Error creando compra proyectada" });
  }
}

export async function actualizar(req, res) {
  try {
    const { id } = req.params;
    const body = req.body;
    const item = await CompraProyectada.findByPk(id);
    if (!item) return res.status(404).json({ error: "No encontrado" });

    await item.update(body);
    res.json(item);
  } catch (err) {
    console.error("actualizar compra proyectada", err);
    res.status(500).json({ error: "Error actualizando compra proyectada" });
  }
}

export async function eliminar(req, res) {
  try {
    const { id } = req.params;
    const item = await CompraProyectada.findByPk(id);
    if (!item) return res.status(404).json({ error: "No encontrado" });

    await item.destroy();
    res.json({ ok: true });
  } catch (err) {
    console.error("eliminar compra proyectada", err);
    res.status(500).json({ error: "Error eliminando compra proyectada" });
  }
}
