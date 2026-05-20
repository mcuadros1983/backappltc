import { DataTypes } from "sequelize";
import {sequelize} from "../../config/database.js";
import Sucursal from "../gmedias/sucursalModel.js";

const BotBenefitMeta = sequelize.define(
  "BotBenefitMeta",
  {
    id: {
      type: DataTypes.BIGINT,
      autoIncrement: true,
      primaryKey: true,
    },

    tipo_beneficio: {
      type: DataTypes.STRING(80),
      allowNull: false,
    },

    titulo: {
      type: DataTypes.STRING(180),
      allowNull: false,
    },

    descripcion: {
      type: DataTypes.TEXT,
      allowNull: true,
    },

    porcentaje_descuento: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
    },

    condiciones: {
      type: DataTypes.TEXT,
      allowNull: true,
    },

    dias_aplica: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: [],
    },

    horario_aplica: {
      type: DataTypes.STRING(120),
      allowNull: true,
    },

    sucursal_id: {
      type: DataTypes.BIGINT,
      allowNull: true,
    },

    aplica_todas_sucursales: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },

    medio_pago: {
      type: DataTypes.STRING(120),
      allowNull: true,
    },

    entidad: {
      type: DataTypes.STRING(160),
      allowNull: true,
    },

    mensaje_bot: {
      type: DataTypes.TEXT,
      allowNull: true,
    },

    aliases: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: [],
    },

    activo_bot: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },

    prioridad: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
  },
  {
    tableName: "BotBenefitMeta",
    timestamps: true,
  }
);

BotBenefitMeta.belongsTo(Sucursal, {
  foreignKey: "sucursal_id",
  as: "sucursal",
});

Sucursal.hasMany(BotBenefitMeta, {
  foreignKey: "sucursal_id",
  as: "bot_benefits",
});

export default BotBenefitMeta;