import { DataTypes } from "sequelize";
import { sequelize } from "../../config/database.js";

import Usuario from "../auth/usuarioModel.js";

const UserNotification = sequelize.define(

    "UserNotification",

    {

        id: {

            type: DataTypes.INTEGER,

            primaryKey: true,

            autoIncrement: true

        },

        usuario_id: {

            type: DataTypes.INTEGER,

            allowNull: false

        },

        tipo: {

            type: DataTypes.STRING(50),

            allowNull: false,

            defaultValue: "GENERAL"

        },

        titulo: {

            type: DataTypes.STRING(200),

            allowNull: false

        },

        mensaje: {

            type: DataTypes.TEXT,

            allowNull: false

        },

        icono: {

            type: DataTypes.STRING(100),

            allowNull: true

        },

        color: {

            type: DataTypes.STRING(30),

            allowNull: true,

            defaultValue: "primary"

        },

        link: {

            type: DataTypes.STRING(300),

            allowNull: true

        },

        leida: {

            type: DataTypes.BOOLEAN,

            allowNull: false,

            defaultValue: false

        },

        fecha_lectura: {

            type: DataTypes.DATE,

            allowNull: true

        },

        eliminada: {

            type: DataTypes.BOOLEAN,

            allowNull: false,

            defaultValue: false

        }

    },

    {

        tableName: "user_notification",

        timestamps: true,

        underscored: true

    }

);

UserNotification.belongsTo(

    Usuario,

    {

        foreignKey: "usuario_id",

        as: "usuario"

    }

);

Usuario.hasMany(

    UserNotification,

    {

        foreignKey: "usuario_id",

        as: "notificaciones"

    }

);

export default UserNotification;