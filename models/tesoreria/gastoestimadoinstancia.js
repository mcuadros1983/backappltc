import { DataTypes } from "sequelize";
import { sequelize } from "../../config/database.js";

const GastoEstimadoInstancia = sequelize.define("GastoEstimadoInstancia", { 
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },

  gastoestimado_id: { type: DataTypes.INTEGER, allowNull: false },

  empresa_id: { type: DataTypes.INTEGER, allowNull: true },
  proveedor_id: { type: DataTypes.INTEGER, allowNull: true },
  categoriaegreso_id: { type: DataTypes.INTEGER, allowNull: true },
  sucursal_id: { type: DataTypes.INTEGER, allowNull: true },
  tipocomprobante_id: { type: DataTypes.INTEGER, allowNull: true },
  formapago_id: { type: DataTypes.INTEGER, allowNull: true },

  descripcion: { type: DataTypes.STRING, allowNull: true },

  periodo: { type: DataTypes.STRING(7), allowNull: false }, // 'YYYY-MM'
  fecha_vencimiento: { type: DataTypes.DATEONLY, allowNull: false },

  monto_estimado: { type: DataTypes.DECIMAL(12,2), allowNull: true },
  monto_real: { type: DataTypes.DECIMAL(12,2), allowNull: true },
  monto_pagado: { type: DataTypes.DECIMAL(12,2), allowNull: true, defaultValue: 0 },

  estado: {
    type: DataTypes.ENUM("pendiente", "parcial", "vencido", "pagado", "anulado"),
    allowNull: false,
    defaultValue: "pendiente",
  },
  anulado: { type: DataTypes.BOOLEAN, allowNull: true, defaultValue: false },

  created_from: { type: DataTypes.STRING, allowNull: true }, // 'generado' | 'manual'
  observaciones: { type: DataTypes.TEXT, allowNull: true },
}, {
  tableName: "gasto_estimado_instancia",
  timestamps: false,
  indexes: [
    { fields: ["gastoestimado_id"] },
    { fields: ["empresa_id"] },
    { fields: ["periodo"] },
    { fields: ["fecha_vencimiento"] },
    { fields: ["estado"] },
  ],
});

export default GastoEstimadoInstancia;

