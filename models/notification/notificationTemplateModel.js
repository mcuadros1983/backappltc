import { DataTypes } from "sequelize";
import { sequelize } from "../../config/database.js";

const NotificationTemplate = sequelize.define(

    "NotificationTemplate",

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

            type: DataTypes.STRING(250),

            allowNull: true

        },

        asunto: {

            type: DataTypes.STRING(250),

            allowNull: false

        },

        html: {

            type: DataTypes.TEXT,

            allowNull: false

        },

        texto: {

            type: DataTypes.TEXT,

            allowNull: true

        },

        variables: {

            type: DataTypes.TEXT,

            allowNull: true

        },

        activo: {

            type: DataTypes.BOOLEAN,

            allowNull: false,

            defaultValue: true

        }

    },

    {

        tableName: "notification_template",

        timestamps: true,

        underscored: true

    }

);

export default NotificationTemplate;