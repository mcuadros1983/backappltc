// models/ItemEquipo.js
import { DataTypes } from 'sequelize';
import { sequelize } from '../../config/database.js';
import Equipo from './equipoModel.js';

const ItemEquipo = sequelize.define('ItemEquipo', {
  nombre: { type: DataTypes.STRING, allowNull: false },
  descripcion: { type: DataTypes.TEXT, allowNull: true },
  estado: {
    type: DataTypes.ENUM('Bueno', 'Regular', 'Malo', ''), // Agregar '' como opción para permitir vacío
    allowNull: true,
    defaultValue: null, // Asegura que el valor por defecto sea nulo si no se especifica
  },
}, {
  timestamps: false,
  freezeTableName: true,
});

// Relación con el modelo Equipo
// ItemEquipo.belongsTo(Equipo, { foreignKey: 'equipo_id', allowNull: false });

export default ItemEquipo;