import { DataTypes } from "sequelize";
import { sequelize } from "../../config/database.js";
import Sucursal from "../gmedias/sucursalModel.js";

const BotEventMeta = sequelize.define(
    "BotEventMeta",
    {
        id: {
            type: DataTypes.BIGINT,
            autoIncrement: true,
            primaryKey: true,
        },

        tipo_evento: {
            type: DataTypes.STRING(80),
            allowNull: false,
        },

        titulo: {
            type: DataTypes.STRING(180),
            allowNull: false,
        },

        descripcion: {
            type: DataTypes.TEXT,
            allowNull: true,
        },

        fecha_inicio: {
            type: DataTypes.DATEONLY,
            allowNull: false,
        },

        fecha_fin: {
            type: DataTypes.DATEONLY,
            allowNull: true,
        },

        hora_inicio: {
            type: DataTypes.STRING(20),
            allowNull: true,
        },

        hora_fin: {
            type: DataTypes.STRING(20),
            allowNull: true,
        },

        sucursal_id: {
            type: DataTypes.BIGINT,
            allowNull: true,
        },

        aplica_todas_sucursales: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: true,
        },

        condiciones: {
            type: DataTypes.TEXT,
            allowNull: true,
        },

        mensaje_bot: {
            type: DataTypes.TEXT,
            allowNull: true,
        },

        aliases: {
            type: DataTypes.JSONB,
            allowNull: false,
            defaultValue: [],
        },

        activo_bot: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: true,
        },

        prioridad: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
        },
        impacto: {
            type: DataTypes.STRING(40), // "cerrado", "horario_reducido", "normal"
        }
    },
    {
        tableName: "BotEventMeta",
        timestamps: true,
    }
);

BotEventMeta.belongsTo(Sucursal, {
    foreignKey: "sucursal_id",
    as: "sucursal",
});

Sucursal.hasMany(BotEventMeta, {
    foreignKey: "sucursal_id",
    as: "bot_events",
});

export default BotEventMeta;