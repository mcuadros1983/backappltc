import { DataTypes } from "sequelize";
import { sequelize } from "../../config/database.js";

const MotorConceptoEntidadTipoRel = sequelize.define(
  "MotorConceptoEntidadTipoRel",
  {
    concepto_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
    },

    entidad_tipo_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
    },
  },
  {
    tableName: "motor_concepto_entidad_tipo_rel",
    underscored: true,
    timestamps: true,

    indexes: [
      {
        unique: true,
        fields: ["concepto_id", "entidad_tipo_id"],
        name: "uq_motor_concepto_entidad_tipo_rel",
      },
      {
        fields: ["concepto_id"],
        name: "ix_motor_concepto_entidad_tipo_rel_concepto",
      },
      {
        fields: ["entidad_tipo_id"],
        name: "ix_motor_concepto_entidad_tipo_rel_entidad",
      },
    ],
  }
);

export default MotorConceptoEntidadTipoRel;