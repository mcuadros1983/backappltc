import test, { before, after } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, readFile, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { randomBytes } from "node:crypto";
import { XMLParser } from "fast-xml-parser";
import { ambienteValido, cargarCredenciales, entero, normalizarCuit, validarConfiguracion } from "../../services/arca/arcaConfig.js";
import { escapeXml, envelope, parseXml, sendSoap } from "../../services/arca/soapTransport.js";
import { ticketKey, encryptTicket, decryptTicket } from "../../services/arca/ticketCrypto.js";
import { crearTra, firmarTra, createWsaaService, ticketCacheKey } from "../../services/arca/wsaaService.js";
import { CATALOGOS, createWslspService } from "../../services/arca/wslspService.js";

const exec = promisify(execFile);
let dir;
let credentials;
let certPem;
let keyPem;
before(async () => {
  dir = await mkdtemp(join(tmpdir(), "arca-tests-"));
  await exec("openssl", ["req", "-x509", "-newkey", "rsa:2048", "-nodes", "-days", "1",
    "-subj", "/CN=ARCA test fixture", "-keyout", join(dir, "key.pem"), "-out", join(dir, "cert.pem")]);
  certPem = await readFile(join(dir, "cert.pem"), "utf8");
  keyPem = await readFile(join(dir, "key.pem"), "utf8");
  credentials = await cargarCredenciales("TEST", { ARCA_TEST_CERT_PEM: certPem, ARCA_TEST_KEY_PEM: keyPem });
});
after(async () => rm(dir, { recursive: true, force: true }));

function response(xml, ok = true, status = 200) {
  return { ok, status, text: async () => xml };
}
const now = new Date("2026-09-29T21:00:00Z");
const ticket = {
  token: "PRIVATE_TOKEN", sign: "PRIVATE_SIGN",
  generationTime: "2026-09-29T20:59:00Z", expirationTime: "2026-09-30T09:00:00Z",
};
function ticketXml(value = ticket) {
  return `<loginTicketResponse version="1.0"><header><generationTime>${value.generationTime}</generationTime><expirationTime>${value.expirationTime}</expirationTime></header><credentials><token>${value.token}</token><sign>${value.sign}</sign></credentials></loginTicketResponse>`;
}

// Simula almacenamiento compartido, cifrado y serialización por certificado.
function memoryStore() {
  const records = new Map();
  const queues = new Map();
  const key = randomBytes(32);
  return {
    records,
    async withLock(id, callback) {
      const previous = queues.get(id) ?? Promise.resolve();
      let release;
      const current = new Promise(resolve => { release = resolve; });
      queues.set(id, current);
      await previous;
      try {
        return await callback({
          get: async () => records.has(id) ? decryptTicket(records.get(id), id, key) : null,
          set: async value => records.set(id, encryptTicket(value, id, key)),
        });
      } finally {
        release();
        if (queues.get(id) === current) queues.delete(id);
      }
    },
  };
}

test("valida CUIT y conserva el formato fiscal sin guiones", () => {
  assert.equal(normalizarCuit("30-60989525-6"), "30609895256");
  assert.throws(() => normalizarCuit("30-60989525-7"), { code: "CUIT_INVALIDO" });
  assert.throws(() => normalizarCuit("30x60989525x6"), { code: "CUIT_INVALIDO" });
});

test("homologación predeterminada y producción exige habilitación explícita", () => {
  assert.equal(ambienteValido(undefined, {}), "homologacion");
  assert.throws(() => ambienteValido("produccion", {}), { code: "PRODUCCION_DESHABILITADA" });
  assert.equal(ambienteValido("produccion", { ARCA_ALLOW_PRODUCTION_QUERIES: "true" }), "produccion");
  for (const value of ["__proto__", "constructor", [], "https://example.com"]) {
    assert.throws(() => ambienteValido(value, {}), { code: "AMBIENTE_INVALIDO" });
  }
});

