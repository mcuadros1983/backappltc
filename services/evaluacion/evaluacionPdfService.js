import PdfPrinter from "pdfmake";
import path from "path";
import { fileURLToPath } from "url";
import { Op } from "sequelize";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const fonts = {

    Roboto: {

        normal: path.join(
            __dirname,
            "../../assets/fonts/Roboto-Regular.ttf"
        ),

        bold: path.join(
            __dirname,
            "../../assets/fonts/Roboto-Bold.ttf"
        ),

        italics: path.join(
            __dirname,
            "../../assets/fonts/Roboto-Italic.ttf"
        ),

        bolditalics: path.join(
            __dirname,
            "../../assets/fonts/Roboto-BoldItalic.ttf"
        )

    }

};

const printer = new PdfPrinter(fonts);

export const generarPdfEvaluacion = (evaluacion) => {

    const criterios = [];

    criterios.push([
        {
            text: "Criterio",
            bold: true
        },
        {
            text: "Puntaje",
            bold: true
        },
        {
            text: "Comentario",
            bold: true
        }
    ]);

    evaluacion.criterios.forEach(c => {

        criterios.push([

            c.descripcion,

            `${c.puntaje} / ${c.puntaje_maximo}`,

            c.comentario || ""

        ]);

    });

    const docDefinition = {

        pageSize: "A4",

        pageMargins: [40, 50, 40, 50],

        content: [

            {

                text: "EVALUACIÓN DE DESEMPEÑO",

                style: "titulo"

            },

            {

                text: `Evaluación N° ${evaluacion.numero}`,

                margin: [0, 0, 0, 20]

            },

            {

                columns: [

                    [

                        {

                            text:
                                `Empleado: ${evaluacion.empleado?.apellido ?? ""} ${evaluacion.empleado?.nombre ?? ""}`

                        },

                        {

                            text: `Evaluador: ${evaluacion.evaluador?.usuario ?? ""}`

                        },

                        {

                            text: `Tipo: ${evaluacion.tipo?.descripcion ?? ""}`

                        },

                        {

                            text: `Plantilla: ${evaluacion.plantilla?.descripcion ?? ""}`

                        },

                        {

                            text: `Período: ${evaluacion.periodo?.descripcion ?? ""}`

                        }

                    ]

                ]

            },

            {

                text: "Resultados",

                style: "subtitulo",

                margin: [0, 20, 0, 10]

            },

            {

                table: {

                    widths: ["*", 60, "*"],

                    body: criterios

                }

            },

            {

                margin: [0, 20, 0, 0],

                text:
                    `Resultado Final: ${Number(evaluacion.porcentaje ?? 0).toFixed(2)
                    } %`,

                style: "resultado"

            }

        ],

        styles: {

            titulo: {

                fontSize: 18,

                bold: true,

                alignment: "center"

            },

            subtitulo: {

                fontSize: 14,

                bold: true

            },

            resultado: {

                fontSize: 16,

                bold: true,

                color: "#0d6efd"

            }

        }

    };

    return printer.createPdfKitDocument(docDefinition);

};