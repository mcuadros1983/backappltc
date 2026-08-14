import { DataTypes } from "sequelize";
import { sequelize } from "../../config/database.js";

const MotorConceptoRegistro = sequelize.define(
  "MotorConceptoRegistro",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    concepto_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    entidad_tipo_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    entidad_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    estado: {
      type: DataTypes.ENUM(
        "BORRADOR",
        "PENDIENTE",
        "VIGENTE",
        "VENCIDO",
        "ANULADO"
      ),
      allowNull: false,
      defaultValue: "BORRADOR",
    },
    version_actual_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    fecha_vencimiento: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    ultimo_movimiento: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    observaciones: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    sucursal_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    activo: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    creado_por: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    modificado_por: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  },
  {
    tableName: "motor_concepto_registros",
    underscored: true,
    paranoid: true,
    indexes: [
      {
        fields: ["concepto_id", "entidad_tipo_id", "entidad_id"],
        name: "ix_motor_registros_concepto_entidad",
      },
      {
        fields: ["concepto_id", "estado"],
        name: "ix_motor_registros_concepto_estado",
      },
      {
        fields: ["fecha_vencimiento"],
        name: "ix_motor_registros_fecha_vencimiento",
      },
      {
        fields: ["sucursal_id", "activo"],
        name: "ix_motor_registros_sucursal_activo",
      },
      {
        fields: ["ultimo_movimiento"],
        name: "ix_motor_registros_ultimo_movimiento",
      },
    ],
  }
);

export default MotorConceptoRegistro;
