import { DataTypes } from "sequelize";
import { sequelize } from "../../config/database.js";

const CanjeCuponCliente = sequelize.define(
  "CanjeCuponCliente",
  {
    id: {
      type: DataTypes.BIGINT,
      autoIncrement: true,
      primaryKey: true,
    },

    cupon_id: {
      type: DataTypes.BIGINT,
      allowNull: false,
      unique: true,
    },

    cliente_id: {
      type: DataTypes.BIGINT,
      allowNull: false,
    },

    comercio_id: {
      type: DataTypes.BIGINT,
      allowNull: false,
    },

    premio_cliente_id: {
      type: DataTypes.BIGINT,
      allowNull: false,
    },

    sucursal_id: {
      type: DataTypes.BIGINT,
      allowNull: false,
    },

    usuario_id: {
      type: DataTypes.BIGINT,
      allowNull: false,
    },

    fecha_canje: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },

    estado: {
      type: DataTypes.ENUM("confirmado", "anulado", "rechazado"),
      allowNull: false,
      defaultValue: "confirmado",
    },

    observaciones: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    tableName: "canjes_cupon_cliente",
    timestamps: true,
    indexes: [
      { unique: true, fields: ["cupon_id"] },
      { fields: ["sucursal_id"] },
      { fields: ["usuario_id"] },
      { fields: ["comercio_id"] },
      { fields: ["fecha_canje"] },
      { fields: ["estado"] },
    ],
  }
);

export default CanjeCuponCliente;