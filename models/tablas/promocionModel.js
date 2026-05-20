import { DataTypes } from "sequelize";
import {sequelize} from "../../config/database.js";

const PromocionTabla = sequelize.define(
  "PromocionTabla",
  {
    id: {
      type: DataTypes.BIGINT,
      primaryKey: true,
      autoIncrement: true,
    },
    descripcion: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    tipo_promocion: {
      type: DataTypes.STRING(30),
      allowNull: false,
      // "precio_fijo" | "porcentaje"
    },
    fecha_desde: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    fecha_hasta: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    aplica_todos: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    activa: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    prioridad: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
  },
  {
    tableName: "promociones",
    timestamps: true,
  }
);

export default PromocionTabla;