import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";
import { ArcaError } from "./arcaError.js";

export function ticketKey(env = process.env) {
  const value = env.ARCA_TICKET_ENCRYPTION_KEY;
  if (typeof value !== "string" || !/^[A-Za-z0-9+/]{43}=$/.test(value) || Buffer.from(value, "base64").length !== 32) {
    throw new ArcaError("CIFRADO_NO_CONFIGURADO", "Configure ARCA_TICKET_ENCRYPTION_KEY con 32 bytes aleatorios en base64.", 503);
  }
  return Buffer.from(value, "base64");
}

export function encryptTicket(ticket, cacheKey, key) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  cipher.setAAD(Buffer.from(cacheKey));
  const content = Buffer.concat([cipher.update(JSON.stringify(ticket), "utf8"), cipher.final()]);
  return ["v1", iv.toString("base64"), cipher.getAuthTag().toString("base64"), content.toString("base64")].join(".");
}

export function decryptTicket(content, cacheKey, key) {
  try {
    const [version, iv, tag, ciphertext, extra] = content.split(".");
    if (version !== "v1" || extra || !iv || !tag || !ciphertext) throw new Error("Invalid ciphertext");
    const decipher = createDecipheriv("aes-256-gcm", key, Buffer.from(iv, "base64"));
    decipher.setAAD(Buffer.from(cacheKey));
    decipher.setAuthTag(Buffer.from(tag, "base64"));
    return JSON.parse(Buffer.concat([decipher.update(Buffer.from(ciphertext, "base64")), decipher.final()]).toString("utf8"));
  } catch {
    throw new ArcaError("TICKET_NO_RECUPERABLE", "No se pudo descifrar el ticket ARCA. Verifique que la clave de cifrado sea la misma en todas las instancias.", 503);
  }
}
