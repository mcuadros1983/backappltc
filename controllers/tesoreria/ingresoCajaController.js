import IngresoCaja from "../../models/tesoreria/ingresocaja.js";

// Crear ingreso
export const crearIngresoCaja = async (req, res) => {
  try {
    const ingreso = await IngresoCaja.create(req.body);
    res.status(201).json(ingreso);
  } catch (error) {
    res.status(500).json({ error: "Error al crear el ingreso", detalle: error.message });
  }
};

// Listar todos los ingresos
export const listarIngresosCaja = async (req, res) => {
  try {
    const ingresos = await IngresoCaja.findAll();
    res.status(200).json(ingresos);
  } catch (error) {
    res.status(500).json({ error: "Error al obtener los ingresos" });
  }
};

// Obtener por ID
export const obtenerIngresoCajaPorId = async (req, res) => {
  try {
    const ingreso = await IngresoCaja.findByPk(req.params.id);
    if (!ingreso) return res.status(404).json({ error: "Ingreso no encontrado" });
    res.status(200).json(ingreso);
  } catch (error) {
    res.status(500).json({ error: "Error al obtener el ingreso" });
  }
};

// Actualizar ingreso
export const actualizarIngresoCaja = async (req, res) => {
  try {
    const ingreso = await IngresoCaja.findByPk(req.params.id);
    if (!ingreso) return res.status(404).json({ error: "Ingreso no encontrado" });
    await ingreso.update(req.body);
    res.status(200).json(ingreso);
  } catch (error) {
    res.status(500).json({ error: "Error al actualizar el ingreso" });
  }
};

// Eliminar ingreso
export const eliminarIngresoCaja = async (req, res) => {
  try {
    const ingreso = await IngresoCaja.findByPk(req.params.id);
    if (!ingreso) return res.status(404).json({ error: "Ingreso no encontrado" });
    await ingreso.destroy();
    res.status(200).json({ mensaje: "Ingreso eliminado correctamente" });
  } catch (error) {
    res.status(500).json({ error: "Error al eliminar el ingreso" });
  }
};
