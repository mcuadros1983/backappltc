import { DataTypes } from "sequelize";
import { sequelize } from "../../config/database.js";

const DomicilioTabla = sequelize.define(
    "DomicilioTabla",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        allowNull: false,
        autoIncrement: false, // Desactiva la auto-generación del id
      },
      barrio: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      dpto: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      entrecalles: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      numero: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      piso: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      referencia: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      localidad_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
    },
    {
      timestamps: false,
      freezeTableName: true,
    }
  );

export default DomicilioTabla;
