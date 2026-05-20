import { DataTypes } from "sequelize";
import { sequelize } from "../../config/database.js";

const CanjePremioComercio = sequelize.define(
  "CanjePremioComercio",
  {
    id: { type: DataTypes.BIGINT, autoIncrement: true, primaryKey: true },

    comercio_id: { type: DataTypes.BIGINT, allowNull: false },
    premio_comercio_id: { type: DataTypes.BIGINT, allowNull: false },

    puntos_requeridos: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },

    estado: {
      type: DataTypes.ENUM(
        "solicitado",
        "pendiente",
        "aprobado",
        "rechazado",
        "entregado",
        "cancelado"
      ),
      allowNull: false,
      defaultValue: "solicitado",
    },

    fecha_solicitud: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },

    fecha_aprobacion: { type: DataTypes.DATE, allowNull: true },
    fecha_entrega: { type: DataTypes.DATE, allowNull: true },

    aprobado_por: { type: DataTypes.BIGINT, allowNull: true },
    rechazado_por: { type: DataTypes.BIGINT, allowNull: true },

    motivo_rechazo: { type: DataTypes.TEXT, allowNull: true },
    observaciones: { type: DataTypes.TEXT, allowNull: true },
  },
  {
    tableName: "canjes_premios_comercio",
    timestamps: true,
    indexes: [
      { fields: ["comercio_id"] },
      { fields: ["premio_comercio_id"] },
      { fields: ["estado"] },
      { fields: ["fecha_solicitud"] },
    ],
  }
);

export default CanjePremioComercio;