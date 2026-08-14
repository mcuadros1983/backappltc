import multer from "multer";

export const multerErrorHandler = (error, req, res, next) => {
  if (!(error instanceof multer.MulterError)) return next(error);

  const messages = {
    LIMIT_FILE_SIZE: "El archivo supera el tamaño máximo permitido",
    LIMIT_FILE_COUNT: "Sólo se permite un archivo por solicitud",
    LIMIT_UNEXPECTED_FILE: "El campo de archivo debe llamarse file",
  };

  return res.status(400).json({
    success: false,
    message: messages[error.code] || "Error procesando el archivo",
  });
};

export default multerErrorHandler;
