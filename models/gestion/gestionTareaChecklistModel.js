import { DataTypes } from "sequelize";
import { sequelize } from "../../config/database.js";

const GestionTareaChecklist = sequelize.define("GestionTareaChecklist", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  tarea_id: { type: DataTypes.INTEGER, allowNull: false },
  descripcion: { type: DataTypes.STRING(250), allowNull: false },
  completado: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
  completado_por_id: { type: DataTypes.INTEGER, allowNull: true },
  fecha_completado: { type: DataTypes.DATE, allowNull: true },
  orden: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
}, {
  tableName: "gestion_tarea_checklist",
  timestamps: true,
  createdAt: "created_at",
  updatedAt: "updated_at",
  indexes: [
    { fields: ["tarea_id"] },

    { fields: ["completado"] },

    {
      unique: true,
      fields: [
        "tarea_id",
        "orden",
      ],
    },
  ],
});

export default GestionTareaChecklist;
