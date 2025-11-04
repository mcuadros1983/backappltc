// controllers/comun/tarjetaComunController.js
import TarjetaComun from "../../models/comun/tarjetacomun.js";

// Crear nueva tarjeta común
export const crearTarjetaComun = async (req, res) => {
  try {
    const tarjeta = await TarjetaComun.create(req.body);
    res.status(201).json(tarjeta);
  } catch (error) {
    res.status(500).json({ error: "Error al crear la tarjeta común" });
  }
};

// // Listar todas las tarjetas comunes
// export const listarTarjetasComunes = async (req, res) => {
//   try {
//     const tarjetas = await TarjetaComun.findAll();
//     res.status(200).json(tarjetas);
//   } catch (error) {
//     res.status(500).json({ error: "Error al listar las tarjetas comunes" });
//   }
// };

// Listar tarjetas comunes con filtros
export const listarTarjetasComunes = async (req, res) => {
  try {
    const {
      empresa_id,
      terminacion,       // opcional: 1-4 dígitos (parcial o completo)
      banco_id,          // opcional
      marca_id,          // opcional
      tipotarjeta_id,    // opcional
      limit,
      offset,
    } = req.query;

    const where = {};

    // 🔒 filtro por empresa (lo que necesitás)
    if (empresa_id) where.empresa_id = Number(empresa_id);

    // filtros opcionales útiles
    if (banco_id) where.banco_id = Number(banco_id);
    if (marca_id) where.marca_id = Number(marca_id);
    if (tipotarjeta_id) where.tipotarjeta_id = Number(tipotarjeta_id);

    // terminación: si pasan 4 dígitos -> exacto, si pasan menos -> "termina en"
    if (terminacion) {
      const raw = String(terminacion).replace(/\D/g, "");
      if (raw.length >= 1 && raw.length <= 4) {
        if (raw.length === 4) {
          where.terminacion = raw;
        } else {
          // ends-with (ej.: "123" matchea "0123", "1123", etc.)
          where.terminacion = { [Op.like]: `%${raw}` };
        }
      }
    }

    const options = {
      where,
      order: [
        ["empresa_id", "ASC"],
        ["terminacion", "ASC"],
        ["id", "ASC"],
      ],
    };
    if (limit)  options.limit  = Math.min(Number(limit) || 50, 200);
    if (offset) options.offset = Number(offset) || 0;

    const tarjetas = await TarjetaComun.findAll(options);
    res.status(200).json(tarjetas);
  } catch (error) {
    console.error("listarTarjetasComunes error:", error);
    res.status(500).json({ error: "Error al listar las tarjetas comunes" });
  }
};

// Obtener tarjeta común por ID
export const obtenerTarjetaComunPorId = async (req, res) => {
  try {
    const tarjeta = await TarjetaComun.findByPk(req.params.id);
    if (!tarjeta) {
      return res.status(404).json({ error: "Tarjeta común no encontrada" });
    }
    res.status(200).json(tarjeta);
  } catch (error) {
    res.status(500).json({ error: "Error al obtener la tarjeta común" });
  }
};

// Actualizar tarjeta común por ID
export const actualizarTarjetaComun = async (req, res) => {
  try {
    const tarjeta = await TarjetaComun.findByPk(req.params.id);
    if (!tarjeta) {
      return res.status(404).json({ error: "Tarjeta común no encontrada" });
    }
    await tarjeta.update(req.body);
    res.status(200).json(tarjeta);
  } catch (error) {
    res.status(500).json({ error: "Error al actualizar la tarjeta común" });
  }
};

// Eliminar tarjeta común por ID
export const eliminarTarjetaComun = async (req, res) => {
  try {
    const tarjeta = await TarjetaComun.findByPk(req.params.id);
    if (!tarjeta) {
      return res.status(404).json({ error: "Tarjeta común no encontrada" });
    }
    await tarjeta.destroy();
    res.status(200).json({ mensaje: "Tarjeta común eliminada correctamente" });
  } catch (error) {
    res.status(500).json({ error: "Error al eliminar la tarjeta común" });
  }
};
