// models/AdicionalFijoValor.js  (histórico global por tipo)
import { DataTypes } from "sequelize";
import { sequelize } from "../../config/database.js";

const AdicionalFijoValor = sequelize.define("AdicionalFijoValor", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  adicionalfijotipo_id: { type: DataTypes.INTEGER, allowNull: false },
  vigencia_desde: { type: DataTypes.DATEONLY, allowNull: false },
  vigencia_hasta: { type: DataTypes.DATEONLY, allowNull: true },
  monto: { type: DataTypes.DECIMAL(12,2), allowNull: false },
}, { timestamps: false });

export default AdicionalFijoValor;
