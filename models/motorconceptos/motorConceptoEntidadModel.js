import { DataTypes } from "sequelize";
import { sequelize } from "../../config/database.js";

const MotorConceptoEntidad = sequelize.define("MotorConceptoEntidad", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  concepto_id: { type: DataTypes.INTEGER, allowNull: false },
  entidad_tipo_id: { type: DataTypes.INTEGER, allowNull: false },
  obligatorio: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
  activo: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
}, {
  tableName: "motor_concepto_entidades",
  underscored: true,
  paranoid: true,
  indexes: [
    { unique: true, fields: ["concepto_id", "entidad_tipo_id"], name: "uq_motor_concepto_entidad" },
    { fields: ["entidad_tipo_id", "activo"], name: "ix_motor_concepto_entidades_tipo_activo" },
  ],
});

export default MotorConceptoEntidad;
