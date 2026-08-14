import { DataTypes } from "sequelize";
import { sequelize } from "../../config/database.js";

const GestionProyectoMiembro = sequelize.define("GestionProyectoMiembro", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  proyecto_id: { type: DataTypes.INTEGER, allowNull: false },
  usuario_id: { type: DataTypes.INTEGER, allowNull: false },
  rol: {
    type: DataTypes.ENUM("RESPONSABLE", "COLABORADOR", "OBSERVADOR", "SUPERVISOR"),
    allowNull: false,
    defaultValue: "COLABORADOR",
  },
  activo: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
}, {
  tableName: "gestion_proyecto_miembros",
  timestamps: true,
  createdAt: "created_at",
  updatedAt: "updated_at",
  indexes: [
    { fields: ["proyecto_id"] },
    { fields: ["usuario_id"] },
    { unique: true, fields: ["proyecto_id", "usuario_id"] },
  ],
});

export default GestionProyectoMiembro;
