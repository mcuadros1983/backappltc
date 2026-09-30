import { sequelize } from "../../config/database.js";
import ArcaTicket from "../../models/arca/arcaTicket.js";
import { ticketKey, encryptTicket, decryptTicket } from "./ticketCrypto.js";
import { ArcaError } from "./arcaError.js";

export function createTicketStore({ db = sequelize, model = ArcaTicket, env = process.env } = {}) {
  return {
    async withLock(cacheKey, callback) {
      const key = ticketKey(env);
      if (db.getDialect() !== "postgres") {
        throw new ArcaError("BASE_NO_COMPATIBLE", "La caché compartida WSAA requiere PostgreSQL.", 503);
      }
      return db.transaction(async transaction => {
        // Evita solicitudes simultáneas incluso con varios workers o réplicas Railway.
        const lockId = BigInt.asIntN(64, BigInt(`0x${cacheKey.slice(0, 16)}`)).toString();
        await db.query("SELECT pg_advisory_xact_lock(CAST(:lock_id AS bigint))", {
          replacements: { lock_id: lockId }, transaction, logging: false,
        });
        return callback({
          async get() {
            const record = await model.findByPk(cacheKey, { transaction, logging: false });
            if (!record || new Date(record.expires_at) <= new Date()) return null;
            return decryptTicket(record.contenido_cifrado, cacheKey, key);
          },
          async set(ticket) {
            await model.upsert({
              cache_key: cacheKey,
              contenido_cifrado: encryptTicket(ticket, cacheKey, key),
              expires_at: new Date(ticket.expirationTime),
            }, { transaction, logging: false, hooks: false });
          },
        });
      });
    },
  };
}
