import ExcelJS from "exceljs";

import {
    Op,
} from "sequelize";

import {
    sequelize,
} from "../../config/database.js";

import {
    MotorConcepto,
    MotorConceptoEntidadTipo,
    MotorConceptoEntidad,
    MotorConceptoCampo,
    MotorConceptoArchivoTipo,
} from "../../models/motorconceptos/index.js";


const MODOS_CAPTURA = [
    "SOLO_DATOS",
    "SOLO_ARCHIVOS",
    "DATOS_Y_ARCHIVOS",
];


const TIPOS_CAMPO = [
    "TEXT",
    "TEXTAREA",
    "INTEGER",
    "DECIMAL",
    "BOOLEAN",
    "DATE",
    "DATETIME",
    "TIME",
    "EMAIL",
    "PHONE",
    "URL",
    "COLOR",
    "PASSWORD",
    "JSON",
    "LISTA",
    "RELACION",
    "IMAGEN",
    "FIRMA",
    "COORDENADAS",
];


const REQUIRED_SHEETS = [
    "CONCEPTOS",
    "ARCHIVOS",
    "CAMPOS",
];


const CONCEPT_HEADERS = [
    "codigo",
    "nombre",
    "descripcion",
    "modo_captura",
    "entidad_tipo",
    "obligatorio",
    "permite_multiples",
    "usa_versiones",
    "usa_vencimiento",
    "dias_alerta_vencimiento",
    "activo",
];


const FILE_HEADERS = [
    "concepto_codigo",
    "codigo",
    "nombre",
    "descripcion",
    "obligatorio",
    "permite_multiples",
    "extensiones_permitidas",
    "mime_types_permitidos",
    "tamanio_maximo_mb",
    "maximo_archivos",
    "orden",
    "activo",
];


const FIELD_HEADERS = [
    "concepto_codigo",
    "codigo",
    "etiqueta",
    "tipo",
    "obligatorio",
    "orden",
    "ancho",
    "placeholder",
    "ayuda",
    "solo_lectura",
    "visible",
    "valor_defecto",
    "activo",
];


const error = (
    message,
    status = 400
) => {

    const instance =
        new Error(message);

    instance.status =
        status;

    return instance;
};


const assertUser = (
    user
) => {

    if (!user?.id) {

        throw error(
            "Usuario autenticado requerido",
            401
        );

    }

};


const normalizeCode = (
    value
) => {

    return String(
        value ?? ""
    )
        .trim()
        .toUpperCase()
        .replace(
            /\s+/g,
            "_"
        )
        .replace(
            /[^A-Z0-9_]/g,
            ""
        );

};


const normalizeText = (
    value
) => {

    if (
        value === null ||
        value === undefined
    ) {
        return "";
    }


    if (
        typeof value === "object" &&
        value.text !== undefined
    ) {

        return String(
            value.text
        ).trim();

    }


    if (
        typeof value === "object" &&
        Array.isArray(
            value.richText
        )
    ) {

        return value.richText
            .map(
                (item) =>
                    item.text || ""
            )
            .join("")
            .trim();

    }


    if (
        typeof value === "object" &&
        value.result !== undefined
    ) {

        return String(
            value.result ?? ""
        ).trim();

    }


    return String(
        value
    ).trim();

};


const nullableText = (
    value
) => {

    const normalized =
        normalizeText(
            value
        );

    return normalized || null;

};


const parseBoolean = (
    value,
    {
        required = false,
        fallback = false,
    } = {}
) => {

    if (
        typeof value ===
        "boolean"
    ) {

        return {
            valid: true,
            value,
        };

    }


    const normalized =
        normalizeText(
            value
        ).toUpperCase();


    if (
        [
            "SI",
            "SÍ",
            "TRUE",
            "1",
        ].includes(
            normalized
        )
    ) {

        return {
            valid: true,
            value: true,
        };

    }


    if (
        [
            "NO",
            "FALSE",
            "0",
        ].includes(
            normalized
        )
    ) {

        return {
            valid: true,
            value: false,
        };

    }


    if (!normalized) {

        if (required) {

            return {
                valid: false,
                value: fallback,
            };

        }


        return {
            valid: true,
            value: fallback,
        };

    }


    return {
        valid: false,
        value: fallback,
    };

};


const parseNullableInteger = (
    value
) => {

    const raw =
        normalizeText(
            value
        );


    if (!raw) {

        return {
            valid: true,
            value: null,
        };

    }


    const number =
        Number(raw);


    if (
        !Number.isInteger(
            number
        )
    ) {

        return {
            valid: false,
            value: null,
        };

    }


    return {
        valid: true,
        value: number,
    };

};


const parseInteger = (
    value,
    fallback = 0
) => {

    const raw =
        normalizeText(
            value
        );


    if (!raw) {

        return {
            valid: true,
            value: fallback,
        };

    }


    const number =
        Number(raw);


    if (
        !Number.isInteger(
            number
        )
    ) {

        return {
            valid: false,
            value: fallback,
        };

    }


    return {
        valid: true,
        value: number,
    };

};


const parseCsv = (
    value
) => {

    return normalizeText(
        value
    )
        .split(",")
        .map(
            (item) =>
                item.trim()
        )
        .filter(Boolean);

};


const getDeletedAt = (
    instance
) => {

    if (!instance) {
        return null;
    }


    if (
        typeof instance.get ===
        "function"
    ) {

        return (
            instance.get(
                "deletedAt"
            ) ||
            instance.get(
                "deleted_at"
            ) ||
            null
        );

    }


    return (
        instance.deletedAt ||
        instance.deleted_at ||
        null
    );

};


const isDeleted = (
    instance
) => {

    return Boolean(
        getDeletedAt(
            instance
        )
    );

};


const addError = (
    errors,
    {
        sheet,
        row,
        field,
        codigo = null,
        message,
    }
) => {

    errors.push({
        hoja: sheet,
        fila: row,
        campo: field,
        codigo,
        mensaje: message,
    });

};


const normalizeHeader = (
    value
) => {

    return normalizeText(
        value
    )
        .toLowerCase()
        .replace(
            /\s+/g,
            "_"
        );

};


const readSheet = (
    worksheet
) => {

    const headers =
        new Map();


    worksheet
        .getRow(1)
        .eachCell(
            {
                includeEmpty: false,
            },
            (
                cell,
                columnNumber
            ) => {

                const header =
                    normalizeHeader(
                        cell.value
                    );


                if (header) {

                    headers.set(
                        header,
                        columnNumber
                    );

                }

            }
        );


    const rows = [];


    for (
        let rowNumber = 2;
        rowNumber <=
        worksheet.rowCount;
        rowNumber += 1
    ) {

        const row =
            worksheet.getRow(
                rowNumber
            );


        const hasValue =
            [
                ...headers.values(),
            ].some(
                (column) =>
                    normalizeText(
                        row.getCell(
                            column
                        ).value
                    ) !== ""
            );


        if (!hasValue) {
            continue;
        }


        const item = {
            fila: rowNumber,
        };


        for (
            const [
                header,
                column,
            ] of headers.entries()
        ) {

            item[header] =
                row.getCell(
                    column
                ).value;

        }


        rows.push(
            item
        );

    }


    return {
        headers,
        rows,
    };

};


