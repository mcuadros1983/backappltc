import { readFile } from "node:fs/promises";
import { createPrivateKey, createPublicKey, X509Certificate } from "node:crypto";
import { ArcaError } from "./arcaError.js";

export const ENDPOINTS = Object.freeze({
  homologacion: Object.freeze({
    wsaa: "https://wsaahomo.afip.gov.ar/ws/services/LoginCms",
    wslsp: "https://fwshomo.afip.gov.ar/wslsp/LspService",
  }),
  produccion: Object.freeze({
    wsaa: "https://wsaa.afip.gov.ar/ws/services/LoginCms",
    wslsp: "https://serviciosjava.afip.gob.ar/wslsp/LspService",
  }),
});

export function ambienteValido(value = "homologacion", env = process.env) {
  if (typeof value !== "string" || !Object.hasOwn(ENDPOINTS, value)) {
    throw new ArcaError("AMBIENTE_INVALIDO", "El ambiente debe ser homologacion o produccion.");
  }
  if (value === "produccion" && env.ARCA_ALLOW_PRODUCTION_QUERIES !== "true") {
    throw new ArcaError("PRODUCCION_DESHABILITADA", "Las consultas de producción no están habilitadas en el servidor.", 403);
  }
  return value;
}

export function entero(value, name, min = 1, max = 2147483647) {
  if (!["string", "number"].includes(typeof value) || !/^[0-9]+$/.test(String(value)) || !Number.isSafeInteger(Number(value)) || Number(value) < min || Number(value) > max) {
    throw new ArcaError("PARAMETRO_INVALIDO", `${name} debe ser un entero entre ${min} y ${max}.`);
  }
  return Number(value);
}

export function normalizarCuit(value) {
  const input = String(value ?? "").trim();
  if (!/^(\d{11}|\d{2}-\d{8}-\d)$/.test(input)) {
    throw new ArcaError("CUIT_INVALIDO", "La empresa debe tener un CUIT de 11 dígitos válido.");
  }
  const digits = input.replaceAll("-", "");
  const weights = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2];
  const mod = 11 - weights.reduce((sum, weight, i) => sum + Number(digits[i]) * weight, 0) % 11;
  const check = mod === 11 ? 0 : mod === 10 ? 9 : mod;
  if (check !== Number(digits[10])) throw new ArcaError("CUIT_INVALIDO", "El dígito verificador del CUIT de la empresa es incorrecto.");
  return digits;
}

export function validarReferencia(value) {
  if (typeof value !== "string" || !/^[A-Z][A-Z0-9_]{0,63}$/.test(value)) {
    throw new ArcaError("REFERENCIA_INVALIDA", "credenciales_ref debe usar mayúsculas, números y guion bajo (máximo 64 caracteres).");
  }
  return value;
}

export function validarConfiguracion(body) {
  const allowed = ["credenciales_ref", "punto_venta", "activa"];
  if (!body || typeof body !== "object" || Array.isArray(body) || Object.keys(body).some(key => !allowed.includes(key))) {
    throw new ArcaError("CONFIGURACION_INVALIDA", "Solo se admiten credenciales_ref, punto_venta y activa. Las claves y certificados se configuran en el servidor.");
  }
  if (typeof body.activa !== "boolean") throw new ArcaError("CONFIGURACION_INVALIDA", "activa debe ser true o false.");
  return {
    credenciales_ref: validarReferencia(body.credenciales_ref),
    punto_venta: body.punto_venta == null ? null : entero(body.punto_venta, "punto_venta", 1, 99999),
    activa: body.activa,
  };
}

async function leerPem(prefix, kind, env) {
  const inline = env[`${prefix}_${kind}_PEM`];
  const file = env[`${prefix}_${kind}_PATH`];
  if (inline && file) throw new ArcaError("CREDENCIALES_INVALIDAS", `Configure una sola fuente para ${kind}.`, 503);
  if (!inline && !file) throw new ArcaError("CREDENCIALES_FALTANTES", `Falta ${prefix}_${kind}_PEM o ${prefix}_${kind}_PATH en el servidor.`, 503);
  try {
    return inline ? inline.replace(/\\n/g, "\n").trim() : await readFile(file, "utf8");
  } catch {
    throw new ArcaError("CREDENCIALES_INVALIDAS", `No se pudo leer el archivo de ${kind}.`, 503);
  }
}

export async function cargarCredenciales(ref, env = process.env, now = new Date()) {
  const prefix = `ARCA_${validarReferencia(ref)}`;
  const certPem = await leerPem(prefix, "CERT", env);
  const keyPem = await leerPem(prefix, "KEY", env);
  let cert;
  let key;
  try {
    cert = new X509Certificate(certPem);
    key = createPrivateKey({ key: keyPem, passphrase: env[`${prefix}_KEY_PASSPHRASE`] });
    if (!cert.publicKey.export({ type: "spki", format: "der" }).equals(createPublicKey(key).export({ type: "spki", format: "der" }))) {
      throw new Error("Certificate and key mismatch");
    }
  } catch {
    throw new ArcaError("CREDENCIALES_INVALIDAS", "El certificado y la clave privada no son válidos o no corresponden entre sí.", 503);
  }
  if (now < new Date(cert.validFrom) || now >= new Date(cert.validTo)) {
    throw new ArcaError("CERTIFICADO_VENCIDO", "El certificado ARCA está vencido o aún no está vigente.", 503);
  }
  return {
    certPem,
    // Exportación temporal sin contraseña, escrita únicamente con permisos 0600.
    keyPem: key.export({ type: "pkcs8", format: "pem" }).toString(),
    fingerprint: cert.fingerprint256,
    valido_desde: new Date(cert.validFrom).toISOString(),
    valido_hasta: new Date(cert.validTo).toISOString(),
  };
}

export function timeoutArca(env = process.env) {
  return env.ARCA_TIMEOUT_MS == null ? 30000 : entero(env.ARCA_TIMEOUT_MS, "ARCA_TIMEOUT_MS", 1000, 60000);
}
