import { DataTypes } from "sequelize"; 
import { sequelize } from "../../config/database.js";

const PtoVenta = sequelize.define("PtoVenta", {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  descripcion: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  empresa_id: {
    type: DataTypes.INTEGER,
    allowNull: true, // Si está en modo unificado, puede ser null
  },
}, {
  timestamps: false,
  freezeTableName: true,
});

export default PtoVenta;
