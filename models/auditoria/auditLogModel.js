// // server/models/auditoria/auditLogModel.js
// import { DataTypes } from "sequelize";
// import { sequelize } from "../../config/database.js";

// const JSON_TYPE = DataTypes.JSONB || DataTypes.JSON; // JSONB si hay Postgres

// const AuditLog = sequelize.define("AuditLog", {
//   id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },

//   // QUIÉN
//   usuario_id: { type: DataTypes.INTEGER, allowNull: true },    // del token
//   usuario:    { type: DataTypes.STRING,  allowNull: true },    // admin, etc.

//   // CUÁNDO
//   fecha: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },

//   // QUÉ (objeto afectado)
//   entidad:    { type: DataTypes.STRING, allowNull: false },     // p.ej. "ComprobanteEgreso", "Hacienda", "Agenda"
//   entidad_id: { type: DataTypes.INTEGER, allowNull: true },     // id del registro (si aplica)

//   // ACCIÓN
//   accion: { // verbo consistente: create | update | delete | state_change | link | unlink | login | error | …
//     type: DataTypes.ENUM(
//       "create", "update", "delete", "state_change",
//       "link", "unlink", "login", "logout", "error", "other"
//     ),
//     allowNull: false,
//     defaultValue: "other",
//   },

//   // RESULTADO
//   resultado: { type: DataTypes.ENUM("success", "fail"), allowNull: false, defaultValue: "success" },
//   error_mensaje: { type: DataTypes.TEXT, allowNull: true },   // solo si fail

//   // CONTEXTO (útil para investigar)
//   ip:         { type: DataTypes.STRING, allowNull: true },
//   user_agent: { type: DataTypes.TEXT,   allowNull: true },
//   ruta:       { type: DataTypes.STRING, allowNull: true },    // req.originalUrl
//   metodo:     { type: DataTypes.STRING, allowNull: true },    // GET/POST/PUT/DELETE

//   // SCOPE opcional
//   empresa_id:  { type: DataTypes.INTEGER, allowNull: true },
//   sucursal_id: { type: DataTypes.INTEGER, allowNull: true },

//   // DIFERENCIAS (para updates / acciones críticas)
//   old_values: { type: JSON_TYPE, allowNull: true }, // snapshot antes
//   new_values: { type: JSON_TYPE, allowNull: true }, // snapshot después
//   detalle:    { type: JSON_TYPE, allowNull: true }, // payload adicional: {razon, notas, …}

//   // MARCA si fue crítico (para reportes)
//   critico: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
// }, {
//   tableName: "AuditLog",
//   timestamps: false,
//   indexes: [
//     { fields: ["fecha"] },
//     { fields: ["usuario_id"] },
//     { fields: ["entidad"] },
//     { fields: ["entidad_id"] },
//     { fields: ["accion"] },
//     { fields: ["resultado"] },
//     { fields: ["empresa_id"] },
//     { fields: ["sucursal_id"] },
//   ],
// });

// export default AuditLog;

// server/models/auditoria/auditLogModel.js
import { DataTypes } from "sequelize";
import { sequelize } from "../../config/database.js";

const JSON_TYPE = DataTypes.JSONB || DataTypes.JSON; // JSONB si hay Postgres

const AuditLog = sequelize.define("AuditLog", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },

  // QUIÉN
  usuario_id: { type: DataTypes.INTEGER, allowNull: true },    // del token
  usuario:    { type: DataTypes.STRING,  allowNull: true },    // admin, etc.

  // CUÁNDO
  fecha: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },

  // QUÉ (objeto afectado)
  entidad:    { type: DataTypes.STRING, allowNull: false },     // p.ej. "ComprobanteEgreso", "Hacienda", "Agenda"
  entidad_id: { type: DataTypes.INTEGER, allowNull: true },     // id del registro (si aplica)

  // ACCIÓN (ampliado para alinear con tus controllers)
  accion: {
    type: DataTypes.ENUM(
      "create",
      "update",
      "delete",        // delete físico (si alguna vez lo usás)
      "delete_soft",   // anulación / soft delete
      "delete_hard",   // eliminación definitiva
      "state_change",  // cambios de estado
      "postpone",      // postergaciones (agenda)
      "read",          // listados
      "read_one",      // obtener por id
      "read_upcoming", // próximos vencimientos
      "link",
      "unlink",
      "login",
      "logout",
      "error",
      "other"
    ),
    allowNull: false,
    defaultValue: "other",
  },

  // RESULTADO
  resultado: { type: DataTypes.ENUM("success", "fail"), allowNull: false, defaultValue: "success" },
  error_mensaje: { type: DataTypes.TEXT, allowNull: true },   // solo si fail

  // CONTEXTO (útil para investigar)
  ip:         { type: DataTypes.STRING, allowNull: true },
  user_agent: { type: DataTypes.TEXT,   allowNull: true },
  ruta:       { type: DataTypes.STRING, allowNull: true },    // req.originalUrl
  metodo:     { type: DataTypes.STRING, allowNull: true },    // GET/POST/PUT/DELETE

  // SCOPE opcional
  empresa_id:  { type: DataTypes.INTEGER, allowNull: true },
  sucursal_id: { type: DataTypes.INTEGER, allowNull: true },

  // DIFERENCIAS (para updates / acciones críticas)
  old_values: { type: JSON_TYPE, allowNull: true }, // snapshot antes
  new_values: { type: JSON_TYPE, allowNull: true }, // snapshot después

  // Detalle libre: ahora TEXT para permitir mensajes simples
  detalle: { type: DataTypes.TEXT, allowNull: true },

  // Payload extra estructurado (si querés adjuntar objetos sin ensuciar old/new)
  extra: { type: JSON_TYPE, allowNull: true },

  // MARCA si fue crítico (para reportes)
  critico: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },

  // (Opcional) trazabilidad request/trace (útil cuando uses colas o microservicios)
  request_id: { type: DataTypes.STRING, allowNull: true },
  session_id: { type: DataTypes.STRING, allowNull: true },
}, {
  tableName: "AuditLog",
  timestamps: false,
  indexes: [
    { fields: ["fecha"] },
    { fields: ["usuario_id"] },
    { fields: ["entidad"] },
    { fields: ["entidad_id"] },
    { fields: ["accion"] },
    { fields: ["resultado"] },
    { fields: ["empresa_id"] },
    { fields: ["sucursal_id"] },
    // índices compuestos útiles para búsquedas típicas
    { fields: ["entidad", "entidad_id"] },
    { fields: ["accion", "fecha"] },
  ],
});

export default AuditLog;
