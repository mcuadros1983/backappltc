// server/models/ProyeccionFeriado.js
import { DataTypes } from "sequelize";
import { sequelize } from "../../config/database.js";

const ProyeccionFeriado = sequelize.define(
  "ProyeccionFeriado",
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },

    fecha: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },

    descripcion: {
      type: DataTypes.STRING,
      allowNull: true,
    },

    factor_multiplicador: {
      type: DataTypes.DECIMAL(10, 4),
      allowNull: false,
      defaultValue: 1.0,
    },

    sucursal_id: {
      type: DataTypes.INTEGER,
      allowNull: true, // null = aplica a todas
    },

    activo: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
  },
  {
    tableName: "proyeccion_feriados",
    timestamps: true,
  }
);

export default ProyeccionFeriado;
