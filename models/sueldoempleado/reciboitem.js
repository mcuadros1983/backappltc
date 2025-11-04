// models/ReciboItem.js
import { DataTypes } from "sequelize"; 
import { sequelize } from "../../config/database.js";

const ReciboItem = sequelize.define("ReciboItem", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  recibo_id: { type: DataTypes.INTEGER, allowNull: false },
  tipo: { type: DataTypes.STRING, allowNull: false }, // "BASICO" | "FIJO" | "VARIABLE" | "DESCUENTO"
  referencia: { type: DataTypes.STRING, allowNull: true }, // p.ej. codigo
  descripcion: { type: DataTypes.STRING, allowNull: false },
  cantidad: { type: DataTypes.DECIMAL(12,2), allowNull: true },
  monto_unitario: { type: DataTypes.DECIMAL(12,2), allowNull: true },
  monto_total: { type: DataTypes.DECIMAL(12,2), allowNull: true },
  fuente_id: { type: DataTypes.INTEGER, allowNull: true }, // id fuente (EmpleadoAdicionalFijo / AdicionalVariable)
}, { timestamps: true });

export default ReciboItem;
