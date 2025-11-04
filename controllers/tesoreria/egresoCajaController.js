import EgresoCaja from "../../models/tesoreria/egresocaja.js";

// Crear egreso
export const crearEgresoCaja = async (req, res) => {
  try {
    const egreso = await EgresoCaja.create(req.body);
    res.status(201).json(egreso);
  } catch (error) {
    res.status(500).json({ error: "Error al crear el egreso", detalle: error.message });
  }
};

// Listar todos los egresos
export const listarEgresosCaja = async (req, res) => {
  try {
    const egresos = await EgresoCaja.findAll();
    res.status(200).json(egresos);
  } catch (error) {
    res.status(500).json({ error: "Error al obtener los egresos" });
  }
};

// Obtener por ID
export const obtenerEgresoCajaPorId = async (req, res) => {
  try {
    const egreso = await EgresoCaja.findByPk(req.params.id);
    if (!egreso) return res.status(404).json({ error: "Egreso no encontrado" });
    res.status(200).json(egreso);
  } catch (error) {
    res.status(500).json({ error: "Error al obtener el egreso" });
  }
};

// Actualizar egreso
export const actualizarEgresoCaja = async (req, res) => {
  try {
    const egreso = await EgresoCaja.findByPk(req.params.id);
    if (!egreso) return res.status(404).json({ error: "Egreso no encontrado" });
    await egreso.update(req.body);
    res.status(200).json(egreso);
  } catch (error) {
    res.status(500).json({ error: "Error al actualizar el egreso" });
  }
};

// Eliminar egreso
export const eliminarEgresoCaja = async (req, res) => {
  try {
    const egreso = await EgresoCaja.findByPk(req.params.id);
    if (!egreso) return res.status(404).json({ error: "Egreso no encontrado" });
    await egreso.destroy();
    res.status(200).json({ mensaje: "Egreso eliminado correctamente" });
  } catch (error) {
    res.status(500).json({ error: "Error al eliminar el egreso" });
  }
};
