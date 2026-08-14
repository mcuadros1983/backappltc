import {
  MotorConceptoArchivoTipo,
} from "../../models/motorconceptos/index.js"; 

import {
  MotorConceptoRegistro,
  MotorConceptoRegistroVersion,
  MotorConceptoRegistroArchivo,
} from "../../models/motorconceptos/operacionAssociations.js";

import {
  uploadToDrive,
} from "../googleDriveService.js";

import {
  validateUpload,
  validateReplacement,
} from "../../validators/motorconceptos/motorConceptoRegistroArchivoValidator.js";

const getUserId = (user) => {
  if (!user?.id) {
    throw new Error(
      "Usuario autenticado no disponible"
    );
  }

  return user.id;
};

const getRegistro = async (
  registroId
) => {
  const registro =
    await MotorConceptoRegistro.findOne({
      where: {
        id: registroId,
      },
      include: [
        {
          model:
            MotorConceptoRegistroVersion,
          as:
            "versionActual",
          required:
            false,
        },
      ],
    });

  if (!registro) {
    throw new Error(
      "Registro de concepto no encontrado"
    );
  }

  if (
    registro.activo === false
  ) {
    throw new Error(
      "El registro de concepto está inactivo"
    );
  }

  return registro;
};

const getCurrentVersion = async (
  registro
) => {
  if (
    registro.versionActual
  ) {
    return registro.versionActual;
  }

  if (
    registro.version_actual_id
  ) {
    const version =
      await MotorConceptoRegistroVersion.findByPk(
        registro.version_actual_id
      );

    if (version) {
      return version;
    }
  }

  throw new Error(
    "El registro no tiene una versión actual"
  );
};

const getArchivoTipo = async (
  archivoTipoId
) => {
  const archivoTipo =
    await MotorConceptoArchivoTipo.findOne({
      where: {
        id: archivoTipoId,
        activo: true,
      },
    });

  if (!archivoTipo) {
    throw new Error(
      "Tipo de archivo no encontrado"
    );
  }

  return archivoTipo;
};

const getArchivo = async (
  archivoId,
  options = {}
) => {
  const archivo =
    await MotorConceptoRegistroArchivo.findOne({
      where: {
        id: archivoId,
        ...(options.includeInactive
          ? {}
          : {
            activo: true,
          }),
      },
      paranoid:
        !options.includeDeleted,
      include: [
        {
          model:
            MotorConceptoRegistroVersion,
          as:
            "version",
          required:
            true,
          include: [
            {
              model:
                MotorConceptoRegistro,
              as:
                "registro",
              required:
                true,
            },
          ],
        },
        {
          model:
            MotorConceptoArchivoTipo,
          as:
            "archivoTipo",
          required:
            true,
        },
      ],
    });

  if (!archivo) {
    throw new Error(
      "Archivo no encontrado"
    );
  }

  return archivo;
};


const download = async (
  user,
  archivoId
) => {
  await getUserId(user);

  const archivo =
    await getArchivo(
      archivoId
    );

  if (!archivo.url) {
    throw new Error(
      "El archivo no tiene una URL disponible para descarga"
    );
  }

  return {
    fileName: archivo.nombre,
    mimeType:
      archivo.mime_type ||
      "application/octet-stream",
    size:
      archivo.peso_bytes,
    url:
      archivo.url,
  };
};

const replace = async (
  user,
  archivoId,
  file
) => {
  const userId =
    getUserId(user);

  const previous =
    await getArchivo(
      archivoId
    );

  validateReplacement({
    archivoTipo:
      previous.archivoTipo,
    file,
  });

  const drive =
    await uploadToDrive({
      originalName:
        file.originalname,
      mimeType:
        file.mimetype,
      localPath:
        file.path,
    });

  const replacement =
    await MotorConceptoRegistroArchivo.create({
      version_id:
        previous.version_id,

      archivo_tipo_id:
        previous.archivo_tipo_id,

      // Se conserva el nombre lógico
      // para mantener el historial.
      nombre_logico:
        previous.nombre_logico,

      drive_file_id:
        drive.fileId,

      nombre:
        file.originalname,

      mime_type:
        file.mimetype ||
        drive.mimeType ||
        null,

      peso_bytes:
        file.size ||
        drive.size ||
        null,

      hash:
        null,

      url:
        drive.webViewLink ||
        drive.webContentLink ||
        null,

      activo:
        true,

      creado_por:
        userId,

      modificado_por:
        userId,
    });

  await previous.update({
    activo:
      false,
    modificado_por:
      userId,
  });

  // Soft delete únicamente.
  // NO eliminar el archivo físico de Google Drive.
  await previous.destroy();

  return {
    anterior:
      previous,
    actual:
      replacement,
  };
};

