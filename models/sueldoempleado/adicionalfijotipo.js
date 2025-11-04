// models/AdicionalFijoTipo.js  (catálogo de adicionales fijos)
import { DataTypes } from "sequelize";
import { sequelize } from "../../config/database.js";

const AdicionalFijoTipo = sequelize.define("AdicionalFijoTipo", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  descripcion: { type: DataTypes.TEXT, allowNull: true },
  empresa_id: { type: DataTypes.INTEGER, allowNull: true },
}, { timestamps: false });

export default AdicionalFijoTipo;
