import { DataTypes } from "sequelize";
import { sequelize } from "../../config/database.js";

const MotorConcepto = sequelize.define("MotorConcepto", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  codigo: { type: DataTypes.STRING(80), allowNull: false },
  nombre: { type: DataTypes.STRING(150), allowNull: false },
  descripcion: { type: DataTypes.TEXT, allowNull: true },
  modo_captura: {
    type: DataTypes.ENUM("SOLO_DATOS", "SOLO_ARCHIVOS", "DATOS_Y_ARCHIVOS"),
    allowNull: false,
    defaultValue: "DATOS_Y_ARCHIVOS",
  },
  permite_multiples: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
  usa_versiones: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
  usa_vencimiento: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
  dias_alerta_vencimiento: { type: DataTypes.INTEGER, allowNull: true, validate: { min: 0 } },
  activo: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
  creado_por: { type: DataTypes.INTEGER, allowNull: true },
  modificado_por: { type: DataTypes.INTEGER, allowNull: true },
}, {
  tableName: "motor_conceptos",
  underscored: true,
  paranoid: true,
  indexes: [
    { unique: true, fields: ["codigo"], name: "uq_motor_conceptos_codigo" },
    { fields: ["nombre"], name: "ix_motor_conceptos_nombre" },
    { fields: ["activo"], name: "ix_motor_conceptos_activo" },
  ],
});

export default MotorConcepto;
