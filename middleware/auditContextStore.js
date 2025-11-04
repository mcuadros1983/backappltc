// server/audit/auditContextStore.js
import { AsyncLocalStorage } from "node:async_hooks";

export const auditALS = new AsyncLocalStorage();

// helpers
export function getAuditCtx() {
  return auditALS.getStore() || null;
}

export function runWithAuditCtx(ctx, fn) {
  return auditALS.run(ctx || {}, fn);
}
