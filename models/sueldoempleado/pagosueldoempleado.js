import { DataTypes } from "sequelize";
import { sequelize } from "../../config/database.js";

const PagoSueldoEmpleado = sequelize.define("PagoSueldoEmpleado", {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  sueldoId: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  cajaId: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  descripcion: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  empleado_id: {
    type: DataTypes.INTEGER,
    allowNull: true, // Relación opcional
  },
  fecha: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },
  importe: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
  },
  sucursal_id: {
    type: DataTypes.INTEGER,
    allowNull: true, // Relación opcional
  },
  sueldo_id: {
    type: DataTypes.INTEGER,
    allowNull: true, // Relación opcional
  },
    formapago_id: {
    type: DataTypes.INTEGER,
    allowNull: true, // Relación opcional
  },
}, {
  timestamps: false,
  freezeTableName: true,
});

export default PagoSueldoEmpleado;