const validateHeaders = (
    parsed,
    requiredHeaders,
    sheetName,
    errors
) => {

    requiredHeaders.forEach(
        (header) => {

            if (
                !parsed.headers.has(
                    header
                )
            ) {

                addError(
                    errors,
                    {
                        sheet:
                            sheetName,
                        row: 1,
                        field:
                            header,
                        message:
                            `Falta la columna obligatoria "${header}"`,
                    }
                );

            }

        }
    );

};


const loadWorkbook = async (
    file
) => {

    if (!file?.buffer) {

        throw error(
            "Debe seleccionar un archivo Excel"
        );

    }


    const workbook =
        new ExcelJS.Workbook();


    try {

        await workbook.xlsx.load(
            file.buffer
        );

    } catch (e) {

        throw error(
            "No se pudo leer el archivo Excel"
        );

    }


    REQUIRED_SHEETS.forEach(
        (sheetName) => {

            if (
                !workbook.getWorksheet(
                    sheetName
                )
            ) {

                throw error(
                    `Falta la hoja ${sheetName}`
                );

            }

        }
    );


    return workbook;
};


const parseConceptRows = (
    parsedSheet,
    errors
) => {

    const conceptos = [];


    for (
        const row of
        parsedSheet.rows
    ) {

        const codigo =
            normalizeCode(
                row.codigo
            );

        const nombre =
            normalizeText(
                row.nombre
            );

        const modoCaptura =
            normalizeText(
                row.modo_captura
            ).toUpperCase();

        /*
         * entidad_tipo es opcional.
         *
         * Nuevo concepto:
         * vacío = sin relación.
         *
         * Concepto existente:
         * vacío = preservar relación
         * actual.
         */
        const entidadTipo =
            normalizeCode(
                row.entidad_tipo
            );


        const obligatorio =
            parseBoolean(
                row.obligatorio,
                {
                    required: true,
                }
            );

        const permiteMultiples =
            parseBoolean(
                row.permite_multiples,
                {
                    required: true,
                }
            );

        const usaVersiones =
            parseBoolean(
                row.usa_versiones,
                {
                    required: true,
                    fallback: true,
                }
            );

        const usaVencimiento =
            parseBoolean(
                row.usa_vencimiento,
                {
                    required: true,
                }
            );

        const activo =
            parseBoolean(
                row.activo,
                {
                    required: true,
                    fallback: true,
                }
            );

        const diasAlerta =
            parseNullableInteger(
                row.dias_alerta_vencimiento
            );


        if (!codigo) {

            addError(
                errors,
                {
                    sheet:
                        "CONCEPTOS",
                    row:
                        row.fila,
                    field:
                        "codigo",
                    message:
                        "El código es obligatorio",
                }
            );

        }


        if (!nombre) {

            addError(
                errors,
                {
                    sheet:
                        "CONCEPTOS",
                    row:
                        row.fila,
                    field:
                        "nombre",
                    codigo,
                    message:
                        "El nombre es obligatorio",
                }
            );

        }


        if (
            !MODOS_CAPTURA.includes(
                modoCaptura
            )
        ) {

            addError(
                errors,
                {
                    sheet:
                        "CONCEPTOS",
                    row:
                        row.fila,
                    field:
                        "modo_captura",
                    codigo,
                    message:
                        "Modo de captura inválido",
                }
            );

        }


        [
            [
                "obligatorio",
                obligatorio,
            ],
            [
                "permite_multiples",
                permiteMultiples,
            ],
            [
                "usa_versiones",
                usaVersiones,
            ],
            [
                "usa_vencimiento",
                usaVencimiento,
            ],
            [
                "activo",
                activo,
            ],
        ].forEach(
            ([
                field,
                result,
            ]) => {

                if (
                    !result.valid
                ) {

                    addError(
                        errors,
                        {
                            sheet:
                                "CONCEPTOS",
                            row:
                                row.fila,
                            field,
                            codigo,
                            message:
                                "Debe indicar SI o NO",
                        }
                    );

                }

            }
        );


        if (
            !diasAlerta.valid ||
            (
                diasAlerta.value !==
                null &&
                diasAlerta.value < 0
            )
        ) {

            addError(
                errors,
                {
                    sheet:
                        "CONCEPTOS",
                    row:
                        row.fila,
                    field:
                        "dias_alerta_vencimiento",
                    codigo,
                    message:
                        "Debe ser un entero mayor o igual a 0",
                }
            );

        }


        if (
            usaVencimiento.valid &&
            !usaVencimiento.value &&
            diasAlerta.value !==
            null
        ) {

            addError(
                errors,
                {
                    sheet:
                        "CONCEPTOS",
                    row:
                        row.fila,
                    field:
                        "dias_alerta_vencimiento",
                    codigo,
                    message:
                        "Debe quedar vacío cuando usa_vencimiento es NO",
                }
            );

        }


        conceptos.push({
            fila:
                row.fila,

            codigo,

            nombre,

            descripcion:
                nullableText(
                    row.descripcion
                ),

            modo_captura:
                modoCaptura,

            entidad_tipo:
                entidadTipo || null,

            obligatorio:
                obligatorio.value,

            permite_multiples:
                permiteMultiples.value,

            usa_versiones:
                usaVersiones.value,

            usa_vencimiento:
                usaVencimiento.value,

            dias_alerta_vencimiento:
                diasAlerta.value,

            activo:
                activo.value,
        });

    }


    const seen =
        new Set();


    conceptos.forEach(
        (item) => {

            if (
                !item.codigo
            ) {
                return;
            }


            if (
                seen.has(
                    item.codigo
                )
            ) {

                addError(
                    errors,
                    {
                        sheet:
                            "CONCEPTOS",
                        row:
                            item.fila,
                        field:
                            "codigo",
                        codigo:
                            item.codigo,
                        message:
                            "Código de concepto duplicado dentro del Excel",
                    }
                );

            }


            seen.add(
                item.codigo
            );

        }
    );


    return conceptos;
};


