import { DataTypes } from "sequelize";
import { sequelize } from "../../config/database.js";

const NotificationHistory = sequelize.define(

    "NotificationHistory",

    {

        id: {

            type: DataTypes.INTEGER,

            primaryKey: true,

            autoIncrement: true

        },

        tipo: {

            type: DataTypes.STRING(100),

            allowNull: false

        },

        canal: {

            type: DataTypes.STRING(30),

            allowNull: false,

            defaultValue: "EMAIL"

        },

        destinatario: {

            type: DataTypes.STRING(200),

            allowNull: false

        },

        asunto: {

            type: DataTypes.STRING(250),

            allowNull: false

        },

        contenido: {

            type: DataTypes.TEXT,

            allowNull: true

        },

        estado: {

            type: DataTypes.STRING(30),

            allowNull: false,

            defaultValue: "PENDIENTE"

        },

        intentos: {

            type: DataTypes.INTEGER,

            allowNull: false,

            defaultValue: 1

        },

        fecha_envio: {

            type: DataTypes.DATE,

            allowNull: true

        },

        error: {

            type: DataTypes.TEXT,

            allowNull: true

        }

    },

    {

        tableName: "notification_history",

        timestamps: true,

        underscored: true

    }

);

export default NotificationHistory;