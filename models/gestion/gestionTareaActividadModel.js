import { DataTypes } from "sequelize";
import { sequelize } from "../../config/database.js";

const GestionTareaActividad = sequelize.define("GestionTareaActividad", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  tarea_id: { type: DataTypes.INTEGER, allowNull: false },
  usuario_id: { type: DataTypes.INTEGER, allowNull: true },
  tipo: {
    type: DataTypes.ENUM("SISTEMA", "COMENTARIO", "CAMBIO_ESTADO", "CHECKLIST", "ASIGNACION","ARCHIVO"),
    allowNull: false,
    defaultValue: "SISTEMA",
  },
  comentario: { type: DataTypes.TEXT, allowNull: true },
  estado_anterior: { type: DataTypes.STRING(30), allowNull: true },
  estado_nuevo: { type: DataTypes.STRING(30), allowNull: true },
  metadata: { type: DataTypes.JSONB, allowNull: true },
}, {
  tableName: "gestion_tarea_actividades",
  timestamps: true,
  createdAt: "created_at",
  updatedAt: "updated_at",
  indexes: [
    { fields: ["tarea_id"] },
    { fields: ["usuario_id"] },
    { fields: ["tipo"] },
  ],
});

export default GestionTareaActividad;
