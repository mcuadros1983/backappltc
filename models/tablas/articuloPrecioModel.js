import { DataTypes } from "sequelize";
import { sequelize } from "../../config/database.js";
import ArticuloTabla from "./articuloModel.js";
import PrecioTabla from "./precioModel.js";

// Define el modelo para la tabla articuloPrecio
const ArticuloPrecioTabla = sequelize.define(
  "ArticuloPreciotabla",
  {
    id: {
      type: DataTypes.BIGINT,
      primaryKey: true,
      autoIncrement: false,
    },
    articulopreciotablaId: {
      type: DataTypes.BIGINT,
      allowNull: true,
    },
    precio: {
      type: DataTypes.NUMERIC(12, 2),
      allowNull: false,
    },
    articulo_id: {
      type: DataTypes.BIGINT,
      allowNull: false,
    },
    listaprecio_id: {
      type: DataTypes.BIGINT,
      allowNull: false,
    },
    sucursal_id: {
      type: DataTypes.BIGINT,
      allowNull: false,
    },
  },
  {
    timestamps: false,
    freezeTableName: true,
  }
);

ArticuloPrecioTabla.belongsTo(ArticuloTabla, { foreignKey: "articulo_id" });

// En el modelo Articulo
ArticuloTabla.hasMany(ArticuloPrecioTabla, { foreignKey: "articulo_id" });

export default ArticuloPrecioTabla;
