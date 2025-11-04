import AuditLog from "../models/auditoria/auditLogModel.js";

export async function logAction(req, data = {}) {
  try {
    const user = req.user || {};
    const ctx  = req.clientInfo || {};

    const payload = {
      // QUIÉN
      usuario_id: user.id ?? null,
      usuario: user.usuario ?? null,
      rol_id: user.rol_id ?? null,

      // CUÁNDO (default en el model)
      fecha: new Date(),

      // QUÉ
      entidad: data.entidad || "Desconocida",
      entidad_id: data.entidad_id ?? null,

      // ACCIÓN/RESULTADO
      accion: data.accion || "other",
      resultado: data.resultado || "success",
      error_mensaje: data.error_mensaje || null,

      // CONTEXTO
      ip: ctx.ip || null,
      user_agent: ctx.user_agent || null,
      ruta: ctx.ruta || null,
      metodo: ctx.metodo || null,

      // SCOPE
      empresa_id: data.empresa_id ?? null,
      sucursal_id: data.sucursal_id ?? null,

      // DIFF / DETALLE
      old_values: data.old_values ?? null,
      new_values: data.new_values ?? null,
      detalle: data.detalle ?? null,

      // CRÍTICO
      critico: Boolean(data.critico),
    };

    await AuditLog.create(payload);
  } catch (e) {
    // Nunca rompemos el flujo por un fallo de logging
    console.error("⚠️ AuditLog falló:", e?.message || e);
  }
}
