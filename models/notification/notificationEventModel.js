// models/notification/notificationEventModel.js

import { DataTypes } from "sequelize";
import { sequelize } from "../../config/database.js";

const NotificationEvent = sequelize.define(

    "NotificationEvent",

    {

        id: {

            type: DataTypes.INTEGER,

            primaryKey: true,

            autoIncrement: true

        },

        codigo: {

            type: DataTypes.STRING(100),

            allowNull: false,

            unique: true

        },

        nombre: {

            type: DataTypes.STRING(150),

            allowNull: false

        },

        descripcion: {

            type: DataTypes.STRING(300),

            allowNull: true

        },

        categoria: {

            type: DataTypes.STRING(100),

            allowNull: true

        },

        activo: {

            type: DataTypes.BOOLEAN,

            defaultValue: true

        }, email: {

            type: DataTypes.BOOLEAN,

            defaultValue: true

        },

        interna: {

            type: DataTypes.BOOLEAN,

            defaultValue: true

        },

        whatsapp: {

            type: DataTypes.BOOLEAN,

            defaultValue: false

        },

        dashboard: {

            type: DataTypes.BOOLEAN,

            defaultValue: false

        },

        auditoria: {

            type: DataTypes.BOOLEAN,

            defaultValue: false

        },

        dias_antes: {

            type: DataTypes.INTEGER,

            defaultValue: 0

        },

        dias_despues: {

            type: DataTypes.INTEGER,

            defaultValue: 0

        }

    },

    {

        tableName: "notification_event",

        timestamps: true,

        underscored: true

    }

);

export default NotificationEvent;