const parseFileRows = (
    parsedSheet,
    conceptCodes,
    errors
) => {

    const archivos = [];

    const seen =
        new Set();


    for (
        const row of
        parsedSheet.rows
    ) {

        const conceptoCodigo =
            normalizeCode(
                row.concepto_codigo
            );

        const codigo =
            normalizeCode(
                row.codigo
            );

        const nombre =
            normalizeText(
                row.nombre
            );

        const obligatorio =
            parseBoolean(
                row.obligatorio,
                {
                    required: true,
                }
            );

        const permiteMultiples =
            parseBoolean(
                row.permite_multiples,
                {
                    required: true,
                }
            );

        const activo =
            parseBoolean(
                row.activo,
                {
                    required: true,
                    fallback: true,
                }
            );

        const tamanio =
            parseNullableInteger(
                row.tamanio_maximo_mb
            );

        const maximo =
            parseNullableInteger(
                row.maximo_archivos
            );

        const orden =
            parseInteger(
                row.orden,
                0
            );


        if (
            !conceptoCodigo ||
            !conceptCodes.has(
                conceptoCodigo
            )
        ) {

            addError(
                errors,
                {
                    sheet:
                        "ARCHIVOS",
                    row:
                        row.fila,
                    field:
                        "concepto_codigo",
                    codigo:
                        codigo || null,
                    message:
                        `El concepto ${conceptoCodigo || "(vacío)"} no existe en la hoja CONCEPTOS`,
                }
            );

        }


        if (!codigo) {

            addError(
                errors,
                {
                    sheet:
                        "ARCHIVOS",
                    row:
                        row.fila,
                    field:
                        "codigo",
                    codigo:
                        conceptoCodigo,
                    message:
                        "El código del tipo de archivo es obligatorio",
                }
            );

        }


        if (!nombre) {

            addError(
                errors,
                {
                    sheet:
                        "ARCHIVOS",
                    row:
                        row.fila,
                    field:
                        "nombre",
                    codigo:
                        conceptoCodigo,
                    message:
                        "El nombre del tipo de archivo es obligatorio",
                }
            );

        }


        [
            [
                "obligatorio",
                obligatorio,
            ],
            [
                "permite_multiples",
                permiteMultiples,
            ],
            [
                "activo",
                activo,
            ],
        ].forEach(
            ([
                field,
                result,
            ]) => {

                if (
                    !result.valid
                ) {

                    addError(
                        errors,
                        {
                            sheet:
                                "ARCHIVOS",
                            row:
                                row.fila,
                            field,
                            codigo:
                                conceptoCodigo,
                            message:
                                "Debe indicar SI o NO",
                        }
                    );

                }

            }
        );


        if (
            !tamanio.valid ||
            (
                tamanio.value !==
                null &&
                tamanio.value < 1
            )
        ) {

            addError(
                errors,
                {
                    sheet:
                        "ARCHIVOS",
                    row:
                        row.fila,
                    field:
                        "tamanio_maximo_mb",
                    codigo:
                        conceptoCodigo,
                    message:
                        "Debe ser un entero mayor o igual a 1",
                }
            );

        }


        if (
            !maximo.valid ||
            (
                maximo.value !==
                null &&
                maximo.value < 1
            )
        ) {

            addError(
                errors,
                {
                    sheet:
                        "ARCHIVOS",
                    row:
                        row.fila,
                    field:
                        "maximo_archivos",
                    codigo:
                        conceptoCodigo,
                    message:
                        "Debe ser un entero mayor o igual a 1",
                }
            );

        }


        if (
            !orden.valid ||
            orden.value < 0
        ) {

            addError(
                errors,
                {
                    sheet:
                        "ARCHIVOS",
                    row:
                        row.fila,
                    field:
                        "orden",
                    codigo:
                        conceptoCodigo,
                    message:
                        "Debe ser un entero mayor o igual a 0",
                }
            );

        }


        if (
            permiteMultiples.valid &&
            !permiteMultiples.value &&
            maximo.value !== null &&
            maximo.value > 1
        ) {

            addError(
                errors,
                {
                    sheet:
                        "ARCHIVOS",
                    row:
                        row.fila,
                    field:
                        "maximo_archivos",
                    codigo:
                        conceptoCodigo,
                    message:
                        "No puede ser mayor a 1 cuando permite_multiples es NO",
                }
            );

        }


        const key =
            `${conceptoCodigo}::${codigo}`;


        if (
            seen.has(
                key
            )
        ) {

            addError(
                errors,
                {
                    sheet:
                        "ARCHIVOS",
                    row:
                        row.fila,
                    field:
                        "codigo",
                    codigo:
                        conceptoCodigo,
                    message:
                        "Tipo de archivo duplicado para el concepto dentro del Excel",
                }
            );

        }


        seen.add(
            key
        );


        archivos.push({
            fila:
                row.fila,

            concepto_codigo:
                conceptoCodigo,

            codigo,

            nombre,

            descripcion:
                nullableText(
                    row.descripcion
                ),

            obligatorio:
                obligatorio.value,

            permite_multiples:
                permiteMultiples.value,

            extensiones_permitidas:
                parseCsv(
                    row.extensiones_permitidas
                ),

            mime_types_permitidos:
                parseCsv(
                    row.mime_types_permitidos
                ),

            tamanio_maximo_mb:
                tamanio.value,

            maximo_archivos:
                maximo.value,

            orden:
                orden.value,

            activo:
                activo.value,
        });

    }


    return archivos;
};


