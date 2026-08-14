import { DataTypes } from "sequelize";
import { sequelize } from "../../config/database.js";

const EvaluacionCriterio = sequelize.define(
  "EvaluacionCriterio",
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
      type: DataTypes.STRING(200),
      allowNull: false,
    },

    pregunta: {
      type: DataTypes.TEXT,
      allowNull: true,
    },

    tipo_respuesta: {
      type: DataTypes.ENUM(

        "ESCALA",
        "SI_NO",
        "NUMERO",
        "TEXTO",
        "LISTA"

      ),
      allowNull: false,
      defaultValue: "ESCALA",
    },

    opciones: {
      type: DataTypes.JSONB,
      allowNull: true,
    },

    puntaje_maximo: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 10,
    },

    orden: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
    },

    activo: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },

  },
  {
    tableName: "evaluacion_criterio",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
    freezeTableName: true,
  }
);

export default EvaluacionCriterio;