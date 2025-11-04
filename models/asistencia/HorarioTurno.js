import { DataTypes } from "sequelize";
import { sequelize } from "../../config/database.js";

/**
 * Equivalente JS del modelo Django ShiftSchedule:
 * - am_start_time  → inicio_am  (TIME, nullable)
 * - am_end_time    → fin_am     (TIME, nullable)
 * - pm_start_time  → inicio_pm  (TIME, nullable)
 * - pm_end_time    → fin_pm     (TIME, nullable)
 */
const HorarioTurno = sequelize.define("HorarioTurno", {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true, // Django también crea un id autoincremental por defecto
  },

  // Horario de la mañana
  inicio_am: {
    type: DataTypes.TIME,
    allowNull: true,
  },
  fin_am: {
    type: DataTypes.TIME,
    allowNull: true,
  },

  // Horario de la tarde
  inicio_pm: {
    type: DataTypes.TIME,
    allowNull: true,
  },
  fin_pm: {
    type: DataTypes.TIME,
    allowNull: true,
  },
}, {
  tableName: "horarioturno",
  freezeTableName: true,
  timestamps: false,
});

export default HorarioTurno;
