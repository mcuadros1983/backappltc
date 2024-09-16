import { DataTypes } from 'sequelize';
import {sequelize} from '../../config/database.js';
import Sucursal from '../gmedias/sucursalModel.js';
import Equipo from './equipoModel.js';
import Usuario from '../auth/usuarioModel.js';

const OrdenMantenimiento = sequelize.define('OrdenMantenimiento', {
  detalle_trabajo: { type: DataTypes.TEXT, allowNull: false },
  prioridad: { type: DataTypes.STRING, allowNull: false },
  fecha_estimacion: { type: DataTypes.DATEONLY },
  estado: { type: DataTypes.BOOLEAN, defaultValue: false },
  nombre_solicitante: { type: DataTypes.STRING, allowNull: true }, // Nuevo campo agregado
},{
  timestamps: false, // Evita la creación automática de las columnas 'createdAt' y 'updatedAt'
  freezeTableName: true, // Evita que Sequelize pluralice el nombre de la tabla
});

OrdenMantenimiento.belongsTo(Usuario, { foreignKey: 'usuario_id', allowNull: true });
OrdenMantenimiento.belongsTo(Sucursal, { foreignKey: 'sucursal_id', allowNull: true });
OrdenMantenimiento.belongsTo(Equipo, { foreignKey: 'equipo_id', allowNull: true });

export default OrdenMantenimiento;