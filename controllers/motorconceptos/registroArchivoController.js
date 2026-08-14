import registroArchivoService from "../../services/motorConceptos/registroArchivoService.js";

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
            "Ocurrió un error inesperado",
    });


// const safeFileName = (
//     value
// ) =>
//     String(
//         value ||
//         "archivo"
//     )
//         .replace(
//             /[\r\n"]/g,
//             "_"
//         );


export const download = async (req, res) => {
    try {
        const result =
            await registroArchivoService.download(
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
                await registroArchivoService.replace(
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
                await registroArchivoService.history(
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

export const listByRegistro = async (
    req,
    res
) => {
    try {
        const data =
            await registroArchivoService.listByRegistro(
                req.user,
                req.params.registroId
            );

        return ok(res, data);
    } catch (error) {
        return fail(res, error);
    }
};

export const uploadMultiple = async (
    req,
    res
) => {
    try {
        const data =
            await registroArchivoService.uploadMultiple(
                req.user,
                req.params.registroId,
                req.body,
                req.files || []
            );

        return ok(
            res,
            data,
            "Archivos cargados correctamente",
            201
        );
    } catch (error) {
        return fail(res, error);
    }
};

export const remove = async (
    req,
    res
) => {
    try {
        const data =
            await registroArchivoService.deleteLogical(
                req.user,
                req.params.archivoId
            );

        return ok(
            res,
            data,
            "Archivo eliminado correctamente"
        );
    } catch (error) {
        return fail(res, error);
    }
};

export const listByTipo = async (
    req,
    res
) => {
    try {
        const data =
            await registroArchivoService.listByTipo(
                req.user,
                req.params.registroId,
                req.params.archivoTipoId
            );

        return ok(res, data);
    } catch (error) {
        return fail(res, error);
    }
};

export const getUploadCapacity = async (
    req,
    res
) => {
    try {
        const data =
            await registroArchivoService.getUploadCapacity(
                req.user,
                req.params.registroId,
                req.params.archivoTipoId
            );

        return ok(res, data);
    } catch (error) {
        return fail(res, error);
    }
};

// export default {
//     listByRegistro,
//     listByTipo,
//     uploadMultiple,
//     remove,
//     getUploadCapacity,
// };

export default {
    download,
    replace,
    history,
    listByRegistro,
    listByTipo,
    uploadMultiple,
    remove,
    getUploadCapacity,
};