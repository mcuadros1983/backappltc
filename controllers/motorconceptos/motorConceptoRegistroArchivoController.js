import motorConceptoRegistroArchivoService from "../../services/motorconceptos/motorConceptoRegistroArchivoService.js";

const ok = (
  res,
  data,
  message = null,
  status = 200
) =>
  res.status(status).json({
    success: true,
    message,
    data,
  });

const fail = (
  res,
  error,
  status = 400
) =>
  res.status(status).json({
    success: false,
    message:
      error.message ||
      "Error",
  });

  
const safeFileName = (
  value
) =>
  String(
    value ||
    "archivo"
  )
    .replace(
      /[\r\n"]/g,
      "_"
    );

    
export const download = async (req, res) => {
  try {
    const result =
      await motorConceptoRegistroArchivoService.download(
        req.user,
        req.params.archivoId
      );

    return res.redirect(result.url);

  } catch (error) {
    return fail(res, error);
  }
};

export const replace =
  async (
    req,
    res
  ) => {
    try {
      const data =
        await motorConceptoRegistroArchivoService.replace(
          req.user,
          req.params
            .archivoId,
          req.file
        );

      return ok(
        res,
        data,
        "Archivo reemplazado correctamente"
      );
    } catch (error) {
      return fail(
        res,
        error
      );
    }
  };

export const history =
  async (
    req,
    res
  ) => {
    try {
      const data =
        await motorConceptoRegistroArchivoService.history(
          req.user,
          req.params
            .archivoId
        );

      return ok(
        res,
        data
      );
    } catch (error) {
      return fail(
        res,
        error
      );
    }
  };
