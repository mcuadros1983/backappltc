import motorConceptoRegistroArchivoService from "../../services/motorConceptos/motorConceptoRegistroArchivoService.js";

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

// export const listByRegistro = 
//   async (
//     req,
//     res
//   ) => {
//     try {
//       const data =
//         await motorConceptoRegistroArchivoService.listByRegistro(
//           req.user,
//           req.params
//             .registroId,
//           {
//             includeHistory:
//               req.query
//                 .includeHistory ===
//               "true",
//           }
//         );

//       return ok(
//         res,
//         data
//       );
//     } catch (error) {
//       return fail(
//         res,
//         error
//       );
//     }
//   };

// export const uploadMultiple =
//   async (
//     req,
//     res
//   ) => {
//     try {
//       const data =
//         await motorConceptoRegistroArchivoService.uploadMultiple(
//           req.user,
//           req.params
//             .registroId,
//           req.body
//             .archivo_tipo_id,
//           req.files ||
//           []
//         );

//       return ok(
//         res,
//         data,
//         "Archivos cargados correctamente",
//         201
//       );
//     } catch (error) {
//       return fail(
//         res,
//         error
//       );
//     }
//   };

// export const remove =
//   async (
//     req,
//     res
//   ) => {
//     try {
//       const data =
//         await motorConceptoRegistroArchivoService.remove(
//           req.user,
//           req.params
//             .archivoId
//         );

//       return ok(
//         res,
//         data,
//         "Archivo eliminado correctamente"
//       );
//     } catch (error) {
//       return fail(
//         res,
//         error
//       );
//     }
//   };

// export const download =
//   async (
//     req,
//     res
//   ) => {
//     try {
//       const result =
//         await motorConceptoRegistroArchivoService.download(
//           req.user,
//           req.params
//             .archivoId
//         );

//       const name =
//         safeFileName(
//           result.fileName
//         );

//       res.setHeader(
//         "Content-Type",
//         result.mimeType
//       );

//       res.setHeader(
//         "Content-Disposition",
//         `attachment; filename="${name}"; filename*=UTF-8''${encodeURIComponent(name)}`
//       );

//       if (
//         result.size
//       ) {
//         res.setHeader(
//           "Content-Length",
//           result.size
//         );
//       }

//       result.stream.on(
//         "error",
//         (error) => {
//           if (
//             !res.headersSent
//           ) {
//             fail(
//               res,
//               error,
//               500
//             );
//           } else {
//             res.destroy(
//               error
//             );
//           }
//         }
//       );

//       req.on(
//         "close",
//         () => {
//           if (
//             !result.stream
//               .destroyed
//           ) {
//             result.stream.destroy();
//           }
//         }
//       );

//       return result.stream.pipe(
//         res
//       );
//     } catch (error) {
//       return fail(
//         res,
//         error
//       );
//     }
//   };

// export const download =
//   async (
//     req,
//     res
//   ) => {
//     try {

//       const result =
//         await motorConceptoRegistroArchivoService.download(
//           req.user,
//           req.params.archivoId
//         );

//       if (
//         req.query.preview === "true"
//       ) {
//         return res.redirect(
//           result.url
//         );
//       }

//       return res.json({
//         success: true,
//         data: result,
//       });

//     } catch (error) {

//       return fail(
//         res,
//         error
//       );

//     }
//   };


