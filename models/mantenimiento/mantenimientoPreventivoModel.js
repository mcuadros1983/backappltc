// models/MantenimientoPreventivo.js
import { DataTypes } from 'sequelize';
import {sequelize} from '../../config/database.js';
import Sucursal from '../gmedias/sucursalModel.js';
import Equipo from './equipoModel.js';

const MantenimientoPreventivo = sequelize.define('MantenimientoPreventivo', {
  detalle: { type: DataTypes.TEXT, allowNull: false },
  fecha: { type: DataTypes.DATEONLY, allowNull: false },
  estado: { type: DataTypes.BOOLEAN, defaultValue: false },
},{
  timestamps: false, // Evita la creación automática de las columnas 'createdAt' y 'updatedAt'
  freezeTableName: true, // Evita que Sequelize pluralice el nombre de la tabla
});

MantenimientoPreventivo.belongsTo(Sucursal, { foreignKey: 'sucursal_id' });
MantenimientoPreventivo.belongsTo(Equipo, { foreignKey: 'equipo_id' });

export default MantenimientoPreventivo;
