// models/ItemRevision.js
import { DataTypes } from 'sequelize';
import { sequelize } from '../../config/database.js';
import ItemEquipo from './itemEquipoModel.js';
import RevisionItem from './revisionItemModel.js';

const ItemRevision = sequelize.define('ItemRevision', {
  item_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    primaryKey: true,
  },
  revision_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    primaryKey: true,
  },
}, {
  timestamps: false,
  freezeTableName: true,
  tableName: 'ItemRevision',
});

// Establecer las relaciones con ItemEquipo y RevisionItem
ItemEquipo.belongsToMany(RevisionItem, {
  through: ItemRevision,
  foreignKey: 'item_id',
  otherKey: 'revision_id',
});

RevisionItem.belongsToMany(ItemEquipo, {
  through: ItemRevision,
  foreignKey: 'revision_id',
  otherKey: 'item_id',
});

export default ItemRevision;
