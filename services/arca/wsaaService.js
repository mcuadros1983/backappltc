import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { mkdtemp, writeFile, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createHash, randomInt } from "node:crypto";
import { ENDPOINTS, ambienteValido } from "./arcaConfig.js";
import { ArcaError } from "./arcaError.js";
import { escapeXml, parseXml, sendSoap } from "./soapTransport.js";

const execFileAsync = promisify(execFile);
const SERVICE = "wslsp";

export function crearTra(now = new Date()) {
  const generation = new Date(now.getTime() - 5 * 60 * 1000).toISOString();
  const expiration = new Date(now.getTime() + 10 * 60 * 1000).toISOString();
  return `<?xml version="1.0" encoding="UTF-8"?><loginTicketRequest version="1.0"><header><uniqueId>${randomInt(1, 4294967295)}</uniqueId><generationTime>${generation}</generationTime><expirationTime>${expiration}</expirationTime></header><service>${SERVICE}</service></loginTicketRequest>`;
}

export async function firmarTra(tra, credentials) {
  const dir = await mkdtemp(join(tmpdir(), "arca-wsaa-"));
  try {
    const cert = join(dir, "certificate.pem");
    const key = join(dir, "private.pem");
    const request = join(dir, "request.xml");
    const cms = join(dir, "request.cms");
    await writeFile(cert, credentials.certPem, { mode: 0o600 });
    await writeFile(key, credentials.keyPem, { mode: 0o600 });
    await writeFile(request, tra, { mode: 0o600 });
    // CMS adjunto (no detached), formato DER. No shell ni claves en argumentos.
    await execFileAsync("openssl", ["cms", "-sign", "-in", request, "-signer", cert,
      "-inkey", key, "-out", cms, "-outform", "DER", "-nodetach", "-nosmimecap", "-md", "sha256"],
    { timeout: 15000, maxBuffer: 1024 * 1024 });
    return (await readFile(cms)).toString("base64");
  } catch {
    throw new ArcaError("FIRMA_WSAA", "No se pudo firmar el ticket. Verifique OpenSSL y las credenciales del servidor.", 503);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}

export function validarTicket(ticket, now = new Date()) {
  const generation = Date.parse(ticket?.generationTime);
  const expiration = Date.parse(ticket?.expirationTime);
  if (typeof ticket?.token !== "string" || !ticket.token.trim() || typeof ticket?.sign !== "string" || !ticket.sign.trim()
      || !Number.isFinite(generation) || !Number.isFinite(expiration) || generation > expiration
      || generation > now.getTime() + 5 * 60 * 1000 || expiration <= now.getTime()) {
    throw new ArcaError("TICKET_INVALIDO", "WSAA devolvió un ticket incompleto o vencido. Verifique la hora del servidor.", 502);
  }
  return ticket;
}

export function ticketCacheKey(ambiente, fingerprint) {
  // Un certificado puede representar varias empresas; WSAA emite por certificado/servicio.
  return createHash("sha256").update(`${ambiente}|${SERVICE}|${fingerprint}`).digest("hex");
}

export function createWsaaService({ store, soap = sendSoap, signer = firmarTra, clock = () => new Date() }) {
  async function solicitarTicket(ambiente, credentials) {
    const cms = await signer(crearTra(clock()), credentials);
    const body = `<wsaa:loginCms xmlns:wsaa="http://wsaa.view.sua.dvadac.desein.afip.gov"><wsaa:in0>${escapeXml(cms)}</wsaa:in0></wsaa:loginCms>`;
    const response = await soap({ url: ENDPOINTS[ambiente].wsaa, action: "", body });
    const xml = response?.loginCmsResponse?.loginCmsReturn;
    const result = parseXml(xml)?.loginTicketResponse;
    return validarTicket({
      token: result?.credentials?.token,
      sign: result?.credentials?.sign,
      generationTime: result?.header?.generationTime,
      expirationTime: result?.header?.expirationTime,
    }, clock());
  }

  return {
    async getTicket(ambiente, credentials) {
      ambienteValido(ambiente);
      const cacheKey = ticketCacheKey(ambiente, credentials.fingerprint);
      // La caché persistente toma un lock por certificado y ambiente antes de renovar.
      return store.withLock(cacheKey, async cache => {
        const stored = await cache.get();
        if (stored && Date.parse(stored.expirationTime) > clock().getTime()) {
          return validarTicket(stored, clock());
        }
        const ticket = await solicitarTicket(ambiente, credentials);
        await cache.set(ticket);
        return ticket;
      });
    },
  };
}
