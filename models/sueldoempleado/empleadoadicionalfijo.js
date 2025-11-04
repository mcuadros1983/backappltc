// models/EmpleadoAdicionalFijo.js  (asignación del fijo al empleado con vigencia + override opcional)
import { DataTypes } from "sequelize";
import { sequelize } from "../../config/database.js";

const EmpleadoAdicionalFijo = sequelize.define("EmpleadoAdicionalFijo", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  empleado_id: { type: DataTypes.INTEGER, allowNull: false },
  adicionalfijotipo_id: { type: DataTypes.INTEGER, allowNull: false },
  // Vigencia de la asignación (si pierde el adicional, se cierra vigencia_hasta)
  vigencia_desde: { type: DataTypes.DATEONLY, allowNull: false },
  vigencia_hasta: { type: DataTypes.DATEONLY, allowNull: true },
  // Si querés un monto particular para ese empleado (sino usa el valor global del tipo)
  monto_override: { type: DataTypes.DECIMAL(12,2), allowNull: true },
}, { timestamps: true });

export default EmpleadoAdicionalFijo;