test("configuración valida tipos y rechaza claves o destinos proporcionados por HTTP", () => {
  assert.deepEqual(validarConfiguracion({ credenciales_ref: "ELMANGO_HOMO", activa: false, punto_venta: "00011" }),
    { credenciales_ref: "ELMANGO_HOMO", activa: false, punto_venta: 11 });
  for (const body of [
    { credenciales_ref: "TEST", activa: "false" },
    { credenciales_ref: "../private", activa: true },
    { credenciales_ref: "TEST", activa: true, key: "secret" },
    { credenciales_ref: "TEST", activa: false, endpoint: "http://localhost" },
  ]) assert.throws(() => validarConfiguracion(body));
  for (const value of [undefined, "1.1", "1e3", -1, true, [1]]) assert.throws(() => entero(value, "id"));
});

test("carga PEM desde variables y archivos, verifica vigencia y correspondencia", async () => {
  assert.ok(credentials.fingerprint);
  const fileCredentials = await cargarCredenciales("TEST", { ARCA_TEST_CERT_PATH: join(dir, "cert.pem"), ARCA_TEST_KEY_PATH: join(dir, "key.pem") });
  assert.equal(fileCredentials.fingerprint, credentials.fingerprint);
  const escaped = await cargarCredenciales("TEST", { ARCA_TEST_CERT_PEM: certPem.replaceAll("\n", "\\n"), ARCA_TEST_KEY_PEM: keyPem.replaceAll("\n", "\\n") });
  assert.equal(escaped.fingerprint, credentials.fingerprint);
  await assert.rejects(cargarCredenciales("TEST", {}), { code: "CREDENCIALES_FALTANTES" });
  await assert.rejects(cargarCredenciales("TEST", { ARCA_TEST_CERT_PEM: certPem, ARCA_TEST_CERT_PATH: "elsewhere", ARCA_TEST_KEY_PEM: keyPem }), { code: "CREDENCIALES_INVALIDAS" });
  await assert.rejects(cargarCredenciales("TEST", { ARCA_TEST_CERT_PEM: certPem, ARCA_TEST_KEY_PEM: "bad" }), { code: "CREDENCIALES_INVALIDAS" });
  await assert.rejects(cargarCredenciales("TEST", { ARCA_TEST_CERT_PEM: certPem, ARCA_TEST_KEY_PEM: keyPem }, new Date("2100-01-01")), { code: "CERTIFICADO_VENCIDO" });
});

test("firma CMS real contiene el TRA y se verifica criptográficamente con OpenSSL", async () => {
  const tra = crearTra(now);
  const cms = await firmarTra(tra, credentials);
  await writeFile(join(dir, "signed.der"), Buffer.from(cms, "base64"));
  await exec("openssl", ["cms", "-verify", "-inform", "DER", "-in", join(dir, "signed.der"), "-noverify", "-out", join(dir, "verified.xml")]);
  const verified = await readFile(join(dir, "verified.xml"), "utf8");
  const document = parseXml(verified).loginTicketRequest;
  assert.equal(document.service, "wslsp");
  assert.equal(document.header.generationTime, "2026-09-29T20:55:00.000Z");
  assert.equal(document.header.expirationTime, "2026-09-29T21:10:00.000Z");
});

test("AES-GCM cifra el ticket y detecta manipulación o intercambio de certificado", () => {
  const key = randomBytes(32);
  const encrypted = encryptTicket(ticket, "company-key", key);
  assert.ok(!encrypted.includes(ticket.token));
  assert.deepEqual(decryptTicket(encrypted, "company-key", key), ticket);
  assert.throws(() => decryptTicket(encrypted, "different-key", key), { code: "TICKET_NO_RECUPERABLE" });
  assert.throws(() => decryptTicket(encrypted, "company-key", randomBytes(32)), { code: "TICKET_NO_RECUPERABLE" });
  assert.throws(() => ticketKey({}), { code: "CIFRADO_NO_CONFIGURADO" });
  assert.deepEqual(ticketKey({ ARCA_TICKET_ENCRYPTION_KEY: key.toString("base64") }), key);
});

