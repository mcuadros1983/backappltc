// /src/models/asistencia/asignacionVacaciones.js
import { DataTypes } from "sequelize";
import { sequelize } from "../../config/database.js";

const AsignacionVacaciones = sequelize.define("AsignacionVacaciones", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },

  periodo:         { type: DataTypes.INTEGER, allowNull: false },
  dias_vacaciones: { type: DataTypes.INTEGER, allowNull: false },

  empleado_id: { type: DataTypes.INTEGER, allowNull: false },
  sucursal_id: { type: DataTypes.INTEGER, allowNull: true },

  fecha_desde: { type: DataTypes.DATEONLY, allowNull: true },
  fecha_hasta: { type: DataTypes.DATEONLY, allowNull: true },
}, {
  tableName: "asignacion_vacaciones",
  freezeTableName: true,
  timestamps: false,
  indexes: [
    { fields: ["empleado_id"] },
    { fields: ["sucursal_id"] },
    // { fields: ["periodo", "empleado_id"], unique: true }, // opcional para evitar duplicados
  ],
});

export default AsignacionVacaciones;
