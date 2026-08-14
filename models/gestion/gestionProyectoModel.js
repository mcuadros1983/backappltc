import { DataTypes } from "sequelize";
import { sequelize } from "../../config/database.js";

const GestionProyecto = sequelize.define("GestionProyecto", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  sucursal_id: { type: DataTypes.INTEGER, allowNull: true },
  codigo: { type: DataTypes.STRING(50), allowNull: true, unique: true },
  nombre: { type: DataTypes.STRING(200), allowNull: false },
  descripcion: { type: DataTypes.TEXT, allowNull: true },
  estado: {
    type: DataTypes.ENUM("ACTIVO", "PAUSADO", "FINALIZADO", "CANCELADO"),
    allowNull: false,
    defaultValue: "ACTIVO",
  },
  prioridad: {
    type: DataTypes.ENUM("BAJA", "NORMAL", "ALTA", "CRITICA"),
    allowNull: false,
    defaultValue: "NORMAL",
  },
  responsable_id: { type: DataTypes.INTEGER, allowNull: true },
  supervisor_id: { type: DataTypes.INTEGER, allowNull: true },
  creado_por_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  fecha_inicio: { type: DataTypes.DATEONLY, allowNull: true },
  fecha_fin: { type: DataTypes.DATEONLY, allowNull: true },
  porcentaje_avance: { type: DataTypes.DECIMAL(5, 2), allowNull: false, defaultValue: 0 },
  color: { type: DataTypes.STRING(20), allowNull: true },
  activo: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
}, {
  tableName: "gestion_proyectos",
  timestamps: true,
  createdAt: "created_at",
  updatedAt: "updated_at",
  indexes: [
    { fields: ["sucursal_id"] },
    { fields: ["estado"] },
    { fields: ["responsable_id"] },
    { fields: ["supervisor_id"] },
  ],
});

export default GestionProyecto;