const parseFieldRows = (
    parsedSheet,
    conceptCodes,
    errors
) => {

    const campos = [];

    const seen =
        new Set();


    for (
        const row of
        parsedSheet.rows
    ) {

        const conceptoCodigo =
            normalizeCode(
                row.concepto_codigo
            );

        const codigo =
            normalizeCode(
                row.codigo
            );

        const etiqueta =
            normalizeText(
                row.etiqueta
            );

        const tipo =
            normalizeText(
                row.tipo
            ).toUpperCase();

        const obligatorio =
            parseBoolean(
                row.obligatorio,
                {
                    required: true,
                }
            );

        const soloLectura =
            parseBoolean(
                row.solo_lectura,
                {
                    required: true,
                }
            );

        const visible =
            parseBoolean(
                row.visible,
                {
                    required: true,
                    fallback: true,
                }
            );

        const activo =
            parseBoolean(
                row.activo,
                {
                    required: true,
                    fallback: true,
                }
            );

        const orden =
            parseInteger(
                row.orden,
                0
            );

        const ancho =
            parseInteger(
                row.ancho,
                12
            );


        if (
            !conceptoCodigo ||
            !conceptCodes.has(
                conceptoCodigo
            )
        ) {

            addError(
                errors,
                {
                    sheet:
                        "CAMPOS",
                    row:
                        row.fila,
                    field:
                        "concepto_codigo",
                    codigo:
                        codigo || null,
                    message:
                        `El concepto ${conceptoCodigo || "(vacío)"} no existe en la hoja CONCEPTOS`,
                }
            );

        }


        if (!codigo) {

            addError(
                errors,
                {
                    sheet:
                        "CAMPOS",
                    row:
                        row.fila,
                    field:
                        "codigo",
                    codigo:
                        conceptoCodigo,
                    message:
                        "El código del campo es obligatorio",
                }
            );

        }


        if (!etiqueta) {

            addError(
                errors,
                {
                    sheet:
                        "CAMPOS",
                    row:
                        row.fila,
                    field:
                        "etiqueta",
                    codigo:
                        conceptoCodigo,
                    message:
                        "La etiqueta es obligatoria",
                }
            );

        }


        if (
            !TIPOS_CAMPO.includes(
                tipo
            )
        ) {

            addError(
                errors,
                {
                    sheet:
                        "CAMPOS",
                    row:
                        row.fila,
                    field:
                        "tipo",
                    codigo:
                        conceptoCodigo,
                    message:
                        "Tipo de campo inválido",
                }
            );

        }


        /*
         * LISTA queda fuera de la
         * importación V1.
         *
         * El Business existente crea
         * MotorConceptoLista y sus
         * items. La plantilla actual
         * no tiene esa estructura.
         *
         * No creamos un campo LISTA
         * incompleto.
         */
        if (
            tipo === "LISTA"
        ) {

            addError(
                errors,
                {
                    sheet:
                        "CAMPOS",
                    row:
                        row.fila,
                    field:
                        "tipo",
                    codigo:
                        conceptoCodigo,
                    message:
                        "Los campos LISTA no están soportados por la importación Excel V1",
                }
            );

        }


        [
            [
                "obligatorio",
                obligatorio,
            ],
            [
                "solo_lectura",
                soloLectura,
            ],
            [
                "visible",
                visible,
            ],
            [
                "activo",
                activo,
            ],
        ].forEach(
            ([
                field,
                result,
            ]) => {

                if (
                    !result.valid
                ) {

                    addError(
                        errors,
                        {
                            sheet:
                                "CAMPOS",
                            row:
                                row.fila,
                            field,
                            codigo:
                                conceptoCodigo,
                            message:
                                "Debe indicar SI o NO",
                        }
                    );

                }

            }
        );


        if (
            !orden.valid ||
            orden.value < 0
        ) {

            addError(
                errors,
                {
                    sheet:
                        "CAMPOS",
                    row:
                        row.fila,
                    field:
                        "orden",
                    codigo:
                        conceptoCodigo,
                    message:
                        "Debe ser un entero mayor o igual a 0",
                }
            );

        }


        if (
            !ancho.valid ||
            ancho.value < 1 ||
            ancho.value > 12
        ) {

            addError(
                errors,
                {
                    sheet:
                        "CAMPOS",
                    row:
                        row.fila,
                    field:
                        "ancho",
                    codigo:
                        conceptoCodigo,
                    message:
                        "Debe ser un entero entre 1 y 12",
                }
            );

        }


        const key =
            `${conceptoCodigo}::${codigo}`;


        if (
            seen.has(
                key
            )
        ) {

            addError(
                errors,
                {
                    sheet:
                        "CAMPOS",
                    row:
                        row.fila,
                    field:
                        "codigo",
                    codigo:
                        conceptoCodigo,
                    message:
                        "Campo duplicado para el concepto dentro del Excel",
                }
            );

        }


        seen.add(
            key
        );


        campos.push({
            fila:
                row.fila,

            concepto_codigo:
                conceptoCodigo,

            codigo,

            etiqueta,

            tipo,

            obligatorio:
                obligatorio.value,

            orden:
                orden.value,

            ancho:
                ancho.value,

            placeholder:
                nullableText(
                    row.placeholder
                ),

            ayuda:
                nullableText(
                    row.ayuda
                ),

            solo_lectura:
                soloLectura.value,

            visible:
                visible.value,

            valor_defecto:
                nullableText(
                    row.valor_defecto
                ),

            activo:
                activo.value,
        });

    }


    return campos;
};


const parseWorkbook = async (
    file
) => {

    const workbook =
        await loadWorkbook(
            file
        );


    const errors = [];


    const conceptSheet =
        readSheet(
            workbook.getWorksheet(
                "CONCEPTOS"
            )
        );

    const fileSheet =
        readSheet(
            workbook.getWorksheet(
                "ARCHIVOS"
            )
        );

    const fieldSheet =
        readSheet(
            workbook.getWorksheet(
                "CAMPOS"
            )
        );


    validateHeaders(
        conceptSheet,
        CONCEPT_HEADERS,
        "CONCEPTOS",
        errors
    );

    validateHeaders(
        fileSheet,
        FILE_HEADERS,
        "ARCHIVOS",
        errors
    );

    validateHeaders(
        fieldSheet,
        FIELD_HEADERS,
        "CAMPOS",
        errors
    );


    /*
     * Si faltan encabezados, evitamos
     * continuar interpretando datos
     * con una estructura inválida.
     */
    if (
        errors.some(
            (item) =>
                item.fila === 1
        )
    ) {

        return {
            conceptos: [],
            archivos: [],
            campos: [],
            errors,
        };

    }


    const conceptos =
        parseConceptRows(
            conceptSheet,
            errors
        );


    const conceptCodes =
        new Set(
            conceptos
                .map(
                    (item) =>
                        item.codigo
                )
                .filter(Boolean)
        );


    const archivos =
        parseFileRows(
            fileSheet,
            conceptCodes,
            errors
        );


    const campos =
        parseFieldRows(
            fieldSheet,
            conceptCodes,
            errors
        );


    return {
        conceptos,
        archivos,
        campos,
        errors,
    };

};


const getDatabaseContext =
    async (
        parsed,
        transaction = null
    ) => {

        const entityCodes = [
            ...new Set(
                parsed.conceptos
                    .map(
                        (item) =>
                            item.entidad_tipo
                    )
                    .filter(Boolean)
            ),
        ];


        const conceptCodes = [
            ...new Set(
                parsed.conceptos
                    .map(
                        (item) =>
                            item.codigo
                    )
                    .filter(Boolean)
            ),
        ];


        const entityTypes =
            entityCodes.length
                ? await MotorConceptoEntidadTipo.findAll({
                    where: {
                        codigo: {
                            [Op.in]:
                                entityCodes,
                        },
                        activo: true,
                    },
                    transaction,
                })
                : [];


        const existingConcepts =
            conceptCodes.length
                ? await MotorConcepto.findAll({
                    where: {
                        codigo: {
                            [Op.in]:
                                conceptCodes,
                        },
                    },
                    paranoid: false,
                    transaction,
                })
                : [];


        return {

            entityTypeMap:
                new Map(
                    entityTypes.map(
                        (item) => [
                            item.codigo,
                            item,
                        ]
                    )
                ),

            conceptMap:
                new Map(
                    existingConcepts.map(
                        (item) => [
                            item.codigo,
                            item,
                        ]
                    )
                ),

        };

    };


