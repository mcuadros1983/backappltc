import { DataTypes } from "sequelize";
import { sequelize } from "../../config/database.js";

const CajaTesoreria = sequelize.define("CajaTesoreria", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  fecha_apertura: { type: DataTypes.DATEONLY, allowNull: false },
  fecha_cierre: { type: DataTypes.DATEONLY },
  caja_inicial: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
  caja_final: { type: DataTypes.DECIMAL(10, 2) },
  sucursal_id: { type: DataTypes.INTEGER, allowNull: true },
  usuario_id: { type: DataTypes.INTEGER, allowNull: true }
}, {
  tableName: "caja_tesoreria", // mejor convención SQL
  timestamps: false             // si no estás usando createdAt y updatedAt
});

export default CajaTesoreria;