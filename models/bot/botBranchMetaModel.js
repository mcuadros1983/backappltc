import { DataTypes } from "sequelize";
import {sequelize} from "../../config/database.js";
import Sucursal from "../gmedias/sucursalModel.js";

const BotBranchMeta = sequelize.define(
  "BotBranchMeta",
  {
    id: {
      type: DataTypes.BIGINT,
      autoIncrement: true,
      primaryKey: true,
    },

    sucursal_id: {
      type: DataTypes.BIGINT,
      allowNull: false,
    },

    nombre_visible: {
      type: DataTypes.STRING(150),
      allowNull: false,
    },

    direccion: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },

    google_maps_url: {
      type: DataTypes.TEXT,
      allowNull: true,
    },

    lat: {
      type: DataTypes.DECIMAL(10, 7),
      allowNull: true,
    },

    lon: {
      type: DataTypes.DECIMAL(10, 7),
      allowNull: true,
    },

    zona: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },

    aliases: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: [],
    },

    horario_atencion: {
      type: DataTypes.TEXT,
      allowNull: true,
    },

    telefono: {
      type: DataTypes.STRING(80),
      allowNull: true,
    },

    mensaje_bot: {
      type: DataTypes.TEXT,
      allowNull: true,
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
    tableName: "BotBranchMeta",
    timestamps: true,
  }
);

BotBranchMeta.belongsTo(Sucursal, {
  foreignKey: "sucursal_id",
  as: "sucursal",
});

Sucursal.hasOne(BotBranchMeta, {
  foreignKey: "sucursal_id",
  as: "bot_meta",
});

export default BotBranchMeta;