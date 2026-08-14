import { DataTypes } from "sequelize";
import { sequelize } from "../../config/database.js";

const MotorConceptoArchivoTipo = sequelize.define("MotorConceptoArchivoTipo", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  concepto_id: { type: DataTypes.INTEGER, allowNull: false },
  codigo: { type: DataTypes.STRING(80), allowNull: false },
  nombre: { type: DataTypes.STRING(150), allowNull: false },
  descripcion: { type: DataTypes.TEXT, allowNull: true },
  obligatorio: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
  permite_multiples: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
  extensiones_permitidas: { type: DataTypes.JSONB, allowNull: false, defaultValue: [] },
  mime_types_permitidos: { type: DataTypes.JSONB, allowNull: false, defaultValue: [] },
  tamanio_maximo_mb: { type: DataTypes.INTEGER, allowNull: true, validate: { min: 1 } },
  orden: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
  activo: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
  creado_por: { type: DataTypes.INTEGER, allowNull: true },
  modificado_por: { type: DataTypes.INTEGER, allowNull: true },
  // permite_multiples: {
  //   type: DataTypes.BOOLEAN,
  //   allowNull: false,
  //   defaultValue: false,
  // },

  maximo_archivos: {
    type: DataTypes.INTEGER,
    allowNull: true,
    validate: {
      min: 1,
    },
  },

}, {
  tableName: "motor_concepto_archivo_tipos",
  underscored: true,
  paranoid: true,
  indexes: [
    { unique: true, fields: ["concepto_id", "codigo"], name: "uq_motor_concepto_archivo_tipos_codigo" },
    { fields: ["concepto_id", "orden"], name: "ix_motor_concepto_archivo_tipos_orden" },
  ],
});

export default MotorConceptoArchivoTipo;
