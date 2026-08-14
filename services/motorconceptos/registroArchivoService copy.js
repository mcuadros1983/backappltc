import { Op } from "sequelize";

import {
    MotorConceptoArchivoTipo,
    MotorConceptoRegistro,
    MotorConceptoRegistroArchivo,
    MotorConceptoRegistroVersion
    // ConceptoArchivoTipo,
    // RegistroConcepto,
    // RegistroConceptoArchivo,
    // RegistroConceptoVersion,
} from "../../models/index.js";

import {
    uploadToDrive,
    deleteFromDrive,
} from "../googleDriveService.js";

import {
    resolveMaxFiles,
    validateUploadFiles,
} from "../../validators/motorconceptos/registroArchivoValidator.js";

const findRegistro = async (user, registroId) => {
    const where = {
        id: registroId,
        activo: true,
    };

    if (Number(user?.rol_id) !== 1 && user?.sucursal_id) {
        where.sucursal_id = user.sucursal_id;
    }

    const registro = await MotorConceptoRegistro.findOne({
        where,
        include: [
            {
                model: MotorConceptoRegistroVersion,
                as: "version_actual",
                required: false,
            },
        ],
    });

    if (!registro) {
        throw new Error("El registro no existe o no tiene acceso");
    }

    return registro;
};

const findArchivoTipo = async (archivoTipoId) => {
    const archivoTipo = await MotorConceptoArchivoTipo.findOne({
        where: {
            id: archivoTipoId,
            activo: true,
        },
    });

    if (!archivoTipo) {
        throw new Error("El tipo de archivo no existe");
    }

    return archivoTipo;
};

const ensureVersion = async (user, registro) => {
    if (registro.version_actual_id) {
        const current = await MotorConceptoRegistroVersion.findByPk(
            registro.version_actual_id
        );

        if (current) {
            return current;
        }
    }

    const maxVersion = await MotorConceptoRegistroVersion.max("numero", {
        where: {
            registro_id: registro.id,
        },
    });

    const version = await MotorConceptoRegistroVersion.create({
        registro_id: registro.id,
        numero: Number(maxVersion || 0) + 1,
        motivo: "ARCHIVOS",
        comentario: "Carga de archivos",
        creado_por: user.id,
    });

    await registro.update({
        version_actual_id: version.id,
        ultimo_movimiento: new Date(),
        modificado_por: user.id,
    });

    return version;
};

const countActiveByType = async ({
    registroId,
    archivoTipoId,
}) =>
    MotorConceptoRegistroArchivo.count({
        where: {
            registro_id: registroId,
            archivo_tipo_id: archivoTipoId,
            activo: true,
        },
    });

const listByTipo = async (
    user,
    registroId,
    archivoTipoId
) => {
    await findRegistro(user, registroId);
    await findArchivoTipo(archivoTipoId);

    return MotorConceptoRegistroArchivo.findAll({
        where: {
            registro_id: registroId,
            archivo_tipo_id: archivoTipoId,
            activo: true,
        },
        order: [["id", "DESC"]],
    });
};



const getUploadCapacity = async (
    user,
    registroId,
    archivoTipoId
) => {
    await findRegistro(user, registroId);

    const archivoTipo = await findArchivoTipo(
        archivoTipoId
    );

    const currentCount = await countActiveByType({
        registroId,
        archivoTipoId,
    });

    const maxFiles = resolveMaxFiles(archivoTipo);

    return {
        permite_multiples:
            Boolean(archivoTipo.permite_multiples),

        maximo_archivos:
            maxFiles,

        archivos_actuales:
            currentCount,

        disponibles:
            maxFiles === null
                ? null
                : Math.max(
                    maxFiles - currentCount,
                    0
                ),
    };
};

const listByRegistro = async (user, registroId) => {
    await findRegistro(user, registroId);

    return MotorConceptoRegistroArchivo.findAll({
        where: {
            registro_id: registroId,
            activo: true,
        },
        include: [
            {
                model: MotorConceptoArchivoTipo,
                as: "archivo_tipo",
                required: true,
            },
        ],
        order: [
            ["archivo_tipo_id", "ASC"],
            ["id", "DESC"],
        ],
    });
};

const uploadMultiple = async (
    user,
    registroId,
    body,
    files
) => {
    const registro = await findRegistro(user, registroId);

    const archivoTipo = await findArchivoTipo(
        body.archivo_tipo_id
    );

    const currentCount = await countActiveByType({
        registroId,
        archivoTipoId: archivoTipo.id,
    });

    validateUploadFiles({
        archivoTipo,
        files,
        currentCount,
    });

    const version = await ensureVersion(user, registro);
    const uploaded = [];

    try {
        for (const file of files) {
            const driveResult = await uploadToDrive({
                buffer: file.buffer,
                originalName: file.originalname,
                mimeType: file.mimetype,
                folderId: archivoTipo.drive_folder_id || null,
            });

            const record = await MotorConceptoRegistroArchivo.create({
                registro_id: registro.id,
                version_id: version.id,
                archivo_tipo_id: archivoTipo.id,
                drive_file_id: driveResult.id,
                nombre: file.originalname,
                nombre_logico:
                    body.nombre_logico ||
                    file.originalname,
                mime: file.mimetype,
                peso: file.size,
                hash: driveResult.hash || null,
                url:
                    driveResult.webViewLink ||
                    driveResult.url ||
                    null,
                activo: true,
                creado_por: user.id,
                modificado_por: user.id,
            });

            uploaded.push(record);
        }

        await registro.update({
            ultimo_movimiento: new Date(),
            modificado_por: user.id,
        });

        return uploaded;
    } catch (error) {
        for (const item of uploaded) {
            try {
                await item.update({
                    activo: false,
                    modificado_por: user.id,
                });

                const references = await MotorConceptoRegistroArchivo.count({
                    where: {
                        drive_file_id: item.drive_file_id,
                        activo: true,
                        id: {
                            [Op.ne]: item.id,
                        },
                    },
                });

                if (references === 0) {
                    await deleteFromDrive(item.drive_file_id);
                }
            } catch (_) {
                // La limpieza no reemplaza el error original.
            }
        }

        throw error;
    }
};

const deleteLogical = async (
    user,
    archivoId
) => {
    const archivo = await MotorConceptoRegistroArchivo.findOne({
        where: {
            id: archivoId,
            activo: true,
        },
    });

    if (!archivo) {
        throw new Error("El archivo no existe");
    }

    const registro = await findRegistro(
        user,
        archivo.registro_id
    );

    await archivo.update({
        activo: false,
        modificado_por: user.id,
    });

    await registro.update({
        ultimo_movimiento: new Date(),
        modificado_por: user.id,
    });

    return {
        id: archivo.id,
        activo: false,
    };
};

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
    listByRegistro,
    listByTipo,
    uploadMultiple,
    deleteLogical,
    getUploadCapacity,
    download,
    replace,
    history,

};