test("SOAP escapa valores y conserva ceros iniciales en códigos", async () => {
  const body = await sendSoap({ url: "https://example.invalid", action: "test", body: "",
    fetchImpl: async (_, options) => {
      assert.equal(options.headers.SOAPAction, '"test"');
      assert.equal(options.redirect, "error");
      return response(envelope("<a:Result xmlns:a=\"urn:test\"><codigo>00011</codigo></a:Result>"));
    },
  });
  assert.equal(body.Result.codigo, "00011");
  assert.equal(escapeXml("<&'\""), "&lt;&amp;&apos;&quot;");
});

test("SOAP rechaza XML inválido, DTD y respuestas ajenas al protocolo", async () => {
  for (const xml of ["<bad>", "<html>proxy error</html>", '<!DOCTYPE x [<!ENTITY a "boom">]><x>&a;</x>']) {
    await assert.rejects(sendSoap({ url: "https://example.invalid", body: "", action: "", fetchImpl: async () => response(xml) }), { code: "RESPUESTA_INVALIDA" });
  }
});

test("SOAP informa fallos sin copiar tokens ni faultstring al cliente", async () => {
  const xml = envelope("<Fault><faultcode>ns:coe.alreadyAuthenticated</faultcode><faultstring>PRIVATE_TOKEN PRIVATE_SIGN</faultstring></Fault>");
  await assert.rejects(sendSoap({ url: "https://example.invalid", body: "", action: "", fetchImpl: async () => response(xml, false, 500) }), error => {
    assert.equal(error.code, "ARCA_SOAP_FAULT");
    assert.equal(error.details.codigo, "ns:coe.alreadyAuthenticated");
    assert.ok(!JSON.stringify(error).includes("PRIVATE_TOKEN"));
    return true;
  });
});

test("SOAP distingue timeout y error de conexión", async () => {
  await assert.rejects(sendSoap({ url: "https://example.invalid", body: "", action: "", timeoutMs: 5,
    fetchImpl: (_, options) => new Promise((_, reject) => options.signal.addEventListener("abort", () => reject(new Error("aborted")))),
  }), { code: "ARCA_TIMEOUT" });
  await assert.rejects(sendSoap({ url: "https://example.invalid", body: "", action: "", fetchImpl: async () => { throw new Error("private detail"); } }), { code: "ARCA_CONEXION" });
});

test("WSAA firma para wslsp, parsea el TA escapado, reutiliza caché tras reinicio y serializa solicitudes", async () => {
  const store = memoryStore();
  let calls = 0;
  const soap = args => sendSoap({ ...args, fetchImpl: async (url, options) => {
    calls++;
    assert.equal(url, "https://wsaahomo.afip.gov.ar/ws/services/LoginCms");
    const request = parseXml(options.body).Envelope.Body.loginCms;
    assert.equal(request.in0, "TEST_CMS");
    return response(envelope(`<loginCmsResponse xmlns="http://wsaa.view.sua.dvadac.desein.afip.gov"><loginCmsReturn>${escapeXml(ticketXml())}</loginCmsReturn></loginCmsResponse>`));
  } });
  const opts = { store, clock: () => now, soap, signer: async tra => {
    assert.equal(parseXml(tra).loginTicketRequest.service, "wslsp");
    return "TEST_CMS";
  } };
  const service = createWsaaService(opts);
  const result = await Promise.all(Array.from({ length: 5 }, () => service.getTicket("homologacion", credentials)));
  assert.deepEqual(result[0], ticket);
  assert.equal(calls, 1);
  assert.deepEqual(await createWsaaService(opts).getTicket("homologacion", credentials), ticket);
  assert.equal(calls, 1);
  assert.notEqual(ticketCacheKey("produccion", credentials.fingerprint), ticketCacheKey("homologacion", credentials.fingerprint));
  assert.notEqual(ticketCacheKey("homologacion", "other-cert"), ticketCacheKey("homologacion", credentials.fingerprint));
});

