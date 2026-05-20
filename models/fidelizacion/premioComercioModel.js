import { DataTypes } from "sequelize";
import { sequelize } from "../../config/database.js";

const PremioComercio = sequelize.define(
  "PremioComercio",
  {
    id: { type: DataTypes.BIGINT, autoIncrement: true, primaryKey: true },

    nombre: { type: DataTypes.STRING(150), allowNull: false },
    descripcion: { type: DataTypes.TEXT, allowNull: true },

    tipo_premio: {
      type: DataTypes.ENUM(
        "producto",
        "combo",
        "efectivo",
        "orden_compra",
        "descuento",
        "beneficio",
        "publicidad"
      ),
      allowNull: false,
      defaultValue: "producto",
    },

    costo_puntos: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },

    stock_total: { type: DataTypes.INTEGER, allowNull: true },

    ilimitado: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },

    estado: {
      type: DataTypes.ENUM("activo", "inactivo", "agotado", "pausado"),
      allowNull: false,
      defaultValue: "activo",
    },

    imagen_url: { type: DataTypes.TEXT, allowNull: true },

    created_by: { type: DataTypes.BIGINT, allowNull: true },
    updated_by: { type: DataTypes.BIGINT, allowNull: true },
  },
  {
    tableName: "premios_comercio",
    timestamps: true,
    indexes: [{ fields: ["estado"] }, { fields: ["tipo_premio"] }],
  }
);

export default PremioComercio;