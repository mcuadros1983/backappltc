export const validateCreateProject = (req, res, next) => {
  const {
    nombre,
    responsable_id,
    supervisor_id,
  } = req.body;

  if (!nombre || !String(nombre).trim()) {
    return res.status(400).json({
      success: false,
      message: "El nombre del proyecto es obligatorio",
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

  if (
    supervisor_id &&
    isNaN(Number(supervisor_id))
  ) {
    return res.status(400).json({
      success: false,
      message: "supervisor_id inválido",
    });
  }

  next();
};

export const validateAddMember = (req, res, next) => {
  const { usuario_id } = req.body;

  if (!usuario_id) {
    return res.status(400).json({
      success: false,
      message: "usuario_id es obligatorio",
    });
  }

  next();
};

export const validateProjectComment = (
  req,
  res,
  next
) => {

  const { comentario } = req.body;

  if (
    !comentario ||
    !String(comentario).trim()
  ) {
    return res.status(400).json({
      success: false,
      message: "El comentario es obligatorio",
    });
  }

  next();
};

export const validateProjectDocument = (
  req,
  res,
  next
) => {

  const { documento_id } = req.body;

  if (!documento_id) {
    return res.status(400).json({
      success: false,
      message: "documento_id es obligatorio",
    });
  }

  next();
};