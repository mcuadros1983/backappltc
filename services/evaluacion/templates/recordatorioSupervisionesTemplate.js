export const recordatorioSupervisionesTemplate = (datos = {}) => {

    const supervisor =
        datos.supervisor ?? "-";

    const sucursal =
        datos.sucursal ?? "-";

    const pendientes =
        datos.pendientes ?? 0;

    const fechaLimite =
        datos.fechaLimite ?? "-";

    const periodo =
        datos.periodo ?? "-";

    return {

        subject:
            "Recordatorio de supervisiones pendientes",

        html: `
            <h2>📋 Recordatorio de Supervisiones</h2>

            <p>

                El sistema detectó supervisiones pendientes de completar.

            </p>

            <table
                border="1"
                cellpadding="6"
                cellspacing="0"
                style="border-collapse: collapse;"
            >

                <tr>
                    <td><strong>Supervisor</strong></td>
                    <td>${supervisor}</td>
                </tr>

                <tr>
                    <td><strong>Sucursal</strong></td>
                    <td>${sucursal}</td>
                </tr>

                <tr>
                    <td><strong>Período</strong></td>
                    <td>${periodo}</td>
                </tr>

                <tr>
                    <td><strong>Supervisiones pendientes</strong></td>
                    <td>${pendientes}</td>
                </tr>

                <tr>
                    <td><strong>Fecha límite</strong></td>
                    <td>${fechaLimite}</td>
                </tr>

            </table>

            <br>

            <p>

                Se recomienda completar las supervisiones pendientes antes de la
                fecha límite para evitar demoras en el proceso de evaluación.

            </p>

            <hr>

            <small>

                ERP La Tradición - Módulo Evaluación

            </small>

        `,

        text: `
Recordatorio de Supervisiones

Supervisor: ${supervisor}
Sucursal: ${sucursal}
Período: ${periodo}
Supervisiones pendientes: ${pendientes}
Fecha límite: ${fechaLimite}

Se recomienda completar las supervisiones pendientes antes de la fecha límite.

ERP La Tradición - Módulo Evaluación
        `.trim()

    };

};