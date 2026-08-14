import { DataTypes } from "sequelize";
import { sequelize } from "../../config/database.js";

const GestionTarea = sequelize.define("GestionTarea", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  sucursal_id: { type: DataTypes.INTEGER, allowNull: true },
  codigo: { type: DataTypes.STRING(50), allowNull: true, unique: true },
  titulo: { type: DataTypes.STRING(250), allowNull: false },
  descripcion: { type: DataTypes.TEXT, allowNull: true },
  estado: {
    type: DataTypes.ENUM("PENDIENTE", "EN_CURSO", "EN_REVISION", "FINALIZADA", "CANCELADA"),
    allowNull: false,
    defaultValue: "PENDIENTE",
  },
  prioridad: {
    type: DataTypes.ENUM("BAJA", "NORMAL", "ALTA", "CRITICA"),
    allowNull: false,
    defaultValue: "NORMAL",
  },
  proyecto_id: { type: DataTypes.INTEGER, allowNull: true },
  responsable_id: { type: DataTypes.INTEGER, allowNull: false },
  supervisor_id: { type: DataTypes.INTEGER, allowNull: true },
  creado_por_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  fecha_vencimiento: { type: DataTypes.DATEONLY, allowNull: true },
  fecha_inicio: { type: DataTypes.DATE, allowNull: true },
  fecha_cierre: { type: DataTypes.DATE, allowNull: true },
  porcentaje_avance: { type: DataTypes.DECIMAL(5, 2), allowNull: false, defaultValue: 0 },
  activo: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
}, {
  tableName: "gestion_tareas",
  timestamps: true,
  createdAt: "created_at",
  updatedAt: "updated_at",
  indexes: [
    { fields: ["sucursal_id"] },
    { fields: ["proyecto_id"] },
    { fields: ["responsable_id"] },
    { fields: ["supervisor_id"] },
    { fields: ["estado"] },
    { fields: ["fecha_vencimiento"] },
  ],
});

export default GestionTarea;