const validateExistingChildren =
    async (
        parsed,
        context,
        errors
    ) => {

        const existingConcepts =
            [
                ...context
                    .conceptMap
                    .values(),
            ]
                .filter(
                    (item) =>
                        !isDeleted(
                            item
                        )
                );


        if (
            existingConcepts.length === 0
        ) {
            return;
        }


        const conceptIds =
            existingConcepts.map(
                (item) =>
                    item.id
            );


        const [
            existingFields,
            existingFiles,
        ] = await Promise.all([

            MotorConceptoCampo.findAll({
                where: {
                    concepto_id: {
                        [Op.in]:
                            conceptIds,
                    },
                },
                paranoid: false,
            }),

            MotorConceptoArchivoTipo.findAll({
                where: {
                    concepto_id: {
                        [Op.in]:
                            conceptIds,
                    },
                },
                paranoid: false,
            }),

        ]);


        const conceptById =
            new Map(
                existingConcepts.map(
                    (item) => [
                        Number(
                            item.id
                        ),
                        item,
                    ]
                )
            );


        const fieldMap =
            new Map();


        existingFields.forEach(
            (item) => {

                const concept =
                    conceptById.get(
                        Number(
                            item.concepto_id
                        )
                    );


                if (!concept) {
                    return;
                }


                fieldMap.set(
                    `${concept.codigo}::${item.codigo}`,
                    item
                );

            }
        );


        const fileMap =
            new Map();


        existingFiles.forEach(
            (item) => {

                const concept =
                    conceptById.get(
                        Number(
                            item.concepto_id
                        )
                    );


                if (!concept) {
                    return;
                }


                fileMap.set(
                    `${concept.codigo}::${item.codigo}`,
                    item
                );

            }
        );


        parsed.campos.forEach(
            (item) => {

                const existing =
                    fieldMap.get(
                        `${item.concepto_codigo}::${item.codigo}`
                    );


                if (
                    existing &&
                    isDeleted(
                        existing
                    )
                ) {

                    addError(
                        errors,
                        {
                            sheet:
                                "CAMPOS",
                            row:
                                item.fila,
                            field:
                                "codigo",
                            codigo:
                                item.concepto_codigo,
                            message:
                                `El campo ${item.codigo} existe pero está eliminado lógicamente`,
                        }
                    );

                }

            }
        );


        parsed.archivos.forEach(
            (item) => {

                const existing =
                    fileMap.get(
                        `${item.concepto_codigo}::${item.codigo}`
                    );


                if (
                    existing &&
                    isDeleted(
                        existing
                    )
                ) {

                    addError(
                        errors,
                        {
                            sheet:
                                "ARCHIVOS",
                            row:
                                item.fila,
                            field:
                                "codigo",
                            codigo:
                                item.concepto_codigo,
                            message:
                                `El tipo de archivo ${item.codigo} existe pero está eliminado lógicamente`,
                        }
                    );

                }

            }
        );

    };


const buildValidation =
    async (
        parsed
    ) => {

        const errors = [
            ...parsed.errors,
        ];


        const context =
            await getDatabaseContext(
                parsed
            );


        parsed.conceptos.forEach(
            (item) => {

                /*
                 * entidad_tipo vacío
                 * es válido.
                 */
                if (
                    item.entidad_tipo &&
                    !context.entityTypeMap.has(
                        item.entidad_tipo
                    )
                ) {

                    addError(
                        errors,
                        {
                            sheet:
                                "CONCEPTOS",
                            row:
                                item.fila,
                            field:
                                "entidad_tipo",
                            codigo:
                                item.codigo,
                            message:
                                `El tipo de entidad ${item.entidad_tipo} no existe o está inactivo`,
                        }
                    );

                }

            }
        );


        await validateExistingChildren(
            parsed,
            context,
            errors
        );


        const conceptos =
            parsed.conceptos.map(
                (item) => {

                    const existing =
                        context
                            .conceptMap
                            .get(
                                item.codigo
                            );


                    if (!existing) {

                        return {
                            codigo:
                                item.codigo,
                            nombre:
                                item.nombre,
                            entidad_tipo:
                                item.entidad_tipo,
                            estado:
                                "NUEVO",
                            accion_default:
                                "CREAR",
                        };

                    }


                    if (
                        isDeleted(
                            existing
                        )
                    ) {

                        return {
                            codigo:
                                item.codigo,
                            nombre:
                                item.nombre,
                            entidad_tipo:
                                item.entidad_tipo,
                            estado:
                                "ELIMINADO",
                            accion_default:
                                "OMITIR",
                        };

                    }


                    return {
                        codigo:
                            item.codigo,
                        nombre:
                            item.nombre,
                        entidad_tipo:
                            item.entidad_tipo,
                        estado:
                            "EXISTENTE",
                        accion_default:
                            "OMITIR",
                    };

                }
            );


        return {

            valido:
                errors.length === 0,

            resumen: {

                conceptos:
                    conceptos.length,

                nuevos:
                    conceptos.filter(
                        (item) =>
                            item.estado ===
                            "NUEVO"
                    ).length,

                existentes:
                    conceptos.filter(
                        (item) =>
                            item.estado ===
                            "EXISTENTE"
                    ).length,

                eliminados:
                    conceptos.filter(
                        (item) =>
                            item.estado ===
                            "ELIMINADO"
                    ).length,

                errores:
                    errors.length,

            },

            conceptos,

            errores:
                errors,

        };

    };


const normalizeActions = (
    rawActions
) => {

    if (!rawActions) {
        return {};
    }


    if (
        typeof rawActions ===
        "object"
    ) {
        return rawActions;
    }


    try {

        const parsed =
            JSON.parse(
                rawActions
            );


        if (
            !parsed ||
            Array.isArray(
                parsed
            ) ||
            typeof parsed !==
            "object"
        ) {

            throw new Error();

        }


        return parsed;

    } catch (e) {

        throw error(
            "El formato de acciones es inválido"
        );

    }

};


const resolveAction = (
    item,
    existing,
    actions
) => {

    if (!existing) {
        return "CREAR";
    }


    if (
        isDeleted(
            existing
        )
    ) {
        return "OMITIR";
    }


    const requested =
        normalizeText(
            actions[
            item.codigo
            ]
        ).toUpperCase();


    if (
        !requested ||
        requested ===
        "OMITIR"
    ) {
        return "OMITIR";
    }


    if (
        requested ===
        "ACTUALIZAR"
    ) {
        return "ACTUALIZAR";
    }


    throw error(
        `Acción inválida para el concepto ${item.codigo}`
    );

};


