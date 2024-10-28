import { DataTypes } from "sequelize";
import { sequelize } from "../../config/database.js";

// Definición del modelo de Schedule
const Schedule = sequelize.define(
  "Schedule",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    hour: {
      type: DataTypes.INTEGER, // Almacena la hora en formato de 24 horas (0-23)
      allowNull: false,
      validate: {
        min: 0,
        max: 23,
      },
    },
    minute: {
      type: DataTypes.INTEGER, // Almacena los minutos (0-59)
      allowNull: false,
      validate: {
        min: 0,
        max: 59,
      },
    },
  },
  {
    timestamps: true, // Incluye campos createdAt y updatedAt
    freezeTableName: true, // Evita que Sequelize pluralice el nombre de la tabla
  }
);

export default Schedule;
