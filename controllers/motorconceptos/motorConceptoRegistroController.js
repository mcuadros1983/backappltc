import motorConceptoRegistroService from "../../services/motorconceptos/motorConceptoRegistroService.js";

const ok = (
  res,
  data,
  message = null,
  status = 200
) =>
  res.status(
    status
  ).json({
    success:
      true,
    message,
    data,
  });

const fail = (
  res,
  error,
  fallbackStatus = 400
) =>
  res.status(
    error.status ||
    fallbackStatus
  ).json({
    success:
      false,

    message:
      error.message ||
      "Error en registros del Motor de Conceptos",
  });

export const update = async (
  req,
  res
) => {

  try {

    const data =
      await motorConceptoRegistroService.update(
        req.user,
        req.params.id,
        req.body
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

export const getAll = async (
  req,
  res
) => {
  try {

    const data =
      await motorConceptoRegistroService.getAll(
        req.user,
        req.query
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

export const getById = async (
  req,
  res
) => {
  try {
    const data =
      await motorConceptoRegistroService.getById(
        req.user,
        req.params.id
      );

    return ok(
      res,
      data
    );
  } catch (error) {
    return fail(
      res,
      error,
      404
    );
  }
};

export const getHistory = async (
  req,
  res
) => {
  try {
    const data =
      await motorConceptoRegistroService.getHistory(
        req.user,
        req.params.id
      );

    return ok(
      res,
      data
    );
  } catch (error) {
    return fail(
      res,
      error,
      404
    );
  }
};

// export const create = async (
//   req,
//   res
// ) => {
//   try {
//     const data =
//       await motorConceptoRegistroService.create(
//         req.user,
//         req.body
//       );

//     return ok(
//       res,
//       data,
//       "Registro creado",
//       201
//     );
//   } catch (error) {
//     return fail(
//       res,
//       error
//     );
//   }
// };


export const create = async (
  req,
  res
) => {
  try {

    let payload =
      req.body;

    /*
     * Multipart/FormData envía los objetos
     * complejos como strings JSON.
     *
     * Las llamadas JSON existentes continúan
     * funcionando sin modificación.
     */
    if (
      typeof payload.valores ===
      "string"
    ) {

      try {

        payload = {
          ...payload,

          valores:
            JSON.parse(
              payload.valores
            ),
        };

      } catch (_) {

        throw new Error(
          "El formato de valores es inválido"
        );

      }

    }

    /*
     * metadata_archivos contiene:
     *
     * [
     *   {
     *     archivo_tipo_id,
     *     nombre_logico
     *   }
     * ]
     *
     * El índice corresponde con req.files.
     */
    let metadataArchivos =
      [];

    if (
      typeof payload.metadata_archivos ===
      "string"
    ) {

      try {

        metadataArchivos =
          JSON.parse(
            payload.metadata_archivos
          );

      } catch (_) {

        throw new Error(
          "El formato de metadata_archivos es inválido"
        );

      }

    } else if (
      Array.isArray(
        payload.metadata_archivos
      )
    ) {

      metadataArchivos =
        payload.metadata_archivos;

    }

    const data =
      await motorConceptoRegistroService.create(
        req.user,

        payload,

        req.files || [],

        metadataArchivos
      );

    return ok(
      res,
      data,
      "Registro creado",
      201
    );

  } catch (error) {

    return fail(
      res,
      error
    );

  }
};


export const createVersion = async (
  req,
  res
) => {
  try {
    const data =
      await motorConceptoRegistroService.createVersion(
        req.user,
        req.params.id,
        req.body
      );

    return ok(
      res,
      data,
      "Nueva versión creada",
      201
    );
  } catch (error) {
    return fail(
      res,
      error
    );
  }
};

export const renovarRegistro =
  async (
    req,
    res
  ) => {
    try {

      const data =
        await motorConceptoRegistroService.renovarRegistro(

          req.user,

          req.params.id,

          req.body

        );

      return ok(
        res,
        data,
        "Registro renovado correctamente"
      );

    } catch (error) {

      return fail(
        res,
        error
      );

    }
  };

export const changeStatus = async (
  req,
  res
) => {
  try {
    const data =
      await motorConceptoRegistroService.changeStatus(
        req.user,
        req.params.id,
        req.body
      );

    return ok(
      res,
      data,
      "Estado actualizado"
    );
  } catch (error) {
    return fail(
      res,
      error
    );
  }
};

export const remove = async (
  req,
  res
) => {
  try {
    const data =
      await motorConceptoRegistroService.remove(
        req.user,
        req.params.id
      );

    return ok(
      res,
      data,
      "Registro eliminado"
    );
  } catch (error) {
    return fail(
      res,
      error
    );
  }
};

export const markExpired = async (
  req,
  res
) => {
  try {
    const data =
      await motorConceptoRegistroService.markExpired(
        req.user
      );

    return ok(
      res,
      data,
      "Vencimientos actualizados"
    );
  } catch (error) {
    return fail(
      res,
      error
    );
  }
};

export const getResumenByEntidadTipo = async (
  req,
  res,
  next
) => {

  try {

    console.log(
      "🔥 CONTROLLER resumen-entidades"
    );

    console.log(
      "query:",
      req.query
    );

    console.log(
      "entidad_tipo_id:",
      req.query.entidad_tipo_id
    );

    const result =
      await motorConceptoRegistroService
        .getResumenByEntidadTipo(
          req.user,
          req.query.entidad_tipo_id
        );

    console.log(
      "🔥 RESULTADO RESUMEN:",
      result
    );

    return res.json(
      result
    );

  } catch (error) {

    console.error(
      "❌ ERROR resumen-entidades:",
      error
    );

    next(
      error
    );

  }

};