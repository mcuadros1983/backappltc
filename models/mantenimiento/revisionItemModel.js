import { DataTypes } from 'sequelize';
import { sequelize } from '../../config/database.js';
import ItemEquipo from './itemEquipoModel.js';
import Mantenimiento from './mantenimientoModel.js'; // Importar el modelo de Mantenimiento

const RevisionItem = sequelize.define(
  'RevisionItem',
  {
    fecha_revision: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    estado: {
      type: DataTypes.ENUM('Bueno', 'Regular', 'Malo'),
      allowNull: true,
      // defaultValue: 'Bueno',
    },
    comentarios: { type: DataTypes.TEXT, allowNull: true },
    mantenimiento_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: Mantenimiento,
        key: 'id',
      },
    },
    item_equipo_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: ItemEquipo,
        key: 'id',
      },
    },
  },
  {
    timestamps: false,
    freezeTableName: true,
  }
);

// Relación con el modelo ItemEquipo
RevisionItem.belongsTo(ItemEquipo, { foreignKey: 'item_equipo_id', allowNull: false });

// Relación con el modelo Mantenimiento
RevisionItem.belongsTo(Mantenimiento, { foreignKey: 'mantenimiento_id', allowNull: false });

export default RevisionItem;
