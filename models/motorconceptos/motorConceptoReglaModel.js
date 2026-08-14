import { DataTypes } from "sequelize";
import { sequelize } from "../../config/database.js";

const MotorConceptoRegla = sequelize.define("MotorConceptoRegla", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  concepto_id: { type: DataTypes.INTEGER, allowNull: false },
  campo_destino_id: { type: DataTypes.INTEGER, allowNull: false },
  campo_origen_id: { type: DataTypes.INTEGER, allowNull: false },
  tipo_regla: {
    type: DataTypes.ENUM("VISIBLE_CUANDO", "OBLIGATORIO_CUANDO", "SOLO_LECTURA_CUANDO"),
    allowNull: false,
  },
  operador: {
    type: DataTypes.ENUM(
      "IGUAL", "DISTINTO", "MAYOR", "MAYOR_IGUAL", "MENOR", "MENOR_IGUAL",
      "CONTIENE", "NO_CONTIENE", "EN", "NO_EN", "VACIO", "NO_VACIO"
    ),
    allowNull: false,
  },
  valor_comparacion: { type: DataTypes.JSONB, allowNull: true },
  prioridad: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
  activo: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
  creado_por: { type: DataTypes.INTEGER, allowNull: true },
  modificado_por: { type: DataTypes.INTEGER, allowNull: true },
}, {
  tableName: "motor_concepto_reglas",
  underscored: true,
  paranoid: true,
  indexes: [
    { fields: ["concepto_id", "campo_destino_id"], name: "ix_motor_concepto_reglas_destino" },
    { fields: ["concepto_id", "campo_origen_id"], name: "ix_motor_concepto_reglas_origen" },
  ],
});

export default MotorConceptoRegla;
