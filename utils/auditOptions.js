// server/utils/auditOptions.js
export function withCtx(req, extra = {}) {
  const base = { userContext: req.auditCtx || {} };
  if (extra.skipAudit) base.skipAudit = true;
  return { ...extra, ...base }; // base al final = asegura userContext
}