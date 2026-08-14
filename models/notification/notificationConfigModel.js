import { DataTypes } from "sequelize";
import { sequelize } from "../../config/database.js";

const NotificationConfig = sequelize.define(

    "NotificationConfig",

    {

        id: {

            type: DataTypes.INTEGER,

            primaryKey: true,

            autoIncrement: true

        },

        nombre: {

            type: DataTypes.STRING(100),

            allowNull: false,

            defaultValue: "Configuración Principal"

        },

        smtp_host: {

            type: DataTypes.STRING(150),

            allowNull: false

        },

        smtp_port: {

            type: DataTypes.INTEGER,

            allowNull: false,

            defaultValue: 587

        },

        smtp_secure: {

            type: DataTypes.BOOLEAN,

            allowNull: false,

            defaultValue: false

        },

        smtp_user: {

            type: DataTypes.STRING(150),

            allowNull: false

        },

        smtp_password: {

            type: DataTypes.STRING(250),

            allowNull: false

        },

        remitente_nombre: {

            type: DataTypes.STRING(150),

            allowNull: false

        },

        remitente_email: {

            type: DataTypes.STRING(150),

            allowNull: false

        },

        responder_email: {

            type: DataTypes.STRING(150),

            allowNull: true

        },

        activo: {

            type: DataTypes.BOOLEAN,

            allowNull: false,

            defaultValue: true

        },

        observaciones: {

            type: DataTypes.TEXT,

            allowNull: true

        }

    },

    {

        tableName: "notification_config",

        timestamps: true,

        underscored: true

    }

);

export default NotificationConfig;