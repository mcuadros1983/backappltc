// models/tesoreria/OrdenPago.js  
import { DataTypes } from "sequelize";
import { sequelize } from "../../config/database.js";

const OrdenPago = sequelize.define("OrdenPago", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },

  // Multiempresa
  empresa_id: { type: DataTypes.INTEGER, allowNull: false },

  // Relación principal (una orden por comprobante de egreso)
  comprobanteegreso_id: { type: DataTypes.INTEGER, allowNull: true },

  // Redundancia útil para consultas (opcional)
  proveedor_id: { type: DataTypes.INTEGER, allowNull: true },

  // Datos de la orden
  fecha: { type: DataTypes.DATEONLY, allowNull: false },              // fecha de emisión de la orden
  total: { type: DataTypes.DECIMAL(12, 2), allowNull: false },        // suma de los pagos asociados

  // Estado del ciclo de vida de la orden
  estado: {
    type: DataTypes.ENUM("pendiente_aplicacion","emitida", "parcial", "aplicada", "anulada"),
    defaultValue: "emitida",
  },

  // Numeración/identificador interno de la orden (opcional)
  numero: { type: DataTypes.STRING, allowNull: true },

  // Notas
  observaciones: { type: DataTypes.TEXT, allowNull: true },
  // Opcional, útil si querés rastrear origen (“caja”, “banco”, etc.)
  origen: { type: DataTypes.STRING, allowNull: true },

  // Idempotencia (opcional pero recomendado)
  idempotency_key: { type: DataTypes.STRING, allowNull: true, unique: true },

}, {
  tableName: "orden_pago",
  timestamps: false,
});


export default OrdenPago;
