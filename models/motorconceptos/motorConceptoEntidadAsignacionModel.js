import { DataTypes } from "sequelize";
import { sequelize } from "../../config/database.js";

const MotorConceptoEntidadAsignacion = sequelize.define(
  "MotorConceptoEntidadAsignacion",
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

    registro_actual_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },

    estado: {
      type: DataTypes.ENUM(
        "PENDIENTE",
        "COMPLETADO",
        "CANCELADO"
      ),
      allowNull: false,
      defaultValue: "PENDIENTE",
    },

    obligatorio: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: false,
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
    tableName: "motor_concepto_entidad_asignaciones",

    underscored: true,

    paranoid: true,

    indexes: [
      {
        unique: true,
        fields: [
          "concepto_id",
          "entidad_tipo_id",
          "entidad_id",
        ],
        name: "uq_motor_asignacion_entidad",
      },

      {
        fields: [
          "entidad_tipo_id",
          "entidad_id",
        ],
        name: "ix_motor_asignacion_entidad",
      },

      {
        fields: [
          "estado",
        ],
        name: "ix_motor_asignacion_estado",
      },

      {
        fields: [
          "activo",
        ],
        name: "ix_motor_asignacion_activo",
      },
    ],
  }
);

export default MotorConceptoEntidadAsignacion;