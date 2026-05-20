import { DataTypes } from "sequelize";
import { sequelize } from "../../config/database.js";

const BotMessage = sequelize.define(
  "BotMessage",
  {
    id: {
      type: DataTypes.BIGINT,
      autoIncrement: true,
      primaryKey: true,
    },
    conversation_id: {
      type: DataTypes.BIGINT,
      allowNull: false,
    },
    direction: {
      type: DataTypes.STRING(20),
      allowNull: false,
    },
    type: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: "text",
    },
    text: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    detected_intent: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    model_used: {
      type: DataTypes.STRING(120),
      allowNull: true,
    },
    payload: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: {},
    },
    provider_message_id: {
      type: DataTypes.STRING(255),
      allowNull: true,
      unique: true,
    },
  },
  {
    tableName: "bot_messages",
    timestamps: true,
    underscored: true,
  }
);

export default BotMessage;