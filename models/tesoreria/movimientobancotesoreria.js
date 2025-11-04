// src/models/tesoreria/movimientobancotesoreria.js
import { DataTypes } from "sequelize";
import { sequelize } from "../../config/database.js";

const MovimientoBancoTesoreria = sequelize.define("MovimientoBancoTesoreria", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },

  tipo: {
    type: DataTypes.ENUM("ingreso", "egreso"),
    allowNull: false,
  },

  descripcion: {
    type: DataTypes.STRING,
    allowNull: false,
  },

  monto: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },

  fecha: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },

  banco_id: {               // 💡 en vez de caja_id
    type: DataTypes.INTEGER,
    allowNull: false,
  },

  empresa_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },

  formapago_id: {           // transferencia, cheque, etc.
    type: DataTypes.INTEGER,
    allowNull: true,
  },

  referencia_id: {          // id del modelo origen (OP, sueldo, etc.)
    type: DataTypes.INTEGER,
    allowNull: true,
  },

  referencia_tipo: {        // nombre del modelo origen
    type: DataTypes.STRING,
    allowNull: true,
  },

  observaciones: {
    type: DataTypes.TEXT,
    allowNull: true,
  },

  anulado: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  },

  ordenpago_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  proyecto_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  comprobanteegreso_id: {               // 💡 en vez de caja_id
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  comprobanteingreso_id: {               // 💡 en vez de caja_id
    type: DataTypes.INTEGER,
    allowNull: true,
  },
    proveedor_id: {               // 💡 en vez de caja_id
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  // Para derivar imputación contable automática (paridad con Caja)
  categoriaegreso_id: { type: DataTypes.INTEGER, allowNull: true },
  categoriaingreso_id: { type: DataTypes.INTEGER, allowNull: true },
  imputacioncontable_id: { type: DataTypes.INTEGER, allowNull: true },

  // Idempotencia (paridad con Caja)
  idempotency_key: { type: DataTypes.STRING, allowNull: true, unique: true },
}, {
  tableName: "movimiento_banco_tesoreria",
  timestamps: false,
});

export default MovimientoBancoTesoreria;