const syncEntity = async (
    concepto,
    item,
    entityType,
    transaction
) => {

    /*
     * Si la columna entidad_tipo está
     * vacía:
     *
     * - Nuevo concepto: queda sin
     *   relación.
     *
     * - Existente: se preserva la
     *   relación actual.
     */
    if (!entityType) {
        return;
    }


    const relations =
        await MotorConceptoEntidad.findAll({
            where: {
                concepto_id:
                    concepto.id,
            },
            paranoid: false,
            transaction,
        });


    const target =
        relations.find(
            (relation) =>
                Number(
                    relation
                        .entidad_tipo_id
                ) ===
                Number(
                    entityType.id
                )
        );


    const activeRelations =
        relations.filter(
            (relation) =>
                !isDeleted(
                    relation
                )
        );


    /*
     * El modelo actual permite
     * solamente una entidad por
     * concepto.
     *
     * Desactivamos lógicamente las
     * relaciones activas diferentes
     * de la seleccionada.
     *
     * Nunca force:true.
     */
    for (
        const relation of
        activeRelations
    ) {

        if (
            Number(
                relation
                    .entidad_tipo_id
            ) ===
            Number(
                entityType.id
            )
        ) {
            continue;
        }


        if (
            relation.activo !==
            false
        ) {

            await relation.update(
                {
                    activo: false,
                },
                {
                    transaction,
                }
            );

        }


        await relation.destroy({
            transaction,
        });

    }


    if (target) {

        if (
            isDeleted(
                target
            )
        ) {

            await target.restore({
                transaction,
            });

        }


        await target.update(
            {
                obligatorio:
                    item.obligatorio,

                activo:
                    true,
            },
            {
                transaction,
            }
        );


        return;
    }


    await MotorConceptoEntidad.create(
        {
            concepto_id:
                concepto.id,

            entidad_tipo_id:
                entityType.id,

            obligatorio:
                item.obligatorio,

            activo:
                true,
        },
        {
            transaction,
        }
    );

};


const syncFields = async (
    concepto,
    fields,
    user,
    transaction
) => {

    for (
        const item of fields
    ) {

        /*
         * Segunda barrera.
         * La validación previa ya lo
         * rechaza, pero no permitimos
         * que una llamada directa
         * saltee esta regla.
         */
        if (
            item.tipo ===
            "LISTA"
        ) {

            throw error(
                `El campo ${item.codigo} es de tipo LISTA y no está soportado por la importación Excel V1`
            );

        }


        const existing =
            await MotorConceptoCampo.findOne({
                where: {
                    concepto_id:
                        concepto.id,

                    codigo:
                        item.codigo,
                },
                paranoid: false,
                transaction,
            });


        if (
            existing &&
            isDeleted(
                existing
            )
        ) {

            throw error(
                `El campo ${item.codigo} del concepto ${concepto.codigo} existe pero está eliminado`
            );

        }


        /*
         * Sólo campos presentes en la
         * plantilla.
         *
         * configuracion NO se incluye.
         *
         * Así no pisamos configuraciones
         * existentes con {}.
         */
        const updatePayload = {

            etiqueta:
                item.etiqueta,

            tipo:
                item.tipo,

            obligatorio:
                item.obligatorio,

            orden:
                item.orden,

            ancho:
                item.ancho,

            placeholder:
                item.placeholder,

            ayuda:
                item.ayuda,

            solo_lectura:
                item.solo_lectura,

            visible:
                item.visible,

            valor_defecto:
                item.valor_defecto,

            activo:
                item.activo,

            modificado_por:
                user.id,

        };


        if (existing) {

            await existing.update(
                updatePayload,
                {
                    transaction,
                }
            );


            continue;
        }


        await MotorConceptoCampo.create(
            {
                concepto_id:
                    concepto.id,

                codigo:
                    item.codigo,

                ...updatePayload,

                /*
                 * Para un campo nuevo sí
                 * corresponde el default
                 * estructural.
                 */
                configuracion: {},

                creado_por:
                    user.id,
            },
            {
                transaction,
            }
        );

    }

};


const syncFileTypes = async (
    concepto,
    fileTypes,
    user,
    transaction
) => {

    for (
        const item of fileTypes
    ) {

        const existing =
            await MotorConceptoArchivoTipo.findOne({
                where: {
                    concepto_id:
                        concepto.id,

                    codigo:
                        item.codigo,
                },
                paranoid: false,
                transaction,
            });


        if (
            existing &&
            isDeleted(
                existing
            )
        ) {

            throw error(
                `El tipo de archivo ${item.codigo} del concepto ${concepto.codigo} existe pero está eliminado`
            );

        }


        const updatePayload = {

            nombre:
                item.nombre,

            descripcion:
                item.descripcion,

            obligatorio:
                item.obligatorio,

            permite_multiples:
                item.permite_multiples,

            extensiones_permitidas:
                item.extensiones_permitidas,

            mime_types_permitidos:
                item.mime_types_permitidos,

            tamanio_maximo_mb:
                item.tamanio_maximo_mb,

            maximo_archivos:
                item.maximo_archivos,

            orden:
                item.orden,

            activo:
                item.activo,

            modificado_por:
                user.id,

        };


        if (existing) {

            await existing.update(
                updatePayload,
                {
                    transaction,
                }
            );


            continue;
        }


        await MotorConceptoArchivoTipo.create(
            {
                concepto_id:
                    concepto.id,

                codigo:
                    item.codigo,

                ...updatePayload,

                creado_por:
                    user.id,
            },
            {
                transaction,
            }
        );

    }

};


