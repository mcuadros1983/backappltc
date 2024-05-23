import { DataTypes } from "sequelize";
import { sequelize } from "../../config/database.js";

// Definir el modelo Rinde
const Rinde = sequelize.define(
  "Rinde",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    fechaDesde: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    fechaHasta: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    mes: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    anio: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    sucursal_id: {
      type: DataTypes.BIGINT,
      allowNull: false,
    },
    totalVentas: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
    },
    totalMovimientos: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
    },
    totalInventarioInicial: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
    },
    totalInventarioFinal: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
    },
    ingresoEsperadoNovillo: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
    },
    ingresoEsperadoVaca: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
    },
    ingresoEsperadoCerdo: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
    },
    totalKgNovillo: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
    },
    totalKgVaca: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
    },
    totalKgCerdo: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
    },
    rinde: {
      type: DataTypes.DECIMAL(10, 2), // Dos decimales para el porcentaje
      allowNull: false,
    },
  },
  {
    // Opciones del modelo
    freezeTableName: true,
    timestamps: true, // Para añadir los campos createdAt y updatedAt automáticamente
  }
);

export default Rinde;
