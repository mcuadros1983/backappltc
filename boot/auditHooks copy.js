// boot/auditHooks_v2.js
import AuditLog from "../models/auditoria/auditLogModel.js";
import { getAuditCtx } from "../middleware/auditALSMiddleware.js";

// evita auditar la propia tabla de logs
function isAuditModel(instance) {
  return instance.constructor?.tableName === AuditLog.getTableName();
}

export function registerAuditHooks(sequelize) {
  for (const modelName of Object.keys(sequelize.models)) {
    const Model = sequelize.models[modelName];

    // CREATE
    Model.addHook("afterCreate", async (instance, options) => {
      if (isAuditModel(instance)) return;
      const ctx = (options && options.userContext) || getAuditCtx();
      await AuditLog.create({
        entidad: modelName,
        entidad_id: instance.id ?? null,
        accion: "create",
        resultado: "success",
        usuario_id: ctx.usuario_id,
        usuario: ctx.usuario,
        ip: ctx.ip,
        user_agent: ctx.user_agent,
        ruta: ctx.ruta,
        metodo: ctx.metodo,
        empresa_id: ctx.empresa_id,
        sucursal_id: ctx.sucursal_id,
        request_id: ctx.request_id,
        session_id: ctx.session_id,
        new_values: instance.toJSON(),
      }, { transaction: options?.transaction });
    });

    // UPDATE
    Model.addHook("beforeUpdate", (instance) => {
      if (isAuditModel(instance)) return;
      instance.__oldValues = instance._previousDataValues ? { ...instance._previousDataValues } : null;
    });

    Model.addHook("afterUpdate", async (instance, options) => {
      if (isAuditModel(instance)) return;
      const ctx = (options && options.userContext) || getAuditCtx();
      await AuditLog.create({
        entidad: modelName,
        entidad_id: instance.id ?? null,
        accion: "update",
        resultado: "success",
        usuario_id: ctx.usuario_id,
        usuario: ctx.usuario,
        ip: ctx.ip,
        user_agent: ctx.user_agent,
        ruta: ctx.ruta,
        metodo: ctx.metodo,
        empresa_id: ctx.empresa_id,
        sucursal_id: ctx.sucursal_id,
        request_id: ctx.request_id,
        session_id: ctx.session_id,
        old_values: instance.__oldValues || null,
        new_values: instance.toJSON(),
      }, { transaction: options?.transaction });
    });

    // DELETE
    Model.addHook("afterDestroy", async (instance, options) => {
      if (isAuditModel(instance)) return;
      const ctx = (options && options.userContext) || getAuditCtx();
      await AuditLog.create({
        entidad: modelName,
        entidad_id: instance.id ?? null,
        accion: "delete",
        resultado: "success",
        usuario_id: ctx.usuario_id,
        usuario: ctx.usuario,
        ip: ctx.ip,
        user_agent: ctx.user_agent,
        ruta: ctx.ruta,
        metodo: ctx.metodo,
        empresa_id: ctx.empresa_id,
        sucursal_id: ctx.sucursal_id,
        request_id: ctx.request_id,
        session_id: ctx.session_id,
        old_values: instance.toJSON(),
      }, { transaction: options?.transaction });
    });
  }
}