const createTemplate =
    async () => {

        const entityTypes =
            await MotorConceptoEntidadTipo.findAll({
                where: {
                    activo: true,
                },
                order: [
                    [
                        "nombre",
                        "ASC",
                    ],
                ],
            });


        const workbook =
            new ExcelJS.Workbook();


        workbook.creator =
            "ERP La Tradición";


        workbook.created =
            new Date();


        const instructions =
            workbook.addWorksheet(
                "INSTRUCCIONES"
            );


        instructions.addRows([
            [
                "PLANTILLA DE IMPORTACIÓN - MOTOR DE CONCEPTOS",
            ],
            [
                "ERP La Tradición",
            ],
            [],
            [
                "INSTRUCCIONES",
            ],
            [
                "No modificar los nombres de las hojas ni los encabezados.",
            ],
            [
                "El código identifica al concepto y debe ser único.",
            ],
            [
                "Los conceptos existentes se omiten por defecto.",
            ],
            [
                "Para actualizar un concepto existente deberá seleccionarse ACTUALIZAR en la vista previa.",
            ],
            [
                "entidad_tipo puede quedar vacío.",
            ],
            [
                "Si entidad_tipo queda vacío al actualizar, se conserva la relación existente.",
            ],
            [
                "Los campos y tipos de archivo que no estén en el Excel no se eliminan.",
            ],
            [
                "Los campos LISTA no están soportados en esta primera versión de la importación.",
            ],
            [
                "CAMPOS puede quedar vacío para conceptos que no requieran campos.",
            ],
            [
                "ARCHIVOS puede quedar vacío para conceptos que no requieran archivos.",
            ],
            [
                "La importación se valida antes de escribir en la base de datos.",
            ],
            [
                "La importación confirmada se ejecuta dentro de una transacción.",
            ],
        ]);


        instructions.getColumn(
            1
        ).width = 110;


        instructions.getRow(
            1
        ).font = {
            bold: true,
            size: 14,
        };


        const conceptos =
            workbook.addWorksheet(
                "CONCEPTOS"
            );


        conceptos.columns = [
            {
                header:
                    "codigo",
                key:
                    "codigo",
                width: 24,
            },
            {
                header:
                    "nombre",
                key:
                    "nombre",
                width: 34,
            },
            {
                header:
                    "descripcion",
                key:
                    "descripcion",
                width: 48,
            },
            {
                header:
                    "modo_captura",
                key:
                    "modo_captura",
                width: 22,
            },
            {
                header:
                    "entidad_tipo",
                key:
                    "entidad_tipo",
                width: 20,
            },
            {
                header:
                    "obligatorio",
                key:
                    "obligatorio",
                width: 16,
            },
            {
                header:
                    "permite_multiples",
                key:
                    "permite_multiples",
                width: 20,
            },
            {
                header:
                    "usa_versiones",
                key:
                    "usa_versiones",
                width: 18,
            },
            {
                header:
                    "usa_vencimiento",
                key:
                    "usa_vencimiento",
                width: 20,
            },
            {
                header:
                    "dias_alerta_vencimiento",
                key:
                    "dias_alerta_vencimiento",
                width: 26,
            },
            {
                header:
                    "activo",
                key:
                    "activo",
                width: 12,
            },
        ];


        const archivos =
            workbook.addWorksheet(
                "ARCHIVOS"
            );


        archivos.columns = [
            {
                header:
                    "concepto_codigo",
                key:
                    "concepto_codigo",
                width: 24,
            },
            {
                header:
                    "codigo",
                key:
                    "codigo",
                width: 20,
            },
            {
                header:
                    "nombre",
                key:
                    "nombre",
                width: 34,
            },
            {
                header:
                    "descripcion",
                key:
                    "descripcion",
                width: 44,
            },
            {
                header:
                    "obligatorio",
                key:
                    "obligatorio",
                width: 16,
            },
            {
                header:
                    "permite_multiples",
                key:
                    "permite_multiples",
                width: 20,
            },
            {
                header:
                    "extensiones_permitidas",
                key:
                    "extensiones_permitidas",
                width: 34,
            },
            {
                header:
                    "mime_types_permitidos",
                key:
                    "mime_types_permitidos",
                width: 46,
            },
            {
                header:
                    "tamanio_maximo_mb",
                key:
                    "tamanio_maximo_mb",
                width: 22,
            },
            {
                header:
                    "maximo_archivos",
                key:
                    "maximo_archivos",
                width: 20,
            },
            {
                header:
                    "orden",
                key:
                    "orden",
                width: 10,
            },
            {
                header:
                    "activo",
                key:
                    "activo",
                width: 12,
            },
        ];


        const campos =
            workbook.addWorksheet(
                "CAMPOS"
            );


        campos.columns = [
            {
                header:
                    "concepto_codigo",
                key:
                    "concepto_codigo",
                width: 24,
            },
            {
                header:
                    "codigo",
                key:
                    "codigo",
                width: 20,
            },
            {
                header:
                    "etiqueta",
                key:
                    "etiqueta",
                width: 30,
            },
            {
                header:
                    "tipo",
                key:
                    "tipo",
                width: 18,
            },
            {
                header:
                    "obligatorio",
                key:
                    "obligatorio",
                width: 16,
            },
            {
                header:
                    "orden",
                key:
                    "orden",
                width: 10,
            },
            {
                header:
                    "ancho",
                key:
                    "ancho",
                width: 10,
            },
            {
                header:
                    "placeholder",
                key:
                    "placeholder",
                width: 28,
            },
            {
                header:
                    "ayuda",
                key:
                    "ayuda",
                width: 36,
            },
            {
                header:
                    "solo_lectura",
                key:
                    "solo_lectura",
                width: 16,
            },
            {
                header:
                    "visible",
                key:
                    "visible",
                width: 12,
            },
            {
                header:
                    "valor_defecto",
                key:
                    "valor_defecto",
                width: 24,
            },
            {
                header:
                    "activo",
                key:
                    "activo",
                width: 12,
            },
        ];


        const lists =
            workbook.addWorksheet(
                "LISTAS"
            );


        lists.addRow([
            "BOOLEANOS",
            "MODOS_CAPTURA",
            "ENTIDADES",
            "TIPOS_CAMPO",
        ]);


        /*
         * LISTA se excluye del dropdown
         * porque no está soportado por
         * la importación V1.
         */
        const importFieldTypes =
            TIPOS_CAMPO.filter(
                (tipo) =>
                    tipo !==
                    "LISTA"
            );


        const maxRows =
            Math.max(
                2,
                MODOS_CAPTURA.length,
                entityTypes.length,
                importFieldTypes.length
            );


        for (
            let index = 0;
            index < maxRows;
            index += 1
        ) {

            lists.addRow([
                [
                    "SI",
                    "NO",
                ][index] || "",

                MODOS_CAPTURA[
                index
                ] || "",

                entityTypes[
                    index
                ]?.codigo || "",

                importFieldTypes[
                index
                ] || "",
            ]);

        }


        [
            conceptos,
            archivos,
            campos,
        ].forEach(
            (sheet) => {

                sheet.views = [
                    {
                        state:
                            "frozen",
                        ySplit: 1,
                    },
                ];


                sheet.autoFilter = {
                    from: {
                        row: 1,
                        column: 1,
                    },
                    to: {
                        row: 1,
                        column:
                            sheet
                                .columnCount,
                    },
                };


                sheet.getRow(
                    1
                ).font = {
                    bold: true,
                    color: {
                        argb:
                            "FFFFFFFF",
                    },
                };


                sheet.getRow(
                    1
                ).fill = {
                    type:
                        "pattern",
                    pattern:
                        "solid",
                    fgColor: {
                        argb:
                            "FF343A40",
                    },
                };

            }
        );


        const entityEnd =
            Math.max(
                2,
                entityTypes.length +
                1
            );


        const fieldTypeEnd =
            importFieldTypes.length +
            1;


        for (
            let row = 2;
            row <= 500;
            row += 1
        ) {

            conceptos.getCell(
                `D${row}`
            ).dataValidation = {
                type:
                    "list",
                allowBlank:
                    false,
                formulae: [
                    "'LISTAS'!$B$2:$B$4",
                ],
            };


            /*
             * entidad_tipo sí puede
             * quedar vacío.
             */
            conceptos.getCell(
                `E${row}`
            ).dataValidation = {
                type:
                    "list",
                allowBlank:
                    true,
                formulae: [
                    `'LISTAS'!$C$2:$C$${entityEnd}`,
                ],
            };


            [
                "F",
                "G",
                "H",
                "I",
                "K",
            ].forEach(
                (column) => {

                    conceptos.getCell(
                        `${column}${row}`
                    ).dataValidation = {
                        type:
                            "list",
                        allowBlank:
                            false,
                        formulae: [
                            "'LISTAS'!$A$2:$A$3",
                        ],
                    };

                }
            );


            [
                "E",
                "F",
                "L",
            ].forEach(
                (column) => {

                    archivos.getCell(
                        `${column}${row}`
                    ).dataValidation = {
                        type:
                            "list",
                        allowBlank:
                            false,
                        formulae: [
                            "'LISTAS'!$A$2:$A$3",
                        ],
                    };

                }
            );


            campos.getCell(
                `D${row}`
            ).dataValidation = {
                type:
                    "list",
                allowBlank:
                    false,
                formulae: [
                    `'LISTAS'!$D$2:$D$${fieldTypeEnd}`,
                ],
            };


            [
                "E",
                "J",
                "K",
                "M",
            ].forEach(
                (column) => {

                    campos.getCell(
                        `${column}${row}`
                    ).dataValidation = {
                        type:
                            "list",
                        allowBlank:
                            false,
                        formulae: [
                            "'LISTAS'!$A$2:$A$3",
                        ],
                    };

                }
            );

        }


        /*
         * La hoja LISTAS es auxiliar.
         * La ocultamos para que el
         * usuario trabaje sólo con las
         * hojas funcionales.
         */
        lists.state =
            "hidden";


        return workbook.xlsx
            .writeBuffer();

    };


