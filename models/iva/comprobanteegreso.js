import { DataTypes } from "sequelize";
import { sequelize } from "../../config/database.js";

const ComprobanteEgreso = sequelize.define("ComprobanteEgreso", {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  // ctacteproveedor_id: {
  //   type: DataTypes.INTEGER,
  //   allowNull: true, // Relación opcional
  // },
  fechacomprobante: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },
  fechavencimiento: {
    type: DataTypes.DATEONLY,
    allowNull: true,
  },
  formapago_id: {
    type: DataTypes.INTEGER,
    allowNull: true, // Relación obligatoria
  },
  imputacioncontable_id: {
    type: DataTypes.INTEGER,
    allowNull: false, // Relación obligatoria
  },
  iva105: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: true,
  },

  iva21: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: true,
  },

  // IVA correspondiente a una alícuota distinta
  // de las estándar 10,5% y 21%.
  iva_especial: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: true,
  },

  // Alícuota correspondiente a iva_especial.
  // Ej.: 27.00, 5.00, 2.50, etc.
  iva_especial_porcentaje: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: true,
  },

  percepcion_iva: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: true,
  },

  percepcion_ganancias: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: true,
  },

  percepcion_iibb: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: true,
  },

  impuestos_internos: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: true,
  },

  exento_no_gravado: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: true,
  },

  letra: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  neto: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
  },
  libroiva_id: {
    type: DataTypes.INTEGER,
    allowNull: false, // Relación obligatoria
  },
  nrocomprobante: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  observaciones: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  proveedor_id: {
    type: DataTypes.INTEGER,
    allowNull: true, // Relación opcional
  },
  tipocomprobante_id: {
    type: DataTypes.INTEGER,
    allowNull: false, // Relación obligatoria
  },
  total: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
  },
  retencion: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: true,
  },
  ptoventa_id: {
    type: DataTypes.INTEGER,
    allowNull: true, // Relación opcional
  },
  estadopago: {
    type: DataTypes.ENUM("pagada", "impaga", "parcial"),
    defaultValue: "impaga",
  },
  conFactura: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
  hacienda_id: {
    type: DataTypes.INTEGER,
    allowNull: true, // Relación opcional
  },
  fechapago: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },
  montoreal: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
  },
  diferenciaefectivo: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
  },
  // en ComprobanteEgreso:
  saldo: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
    defaultValue: 0,
  },
  empresa_id: {
    type: DataTypes.INTEGER,
    allowNull: true, // Relación obligatoria
  },
  ordenpago_id: {
    type: DataTypes.INTEGER,
    allowNull: true, // Relación obligatoria
  },
}, {
  timestamps: false,
  indexes: [
    { fields: ["empresa_id"] },
    { fields: ["proveedor_id"] },
    { fields: ["estadopago"] },
    { fields: ["fechacomprobante"] },
    { fields: ["formapago_id"] },
    { fields: ["imputacioncontable_id"] },
  ],
});

export default ComprobanteEgreso;
