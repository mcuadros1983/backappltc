import TarjetaPlanPago from "../../models/tesoreria/tarjetaplanpago.js";

// helper de validación básica
function validarSegunTipoCalculo(body) {
  const { tipo_calculo, coeficiente, tasa_mensual } = body || {};

  if (!tipo_calculo) {
    return "tipo_calculo es requerido (coeficiente | tasa)";
  }

  if (tipo_calculo === "coeficiente") {
    if (coeficiente == null || coeficiente === "") {
      return "coeficiente es requerido cuando tipo_calculo = 'coeficiente'";
    }
  }

  if (tipo_calculo === "tasa") {
    if (tasa_mensual == null || tasa_mensual === "") {
      return "tasa_mensual es requerida cuando tipo_calculo = 'tasa'";
    }
  }

  return null;
}

// Crear plan
export const crearTarjetaPlanPago = async (req, res) => {
  try {
    const errorVal = validarSegunTipoCalculo(req.body);
    if (errorVal) return res.status(400).json({ error: errorVal });

    const plan = await TarjetaPlanPago.create(req.body);
    res.status(201).json(plan);
  } catch (error) {
    res.status(500).json({ error: "Error al crear el plan de tarjeta", detalle: error.message });
  }
};

// Listar todos los planes
export const listarTarjetaPlanesPago = async (req, res) => {
  try {
    const planes = await TarjetaPlanPago.findAll();
    res.status(200).json(planes);
  } catch (error) {
    res.status(500).json({ error: "Error al obtener los planes de tarjeta" });
  }
};

// Obtener por ID
export const obtenerTarjetaPlanPagoPorId = async (req, res) => {
  try {
    const plan = await TarjetaPlanPago.findByPk(req.params.id);
    if (!plan) return res.status(404).json({ error: "Plan de tarjeta no encontrado" });
    res.status(200).json(plan);
  } catch (error) {
    res.status(500).json({ error: "Error al obtener el plan de tarjeta" });
  }
};

// Actualizar plan
export const actualizarTarjetaPlanPago = async (req, res) => {
  try {
    const plan = await TarjetaPlanPago.findByPk(req.params.id);
    if (!plan) return res.status(404).json({ error: "Plan de tarjeta no encontrado" });

    // Validación solo si vienen campos relevantes (o validá siempre si preferís)
    const payload = { ...req.body };
    const errorVal = validarSegunTipoCalculo({ 
      tipo_calculo: payload.tipo_calculo ?? plan.tipo_calculo,
      coeficiente: payload.coeficiente ?? plan.coeficiente,
      tasa_mensual: payload.tasa_mensual ?? plan.tasa_mensual
    });
    if (errorVal) return res.status(400).json({ error: errorVal });

    await plan.update(req.body);
    res.status(200).json(plan);
  } catch (error) {
    res.status(500).json({ error: "Error al actualizar el plan de tarjeta" });
  }
};

// Eliminar plan
export const eliminarTarjetaPlanPago = async (req, res) => {
  try {
    const plan = await TarjetaPlanPago.findByPk(req.params.id);
    if (!plan) return res.status(404).json({ error: "Plan de tarjeta no encontrado" });

    await plan.destroy();
    res.status(200).json({ mensaje: "Plan de tarjeta eliminado correctamente" });
  } catch (error) {
    res.status(500).json({ error: "Error al eliminar el plan de tarjeta" });
  }
};