const motorConceptoImportService = {

    async getTemplate(
        user
    ) {

        assertUser(
            user
        );


        return createTemplate();

    },


    async validate(
        user,
        file
    ) {

        assertUser(
            user
        );


        const parsed =
            await parseWorkbook(
                file
            );


        return buildValidation(
            parsed
        );

    },


    async importExcel(
        user,
        file,
        rawActions = null
    ) {

        assertUser(
            user
        );


        const parsed =
            await parseWorkbook(
                file
            );


        const validation =
            await buildValidation(
                parsed
            );


        if (
            !validation.valido
        ) {

            const validationError =
                error(
                    "El archivo contiene errores de validación"
                );


            validationError.errors =
                validation.errores;


            throw validationError;

        }


        const actions =
            normalizeActions(
                rawActions
            );


        return sequelize.transaction(
            async (
                transaction
            ) => {

                /*
                 * Volvemos a obtener el
                 * estado de la BD dentro
                 * de la transacción.
                 */
                const context =
                    await getDatabaseContext(
                        parsed,
                        transaction
                    );


                const result = {
                    creados: 0,
                    actualizados: 0,
                    omitidos: 0,
                    conceptos: [],
                };


                for (
                    const item of
                    parsed.conceptos
                ) {

                    const existing =
                        context
                            .conceptMap
                            .get(
                                item.codigo
                            );


                    const action =
                        resolveAction(
                            item,
                            existing,
                            actions
                        );


                    /*
                     * Nunca restauramos
                     * automáticamente un
                     * concepto eliminado.
                     */
                    if (
                        action ===
                        "OMITIR"
                    ) {

                        result.omitidos +=
                            1;


                        result.conceptos.push({
                            codigo:
                                item.codigo,

                            accion:
                                "OMITIR",

                            motivo:
                                existing &&
                                    isDeleted(
                                        existing
                                    )
                                    ? "Concepto eliminado lógicamente"
                                    : "Concepto existente",
                        });


                        continue;

                    }


                    let entityType =
                        null;


                    if (
                        item.entidad_tipo
                    ) {

                        entityType =
                            context
                                .entityTypeMap
                                .get(
                                    item.entidad_tipo
                                );


                        /*
                         * Segunda validación
                         * dentro de la
                         * transacción.
                         */
                        if (!entityType) {

                            throw error(
                                `El tipo de entidad ${item.entidad_tipo} no existe o está inactivo`
                            );

                        }

                    }


                    let concepto;


                    if (
                        action ===
                        "CREAR"
                    ) {

                        /*
                         * Evitamos confiar
                         * únicamente en la
                         * validación previa.
                         */
                        const duplicate =
                            await MotorConcepto.findOne({
                                where: {
                                    codigo:
                                        item.codigo,
                                },
                                paranoid:
                                    false,
                                transaction,
                            });


                        if (duplicate) {

                            throw error(
                                `El concepto ${item.codigo} ya existe`
                            );

                        }


                        concepto =
                            await MotorConcepto.create(
                                {
                                    codigo:
                                        item.codigo,

                                    nombre:
                                        item.nombre,

                                    descripcion:
                                        item.descripcion,

                                    modo_captura:
                                        item.modo_captura,

                                    permite_multiples:
                                        item.permite_multiples,

                                    usa_versiones:
                                        item.usa_versiones,

                                    usa_vencimiento:
                                        item.usa_vencimiento,

                                    dias_alerta_vencimiento:
                                        item.dias_alerta_vencimiento,

                                    activo:
                                        item.activo,

                                    creado_por:
                                        user.id,

                                    modificado_por:
                                        user.id,
                                },
                                {
                                    transaction,
                                }
                            );


                        result.creados +=
                            1;

                    } else {

                        concepto =
                            await MotorConcepto.findByPk(
                                existing.id,
                                {
                                    transaction,

                                    lock:
                                        transaction
                                            .LOCK
                                            .UPDATE,
                                }
                            );


                        if (
                            !concepto ||
                            isDeleted(
                                concepto
                            )
                        ) {

                            throw error(
                                `El concepto ${item.codigo} ya no está disponible para actualizar`
                            );

                        }


                        await concepto.update(
                            {
                                nombre:
                                    item.nombre,

                                descripcion:
                                    item.descripcion,

                                modo_captura:
                                    item.modo_captura,

                                permite_multiples:
                                    item.permite_multiples,

                                usa_versiones:
                                    item.usa_versiones,

                                usa_vencimiento:
                                    item.usa_vencimiento,

                                dias_alerta_vencimiento:
                                    item.dias_alerta_vencimiento,

                                activo:
                                    item.activo,

                                modificado_por:
                                    user.id,
                            },
                            {
                                transaction,
                            }
                        );


                        result.actualizados +=
                            1;

                    }


                    /*
                     * Sólo sincronizamos la
                     * entidad cuando el Excel
                     * la especifica.
                     */
                    if (
                        entityType
                    ) {

                        await syncEntity(
                            concepto,
                            item,
                            entityType,
                            transaction
                        );

                    }


                    /*
                     * Solamente se procesan
                     * hijos presentes en el
                     * Excel.
                     *
                     * Los existentes que no
                     * aparecen se conservan.
                     */
                    const fields =
                        parsed.campos.filter(
                            (field) =>
                                field
                                    .concepto_codigo ===
                                item.codigo
                        );


                    const fileTypes =
                        parsed.archivos.filter(
                            (fileType) =>
                                fileType
                                    .concepto_codigo ===
                                item.codigo
                        );


                    await syncFields(
                        concepto,
                        fields,
                        user,
                        transaction
                    );


                    await syncFileTypes(
                        concepto,
                        fileTypes,
                        user,
                        transaction
                    );


                    result.conceptos.push({
                        id:
                            concepto.id,

                        codigo:
                            concepto.codigo,

                        accion:
                            action,
                    });

                }


                return result;

            }
        );

    },

};


export default motorConceptoImportService;