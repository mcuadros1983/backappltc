import fetch from "node-fetch";
import { XMLParser, XMLValidator } from "fast-xml-parser";
import { ArcaError } from "./arcaError.js";
import { timeoutArca } from "./arcaConfig.js";

const parser = new XMLParser({
  removeNSPrefix: true,
  ignoreAttributes: true,
  parseTagValue: false,
  trimValues: true,
  processEntities: true,
});

export function escapeXml(value) {
  return String(value).replaceAll("&", "&amp;").replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&apos;");
}

export function parseXml(xml) {
  if (typeof xml !== "string" || /<!DOCTYPE|<!ENTITY/i.test(xml) || XMLValidator.validate(xml) !== true) {
    throw new ArcaError("RESPUESTA_INVALIDA", "ARCA devolvió XML inválido.", 502);
  }
  try {
    return parser.parse(xml);
  } catch {
    throw new ArcaError("RESPUESTA_INVALIDA", "No se pudo interpretar la respuesta XML de ARCA.", 502);
  }
}

export function envelope(body) {
  return `<?xml version="1.0" encoding="UTF-8"?><soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/"><soapenv:Header/><soapenv:Body>${body}</soapenv:Body></soapenv:Envelope>`;
}

// Solo códigos acotados: nunca devolvemos faultstring, XML o tokens remotos al cliente.
function faultCode(fault) {
  const value = fault?.faultcode;
  return typeof value === "string" && /^[A-Za-z0-9_.:-]{1,120}$/.test(value) ? value : "SOAP_FAULT";
}

export async function sendSoap({ url, action, body, fetchImpl = fetch, timeoutMs = timeoutArca() }) {
  const abort = new AbortController();
  const timer = setTimeout(() => abort.abort(), timeoutMs);
  try {
    const response = await fetchImpl(url, {
      method: "POST",
      headers: { "Content-Type": "text/xml; charset=utf-8", SOAPAction: `"${action}"` },
      body: envelope(body),
      signal: abort.signal,
      redirect: "error",
      size: 4 * 1024 * 1024,
    });
    const xml = await response.text();
    const document = parseXml(xml);
    const soapBody = document?.Envelope?.Body;
    if (!soapBody || typeof soapBody !== "object") throw new ArcaError("RESPUESTA_INVALIDA", "ARCA no devolvió un sobre SOAP válido.", 502);
    if (soapBody.Fault) {
      const code = faultCode(soapBody.Fault);
      const message = code.includes("alreadyAuthenticated")
        ? "WSAA ya tiene un ticket vigente para este certificado. Recupere el ticket persistido o espere su vencimiento; no solicite uno nuevo repetidamente."
        : "ARCA rechazó la solicitud SOAP. Verifique el certificado, la habilitación del servicio y el ambiente.";
      throw new ArcaError("ARCA_SOAP_FAULT", message, 502, { codigo: code });
    }
    if (!response.ok) throw new ArcaError("ARCA_HTTP_ERROR", "ARCA respondió con un error HTTP.", 502, { http_status: response.status });
    return soapBody;
  } catch (error) {
    if (error instanceof ArcaError) throw error;
    if (abort.signal.aborted || error.name === "AbortError") throw new ArcaError("ARCA_TIMEOUT", "Se agotó el tiempo de espera de ARCA.", 504);
    throw new ArcaError("ARCA_CONEXION", "No se pudo conectar con ARCA.", 502);
  } finally {
    clearTimeout(timer);
  }
}
