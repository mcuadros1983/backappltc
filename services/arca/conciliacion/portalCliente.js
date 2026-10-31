import axios from 'axios';
import { wrapper } from 'axios-cookiejar-support';
import { CookieJar } from 'tough-cookie';
import * as cheerio from 'cheerio';
import { normalizarFila, identidad, documento } from './normalizar.js';
const AUTH = 'https://auth.afip.gob.ar', PORTAL = 'https://portalcf.cloud.afip.gob.ar', FES = 'https://fes.afip.gob.ar';
export class PortalError extends Error { }
const safe = message => new PortalError(message);

const MENSAJE_CAMBIO_ARCA =
    "La estructura de acceso a «Mis Comprobantes» de ARCA cambió. " +
    "Contactá al programador para actualizar la integración.";

function cambioArca(etapa) {
    // Solo información técnica; no registrar HTML ni credenciales.
    console.warn("[ARCA CAMBIO DE ESTRUCTURA]", { etapa });

    return safe(MENSAJE_CAMBIO_ARCA);
}

function verificarFormularioArca(html, campos, etapa) {
    const $ = cheerio.load(html);

    const formulario = $("form")
        .toArray()
        .find((el) => {
            const nombres = new Set(
                $(el)
                    .find("input, button, select, textarea")
                    .toArray()
                    .map((campo) => $(campo).attr("name"))
                    .filter(Boolean)
            );

            return campos.every((nombre) => nombres.has(nombre));
        });

    if (!formulario) {
        throw cambioArca(etapa);
    }
}