const history = async (
  user,
  archivoId
) => {
  await getUserId(user);

  const reference =
    await getArchivo(
      archivoId,
      {
        includeInactive:
          true,
        includeDeleted:
          true,
      }
    );

  return MotorConceptoRegistroArchivo.findAll({
    where: {
      version_id:
        reference.version_id,

      archivo_tipo_id:
        reference.archivo_tipo_id,

      nombre_logico:
        reference.nombre_logico,
    },

    paranoid:
      false,

    order: [
      [
        "created_at",
        "DESC",
      ],
      [
        "id",
        "DESC",
      ],
    ],
  });
};

export default {
  // listByRegistro,
  // uploadMultiple,
  download,
  replace,
  history,
  // remove,
};


// const listByRegistro = async (
//   user,
//   registroId,
//   {
//     includeHistory = false,
//   } = {}
// ) => {
//   await getUserId(user);

//   const registro =
//     await getRegistro(
//       registroId
//     );

//   const version =
//     await getCurrentVersion(
//       registro
//     );

//   return MotorConceptoRegistroArchivo.findAll({
//     where: {
//       version_id: version.id,
//       ...(includeHistory
//         ? {}
//         : {
//           activo: true,
//         }),
//     },
//     paranoid: !includeHistory,
//     include: [
//       {
//         model:
//           MotorConceptoArchivoTipo,
//         as:
//           "archivoTipo",
//         required: true,
//       },
//     ],
//     order: [
//       [
//         "archivo_tipo_id",
//         "ASC",
//       ],
//       [
//         "id",
//         "DESC",
//       ],
//     ],
//   });
// };

// const uploadMultiple = async (
//   user,
//   registroId,
//   archivoTipoId,
//   files,
//   versionId = null
// ) => {
//   const userId =
//     getUserId(user);

//   const registro =
//     await getRegistro(
//       registroId
//     );

//   let version;

//   if (versionId) {

//     version =
//       await MotorConceptoRegistroVersion.findByPk(
//         versionId
//       );

//     if (!version) {
//       throw new Error(
//         "La versión indicada no existe"
//       );
//     }

//   } else {

//     version =
//       await getCurrentVersion(
//         registro
//       );

//   }

//   const archivoTipo =
//     await getArchivoTipo(
//       archivoTipoId
//     );

//   const currentCount =
//     await MotorConceptoRegistroArchivo.count({
//       where: {
//         version_id: version.id,
//         archivo_tipo_id: archivoTipo.id,
//         activo: true,
//       },
//     });

//   const selected =
//     validateUpload({
//       archivoTipo,
//       files,
//       currentCount,
//     });

//   const created = [];

//   for (const file of selected) {

//     const drive =
//       await uploadToDrive({
//         originalName:
//           file.originalname,
//         mimeType:
//           file.mimetype,
//         localPath:
//           file.path,
//       });

//     const row =
//       await MotorConceptoRegistroArchivo.create({
//         version_id:
//           version.id,
//         archivo_tipo_id:
//           archivoTipo.id,

//         // Se mantiene siempre el mismo nombre lógico
//         // para conservar el historial.
//         nombre_logico:
//           file.originalname,

//         drive_file_id:
//           drive.fileId,

//         nombre:
//           file.originalname,

//         mime_type:
//           file.mimetype ||
//           drive.mimeType ||
//           null,

//         peso_bytes:
//           file.size ||
//           drive.size ||
//           null,

//         hash: null,

//         url:
//           drive.webViewLink ||
//           drive.webContentLink ||
//           null,

//         activo: true,

//         creado_por:
//           userId,

//         modificado_por:
//           userId,
//       });

//     created.push(row);
//   }

//   return created;
// };

// const remove = async (
//   user,
//   archivoId
// ) => {
//   const userId =
//     getUserId(user);

//   const archivo =
//     await getArchivo(
//       archivoId
//     );

//   await archivo.update({
//     activo:
//       false,
//     modificado_por:
//       userId,
//   });

//   await archivo.destroy();

//   return {
//     id:
//       archivo.id,
//     activo:
//       false,
//   };
// };


