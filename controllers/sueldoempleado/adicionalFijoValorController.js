// Histórico de valores por tipo (vigencias)
import { Op } from "sequelize";
import AdicionalFijoValor from "../../models/sueldoempleado/adicionalfijovalor.js";
import { sequelize } from "../../config/database.js";

export const listarValoresFijos = async (req, res) => {
  const { adicionalfijotipo_id } = req.query;
  const where = adicionalfijotipo_id ? { adicionalfijotipo_id } : {};
  const rows = await AdicionalFijoValor.findAll({
    where,
    order: [["vigencia_desde", "DESC"], ["id", "DESC"]],
  });
  res.json(rows);
};

export const crearValorFijo = async (req, res) => {
  const { adicionalfijotipo_id, vigencia_desde, vigencia_hasta, monto } = req.body || {};
  const row = await AdicionalFijoValor.create({ adicionalfijotipo_id, vigencia_desde, vigencia_hasta, monto });
  res.status(201).json(row);
};

export const cerrarVigenciaValorFijo = async (req, res) => {
  const { id } = req.params;
  const { vigencia_hasta } = req.body || {};
  const row = await AdicionalFijoValor.findByPk(id);
  if (!row) return res.status(404).json({ error: "No encontrado" });
  await row.update({ vigencia_hasta });
  res.json(row);
};

export const vigenteParaFecha = async (req, res) => {
  const { adicionalfijotipo_id, fecha } = req.query;
  if (!adicionalfijotipo_id || !fecha) return res.status(400).json({ error: "Parámetros requeridos" });

  const row = await AdicionalFijoValor.findOne({
    where: {
      adicionalfijotipo_id,
      vigencia_desde: { [Op.lte]: fecha },
      [Op.or]: [{ vigencia_hasta: null }, { vigencia_hasta: { [Op.gte]: fecha } }],
    },
    order: [["vigencia_desde", "DESC"]],
  });

  res.json(row || null);
};

export const crearValorFijoSeguro = async (req, res) => {
  const { adicionalfijotipo_id, vigencia_desde, monto } = req.body || {};
  if (!adicionalfijotipo_id || !vigencia_desde || !monto) {
    return res.status(400).json({ error: "adicionalfijotipo_id, vigencia_desde y monto son requeridos" });
  }

  try {
    await sequelize.transaction(async (t) => {
      // 1) Buscar el ÚLTIMO ABIERTO (vigencia_hasta = null) para este tipo
      const abierto = await AdicionalFijoValor.findOne({
        where: { adicionalfijotipo_id, vigencia_hasta: null },
        order: [["vigencia_desde", "DESC"]],
        transaction: t,
        lock: t.LOCK.UPDATE, // evita carreras concurrentes
      });

      // Validaciones básicas
      if (abierto) {
        const dNueva = new Date(vigencia_desde);
        const dAbierto = new Date(abierto.vigencia_desde);
        if (dNueva <= dAbierto) {
          throw new Error("La nueva 'vigencia_desde' debe ser posterior a la actual.");
        }
        // 2) Cerrar el abierto con la nueva fecha de inicio
        await abierto.update({ vigencia_hasta: vigencia_desde }, { transaction: t });
      }

      // 3) Crear el nuevo valor
      await AdicionalFijoValor.create({
        adicionalfijotipo_id,
        vigencia_desde,
        vigencia_hasta: null,
        monto,
      }, { transaction: t });
    });

    res.status(201).json({ ok: true });
  } catch (e) {
    res.status(400).json({ error: e.message || "No se pudo crear el valor" });
  }
};

// --- NUEVO: actualizar monto y/o vigencias del valor vigente (abierto) ---
export const actualizarValorFijo = async (req, res) => {
  const { id } = req.params;
  const { monto, vigencia_desde, vigencia_hasta } = req.body || {};

  const row = await AdicionalFijoValor.findByPk(id);
  if (!row) return res.status(404).json({ error: "No encontrado" });

  try {
    await sequelize.transaction(async (t) => {
      // por consistencia solo permitimos editar el abierto
      if (row.vigencia_hasta !== null) {
        throw new Error("Solo se puede editar el valor vigente (abierto).");
      }

      const nuevoMonto = (monto !== undefined && monto !== null) ? Number(monto) : row.monto;
      const nuevaDesde = vigencia_desde || row.vigencia_desde;
      const nuevaHasta = (vigencia_hasta === undefined) ? row.vigencia_hasta : vigencia_hasta; // normalmente null

      // Valor anterior (cerrado) del mismo tipo, para validar continuidad
      const anterior = await AdicionalFijoValor.findOne({
        where: {
          adicionalfijotipo_id: row.adicionalfijotipo_id,
          id: { [Op.ne]: row.id },
          vigencia_hasta: { [Op.ne]: null },
        },
        order: [["vigencia_desde", "DESC"]],
        transaction: t,
        lock: t.LOCK.UPDATE,
      });

      if (anterior) {
        const dNueva = new Date(nuevaDesde);
        const dAnterior = new Date(anterior.vigencia_desde);
        if (dNueva <= dAnterior) {
          throw new Error("La 'vigencia desde' debe ser posterior a la del valor anterior.");
        }
      }

      // Si cambia la fecha de inicio del vigente, cerramos el anterior con esa nueva fecha
      if (anterior && String(nuevaDesde) !== String(row.vigencia_desde)) {
        await anterior.update({ vigencia_hasta: nuevaDesde }, { transaction: t });
      }

      await row.update(
        {
          monto: nuevoMonto,
          vigencia_desde: nuevaDesde,
          vigencia_hasta: nuevaHasta ?? null,
        },
        { transaction: t }
      );
    });

    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(400).json({ error: e.message || "No se pudo actualizar el valor" });
  }
};
