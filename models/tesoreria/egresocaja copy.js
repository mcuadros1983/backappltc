import { DataTypes } from "sequelize";
import { sequelize } from "../../config/database.js";

const EgresoCaja = sequelize.define("EgresoCaja", {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  descripcion: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  monto: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
  },
  operacion: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  fecha: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },
  observaciones: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  caja_id: {
    type: DataTypes.INTEGER,
    allowNull: false, // Relación obligatoria
  },
  categoriaegreso_id: {
    type: DataTypes.INTEGER,
    allowNull: false, // Relación obligatoria
  },
  sucursal_id: {
    type: DataTypes.INTEGER,
    allowNull: true, // Relación opcional
  },
  empleado_id: {
    type: DataTypes.INTEGER,
    allowNull: true, // Relación opcional
  },
  sueldo_id: {
    type: DataTypes.INTEGER,
    allowNull: true, // Relación opcional con Sueldo
  },
  proveedor_id: {
    type: DataTypes.INTEGER,
    allowNull: true, // Relación opcional
  },
  comprobanteegreso_id: {
    type: DataTypes.INTEGER,
    allowNull: true, // Relación opcional
  },
  empresa_id: {
    type: DataTypes.INTEGER,
    allowNull: true, // Relación opcional
  },
  banco_id: {
    type: DataTypes.INTEGER,
    allowNull: true, // Relación opcional
  },
  proyecto_id: {
    type: DataTypes.INTEGER,
    allowNull: true, // Relación opcional
  },
  formapago_id: {
    type: DataTypes.INTEGER,
    allowNull: true, // Relación opcional
  },
  registrobanco: {
    type: DataTypes.INTEGER,
    allowNull: true, // Relación opcional
  },
  pagoproveedor_id: {
    type: DataTypes.INTEGER,
    allowNull: true, // Relación opcional
  },
}, {
  timestamps: false,
  freezeTableName: true,
});

export default EgresoCaja;
