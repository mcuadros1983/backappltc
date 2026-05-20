import { DataTypes } from "sequelize";
import { sequelize } from "../../config/database.js";

const PremioCliente = sequelize.define(
  "PremioCliente",
  {
    id: {
      type: DataTypes.BIGINT,
      autoIncrement: true,
      primaryKey: true,
    },

    campania_id: {
      type: DataTypes.BIGINT,
      allowNull: false,
    },

    articulo_id: {
      type: DataTypes.BIGINT,
      allowNull: true,
    },

    nombre: {
      type: DataTypes.STRING(150),
      allowNull: false,
    },

    descripcion: {
      type: DataTypes.TEXT,
      allowNull: true,
    },

    tipo_premio: {
      type: DataTypes.ENUM(
        "producto",
        "descuento_porcentaje",
        "descuento_monto",
        "combo",
        "beneficio",
        "siga_participando"
      ),
      allowNull: false,
    },

    valor: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: true,
    },

    probabilidad: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: false,
      defaultValue: 0,
    },

    prioridad: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
    },

    stock_total: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },

    stock_diario: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },

    ilimitado: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },

    vence_cupon: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },

    dias_vencimiento_cupon: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 7,
    },

    puntos_otorga_comercio: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },

    estado: {
      type: DataTypes.ENUM(
        "activo",
        "inactivo",
        "agotado",
        "pausado",
        "finalizado"
      ),
      allowNull: false,
      defaultValue: "activo",
    },

    created_by: {
      type: DataTypes.BIGINT,
      allowNull: true,
    },

    updated_by: {
      type: DataTypes.BIGINT,
      allowNull: true,
    },
  },
  {
    tableName: "premios_cliente",
    timestamps: true,
    indexes: [
      { fields: ["campania_id"] },
      { fields: ["estado"] },
      { fields: ["tipo_premio"] },
    ],
  }
);

export default PremioCliente;