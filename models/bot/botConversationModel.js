import { DataTypes } from "sequelize";
import {sequelize} from "../../config/database.js";

const BotConversation = sequelize.define(
  "BotConversation",
  {
    id: {
      type: DataTypes.BIGINT,
      autoIncrement: true,
      primaryKey: true,
    },
    canal: {
      type: DataTypes.STRING(30),
      allowNull: false,
      defaultValue: "whatsapp",
    },
    telefono_cliente: {
      type: DataTypes.STRING(40),
      allowNull: false,
    },
    nombre_cliente: {
      type: DataTypes.STRING(120),
      allowNull: true,
    },
    estado: {
      type: DataTypes.STRING(40),
      allowNull: false,
      defaultValue: "open",
    },
    ultima_intencion: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    sucursal_id: {
      type: DataTypes.BIGINT,
      allowNull: true,
    },
    derivada: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    metadata: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: {},
    },
    last_message_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    tableName: "bot_conversations",
    timestamps: true,
    underscored: true,
  }
);

export default BotConversation;