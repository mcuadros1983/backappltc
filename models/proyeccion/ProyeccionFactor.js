// server/models/ProyeccionFactor.js
import { DataTypes } from "sequelize";
import { sequelize } from "../../config/database.js";

const ProyeccionFactor = sequelize.define(
  "ProyeccionFactor",
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },

    nombre: {
      type: DataTypes.STRING,
      allowNull: false,
    },

    descripcion: {
      type: DataTypes.TEXT,
      allowNull: true,
    },

    // ej: aplicar del día 5 al 10 del mes
    dia_inicio_mes: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    dia_fin_mes: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },

    // ej: [5,6] = sábado/domingo, [0,1] = lunes/martes
    dias_semana: {
      type: DataTypes.ARRAY(DataTypes.INTEGER),
      allowNull: true,
    },

    // multiplicador que se aplica: 1.3 => +30%, 0.7 => -30%
    factor_multiplicador: {
      type: DataTypes.DECIMAL(10, 4),
      allowNull: false,
      defaultValue: 1.0,
    },

    // si querés que aplique solo a una sucursal específica
    sucursal_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },

    activo: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
  },
  {
    tableName: "proyeccion_factores",
    timestamps: true,
  }
);

export default ProyeccionFactor;
