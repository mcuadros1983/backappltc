import { ENDPOINTS, ambienteValido, entero } from "./arcaConfig.js";
import { escapeXml, sendSoap } from "./soapTransport.js";
import { ArcaError } from "./arcaError.js";

const NS = "http://serviciosjava.afip.gob.ar/wslsp/";
export const CATALOGOS = Object.freeze({
  provincias: ["consultarProvincias", "ConsultarProvincias"],
  operaciones: ["consultarOperaciones", "ConsultarOperaciones"],
  "tipos-comprobante": ["consultarTiposComprobante", "ConsultarTiposComprobante"],
  "tipos-liquidacion": ["consultarTiposLiquidacion", "ConsultarTiposLiquidacion"],
  caracteres: ["consultarCaracteresParticipante", "ConsultarCaracteresParticipante"],
  categorias: ["consultarCategorias", "ConsultarCategorias"],
  motivos: ["consultarMotivos", "ConsultarMotivos"],
  razas: ["consultarRazas", "ConsultarRazas"],
  cortes: ["consultarCortes", "ConsultarCortes"],
  gastos: ["consultarGastos", "ConsultarGastos"],
  tributos: ["consultarTributos", "ConsultarTributos"],
});

function extraerRespuesta(body, element) {
  const response = body?.[element]?.respuesta;
  if (response === undefined || response === null || (response !== "" && typeof response !== "object")) {
    throw new ArcaError("RESPUESTA_INVALIDA", "WSLSP devolvió una respuesta inesperada.", 502);
  }
  const errors = response?.errores?.error;
  const list = errors == null || errors === "" ? [] : Array.isArray(errors) ? errors : [errors];
  if (list.length) {
    const codes = list.map(error => String(error?.codigo ?? "")).filter(code => /^\d{1,10}$/.test(code));
    throw new ArcaError("ARCA_NEGOCIO", "WSLSP rechazó la consulta. Verifique los parámetros y la habilitación de la empresa.", 422, { codigos: codes });
  }
  return response === "" ? {} : response;
}

export function normalizarCatalogo(response) {
  const result = {};
  for (const [name, value] of Object.entries(response)) {
    if (name === "metadata") result.metadata = value;
    else if (name !== "errores") result[name] = value == null || value === "" ? [] : Array.isArray(value) ? value : [value];
  }
  return result;
}

export function createWslspService({ wsaa, soap = sendSoap }) {
  async function consultar(context, method, element, solicitud = "") {
    ambienteValido(context.ambiente);
    const ticket = await wsaa.getTicket(context.ambiente, context.credentials);
    const auth = `<auth><token>${escapeXml(ticket.token)}</token><sign>${escapeXml(ticket.sign)}</sign><cuit>${escapeXml(context.cuit)}</cuit></auth>`;
    const body = `<wsl:${element}Req xmlns:wsl="${NS}">${auth}${solicitud ? `<solicitud>${solicitud}</solicitud>` : ""}</wsl:${element}Req>`;
    const response = await soap({ url: ENDPOINTS[context.ambiente].wslsp, action: `${NS}${method}`, body });
    return extraerRespuesta(response, `${element}Resp`);
  }

  return {
    async dummy(ambiente = "homologacion") {
      ambienteValido(ambiente);
      // Según WSDL y manual, dummy tiene un SOAP Body vacío y no requiere WSAA.
      const response = await soap({ url: ENDPOINTS[ambiente].wslsp, action: `${NS}dummy`, body: "" });
      return extraerRespuesta(response, response.DummyResp ? "DummyResp" : "dummyResp");
    },
    async puntosVenta(context) {
      return normalizarCatalogo(await consultar(context, "consultarPuntosVenta", "ConsultarPuntosVenta"));
    },
    async catalogo(context, name) {
      if (!Object.hasOwn(CATALOGOS, name)) throw new ArcaError("CATALOGO_INVALIDO", "El catálogo solicitado no está disponible.");
      const [method, element] = CATALOGOS[name];
      return normalizarCatalogo(await consultar(context, method, element));
    },
    async localidades(context, provincia) {
      const code = entero(provincia, "provincia", 0, 99);
      return normalizarCatalogo(await consultar(context, "consultarLocalidadesPorProvincia", "ConsultarLocalidadesPorProvincia", `<codProvincia>${code}</codProvincia>`));
    },
    async categoriasPorMotivo(context, especie, motivo) {
      const species = entero(especie, "especie", 1, 3);
      const reason = entero(motivo, "motivo", 1, 299);
      return normalizarCatalogo(await consultar(context, "consultarCategoriasPorMotivo", "ConsultarCategoriasPorMotivo", `<especie>${species}</especie><motivo>${reason}</motivo>`));
    },
    async ultimoComprobante(context, puntoVenta, tipoComprobante) {
      const pv = entero(puntoVenta, "punto_venta", 1, 99999);
      const type = entero(tipoComprobante, "tipo_comprobante", 1, 999);
      const response = await consultar(context, "consultarUltimoNroComprobantePorPtoVta", "ConsultarUltimoNroComprobantePorPtoVta", `<puntoVenta>${pv}</puntoVenta><tipoComprobante>${type}</tipoComprobante>`);
      const last = entero(response.nroComprobante, "nroComprobante devuelto por ARCA", 0, Number.MAX_SAFE_INTEGER - 1);
      return { punto_venta: pv, tipo_comprobante: type, ultimo_numero: last, siguiente_numero: last + 1, metadata: response.metadata };
    },
  };
}
