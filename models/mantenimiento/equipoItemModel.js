// // models/EquipoItem.js
// import { DataTypes } from 'sequelize';
// import { sequelize } from '../../config/database.js';
// import Equipo from './equipoModel.js';
// import ItemEquipo from './itemEquipoModel.js';

// const EquipoItem = sequelize.define('EquipoItem', {
//   equipo_id: {
//     type: DataTypes.INTEGER,
//     allowNull: false,
//     primaryKey: true,
//   },
//   item_id: {
//     type: DataTypes.INTEGER,
//     allowNull: false,
//     primaryKey: true,
//   },
// }, {
//   tableName: 'equipo_item', // Nombre de la tabla en la base de datos
//   timestamps: false,
//   freezeTableName: true,
// });

// // Relacionar Equipo e ItemEquipo a través de la tabla intermedia EquipoItem
// Equipo.belongsToMany(ItemEquipo, {
//   through: EquipoItem,
//   foreignKey: 'equipo_id',
//   otherKey: 'item_id',
// });

// ItemEquipo.belongsToMany(Equipo, {
//   through: EquipoItem,
//   foreignKey: 'item_id',
//   otherKey: 'equipo_id',
// });

// export default EquipoItem;

import { DataTypes } from 'sequelize';
import { sequelize } from '../../config/database.js';
import Equipo from './equipoModel.js';
import ItemEquipo from './itemEquipoModel.js';

const EquipoItem = sequelize.define('EquipoItem', {
  equipo_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: Equipo,
      key: 'id',
    },
  },
  item_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: ItemEquipo,
      key: 'id',
    },
  },
}, {
  timestamps: false,
  freezeTableName: true,
});

// Establecer las relaciones many-to-many a través de la tabla intermedia
Equipo.belongsToMany(ItemEquipo, {
  through: EquipoItem,
  foreignKey: 'equipo_id',
  otherKey: 'item_id',
});

ItemEquipo.belongsToMany(Equipo, {
  through: EquipoItem,
  foreignKey: 'item_id',
  otherKey: 'equipo_id',
});

export default EquipoItem;
