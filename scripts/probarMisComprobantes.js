import "dotenv/config";
import Afip from "@afipsdk/afip.js";
import { mkdir, readFile, writeFile } from "node:fs/promises";

const carpeta = new URL("../.arca-pruebas/", import.meta.url);
const archivo = new URL("consulta-recibidos-octubre.json", carpeta);
const resultado = new URL("resultado-recibidos-octubre.json", carpeta);

async function main() {
  const variables = [
    "AFIPSDK_ACCESS_TOKEN",
    "ARCA_ELMANGO_CUIT",
    "ARCA_LOGIN_CUIT",
    "ARCA_LOGIN_PASSWORD",
  ];

  for (const nombre of variables) {
    if (!process.env[nombre]?.trim()) {
      throw new Error(`Falta configurar ${nombre} en el .env`);
    }
  }

  const afip = new Afip({
    access_token: process.env.AFIPSDK_ACCESS_TOKEN,
  });

  await mkdir(carpeta, { recursive: true });

  let consulta;

  try {
    consulta = JSON.parse(await readFile(archivo, "utf8"));
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }

  let respuesta;

  if (consulta?.id) {
    console.log("Consultando la ejecución existente:", consulta.id);

    respuesta = await afip.GetAutomationDetails(consulta.id, false);
  } else {
    // Se guarda antes del envío para evitar repetir una solicitud
    // cuyo resultado se desconozca por un corte de conexión.
    if (consulta) {
      throw new Error(
        "Hay un intento sin ID. Revisá Automatizaciones en Afip SDK " +
        "antes de volver a iniciar una consulta."
      );
    }

    await writeFile(
      archivo,
      JSON.stringify({ estado: "enviando" }, null, 2),
      { flag: "wx" }
    );

    respuesta = await afip.CreateAutomation(
      "mis-comprobantes",
      {
        cuit: process.env.ARCA_ELMANGO_CUIT,
        username: process.env.ARCA_LOGIN_CUIT,
        password: process.env.ARCA_LOGIN_PASSWORD,
        filters: {
          t: "R",
          fechaEmision: "01/10/2026 - 13/10/2026",
        },
      },
      false
    );

    if (!respuesta?.id) {
      throw new Error(
        "No se recibió un ID. Revisá el historial de Afip SDK."
      );
    }

    await writeFile(
      archivo,
      JSON.stringify({ id: respuesta.id }, null, 2)
    );
  }

  console.log("ID:", respuesta.id ?? consulta?.id);
  console.log("Estado:", respuesta.status);

  if (respuesta.status === "complete") {
    await writeFile(resultado, JSON.stringify(respuesta, null, 2));

    console.log(
      "Comprobantes:",
      Array.isArray(respuesta.data) ? respuesta.data.length : 0
    );
    console.log("Resultado guardado en .arca-pruebas.");
  } else if (respuesta.status === "in_process") {
    console.log(
      "Sigue procesando. Esperá unos segundos y ejecutá nuevamente."
    );
  } else {
    console.log(
      "La ejecución no se completó. Revisá su detalle en Afip SDK."
    );
  }
}

main().catch(() => {
  // No imprimimos el error completo: podría contener credenciales.
  console.error(
    "La prueba no pudo completarse. Revisá las variables del .env " +
    "y el historial de Automatizaciones en Afip SDK."
  );
  process.exitCode = 1;
});