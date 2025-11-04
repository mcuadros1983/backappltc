import { DataTypes } from "sequelize";
import { sequelize } from "../../config/database.js";

const Agenda = sequelize.define(
    "Agenda",
    {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },

        // Identificación breve
        titulo: { type: DataTypes.STRING, allowNull: false },

        // Detalle largo
        descripcion: { type: DataTypes.TEXT, allowNull: true },

        // Fechas base
        fecha: { type: DataTypes.DATEONLY, allowNull: false },              // fecha de inicio / creación del compromiso
        fecha_vencimiento: { type: DataTypes.DATEONLY, allowNull: true },   // fecha límite (si aplica)

        // Priorización e estado
        importancia: {
            type: DataTypes.ENUM("baja", "media", "alta", "critica"),
            allowNull: false,
            defaultValue: "media",
        },
        realizado: {
            // estado de cumplimiento
            type: DataTypes.ENUM("pendiente", "parcial", "realizado", "postergado"),
            allowNull: false,
            defaultValue: "pendiente",
        },

        // Costos (cuando aplique)
        costo: { type: DataTypes.DECIMAL(12, 2), allowNull: true },

        // Recurrencia sencilla
        periodicidad: {
            type: DataTypes.ENUM("unica", "diaria", "semanal", "mensual", "anual"),
            allowNull: false,
            defaultValue: "unica",
        },
        repetir_cada: { type: DataTypes.INTEGER, allowNull: true, defaultValue: 1 }, // p.ej. cada 2 semanas
        repetir_hasta: { type: DataTypes.DATEONLY, allowNull: true },                 // fin de recurrencia

        // Recordatorio simple
        recordatorio_dias_antes: { type: DataTypes.INTEGER, allowNull: true },        // p.ej. 7 = avisar 7 días antes

        // Relaciones opcionales
        sucursal_id: { type: DataTypes.INTEGER, allowNull: true },
        empresa_id: { type: DataTypes.INTEGER, allowNull: true },
        usuario_responsable_id: { type: DataTypes.INTEGER, allowNull: true },

        // Misceláneos
        observaciones: { type: DataTypes.TEXT, allowNull: true },
        anulado: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
        dia_vencimiento: {
            type: DataTypes.INTEGER,
            allowNull: true,            // null = no aplica
            validate: {
                min: 1,
                max: 31,                  // número de día dentro del mes
            },
        },
    },


    {
        timestamps: false,
        freezeTableName: true,
        indexes: [
            { fields: ["empresa_id"] },
            { fields: ["sucursal_id"] },
            { fields: ["usuario_responsable_id"] },
            { fields: ["fecha_vencimiento"] },
            { fields: ["realizado"] },
            { fields: ["importancia"] },
        ],
    }
);

export default Agenda;
