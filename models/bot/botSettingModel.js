import { DataTypes } from "sequelize";
import { sequelize } from "../../config/database.js";

const BotSetting = sequelize.define(
  "BotSetting",
  {
    id: {
      type: DataTypes.BIGINT,
      autoIncrement: true,
      primaryKey: true,
    },
    nombre_visible: {
      type: DataTypes.STRING(120),
      allowNull: false,
      defaultValue: "Asistente La Tradición",
    },
    activo: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    provider: {
      type: DataTypes.STRING(30),
      allowNull: false,
      defaultValue: "meta",
    },
    whatsapp_number: {
      type: DataTypes.STRING(40),
      allowNull: true,
    },
    verify_token: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    access_token: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    phone_number_id: {
      type: DataTypes.STRING(120),
      allowNull: true,
    },
    graph_api_version: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: "v23.0",
    },
    welcome_message: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    fallback_message: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    handoff_message: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    payments_message: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    promotions_message: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    branches_message: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    use_openai_for_advice: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    default_listaprecio_id: {
      type: DataTypes.BIGINT,
      allowNull: true,
    },
    default_sucursal_id: {
      type: DataTypes.BIGINT,
      allowNull: true,
    },
    model_name: {
      type: DataTypes.STRING(120),
      allowNull: true,
      defaultValue: "gpt-5",
    },
    temperature: {
      type: DataTypes.DECIMAL(4, 2),
      allowNull: false,
      defaultValue: 0.2,
    },
    max_options: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 3,
    },
  },
  {
    tableName: "bot_settings",
    timestamps: true,
    underscored: true,
  }
);

export default BotSetting;