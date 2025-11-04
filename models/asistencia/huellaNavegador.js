// /src/models/asistencia/huellaNavegador.js
import { DataTypes } from "sequelize";
import { sequelize } from "../../config/database.js";

const HuellaNavegador = sequelize.define("HuellaNavegador", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },

  empleado_id: { type: DataTypes.INTEGER, allowNull: true }, // opcional
  ip_address:  { type: DataTypes.STRING(45), allowNull: false },
  fingerprint: { type: DataTypes.STRING(100), allowNull: false },
  sucursal_id: { type: DataTypes.INTEGER, allowNull: true },

  accessed_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW }, // auto_now_add
}, {
  tableName: "huella_navegador",
  freezeTableName: true,
  timestamps: false,
  indexes: [
    { fields: ["empleado_id"] },
    { fields: ["ip_address"] },
    { fields: ["fingerprint"] },
  ],
});

export default HuellaNavegador;
