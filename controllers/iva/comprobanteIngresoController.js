import ComprobanteIngreso from "../../models/iva/comprobanteingreso.js";

// Crear
// export const crearComprobanteIngreso = async (req, res) => {
//   try {
//     const nuevo = await ComprobanteIngreso.create(req.body);
//     res.status(201).json(nuevo);
//   } catch (error) {
//     res.status(500).json({ error: 'Error al crear el comprobante de ingreso', detalle: error.message });
//   }
// };

export const crearComprobanteIngreso = async (req, res) => {
  try {
    console.log("📥 Datos recibidos para crear comprobante:", req.body);

    // Convertir string vacío a null en todos los campos que deben ser integer o null
    const camposAConvertir = [
      "tipocomprobante_id",
      "ptoventa_id",
      "libroiva_id",
      "cliente_id",
      "imputacioncontable_id",
      "ctactecliente_id",
      "formapago_id",
      "empresa_id"
    ];

    camposAConvertir.forEach((campo) => {
      if (req.body[campo] === "") {
        req.body[campo] = null;
        console.log(`⚠️ Campo '${campo}' venía vacío, se transformó a null`);
      }
    });

    const nuevo = await ComprobanteIngreso.create(req.body);
    console.log("✅ Comprobante creado correctamente:", nuevo);
    res.status(201).json(nuevo);
  } catch (error) {
    console.error("❌ Error al crear comprobante de ingreso:");
    console.error("📛 Mensaje:", error.message);
    console.error("📛 Stack:", error.stack);

    if (error.errors) {
      error.errors.forEach((err) => {
        console.error(`🔎 Campo con error: ${err.path} - Mensaje: ${err.message}`);
      });
    }

    res.status(500).json({
      error: "Error al crear el comprobante de ingreso",
      detalle: error.message,
    });
  }
};


// Listar todos
// export const listarComprobantesIngreso = async (req, res) => {
//   try {
//     const lista = await ComprobanteIngreso.findAll();
//     res.status(200).json(lista);
//   } catch (error) {
//     res.status(500).json({ error: 'Error al listar comprobantes de ingreso' });
//   }
// };

// Listar todos
export const listarComprobantesIngreso = async (req, res) => {
  try {
    const { empresa_id } = req.query;

    const where = empresa_id
      ? { empresa_id: parseInt(empresa_id) } // Solo los de esa empresa
      : {}; // Todos (modo unificado)

    const lista = await ComprobanteIngreso.findAll({ where });
    res.status(200).json(lista);
  } catch (error) {
    res.status(500).json({ error: 'Error al listar comprobantes de ingreso', detalle: error.message });
  }
};


// Obtener por ID
export const obtenerComprobanteIngresoPorId = async (req, res) => {
  try {
    const item = await ComprobanteIngreso.findByPk(req.params.id);
    if (!item) return res.status(404).json({ error: 'Comprobante no encontrado' });
    res.status(200).json(item);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener el comprobante' });
  }
};

// Actualizar
export const actualizarComprobanteIngreso = async (req, res) => {
  try {
    const item = await ComprobanteIngreso.findByPk(req.params.id);
    if (!item) return res.status(404).json({ error: 'Comprobante no encontrado' });
    await item.update(req.body);
    res.status(200).json(item);
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar el comprobante' });
  }
};

// Eliminar
export const eliminarComprobanteIngreso = async (req, res) => {
  try {
    const item = await ComprobanteIngreso.findByPk(req.params.id);
    if (!item) return res.status(404).json({ error: 'Comprobante no encontrado' });
    await item.destroy();
    res.status(200).json({ mensaje: 'Comprobante eliminado correctamente' });
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar el comprobante' });
  }
};
