import { DataTypes } from "sequelize";
import { sequelize } from "../../config/database.js";

const CategoriaEgreso = sequelize.define("CategoriaEgreso", {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  nombre: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  imputacioncontable_id: { type: DataTypes.INTEGER, allowNull: true },
  activo: { type: DataTypes.BOOLEAN, allowNull: true, defaultValue: true },
}, {
  timestamps: false,
});

export default CategoriaEgreso;
