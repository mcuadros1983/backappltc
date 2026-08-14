export const dniNoReconocidoTemplate = (datos = {}) => {

    const dni =
        datos.dni ?? "-";

    const proceso =
        datos.proceso ?? "-";

    const archivo =
        datos.archivo ?? "-";

    const fila =
        datos.fila ?? "-";

    const sucursal =
        datos.sucursal ?? "-";

    const detalle =
        datos.detalle ??
        "El DNI informado no corresponde a un colaborador registrado.";

    return {

        subject:
            `DNI no reconocido en Evaluación - ${dni}`,

        html: `
            <h2>DNI no reconocido</h2>

            <p>
                El sistema detectó un DNI que no pudo asociarse
                con un colaborador registrado durante un proceso
                del módulo Evaluación.
            </p>

            <table
                border="1"
                cellpadding="6"
                cellspacing="0"
                style="border-collapse: collapse;"
            >
                <tr>
                    <td><strong>DNI</strong></td>
                    <td>${dni}</td>
                </tr>

                <tr>
                    <td><strong>Proceso</strong></td>
                    <td>${proceso}</td>
                </tr>

                <tr>
                    <td><strong>Archivo</strong></td>
                    <td>${archivo}</td>
                </tr>

                <tr>
                    <td><strong>Fila</strong></td>
                    <td>${fila}</td>
                </tr>

                <tr>
                    <td><strong>Sucursal</strong></td>
                    <td>${sucursal}</td>
                </tr>

                <tr>
                    <td><strong>Detalle</strong></td>
                    <td>${detalle}</td>
                </tr>
            </table>

            <br>

            <p>
                Se recomienda verificar el DNI informado y confirmar
                que el colaborador se encuentre correctamente registrado
                y activo en el ERP.
            </p>

            <hr>

            <small>
                ERP La Tradición - Módulo Evaluación
            </small>
        `,

        text: `
DNI no reconocido

DNI: ${dni}
Proceso: ${proceso}
Archivo: ${archivo}
Fila: ${fila}
Sucursal: ${sucursal}
Detalle: ${detalle}

Se recomienda verificar el DNI informado y confirmar que el colaborador
se encuentre correctamente registrado y activo en el ERP.

ERP La Tradición - Módulo Evaluación
        `.trim()

    };

};