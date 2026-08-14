import { DataTypes } from "sequelize";
import { sequelize } from "../../config/database.js";

const EvaluacionTipo = sequelize.define(
  "EvaluacionTipo",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },

    codigo: {
      type: DataTypes.STRING(30),
      allowNull: false,
      unique: true,
    },

    descripcion: {
      type: DataTypes.STRING(120),
      allowNull: false,
    },

    activo: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
  },
  {
    tableName: "evaluacion_tipo",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
    freezeTableName: true,
  }
);

export default EvaluacionTipo;