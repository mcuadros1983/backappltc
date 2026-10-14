import "dotenv/config";
import axios from "axios";
import { wrapper } from "axios-cookiejar-support";
import { CookieJar } from "tough-cookie";
import * as cheerio from "cheerio";
import { mkdir, writeFile } from "node:fs/promises";

const AUTH = "https://auth.afip.gob.ar";
const PORTAL = "https://portalcf.cloud.afip.gob.ar";
const FES = "https://fes.afip.gob.ar";

let etapa = "Configuración";

const cliente = wrapper(axios.create({
    jar: new CookieJar(),
    withCredentials: true,
    timeout: 30000,
    maxRedirects: 0,
    responseType: "text",
    validateStatus: status => status >= 200 && status < 400,
}));

// Seguimos las redirecciones sin reenviar contraseñas
// ni cuerpos POST a destinos inesperados.
function validarDestino(url) {
    const destino = new URL(url);

    if (![AUTH, PORTAL, FES].includes(destino.origin)) {
        throw new Error("Destino inesperado");
    }

    return destino.href;
}

async function solicitar(url, opciones = {}) {
    let destino = validarDestino(url);
    let config = { ...opciones };

    for (let intento = 0; intento < 8; intento++) {
        const respuesta = await cliente.request({
            ...config,
            url: destino,
        });

        if (!respuesta.headers.location) {
            return {
                html: respuesta.data,
                url: destino,
                status: respuesta.status,
            };
        }

        const siguiente = validarDestino(
            new URL(respuesta.headers.location, destino).href
        );

        // Evitamos repetir un POST mediante redirecciones 307/308.
        if ([307, 308].includes(respuesta.status)) {
            throw new Error("Redirección que requiere revisión");
        }

        destino = siguiente;
        config = { method: "GET" };
    }

    throw new Error("Demasiadas redirecciones");
}

function leerFormulario(pagina, campo) {
    const $ = cheerio.load(pagina.html);

    const formulario = $("form").toArray().find(form =>
        $(form).find("input").toArray().some(input =>
            $(input).attr("name") === campo
        )
    );

    if (!formulario) {
        throw new Error("No se encontró el formulario esperado");
    }

    const datos = new URLSearchParams();

    $(formulario).find('input[type="hidden"]').each((_, input) => {
        const nombre = $(input).attr("name");

        if (nombre) {
            datos.append(nombre, $(input).attr("value") ?? "");
        }
    });

    return {
        url: validarDestino(
            new URL($(formulario).attr("action") || pagina.url, pagina.url).href
        ),
        method: ($(formulario).attr("method") || "get").toUpperCase(),
        datos,
        $,
    };
}

async function enviarFormulario(formulario, referencia) {
    if (formulario.method !== "POST") {
        throw new Error("Método de formulario inesperado");
    }

    return solicitar(formulario.url, {
        method: "POST",
        data: formulario.datos.toString(),
        headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            Origin: new URL(referencia).origin,
            Referer: referencia,
        },
    });
}

