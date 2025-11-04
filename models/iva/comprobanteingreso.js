import { DataTypes } from "sequelize";
import { sequelize } from "../../config/database.js";

const ComprobanteIngreso = sequelize.define("ComprobanteIngreso", {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  nrocomprobante: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  iva105: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: true,
  },
  iva21: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: true,
  },
  neto: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
  },
  total: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
  },
  tipocomprobante_id: {
    type: DataTypes.INTEGER,
    allowNull: true, // Relación opcional
  },
  ptoventa_id: {
    type: DataTypes.INTEGER,
    allowNull: true, // Relación opcional
  },
  fechavencimiento: {
    type: DataTypes.DATEONLY,
    allowNull: true,
  },
  libroiva_id: {
    type: DataTypes.INTEGER,
    allowNull: true, // Relación opcional
  },
  cliente_id: {
    type: DataTypes.INTEGER,
    allowNull: true, // Relación opcional
  },
  fechacomprobante: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },
  imputacioncontable_id: {
    type: DataTypes.INTEGER,
    allowNull: true, // Relación opcional
  },
  observaciones: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  ctactecliente_id: {
    type: DataTypes.INTEGER,
    allowNull: true, // Relación opcional
  },
  formapago_id: {
    type: DataTypes.INTEGER,
    allowNull: true, // Relación opcional
  },
  estadoPago: {
    type: DataTypes.ENUM("pendiente", "parcial", "pagado"),
    defaultValue: "pendiente",
  },
  conFactura: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
  empresa_id: {
    type: DataTypes.INTEGER,
    allowNull: true, // Si está en modo unificado, puede ser null
  },
}, {
  timestamps: false,
  freezeTableName: true,
});

export default ComprobanteIngreso;
