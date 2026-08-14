import { DataTypes } from "sequelize";
import { sequelize } from "../../config/database.js";

import InteligenciaEvento
  from "./inteligenciaEventoModel.js";

import ArticuloTabla
  from "../tablas/articuloModel.js";


const InteligenciaEventoArticulo = sequelize.define(
  "InteligenciaEventoArticulo",
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

    articulo_id: {
      type: DataTypes.BIGINT,
      allowNull: false,
    },
  },
  {
    tableName: "inteligencia_evento_articulos",
    timestamps: false,

    indexes: [
      {
        unique: true,
        fields: [
          "evento_id",
          "articulo_id",
        ],
      },
      {
        fields: ["articulo_id"],
      },
    ],
  }
);


InteligenciaEvento.hasMany(
  InteligenciaEventoArticulo,
  {
    foreignKey: "evento_id",
    as: "articulos_evento",
    onDelete: "CASCADE",
  }
);


InteligenciaEventoArticulo.belongsTo(
  InteligenciaEvento,
  {
    foreignKey: "evento_id",
    as: "evento",
  }
);


InteligenciaEventoArticulo.belongsTo(
  ArticuloTabla,
  {
    foreignKey: "articulo_id",
    as: "articulo",
  }
);


export default InteligenciaEventoArticulo;