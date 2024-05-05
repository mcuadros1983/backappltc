import { DataTypes } from "sequelize";
import { sequelize } from "../../config/database.js"; 

const Inventario = sequelize.define(
  "Inventario",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    anio: {
      type: DataTypes.INTEGER,
    },
    fecha: {
      type: DataTypes.DATE,
    },
    mes: {
      type: DataTypes.INTEGER,
    },
    total: {
      type: DataTypes.DECIMAL(12, 2),
    },
    sucursal_id: {
      type: DataTypes.BIGINT,
    },
    usuario_id: {
      type: DataTypes.BIGINT,
    },
  },
  {
    timestamps: true,
    freezeTableName: true,
  }
);

export default Inventario;