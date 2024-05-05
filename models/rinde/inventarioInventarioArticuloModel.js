import { DataTypes } from "sequelize";
import { sequelize } from "../../config/database.js";
import Inventario from "./inventarioModel.js";
import InventarioArticulo from "./inventarioArticuloModel.js";

const InventarioInventarioArticulo = sequelize.define(
  "Inventario_inventario_articulo",
  {
    inventario_id: {
      type: DataTypes.BIGINT,
      primaryKey: true,
    },
    ventasarticulos_id: {
      type: DataTypes.BIGINT,
      primaryKey: true,
    },
  },
  {
    timestamps: false,
    freezeTableName: true,
  }
);

// InventarioInventarioArticulo.belongsTo(Inventario, {
//   foreignKey: "inventario_id",
// });

// InventarioInventarioArticulo.belongsTo(InventarioArticulo, {
//   foreignKey: "ventasarticulos_id",
// });

Inventario.belongsToMany(InventarioArticulo, { 
  through: InventarioInventarioArticulo,
  foreignKey: 'inventario_id',
  otherKey: 'ventasarticulos_id',
});

InventarioArticulo.belongsToMany(Inventario, { 
  through: InventarioInventarioArticulo,
  foreignKey: 'ventasarticulos_id',
  otherKey: 'inventario_id',
});

export default InventarioInventarioArticulo;
