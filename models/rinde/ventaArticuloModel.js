import { DataTypes } from 'sequelize';
import { sequelize } from '../../config/database.js'; // Importa la conexión a la base de datos

const VentaArticulo = sequelize.define('VentaArticulo', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  ventaarticuloId: {
    type: DataTypes.BIGINT,
    allowNull: true,
  },
  fecha: {
    type: DataTypes.DATEONLY,
    defaultValue: sequelize.literal('CURRENT_DATE') // Establece la fecha actual por defecto
  },
  sucursal_id: {
    type: DataTypes.BIGINT
  },
  articuloCodigo: {
    type: DataTypes.STRING
  },
  articuloDescripcion: {
    type: DataTypes.STRING
  },
  cantidad: {
    type: DataTypes.DECIMAL(12, 3)
  },
  monto_lista: {
    type: DataTypes.NUMERIC(12, 3)
  }
},
  {
    timestamps: false, // Evita la creación automática de las columnas 'createdAt' y 'updatedAt'
    freezeTableName: true, // Evita que Sequelize pluralice el nombre de la tabla
  });

export default VentaArticulo;
