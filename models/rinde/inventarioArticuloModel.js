import { DataTypes } from "sequelize";
import { sequelize } from "../../config/database.js";
// import Inventario from "./Local_Inventario.js";

const InventarioArticulo = sequelize.define(
  "Inventario_articulo",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    articulocodigo: {
      type: DataTypes.STRING(255),
    },
    articulodescripcion: {
      type: DataTypes.STRING(255),
    },
    cantidadpeso: {
      type: DataTypes.DECIMAL(12, 3),
    },
    precio: {
      type: DataTypes.DECIMAL(12, 3),
    },
  },
  {
    timestamps: false,
    freezeTableName: true,
  }
);

export default InventarioArticulo;
