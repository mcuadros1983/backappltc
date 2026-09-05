import { DataTypes } from "sequelize";
import { sequelize } from "../../config/database.js";

const AjusteComprobanteEgreso = sequelize.define(
  "AjusteComprobanteEgreso",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },

    comprobanteegreso_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },

    empresa_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },

    proveedor_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },

    fecha: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },

    tipo: {
      type: DataTypes.ENUM(
        "aumenta",
        "disminuye"
      ),
      allowNull: false,
    },

    concepto: {
      type: DataTypes.STRING,
      allowNull: false,
    },

    importe: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
    },

    detalle: {
      type: DataTypes.STRING,
      allowNull: true,
    },

    observaciones: {
      type: DataTypes.TEXT,
      allowNull: true,
    },

    referencia_tipo: {
      type: DataTypes.STRING,
      allowNull: true,
    },

    referencia_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },

    anulado: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
  },
  {
    tableName: "ajuste_comprobante_egreso",
    timestamps: false,
    freezeTableName: true,
    indexes: [
      {
        fields: ["comprobanteegreso_id"],
      },
      {
        fields: ["empresa_id", "proveedor_id"],
      },
    ],
  }
);

export default AjusteComprobanteEgreso;