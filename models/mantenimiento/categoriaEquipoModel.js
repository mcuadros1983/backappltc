// models/CategoriaEquipo.js
import { DataTypes } from 'sequelize';
import {sequelize} from '../../config/database.js';

const CategoriaEquipo = sequelize.define('CategoriaEquipo', {
  nombre: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,  // Asegura que no haya categorías con el mismo nombre
  },
},
{
  timestamps: false, // Evita la creación automática de las columnas 'createdAt' y 'updatedAt'
  freezeTableName: true, // Evita que Sequelize pluralice el nombre de la tabla
});

export default CategoriaEquipo;