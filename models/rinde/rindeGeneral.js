// models/rindeGeneralModel.js
import { DataTypes } from "sequelize";
import { sequelize } from "../../config/database.js";

const RindeGeneral = sequelize.define(
  "RindeGeneral",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    mes: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    anio: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    cantidadMedias: DataTypes.INTEGER,
    totalKg: DataTypes.DECIMAL(12, 2),
    mbcerdo: DataTypes.DECIMAL(12, 2),
    costoprom: DataTypes.DECIMAL(12, 2),
    mgtotal: DataTypes.DECIMAL(12, 2),
    mgporkg: DataTypes.DECIMAL(12, 2),
    totalventa: DataTypes.DECIMAL(12, 2),
    gastos: DataTypes.DECIMAL(12, 2),
    cajagrande: DataTypes.DECIMAL(12, 2),
    otros: DataTypes.DECIMAL(12, 2),
    costovacuno: DataTypes.DECIMAL(12, 2),
    achuras: DataTypes.DECIMAL(12, 2),
    difInventario: DataTypes.DECIMAL(12, 2),
    costoporcino: DataTypes.DECIMAL(12, 2),
    totalKgCerdo: DataTypes.DECIMAL(12, 2),
    totalKgNovillo: DataTypes.DECIMAL(12, 2),
    totalKgVaca: DataTypes.DECIMAL(12, 2),
    novillosIngresos: DataTypes.DECIMAL(12, 2),
    exportacionIngresos: DataTypes.DECIMAL(12, 2),
    cerdosIngresos: DataTypes.DECIMAL(12, 2),
    ingEsperado: DataTypes.DECIMAL(12, 2),
    ingVendido: DataTypes.DECIMAL(12, 2),
    difEsperado: DataTypes.DECIMAL(12, 2),
    difVendido: DataTypes.DECIMAL(12, 2),
    rinde: DataTypes.DECIMAL(12, 4),
    valorRinde: DataTypes.DECIMAL(12, 2),
    eficiencia: DataTypes.DECIMAL(12, 2),
  },
  {
    freezeTableName: true,
    timestamps: true,
  }
);

export default RindeGeneral;
