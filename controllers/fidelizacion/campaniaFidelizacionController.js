import {
  CampaniaFidelizacion,
  PremioCliente,
} from "../../models/fidelizacion/index.js";

export const listarCampaniasFidelizacion = async (req, res) => {
  try {
    const campanias = await CampaniaFidelizacion.findAll({
      include: [
        {
          model: PremioCliente,
          as: "premios",
          required: false,
        },
      ],
      order: [["createdAt", "DESC"]],
    });

    return res.json({
      ok: true,
      data: campanias,
    });
  } catch (error) {
    console.error("[listarCampaniasFidelizacion]", error);
    return res.status(500).json({
      ok: false,
      message: "Error al listar campañas",
      error: error.message,
    });
  }
};

export const obtenerCampaniaFidelizacionPorId = async (req, res) => {
  try {
    const { id } = req.params;

    const campania = await CampaniaFidelizacion.findByPk(id, {
      include: [
        {
          model: PremioCliente,
          as: "premios",
          required: false,
        },
      ],
    });

    if (!campania) {
      return res.status(404).json({
        ok: false,
        message: "Campaña no encontrada",
      });
    }

    return res.json({
      ok: true,
      data: campania,
    });
  } catch (error) {
    console.error("[obtenerCampaniaFidelizacionPorId]", error);
    return res.status(500).json({
      ok: false,
      message: "Error al obtener campaña",
      error: error.message,
    });
  }
};

export const crearCampaniaFidelizacion = async (req, res) => {
  try {
    const {
      nombre,
      descripcion,
      fecha_inicio,
      fecha_fin,
      estado,
      prioridad,
      tipo,
    } = req.body;

    if (!nombre || !fecha_inicio) {
      return res.status(400).json({
        ok: false,
        message: "Los campos nombre y fecha_inicio son obligatorios",
      });
    }

    const userId = req.user?.id || req.usuario?.id || null;

    const campania = await CampaniaFidelizacion.create({
      nombre,
      descripcion,
      fecha_inicio,
      fecha_fin,
      estado: estado || "borrador",
      prioridad: prioridad || 1,
      tipo: tipo || "general",
      created_by: userId,
      updated_by: userId,
    });

    return res.status(201).json({
      ok: true,
      message: "Campaña creada correctamente",
      data: campania,
    });
  } catch (error) {
    console.error("[crearCampaniaFidelizacion]", error);
    return res.status(500).json({
      ok: false,
      message: "Error al crear campaña",
      error: error.message,
    });
  }
};

export const actualizarCampaniaFidelizacion = async (req, res) => {
  try {
    const { id } = req.params;

    const campania = await CampaniaFidelizacion.findByPk(id);

    if (!campania) {
      return res.status(404).json({
        ok: false,
        message: "Campaña no encontrada",
      });
    }

    const {
      nombre,
      descripcion,
      fecha_inicio,
      fecha_fin,
      estado,
      prioridad,
      tipo,
    } = req.body;

    const userId = req.user?.id || req.usuario?.id || null;

    await campania.update({
      nombre: nombre ?? campania.nombre,
      descripcion: descripcion ?? campania.descripcion,
      fecha_inicio: fecha_inicio ?? campania.fecha_inicio,
      fecha_fin: fecha_fin ?? campania.fecha_fin,
      estado: estado ?? campania.estado,
      prioridad: prioridad ?? campania.prioridad,
      tipo: tipo ?? campania.tipo,
      updated_by: userId,
    });

    return res.json({
      ok: true,
      message: "Campaña actualizada correctamente",
      data: campania,
    });
  } catch (error) {
    console.error("[actualizarCampaniaFidelizacion]", error);
    return res.status(500).json({
      ok: false,
      message: "Error al actualizar campaña",
      error: error.message,
    });
  }
};

export const activarCampaniaFidelizacion = async (req, res) => {
  try {
    const { id } = req.params;

    const campania = await CampaniaFidelizacion.findByPk(id);

    if (!campania) {
      return res.status(404).json({
        ok: false,
        message: "Campaña no encontrada",
      });
    }

    const userId = req.user?.id || req.usuario?.id || null;

    await campania.update({
      estado: "activa",
      updated_by: userId,
    });

    return res.json({
      ok: true,
      message: "Campaña activada correctamente",
      data: campania,
    });
  } catch (error) {
    console.error("[activarCampaniaFidelizacion]", error);
    return res.status(500).json({
      ok: false,
      message: "Error al activar campaña",
      error: error.message,
    });
  }
};

export const pausarCampaniaFidelizacion = async (req, res) => {
  try {
    const { id } = req.params;

    const campania = await CampaniaFidelizacion.findByPk(id);

    if (!campania) {
      return res.status(404).json({
        ok: false,
        message: "Campaña no encontrada",
      });
    }

    const userId = req.user?.id || req.usuario?.id || null;

    await campania.update({
      estado: "pausada",
      updated_by: userId,
    });

    return res.json({
      ok: true,
      message: "Campaña pausada correctamente",
      data: campania,
    });
  } catch (error) {
    console.error("[pausarCampaniaFidelizacion]", error);
    return res.status(500).json({
      ok: false,
      message: "Error al pausar campaña",
      error: error.message,
    });
  }
};

export const finalizarCampaniaFidelizacion = async (req, res) => {
  try {
    const { id } = req.params;

    const campania = await CampaniaFidelizacion.findByPk(id);

    if (!campania) {
      return res.status(404).json({
        ok: false,
        message: "Campaña no encontrada",
      });
    }

    const userId = req.user?.id || req.usuario?.id || null;

    await campania.update({
      estado: "finalizada",
      updated_by: userId,
    });

    return res.json({
      ok: true,
      message: "Campaña finalizada correctamente",
      data: campania,
    });
  } catch (error) {
    console.error("[finalizarCampaniaFidelizacion]", error);
    return res.status(500).json({
      ok: false,
      message: "Error al finalizar campaña",
      error: error.message,
    });
  }
};