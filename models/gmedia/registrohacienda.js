import { DataTypes } from "sequelize";
import { sequelize } from "../../config/database.js"; 

const RegistroHacienda = sequelize.define(
  "RegistroHacienda",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },

    // FK al header:
    hacienda_id: { type: DataTypes.INTEGER, allowNull: false },
    fecha: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    categoriaanimal_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    cantidadanimales: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    pesoneto: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
    },
    preciokgvivo: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
    },
    importeneto: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
    },
    flete: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: true,
    },
    comsion: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: true,
    },
    viaticos: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: true,
    },
    imptoalcheque: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: true,
    },
    gastosfaena: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: true,
    },
    montototal: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
    },
    kgsromaneo: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
    },
    preciokgcarne: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
    },
    rendimiento: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: true,
    },
    tropa: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    proveedor_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    frigorifico_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    empresa_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    cantidadmedias: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    anulado: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
  },
  {
    timestamps: false,
    freezeTableName: true,
  }
);

export default RegistroHacienda;
