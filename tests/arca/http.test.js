import test, { before, after } from "node:test";
import assert from "node:assert/strict";
import express from "express";
import { ArcaError } from "../../services/arca/arcaError.js";

// Solo construye modelos: nunca conecta a la base real del ERP.
process.env.DB_DIALECT ??= "postgres";
const { createArcaRouter } = await import("../../routes/arca/arcaRoute.js");
const { createTicketStore } = await import("../../services/arca/ticketStore.js");
const { sequelize } = await import("../../config/database.js");

let server;
let base;
let calls = [];
const service = {
  dummy: async environment => { calls.push(["dummy", environment]); return { disponible: true }; },
  configuracion: async (...args) => { calls.push(["configuracion", ...args]); return { configuracion: null }; },
  guardarConfiguracion: async (...args) => { calls.push(["guardar", ...args]); return { configuracion: args[2] }; },
  autenticar: async (...args) => { calls.push(["autenticar", ...args]); return { autenticado: true, ticket_vencimiento: "2026-09-30T00:00:00Z" }; },
  puntosVenta: async () => ({ puntoVenta: [] }),
  catalogo: async (_, __, name) => {
    if (name === "error-interno") throw new Error("PRIVATE_KEY PRIVATE_TOKEN");
    if (name === "error-arca") throw new ArcaError("ARCA_NEGOCIO", "Consulta rechazada", 422, { codigos: ["1009"] });
    return { categoria: [] };
  },
  localidades: async () => ({}),
  categoriasPorMotivo: async () => ({}),
  ultimoComprobante: async () => ({ ultimo_numero: 0, siguiente_numero: 1 }),
};

before(async () => {
  const app = express();
  app.use(express.json());
  app.use((req, _, next) => {
    if (req.headers["x-test-role"]) req.user = {
      id: 1, rol_id: Number(req.headers["x-test-role"]),
      permissions: (req.headers["x-test-permissions"] ?? "").split(","),
    };
    next();
  });
  app.use("/arca", createArcaRouter(service));
  server = app.listen(0, "127.0.0.1");
  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });
  base = `http://127.0.0.1:${server.address().port}`;
});
after(async () => {
  await new Promise(resolve => server.close(resolve));
  await sequelize.close();
});

test("rutas ARCA rechazan usuarios anónimos o sin permiso antes de llamar a servicios", async () => {
  calls = [];
  const anonymous = await fetch(`${base}/arca/estado`);
  assert.equal(anonymous.status, 401);
  const forbidden = await fetch(`${base}/arca/estado`, { headers: { "x-test-role": "2" } });
  assert.equal(forbidden.status, 403);
  assert.equal(calls.length, 0);
});

test("consulta exige arca.consultar y usa homologación como valor predeterminado", async () => {
  calls = [];
  const response = await fetch(`${base}/arca/estado`, { headers: { "x-test-role": "2", "x-test-permissions": "arca.consultar" } });
  assert.equal(response.status, 200);
  assert.equal(response.headers.get("cache-control"), "no-store");
  assert.deepEqual(await response.json(), { ok: true, disponible: true });
  assert.deepEqual(calls, [["dummy", "homologacion"]]);
});

test("permiso de consulta no permite modificar configuración y admin sí", async () => {
  const url = `${base}/arca/empresas/1/configuracion/homologacion`;
  const body = { credenciales_ref: "TEST", punto_venta: 11, activa: false };
  const options = { method: "PUT", headers: { "Content-Type": "application/json", "x-test-role": "2", "x-test-permissions": "arca.consultar" }, body: JSON.stringify(body) };
  assert.equal((await fetch(url, options)).status, 403);
  const response = await fetch(url, { ...options, headers: { ...options.headers, "x-test-role": "1" } });
  assert.equal(response.status, 200);
  assert.deepEqual((await response.json()).configuracion, body);
});

test("autenticación devuelve únicamente diagnóstico y fallos internos no filtran secretos", async () => {
  const options = { headers: { "x-test-role": "1" } };
  const auth = await fetch(`${base}/arca/empresas/1/autenticacion`, { ...options, method: "POST" });
  const data = await auth.json();
  assert.equal(data.autenticado, true);
  assert.equal(data.token, undefined);
  assert.equal(data.sign, undefined);
  const failure = await fetch(`${base}/arca/empresas/1/catalogos/error-interno`, options);
  assert.equal(failure.status, 500);
  const text = await failure.text();
  assert.ok(!text.includes("PRIVATE_"));
  const business = await fetch(`${base}/arca/empresas/1/catalogos/error-arca`, options);
  assert.equal(business.status, 422);
  assert.deepEqual((await business.json()).detalles.codigos, ["1009"]);
});

test("no existe ruta de emisión fiscal en esta primera etapa", async () => {
  const response = await fetch(`${base}/arca/empresas/1/liquidaciones`, { method: "POST", headers: { "x-test-role": "1" } });
  assert.equal(response.status, 404);
});

test("almacenamiento toma lock compartido dentro de una transacción y escribe cifrado", async () => {
  const queries = [];
  const writes = [];
  const tx = {};
  const key = Buffer.alloc(32, 7).toString("base64");
  let record;
  const store = createTicketStore({
    env: { ARCA_TICKET_ENCRYPTION_KEY: key },
    db: {
      getDialect: () => "postgres",
      query: async (sql, options) => { assert.equal(options.transaction, tx); queries.push(sql); },
      transaction: async callback => callback(tx),
    },
    model: {
      findByPk: async (_, options) => { assert.equal(options.transaction, tx); return record; },
      upsert: async (value, options) => { assert.equal(options.transaction, tx); assert.equal(options.hooks, false); writes.push(value); record = value; },
    },
  });
  const id = "a".repeat(64);
  const ticket = { token: "PRIVATE_TOKEN", sign: "PRIVATE_SIGN", generationTime: new Date().toISOString(), expirationTime: new Date(Date.now() + 3600000).toISOString() };
  await store.withLock(id, async cache => {
    assert.equal(await cache.get(), null);
    await cache.set(ticket);
  });
  const reused = await store.withLock(id, cache => cache.get());
  assert.deepEqual(reused, ticket);
  assert.equal(writes.length, 1);
  assert.ok(queries.every(sql => sql.includes("pg_advisory_xact_lock")));
  assert.ok(!JSON.stringify(writes).includes("PRIVATE_"));
});
