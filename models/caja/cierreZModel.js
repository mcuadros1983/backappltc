// models/CierreZ.js
import { DataTypes } from "sequelize";
import { sequelize } from "../../config/database.js";

const CierreZ = sequelize.define(
  "CierreZ",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    cuit: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    puntoVenta: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    numeroZeta: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    fechaJornada: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    primerComprobante: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    ultimoComprobante: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    cantidadEmitidos: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    cantidadCancelados: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    iva105: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
    },
    iva21: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
    },
    neto: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
    },
    ivaTotal: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
    },
    total: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
    },
  },
  {
    tableName: "CierreZ",
    timestamps: false,
    freezeTableName: true,
  }
);

export default CierreZ;
