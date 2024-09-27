
import { DataTypes } from 'sequelize';
import {sequelize} from '../../config/database.js';
import Equipo from './equipoModel.js';
import Usuario from '../auth/usuarioModel.js';
import OrdenMantenimiento from './ordenMantenimientoModel.js';
import MantenimientoPreventivo from './mantenimientoPreventivoModel.js';
// import Sucursal from './sucursalModel.js'; // Importa el modelo de Sucursal si existe

const Mantenimiento = sequelize.define('Mantenimiento', {
  fecha_inicio: { type: DataTypes.DATEONLY, allowNull: false },
  fecha_fin: { type: DataTypes.DATEONLY },
  detalle: { type: DataTypes.TEXT, allowNull: false },
  observaciones: { type: DataTypes.TEXT },
  conforme: { type: DataTypes.BOOLEAN, defaultValue: true },
  nombre_firmante: { type: DataTypes.TEXT, allowNull: true },
  terminado: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false }, // Nuevo campo
  sucursal_id: { type: DataTypes.INTEGER, allowNull: false }, // Nuevo campo agregado
}, {
  timestamps: false, // Evita la creación automática de las columnas 'createdAt' y 'updatedAt'
  freezeTableName: true, // Evita que Sequelize pluralice el nombre de la tabla
});

// Relaciones
Mantenimiento.belongsTo(Equipo, { foreignKey: 'equipo_id' });
Mantenimiento.belongsTo(Usuario, { as: 'tecnico', foreignKey: 'tecnico_id', allowNull: true });
Mantenimiento.belongsTo(Usuario, { as: 'firmante', foreignKey: 'firmante_id', allowNull: true });

// Relaciones opcionales con OrdenMantenimiento y MantenimientoPreventivo
Mantenimiento.belongsTo(OrdenMantenimiento, { foreignKey: 'orden_mantenimiento_id', allowNull: true });
Mantenimiento.belongsTo(MantenimientoPreventivo, { foreignKey: 'mantenimiento_preventivo_id', allowNull: true });

// Relación con Sucursal (si es necesario)
// Mantenimiento.belongsTo(Sucursal, { foreignKey: 'sucursal_id' });

export default Mantenimiento;
