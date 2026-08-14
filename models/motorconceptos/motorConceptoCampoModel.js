import { DataTypes } from "sequelize";
import { sequelize } from "../../config/database.js";

const MotorConceptoCampo = sequelize.define("MotorConceptoCampo", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  concepto_id: { type: DataTypes.INTEGER, allowNull: false },
  codigo: { type: DataTypes.STRING(80), allowNull: false },
  etiqueta: { type: DataTypes.STRING(150), allowNull: false },
  tipo: {
    type: DataTypes.ENUM(
      "TEXT", "TEXTAREA", "INTEGER", "DECIMAL", "BOOLEAN", "DATE", "DATETIME",
      "TIME", "EMAIL", "PHONE", "URL", "COLOR", "PASSWORD", "JSON", "LISTA",
      "RELACION", "IMAGEN", "FIRMA", "COORDENADAS"
    ),
    allowNull: false,
  },
  obligatorio: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
  orden: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
  ancho: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 12, validate: { min: 1, max: 12 } },
  placeholder: { type: DataTypes.STRING(255), allowNull: true },
  ayuda: { type: DataTypes.TEXT, allowNull: true },
  solo_lectura: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
  visible: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
  valor_defecto: { type: DataTypes.TEXT, allowNull: true },
  configuracion: { type: DataTypes.JSONB, allowNull: false, defaultValue: {} },
  activo: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
  creado_por: { type: DataTypes.INTEGER, allowNull: true },
  modificado_por: { type: DataTypes.INTEGER, allowNull: true },
}, {
  tableName: "motor_concepto_campos",
  underscored: true,
  paranoid: true,
  indexes: [
    { unique: true, fields: ["concepto_id", "codigo"], name: "uq_motor_concepto_campos_codigo" },
    { fields: ["concepto_id", "orden"], name: "ix_motor_concepto_campos_orden" },
    { fields: ["tipo"], name: "ix_motor_concepto_campos_tipo" },
  ],
});

export default MotorConceptoCampo;
