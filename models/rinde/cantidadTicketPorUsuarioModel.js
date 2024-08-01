import { DataTypes } from 'sequelize';
import { sequelize } from '../../config/database.js'; // Importa la conexión a la base de datos

const CantidadTicketPorUsuario = sequelize.define('CantidadPorUsuario', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  fecha: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  sucursal_id: {
    type: DataTypes.BIGINT,
    allowNull: false
  },
  total_monto: {
    type: DataTypes.NUMERIC(12, 3),
    allowNull: false
  },
  usuario_id: {
    type: DataTypes.BIGINT,
    allowNull: false
  },
  cantidad: {
    type: DataTypes.INTEGER,
    allowNull: false
  }
}, {
  timestamps: false, // Evita la creación automática de las columnas 'createdAt' y 'updatedAt'
  freezeTableName: true // Evita que Sequelize pluralice el nombre de la tabla
});

export default CantidadTicketPorUsuario;
