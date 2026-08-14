import { DataTypes } from "sequelize";
import { sequelize } from "../../config/database.js";

import InteligenciaEvento
  from "./inteligenciaEventoModel.js";

import Sucursal
  from "../gmedias/sucursalModel.js";


const InteligenciaEventoSucursal = sequelize.define(
  "InteligenciaEventoSucursal",
  {
    id: {
      type: DataTypes.BIGINT,
      primaryKey: true,
      autoIncrement: true,
    },

    evento_id: {
      type: DataTypes.BIGINT,
      allowNull: false,
    },

    sucursal_id: {
      type: DataTypes.BIGINT,
      allowNull: false,
    },
  },
  {
    tableName: "inteligencia_evento_sucursales",
    timestamps: false,

    indexes: [
      {
        unique: true,
        fields: [
          "evento_id",
          "sucursal_id",
        ],
      },
      {
        fields: ["sucursal_id"],
      },
    ],
  }
);


InteligenciaEvento.hasMany(
  InteligenciaEventoSucursal,
  {
    foreignKey: "evento_id",
    as: "sucursales_evento",
    onDelete: "CASCADE",
  }
);


InteligenciaEventoSucursal.belongsTo(
  InteligenciaEvento,
  {
    foreignKey: "evento_id",
    as: "evento",
  }
);


InteligenciaEventoSucursal.belongsTo(
  Sucursal,
  {
    foreignKey: "sucursal_id",
    as: "sucursal",
  }
);


export default InteligenciaEventoSucursal;