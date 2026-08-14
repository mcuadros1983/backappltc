import { DataTypes } from "sequelize";
import { sequelize } from "../../config/database.js";

const EvaluacionPeriodo = sequelize.define(
  "EvaluacionPeriodo",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },

    descripcion: {
      type: DataTypes.STRING(120),
      allowNull: false,
    },

    fecha_inicio: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },

    fecha_fin: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },

    activo: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },

  },
  {
    tableName: "evaluacion_periodo",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
    freezeTableName: true,
  }
);

export default EvaluacionPeriodo;