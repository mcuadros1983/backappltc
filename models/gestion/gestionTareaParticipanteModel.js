import { DataTypes } from "sequelize";
import { sequelize } from "../../config/database.js";

const GestionTareaParticipante = sequelize.define("GestionTareaParticipante", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  tarea_id: { type: DataTypes.INTEGER, allowNull: false },
  usuario_id: { type: DataTypes.INTEGER, allowNull: false },
  rol: {
    type: DataTypes.ENUM("PARTICIPANTE", "OBSERVADOR", "REVISOR","SUPERVISOR"),
    allowNull: false,
    defaultValue: "PARTICIPANTE",
  },
  activo: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
}, {
  tableName: "gestion_tarea_participantes",
  timestamps: true,
  createdAt: "created_at",
  updatedAt: "updated_at",
  indexes: [
    { fields: ["tarea_id"] },
    { fields: ["usuario_id"] },
    { unique: true, fields: ["tarea_id", "usuario_id"] },
  ],
});

export default GestionTareaParticipante;