async function main() {
    const usuario = process.env.ARCA_LOGIN_CUIT;
    const clave = process.env.ARCA_LOGIN_PASSWORD;
    const empresa = process.env.ARCA_ELMANGO_CUIT;

    if (!/^\d{11}$/.test(usuario || "") ||
        !/^\d{11}$/.test(empresa || "") ||
        !clave) {
        throw new Error("Revisá las variables del .env");
    }

    etapa = "Leer formulario inicial";
    let pagina = await solicitar(`${AUTH}/contribuyente_/login.xhtml`);
    let formulario = leerFormulario(pagina, "F1:username");

    formulario.datos.set("F1:username", usuario);
    formulario.datos.set("F1:btnSiguiente", "Siguiente");

    etapa = "Validar CUIT";
    pagina = await enviarFormulario(formulario, pagina.url);
    formulario = leerFormulario(pagina, "F1:password");

    // Si aparece un desafío visible, no intentamos resolverlo
    // ni reutilizar valores de una sesión del navegador.
    const desafio = formulario.$(
        'iframe[src*="captcha"], .g-recaptcha, .h-captcha'
    ).length;

    if (desafio || formulario.datos.get("F1:captcha")) {
        throw new Error("ARCA requiere una verificación adicional");
    }

    formulario.datos.set("F1:username", usuario);
    formulario.datos.set("F1:password", clave);
    formulario.datos.set("F1:btnIngresar", "Ingresar");

    etapa = "Validar contraseña y obtener acceso al portal";
    pagina = await enviarFormulario(formulario, pagina.url);

    // La respuesta del login debe contener el formulario
    // intermedio con el JWT generado por ARCA.
    formulario = leerFormulario(pagina, "jwt");

    if (!formulario.datos.get("jwt") ||
        formulario.url !== `${PORTAL}/portal/login`) {
        throw new Error("No se obtuvo el formulario del portal");
    }

    etapa = "Entrar al portal";
    pagina = await enviarFormulario(formulario, pagina.url);

    etapa = "Obtener autorización para Mis Comprobantes";
    const autorizacion = await solicitar(
        `${PORTAL}/portal/api/servicios/${usuario}/servicio/mcmp/autorizacion`,
        {
            method: "GET",
            headers: {
                Accept: "application/json",
                Referer: `${PORTAL}/portal/app/`,
            },
        }
    );

    const ticket = JSON.parse(autorizacion.html);

    if (!ticket.token || !ticket.sign) {
        throw new Error("No se obtuvo autorización");
    }

    etapa = "Entrar a Mis Comprobantes";
    pagina = await solicitar(`${FES}/mcmp/jsp/index.do`, {
        method: "POST",
        data: new URLSearchParams({
            token: ticket.token,
            sign: ticket.sign,
        }).toString(),
        headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            Origin: PORTAL,
            Referer: `${PORTAL}/portal/app/`,
        },
    });

    etapa = "Identificar empresa autorizada";
    const $ = cheerio.load(pagina.html);

    const tarjetas = $("a[onclick]").toArray()
        .map(elemento => ({
            texto: $(elemento).text().replace(/\s+/g, " ").trim(),
            onclick: $(elemento).attr("onclick") || "",
        }))
        .filter(item => {
            const cuits = item.texto.match(/\d{2}-\d{8}-\d/g) || [];
            return cuits.some(cuit => cuit.replaceAll("-", "") === empresa);
        });

    if (tarjetas.length !== 1) {
        throw new Error("No se pudo identificar una única empresa");
    }

    const coincidencia = tarjetas[0].onclick.match(
        /\.value\s*=\s*['"](\d+)['"]/
    );

    if (!coincidencia) {
        throw new Error("No se encontró el identificador de empresa");
    }

    etapa = "Seleccionar empresa";
    pagina = await solicitar(
        `${FES}/mcmp/jsp/setearContribuyente.do?` +
        new URLSearchParams({ idContribuyente: coincidencia[1] })
    );

    const texto = cheerio.load(pagina.html).text();
    const cuits = texto.match(/\d{2}-\d{8}-\d/g) || [];

    if (!cuits.some(cuit => cuit.replaceAll("-", "") === empresa)) {
        throw new Error("No se confirmó la empresa seleccionada");
    }

    etapa = "Abrir comprobantes recibidos";
    await solicitar(`${FES}/mcmp/jsp/comprobantesRecibidos.do`);

    async function consultarJson(parametros) {
        const respuesta = await solicitar(
            `${FES}/mcmp/jsp/ajax.do?${new URLSearchParams(parametros)}`,
            {
                method: "GET",
                headers: {
                    Accept: "application/json",
                    "X-Requested-With": "XMLHttpRequest",
                    Referer: `${FES}/mcmp/jsp/comprobantesRecibidos.do`,
                },
            }
        );

        const json = JSON.parse(respuesta.html);

        if (json.estado !== "ok") {
            throw new Error("ARCA no aceptó la consulta");
        }

        return json;
    }

    etapa = "Crear consulta de recibidos";
    const consulta = await consultarJson({
        f: "generarConsulta",
        t: "R",
        fechaEmision: "01/10/2026 - 13/10/2026",
        cuitConsultada: empresa,
    });

    const idConsulta = consulta.datos?.idConsulta;

    if (!idConsulta) {
        throw new Error("No se recibió el identificador de consulta");
    }

    console.log("Consulta creada:", idConsulta);

    etapa = "Esperar resultados";
    let resultado;

    for (let intento = 0; intento < 12; intento++) {
        await new Promise(resolve => setTimeout(resolve, 3000));

        await consultarJson({
            f: "estimarResultados",
            id: String(idConsulta),
        });

        resultado = await consultarJson({
            f: "listaResultados",
            id: String(idConsulta),
            _: String(Date.now()),
        });

        const filas = resultado.datos?.data;
        const estado = resultado.datos?.consulta?.estado;

        if (
            Array.isArray(filas) &&
            ["PR", "TE"].includes(estado)
        ) {
            break;
        }

        resultado = undefined;
    }

    if (!resultado) {
        throw new Error(
            "La consulta no terminó dentro del tiempo de esta prueba"
        );
    }

    const filas = resultado.datos.data;
    const total = Number(resultado.recordsTotal);
    const filtrado = Number(resultado.recordsFiltered);

    if (
        !Number.isInteger(total) ||
        !Number.isInteger(filtrado) ||
        filas.length !== total ||
        filas.length !== filtrado
    ) {
        throw new Error(
            "La respuesta podría estar incompleta; debemos revisar la paginación"
        );
    }

    const receptorCorrecto = filas.every(
        fila => String(fila[15]) === empresa
    );

    if (!receptorCorrecto) {
        throw new Error("Hay comprobantes con un receptor diferente");
    }

    etapa = "Guardar resultado";
    const carpeta = new URL("../.arca-pruebas/", import.meta.url);

    await mkdir(carpeta, { recursive: true });
    await writeFile(
        new URL(`arca-directo-recibidos-${idConsulta}.json`, carpeta),
        JSON.stringify(resultado, null, 2)
    );

    console.log("Consulta directa completada.");
    console.log("Empresa:", empresa);
    console.log("Comprobantes recuperados:", filas.length);
    console.log("Resultado guardado en .arca-pruebas.");
}

main().catch(error => {
    console.error("La prueba se detuvo en:", etapa);

    if (axios.isAxiosError(error)) {
        console.error(
            "Error de conexión:",
            error.response?.status ?? error.code ?? "sin respuesta"
        );
    } else if (error instanceof SyntaxError) {
        console.error("ARCA devolvió una respuesta con formato inesperado.");
    } else {
        console.error(error.message);
    }

    // No mostramos cuerpos, cookies, tickets ni errores completos de Axios.
    process.exitCode = 1;
});