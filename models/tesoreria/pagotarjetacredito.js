// models/tesoreria/PagoTarjetaCredito.js
import { DataTypes } from "sequelize";
import { sequelize } from "../../config/database.js";

const PagoTarjetaCredito = sequelize.define("PagoTarjetaCredito", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },

  fecha: { type: DataTypes.DATEONLY, allowNull: false },
  importe: { type: DataTypes.DECIMAL(12, 2), allowNull: false },

  comprobanteegreso_id: { type: DataTypes.INTEGER, allowNull: true },

  // 🔹 NUEVO: FK a la tarjeta para poder filtrar por terminación
  tarjetacomun_id: { type: DataTypes.INTEGER, allowNull: true },

  tipotarjeta_id: { type: DataTypes.INTEGER, allowNull: true },
  marcatarjeta_id: { type: DataTypes.INTEGER, allowNull: true },

  proveedor_id: { type: DataTypes.INTEGER, allowNull: true },
  empresa_id: { type: DataTypes.INTEGER, allowNull: true },

  cupon_numero: { type: DataTypes.STRING, allowNull: true },
  planpago_id: { type: DataTypes.INTEGER, allowNull: true },

  concepto: { type: DataTypes.STRING, allowNull: true },
  observaciones: { type: DataTypes.TEXT, allowNull: true },

  estado: {
    type: DataTypes.ENUM("pendiente", "aprobado", "rechazado", "acreditado"),
    defaultValue: "pendiente"
  },

  anulado: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
  ordenpago_id: { type: DataTypes.INTEGER, allowNull: true },
  // Para derivar imputación contable automática
  categoriaegreso_id: { type: DataTypes.INTEGER, allowNull: true },
  imputacioncontable_id: { type: DataTypes.INTEGER, allowNull: true },
  proyecto_id: { type: DataTypes.INTEGER, allowNull: true },
  referencia_id: {
    type: DataTypes.INTEGER, // id del modelo origen (adelanto, sueldo, etc.)
    allowNull: true,
  },
  referencia_tipo: {
    type: DataTypes.STRING, // nombre del modelo origen
    allowNull: true,
  },
}, {
  tableName: "pago_tarjeta_credito",
  timestamps: false,
  freezeTableName: true
});

export default PagoTarjetaCredito;
