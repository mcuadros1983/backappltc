import { DataTypes } from "sequelize";
import { sequelize } from "../../config/database.js";

import NotificationEvent from "./notificationEventModel.js";

const NotificationRecipient = sequelize.define(

    "NotificationRecipient",

    {

        id: {

            type: DataTypes.INTEGER,

            primaryKey: true,

            autoIncrement: true

        },

        evento_id: {

            type: DataTypes.INTEGER,

            allowNull: false

        },

        nombre: {

            type: DataTypes.STRING(150),

            allowNull: false

        },

        email: {

            type: DataTypes.STRING(200),

            allowNull: false

        },

        descripcion: {

            type: DataTypes.STRING(300),

            allowNull: true

        },

        activo: {

            type: DataTypes.BOOLEAN,

            defaultValue: true

        }

    },

    {

        tableName: "notification_recipient",

        timestamps: true,

        underscored: true

    }

);

NotificationRecipient.belongsTo(

    NotificationEvent,

    {

        foreignKey: "evento_id",

        as: "evento"

    }

);

NotificationEvent.hasMany(

    NotificationRecipient,

    {

        foreignKey: "evento_id",

        as: "destinatarios"

    }

);

export default NotificationRecipient;