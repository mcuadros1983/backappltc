import { DataTypes } from "sequelize";
import { sequelize } from "../../config/database.js";

const MotorConceptoEntidadTipo = sequelize.define("MotorConceptoEntidadTipo", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  codigo: { type: DataTypes.STRING(50), allowNull: false },
  nombre: { type: DataTypes.STRING(100), allowNull: false },
  activo: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
}, {
  tableName: "motor_concepto_entidad_tipos",
  underscored: true,
  indexes: [
    { unique: true, fields: ["codigo"], name: "uq_motor_concepto_entidad_tipos_codigo" },
  ],
});

export default MotorConceptoEntidadTipo;
