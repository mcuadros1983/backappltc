import { DataTypes } from "sequelize";
import { sequelize } from "../../config/database.js";

import EvaluacionPlantilla from "./evaluacionPlantillaModel.js";
import EvaluacionCriterio from "./evaluacionCriterioModel.js";

const EvaluacionPlantillaDetalle = sequelize.define(
  "EvaluacionPlantillaDetalle",
  {

    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },

    plantilla_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },

    criterio_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },

    orden: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
    },

    // NUEVOS CAMPOS

    peso: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: false,
      defaultValue: 1,
    },

    obligatorio: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },

    permite_comentario: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },

    permite_evidencia: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    }

  },
  {
    tableName: "evaluacion_plantilla_detalle",
    timestamps: false,
    freezeTableName: true,
  }
);



export default EvaluacionPlantillaDetalle;