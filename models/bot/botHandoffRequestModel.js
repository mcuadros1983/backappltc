import { DataTypes } from "sequelize";
import {sequelize} from "../../config/database.js";

const BotHandoffRequest = sequelize.define(
  "BotHandoffRequest",
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
    motivo: {
      type: DataTypes.STRING(120),
      allowNull: false,
    },
    observaciones: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    estado: {
      type: DataTypes.STRING(30),
      allowNull: false,
      defaultValue: "pending",
    },
    assigned_user_id: {
      type: DataTypes.BIGINT,
      allowNull: true,
    },
    taken_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    closed_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    tableName: "bot_handoff_requests",
    timestamps: true,
    underscored: true,
  }
);

export default BotHandoffRequest;