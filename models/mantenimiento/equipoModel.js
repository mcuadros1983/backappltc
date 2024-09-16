// models/Equipo.js
import { DataTypes } from 'sequelize';
import {sequelize} from '../../config/database.js';
import Sucursal from '../gmedias/sucursalModel.js';
import CategoriaEquipo from './categoriaEquipoModel.js';

const Equipo = sequelize.define('Equipo', {
  nombre: { type: DataTypes.STRING, allowNull: false },
  marca: { type: DataTypes.STRING, allowNull: false },
  numero_serie: { type: DataTypes.STRING, allowNull: false },
  fecha_compra: { type: DataTypes.DATEONLY, allowNull: false },
  ultimo_mantenimiento: { type: DataTypes.DATE },
},{
  timestamps: false, // Evita la creación automática de las columnas 'createdAt' y 'updatedAt'
  freezeTableName: true, // Evita que Sequelize pluralice el nombre de la tabla
});

// Relaciones
Equipo.belongsTo(Sucursal, { foreignKey: 'sucursal_id' });
Equipo.belongsTo(CategoriaEquipo, { foreignKey: 'categoria_equipo_id', allowNull: false });

export default Equipo;