export function crearPortalCliente() {
    const http = wrapper(axios.create({ jar: new CookieJar(), withCredentials: true, timeout: 30000, maxRedirects: 0, responseType: 'text', validateStatus: s => s >= 200 && s < 400 }));
    function destino(url) { const u = new URL(url); if (![AUTH, PORTAL, FES].includes(u.origin)) throw safe('ARCA indicó un destino inesperado'); return u.href; }


    let contextoActual = {
        etapa: "Iniciar acceso a ARCA",
        pagina: null,
    };

    function registrarPagina(url) {
        const u = new URL(url);

        // Mostrar únicamente dominio y ruta.
        // Nunca incluir tokens ni parámetros de sesión.
        const pagina = `${u.origin}${u.pathname}`;

        const etapas = {
            "/contribuyente_/login.xhtml": "Ingreso de CUIT",
            "/contribuyente_/loginClave.xhtml": "Ingreso de contraseña",
            "/portal/login": "Acceso al portal",
            "/portal/app/": "Carga del portal",
            "/mcmp/jsp/index.do": "Acceso a Mis Comprobantes",
            "/mcmp/jsp/setearContribuyente.do": "Selección de empresa",
            "/mcmp/jsp/comprobantesRecibidos.do":
                "Acceso a comprobantes recibidos",
        };

        let etapa = etapas[u.pathname] || "Comunicación con ARCA";

        if (
            u.pathname.startsWith("/portal/api/servicios/") &&
            u.pathname.endsWith("/servicio/mcmp/autorizacion")
        ) {
            etapa = "Autorización para Mis Comprobantes";
        }

        if (u.pathname === "/mcmp/jsp/ajax.do") {
            const operaciones = {
                generarConsulta: "Creación de la consulta",
                estimarResultados: "Verificación del procesamiento",
                listaResultados: "Lectura y validación de comprobantes",
            };

            etapa =
                operaciones[u.searchParams.get("f")] ||
                "Consulta de comprobantes";
        }

        contextoActual = { etapa, pagina };
    }

    async function request(url, options = {}) {
        let target = destino(url), opts = options;
        for (let i = 0; i < 8; i++) {
            registrarPagina(target);

            let r; try { r = await http.request({ ...opts, url: target }); } catch { throw safe('No se pudo conectar con ARCA. No se reintentó el login automáticamente.'); }
            if (!r.headers.location) {
                return {
                    html: r.data,
                    url: target,
                    status: r.status,
                    contentType: String(r.headers["content-type"] || ""),
                };
            }
            if ([307, 308].includes(r.status)) throw safe('Redirección ARCA que requiere revisión');
            target = destino(new URL(r.headers.location, target).href); opts = { method: 'GET' };
        } throw safe('Demasiadas redirecciones ARCA');
    }
    function form(page, field) {
        const $ = cheerio.load(page.html); const f = $('form').toArray().find(el => $(el).find('input').toArray().some(i => $(i).attr('name') === field));
        if (!f) throw safe('ARCA no devolvió el formulario esperado. Revisar credenciales o verificaciones adicionales.');
        const data = new URLSearchParams(); $(f).find('input[type="hidden"]').each((_, el) => { const n = $(el).attr('name'); if (n) data.append(n, $(el).attr('value') ?? ''); });
        return { url: destino(new URL($(f).attr('action') || page.url, page.url).href), method: ($(f).attr('method') || 'get').toUpperCase(), data, $ };
    }
    async function submit(f, referer) { if (f.method !== 'POST') throw safe('Cambió el formulario ARCA'); return request(f.url, { method: 'POST', data: f.data.toString(), headers: { 'Content-Type': 'application/x-www-form-urlencoded', Origin: new URL(referer).origin, Referer: referer } }); }


    async function json(url, options = {}) {
        const p = await request(url, options);

        const contenido = String(p.html ?? "")
            .replace(/^\uFEFF/, "")
            .trim();

        try {
            return JSON.parse(contenido);
        } catch {
            const esHTML =
                /^(?:<!doctype\s+html\b|<html\b|<head\b|<body\b)/i
                    .test(contenido) ||
                p.contentType.toLowerCase().includes("text/html");

            // Metadatos únicamente: no registrar el cuerpo de la respuesta.
            console.warn("[ARCA RESPUESTA NO JSON]", {
                etapa: contextoActual.etapa,
                pagina: contextoActual.pagina,
                estadoHTTP: p.status,
                tipoContenido: p.contentType,
                longitud: contenido.length,
                respuestaVacia: contenido.length === 0,
                pareceHTML: esHTML,
            });

            if (!contenido) {
                throw safe(
                    "ARCA devolvió una respuesta vacía durante la consulta. " +
                    "Se conservó el identificador de la ejecución."
                );
            }

            if (esHTML) {
                throw safe(
                    "ARCA devolvió una página HTML donde se esperaban datos JSON. " +
                    "Puede ser una página de error o de acceso; " +
                    "no se pudo confirmar el resultado de la consulta."
                );
            }

            throw safe(
                "ARCA devolvió una respuesta que no es JSON válido. " +
                "Contactá al programador para revisar la integración."
            );
        }
    }

    async function abrir(cuit) {
        const user = process.env.ARCA_LOGIN_CUIT, password = process.env.ARCA_LOGIN_PASSWORD;
        if (user !== '20246050822' || !password) throw safe('Configurar ARCA_LOGIN_CUIT y ARCA_LOGIN_PASSWORD de Gustavo en el servidor');

        let p = await request(
            `${AUTH}/contribuyente_/login.xhtml`
        );

        verificarFormularioArca(
            p.html,
            [
                "F1:username",
                "F1:btnSiguiente",
                "javax.faces.ViewState",
            ],
            "Formulario de ingreso de CUIT"
        );

        let f = form(p, "F1:username");

        f.data.set("F1:username", user);
        f.data.set("F1:btnSiguiente", "Siguiente");

        p = await submit(f, p.url);

        const $login = cheerio.load(p.html);

        // Detectar una respuesta que sigue solicitando CUIT.
        // Puede ser rechazo del CUIT o una verificación adicional.
        if (!$login('input[name="F1:password"]').length) {
            if ($login('input[name="F1:username"]').length) {
                throw safe(
                    "ARCA no permitió avanzar al ingreso de contraseña. " +
                    "Verificá el CUIT y si solicita una validación adicional."
                );
            }

            throw cambioArca("Transición al ingreso de contraseña");
        }

        verificarFormularioArca(
            p.html,
            [
                "F1:username",
                "F1:password",
                "F1:btnIngresar",
                "javax.faces.ViewState",
            ],
            "Formulario de ingreso de contraseña"
        );

        f = form(p, "F1:password");
        if (f.$('iframe[src*="captcha"],.g-recaptcha,.h-captcha').length || f.data.get('F1:captcha')) throw safe('ARCA exige verificación adicional; detener y acceder manualmente');
        f.data.set('F1:username', user); f.data.set('F1:password', password); f.data.set('F1:btnIngresar', 'Ingresar'); p = await submit(f, p.url); f = form(p, 'jwt');
        if (!f.data.get('jwt') || f.url !== `${PORTAL}/portal/login`) throw safe('No se obtuvo acceso al portal');
        await submit(f, p.url);
        const ticket = await json(`${PORTAL}/portal/api/servicios/${user}/servicio/mcmp/autorizacion`, { headers: { Accept: 'application/json', Referer: `${PORTAL}/portal/app/` } });
        if (!ticket.token || !ticket.sign) throw safe('Sin autorización para Mis Comprobantes');
        p = await request(`${FES}/mcmp/jsp/index.do`, { method: 'POST', data: new URLSearchParams({ token: ticket.token, sign: ticket.sign }).toString(), headers: { 'Content-Type': 'application/x-www-form-urlencoded', Origin: PORTAL, Referer: `${PORTAL}/portal/app/` } });

        const $ = cheerio.load(p.html);

        const extraerCuits = (texto) =>
            (texto.match(/\b\d{2}[\s-]*\d{8}[\s-]*\d\b/g) || [])
                .map(documento);

        const cuitBuscado = documento(cuit);

        const empresas = $("a[onclick]")
            .toArray()
            .filter((el) =>
                /idcontribuyente/i.test($(el).attr("onclick") || "")
            )
            .map((el) => ({
                elemento: el,
                cuits: extraerCuits($(el).text()),
            }));

        if (!empresas.length) {
            throw cambioArca("Selector de empresas");
        }

        const coincidencias = empresas.filter(
            (empresa) => empresa.cuits.includes(cuitBuscado)
        );

        // Obtener los identificadores internos de ARCA.
        // Dos enlaces con el mismo identificador representan
        // la misma selección.
        const ids = [
            ...new Set(
                coincidencias
                    .map((empresa) => {
                        const onclick =
                            $(empresa.elemento).attr("onclick") || "";

                        const match = onclick.match(
                            /\.value\s*=\s*['"](\d+)['"]/
                        );

                        return match ? match[1] : null;
                    })
                    .filter((id) => id !== null)
            ),
        ];

        if (
            coincidencias.length > 0 &&
            ids.length === 0
        ) {
            throw cambioArca("Identificador del selector de empresas");
        }

        if (ids.length !== 1) {
            throw safe(
                `No se pudo determinar una única selección para ` +
                `el CUIT ${cuitBuscado}. ` +
                `Enlaces encontrados: ${coincidencias.length}. ` +
                `Identificadores ARCA: ${ids.join(", ") || "ninguno"}.`
            );
        }

        // Mantiene la compatibilidad con index[1]
        // utilizado en la siguiente solicitud.
        const index = [null, ids[0]];

        p = await request(`${FES}/mcmp/jsp/setearContribuyente.do?${new URLSearchParams({ idContribuyente: index[1] })}`);

        const textoSeleccionado = cheerio.load(p.html).text();

        if (!extraerCuits(textoSeleccionado).includes(cuitBuscado)) {
            throw safe("No se confirmó el CUIT seleccionado");
        }
        await request(`${FES}/mcmp/jsp/comprobantesRecibidos.do`);
    }
    async function ajax(params) { const r = await json(`${FES}/mcmp/jsp/ajax.do?${new URLSearchParams(params)}`, { headers: { Accept: 'application/json', 'X-Requested-With': 'XMLHttpRequest', Referer: `${FES}/mcmp/jsp/comprobantesRecibidos.do` } }); if (r.estado !== 'ok') throw safe('ARCA rechazó la consulta'); return r; }

    async function recibidosInterno(cuit, desde, hasta, onId) {
        const cuitEsperado = documento(cuit);
        const fecha = (s) => s.split("-").reverse().join("/");

        await abrir(cuitEsperado);

        const q = await ajax({
            f: "generarConsulta",
            t: "R",
            fechaEmision: `${fecha(desde)} - ${fecha(hasta)}`,
            cuitConsultada: cuitEsperado,
        });

        const id = q.datos?.idConsulta;

        if (!id) {
            throw safe(
                "Consulta enviada sin identificador. " +
                "Revisar historial de ARCA antes de repetir."
            );
        }

        await onId(String(id));

        for (let i = 0; i < 60; i++) {
            await new Promise((resolve) => setTimeout(resolve, 3000));

            await ajax({
                f: "estimarResultados",
                id: String(id),
            });

            const r = await ajax({
                f: "listaResultados",
                id: String(id),
                _: String(Date.now()),
            });

            const consulta = r.datos?.consulta;

            if (consulta?.error) {
                throw safe("ARCA informó un error de procesamiento");
            }

            // Esperar a que ARCA confirme que terminó.
            if (consulta?.estado !== "TE") {
                continue;
            }

            if (!Array.isArray(r.datos?.data)) {
                throw cambioArca("Estructura de resultados de la consulta");
            }

            if (
                documento(consulta.filtroCuitConsultada) !== cuitEsperado ||
                consulta.filtroFechaDesde !== fecha(desde) ||
                consulta.filtroFechaHasta !== fecha(hasta)
            ) {
                throw safe(
                    "La consulta devuelta no corresponde a los filtros enviados"
                );
            }

            const rows = r.datos.data;

            if (
                rows.length !== Number(r.recordsTotal) ||
                rows.length !== Number(r.recordsFiltered) ||
                rows.length !== Number(consulta.cantidadResultados)
            ) {
                throw safe(
                    "Respuesta parcial de ARCA: " +
                    "no se conciliará hasta revisar la paginación"
                );
            }

            const normal = rows.map((row) =>
                normalizarFila(row, cuitEsperado, desde, hasta, {
                    cuitConsultaVerificado: documento(
                        consulta.filtroCuitConsultada
                    ),
                })
            );

            if (
                new Set(normal.map(identidad)).size !== normal.length
            ) {
                throw safe(
                    "ARCA devolvió identidades repetidas; " +
                    "revisar antes de conciliar"
                );
            }

            // Finalizar: no volver a consultar una descarga completa.
            return normal;
        }

        throw safe(
            "Consulta pendiente en ARCA. Se conservó el ID; " +
            "no se repetirá automáticamente."
        );
    }
    async function recibidos(cuit, desde, hasta, onId) {
        try {
            return await recibidosInterno(cuit, desde, hasta, onId);
        } catch (error) {
            // Los errores de base de datos deben ser tratados
            // por ejecutar(), sin atribuirlos a una página de ARCA.
            const esErrorDB = String(error.name || "")
                .startsWith("Sequelize");

            if (esErrorDB) {
                throw error;
            }

            const esCambioEstructura =
                error.code === "ARCA_ESTRUCTURA_CAMBIADA";

            const mensaje =
                error instanceof PortalError || esCambioEstructura
                    ? error.message
                    : "No se pudo interpretar la respuesta de ARCA. " +
                    "Contactá al programador para revisar la integración.";

            const detalle = [
                mensaje,
                `Paso afectado: ${contextoActual.etapa}.`,
                contextoActual.pagina
                    ? `Página: ${contextoActual.pagina}`
                    : null,
            ]
                .filter(Boolean)
                .join("\n");

            console.error("[ARCA DIAGNOSTICO]", {
                etapa: contextoActual.etapa,
                pagina: contextoActual.pagina,
                nombre: error.name,
                codigo: error.code,
                mensajeOriginal: error.message,
            });

            const errorConContexto = new PortalError(detalle);
            errorConContexto.code = error.code;

            throw errorConContexto;
        }
    }

    return { recibidos };
}