test("WSAA renueva únicamente tickets vencidos y no almacena respuestas incompletas", async () => {
  const store = memoryStore();
  const id = ticketCacheKey("homologacion", credentials.fingerprint);
  await store.withLock(id, cache => cache.set({ ...ticket, expirationTime: "2026-09-29T20:00:00Z" }));
  let calls = 0;
  const service = createWsaaService({ store, clock: () => now, signer: async () => "CMS", soap: async () => {
    calls++;
    return { loginCmsResponse: { loginCmsReturn: ticketXml() } };
  } });
  assert.deepEqual(await service.getTicket("homologacion", credentials), ticket);
  assert.equal(calls, 1);
  const emptyStore = memoryStore();
  const invalid = createWsaaService({ store: emptyStore, clock: () => now, signer: async () => "CMS",
    soap: async () => ({ loginCmsResponse: { loginCmsReturn: "<loginTicketResponse/>" } }),
  });
  await assert.rejects(invalid.getTicket("homologacion", credentials), { code: "TICKET_INVALIDO" });
  assert.equal(emptyStore.records.size, 0);
});

function wslspHarness(responder) {
  let authCalls = 0;
  const service = createWslspService({
    wsaa: { getTicket: async () => { authCalls++; return ticket; } },
    soap: args => sendSoap({ ...args, fetchImpl: async (url, options) => {
      assert.equal(url, "https://fwshomo.afip.gov.ar/wslsp/LspService");
      return response(envelope(await responder(parseXml(options.body).Envelope.Body, options)));
    } }),
  });
  return { service, authCalls: () => authCalls };
}
const context = { ambiente: "homologacion", cuit: "30609895256", credentials: {} };

test("dummy utiliza Body vacío y no solicita autenticación", async () => {
  const harness = wslspHarness((body, options) => {
    assert.equal(body, "");
    assert.equal(options.headers.SOAPAction, '"http://serviciosjava.afip.gob.ar/wslsp/dummy"');
    return "<DummyResp><respuesta><appserver>OK</appserver><authserver>OK</authserver><dbserver>OK</dbserver></respuesta></DummyResp>";
  });
  assert.equal((await harness.service.dummy()).dbserver, "OK");
  assert.equal(harness.authCalls(), 0);
});

test("WSLSP envía auth y convierte un punto de venta único a lista", async () => {
  const harness = wslspHarness(body => {
    assert.deepEqual(body.ConsultarPuntosVentaReq.auth, { token: ticket.token, sign: ticket.sign, cuit: context.cuit });
    return "<ConsultarPuntosVentaResp><respuesta><puntoVenta><codigo>11</codigo><descripcion>EL MANGO</descripcion></puntoVenta></respuesta></ConsultarPuntosVentaResp>";
  });
  assert.deepEqual(await harness.service.puntosVenta(context), { puntoVenta: [{ codigo: "11", descripcion: "EL MANGO" }] });
});

test("todos los catálogos emplean las operaciones explícitas del WSDL", async () => {
  const harness = wslspHarness((body, options) => {
    const [name] = Object.keys(body);
    const definition = Object.values(CATALOGOS).find(([, element]) => name === `${element}Req`);
    assert.ok(definition);
    assert.equal(options.headers.SOAPAction, `"http://serviciosjava.afip.gob.ar/wslsp/${definition[0]}"`);
    return `<${definition[1]}Resp><respuesta/></${definition[1]}Resp>`;
  });
  for (const name of Object.keys(CATALOGOS)) assert.deepEqual(await harness.service.catalogo(context, name), {});
  await assert.rejects(harness.service.catalogo(context, "constructor"), { code: "CATALOGO_INVALIDO" });
});

test("último comprobante usa códigos fiscales, admite cero y calcula el próximo sin reservarlo", async () => {
  const harness = wslspHarness(body => {
    assert.deepEqual(body.ConsultarUltimoNroComprobantePorPtoVtaReq.solicitud, { puntoVenta: "11", tipoComprobante: "180" });
    return "<ConsultarUltimoNroComprobantePorPtoVtaResp><respuesta><nroComprobante>0</nroComprobante></respuesta></ConsultarUltimoNroComprobantePorPtoVtaResp>";
  });
  const result = await harness.service.ultimoComprobante(context, "00011", 180);
  assert.equal(result.ultimo_numero, 0);
  assert.equal(result.siguiente_numero, 1);
  await assert.rejects(harness.service.ultimoComprobante(context, "1<injected>", 180), { code: "PARAMETRO_INVALIDO" });
});

