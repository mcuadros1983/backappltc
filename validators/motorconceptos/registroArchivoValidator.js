const DEFAULT_MAX_FILES = 1;
const DEFAULT_MAX_SIZE_MB = 10;

export const normalizeExtensions = (
    value
) => {

    if (
        !value
    ) {
        return [];
    }

    const extensions =
        Array.isArray(
            value
        )
            ? value
            : String(value)
                .split(",");

    return extensions
        .map(
            (extension) =>
                String(extension)
                    .trim()
                    .toLowerCase()
                    .replace(
                        /^\./,
                        ""
                    )
        )
        .filter(
            Boolean
        );

};

const getExtension = (fileName = "") => {
    const parts = String(fileName).toLowerCase().split(".");
    return parts.length > 1 ? parts.pop() : "";
};

export const resolveMaxFiles = (archivoTipo) => {
    if (!archivoTipo?.permite_multiples) {
        return DEFAULT_MAX_FILES;
    }

    const configured = Number(archivoTipo.maximo_archivos);

    return Number.isInteger(configured) && configured > 0
        ? configured
        : null;
};

export const validateUploadFiles = ({
    archivoTipo,
    files = [],
    currentCount = 0,
}) => {
    if (!archivoTipo) {
        throw new Error("El tipo de archivo no existe");
    }

    if (!archivoTipo.activo) {
        throw new Error("El tipo de archivo no está activo");
    }

    if (!Array.isArray(files) || files.length === 0) {
        throw new Error("Debe seleccionar al menos un archivo");
    }

    const maxFiles = resolveMaxFiles(archivoTipo);

    if (
        maxFiles !== null &&
        currentCount + files.length > maxFiles
    ) {
        throw new Error(
            `El tipo de archivo permite un máximo de ${maxFiles} archivo(s)`
        );
    }

    const maxSizeMb = Number(
        archivoTipo.peso_maximo_mb || DEFAULT_MAX_SIZE_MB
    );

    const maxSizeBytes = maxSizeMb * 1024 * 1024;

    const allowedExtensions = normalizeExtensions(
        archivoTipo.extensiones_permitidas
    );

    files.forEach((file) => {
        if (!file?.originalname) {
            throw new Error("Se recibió un archivo sin nombre");
        }

        if (!file.buffer) {
            throw new Error(`No se recibió el contenido de ${file.originalname}`);
        }

        if (file.size > maxSizeBytes) {
            throw new Error(
                `${file.originalname} supera el tamaño máximo de ${maxSizeMb} MB`
            );
        }

        const extension = getExtension(file.originalname);

        console.log(
            "========== VALIDACIÓN ARCHIVO =========="
        );

        console.log(
            "archivo:",
            file.originalname
        );

        console.log(
            "extensión detectada:",
            extension
        );

        console.log(
            "extensiones configuradas:",
            archivoTipo.extensiones_permitidas
        );

        console.log(
            "extensiones normalizadas:",
            allowedExtensions
        );

        console.log(
            "incluye extensión:",
            allowedExtensions.includes(
                extension
            )
        );

        console.log(
            "========================================"
        );

        if (
            allowedExtensions.length > 0 &&
            !allowedExtensions.includes(extension)
        ) {
            throw new Error(
                `${file.originalname} no tiene una extensión permitida`
            );
        }
    });

    return true;
};

export const validateArchivoOwnership = ({
    archivo,
    registro,
}) => {
    if (!archivo) {
        throw new Error("El archivo no existe");
    }

    if (!registro) {
        throw new Error("El registro no existe");
    }

    if (Number(archivo.registro_id) !== Number(registro.id)) {
        throw new Error("El archivo no pertenece al registro indicado");
    }

    return true;
};

export default {
    resolveMaxFiles,
    validateUploadFiles,
    validateArchivoOwnership,
};
