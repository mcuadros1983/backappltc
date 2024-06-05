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
    codigo: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    nombre: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    domicilio_id: {
      type: DataTypes.BIGINT,
    },
  },
  {
    timestamps: false,
    freezeTableName: true,
  }
);

export default DomicilioTabla;
