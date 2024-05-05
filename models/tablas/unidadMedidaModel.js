import { DataTypes } from "sequelize";
import { sequelize } from "../../config/database.js";

const UnidadMedidaTabla = sequelize.define(
  "UnidadmedidaTabla",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      allowNull: false,
      autoIncrement: false, // Desactiva la auto-generación del id
    },
    descripcion: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    espeso: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
    },
    medida: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
  },
  {
    timestamps: false,
    freezeTableName: true,
  }
);
export default UnidadMedidaTabla;
