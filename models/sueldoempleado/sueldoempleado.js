import { DataTypes } from "sequelize";
import { sequelize } from "../../config/database.js";

const SueldoEmpleado = sequelize.define("SueldoEmpleado", {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  empleado_id: {
    type: DataTypes.INTEGER,
    allowNull: false, // Relación obligatoria con Empleado
  },
  mes: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  anio: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  fecha: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },
  total: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
  },
}, {
  timestamps: false,
  freezeTableName: true,
});

export default SueldoEmpleado;
