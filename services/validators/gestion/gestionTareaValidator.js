export const validateCreateTask = (req, res, next) => {
  const {
    titulo,
    proyecto_id,
    responsable_id,
  } = req.body;

  if (!titulo || !String(titulo).trim()) {
    return res.status(400).json({
      success: false,
      message: "El título de la tarea es obligatorio",
    });
  }

  if (
    proyecto_id &&
    isNaN(Number(proyecto_id))
  ) {
    return res.status(400).json({
      success: false,
      message: "proyecto_id inválido",
    });
  }

  if (
    responsable_id &&
    isNaN(Number(responsable_id))
  ) {
    return res.status(400).json({
      success: false,
      message: "responsable_id inválido",
    });
  }


  next();
};

export const validateChangeStatus = (req, res, next) => {
  const { estado } = req.body;

  if (!estado) {
    return res.status(400).json({
      success: false,
      message: "El estado es obligatorio",
    });
  }

  next();
};

export const validateComment = (req, res, next) => {
  const { comentario } = req.body;

  if (!comentario || !String(comentario).trim()) {
    return res.status(400).json({
      success: false,
      message: "El comentario es obligatorio",
    });
  }

  next();
};

export const validateChecklistItem = (req, res, next) => {
  const { descripcion } = req.body;

  if (!descripcion || !String(descripcion).trim()) {
    return res.status(400).json({
      success: false,
      message: "La descripción del checklist es obligatoria",
    });
  }

  next();
};
