import { DataTypes } from "sequelize";
import { sequelize } from "../../config/database.js";

const MotorConceptoRegistroVersion = sequelize.define(
  "MotorConceptoRegistroVersion",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    registro_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    numero: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    motivo: {
      type: DataTypes.STRING(150),
      allowNull: true,
    },
    comentario: {
      type: DataTypes.TEXT,
      allowNull: true,
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
    },
    fecha_vencimiento: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    creado_por: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  },
  {
    tableName: "motor_concepto_registro_versiones",
    underscored: true,
    updatedAt: false,
    indexes: [
      {
        unique: true,
        fields: ["registro_id", "numero"],
        name: "uq_motor_registro_versiones_numero",
      },
      {
        fields: ["registro_id", "created_at"],
        name: "ix_motor_registro_versiones_fecha",
      },
    ],
  }
);

export default MotorConceptoRegistroVersion;
