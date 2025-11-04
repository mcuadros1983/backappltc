// models/Recibo.js
import { DataTypes } from "sequelize"; 
import { sequelize } from "../../config/database.js";

const Recibo = sequelize.define("Recibo", { 
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  periodo_id: { type: DataTypes.INTEGER, allowNull: false },
  empleado_id: { type: DataTypes.INTEGER, allowNull: false },
  sueldo: { type: DataTypes.DECIMAL(12,2), allowNull: true }, // si lo usás
  totalhaberes: { type: DataTypes.DECIMAL(12,2), allowNull: true, defaultValue: 0 },
  descuentos: { type: DataTypes.DECIMAL(12,2), allowNull: true, defaultValue: 0 },
  acobrarporbanco: { type: DataTypes.DECIMAL(12,2), allowNull: true, defaultValue: 0 },
  acobrarporsucursal: { type: DataTypes.DECIMAL(12,2), allowNull: true, defaultValue: 0 },
  estado: { type: DataTypes.STRING, allowNull: false, defaultValue: "calculado" },
  locked_at: { type: DataTypes.DATE, allowNull: true },
  empresa_id: { type: DataTypes.INTEGER, allowNull: false },
}, { timestamps: true });

export default Recibo;
