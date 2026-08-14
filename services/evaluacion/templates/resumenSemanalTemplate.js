export const resumenSemanalTemplate = (datos = {}) => {

    const periodo =
        datos.periodo ?? "-";

    const sucursal =
        datos.sucursal ?? "-";

    const evaluaciones =
        datos.evaluaciones ?? 0;

    const completadas =
        datos.completadas ?? 0;

    const pendientes =
        datos.pendientes ?? 0;

    const promedio =
        datos.promedio ?? 0;

    const alertas =
        datos.alertas ?? 0;

    const banderasCriticas =
        datos.banderasCriticas ?? 0;

    return {

        subject:
            `Resumen semanal de Evaluaciones - ${periodo}`,

        html: `
            <h2>📅 Resumen Semanal de Evaluaciones</h2>

            <p>

                A continuación se presenta el resumen correspondiente
                al período <strong>${periodo}</strong>.

            </p>

            <table
                border="1"
                cellpadding="6"
                cellspacing="0"
                style="border-collapse: collapse;"
            >

                <tr>
                    <td><strong>Período</strong></td>
                    <td>${periodo}</td>
                </tr>

                <tr>
                    <td><strong>Sucursal</strong></td>
                    <td>${sucursal}</td>
                </tr>

                <tr>
                    <td><strong>Evaluaciones realizadas</strong></td>
                    <td>${evaluaciones}</td>
                </tr>

                <tr>
                    <td><strong>Evaluaciones completadas</strong></td>
                    <td>${completadas}</td>
                </tr>

                <tr>
                    <td><strong>Evaluaciones pendientes</strong></td>
                    <td>${pendientes}</td>
                </tr>

                <tr>
                    <td><strong>Promedio semanal</strong></td>
                    <td>${promedio}%</td>
                </tr>

                <tr>
                    <td><strong>Alertas rojas</strong></td>
                    <td>${alertas}</td>
                </tr>

                <tr>
                    <td><strong>Banderas críticas</strong></td>
                    <td>${banderasCriticas}</td>
                </tr>

            </table>

            <br>

            <p>

                Este resumen permite monitorear semanalmente el avance
                del proceso de evaluación y detectar tempranamente
                situaciones que requieran seguimiento.

            </p>

            <hr>

            <small>

                ERP La Tradición - Módulo Evaluación

            </small>

        `,

        text: `
Resumen Semanal de Evaluaciones

Período: ${periodo}
Sucursal: ${sucursal}

Evaluaciones realizadas: ${evaluaciones}
Evaluaciones completadas: ${completadas}
Evaluaciones pendientes: ${pendientes}

Promedio semanal: ${promedio}%

Alertas rojas: ${alertas}
Banderas críticas: ${banderasCriticas}

ERP La Tradición - Módulo Evaluación
        `.trim()

    };

};