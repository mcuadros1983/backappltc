const fila = (label, value) => {

    if (
        value === undefined ||
        value === null ||
        value === ""
    ) {
        return "";
    }

    return `
        <tr>
            <td style="
                padding:10px;
                font-weight:bold;
                background:#f8f9fa;
                border:1px solid #dee2e6;
                width:220px;
            ">
                ${label}
            </td>

            <td style="
                padding:10px;
                border:1px solid #dee2e6;
            ">
                ${value}
            </td>
        </tr>
    `;

};

export const alertaTemplate = ({

    color = "#0d6efd",

    icono = "ℹ️",

    titulo = "Notificación",

    descripcion = "",

    datos = {},

    recomendaciones = []

}) => {

    const html = `
<!DOCTYPE html>

<html>

<head>

<meta charset="UTF-8">

</head>

<body style="
    margin:0;
    padding:30px;
    background:#f4f6f9;
    font-family:Arial,Helvetica,sans-serif;
">

<table
    width="700"
    align="center"
    cellpadding="0"
    cellspacing="0"
    style="
        background:#ffffff;
        border-collapse:collapse;
        border:1px solid #dcdcdc;
    "
>

<tr>

<td
    style="
        background:${color};
        color:#ffffff;
        padding:20px;
        font-size:24px;
        font-weight:bold;
    "
>

${icono} ${titulo}

</td>

</tr>

<tr>

<td style="padding:25px;">

<p style="
    margin-top:0;
    font-size:15px;
">

${descripcion}

</p>

<table
    width="100%"
    cellpadding="0"
    cellspacing="0"
    style="
        margin-top:20px;
        border-collapse:collapse;
    "
>

${fila("Empleado", datos.empleado)}

${fila("DNI", datos.dni)}

${fila("Sucursal", datos.sucursal)}

${fila("Evaluación", datos.evaluacion)}

${fila("Competencia", datos.competencia)}

${fila("KPI", datos.kpi)}

${fila("Indicador", datos.indicador)}

${fila("Valor anterior", datos.anterior)}

${fila("Valor actual", datos.actual)}

${fila("Diferencia", datos.diferencia)}

${fila("Nivel", datos.nivel)}

${fila("Riesgo", datos.riesgo)}

${fila("Periodo", datos.periodo)}

${fila("Evaluador", datos.evaluador)}

${fila("Supervisor", datos.supervisor)}

</table>

${
    recomendaciones.length
        ? `
        <h3 style="
            margin-top:35px;
            color:${color};
        ">
            Recomendaciones
        </h3>

        <ul>

            ${
                recomendaciones
                    .map(item => `<li>${item}</li>`)
                    .join("")
            }

        </ul>
        `
        : ""
}

<hr style="margin-top:40px;">

<p style="
    color:#666;
    font-size:12px;
">

<strong>Fecha:</strong>

${new Date().toLocaleString()}

<br><br>

Este mensaje fue generado automáticamente por
<strong>ERP La Tradición</strong>.

</p>

</td>

</tr>

</table>

</body>

</html>
`;

    return {

        subject: titulo,

        html,

        text: `
${titulo}

${descripcion}

Empleado: ${datos.empleado ?? ""}

Evaluación: ${datos.evaluacion ?? ""}

Competencia: ${datos.competencia ?? ""}

KPI: ${datos.kpi ?? ""}

Valor actual: ${datos.actual ?? ""}

Nivel: ${datos.nivel ?? ""}

Riesgo: ${datos.riesgo ?? ""}
`

    };

};