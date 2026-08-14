import { DataTypes } from "sequelize";
import { sequelize } from "../../config/database.js";

const MotorConceptoLista = sequelize.define("MotorConceptoLista", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  campo_id: { type: DataTypes.INTEGER, allowNull: false },
  permite_multiple: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
}, {
  tableName: "motor_concepto_listas",
  underscored: true,
  paranoid: true,
  indexes: [
    { unique: true, fields: ["campo_id"], name: "uq_motor_concepto_listas_campo" },
  ],
});

export default MotorConceptoLista;
