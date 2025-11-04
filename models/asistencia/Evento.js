// /src/models/asistencia/evento.js
import { DataTypes } from "sequelize";
import { sequelize } from "../../config/database.js";

const Evento = sequelize.define("Evento", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },

  fecha_desde: { type: DataTypes.DATEONLY, allowNull: false },
  fecha_hasta: { type: DataTypes.DATEONLY, allowNull: false },

  // FKs (sin asociaciones por ahora)
  concepto_id: { type: DataTypes.INTEGER, allowNull: false },
  empleado_id: { type: DataTypes.INTEGER, allowNull: false },
  sucursal_id: { type: DataTypes.INTEGER, allowNull: false },

  observaciones: { type: DataTypes.STRING(255), allowNull: true },
}, {
  tableName: "evento",
  freezeTableName: true,
  timestamps: false,
  indexes: [
    { fields: ["concepto_id"] },
    { fields: ["empleado_id"] },
    { fields: ["sucursal_id"] },
  ],
});

export default Evento;
