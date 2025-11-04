// models/PeriodoLiquidacion.js
import { DataTypes } from "sequelize"; 
import { sequelize } from "../../config/database.js";

const PeriodoLiquidacion = sequelize.define("PeriodoLiquidacion", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  anio: { type: DataTypes.INTEGER, allowNull: false },
  mes: { type: DataTypes.INTEGER, allowNull: false },
  fecha_desde: { type: DataTypes.DATEONLY, allowNull: false },
  fecha_hasta: { type: DataTypes.DATEONLY, allowNull: false },
  estado: { type: DataTypes.STRING, allowNull: false, defaultValue: "abierto" },
}, { timestamps: true });

export default PeriodoLiquidacion;
