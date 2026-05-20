import { DataTypes } from "sequelize";
import { sequelize } from "../../config/database.js";

const CuponCliente = sequelize.define(
  "CuponCliente",
  {
    id: {
      type: DataTypes.BIGINT,
      autoIncrement: true,
      primaryKey: true,
    },

    numero_cupon: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
    },

    token: {
      type: DataTypes.STRING(120),
      allowNull: false,
      unique: true,
    },

    cliente_id: {
      type: DataTypes.BIGINT,
      allowNull: false,
    },

    participacion_id: {
      type: DataTypes.BIGINT,
      allowNull: false,
    },

    comercio_id: {
      type: DataTypes.BIGINT,
      allowNull: false,
    },

    campania_id: {
      type: DataTypes.BIGINT,
      allowNull: false,
    },

    premio_cliente_id: {
      type: DataTypes.BIGINT,
      allowNull: false,
    },

    estado: {
      type: DataTypes.ENUM(
        "generado",
        "disponible",
        "usado",
        "vencido",
        "anulado",
        "cancelado"
      ),
      allowNull: false,
      defaultValue: "generado",
    },

    fecha_emision: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },

    fecha_vencimiento: {
      type: DataTypes.DATE,
      allowNull: true,
    },

    qr_url: {
      type: DataTypes.TEXT,
      allowNull: true,
    },

    codigo_validacion: {
      type: DataTypes.STRING(50),
      allowNull: true,
      unique: true,
    },
  },
  {
    tableName: "cupones_cliente",
    timestamps: true,
    indexes: [
      { unique: true, fields: ["numero_cupon"] },
      { unique: true, fields: ["token"] },
      { unique: true, fields: ["codigo_validacion"] },
      { fields: ["cliente_id"] },
      { fields: ["comercio_id"] },
      { fields: ["estado"] },
      { fields: ["fecha_vencimiento"] },
    ],
  }
);

export default CuponCliente;