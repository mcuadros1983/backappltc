import { DataTypes } from 'sequelize';
import { sequelize } from '../../config/database.js';

const FormulaArticulo = sequelize.define(
  'formulaarticulo',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    articulo_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    codigobarra: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    cantidad: {
      type: DataTypes.DECIMAL(12, 3),
      allowNull: true,
    },
    descripcion: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
  },
  {
    timestamps: false, // Evita la creación automática de las columnas 'createdAt' y 'updatedAt'
    freezeTableName: true, // Evita que Sequelize pluralice el nombre de la tabla
  }
);

export default FormulaArticulo;
