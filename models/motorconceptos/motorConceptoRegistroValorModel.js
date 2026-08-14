import { DataTypes } from "sequelize";
import { sequelize } from "../../config/database.js";

const MotorConceptoRegistroValor = sequelize.define(
  "MotorConceptoRegistroValor",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    version_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    campo_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    valor_texto: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    valor_entero: {
      type: DataTypes.BIGINT,
      allowNull: true,
    },
    valor_decimal: {
      type: DataTypes.DECIMAL(20, 6),
      allowNull: true,
    },
    valor_fecha: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    valor_datetime: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    valor_boolean: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
    },
    valor_json: {
      type: DataTypes.JSONB,
      allowNull: true,
    },
  },
  {
    tableName: "motor_concepto_registro_valores",
    underscored: true,
    timestamps: true,
    updatedAt: false,
    indexes: [
      {
        unique: true,
        fields: ["version_id", "campo_id"],
        name: "uq_motor_registro_valores_campo",
      },
      {
        fields: ["campo_id", "valor_fecha"],
        name: "ix_motor_registro_valores_fecha",
      },
      {
        fields: ["campo_id", "valor_entero"],
        name: "ix_motor_registro_valores_entero",
      },
      {
        fields: ["campo_id", "valor_decimal"],
        name: "ix_motor_registro_valores_decimal",
      },
      {
        fields: ["campo_id", "valor_boolean"],
        name: "ix_motor_registro_valores_boolean",
      },
    ],
  }
);

export default MotorConceptoRegistroValor;
