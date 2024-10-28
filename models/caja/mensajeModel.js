import { DataTypes } from "sequelize";
import { sequelize } from "../../config/database.js";

// Definición del modelo de Mensaje
const Mensaje = sequelize.define(
  "Mensaje",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    text: {
      type: DataTypes.STRING(500), // Puedes ajustar el tamaño según lo necesites
      allowNull: false,
    },
    scheduleTime: {
      type: DataTypes.DATE, // Utilizamos el tipo DATE para almacenar fecha y hora exacta
      allowNull: false,
    },
  },
  {
    timestamps: true, // Guarda la fecha de creación y de última actualización
    freezeTableName: true, // Mantiene el nombre de la tabla sin pluralizar
  }
);

export default Mensaje;
