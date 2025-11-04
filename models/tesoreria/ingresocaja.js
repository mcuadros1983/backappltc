import { DataTypes } from "sequelize";
import { sequelize } from "../../config/database.js";

const IngresoCaja = sequelize.define("IngresoCaja", {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  descripcion: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  categoriaingreso_id: {
    type: DataTypes.INTEGER,
    allowNull: false, // Relación obligatoria
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
  caja_id: {
    type: DataTypes.INTEGER,
    allowNull: false, // Relación obligatoria
  },
  sucursal_id: {
    type: DataTypes.INTEGER,
    allowNull: true, // Relación opcional
  },
  cliente_id: {
    type: DataTypes.INTEGER,
    allowNull: true, // Relación opcional
  },
  retiro_id: {
    type: DataTypes.INTEGER,
    allowNull: true, // Relación opcional
  },
  comprobanteingreso_id: {
    type: DataTypes.INTEGER,
    allowNull: true, // Relación opcional
  },
  formapago_id: {
    type: DataTypes.INTEGER,
    allowNull: true, // Relación opcional
  },
  proyecto_id: {
    type: DataTypes.INTEGER,
    allowNull: true, // Relación opcional
  },
  banco_id: {
    type: DataTypes.INTEGER,
    allowNull: true, // Relación opcional
  },
  registrobanco_id: {
    type: DataTypes.INTEGER,
    allowNull: true, // Relación opcional
  },
}, {
  timestamps: false,
  freezeTableName: true,
});

export default IngresoCaja;