test("localidades y categorías por motivo validan y respetan el orden del contrato", async () => {
  const harness = wslspHarness(body => {
    if (body.ConsultarLocalidadesPorProvinciaReq) {
      assert.deepEqual(body.ConsultarLocalidadesPorProvinciaReq.solicitud, { codProvincia: "0" });
      return "<ConsultarLocalidadesPorProvinciaResp><respuesta/></ConsultarLocalidadesPorProvinciaResp>";
    }
    assert.deepEqual(body.ConsultarCategoriasPorMotivoReq.solicitud, { especie: "1", motivo: "299" });
    return "<ConsultarCategoriasPorMotivoResp><respuesta/></ConsultarCategoriasPorMotivoResp>";
  });
  assert.deepEqual(await harness.service.localidades(context, 0), {});
  assert.deepEqual(await harness.service.categoriasPorMotivo(context, 1, 299), {});
  await assert.rejects(harness.service.categoriasPorMotivo(context, 4, 1), { code: "PARAMETRO_INVALIDO" });
});

test("errores de negocio se detectan aunque HTTP sea 200 y no se confunden con listas vacías", async () => {
  const harness = wslspHarness(() => "<ConsultarPuntosVentaResp><respuesta><errores><error><codigo>1009</codigo><descripcion>PRIVATE_TOKEN</descripcion></error></errores></respuesta></ConsultarPuntosVentaResp>");
  await assert.rejects(harness.service.puntosVenta(context), error => {
    assert.equal(error.code, "ARCA_NEGOCIO");
    assert.deepEqual(error.details, { codigos: ["1009"] });
    assert.ok(!JSON.stringify(error).includes("PRIVATE_TOKEN"));
    return true;
  });
});

test("catálogos y SOAPAction coinciden con el WSDL oficial capturado de homologación", async () => {
  const parser = new XMLParser({ removeNSPrefix: true, ignoreAttributes: false });
  const wsdl = parser.parse(await readFile(new URL("./fixtures/wslsp-homologacion.wsdl", import.meta.url), "utf8")).definitions;
  const operations = new Map(wsdl.binding.operation.map(op => [op["@_name"], op.operation["@_soapAction"]]));
  const elements = new Set(wsdl.types.schema.element.map(el => el["@_name"]));
  for (const [method, element] of Object.values(CATALOGOS)) {
    assert.equal(operations.get(method), `http://serviciosjava.afip.gob.ar/wslsp/${method}`);
    assert.ok(elements.has(`${element}Req`));
    assert.ok(elements.has(`${element}Resp`));
  }
  assert.equal(operations.get("dummy"), "http://serviciosjava.afip.gob.ar/wslsp/dummy");
});

test("contratos oficiales exigen solicitud ordenada en WSLSP y campo in0 calificado en WSAA", async () => {
  const parser = new XMLParser({ removeNSPrefix: true, ignoreAttributes: false });
  const wsdl = parser.parse(await readFile(new URL("./fixtures/wslsp-homologacion.wsdl", import.meta.url), "utf8")).definitions;
  const schema = wsdl.types.schema;
  const type = schema.complexType.find(t => t["@_name"] === "ConsultarUltNroComprobantePorPtoVtaSolicitud");
  assert.deepEqual(type.sequence.element.map(el => el["@_name"]), ["puntoVenta", "tipoComprobante"]);
  const wsaa = parser.parse(await readFile(new URL("./fixtures/wsaa-homologacion.wsdl", import.meta.url), "utf8")).definitions;
  const loginSchema = wsaa.types.schema.find(s => s["@_targetNamespace"] === "http://wsaa.view.sua.dvadac.desein.afip.gov");
  assert.equal(loginSchema["@_elementFormDefault"], "qualified");
  const login = loginSchema.element.find(el => el["@_name"] === "loginCms");
  assert.equal(login.complexType.sequence.element["@_name"], "in0");
});
