import { DataTypes } from "sequelize";
import { sequelize } from "../../config/database.js";

const PuntoComercioMovimiento = sequelize.define(
  "PuntoComercioMovimiento",
  {
    id: {
      type: DataTypes.BIGINT,
      autoIncrement: true,
      primaryKey: true,
    },

    comercio_id: {
      type: DataTypes.BIGINT,
      allowNull: false,
    },

    cupon_id: {
      type: DataTypes.BIGINT,
      allowNull: true,
    },

    canje_cupon_id: {
      type: DataTypes.BIGINT,
      allowNull: true,
    },

    tipo_movimiento: {
      type: DataTypes.ENUM(
        "acreditacion",
        "debito_canje",
        "devolucion",
        "vencimiento",
        "ajuste_manual",
        "reversion"
      ),
      allowNull: false,
    },

    puntos: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },

    fecha_movimiento: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },

    fecha_vencimiento: {
      type: DataTypes.DATE,
      allowNull: true,
    },

    estado: {
      type: DataTypes.ENUM("activo", "usado", "vencido", "anulado"),
      allowNull: false,
      defaultValue: "activo",
    },

    motivo: {
      type: DataTypes.TEXT,
      allowNull: true,
    },

    created_by: {
      type: DataTypes.BIGINT,
      allowNull: true,
    },

    canje_premio_comercio_id: {
      type: DataTypes.BIGINT,
      allowNull: true,
    },
  },
  {
    tableName: "puntos_comercio_movimientos",
    timestamps: true,
    indexes: [
      { fields: ["comercio_id"] },
      { fields: ["tipo_movimiento"] },
      { fields: ["estado"] },
      { fields: ["fecha_movimiento"] },
      { fields: ["fecha_vencimiento"] },
      { fields: ["cupon_id"] },
      { fields: ["canje_cupon_id"] },
      { fields: ["canje_premio_comercio_id"] },
    ],
  }
);

export default PuntoComercioMovimiento;