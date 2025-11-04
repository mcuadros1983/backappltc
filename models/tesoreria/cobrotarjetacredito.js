import { DataTypes } from "sequelize";
import { sequelize } from "../../config/database.js";

const CobroTarjetaCredito = sequelize.define("CobroTarjetaCredito", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },

  // Fecha del registro / operación
  fecha: { type: DataTypes.DATEONLY, allowNull: false },

  // Monto cobrado
  importe: { type: DataTypes.DECIMAL(12, 2), allowNull: false },

  // Relación con el comprobante de ingreso (cuando el cobro es por tarjeta)
  comprobanteingreso_id: { type: DataTypes.INTEGER, allowNull: true },

  // Tarjeta seleccionada del maestro (tu modelo TarjetaComun)
  tipotarjeta_id: { type: DataTypes.INTEGER, allowNull: true },

  // Tarjeta seleccionada del maestro (tu modelo TarjetaComun)
  marcatarjeta_id: { type: DataTypes.INTEGER, allowNull: true },

  // Identificación del cliente (si aplica “Cuenta CLIENTE1”)
  cliente_id: { type: DataTypes.INTEGER, allowNull: true },

  // Empresa (multiempresa)
  empresa_id: { type: DataTypes.INTEGER, allowNull: true },

  // Datos operativos del cupón
  titular_nombre: { type: DataTypes.STRING, allowNull: true },              // "Tarj. a Nombre de"
  numero_tarjeta_ult4: {
    type: DataTypes.STRING(4),
    allowNull: true,
    validate: { isNumeric: true, len: [4, 4] }
  }, // NO guardar PAN completo

  cupon_numero: { type: DataTypes.STRING, allowNull: true },                // “N° de Cupón”
  cuotas: { type: DataTypes.INTEGER, allowNull: true, validate: { min: 1 } }, // “Cant. Cuotas

  concepto: { type: DataTypes.STRING, allowNull: true },                     // “Concepto”
  observaciones: { type: DataTypes.TEXT, allowNull: true },

  // Estado del cobro / liquidación
  estado: {
    type: DataTypes.ENUM("pendiente", "aprobado", "rechazado", "acreditado"),
    defaultValue: "pendiente"
  }
}, {
  tableName: "cobro_tarjeta_credito",
  timestamps: false,
  freezeTableName: true
});

export default CobroTarjetaCredito;
